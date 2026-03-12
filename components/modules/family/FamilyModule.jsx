"use client";

import { useState } from "react";
import {
  OUTDOOR_PREFS, INDOOR_PREFS, RESTAURANT_PREFS,
  HALF_HOURS, DURATIONS,
} from "../../shared/config";
import { timeToMins, formatTime12, formatDuration } from "../../shared/utils";

/* ─── Module 1: Family Profile ─────────────────────────────────────────────
   Collects family composition, schedules, and preferences.
   City/date selection is trip-specific (not saved as a preference).
   ────────────────────────────────────────────────────────────────────────── */

export default function FamilyModule({ profile, setProfile, onNext }) {
  const updateKid = (i, age) => {
    const k = [...profile.kids];
    k[i] = { age: parseInt(age) || 0 };
    setProfile({ ...profile, kids: k });
  };
  const addKid = () => setProfile({ ...profile, kids: [...profile.kids, { age: 1 }] });
  const removeKid = (i) => setProfile({ ...profile, kids: profile.kids.filter((_, j) => j !== i) });
  const togglePref = (k) => setProfile({ ...profile, preferences: { ...profile.preferences, [k]: !profile.preferences[k] } });

  const toggleRestaurant = (k) => {
    if (k === "none") {
      const newNone = !profile.restaurants?.none;
      if (newNone) {
        setProfile({ ...profile, restaurants: { american: false, mexican: false, asian: false, italian: false, seafood: false, other: false, none: true } });
      } else {
        setProfile({ ...profile, restaurants: { ...profile.restaurants, none: false } });
      }
    } else {
      setProfile({ ...profile, restaurants: { ...profile.restaurants, [k]: !profile.restaurants?.[k], none: false } });
    }
  };

  const addNap = () => setProfile({ ...profile, naps: [...profile.naps, { start: "14:00", duration: 60 }] });
  const removeNap = (i) => setProfile({ ...profile, naps: profile.naps.filter((_, j) => j !== i) });
  const updateNap = (i, f, v) => {
    const n = [...profile.naps];
    n[i] = { ...n[i], [f]: f === "duration" ? parseInt(v) : v };
    setProfile({ ...profile, naps: n });
  };

  const [daysInput, setDaysInput] = useState(String(profile.trip_length_days));
  const [adultsInput, setAdultsInput] = useState(String(profile.adults));

  const S = { width: "100%", padding: "9px 12px", borderRadius: 9, border: "2px solid var(--mist)", fontSize: 13, fontWeight: 600, background: "#fff", color: "var(--ink)", transition: "all .2s" };
  const L = { display: "block", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--stone)", marginBottom: 5 };
  const ok = profile.destination.trim() && profile.kids.length > 0 && profile.trip_length_days > 0;

  const prefBtn = (active, color) => ({
    padding: "5px 10px", borderRadius: 14, fontSize: 11, fontWeight: 700, cursor: "pointer",
    transition: "all .2s", whiteSpace: "nowrap",
    border: `2px solid ${active ? color : "var(--mist)"}`,
    background: active ? (color === "var(--ocean)" ? "var(--ocean-light)" : "#FAF5FF") : "transparent",
    color: active ? color : "var(--stone)",
  });

  const restaurants = profile.restaurants ?? { american: true, mexican: true, asian: false, italian: false, seafood: false, other: false, none: false };

  return (
    <div className="step-enter" style={{ maxWidth: 620, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4, marginTop: 8 }}>
        <span style={{ fontSize: 32 }}>👨‍👩‍👧‍👦</span>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>Tell Us About Your Family</h2>
          <p style={{ color: "var(--stone)", fontSize: 11, marginTop: 1 }}>We&apos;ll build an itinerary around your kids&apos; routine.</p>
        </div>
      </div>

      <div style={{ background: "var(--cloud)", borderRadius: 16, padding: 18, border: "1px solid var(--mist)", boxShadow: "0 2px 10px rgba(0,0,0,.04)" }}>
        {/* Destination + Date + Days + Adults */}
        <div className="trip-fields-grid">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--stone)", whiteSpace: "nowrap" }}>Destination</label>
            <input style={{ ...S, padding: "7px 10px", fontSize: 12 }} type="text" value={profile.destination} onChange={e => setProfile({ ...profile, destination: e.target.value })} placeholder="e.g. San Diego" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--stone)", whiteSpace: "nowrap" }}>Date</label>
            <input style={{ ...S, padding: "7px 10px", fontSize: 12 }} type="date" value={profile.start_date} onChange={e => setProfile({ ...profile, start_date: e.target.value })} />
          </div>
          <div className="trip-days-adults">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--stone)", whiteSpace: "nowrap" }}>Days</label>
              <input style={{ ...S, padding: "7px 10px", fontSize: 12 }} type="number" value={daysInput} onChange={e => setDaysInput(e.target.value)} onBlur={() => { const v = Math.max(1, parseInt(daysInput) || 1); setDaysInput(String(v)); setProfile(p => ({ ...p, trip_length_days: v })); }} min={1} max={21} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--stone)", whiteSpace: "nowrap" }}>Adults</label>
              <input style={{ ...S, padding: "7px 10px", fontSize: 12 }} type="number" value={adultsInput} onChange={e => setAdultsInput(e.target.value)} onBlur={() => { const v = Math.max(1, parseInt(adultsInput) || 1); setAdultsInput(String(v)); setProfile(p => ({ ...p, adults: v })); }} min={1} max={6} />
            </div>
          </div>
        </div>

        {/* Children */}
        <div style={{ marginBottom: 12 }}>
          <label style={L}>Children</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {profile.kids.map((kid, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--ocean-light)", borderRadius: 8, padding: "5px 8px" }}>
                <span style={{ fontSize: 14 }}>👶</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ocean)" }}>Age</span>
                <input type="number" min={0} max={17} value={kid.age} onChange={e => updateKid(i, e.target.value)} style={{ width: 38, padding: "2px 4px", borderRadius: 5, border: "2px solid transparent", fontSize: 12, fontWeight: 700, textAlign: "center", background: "#fff" }} />
                {profile.kids.length > 1 && <button onClick={() => removeKid(i)} style={{ background: "none", border: "none", color: "var(--stone)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>}
              </div>
            ))}
            <button onClick={addKid} style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--mist)", borderRadius: 8, padding: "5px 10px", border: "2px dashed var(--stone)", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--stone)" }}>+ Add Child</button>
          </div>
        </div>

        {/* Wake + Bed */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--stone)", whiteSpace: "nowrap" }}>🌅 Wake</label>
            <select style={{ ...S, padding: "7px 10px", fontSize: 12 }} value={profile.wake_time} onChange={e => setProfile({ ...profile, wake_time: e.target.value })}>
              {HALF_HOURS.filter(t => timeToMins(t) >= 300 && timeToMins(t) <= 600).map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--stone)", whiteSpace: "nowrap" }}>🌙 Bed</label>
            <select style={{ ...S, padding: "7px 10px", fontSize: 12 }} value={profile.bed_time} onChange={e => setProfile({ ...profile, bed_time: e.target.value })}>
              {HALF_HOURS.filter(t => timeToMins(t) >= 1020 && timeToMins(t) <= 1320).map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
            </select>
          </div>
        </div>

        {/* Naps */}
        <div style={{ marginBottom: 12 }}>
          <label style={L}>😴 Nap Times</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {profile.naps.map((nap, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFF9F0", borderRadius: 8, padding: "5px 10px", border: "1px solid #F0E6D6" }}>
                <span style={{ fontSize: 14 }}>😴</span>
                <select value={nap.start} onChange={e => updateNap(i, "start", e.target.value)} style={{ padding: "2px 4px", borderRadius: 5, border: "1.5px solid var(--mist)", fontSize: 11, fontWeight: 600, background: "#fff" }}>
                  {HALF_HOURS.filter(t => timeToMins(t) >= 540 && timeToMins(t) <= 1020).map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
                </select>
                <span style={{ fontSize: 10, color: "var(--stone)", fontWeight: 700 }}>for</span>
                <select value={nap.duration} onChange={e => updateNap(i, "duration", e.target.value)} style={{ padding: "2px 4px", borderRadius: 5, border: "1.5px solid var(--mist)", fontSize: 11, fontWeight: 600, background: "#fff" }}>
                  {DURATIONS.map(d => <option key={d} value={d}>{formatDuration(d)}</option>)}
                </select>
                <button onClick={() => removeNap(i)} style={{ background: "none", border: "none", color: "var(--stone)", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
              </div>
            ))}
            <button onClick={addNap} style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--mist)", borderRadius: 8, padding: "5px 10px", border: "2px dashed var(--stone)", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--stone)" }}>+ Add Nap</button>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <label style={L}>🌞 Outdoor</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, marginBottom: 10 }}>
            {OUTDOOR_PREFS.map(p => (
              <button key={p.key} onClick={() => togglePref(p.key)} style={prefBtn(profile.preferences[p.key], "var(--ocean)")}>{p.label}</button>
            ))}
          </div>
          <label style={L}>🏠 Indoor</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, marginBottom: 10 }}>
            {INDOOR_PREFS.map(p => (
              <button key={p.key} onClick={() => togglePref(p.key)} style={prefBtn(profile.preferences[p.key], "#7C3AED")}>{p.label}</button>
            ))}
          </div>
          <label style={L}>🍽️ Restaurants</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {RESTAURANT_PREFS.map(p => {
              const isNone = p.key === "none";
              const active = restaurants[p.key];
              const disabled = !isNone && restaurants.none;
              return (
                <button key={p.key} onClick={() => !disabled && toggleRestaurant(p.key)} style={{
                  padding: "5px 10px", borderRadius: 14, fontSize: 11, fontWeight: 700,
                  cursor: disabled ? "not-allowed" : "pointer", transition: "all .2s", whiteSpace: "nowrap",
                  border: `2px solid ${active ? (isNone ? "#9CA3AF" : "#DC2626") : "var(--mist)"}`,
                  background: active ? (isNone ? "#F3F4F6" : "#FFF5F5") : "transparent",
                  color: active ? (isNone ? "#6B7280" : "#DC2626") : disabled ? "#D1CCC6" : "var(--stone)",
                  opacity: disabled ? 0.5 : 1,
                }}>{p.label}</button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <button onClick={onNext} disabled={!ok} style={{
          padding: "12px 40px", borderRadius: 11, border: "none",
          background: ok ? "linear-gradient(135deg,var(--sunset),#F09A3A)" : "var(--mist)",
          color: ok ? "#fff" : "var(--stone)", fontSize: 14, fontWeight: 800,
          cursor: ok ? "pointer" : "not-allowed",
          boxShadow: ok ? "0 5px 16px rgba(232,100,58,.3)" : "none",
        }}>Find Activities →</button>
      </div>
    </div>
  );
}
