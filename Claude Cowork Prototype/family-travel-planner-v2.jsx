import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   CONFIG & CONSTANTS
   ───────────────────────────────────────────── */

const TYPE_CONFIG = {
  attraction: { emoji: "🎢", color: "#CF4B3A", bg: "#FEF2F1" },
  park: { emoji: "🌳", color: "#2D8A4E", bg: "#F0FAF4" },
  outdoors: { emoji: "🏖️", color: "#0B7A8E", bg: "#EEFBFD" },
  culture: { emoji: "🏛️", color: "#7C3AED", bg: "#FAF5FF" },
  museum: { emoji: "🔬", color: "#B45309", bg: "#FFFBEB" },
  food: { emoji: "🍽️", color: "#DC2626", bg: "#FFF5F5" },
  entertainment: { emoji: "🎭", color: "#4F46E5", bg: "#F5F3FF" },
  hike: { emoji: "🥾", color: "#6B7234", bg: "#F5F5EB" },
};

const SAMPLE_ACTIVITIES = [
  { id: "sdzoo", name: "San Diego Zoo", type: "attraction", hours: "9:00 AM – 5:00 PM", notes: "Large zoo with kid-friendly exhibits. Stroller-friendly. Many rest areas.", location: "2920 Zoo Dr, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "https://www.sandiegozoo.org/tickets" },
  { id: "balboa", name: "Balboa Park", type: "park", hours: "6:00 AM – 10:00 PM (park); museums 10 AM – 5 PM", notes: "Large park with playgrounds, museums; good for flexible days and naps in stroller.", location: "Balboa Park, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "https://www.balboapark.org" },
  { id: "la_jolla_cove", name: "La Jolla Cove / Beach", type: "outdoors", hours: "Open 24 hrs; best 7:00 AM – 7:00 PM", notes: "Beach time, tide pools, easy strolls. Bring sun protection.", location: "La Jolla Cove, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "https://www.sandiego.org" },
  { id: "seaworld", name: "SeaWorld San Diego", type: "attraction", hours: "10:00 AM – 6:00 PM (varies seasonally)", notes: "Marine shows and aquarium exhibits; good for 3+ but has toddler-friendly areas.", location: "500 Sea World Dr, San Diego, CA", age_range: "2-12", duration_mins: 240, affiliate: "https://seaworld.com/san-diego/tickets/" },
  { id: "old_town", name: "Old Town Historic Park", type: "culture", hours: "10:00 AM – 5:00 PM daily", notes: "Open-air historic area with shops and casual restaurants; stroller-friendly.", location: "Old Town San Diego State Historic Park", age_range: "0-12", duration_mins: 120, affiliate: "https://www.parks.ca.gov/?page_id=663" },
  { id: "fleet_science", name: "Fleet Science Center", type: "museum", hours: "10:00 AM – 5:00 PM (Mon–Thu), 10 AM – 6 PM (Fri–Sun)", notes: "Hands-on exhibits for kids; good indoor backup for rainy or hot afternoons.", location: "1875 El Prado, San Diego, CA", age_range: "3-12", duration_mins: 120, affiliate: "https://www.rhfleet.org" },
  { id: "torrey_pines", name: "Torrey Pines Reserve", type: "outdoors", hours: "7:15 AM – sunset daily", notes: "Short, scenic trails suitable for families. Choose the Guy Fleming or Parry Grove trail.", location: "12600 N Torrey Pines Rd, La Jolla, CA", age_range: "2-12", duration_mins: 120, affiliate: "https://www.parks.ca.gov/?page_id=657" },
];

const HALF_HOURS = [];
for (let h = 6; h <= 22; h++) {
  HALF_HOURS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) HALF_HOURS.push(`${String(h).padStart(2, "0")}:30`);
}

const DURATIONS = [30, 60, 90, 120, 150, 180];

const DEFAULT_PROFILE = {
  adults: 2,
  kids: [{ age: 5 }, { age: 2 }],
  trip_length_days: 5,
  wake_time: "07:00",
  bed_time: "19:30",
  naps: [{ start: "12:30", duration: 90 }],
  preferences: { beach: true, museums: true, date_night: false, outdoors: false, food: false, hikes: false, parks: false },
  destination: "San Diego",
  start_date: "2026-04-15",
};

const SYSTEM_PROMPT = `You are a family travel expert who recommends activities for families with young children. 
When given a city, children's ages, and trip length, generate 6-8 activities perfect for that family.
CRITICAL: Respond with ONLY a valid JSON array, no markdown, no backticks, no explanation. Each object must match this exact schema:
{
  "id": "short_snake_case_id",
  "name": "Activity Name",
  "type": "attraction" | "park" | "outdoors" | "culture" | "museum" | "food" | "entertainment",
  "hours": "Human-readable hours string, e.g. '9:00 AM – 5:00 PM daily' or '10 AM – 6 PM (Fri–Sun)'",
  "notes": "Brief family-friendly description with practical tips for parents with young kids.",
  "location": "Full address or location name, City, State",
  "age_range": "min-max",
  "duration_mins": number,
  "affiliate": "https://official-website-url"
}
Rules:
- Only recommend places that actually exist
- Prioritize stroller-accessible, toddler-friendly spots
- Include practical parent tips in notes
- Mix indoor and outdoor activities
- Include realistic duration estimates
- The "hours" field should be human-readable operating hours including days if they vary
- Use real website URLs when you know them`;

/* ─────────────────────────────────────────────
   UTILITIES
   ───────────────────────────────────────────── */

function formatDuration(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function timeToMins(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minsToTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function formatTime12(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/* ─────────────────────────────────────────────
   ITINERARY GENERATION
   ───────────────────────────────────────────── */

function generateItinerary(profile, selectedActivities) {
  const wake = timeToMins(profile.wake_time);
  const bed = timeToMins(profile.bed_time);
  const naps = profile.naps
    .map((n) => ({ start: timeToMins(n.start), end: timeToMins(n.start) + n.duration }))
    .sort((a, b) => a.start - b.start);

  // Build free windows for each day
  function getFreeWindows() {
    const windows = [];
    let cursor = wake;
    for (const nap of naps) {
      if (nap.start > cursor + 30) {
        windows.push({ start: cursor, end: nap.start, type: "free" });
      }
      windows.push({ start: nap.start, end: nap.end, type: "nap" });
      cursor = nap.end + 15; // 15 min buffer after nap
    }
    // Dinner at bed_time - 90 mins
    const dinnerStart = bed - 90;
    if (dinnerStart > cursor + 30) {
      windows.push({ start: cursor, end: dinnerStart, type: "free" });
    }
    windows.push({ start: dinnerStart, end: bed, type: "dinner" });
    return windows;
  }

  const windows = getFreeWindows();
  const pool = [...selectedActivities];
  const used = new Set();
  const days = [];

  for (let d = 0; d < profile.trip_length_days; d++) {
    const date = addDays(profile.start_date, d);
    const slots = [];

    for (const w of windows) {
      if (w.type === "nap") {
        slots.push({
          title: "Nap / Rest",
          start: minsToTime(w.start),
          duration_mins: w.end - w.start,
          type: "rest",
        });
      } else if (w.type === "dinner") {
        slots.push({
          title: "Dinner / Wind Down",
          start: minsToTime(w.start),
          duration_mins: w.end - w.start,
          type: "rest",
        });
      } else {
        // Fill free window with an activity
        const avail = w.end - w.start - 15;
        let chosen = null;
        // Try unused first
        for (const a of pool) {
          if (!used.has(a.id) && a.duration_mins <= avail) { chosen = a; break; }
        }
        // Reuse if needed
        if (!chosen) {
          for (const a of pool) {
            if (a.duration_mins <= avail) { chosen = a; break; }
          }
        }
        if (chosen) {
          used.add(chosen.id);
          slots.push({
            title: chosen.name,
            start: minsToTime(w.start),
            duration_mins: Math.min(chosen.duration_mins, avail),
            location: chosen.location,
            type: chosen.type,
            activityId: chosen.id,
            hours: chosen.hours,
          });
        }
      }
    }

    days.push({ day: d + 1, date, slots });
  }

  return { profile: `${profile.adults} adults, ${profile.kids.length} kids`, destination: profile.destination, days };
}

/* ─────────────────────────────────────────────
   STYLES
   ───────────────────────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Nunito:wght@400;500;600;700;800&display=swap');

  :root {
    --sand: #FAF6F1;
    --ocean: #0B7A8E;
    --ocean-light: #E6F6F8;
    --sunset: #E8643A;
    --sunset-light: #FEF0EB;
    --ink: #1C2B33;
    --stone: #8A9BA5;
    --cloud: #FFFFFF;
    --mist: #F0EDE8;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }
  @keyframes check { 0% { transform:scale(0); } 50% { transform:scale(1.2); } 100% { transform:scale(1); } }

  .step-enter { animation: slideUp 0.5s ease-out forwards; }

  input, select { font-family: 'Nunito', sans-serif; }
  input:focus, select:focus {
    outline: none;
    border-color: var(--ocean) !important;
    box-shadow: 0 0 0 3px rgba(11,122,142,0.12);
  }

  .week-scroll::-webkit-scrollbar { height: 6px; }
  .week-scroll::-webkit-scrollbar-track { background: var(--mist); border-radius: 3px; }
  .week-scroll::-webkit-scrollbar-thumb { background: var(--stone); border-radius: 3px; }
`;

/* ─────────────────────────────────────────────
   STEP INDICATOR
   ───────────────────────────────────────────── */

function StepIndicator({ current, steps }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "28px 0 4px" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: i < current ? "var(--ocean)" : i === current ? "var(--sunset)" : "var(--mist)",
              color: i <= current ? "#fff" : "var(--stone)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13, transition: "all 0.3s",
              boxShadow: i === current ? "0 4px 14px rgba(232,100,58,0.3)" : "none",
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: i === current ? "var(--sunset)" : i < current ? "var(--ocean)" : "var(--stone)", whiteSpace: "nowrap" }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 40, height: 2, margin: "0 6px", background: i < current ? "var(--ocean)" : "var(--mist)", borderRadius: 2, marginBottom: 18, transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 1: FAMILY PROFILE
   ───────────────────────────────────────────── */

function FamilyProfileStep({ profile, setProfile, onNext }) {
  const updateKid = (i, age) => {
    const kids = [...profile.kids];
    kids[i] = { age: parseInt(age) || 0 };
    setProfile({ ...profile, kids });
  };
  const addKid = () => setProfile({ ...profile, kids: [...profile.kids, { age: 1 }] });
  const removeKid = (i) => setProfile({ ...profile, kids: profile.kids.filter((_, j) => j !== i) });
  const togglePref = (key) => setProfile({ ...profile, preferences: { ...profile.preferences, [key]: !profile.preferences[key] } });

  const addNap = () => setProfile({ ...profile, naps: [...profile.naps, { start: "14:00", duration: 60 }] });
  const removeNap = (i) => setProfile({ ...profile, naps: profile.naps.filter((_, j) => j !== i) });
  const updateNap = (i, field, val) => {
    const naps = [...profile.naps];
    naps[i] = { ...naps[i], [field]: field === "duration" ? parseInt(val) : val };
    setProfile({ ...profile, naps });
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "2px solid var(--mist)", fontSize: 14, fontWeight: 600,
    background: "#fff", color: "var(--ink)", transition: "all 0.2s",
  };
  const labelStyle = {
    display: "block", fontSize: 11, fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.08em",
    color: "var(--stone)", marginBottom: 6,
  };
  const isValid = profile.destination.trim() && profile.kids.length > 0 && profile.trip_length_days > 0;

  return (
    <div className="step-enter" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 44, display: "block", marginBottom: 6 }}>👨‍👩‍👧‍👦</span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800 }}>Tell Us About Your Family</h2>
        <p style={{ color: "var(--stone)", fontSize: 13, marginTop: 4 }}>We'll build an itinerary around your kids' routine.</p>
      </div>

      <div style={{ background: "var(--cloud)", borderRadius: 18, padding: 24, border: "1px solid var(--mist)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>

        {/* Trip basics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>Destination</label>
            <input style={inputStyle} value={profile.destination} onChange={(e) => setProfile({ ...profile, destination: e.target.value })} placeholder="e.g. San Diego" />
          </div>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input style={inputStyle} type="date" value={profile.start_date} onChange={(e) => setProfile({ ...profile, start_date: e.target.value })} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>Trip Length (days)</label>
            <input style={inputStyle} type="number" min={1} max={21} value={profile.trip_length_days} onChange={(e) => setProfile({ ...profile, trip_length_days: parseInt(e.target.value) || 1 })} />
          </div>
          <div>
            <label style={labelStyle}>Adults</label>
            <input style={inputStyle} type="number" min={1} max={6} value={profile.adults} onChange={(e) => setProfile({ ...profile, adults: parseInt(e.target.value) || 1 })} />
          </div>
        </div>

        {/* Children */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Children</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {profile.kids.map((kid, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--ocean-light)", borderRadius: 10, padding: "6px 10px" }}>
                <span style={{ fontSize: 16 }}>👶</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ocean)" }}>Age</span>
                <input type="number" min={0} max={17} value={kid.age} onChange={(e) => updateKid(i, e.target.value)}
                  style={{ width: 44, padding: "3px 6px", borderRadius: 6, border: "2px solid transparent", fontSize: 13, fontWeight: 700, textAlign: "center", background: "#fff" }} />
                {profile.kids.length > 1 && (
                  <button onClick={() => removeKid(i)} style={{ background: "none", border: "none", color: "var(--stone)", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
                )}
              </div>
            ))}
            <button onClick={addKid} style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--mist)", borderRadius: 10, padding: "6px 12px", border: "2px dashed var(--stone)", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--stone)" }}>
              + Add Child
            </button>
          </div>
        </div>

        {/* Schedule: Wake + Bed */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>🌅 Wake Time</label>
            <select style={inputStyle} value={profile.wake_time} onChange={(e) => setProfile({ ...profile, wake_time: e.target.value })}>
              {HALF_HOURS.filter((t) => timeToMins(t) >= 5 * 60 && timeToMins(t) <= 10 * 60).map((t) => (
                <option key={t} value={t}>{formatTime12(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>🌙 Bed Time</label>
            <select style={inputStyle} value={profile.bed_time} onChange={(e) => setProfile({ ...profile, bed_time: e.target.value })}>
              {HALF_HOURS.filter((t) => timeToMins(t) >= 17 * 60 && timeToMins(t) <= 22 * 60).map((t) => (
                <option key={t} value={t}>{formatTime12(t)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Naps */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>😴 Nap Times</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {profile.naps.map((nap, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                background: "#FFF9F0", borderRadius: 10, padding: "8px 12px",
                border: "1px solid #F0E6D6",
              }}>
                <span style={{ fontSize: 16 }}>😴</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--stone)" }}>Start</span>
                <select
                  value={nap.start}
                  onChange={(e) => updateNap(i, "start", e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: 6, border: "2px solid var(--mist)", fontSize: 13, fontWeight: 600, background: "#fff" }}
                >
                  {HALF_HOURS.filter((t) => timeToMins(t) >= 9 * 60 && timeToMins(t) <= 17 * 60).map((t) => (
                    <option key={t} value={t}>{formatTime12(t)}</option>
                  ))}
                </select>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--stone)" }}>Duration</span>
                <select
                  value={nap.duration}
                  onChange={(e) => updateNap(i, "duration", e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: 6, border: "2px solid var(--mist)", fontSize: 13, fontWeight: 600, background: "#fff" }}
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{formatDuration(d)}</option>
                  ))}
                </select>
                <button onClick={() => removeNap(i)} style={{ background: "none", border: "none", color: "var(--stone)", cursor: "pointer", fontSize: 15, lineHeight: 1, marginLeft: "auto" }}>×</button>
              </div>
            ))}
            <button onClick={addNap} style={{
              display: "flex", alignItems: "center", gap: 4, alignSelf: "flex-start",
              background: "var(--mist)", borderRadius: 10, padding: "6px 14px",
              border: "2px dashed var(--stone)", cursor: "pointer",
              fontSize: 12, fontWeight: 700, color: "var(--stone)",
            }}>
              + Add Nap Time
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <label style={labelStyle}>Preferences</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[
              { key: "beach", label: "🏖️ Beach" },
              { key: "museums", label: "🏛️ Museums" },
              { key: "date_night", label: "🌙 Date Night" },
              { key: "outdoors", label: "🌿 Outdoors" },
              { key: "food", label: "🍕 Food" },
              { key: "hikes", label: "🥾 Hikes" },
              { key: "parks", label: "🌳 Parks" },
            ].map((p) => (
              <button key={p.key} onClick={() => togglePref(p.key)} style={{
                padding: "7px 14px", borderRadius: 18,
                border: `2px solid ${profile.preferences[p.key] ? "var(--ocean)" : "var(--mist)"}`,
                background: profile.preferences[p.key] ? "var(--ocean-light)" : "transparent",
                color: profile.preferences[p.key] ? "var(--ocean)" : "var(--stone)",
                fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s",
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 22 }}>
        <button onClick={onNext} disabled={!isValid} style={{
          padding: "13px 44px", borderRadius: 12, border: "none",
          background: isValid ? "linear-gradient(135deg, var(--sunset), #F09A3A)" : "var(--mist)",
          color: isValid ? "#fff" : "var(--stone)",
          fontSize: 15, fontWeight: 800, cursor: isValid ? "pointer" : "not-allowed",
          boxShadow: isValid ? "0 6px 20px rgba(232,100,58,0.3)" : "none",
          transition: "all 0.3s",
        }}>
          Find Activities →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 2: ACTIVITIES
   ───────────────────────────────────────────── */

function ActivityCard({ activity, selected, onToggle, index }) {
  const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.attraction;
  return (
    <div
      onClick={onToggle}
      style={{
        opacity: 0, animation: `slideUp 0.4s ease-out ${index * 0.05}s forwards`,
        background: "#fff", borderRadius: 14,
        border: `2px solid ${selected ? config.color : "#E8E4DF"}`,
        cursor: "pointer", transition: "all 0.25s ease",
        boxShadow: selected ? `0 3px 12px ${config.color}22` : "none",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute", top: 12, right: 12,
        width: 22, height: 22, borderRadius: 6,
        border: `2px solid ${selected ? config.color : "#D1CCC6"}`,
        background: selected ? config.color : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}>
        {selected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
      </div>

      <div style={{ padding: "16px 16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, paddingRight: 28 }}>
          <span style={{ fontSize: 22 }}>{config.emoji}</span>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>
            {activity.name}
          </h3>
        </div>

        <span style={{ display: "inline-block", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: config.color, background: config.bg, padding: "2px 7px", borderRadius: 5, marginBottom: 6 }}>
          {activity.type}
        </span>

        <p style={{ fontSize: 12, color: "var(--stone)", lineHeight: 1.5, marginBottom: 8 }}>
          {activity.notes}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11, color: "var(--stone)" }}>
          <span>🕐 {activity.hours}</span>
          <span>⏱️ {formatDuration(activity.duration_mins)}</span>
          <span>👶 Ages {activity.age_range}</span>
        </div>
      </div>
    </div>
  );
}

function ActivitiesStep({ profile, activities, setActivities, selectedIds, setSelectedIds, onNext, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const kidAges = profile.kids.map((k) => k.age).join(", ");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Generate family activities for: ${profile.destination}. Children's ages: ${kidAges}. Trip is ${profile.trip_length_days} days. Return ONLY the JSON array.` }],
        }),
      });
      const data = await response.json();
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setActivities(parsed);
      setSelectedIds(new Set(parsed.map((a) => a.id)));
    } catch (err) {
      console.error(err);
      setError("API call failed — using sample data. In production this routes through your backend.");
      if (activities.length === 0) {
        setActivities(SAMPLE_ACTIVITIES);
        setSelectedIds(new Set(SAMPLE_ACTIVITIES.map((a) => a.id)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activities.length === 0) {
      setActivities(SAMPLE_ACTIVITIES);
      setSelectedIds(new Set(SAMPLE_ACTIVITIES.map((a) => a.id)));
    }
  }, []);

  const toggleActivity = (id) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="step-enter">
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 44, display: "block", marginBottom: 6 }}>🎯</span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800 }}>Activities in {profile.destination}</h2>
        <p style={{ color: "var(--stone)", fontSize: 13, marginTop: 4 }}>Toggle activities on/off — your itinerary will be built from what's selected.</p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={generate} disabled={loading} style={{
          padding: "9px 20px", borderRadius: 10, border: "2px solid var(--ocean)",
          background: loading ? "var(--ocean-light)" : "var(--cloud)",
          color: "var(--ocean)", fontSize: 12, fontWeight: 700, cursor: loading ? "wait" : "pointer",
          animation: loading ? "pulse 1.5s infinite" : "none",
        }}>
          {loading ? "Generating..." : "✨ Generate with AI"}
        </button>
        <span style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--stone)", fontWeight: 600 }}>
          {selectedIds.size}/{activities.length} selected
        </span>
      </div>

      {error && (
        <div style={{ background: "var(--sunset-light)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, maxWidth: 660, margin: "0 auto 14px" }}>
          <p style={{ color: "var(--sunset)", fontSize: 12, margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14, maxWidth: 960, margin: "0 auto" }}>
        {activities.map((a, i) => (
          <ActivityCard key={a.id} activity={a} selected={selectedIds.has(a.id)} onToggle={() => toggleActivity(a.id)} index={i} />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24 }}>
        <button onClick={onBack} style={{ padding: "11px 28px", borderRadius: 10, border: "2px solid var(--mist)", background: "transparent", color: "var(--stone)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Family</button>
        <button onClick={onNext} disabled={selectedIds.size === 0} style={{
          padding: "11px 36px", borderRadius: 10, border: "none",
          background: selectedIds.size > 0 ? "linear-gradient(135deg, var(--sunset), #F09A3A)" : "var(--mist)",
          color: selectedIds.size > 0 ? "#fff" : "var(--stone)",
          fontSize: 13, fontWeight: 800, cursor: selectedIds.size > 0 ? "pointer" : "not-allowed",
          boxShadow: selectedIds.size > 0 ? "0 6px 20px rgba(232,100,58,0.3)" : "none",
        }}>Build Itinerary →</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 3: HORIZONTAL WEEKLY ITINERARY
   ───────────────────────────────────────────── */

function DayColumn({ day }) {
  const isWeekend = (() => {
    const d = new Date(day.date + "T00:00:00");
    return d.getDay() === 0 || d.getDay() === 6;
  })();

  return (
    <div style={{
      minWidth: 185, maxWidth: 185, flex: "0 0 185px",
      background: "var(--cloud)", borderRadius: 14,
      border: `1px solid ${isWeekend ? "#E0D6C8" : "#E8E4DF"}`,
      overflow: "hidden",
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
    }}>
      {/* Day header */}
      <div style={{
        padding: "10px 12px",
        background: isWeekend ? "linear-gradient(135deg, #FFF3E0, #FFF9F0)" : "linear-gradient(135deg, var(--ocean-light), #F0FAFB)",
        borderBottom: "1px solid #E8E4DF",
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
          Day {day.day}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: isWeekend ? "var(--sunset)" : "var(--ocean)", marginTop: 1 }}>
          {formatDateShort(day.date)}
        </div>
      </div>

      {/* Slots */}
      <div style={{ padding: "8px 10px" }}>
        {day.slots.map((slot, si) => {
          const isRest = slot.type === "rest";
          const config = TYPE_CONFIG[slot.type] || { emoji: "😴", color: "#9CA3AF", bg: "#F3F4F6" };
          const emoji = isRest ? (slot.title.includes("Nap") ? "😴" : "🍽️") : config.emoji;
          const color = isRest ? "#B0A99F" : config.color;

          return (
            <div key={si} style={{
              padding: "8px 10px", borderRadius: 10, marginBottom: 6,
              background: isRest ? "#FAFAF7" : `${config.bg}`,
              border: isRest ? "1px dashed #DDD8D0" : `1px solid ${color}22`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <span style={{ fontSize: 13 }}>{emoji}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: isRest ? "var(--stone)" : "var(--ink)",
                  lineHeight: 1.3,
                  fontStyle: isRest ? "italic" : "normal",
                }}>
                  {slot.title}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--stone)", fontWeight: 600 }}>
                <span>{formatTime12(slot.start)}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{formatDuration(slot.duration_mins)}</span>
              </div>
              {slot.location && (
                <div style={{ fontSize: 10, color: "var(--stone)", marginTop: 3, opacity: 0.8, lineHeight: 1.3 }}>
                  📍 {slot.location}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItineraryStep({ profile, activities, selectedIds, itinerary, setItinerary, onBack, onBackToActivities }) {
  useEffect(() => {
    const selected = activities.filter((a) => selectedIds.has(a.id));
    setItinerary(generateItinerary(profile, selected));
  }, [selectedIds, profile]);

  if (!itinerary) return null;

  // Chunk days into weeks of 7
  const weeks = [];
  for (let i = 0; i < itinerary.days.length; i += 7) {
    weeks.push(itinerary.days.slice(i, i + 7));
  }

  return (
    <div className="step-enter">
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 44, display: "block", marginBottom: 6 }}>🗓️</span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800 }}>
          {profile.destination} Itinerary
        </h2>
        <p style={{ color: "var(--stone)", fontSize: 13, marginTop: 4 }}>
          {profile.trip_length_days} days · {profile.adults} adults · kids ages {profile.kids.map((k) => k.age).join(" & ")} · {profile.naps.length} nap{profile.naps.length !== 1 ? "s" : ""}/day
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onBackToActivities} style={{ padding: "9px 18px", borderRadius: 9, border: "2px solid var(--ocean)", background: "var(--cloud)", color: "var(--ocean)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          ← Edit Activities
        </button>
        <button onClick={onBack} style={{ padding: "9px 18px", borderRadius: 9, border: "2px solid var(--mist)", background: "transparent", color: "var(--stone)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          ← Edit Family
        </button>
      </div>

      {/* Weekly rows */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ marginBottom: 20 }}>
          {weeks.length > 1 && (
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--stone)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, paddingLeft: 4 }}>
              Week {wi + 1}
            </div>
          )}
          <div className="week-scroll" style={{
            display: "flex", gap: 12,
            overflowX: "auto", paddingBottom: 8,
            scrollSnapType: "x mandatory",
          }}>
            {week.map((day) => (
              <div key={day.day} style={{ scrollSnapAlign: "start" }}>
                <DayColumn day={day} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* JSON Export */}
      <div style={{ maxWidth: 900, margin: "16px auto 0" }}>
        <details>
          <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--stone)", padding: "6px 0" }}>
            View JSON Export
          </summary>
          <pre style={{
            background: "var(--ink)", color: "#81D4C8", borderRadius: 12,
            padding: 16, fontSize: 11, lineHeight: 1.5, overflow: "auto", maxHeight: 350,
            fontFamily: "'Fira Code', monospace", marginTop: 6,
          }}>
            {JSON.stringify(itinerary, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
   ───────────────────────────────────────────── */

export default function FamilyTravelPlanner() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [activities, setActivities] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [itinerary, setItinerary] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--sand)", fontFamily: "'Nunito', sans-serif" }}>
      <style>{CSS}</style>

      <header style={{
        padding: "20px 24px 0", maxWidth: 1100, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28 }}>🧳</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 800, color: "var(--ink)" }}>
            Family Travel Planner
          </h1>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ocean)", background: "var(--ocean-light)", padding: "3px 10px", borderRadius: 5 }}>
          MVP v2
        </span>
      </header>

      <StepIndicator current={step} steps={["Family", "Activities", "Itinerary"]} />

      <main style={{ padding: "12px 20px 48px", maxWidth: 1100, margin: "0 auto" }}>
        {step === 0 && <FamilyProfileStep profile={profile} setProfile={setProfile} onNext={() => setStep(1)} />}
        {step === 1 && <ActivitiesStep profile={profile} activities={activities} setActivities={setActivities} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <ItineraryStep profile={profile} activities={activities} selectedIds={selectedIds} itinerary={itinerary} setItinerary={setItinerary} onBack={() => setStep(0)} onBackToActivities={() => setStep(1)} />}
      </main>
    </div>
  );
}
