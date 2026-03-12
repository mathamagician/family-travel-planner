/* ─── Module 3A: Planning Agent ────────────────────────────────────────────
   Duration-aware, energy-conscious scheduler. Assigns activities to
   time slots based on:
   - Duration categories (full_day, half_day, 2-4h, 1-2h, under_1h)
   - Nap schedules and sleep times
   - Energy levels with day-level patterns:
     • Default (medium trip): HIGH → LOW → HIGH → MED repeating
     • Low trip:  MED → LOW → MED → LOW
     • High trip: any 2 high days in a row (2 mediums in 1 day = high day)
     • Full-day activities own the entire day (wake to dinner)
   - Trip intensity meter: tracks consecutive high days, warns user
   ────────────────────────────────────────────────────────────────────────── */

import { CAT_MINS, ENERGY_BY_TYPE } from "../../shared/config";
import { timeToMins, minsToTime, addDays } from "../../shared/utils";

/**
 * Get the effective duration in minutes for an activity.
 */
export function activityDuration(act) {
  return CAT_MINS[act.duration_category] ?? act.duration_mins_typical ?? act.duration_mins ?? 90;
}

/**
 * Get energy level for an activity: "high", "med", or "low".
 */
function energyLevel(act) {
  return act.energy ?? ENERGY_BY_TYPE[act.type] ?? "med";
}

/**
 * Build the daily time windows from wake/bed/nap schedule.
 * Returns array of { start, end, type: "free"|"nap"|"dinner" }
 */
function buildWindows(wake, bed, naps) {
  const dinnerStart = bed - 90;
  const w = [];
  let cur = wake;
  for (const nap of naps) {
    if (nap.start > cur + 45) w.push({ start: cur, end: nap.start, type: "free" });
    w.push({ start: nap.start, end: nap.end, type: "nap" });
    cur = nap.end + 15;
  }
  if (dinnerStart > cur + 45) w.push({ start: cur, end: dinnerStart, type: "free" });
  w.push({ start: dinnerStart, end: bed, type: "dinner" });
  return w;
}

/**
 * Pick the best-fitting activity from a pool for the available time.
 * Returns the index, or -1 if nothing fits.
 */
function pickBestFit(pool, avail) {
  let bestIdx = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < pool.length; i++) {
    const needed = activityDuration(pool[i]);
    if (needed > avail + 30) continue; // doesn't fit (30min grace)

    // Score: prefer activities that fill the window well
    const fitRatio = Math.min(needed, avail) / Math.max(avail, 1);
    const score = fitRatio * 10 + needed / 60; // slight preference for longer
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Place an activity from a pool into slots at the given time.
 * Splices from the pool so it won't be reused.
 * Returns { used, act } or null if nothing placed.
 */
function placeFromPool(pool, avail, t, slots) {
  const idx = pickBestFit(pool, avail);
  if (idx === -1) return null;

  const act = pool.splice(idx, 1)[0];
  const needed = activityDuration(act);
  const used = Math.min(needed, avail);

  slots.push({
    title: act.name,
    start: minsToTime(t),
    duration_mins: used,
    location: act.location,
    type: act.type,
    activityId: act.id,
    hours: act.hours,
    duration_category: act.duration_category,
    energy: energyLevel(act),
    description: act.notes ?? null,
  });

  return { used, act };
}

/**
 * Default day pattern (medium intensity trip):
 *   HIGH → LOW → HIGH → MED  (repeating 4-day cycle)
 *
 * This gives a balanced trip: active day, rest day, active day, moderate day.
 */
const DEFAULT_PATTERN = ["high", "low", "high", "med"];

/**
 * Generate a day-by-day itinerary from a profile and selected activities.
 *
 * Scheduling strategy:
 * 1. Separate full-day activities (they own an entire day)
 * 2. Classify remaining by energy: high, med, low
 * 3. Follow 4-day cycle: HIGH → LOW → HIGH → MED
 * 4. HIGH day: 1 high activity + low fillers
 * 5. MED day: 1 medium activity + low fillers
 * 6. LOW day: only low/chill activities (no high or medium)
 * 7. Full-day activities count as HIGH days
 * 8. Leftover activities go to unscheduled sidebar
 *
 * @param {Object} profile - Family profile
 * @param {Array} selectedActivities - Activities to schedule
 * @returns {Object} { profile, destination, days, tripIntensity }
 */
export function generateItinerary(profile, selectedActivities) {
  const wake = timeToMins(profile.wake_time);
  const bed = timeToMins(profile.bed_time);
  const dinnerStart = bed - 90;
  const naps = profile.naps
    .map(n => ({ start: timeToMins(n.start), end: timeToMins(n.start) + n.duration }))
    .sort((a, b) => a.start - b.start);

  const windows = buildWindows(wake, bed, naps);
  const numDays = profile.trip_length_days;

  // ── Classify activities ──────────────────────────────────────────────────

  const fullDayPool = selectedActivities
    .filter(a => a.duration_category === "full_day")
    .sort((a, b) => activityDuration(b) - activityDuration(a));

  const rest = selectedActivities.filter(a => a.duration_category !== "full_day");

  const highPool = rest.filter(a => energyLevel(a) === "high")
    .sort((a, b) => activityDuration(b) - activityDuration(a));
  const medPool = rest.filter(a => energyLevel(a) === "med")
    .sort((a, b) => activityDuration(b) - activityDuration(a));
  const lowPool = rest.filter(a => energyLevel(a) === "low")
    .sort((a, b) => activityDuration(b) - activityDuration(a));

  // ── Plan day types ───────────────────────────────────────────────────────
  // 1. Reserve days for full-day activities (spaced on HIGH slots in pattern)
  // 2. Remaining days follow the 4-day cycle: HIGH → LOW → HIGH → MED

  const dayPlan = new Array(numDays).fill(null);

  // Place full-day activities on the HIGH slots in the pattern
  let fdIdx = 0;
  for (let d = 0; d < numDays && fdIdx < fullDayPool.length; d++) {
    if (DEFAULT_PATTERN[d % 4] === "high") {
      dayPlan[d] = { type: "full_day", activity: fullDayPool[fdIdx++] };
    }
  }
  // Overflow: place remaining full-day acts on any open day
  for (let d = 0; d < numDays && fdIdx < fullDayPool.length; d++) {
    if (!dayPlan[d]) {
      dayPlan[d] = { type: "full_day", activity: fullDayPool[fdIdx++] };
    }
  }

  // Fill remaining days using the 4-day pattern, but shift to account for
  // full-day placements (full_day = high, so the next slot stays on pattern)
  let patternIdx = 0;
  for (let d = 0; d < numDays; d++) {
    if (dayPlan[d]) {
      // Full-day is a HIGH day; advance pattern past it
      // Find where the next "high" is in pattern and sync
      while (DEFAULT_PATTERN[patternIdx % 4] !== "high" && patternIdx < d + 4) {
        patternIdx++;
      }
      patternIdx++; // consume this high slot
      continue;
    }
    dayPlan[d] = { type: DEFAULT_PATTERN[patternIdx % 4] };
    patternIdx++;
  }

  // ── Build each day ─────────────────────────────────────────────────────

  const days = [];

  for (let d = 0; d < numDays; d++) {
    const date = addDays(profile.start_date, d);
    const plan = dayPlan[d];
    const slots = [];
    let dayConsumed = false;
    let dayIntensity = "low";

    // Full-day activity: spans wake to dinner, nap blocks render on top
    if (plan.type === "full_day") {
      const act = plan.activity;
      slots.push({
        title: act.name,
        start: minsToTime(wake),
        duration_mins: dinnerStart - wake,
        location: act.location,
        type: act.type,
        activityId: act.id,
        hours: act.hours,
        duration_category: act.duration_category,
        energy: energyLevel(act),
        description: act.notes ?? null,
      });
      dayConsumed = true;
      dayIntensity = "high";
    }

    // Track whether main activity placed for non-full-day days
    let placedMain = false;

    for (const w of windows) {
      if (w.type === "nap") {
        slots.push({
          title: "Nap / Rest",
          start: minsToTime(w.start),
          duration_mins: w.end - w.start,
          type: "nap",
        });
        continue;
      }
      if (w.type === "dinner") {
        slots.push({
          title: "Dinner / Wind Down",
          start: minsToTime(w.start),
          duration_mins: w.end - w.start,
          type: "rest",
        });
        continue;
      }

      // Skip free windows if full-day activity owns the day
      if (dayConsumed) continue;

      const windowDuration = w.end - w.start - 15; // 15min buffer
      if (windowDuration < 45) continue;

      let t = w.start;
      let avail = windowDuration;

      // Place main activity (once per day)
      if (!placedMain) {
        if (plan.type === "high") {
          // Try high-energy activity first
          let result = placeFromPool(highPool, avail, t, slots);
          if (result) {
            placedMain = true;
            dayIntensity = "high";
            t += result.used + 15;
            avail -= (result.used + 15);
            if (result.act.duration_category === "half_day") {
              if (avail >= 45) {
                slots.push({ title: "Free Time", start: minsToTime(t), duration_mins: avail, type: "rest" });
              }
              continue;
            }
          }
          // Fallback: use medium if no high activities left
          if (!placedMain) {
            result = placeFromPool(medPool, avail, t, slots);
            if (result) {
              placedMain = true;
              dayIntensity = "medium";
              t += result.used + 15;
              avail -= (result.used + 15);
            }
          }
        } else if (plan.type === "med") {
          // MED day: place 1 medium activity
          const result = placeFromPool(medPool, avail, t, slots);
          if (result) {
            placedMain = true;
            dayIntensity = "medium";
            t += result.used + 15;
            avail -= (result.used + 15);
          }
        }
        // LOW day: no main activity — only low fillers below
      }

      // Fill remaining time with low-energy activities
      while (avail >= 45 && lowPool.length > 0) {
        const result = placeFromPool(lowPool, avail, t, slots);
        if (!result) break;
        t += result.used + 15;
        avail -= (result.used + 15);
      }

      // Remaining window becomes free time
      if (avail >= 45) {
        slots.push({ title: "Free Time", start: minsToTime(t), duration_mins: avail, type: "rest" });
      }
    }

    days.push({ day: d + 1, date, slots, intensity: dayIntensity });
  }

  // ── Trip intensity metrics ───────────────────────────────────────────────
  // Rules:
  //   High trip  = any 2 high days in a row (2 mediums in 1 day also = high)
  //   Medium trip = has high days but never 2 consecutive
  //   Low trip   = no high days (only medium and low)

  const highDayCount = days.filter(d => d.intensity === "high").length;
  const medDayCount = days.filter(d => d.intensity === "medium").length;
  let maxConsecutiveHigh = 0;
  let curConsecutive = 0;
  for (const d of days) {
    if (d.intensity === "high") {
      curConsecutive++;
      maxConsecutiveHigh = Math.max(maxConsecutiveHigh, curConsecutive);
    } else {
      curConsecutive = 0;
    }
  }

  let tripIntensity;
  if (maxConsecutiveHigh >= 2) {
    // Any 2 high days in a row = high intensity trip
    tripIntensity = { level: "high", label: "Intense" };
  } else if (highDayCount > 0) {
    // Has high days but never consecutive = medium intensity trip
    tripIntensity = { level: "medium", label: "Balanced" };
  } else {
    // No high days at all = low intensity trip
    tripIntensity = { level: "low", label: "Relaxed" };
  }

  tripIntensity.highDays = highDayCount;
  tripIntensity.medDays = medDayCount;
  tripIntensity.totalDays = numDays;
  tripIntensity.consecutiveHighDays = maxConsecutiveHigh;
  tripIntensity.warning = maxConsecutiveHigh >= 2
    ? `${maxConsecutiveHigh} high-energy days in a row — consider adding a rest day`
    : null;

  return {
    profile: profile.adults + " adults, " + profile.kids.length + " kids",
    destination: profile.destination,
    days,
    tripIntensity,
  };
}
