/* ─── Shared Utility Functions ─────────────────────────────────────────────
   Time, date, and formatting helpers used across all modules.
   ────────────────────────────────────────────────────────────────────────── */

export function timeToMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minsToTime(m) {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function formatTime12(t) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function formatTimeShort(t) {
  const [h, m] = t.split(":").map(Number);
  return (h % 12 || 12) + (m > 0 ? `:${String(m).padStart(2, "0")}` : "") + (h >= 12 ? "pm" : "am");
}

export function formatDuration(mins) {
  if (mins < 60) return mins + "m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? h + "h " + m + "m" : h + "h";
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export function formatDateShort(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

// Deterministic mock weather fallback (for dates beyond forecast range)
export function getMockWeather(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
  const seed = Math.abs(hash);
  const conditions = ["☀️", "⛅", "☁️", "🌧️", "☀️", "⛅", "☀️"];
  const month = parseInt(dateStr.split("-")[1]);
  const base = { 1:38, 2:42, 3:52, 4:62, 5:72, 6:82, 7:88, 8:86, 9:78, 10:66, 11:52, 12:40 }[month] || 70;
  return { icon: conditions[seed % conditions.length], highF: base + (seed % 15) - 7 };
}

// Snap minutes to nearest interval
export function snapMins(mins, interval = 15) {
  return Math.round(mins / interval) * interval;
}

// Check if activity matches user preferences
export function isPreferred(activity, preferences, typeToPrefs) {
  const prefKeys = typeToPrefs[activity.type] || [];
  return prefKeys.some(k => preferences[k]);
}
