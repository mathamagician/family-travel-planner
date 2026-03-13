"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INK = "#1C2B33";
const OCEAN = "#0B7A8E";
const SUNSET = "#E8643A";
const STONE = "#8A9BA5";
const MIST = "#F0EDE8";

const TYPE_EMOJI = {
  attraction: "🎡", museum: "🏛️", park: "🌳", beach: "🏖️",
  zoo: "🦁", aquarium: "🐠", playground: "🛝", hike: "🥾",
  show: "🎭", shopping: "🛍️", food: "🍕", garden: "🌷",
  landmark: "📍", water_park: "💦", theme_park: "🎢", farm: "🐄",
  tour: "🚌", sports: "⚽", custom: "📌",
};

const DURATION_LABELS = {
  full_day: "Full Day", half_day: "Half Day",
  "2-4h": "2–4 hours", "1-2h": "1–2 hours", "<1h": "Under 1 hour",
};

export default function DestinationActivities({ activities, city, planUrl }) {
  const router = useRouter();
  const [selected, setSelected] = useState(new Set(activities.map(a => a.id)));
  const [detail, setDetail] = useState(null);

  const toggleOne = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const selectAll = () => setSelected(new Set(activities.map(a => a.id)));
  const selectNone = () => setSelected(new Set());
  const allSelected = selected.size === activities.length;

  const handlePlanTrip = () => {
    // Store preselected activity names in sessionStorage for the planner to pick up
    const names = activities.filter(a => selected.has(a.id)).map(a => a.name);
    try { sessionStorage.setItem("toddlertrip_dest_preselect", JSON.stringify(names)); } catch {}
    router.push(planUrl);
  };

  return (
    <>
      {/* Select controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, margin: 0 }}>
          Top Family Activities
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: STONE }}>{selected.size} of {activities.length} selected</span>
          <button onClick={allSelected ? selectNone : selectAll}
            style={{ fontSize: 11, fontWeight: 800, color: OCEAN, background: "#E6F6F8", border: `1.5px solid ${OCEAN}33`, borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        </div>
      </div>

      {/* Activity grid */}
      <div className="act-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {activities.map((a) => {
          const emoji = TYPE_EMOJI[a.type] || TYPE_EMOJI.custom;
          const isSelected = selected.has(a.id);
          return (
            <div key={a.id} className="act-card"
              onClick={() => setDetail(a)}
              style={{
                background: "#fff", borderRadius: 14, padding: "18px 16px",
                border: `2px solid ${isSelected ? OCEAN : MIST}`,
                cursor: "pointer", position: "relative",
                boxShadow: isSelected ? `0 2px 10px ${OCEAN}18` : "none",
              }}>
              {/* Checkbox */}
              <div
                onClick={(e) => { e.stopPropagation(); toggleOne(a.id); }}
                style={{
                  position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: 6,
                  border: `2px solid ${isSelected ? OCEAN : "#D1CCC6"}`,
                  background: isSelected ? OCEAN : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>
                {isSelected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 28 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: INK, marginBottom: 4, lineHeight: 1.3 }}>{a.name}</h3>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                    {a.duration_category && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#E6F6F8", color: OCEAN, borderRadius: 6, padding: "2px 7px" }}>
                        {DURATION_LABELS[a.duration_category] || a.duration_category}
                      </span>
                    )}
                    {a.age_min != null && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#FAF5FF", color: "#7C3AED", borderRadius: 6, padding: "2px 7px" }}>
                        Ages {a.age_min}–{a.age_max ?? "12"}+
                      </span>
                    )}
                    {a.stroller_accessible && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#F0FAF4", color: "#2D8A4E", borderRadius: 6, padding: "2px 7px" }}>
                        Stroller OK
                      </span>
                    )}
                  </div>
                  {a.ai_tips && (
                    <p style={{ fontSize: 12, color: STONE, lineHeight: 1.5, fontWeight: 600, margin: 0 }}>
                      {a.ai_tips.length > 120 ? a.ai_tips.slice(0, 120) + "..." : a.ai_tips}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan CTA with selected count */}
      <div style={{ textAlign: "center", marginTop: 28 }}>
        <button onClick={handlePlanTrip} className="dest-cta" disabled={selected.size === 0}
          style={{ opacity: selected.size === 0 ? 0.5 : 1 }}>
          ✨ Plan a Trip to {city} ({selected.size} activities)
        </button>
      </div>

      {/* ── Detail Modal ── */}
      {detail && (
        <div onClick={() => setDetail(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 18, padding: "28px 26px", maxWidth: 520, width: "100%", maxHeight: "85vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>{TYPE_EMOJI[detail.type] || "📌"}</span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: INK, margin: 0, lineHeight: 1.3 }}>{detail.name}</h3>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: 22, color: STONE, cursor: "pointer", flexShrink: 0 }}>&times;</button>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: "#E6F6F8", color: OCEAN, borderRadius: 6, padding: "3px 9px" }}>{detail.type}</span>
              {detail.duration_category && <span style={{ fontSize: 11, fontWeight: 700, background: "#E6F6F8", color: OCEAN, borderRadius: 6, padding: "3px 9px" }}>{DURATION_LABELS[detail.duration_category] || detail.duration_category}</span>}
              {detail.age_min != null && <span style={{ fontSize: 11, fontWeight: 700, background: "#FAF5FF", color: "#7C3AED", borderRadius: 6, padding: "3px 9px" }}>Ages {detail.age_min}–{detail.age_max ?? "12"}+</span>}
              {detail.stroller_accessible && <span style={{ fontSize: 11, fontWeight: 700, background: "#F0FAF4", color: "#2D8A4E", borderRadius: 6, padding: "3px 9px" }}>Stroller Accessible</span>}
              {detail.food_onsite && <span style={{ fontSize: 11, fontWeight: 700, background: "#FFF9F0", color: "#B45309", borderRadius: 6, padding: "3px 9px" }}>Food On-Site</span>}
            </div>

            {/* Details grid */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", fontSize: 13, marginBottom: 16 }}>
              {detail.address && <><span style={{ fontWeight: 800, color: INK }}>Location</span><span style={{ color: STONE, fontWeight: 600 }}>{detail.address}</span></>}
              {detail.hours && <><span style={{ fontWeight: 800, color: INK }}>Hours</span><span style={{ color: STONE, fontWeight: 600 }}>{detail.hours}</span></>}
              {detail.admission_adult_usd != null && (
                <><span style={{ fontWeight: 800, color: INK }}>Admission</span>
                <span style={{ color: STONE, fontWeight: 600 }}>
                  {detail.admission_adult_usd === 0 ? "Free" : `$${detail.admission_adult_usd}/adult`}
                  {detail.admission_child_usd > 0 ? ` · $${detail.admission_child_usd}/child` : ""}
                </span></>
              )}
              {detail.duration_mins_typical && <><span style={{ fontWeight: 800, color: INK }}>Typical Duration</span><span style={{ color: STONE, fontWeight: 600 }}>{detail.duration_mins_typical} min</span></>}
            </div>

            {/* Tips / Description */}
            {detail.ai_tips && (
              <div style={{ background: "#FAFAF7", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: OCEAN, marginBottom: 6 }}>Tips</div>
                <p style={{ fontSize: 13, color: STONE, fontWeight: 600, lineHeight: 1.7, margin: 0 }}>{detail.ai_tips}</p>
              </div>
            )}

            {/* Tags list */}
            {detail.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {detail.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 700, color: STONE, background: `${MIST}`, borderRadius: 10, padding: "3px 8px" }}>#{t}</span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { toggleOne(detail.id); }}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${selected.has(detail.id) ? OCEAN : MIST}`, background: selected.has(detail.id) ? "#E6F6F8" : "#fff", color: selected.has(detail.id) ? OCEAN : STONE, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                {selected.has(detail.id) ? "✓ Selected" : "Select Activity"}
              </button>
              {detail.booking_url && (
                <a href={detail.booking_url} target="_blank" rel="noopener noreferrer"
                  style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`, color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center" }}>
                  Book &rarr;
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
