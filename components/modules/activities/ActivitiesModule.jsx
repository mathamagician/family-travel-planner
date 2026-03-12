"use client";

import { useState, useEffect } from "react";
import { TYPE_CONFIG, ENERGY_CONFIG, ENERGY_BY_TYPE, BOOKABLE_TYPES, VIATOR_PID } from "../../shared/config";
import { formatDuration } from "../../shared/utils";
import { fetchActivities, sortByPreference, autoSelectIds, getSampleActivities } from "./ActivitiesAgent";

/* ─── Module 2B: Activities UI ─────────────────────────────────────────────
   Displays activities for the selected destination.
   Handles selection, toggle, and generation.
   ────────────────────────────────────────────────────────────────────────── */

function ViatorButton({ activity, destination }) {
  const isBookable = BOOKABLE_TYPES.has(activity.type) || activity.booking_required || (activity.admission_adult_usd > 0);
  if (!isBookable) return null;
  const q = encodeURIComponent(`${activity.name} ${destination ?? ""}`.trim());
  const url = VIATOR_PID
    ? `https://www.viator.com/searchResults/all?text=${q}&pid=${VIATOR_PID}&mcid=42383&medium=link&campaign=familytravel`
    : `https://www.viator.com/searchResults/all?text=${q}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7,
        background: "#EEF6FF", border: "1px solid #60A5FA", color: "#1D4ED8",
        fontSize: 10, fontWeight: 800, textDecoration: "none",
      }}
    >
      🎟 Book tickets
    </a>
  );
}

function ActivityCard({ activity, selected, onToggle, index, destination, isNonPref }) {
  const c = TYPE_CONFIG[activity.type] || TYPE_CONFIG.attraction;
  const en = ENERGY_CONFIG[activity.energy ?? ENERGY_BY_TYPE[activity.type] ?? "med"];
  const showGray = isNonPref && !selected;
  const admissionText = activity.admission_adult_usd > 0
    ? `$${activity.admission_adult_usd}/adult${activity.admission_child_usd > 0 ? ` · $${activity.admission_child_usd}/child` : ""}`
    : (activity.admission_adult_usd === 0 ? "Free" : null);

  return (
    <div onClick={onToggle} style={{
      opacity: 0, animation: "slideUp .4s ease-out " + index * .04 + "s forwards",
      background: showGray ? "#F5F4F2" : "#fff", borderRadius: 12,
      border: showGray ? "2px dashed #D1CCC6" : "2px solid " + (selected ? c.color : "#E8E4DF"),
      cursor: "pointer", transition: "all .25s",
      boxShadow: selected ? "0 3px 12px " + c.color + "22" : "none",
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: 5, border: "2px solid " + (selected ? c.color : "#D1CCC6"), background: selected ? c.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {selected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
      </div>
      <div style={{ padding: "12px 12px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingRight: 24 }}>
          <span style={{ fontSize: 18 }}>{c.emoji}</span>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: showGray ? "var(--stone)" : "var(--ink)", lineHeight: 1.3 }}>{activity.name}</h3>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 5, flexWrap: "wrap" }}>
          <span style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: showGray ? "var(--stone)" : c.color, background: showGray ? "#EBEBEB" : c.bg, padding: "1px 6px", borderRadius: 4 }}>{activity.type}</span>
          {en && <span style={{ fontSize: 8, fontWeight: 800, color: showGray ? "var(--stone)" : en.color, background: showGray ? "#EBEBEB" : en.bg, padding: "1px 6px", borderRadius: 4 }}>{en.icon} {en.label}</span>}
          {admissionText && <span style={{ fontSize: 8, fontWeight: 700, color: admissionText === "Free" ? "#2D8A4E" : "#1C2B33", background: admissionText === "Free" ? "#F0FAF4" : "#F8F6F2", padding: "1px 6px", borderRadius: 4 }}>{admissionText}</span>}
        </div>
        <p style={{ fontSize: 11, color: "var(--stone)", lineHeight: 1.4, marginBottom: 6 }}>{activity.notes}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 10, color: "var(--stone)", marginBottom: 6 }}>
          <span>🕐 {activity.hours}</span>{formatDuration(activity.duration_mins) && <span>⏱️ {formatDuration(activity.duration_mins)}</span>}<span>👶 {activity.age_range}</span>
        </div>
        <ViatorButton activity={activity} destination={destination} />
      </div>
    </div>
  );
}

export default function ActivitiesModule({ profile, activities, setActivities, selectedIds, setSelectedIds, onNext, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { activities: list } = await fetchActivities(profile);
      setActivities(list);
      setSelectedIds(autoSelectIds(list, profile.preferences));
    } catch (e) {
      console.error(e);
      setError("Generation failed: " + e.message);
      if (!activities.length) {
        const fallback = getSampleActivities();
        setActivities(fallback);
        setSelectedIds(new Set(fallback.map(a => a.id)));
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on first visit to this step
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!activities.length) { generate(); } }, []);

  const toggle = (id) => {
    const n = new Set(selectedIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedIds(n);
  };

  const { preferred, nonPreferred } = sortByPreference(activities, profile.preferences);

  // 3-state toggle: All → Preferred Only → None → All
  const allSelected = activities.length > 0 && selectedIds.size === activities.length;
  const prefOnlySelected = activities.length > 0 && preferred.length > 0 && preferred.every(a => selectedIds.has(a.id)) && nonPreferred.every(a => !selectedIds.has(a.id));
  const cycleSelection = () => {
    if (allSelected) setSelectedIds(new Set(preferred.map(a => a.id)));
    else if (prefOnlySelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(activities.map(a => a.id)));
  };
  const toggleLabel = allSelected ? "Preferred Only" : prefOnlySelected ? "Deselect All" : "Select All";

  const NavRow = ({ compact }) => (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8, maxWidth: 1060, margin: compact ? "16px auto 10px" : "0 auto 14px" }}>
      <button onClick={onBack} style={{ padding: "7px 14px", borderRadius: 9, border: "2px solid var(--mist)", background: "transparent", color: "var(--stone)", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>← Family</button>
      {!compact && <>
        <button onClick={generate} disabled={loading} style={{ padding: "7px 16px", borderRadius: 9, border: "2px solid var(--ocean)", background: loading ? "var(--ocean-light)" : "var(--cloud)", color: "var(--ocean)", fontSize: 11, fontWeight: 700, cursor: loading ? "wait" : "pointer", animation: loading ? "pulse 1.5s infinite" : "none" }}>{loading ? "Generating..." : "✨ Generate with AI"}</button>
        {activities.length > 0 && (
          <button onClick={cycleSelection} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: "2px solid var(--mist)", background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--stone)" }}>
            <div style={{ width: 15, height: 15, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid " + (allSelected ? "var(--ocean)" : prefOnlySelected ? "var(--sunset)" : "var(--stone)"), background: allSelected ? "var(--ocean)" : prefOnlySelected ? "var(--sunset)" : "transparent" }}>
              {(allSelected || prefOnlySelected) && <span style={{ color: "#fff", fontSize: 9, fontWeight: 800 }}>{allSelected ? "✓" : "★"}</span>}
            </div>
            {toggleLabel}
          </button>
        )}
        {activities.length > 0 && <span style={{ fontSize: 11, color: "var(--stone)", fontWeight: 600 }}>{selectedIds.size}/{activities.length}</span>}
      </>}
      {compact && <>
        <div style={{ flex: 1, height: 1, background: "var(--mist)", minWidth: 20 }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--stone)" }}>Other Activities</span>
        <div style={{ flex: 1, height: 1, background: "var(--mist)", minWidth: 20 }} />
      </>}
      <button onClick={onNext} disabled={!selectedIds.size} style={{ padding: "7px 16px", borderRadius: 9, border: "none", background: selectedIds.size ? "linear-gradient(135deg,var(--sunset),#F09A3A)" : "var(--mist)", color: selectedIds.size ? "#fff" : "var(--stone)", fontSize: 11, fontWeight: 800, cursor: selectedIds.size ? "pointer" : "not-allowed", boxShadow: selectedIds.size ? "0 4px 12px rgba(232,100,58,.3)" : "none", flexShrink: 0 }}>Build Itinerary →</button>
    </div>
  );

  return (
    <div className="step-enter">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8, marginTop: 8 }}>
        <span style={{ fontSize: 28 }}>🎯</span>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800 }}>Activities in {profile.destination}</h2>
          <p style={{ color: "var(--stone)", fontSize: 11, marginTop: 1 }}>Preferred activities are pre-selected. Others appear below.</p>
        </div>
      </div>

      <NavRow compact={false} />

      {error && <div style={{ background: "var(--sunset-light)", borderRadius: 9, padding: "8px 12px", marginBottom: 12, maxWidth: 1060, margin: "0 auto 12px" }}><p style={{ color: "var(--sunset)", fontSize: 11, margin: 0 }}>{error}</p></div>}

      {activities.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "36px 24px", maxWidth: 460, margin: "0 auto" }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🗺️</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>Ready to explore {profile.destination}?</h3>
          <p style={{ fontSize: 12, color: "var(--stone)", lineHeight: 1.5, marginBottom: 16 }}>Hit "Generate with AI" above to find family-friendly activities.</p>
          <button onClick={generate} style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,var(--ocean),#0EA5A3)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(11,122,142,.3)" }}>✨ Generate Activities</button>
        </div>
      )}

      {/* Preferred activities */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12, maxWidth: 1060, margin: "0 auto" }}>
        {preferred.map((a, i) => <ActivityCard key={a.id} activity={a} selected={selectedIds.has(a.id)} onToggle={() => toggle(a.id)} index={i} destination={profile.destination} isNonPref={false} />)}
      </div>

      {nonPreferred.length > 0 && <NavRow compact={true} />}

      {/* Non-preferred activities */}
      {nonPreferred.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12, maxWidth: 1060, margin: "0 auto" }}>
          {nonPreferred.map((a, i) => <ActivityCard key={a.id} activity={a} selected={selectedIds.has(a.id)} onToggle={() => toggle(a.id)} index={preferred.length + i} destination={profile.destination} isNonPref={!selectedIds.has(a.id)} />)}
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
        <button onClick={onBack} style={{ padding: "10px 24px", borderRadius: 9, border: "2px solid var(--mist)", background: "transparent", color: "var(--stone)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>← Family</button>
        <button onClick={onNext} disabled={!selectedIds.size} style={{ padding: "10px 32px", borderRadius: 9, border: "none", background: selectedIds.size ? "linear-gradient(135deg,var(--sunset),#F09A3A)" : "var(--mist)", color: selectedIds.size ? "#fff" : "var(--stone)", fontSize: 12, fontWeight: 800, cursor: selectedIds.size ? "pointer" : "not-allowed", boxShadow: selectedIds.size ? "0 5px 16px rgba(232,100,58,.3)" : "none" }}>Build Itinerary →</button>
      </div>
    </div>
  );
}
