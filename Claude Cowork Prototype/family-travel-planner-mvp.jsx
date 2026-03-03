import { useState, useEffect, useRef, useCallback } from "react";

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
};

const SAMPLE_ACTIVITIES = [
  { id: "sdzoo", name: "San Diego Zoo", type: "attraction", hours: "9:00-17:00", notes: "Large zoo with kid-friendly exhibits. Stroller-friendly. Many rest areas.", location: "2920 Zoo Dr, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "https://www.sandiegozoo.org/tickets" },
  { id: "balboa", name: "Balboa Park (parks + museums)", type: "park", hours: "10:00-18:00", notes: "Large park with playgrounds, museums; good for flexible days and naps in stroller.", location: "Balboa Park, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "https://www.balboapark.org" },
  { id: "la_jolla_cove", name: "La Jolla Cove / Beach", type: "outdoors", hours: "06:00-20:00", notes: "Beach time, tide pools, easy strolls. Bring sun protection.", location: "La Jolla Cove, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "https://www.sandiego.org/explore/things-to-do/beaches-bays/la-jolla-cove.aspx" },
  { id: "seaworld", name: "SeaWorld San Diego", type: "attraction", hours: "10:00-18:00", notes: "Marine shows and aquarium exhibits; good for 3+ but has toddler-friendly areas.", location: "500 Sea World Dr, San Diego, CA", age_range: "2-12", duration_mins: 240, affiliate: "https://seaworld.com/san-diego/tickets/" },
  { id: "old_town", name: "Old Town San Diego Historic Park", type: "culture", hours: "10:00-17:00", notes: "Open-air historic area with shops and casual restaurants; good for stroller access and early dinner.", location: "Old Town San Diego State Historic Park", age_range: "0-12", duration_mins: 120, affiliate: "https://www.parks.ca.gov/?page_id=663" },
  { id: "fleet_science", name: "Fleet Science Center", type: "museum", hours: "10:00-18:00", notes: "Hands-on exhibits for kids; good indoor backup for rainy or hot afternoons.", location: "1875 El Prado, San Diego, CA", age_range: "3-12", duration_mins: 120, affiliate: "https://www.rhfleet.org" },
  { id: "torrey_pines", name: "Torrey Pines State Natural Reserve (easy trails)", type: "outdoors", hours: "07:00-18:00", notes: "Short, scenic trails suitable for families (choose easy loops).", location: "12600 N Torrey Pines Rd, La Jolla, CA", age_range: "2-12", duration_mins: 120, affiliate: "https://www.parks.ca.gov/?page_id=657" },
];

const DEFAULT_PROFILE = {
  profile_name: "",
  adults: 2,
  kids: [{ age: 5 }, { age: 2 }],
  trip_length_days: 5,
  wake_time: "07:30",
  nap_window: { start: "13:00", end: "15:00" },
  preferences: { beach: true, museums: true, date_night: true },
  destination: "San Diego",
  start_date: "2026-04-15",
};

const SYSTEM_PROMPT = `You are a family travel expert who recommends activities for families with young children. 
When given a city, children's ages, and preferences, generate 6-8 activities perfect for that family. 
CRITICAL: Respond with ONLY a valid JSON array, no markdown, no backticks, no explanation. Each object must match this exact schema:
{
  "id": "short_snake_case_id",
  "name": "Activity Name",
  "type": "attraction" | "park" | "outdoors" | "culture" | "museum" | "food" | "entertainment",
  "hours": "HH:MM-HH:MM",
  "notes": "Brief family-friendly description with practical tips for parents with young kids.",
  "location": "Full address or location name, City, State",
  "age_range": "min-max",
  "duration_mins": number,
  "affiliate": "https://official-website-url"
}
Rules:
- Only recommend places that actually exist
- Prioritize stroller-accessible, toddler-friendly spots
- Include practical parent tips in notes (shade, bathrooms, nap-friendly, etc.)
- Mix indoor and outdoor activities
- Include realistic duration estimates
- Use real website URLs when you know them`;

/* ─────────────────────────────────────────────
   UTILITY FUNCTIONS
   ───────────────────────────────────────────── */

function formatDuration(mins) {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function timeToMins(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minsToTime(m) {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatTime12(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function generateItinerary(profile, selectedActivities) {
  const days = [];
  const napStart = timeToMins(profile.nap_window.start);
  const napEnd = timeToMins(profile.nap_window.end);
  const wakeUp = timeToMins(profile.wake_time);
  const dinnerStart = 18 * 60;

  const pool = [...selectedActivities];
  const used = new Set();

  for (let d = 0; d < profile.trip_length_days; d++) {
    const date = addDays(profile.start_date, d);
    const slots = [];

    // Morning slot
    const morningAvail = napStart - wakeUp - 30; // 30 min buffer
    let morningActivity = null;
    for (const a of pool) {
      if (!used.has(a.id) && a.duration_mins <= morningAvail) {
        morningActivity = a;
        break;
      }
    }
    if (!morningActivity) {
      for (const a of pool) {
        if (a.duration_mins <= morningAvail) {
          morningActivity = a;
          break;
        }
      }
    }

    if (morningActivity) {
      used.add(morningActivity.id);
      const openHour = morningActivity.hours ? timeToMins(morningActivity.hours.split("-")[0]) : wakeUp;
      const startTime = Math.max(wakeUp, openHour);
      slots.push({
        title: morningActivity.name,
        start: minsToTime(startTime),
        duration_mins: morningActivity.duration_mins,
        location: morningActivity.location,
        type: morningActivity.type,
        activityId: morningActivity.id,
      });
    }

    // Nap
    slots.push({
      title: "Nap / Rest",
      start: minsToTime(napStart),
      duration_mins: napEnd - napStart,
      type: "rest",
    });

    // Afternoon slot
    const afternoonStart = napEnd + 30;
    const afternoonAvail = dinnerStart - afternoonStart;
    let afternoonActivity = null;
    for (const a of pool) {
      if (!used.has(a.id) && a.duration_mins <= afternoonAvail) {
        afternoonActivity = a;
        break;
      }
    }
    if (!afternoonActivity) {
      for (const a of pool) {
        if (a.id !== (morningActivity?.id) && a.duration_mins <= afternoonAvail) {
          afternoonActivity = a;
          break;
        }
      }
    }

    if (afternoonActivity) {
      used.add(afternoonActivity.id);
      slots.push({
        title: afternoonActivity.name,
        start: minsToTime(afternoonStart),
        duration_mins: Math.min(afternoonActivity.duration_mins, afternoonAvail),
        location: afternoonActivity.location,
        type: afternoonActivity.type,
        activityId: afternoonActivity.id,
      });
    }

    // Evening wind-down
    slots.push({
      title: "Early dinner / stroll / unwind",
      start: minsToTime(dinnerStart),
      duration_mins: 90,
      type: "rest",
    });

    days.push({ day: d + 1, date, slots });
  }

  return { profile: profile.profile_name, destination: profile.destination, days };
}

/* ─────────────────────────────────────────────
   GLOBAL STYLES
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

  body { font-family: 'Nunito', sans-serif; background: var(--sand); color: var(--ink); }

  @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
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
`;

/* ─────────────────────────────────────────────
   STEP INDICATOR
   ───────────────────────────────────────────── */

function StepIndicator({ current, steps }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", margin: "32px 0 8px" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: i < current ? "var(--ocean)" : i === current ? "var(--sunset)" : "var(--mist)",
                color: i <= current ? "#fff" : "var(--stone)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "14px",
                transition: "all 0.3s ease",
                boxShadow: i === current ? "0 4px 14px rgba(232,100,58,0.35)" : "none",
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: i === current ? "var(--sunset)" : i < current ? "var(--ocean)" : "var(--stone)",
              whiteSpace: "nowrap",
            }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 48, height: 2, margin: "0 8px",
              background: i < current ? "var(--ocean)" : "var(--mist)",
              borderRadius: 2, marginBottom: 20,
              transition: "background 0.3s",
            }} />
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
  const updateKid = (index, age) => {
    const kids = [...profile.kids];
    kids[index] = { age: parseInt(age) || 0 };
    setProfile({ ...profile, kids });
  };
  const addKid = () => setProfile({ ...profile, kids: [...profile.kids, { age: 1 }] });
  const removeKid = (i) => setProfile({ ...profile, kids: profile.kids.filter((_, j) => j !== i) });
  const togglePref = (key) => setProfile({ ...profile, preferences: { ...profile.preferences, [key]: !profile.preferences[key] } });

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "2px solid var(--mist)", fontSize: "14px", fontWeight: 600,
    background: "#fff", color: "var(--ink)", transition: "all 0.2s",
  };

  const labelStyle = {
    display: "block", fontSize: "11px", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.08em",
    color: "var(--stone)", marginBottom: "6px",
  };

  const isValid = profile.destination.trim() && profile.kids.length > 0 && profile.trip_length_days > 0;

  return (
    <div className="step-enter" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <span style={{ fontSize: 48, display: "block", marginBottom: 8 }}>👨‍👩‍👧‍👦</span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: "var(--ink)" }}>
          Tell Us About Your Family
        </h2>
        <p style={{ color: "var(--stone)", fontSize: 14, marginTop: 4 }}>
          We'll customize everything around your kids' ages and routine.
        </p>
      </div>

      <div style={{
        background: "var(--cloud)", borderRadius: 20, padding: 28,
        border: "1px solid var(--mist)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        {/* Trip basics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Destination</label>
            <input style={inputStyle} value={profile.destination} onChange={(e) => setProfile({ ...profile, destination: e.target.value })} placeholder="e.g. San Diego" />
          </div>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input style={inputStyle} type="date" value={profile.start_date} onChange={(e) => setProfile({ ...profile, start_date: e.target.value })} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Trip Length (days)</label>
            <input style={inputStyle} type="number" min={1} max={14} value={profile.trip_length_days} onChange={(e) => setProfile({ ...profile, trip_length_days: parseInt(e.target.value) || 1 })} />
          </div>
          <div>
            <label style={labelStyle}>Adults</label>
            <input style={inputStyle} type="number" min={1} max={6} value={profile.adults} onChange={(e) => setProfile({ ...profile, adults: parseInt(e.target.value) || 1 })} />
          </div>
        </div>

        {/* Kids */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Children</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
            {profile.kids.map((kid, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--ocean-light)", borderRadius: 12, padding: "8px 12px",
              }}>
                <span style={{ fontSize: 18 }}>👶</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ocean)" }}>Age</span>
                <input
                  type="number" min={0} max={17} value={kid.age}
                  onChange={(e) => updateKid(i, e.target.value)}
                  style={{ width: 48, padding: "4px 8px", borderRadius: 8, border: "2px solid transparent", fontSize: 14, fontWeight: 700, textAlign: "center", background: "#fff", color: "var(--ink)" }}
                />
                {profile.kids.length > 1 && (
                  <button onClick={() => removeKid(i)} style={{
                    background: "none", border: "none", color: "var(--stone)", cursor: "pointer",
                    fontSize: 16, padding: "0 2px", lineHeight: 1,
                  }}>×</button>
                )}
              </div>
            ))}
            <button onClick={addKid} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "var(--mist)", borderRadius: 12, padding: "8px 14px",
              border: "2px dashed var(--stone)", cursor: "pointer",
              fontSize: 13, fontWeight: 700, color: "var(--stone)",
            }}>
              + Add Child
            </button>
          </div>
        </div>

        {/* Schedule */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Wake Time</label>
            <input style={inputStyle} type="time" value={profile.wake_time} onChange={(e) => setProfile({ ...profile, wake_time: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Nap Start</label>
            <input style={inputStyle} type="time" value={profile.nap_window.start} onChange={(e) => setProfile({ ...profile, nap_window: { ...profile.nap_window, start: e.target.value } })} />
          </div>
          <div>
            <label style={labelStyle}>Nap End</label>
            <input style={inputStyle} type="time" value={profile.nap_window.end} onChange={(e) => setProfile({ ...profile, nap_window: { ...profile.nap_window, end: e.target.value } })} />
          </div>
        </div>

        {/* Preferences */}
        <div>
          <label style={labelStyle}>Preferences</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { key: "beach", label: "🏖️ Beach", },
              { key: "museums", label: "🏛️ Museums" },
              { key: "date_night", label: "🌙 Date Night" },
              { key: "outdoors", label: "🌿 Outdoors" },
              { key: "food", label: "🍕 Food Scene" },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => togglePref(p.key)}
                style={{
                  padding: "8px 16px", borderRadius: 20,
                  border: `2px solid ${profile.preferences[p.key] ? "var(--ocean)" : "var(--mist)"}`,
                  background: profile.preferences[p.key] ? "var(--ocean-light)" : "transparent",
                  color: profile.preferences[p.key] ? "var(--ocean)" : "var(--stone)",
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button
          onClick={onNext}
          disabled={!isValid}
          style={{
            padding: "14px 48px", borderRadius: 14, border: "none",
            background: isValid ? "linear-gradient(135deg, var(--sunset), #F09A3A)" : "var(--mist)",
            color: isValid ? "#fff" : "var(--stone)",
            fontSize: 16, fontWeight: 800, cursor: isValid ? "pointer" : "not-allowed",
            boxShadow: isValid ? "0 6px 20px rgba(232,100,58,0.3)" : "none",
            transition: "all 0.3s",
            letterSpacing: "0.02em",
          }}
        >
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
      style={{
        opacity: 0, animation: `slideUp 0.4s ease-out ${index * 0.06}s forwards`,
        background: selected ? "#fff" : "#fff",
        borderRadius: 16,
        border: `2px solid ${selected ? config.color : "#E8E4DF"}`,
        overflow: "hidden", cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: selected ? `0 4px 16px ${config.color}22` : "none",
        position: "relative",
      }}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div style={{
        position: "absolute", top: 14, right: 14,
        width: 24, height: 24, borderRadius: 8,
        border: `2px solid ${selected ? config.color : "#D1CCC6"}`,
        background: selected ? config.color : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}>
        {selected && <span style={{ color: "#fff", fontSize: 14, fontWeight: 800, animation: "check 0.3s ease" }}>✓</span>}
      </div>

      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingRight: 32 }}>
          <span style={{ fontSize: 24 }}>{config.emoji}</span>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>
            {activity.name}
          </h3>
        </div>

        <span style={{
          display: "inline-block", fontSize: 10, fontWeight: 800,
          textTransform: "uppercase", letterSpacing: "0.06em",
          color: config.color, background: config.bg,
          padding: "3px 8px", borderRadius: 6, marginBottom: 8,
        }}>
          {activity.type}
        </span>

        <p style={{ fontSize: 13, color: "var(--stone)", lineHeight: 1.5, marginBottom: 12 }}>
          {activity.notes}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {[
            { icon: "🕐", label: activity.hours },
            { icon: "⏱️", label: formatDuration(activity.duration_mins) },
            { icon: "👶", label: `Ages ${activity.age_range}` },
          ].map((item, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--stone)" }}>
              <span style={{ fontSize: 12 }}>{item.icon}</span> {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivitiesStep({ profile, activities, setActivities, selectedIds, setSelectedIds, onNext, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const kidAges = profile.kids.map((k) => k.age).join(", ");
      const prefs = Object.entries(profile.preferences).filter(([, v]) => v).map(([k]) => k).join(", ");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Generate family activities for: ${profile.destination}. Children's ages: ${kidAges}. Trip is ${profile.trip_length_days} days. Preferences: ${prefs}. Return ONLY the JSON array.` }],
        }),
      });
      const data = await response.json();
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setActivities(parsed);
      setSelectedIds(new Set(parsed.map((a) => a.id)));
      setHasGenerated(true);
    } catch (err) {
      console.error(err);
      setError("API call failed — using sample activities instead. In production, this routes through your backend.");
      if (!hasGenerated) {
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
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="step-enter">
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 48, display: "block", marginBottom: 8 }}>🎯</span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800 }}>
          Activities in {profile.destination}
        </h2>
        <p style={{ color: "var(--stone)", fontSize: 14, marginTop: 4 }}>
          Select the activities you want in your itinerary. Uncheck any you'd like to skip.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={generate} disabled={loading} style={{
          padding: "10px 24px", borderRadius: 10, border: "2px solid var(--ocean)",
          background: loading ? "var(--ocean-light)" : "var(--cloud)",
          color: "var(--ocean)", fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer",
          animation: loading ? "pulse 1.5s infinite" : "none",
        }}>
          {loading ? "Generating..." : "✨ Generate with AI"}
        </button>
        <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "var(--stone)", fontWeight: 600 }}>
          {selectedCount} of {activities.length} selected
        </span>
      </div>

      {error && (
        <div style={{ background: "var(--sunset-light)", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", marginBottom: 16, maxWidth: 700, margin: "0 auto 16px" }}>
          <p style={{ color: "var(--sunset)", fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 16, maxWidth: 1000, margin: "0 auto" }}>
        {activities.map((a, i) => (
          <ActivityCard key={a.id} activity={a} selected={selectedIds.has(a.id)} onToggle={() => toggleActivity(a.id)} index={i} />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28 }}>
        <button onClick={onBack} style={{
          padding: "12px 32px", borderRadius: 12, border: "2px solid var(--mist)",
          background: "transparent", color: "var(--stone)", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>
          ← Family
        </button>
        <button
          onClick={onNext}
          disabled={selectedCount === 0}
          style={{
            padding: "12px 40px", borderRadius: 12, border: "none",
            background: selectedCount > 0 ? "linear-gradient(135deg, var(--sunset), #F09A3A)" : "var(--mist)",
            color: selectedCount > 0 ? "#fff" : "var(--stone)",
            fontSize: 14, fontWeight: 800, cursor: selectedCount > 0 ? "pointer" : "not-allowed",
            boxShadow: selectedCount > 0 ? "0 6px 20px rgba(232,100,58,0.3)" : "none",
          }}
        >
          Build Itinerary →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 3: ITINERARY
   ───────────────────────────────────────────── */

function TimelineSlot({ slot, index }) {
  const isRest = slot.type === "rest";
  const config = TYPE_CONFIG[slot.type] || { emoji: "😴", color: "#9CA3AF", bg: "#F3F4F6" };
  const emoji = isRest ? (slot.title.includes("Nap") ? "😴" : "🍽️") : config.emoji;
  const color = isRest ? "#B0A99F" : config.color;

  return (
    <div style={{
      display: "flex", gap: 16, opacity: 0,
      animation: `slideUp 0.35s ease-out ${index * 0.05}s forwards`,
    }}>
      {/* Time column */}
      <div style={{ width: 72, textAlign: "right", paddingTop: 2, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: isRest ? "var(--stone)" : "var(--ink)" }}>
          {formatTime12(slot.start)}
        </span>
      </div>

      {/* Timeline dot + line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%",
          background: isRest ? "var(--mist)" : color,
          border: `3px solid ${isRest ? "#D1CCC6" : color}`,
          boxShadow: isRest ? "none" : `0 2px 8px ${color}33`,
          flexShrink: 0,
        }} />
        <div style={{ width: 2, flex: 1, background: "var(--mist)", minHeight: 20 }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        background: isRest ? "var(--mist)" : "#fff",
        borderRadius: 14,
        padding: "14px 18px",
        border: isRest ? "1px dashed #D1CCC6" : `1px solid #E8E4DF`,
        marginBottom: 8,
        boxShadow: isRest ? "none" : "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: slot.location ? 4 : 0 }}>
          <span style={{ fontSize: 18 }}>{emoji}</span>
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: isRest ? "var(--stone)" : "var(--ink)",
            fontStyle: isRest ? "italic" : "normal",
          }}>
            {slot.title}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "var(--stone)",
            marginLeft: "auto",
          }}>
            {formatDuration(slot.duration_mins)}
          </span>
        </div>
        {slot.location && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 11 }}>📍</span>
            <span style={{ fontSize: 12, color: "var(--stone)" }}>{slot.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ItineraryStep({ profile, activities, selectedIds, itinerary, setItinerary, onBack, onBackToActivities }) {
  useEffect(() => {
    const selected = activities.filter((a) => selectedIds.has(a.id));
    const itin = generateItinerary(profile, selected);
    setItinerary(itin);
  }, [selectedIds]);

  if (!itinerary) return null;

  return (
    <div className="step-enter">
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 48, display: "block", marginBottom: 8 }}>🗓️</span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800 }}>
          Your {profile.destination} Itinerary
        </h2>
        <p style={{ color: "var(--stone)", fontSize: 14, marginTop: 4 }}>
          {profile.trip_length_days} days · {profile.adults} adults · {profile.kids.length} kid{profile.kids.length > 1 ? "s" : ""} (ages {profile.kids.map((k) => k.age).join(" & ")})
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 28 }}>
        <button onClick={onBackToActivities} style={{
          padding: "10px 20px", borderRadius: 10, border: "2px solid var(--ocean)",
          background: "var(--cloud)", color: "var(--ocean)", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>
          ← Edit Activities
        </button>
        <button onClick={onBack} style={{
          padding: "10px 20px", borderRadius: 10, border: "2px solid var(--mist)",
          background: "transparent", color: "var(--stone)", fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>
          ← Edit Family
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {itinerary.days.map((day) => (
          <div key={day.day} style={{
            marginBottom: 32, background: "var(--cloud)", borderRadius: 20,
            padding: "24px 24px 16px", border: "1px solid #E8E4DF",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20, paddingLeft: 4 }}>
              <span style={{
                fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: "var(--ink)",
              }}>
                Day {day.day}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ocean)" }}>
                {formatDate(day.date)}
              </span>
            </div>

            {day.slots.map((slot, si) => (
              <TimelineSlot key={si} slot={slot} index={si} />
            ))}
          </div>
        ))}
      </div>

      {/* JSON Export */}
      <div style={{ maxWidth: 680, margin: "24px auto 0", textAlign: "center" }}>
        <details style={{ textAlign: "left" }}>
          <summary style={{
            cursor: "pointer", fontSize: 13, fontWeight: 700,
            color: "var(--stone)", padding: "8px 0",
          }}>
            View JSON Export
          </summary>
          <pre style={{
            background: "var(--ink)", color: "#81D4C8", borderRadius: 14,
            padding: 20, fontSize: 12, lineHeight: 1.5, overflow: "auto", maxHeight: 400,
            fontFamily: "'Fira Code', monospace", marginTop: 8,
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
    <div style={{ minHeight: "100vh", background: "var(--sand)" }}>
      <style>{CSS}</style>

      {/* Header */}
      <header style={{
        padding: "24px 32px 0", maxWidth: 1100, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 32 }}>🧳</span>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px, 3vw, 28px)",
            fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em",
          }}>
            Family Travel Planner
          </h1>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "var(--ocean)",
          background: "var(--ocean-light)", padding: "4px 12px", borderRadius: 6,
        }}>
          MVP Prototype
        </span>
      </header>

      <StepIndicator current={step} steps={["Family", "Activities", "Itinerary"]} />

      {/* Content */}
      <main style={{ padding: "16px 24px 64px", maxWidth: 1100, margin: "0 auto" }}>
        {step === 0 && (
          <FamilyProfileStep
            profile={profile}
            setProfile={setProfile}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <ActivitiesStep
            profile={profile}
            activities={activities}
            setActivities={setActivities}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <ItineraryStep
            profile={profile}
            activities={activities}
            selectedIds={selectedIds}
            itinerary={itinerary}
            setItinerary={setItinerary}
            onBack={() => setStep(0)}
            onBackToActivities={() => setStep(1)}
          />
        )}
      </main>
    </div>
  );
}
