/* ─── Shared Configuration ─────────────────────────────────────────────────
   Single source of truth for activity types, energy levels, preferences,
   and visual styling used across all modules.
   ────────────────────────────────────────────────────────────────────────── */

export const TYPE_CONFIG = {
  attraction:    { emoji: "🎢", color: "#CF4B3A", bg: "#FEF2F1" },
  park:          { emoji: "🌳", color: "#2D8A4E", bg: "#F0FAF4" },
  outdoors:      { emoji: "🏖️", color: "#0B7A8E", bg: "#EEFBFD" },
  culture:       { emoji: "🏛️", color: "#7C3AED", bg: "#FAF5FF" },
  museum:        { emoji: "🔬", color: "#B45309", bg: "#FFFBEB" },
  food:          { emoji: "🍽️", color: "#DC2626", bg: "#FFF5F5" },
  entertainment: { emoji: "🎭", color: "#4F46E5", bg: "#F5F3FF" },
  hike:          { emoji: "🥾", color: "#6B7234", bg: "#F5F5EB" },
  nap:           { emoji: "😴", color: "#8A9BA5", bg: "#F3F4F6" },
  meal:          { emoji: "🍽️", color: "#B45309", bg: "#FFF9F0" },
  rest:          { emoji: "☁️", color: "#9CA3AF", bg: "#F9FAFB" },
  custom:        { emoji: "📌", color: "#4F46E5", bg: "#F5F3FF" },
  free:          { emoji: "✨", color: "#9CA3AF", bg: "#FAFAF7" },
};

export const ENERGY_CONFIG = {
  low:  { icon: "😌", label: "Chill",    color: "#16A34A", bg: "#F0FDF4" },
  med:  { icon: "⚡", label: "Moderate", color: "#D97706", bg: "#FFFBEB" },
  high: { icon: "🔥", label: "High",     color: "#DC2626", bg: "#FEF2F2" },
};

export const ENERGY_BY_TYPE = {
  attraction: "high", entertainment: "high",
  outdoors: "med",   hike: "med",
  museum: "low",     culture: "low", park: "low", food: "low",
};

// Energy icons used in calendar blocks (emoji shorthand)
export const ENERGY_EMOJI_BY_TYPE = {
  attraction: "🔥", entertainment: "🔥",
  outdoors: "⚡",   hike: "⚡",
  museum: "😌",     culture: "😌", park: "😌", food: "😌",
};

export const CAT_LABELS = {
  full_day: "Full Day",
  half_day: "Half Day",
  "2-4h":   "2–4h",
  "1-2h":   "1–2h",
  under_1h: "<1h",
};

// Duration category → preferred minutes (for scheduling)
export const CAT_MINS = {
  full_day: 480,
  half_day: 240,
  "2-4h":   180,
  "1-2h":    90,
  under_1h:  45,
};

// Map activity types to preference keys (for sorting preferred vs non-preferred)
export const TYPE_TO_PREF = {
  outdoors:      ["beach_water", "hiking_nature"],
  park:          ["parks_playgrounds"],
  hike:          ["hiking_nature"],
  museum:        ["museums_science"],
  attraction:    ["theme_parks"],
  entertainment: ["theme_parks", "indoor_play"],
  culture:       ["arts_culture"],
  food:          [],
};

// Map restaurant cuisine types to restaurant preference keys
export const CUISINE_TO_PREF = {
  american:   ["american"],
  mexican:    ["mexican"],
  asian:      ["asian"],
  italian:    ["italian"],
  seafood:    ["seafood"],
  pizza:      ["italian"],
  sushi:      ["asian"],
  bbq:        ["american"],
  mediterranean: ["other"],
  indian:     ["asian"],
  thai:       ["asian"],
  chinese:    ["asian"],
  japanese:   ["asian"],
  korean:     ["asian"],
  vietnamese: ["asian"],
  french:     ["other"],
  greek:      ["other"],
  caribbean:  ["other"],
  southern:   ["american"],
  tex_mex:    ["mexican"],
  burger:     ["american"],
  steakhouse: ["american"],
  cafe:       ["other"],
  bakery:     ["other"],
  deli:       ["other"],
  brunch:     ["american"],
  other:      ["other"],
};

// Bookable activity types (for Viator affiliate links)
export const BOOKABLE_TYPES = new Set([
  "attraction", "entertainment", "museum", "hike", "outdoors", "culture",
]);

// Viator affiliate PID
export const VIATOR_PID = process.env.NEXT_PUBLIC_VIATOR_PID;

// Preference chip definitions for the family module
export const OUTDOOR_PREFS = [
  { key: "beach_water",       label: "🏖️ Beach" },
  { key: "parks_playgrounds", label: "🌳 Parks" },
  { key: "hiking_nature",     label: "🥾 Hikes" },
  { key: "playgrounds_play",  label: "🎠 Playgrounds" },
];

export const INDOOR_PREFS = [
  { key: "museums_science", label: "🔬 Museums" },
  { key: "theme_parks",    label: "🎢 Theme Parks" },
  { key: "indoor_play",    label: "🎪 Play" },
  { key: "arts_culture",   label: "🎭 Arts" },
];

export const RESTAURANT_PREFS = [
  { key: "american", label: "🍔 American" },
  { key: "mexican",  label: "🌮 Mexican" },
  { key: "asian",    label: "🍜 Asian" },
  { key: "italian",  label: "🍕 Italian" },
  { key: "seafood",  label: "🦞 Seafood" },
  { key: "other",    label: "🍽️ Other" },
  { key: "none",     label: "🚫 None" },
];

// Default family profile
export const DEFAULT_PROFILE = {
  adults: 2,
  kids: [{ age: 5 }, { age: 2 }],
  trip_length_days: 5,
  wake_time: "07:00",
  bed_time: "20:00",
  naps: [{ start: "12:30", duration: 90 }],
  preferences: {
    beach_water: true,
    parks_playgrounds: true,
    hiking_nature: true,
    playgrounds_play: true,
    museums_science: true,
    theme_parks: true,
    indoor_play: true,
    arts_culture: true,
  },
  restaurants: {
    american: true, mexican: true, asian: true,
    italian: true, seafood: true, other: true, none: false,
  },
  destination: "San Diego",
  start_date: "2026-04-15",
};

// Half-hour time options for wake/bed/nap selectors
export const HALF_HOURS = [];
for (let h = 5; h <= 22; h++) {
  HALF_HOURS.push(String(h).padStart(2, "0") + ":00");
  if (h < 22) HALF_HOURS.push(String(h).padStart(2, "0") + ":30");
}

// Duration options for naps (minutes)
export const DURATIONS = [30, 60, 90, 120, 150, 180];

// Global CSS (fonts, variables, animations)
export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Nunito:wght@400;500;600;700;800&display=swap');
:root{--sand:#FAF6F1;--ocean:#0B7A8E;--ocean-light:#E6F6F8;--sunset:#E8643A;--sunset-light:#FEF0EB;--ink:#1C2B33;--stone:#8A9BA5;--cloud:#FFF;--mist:#F0EDE8;}
*{box-sizing:border-box;margin:0;padding:0;}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
.step-enter{animation:slideUp .5s ease-out forwards}
input,select{font-family:'Nunito',sans-serif}
input:focus,select:focus{outline:none;border-color:var(--ocean)!important;box-shadow:0 0 0 3px rgba(11,122,142,.12)}
.week-scroll::-webkit-scrollbar{height:6px}.week-scroll::-webkit-scrollbar-track{background:var(--mist);border-radius:3px}.week-scroll::-webkit-scrollbar-thumb{background:var(--stone);border-radius:3px}
.sidebar-scroll::-webkit-scrollbar{width:5px}.sidebar-scroll::-webkit-scrollbar-track{background:transparent}.sidebar-scroll::-webkit-scrollbar-thumb{background:var(--stone);border-radius:3px}
.drag-chip{cursor:grab;user-select:none;transition:transform .15s,box-shadow .15s}.drag-chip:active{cursor:grabbing;transform:scale(1.05);box-shadow:0 6px 20px rgba(0,0,0,.15)}
.drop-zone{transition:background .2s,border-color .2s}
.drop-zone.drag-over{background:var(--sunset-light)!important;border-color:var(--sunset)!important}
@media print{
  @page{size:landscape;margin:0.3in}
  body{background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  header,.no-print,button:not(.print-keep),.calendar-sidebar{display:none!important}
  main{padding:0!important;max-width:none!important}
  .print-break{page-break-before:always}
  .print-header{display:block!important}
  details{display:none!important}
  .cal-block-desc{display:none!important}
  footer,.print-hide-after{display:none!important}
  div[style*="margin-top: 16px"]{margin-top:0!important}
  .calendar-desktop{display:block!important}
  .week-scroll{display:flex!important;break-inside:auto;page-break-inside:auto}
  .calendar-title{display:none!important}
  .print-header{display:none!important}
}
`;
