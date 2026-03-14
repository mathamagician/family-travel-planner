"use client";

import { useState, useEffect } from "react";
import { fetchRestaurants, sortByPreference, autoSelectIds, getSampleRestaurants } from "./RestaurantsAgent";

/* ─── Module RB: Restaurants UI ──────────────────────────────────────────
   Displays restaurants for the selected destination.
   Handles selection, toggle, and generation.
   ────────────────────────────────────────────────────────────────────────── */

const CUISINE_CONFIG = {
  american:      { emoji: "🍔", color: "#DC2626", bg: "#FFF5F5" },
  mexican:       { emoji: "🌮", color: "#D97706", bg: "#FFFBEB" },
  asian:         { emoji: "🍜", color: "#0B7A8E", bg: "#EEFBFD" },
  italian:       { emoji: "🍕", color: "#2D8A4E", bg: "#F0FAF4" },
  seafood:       { emoji: "🦞", color: "#1D4ED8", bg: "#EEF6FF" },
  pizza:         { emoji: "🍕", color: "#CF4B3A", bg: "#FEF2F1" },
  bbq:           { emoji: "🔥", color: "#B45309", bg: "#FFF9F0" },
  mediterranean: { emoji: "🫒", color: "#6B7234", bg: "#F5F5EB" },
  southern:      { emoji: "🍗", color: "#B45309", bg: "#FFFBEB" },
  brunch:        { emoji: "🥞", color: "#D97706", bg: "#FFFBEB" },
  cafe:          { emoji: "☕", color: "#7C3AED", bg: "#FAF5FF" },
  other:         { emoji: "🍽️", color: "#4F46E5", bg: "#F5F3FF" },
};

const MEAL_BADGE = {
  lunch:  { label: "Lunch", color: "#D97706", bg: "#FFFBEB" },
  dinner: { label: "Dinner", color: "#7C3AED", bg: "#FAF5FF" },
  both:   { label: "Lunch & Dinner", color: "#0B7A8E", bg: "#EEFBFD" },
};

const NOISE_ICON = { quiet: "🤫", moderate: "🔊", loud: "📢" };

function RestaurantCard({ restaurant, selected, onToggle, index, isNonPref }) {
  const c = CUISINE_CONFIG[restaurant.cuisine] || CUISINE_CONFIG.other;
  const meal = MEAL_BADGE[restaurant.meal_type] || MEAL_BADGE.both;
  const showGray = isNonPref && !selected;

  return (
    <div onClick={onToggle} style={{
      opacity: 0, animation: "slideUp .4s ease-out " + index * .04 + "s forwards",
      background: showGray ? "#F5F4F2" : "#fff", borderRadius: 12,
      border: showGray ? "2px dashed #D1CCC6" : "2px solid " + (selected ? c.color : "#E8E4DF"),
      cursor: "pointer", transition: "all .25s",
      boxShadow: selected ? "0 3px 12px " + c.color + "22" : "none",
      position: "relative",
    }}>
      {/* Selection checkbox */}
      <div style={{ position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: 5, border: "2px solid " + (selected ? c.color : "#D1CCC6"), background: selected ? c.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {selected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
      </div>

      <div style={{ padding: "12px 12px 10px" }}>
        {/* Name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingRight: 24 }}>
          <span style={{ fontSize: 18 }}>{c.emoji}</span>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: showGray ? "var(--stone)" : "var(--ink)", lineHeight: 1.3 }}>{restaurant.name}</h3>
        </div>

        {/* Badges row */}
        <div style={{ display: "flex", gap: 4, marginBottom: 5, flexWrap: "wrap" }}>
          <span style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: showGray ? "var(--stone)" : c.color, background: showGray ? "#EBEBEB" : c.bg, padding: "1px 6px", borderRadius: 4 }}>{restaurant.cuisine}</span>
          <span style={{ fontSize: 8, fontWeight: 800, color: showGray ? "var(--stone)" : meal.color, background: showGray ? "#EBEBEB" : meal.bg, padding: "1px 6px", borderRadius: 4 }}>{meal.label}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: restaurant.price_range === "$" ? "#2D8A4E" : "#1C2B33", background: restaurant.price_range === "$" ? "#F0FAF4" : "#F8F6F2", padding: "1px 6px", borderRadius: 4 }}>{restaurant.price_range} · ~${restaurant.avg_meal_usd}/person</span>
        </div>

        {/* Notes */}
        <p style={{ fontSize: 11, color: "var(--stone)", lineHeight: 1.4, marginBottom: 6 }}>{restaurant.notes}</p>

        {/* Info row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 10, color: "var(--stone)", marginBottom: 4 }}>
          <span>🕐 {restaurant.hours}</span>
          <span>⏱️ ~{restaurant.duration_mins}min</span>
          {restaurant.noise_level && <span>{NOISE_ICON[restaurant.noise_level]} {restaurant.noise_level}</span>}
        </div>

        {/* Amenities row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 9, color: "var(--stone)" }}>
          {restaurant.kid_menu && <span style={{ background: "#F0FAF4", color: "#2D8A4E", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>👶 Kids menu</span>}
          {restaurant.highchairs && <span style={{ background: "#F0FAF4", color: "#2D8A4E", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>🪑 Highchairs</span>}
          {restaurant.outdoor_seating && <span style={{ background: "#EEFBFD", color: "#0B7A8E", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>🌤️ Patio</span>}
          {restaurant.changing_tables && <span style={{ background: "#FAF5FF", color: "#7C3AED", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>🚼 Changing table</span>}
          {restaurant.reservation_recommended && <span style={{ background: "#FFF5F5", color: "#DC2626", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>📞 Reserve</span>}
        </div>
      </div>
    </div>
  );
}

export default function RestaurantsModule({ profile, restaurants, setRestaurants, selectedIds, setSelectedIds, onNext, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { restaurants: list } = await fetchRestaurants(profile);
      setRestaurants(list);
      setSelectedIds(autoSelectIds(list, profile.restaurants));
    } catch (e) {
      console.error(e);
      setError("Generation failed: " + e.message);
      if (!restaurants.length) {
        const fallback = getSampleRestaurants();
        setRestaurants(fallback);
        setSelectedIds(new Set(fallback.map(r => r.id)));
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on first visit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!restaurants.length) { generate(); } }, []);

  const toggle = (id) => {
    const n = new Set(selectedIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedIds(n);
  };

  const { preferred, nonPreferred } = sortByPreference(restaurants, profile.restaurants);

  // 3-state toggle: All → Preferred Only → None → All
  const allSelected = restaurants.length > 0 && selectedIds.size === restaurants.length;
  const prefOnlySelected = restaurants.length > 0 && preferred.length > 0 && preferred.every(r => selectedIds.has(r.id)) && nonPreferred.every(r => !selectedIds.has(r.id));
  const cycleSelection = () => {
    if (allSelected) setSelectedIds(new Set(preferred.map(r => r.id)));
    else if (prefOnlySelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(restaurants.map(r => r.id)));
  };
  const toggleLabel = allSelected ? "Preferred Only" : prefOnlySelected ? "Deselect All" : "Select All";

  const NavRow = ({ compact }) => (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8, maxWidth: 1060, margin: compact ? "16px auto 10px" : "0 auto 14px" }}>
      <button onClick={onBack} style={{ padding: "7px 14px", borderRadius: 9, border: "2px solid var(--mist)", background: "transparent", color: "var(--stone)", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>← Activities</button>
      {!compact && <>
        <button onClick={generate} disabled={loading} style={{ padding: "7px 16px", borderRadius: 9, border: "2px solid var(--ocean)", background: loading ? "var(--ocean-light)" : "var(--cloud)", color: "var(--ocean)", fontSize: 11, fontWeight: 700, cursor: loading ? "wait" : "pointer", animation: loading ? "pulse 1.5s infinite" : "none" }}>{loading ? "Generating..." : "✨ Generate with AI"}</button>
        {restaurants.length > 0 && (
          <button onClick={cycleSelection} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: "2px solid var(--mist)", background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--stone)" }}>
            <div style={{ width: 15, height: 15, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid " + (allSelected ? "var(--ocean)" : prefOnlySelected ? "var(--sunset)" : "var(--stone)"), background: allSelected ? "var(--ocean)" : prefOnlySelected ? "var(--sunset)" : "transparent" }}>
              {(allSelected || prefOnlySelected) && <span style={{ color: "#fff", fontSize: 9, fontWeight: 800 }}>{allSelected ? "✓" : "★"}</span>}
            </div>
            {toggleLabel}
          </button>
        )}
        {restaurants.length > 0 && <span style={{ fontSize: 11, color: "var(--stone)", fontWeight: 600 }}>{selectedIds.size}/{restaurants.length}</span>}
      </>}
      {compact && <>
        <div style={{ flex: 1, height: 1, background: "var(--mist)", minWidth: 20 }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--stone)" }}>Other Restaurants</span>
        <div style={{ flex: 1, height: 1, background: "var(--mist)", minWidth: 20 }} />
      </>}
      <button onClick={onNext} disabled={!selectedIds.size} style={{ padding: "7px 16px", borderRadius: 9, border: "none", background: selectedIds.size ? "linear-gradient(135deg,var(--sunset),#F09A3A)" : "var(--mist)", color: selectedIds.size ? "#fff" : "var(--stone)", fontSize: 11, fontWeight: 800, cursor: selectedIds.size ? "pointer" : "not-allowed", boxShadow: selectedIds.size ? "0 4px 12px rgba(232,100,58,.3)" : "none", flexShrink: 0 }}>Build Itinerary →</button>
    </div>
  );

  return (
    <div className="step-enter">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8, marginTop: 8 }}>
        <span style={{ fontSize: 28 }}>🍽️</span>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800 }}>Restaurants in {profile.destination}</h2>
          <p style={{ color: "var(--stone)", fontSize: 11, marginTop: 1 }}>Preferred cuisines are pre-selected. Selected restaurants will be added to your schedule.</p>
        </div>
      </div>

      <NavRow compact={false} />

      {error && <div style={{ background: "var(--sunset-light)", borderRadius: 9, padding: "8px 12px", marginBottom: 12, maxWidth: 1060, margin: "0 auto 12px" }}><p style={{ color: "var(--sunset)", fontSize: 11, margin: 0 }}>{error}</p></div>}

      {restaurants.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "36px 24px", maxWidth: 460, margin: "0 auto" }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🍽️</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>Find family-friendly restaurants in {profile.destination}</h3>
          <p style={{ fontSize: 12, color: "var(--stone)", lineHeight: 1.5, marginBottom: 16 }}>Hit "Generate with AI" above to discover kid-friendly dining spots.</p>
          <button onClick={generate} style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,var(--ocean),#0EA5A3)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(11,122,142,.3)" }}>✨ Generate Restaurants</button>
        </div>
      )}

      {/* Preferred restaurants */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, maxWidth: 1060, margin: "0 auto" }}>
        {preferred.map((r, i) => <RestaurantCard key={r.id} restaurant={r} selected={selectedIds.has(r.id)} onToggle={() => toggle(r.id)} index={i} isNonPref={false} />)}
      </div>

      {nonPreferred.length > 0 && <NavRow compact={true} />}

      {/* Non-preferred restaurants */}
      {nonPreferred.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, maxWidth: 1060, margin: "0 auto" }}>
          {nonPreferred.map((r, i) => <RestaurantCard key={r.id} restaurant={r} selected={selectedIds.has(r.id)} onToggle={() => toggle(r.id)} index={preferred.length + i} isNonPref={!selectedIds.has(r.id)} />)}
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
        <button onClick={onBack} style={{ padding: "10px 24px", borderRadius: 9, border: "2px solid var(--mist)", background: "transparent", color: "var(--stone)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>← Activities</button>
        <button onClick={onNext} disabled={!selectedIds.size} style={{ padding: "10px 32px", borderRadius: 9, border: "none", background: selectedIds.size ? "linear-gradient(135deg,var(--sunset),#F09A3A)" : "var(--mist)", color: selectedIds.size ? "#fff" : "var(--stone)", fontSize: 12, fontWeight: 800, cursor: selectedIds.size ? "pointer" : "not-allowed", boxShadow: selectedIds.size ? "0 5px 16px rgba(232,100,58,.3)" : "none" }}>Build Itinerary →</button>
      </div>
    </div>
  );
}
