/* ─── Module 3A: Planning Agent ────────────────────────────────────────────
   Duration-aware, energy-conscious genius scheduler. Assigns activities to
   time slots based on:
   - Duration categories (full_day, half_day, 2-4h, 1-2h, under_1h)
   - Nap schedules and sleep times
   - Energy levels (alternates high/low to avoid exhaustion)
   - Morning = high energy window, afternoon = lower energy preferred
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
 * Sort activities into an energy-balanced order for a day.
 * Strategy:
 * - Full-day and half-day activities keep their natural order (they dominate a window)
 * - For shorter activities: alternate high→low energy to avoid burnout
 * - Morning windows prefer high-energy; post-nap windows prefer low-energy
 */
function energyBalancedSort(activities) {
  const fullDay = activities.filter(a => a.duration_category === "full_day");
  const halfDay = activities.filter(a => a.duration_category === "half_day");
  const shorter = activities.filter(a => !["full_day", "half_day"].includes(a.duration_category));

  // Sort shorter activities: longest first within each energy tier
  const high = shorter.filter(a => energyLevel(a) === "high").sort((a, b) => activityDuration(b) - activityDuration(a));
  const med = shorter.filter(a => energyLevel(a) === "med").sort((a, b) => activityDuration(b) - activityDuration(a));
  const low = shorter.filter(a => energyLevel(a) === "low").sort((a, b) => activityDuration(b) - activityDuration(a));

  // Interleave: high, low, med, high, low, med...
  // This creates natural energy waves throughout the day
  const interleaved = [];
  const buckets = [high, low, med];
  let bi = 0;
  while (buckets.some(b => b.length > 0)) {
    const bucket = buckets[bi % buckets.length];
    if (bucket.length > 0) {
      interleaved.push(bucket.shift());
    }
    bi++;
  }

  // Full-day first (they own the day), then half-day, then interleaved shorter
  return [...fullDay, ...halfDay, ...interleaved];
}

/**
 * Determine if a time window is a "morning" window (before noon-ish).
 * Morning windows are better suited for high-energy activities.
 */
function isMorningWindow(windowStart) {
  return windowStart < 720; // before 12:00 PM
}

/**
 * Pick the best activity from the pool for a given window.
 * Considers energy level relative to time of day.
 */
function pickBestActivity(pool, avail, windowStart) {
  if (pool.length === 0) return -1;

  const morning = isMorningWindow(windowStart);

  // Score each candidate
  let bestIdx = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < pool.length; i++) {
    const act = pool[i];
    const needed = activityDuration(act);

    // Must fit (with some grace period)
    if (needed > avail + 60) continue;
    if (act.duration_category === "full_day" && avail < 300) continue;

    let score = 0;

    // Prefer activities that fit well (penalize very short activities in long windows)
    const fitRatio = Math.min(needed, avail) / avail;
    score += fitRatio * 10;

    // Energy-time alignment bonus
    const energy = energyLevel(act);
    if (morning && energy === "high") score += 5;   // high energy in the morning = great
    if (morning && energy === "low") score -= 2;     // low energy morning = ok but not ideal
    if (!morning && energy === "low") score += 4;    // low energy afternoon = perfect
    if (!morning && energy === "high") score -= 3;   // high energy late = tiring

    // Prefer longer activities slightly (fill schedule efficiently)
    score += needed / 60;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * Generate a day-by-day itinerary from a profile and selected activities.
 * Uses energy-aware scheduling: high-energy mornings, low-energy afternoons,
 * with alternating intensity to avoid burnout.
 *
 * @param {Object} profile - Family profile with wake_time, bed_time, naps, start_date, trip_length_days
 * @param {Array} selectedActivities - Activities to schedule
 * @returns {Object} { profile: string, destination: string, days: Array }
 */
export function generateItinerary(profile, selectedActivities) {
  const wake = timeToMins(profile.wake_time);
  const bed = timeToMins(profile.bed_time);
  const naps = profile.naps
    .map(n => ({ start: timeToMins(n.start), end: timeToMins(n.start) + n.duration }))
    .sort((a, b) => a.start - b.start);

  function getWindows() {
    const w = [];
    let cur = wake;
    for (const nap of naps) {
      if (nap.start > cur + 45) w.push({ start: cur, end: nap.start, type: "free" });
      w.push({ start: nap.start, end: nap.end, type: "nap" });
      cur = nap.end + 15;
    }
    const dinnerStart = bed - 90;
    if (dinnerStart > cur + 45) w.push({ start: cur, end: dinnerStart, type: "free" });
    w.push({ start: dinnerStart, end: bed, type: "dinner" });
    return w;
  }

  // Energy-balanced sort before scheduling
  const pool = energyBalancedSort([...selectedActivities]);
  const windows = getWindows();
  const days = [];
  let poolIdx = 0;

  for (let d = 0; d < profile.trip_length_days; d++) {
    const date = addDays(profile.start_date, d);
    const slots = [];
    let dayConsumed = false;
    // Track last energy level placed in this day for alternation
    let lastEnergy = null;

    for (const w of windows) {
      if (w.type === "nap") {
        slots.push({ title: "Nap / Rest", start: minsToTime(w.start), duration_mins: w.end - w.start, type: "rest" });
        lastEnergy = null; // reset after nap — fresh start
        continue;
      }
      if (w.type === "dinner") {
        slots.push({ title: "Dinner / Wind Down", start: minsToTime(w.start), duration_mins: w.end - w.start, type: "rest" });
        continue;
      }
      if (dayConsumed) {
        slots.push({ title: "Free Time", start: minsToTime(w.start), duration_mins: w.end - w.start - 15, type: "rest" });
        continue;
      }

      const windowDuration = w.end - w.start - 15;
      if (windowDuration < 45) continue;

      // Check: full_day activity? Let it own the day
      const peek = pool[poolIdx];
      if (peek && peek.duration_category === "full_day" && windowDuration >= 300) {
        slots.push({
          title: peek.name, start: minsToTime(w.start), duration_mins: windowDuration,
          location: peek.location, type: peek.type, activityId: peek.id,
          hours: peek.hours, duration_category: peek.duration_category,
          energy: energyLevel(peek),
        });
        poolIdx++;
        dayConsumed = true;
        continue;
      }

      // Fill window with energy-aware activity selection
      let t = w.start;
      let avail = windowDuration;
      const remaining = pool.slice(poolIdx);

      while (avail >= 45 && poolIdx < pool.length) {
        // Use energy-aware picking for the current window position
        const candidatePool = pool.slice(poolIdx);
        const bestRelIdx = pickBestActivity(candidatePool, avail, t);

        if (bestRelIdx === -1) break;

        // Swap the best candidate to the current poolIdx position
        if (bestRelIdx > 0) {
          const temp = pool[poolIdx];
          pool[poolIdx] = pool[poolIdx + bestRelIdx];
          pool[poolIdx + bestRelIdx] = temp;
        }

        const act = pool[poolIdx];
        const needed = activityDuration(act);
        const used = Math.min(needed, avail);

        slots.push({
          title: act.name, start: minsToTime(t), duration_mins: used,
          location: act.location, type: act.type, activityId: act.id,
          hours: act.hours, duration_category: act.duration_category,
          energy: energyLevel(act),
        });

        lastEnergy = energyLevel(act);
        t += used + 15; // 15 min travel/buffer
        avail -= (used + 15);
        poolIdx++;

        if (["full_day", "half_day"].includes(act.duration_category)) break;
      }

      if (avail >= 45) {
        slots.push({ title: "Free Time", start: minsToTime(t), duration_mins: avail, type: "rest" });
      }
    }
    days.push({ day: d + 1, date, slots });
  }

  return {
    profile: profile.adults + " adults, " + profile.kids.length + " kids",
    destination: profile.destination,
    days,
  };
}
