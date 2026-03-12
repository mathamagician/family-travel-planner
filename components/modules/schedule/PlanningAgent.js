/* ─── Module 3A: Planning Agent ────────────────────────────────────────────
   Duration-aware genius scheduler. Assigns activities to time slots based on:
   - Duration categories (full_day, half_day, 2-4h, 1-2h, under_1h)
   - Nap schedules and sleep times
   - Energy levels (greedy: longest activities first for best slots)
   ────────────────────────────────────────────────────────────────────────── */

import { CAT_MINS } from "../../shared/config";
import { timeToMins, minsToTime, addDays } from "../../shared/utils";

/**
 * Get the effective duration in minutes for an activity.
 */
export function activityDuration(act) {
  return CAT_MINS[act.duration_category] ?? act.duration_mins_typical ?? act.duration_mins ?? 90;
}

/**
 * Generate a day-by-day itinerary from a profile and selected activities.
 * Uses a greedy algorithm: longest activities first to fill the best slots.
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

  // Sort: longest activities first so they get the best time slots
  const pool = [...selectedActivities].sort((a, b) => activityDuration(b) - activityDuration(a));
  const windows = getWindows();
  const days = [];
  let poolIdx = 0;

  for (let d = 0; d < profile.trip_length_days; d++) {
    const date = addDays(profile.start_date, d);
    const slots = [];
    let dayConsumed = false;

    for (const w of windows) {
      if (w.type === "nap") {
        slots.push({ title: "Nap / Rest", start: minsToTime(w.start), duration_mins: w.end - w.start, type: "rest" });
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
        });
        poolIdx++;
        dayConsumed = true;
        continue;
      }

      // Fill window greedily with activities that fit
      let t = w.start;
      let avail = windowDuration;

      while (avail >= 45 && poolIdx < pool.length) {
        const act = pool[poolIdx];
        const needed = activityDuration(act);

        if (act.duration_category === "full_day" && avail < 300) break;
        if (needed > avail + 60 && pool.length - poolIdx > 1) break;

        const used = Math.min(needed, avail);
        slots.push({
          title: act.name, start: minsToTime(t), duration_mins: used,
          location: act.location, type: act.type, activityId: act.id,
          hours: act.hours, duration_category: act.duration_category,
        });
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
