"use client";

import { useState, useMemo, useEffect } from "react";
import { generatePackingList, fetchAIPackingList } from "./PackingAgent";

/* ─── Module 4B: Packing List UI ──────────────────────────────────────────
   Displays packing checklist organized by category.
   Categories collapsed by default for space efficiency.
   ────────────────────────────────────────────────────────────────────────── */

const CATEGORY_CONFIG = {
  documents:     { emoji: "📄", label: "Documents & IDs" },
  clothing:      { emoji: "👕", label: "Clothing" },
  baby_gear:     { emoji: "🍼", label: "Baby & Toddler Gear" },
  toiletries:    { emoji: "🧴", label: "Toiletries & Hygiene" },
  health_safety: { emoji: "🩹", label: "Health & Safety" },
  activities:    { emoji: "🎒", label: "Activities & Entertainment" },
  snacks:        { emoji: "🍎", label: "Snacks & Food" },
  tech:          { emoji: "📱", label: "Tech & Electronics" },
  outdoor:       { emoji: "🏕️", label: "Outdoor Gear" },
  misc:          { emoji: "📦", label: "Miscellaneous" },
};

const CATEGORY_ORDER = ["documents", "health_safety", "baby_gear", "clothing", "toiletries", "snacks", "activities", "tech", "outdoor", "misc"];

const AMAZON_TAG   = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG ?? "familytravel0a-20";
const BABYQUIP_URL = process.env.NEXT_PUBLIC_BABYQUIP_URL ?? "https://www.babyquip.com?a=b33db96";

const RENTABLE = /crib|stroller|car\s*seat|high\s*chair|highchair|booster\s*seat|play\s*yard|playpen|pack.n.play|pack\s*n\s*play|bassinet|bouncer|baby\s*swing|portable\s*(crib|seat|high)/i;

function BabyQuipRentButton({ name }) {
  if (!RENTABLE.test(name)) return null;
  return (
    <a href={BABYQUIP_URL} target="_blank" rel="noopener noreferrer"
      style={{
        display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6,
        background: "#FDF2F8", border: "1px solid #EC4899", color: "#BE185D",
        fontSize: 9, fontWeight: 800, textDecoration: "none", marginLeft: 4,
      }}
      onClick={e => e.stopPropagation()}
    >
      🏠 Rent it
    </a>
  );
}

function BabyQuipBanner() {
  return (
    <a href={BABYQUIP_URL} target="_blank" rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "center", gap: 12,
        background: "linear-gradient(135deg,#FDF2F8,#FFF0FB)",
        border: "1.5px solid #EC4899", borderRadius: 14, padding: "12px 16px",
        marginBottom: 14, textDecoration: "none",
      }}
    >
      <span style={{ fontSize: 28, flexShrink: 0 }}>🚼</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#BE185D", marginBottom: 2 }}>
          Skip packing the bulky stuff!
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9D174D", lineHeight: 1.4 }}>
          Rent cribs, strollers, car seats & more — delivered to your destination via BabyQuip.
        </div>
      </div>
      <div style={{
        flexShrink: 0, padding: "7px 14px", borderRadius: 9,
        background: "#EC4899", color: "#fff", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap",
      }}>
        Rent Gear →
      </div>
    </a>
  );
}

function AffiliateButton({ searchQuery }) {
  if (!searchQuery) return null;
  const url = `https://www.amazon.com/s?tag=${AMAZON_TAG}&k=${encodeURIComponent(searchQuery)}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{
        display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6,
        background: "#FFF3E0", border: "1px solid #F59E0B", color: "#B45309",
        fontSize: 9, fontWeight: 800, textDecoration: "none", marginLeft: 4,
      }}
      onClick={e => e.stopPropagation()}
    >
      🛒 Buy
    </a>
  );
}

function PackingChip({ item, onToggle }) {
  return (
    <div
      onClick={() => onToggle(item.id)}
      title={[item.name, item.quantity_note, item.notes].filter(Boolean).join(" — ")}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px",
        borderRadius: 6, cursor: "pointer",
        background: item.packed ? "#F0FAF4" : item.essential ? "#FFF9F0" : "#fff",
        border: `1.5px solid ${item.packed ? "#2D8A4E44" : item.essential ? "#F59E0B44" : "#E8E4DF"}`,
        transition: "background .15s",
        opacity: item.packed ? 0.65 : 1,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{
        width: 13, height: 13, borderRadius: 3, flexShrink: 0,
        border: `1.5px solid ${item.packed ? "#2D8A4E" : "#D1CCC6"}`,
        background: item.packed ? "#2D8A4E" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {item.packed && <span style={{ color: "#fff", fontSize: 8, fontWeight: 800, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{
        fontSize: 11, fontWeight: item.packed ? 600 : 700,
        color: item.packed ? "#8A9BA5" : "#1C2B33",
        textDecoration: item.packed ? "line-through" : "none",
      }}>{item.name}</span>
      {item.essential && !item.packed && (
        <span style={{ fontSize: 7, fontWeight: 800, color: "#B45309", lineHeight: 1 }}>★</span>
      )}
      {item.quantity_note && !item.packed && (
        <span style={{ fontSize: 9, color: "#8A9BA5", fontWeight: 600 }}>{item.quantity_note}</span>
      )}
    </div>
  );
}

function CategorySection({ category, items, onToggle, collapsed, onToggleCollapse }) {
  const cfg = CATEGORY_CONFIG[category] || { emoji: "📦", label: category };
  const packed = items.filter(i => i.packed).length;
  const allDone = packed === items.length;

  return (
    <div style={{ marginBottom: 10, borderBottom: "1px solid #F0EDE8", paddingBottom: 10 }}>
      {/* Single-line: category label + inline chips */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {/* Category label — clickable to collapse */}
        <button
          onClick={onToggleCollapse}
          style={{
            display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
            background: "none", border: "none", cursor: "pointer", padding: "3px 0",
            fontFamily: "'Nunito',sans-serif",
          }}
        >
          <span style={{ fontSize: 15 }}>{cfg.emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: allDone ? "#2D8A4E" : "#1C2B33", whiteSpace: "nowrap" }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: allDone ? "#2D8A4E" : "#8A9BA5" }}>
            {packed}/{items.length}
          </span>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#1C2B33", lineHeight: 1 }}>{collapsed ? "▸" : "▾"}</span>
        </button>

        {/* Inline chips + affiliate links — visible when expanded */}
        {!collapsed && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1, minWidth: 0, alignItems: "center" }}>
            {items.map(item => (
              <span key={item.id} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                <PackingChip item={item} onToggle={onToggle} />
                {!item.packed && item.affiliate_search && <AffiliateButton searchQuery={item.affiliate_search} />}
                {!item.packed && RENTABLE.test(item.name) && <BabyQuipRentButton name={item.name} />}
              </span>
            ))}
          </div>
        )}

        {/* Mini checkboxes — visible when collapsed */}
        {collapsed && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3, minWidth: 0, flexWrap: "wrap" }}>
            {items.map(item => (
              <div
                key={item.id}
                title={item.name}
                onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
                style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0, cursor: "pointer",
                  border: `1.5px solid ${item.packed ? "#2D8A4E" : "#D1CCC6"}`,
                  background: item.packed ? "#2D8A4E" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background .15s",
                }}
              >
                {item.packed && <span style={{ color: "#fff", fontSize: 7, fontWeight: 800, lineHeight: 1 }}>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PackingModule({ profile, activities, destination, savedItems, savedGenerated, onItemsChange, onGeneratedChange }) {
  const [items, setItems] = useState(savedItems ?? []);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  // Categories collapsed by default for space efficiency
  const [collapsed, setCollapsed] = useState(() => {
    const initial = {};
    CATEGORY_ORDER.forEach(cat => { initial[cat] = true; });
    return initial;
  });
  const [filter, setFilter] = useState("all");

  // Generate list on mount from static master list
  useEffect(() => {
    if (savedItems?.length) return;
    const filtered = generatePackingList(profile, destination, activities);
    setItems(filtered);
    onGeneratedChange?.(true);
  }, []);

  // Sync state up to parent
  useEffect(() => { onItemsChange?.(items); }, [items]);

  const refilter = () => {
    const filtered = generatePackingList(profile, destination, activities);
    setItems(filtered);
    setFilter("all");
  };

  const customizeWithAI = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const aiItems = await fetchAIPackingList(profile, activities, destination);
      setItems(aiItems);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleItem = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, packed: !i.packed } : i));
  const toggleCollapse = (cat) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  // 3-state bulk check: None → Essentials → All → None
  const allPacked = items.length > 0 && items.every(i => i.packed);
  const essentialsPacked = !allPacked && items.filter(i => i.essential).length > 0 &&
    items.filter(i => i.essential).every(i => i.packed) &&
    items.filter(i => !i.essential).every(i => !i.packed);
  const nonePacked = items.every(i => !i.packed);
  const cyclePacked = () => {
    if (nonePacked || (!allPacked && !essentialsPacked)) {
      setItems(prev => prev.map(i => ({ ...i, packed: !!i.essential })));
    } else if (essentialsPacked) {
      setItems(prev => prev.map(i => ({ ...i, packed: true })));
    } else {
      setItems(prev => prev.map(i => ({ ...i, packed: false })));
    }
  };
  const cyclePackedLabel = allPacked ? "☑ Uncheck All" : essentialsPacked ? "☑ Check All" : "⭐ Essentials";

  const byCategory = useMemo(() => {
    const filtered = filter === "unpacked" ? items.filter(i => !i.packed)
      : filter === "essential" ? items.filter(i => i.essential)
      : items;
    const groups = {};
    for (const item of filtered) {
      const cat = item.category ?? "misc";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [items, filter]);

  const totalPacked = items.filter(i => i.packed).length;
  const pct = items.length ? Math.round((totalPacked / items.length) * 100) : 0;

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", maxWidth: 700, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 44, display: "block", marginBottom: 6 }}>🧳</span>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 800, margin: 0 }}>Packing List</h2>
        {destination && <p style={{ color: "#8A9BA5", fontSize: 13, marginTop: 4 }}>For your {destination} trip</p>}
      </div>

      {/* Progress bar */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 16, border: "1px solid #F0EDE8" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#1C2B33" }}>Packing Progress</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? "#2D8A4E" : "#8A9BA5" }}>{totalPacked}/{items.length} packed {pct === 100 ? "🎉" : ""}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "#F0EDE8", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#2D8A4E,#0B7A8E)", borderRadius: 4, transition: "width .4s" }} />
        </div>
      </div>

      {/* Filter tabs + action buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {[["all", "All Items"], ["unpacked", "Unpacked"], ["essential", "Essentials"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "6px 14px", borderRadius: 20, border: "2px solid" + (filter === v ? "#0B7A8E" : "#F0EDE8"),
            background: filter === v ? "#E6F6F8" : "transparent", color: filter === v ? "#0B7A8E" : "#8A9BA5",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>{l}</button>
        ))}
        <button onClick={cyclePacked} style={{
          padding: "6px 14px", borderRadius: 20,
          border: `2px solid ${allPacked ? "#2D8A4E" : essentialsPacked ? "#F59E0B" : "#F0EDE8"}`,
          background: allPacked ? "#F0FAF4" : essentialsPacked ? "#FFF9F0" : "transparent",
          color: allPacked ? "#2D8A4E" : essentialsPacked ? "#B45309" : "#8A9BA5",
          fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
        }}>{cyclePackedLabel}</button>
        <button onClick={refilter} style={{
          padding: "6px 14px", borderRadius: 20, border: "2px solid #F0EDE8",
          background: "transparent", color: "#8A9BA5", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>↻ Refresh</button>
        <button onClick={customizeWithAI} disabled={aiLoading} style={{
          marginLeft: "auto", padding: "6px 14px", borderRadius: 20,
          border: "2px solid #7C3AED", background: aiLoading ? "#F5F3FF" : "transparent",
          color: "#7C3AED", fontSize: 12, fontWeight: 700, cursor: aiLoading ? "wait" : "pointer",
          whiteSpace: "nowrap",
        }}>
          {aiLoading ? "Generating…" : "✨ Customize with AI"}
        </button>
      </div>
      {aiError && <p style={{ color: "#E8643A", fontSize: 12, marginBottom: 10 }}>{aiError}</p>}

      {byCategory['baby_gear']?.length > 0 && <BabyQuipBanner />}

      {/* Categories */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "12px 14px", border: "1px solid #F0EDE8" }}>
        {CATEGORY_ORDER.filter(cat => byCategory[cat]?.length).map(cat => (
          <CategorySection
            key={cat}
            category={cat}
            items={byCategory[cat]}
            onToggle={toggleItem}
            collapsed={!!collapsed[cat]}
            onToggleCollapse={() => toggleCollapse(cat)}
          />
        ))}
        {Object.keys(byCategory).filter(c => !CATEGORY_ORDER.includes(c)).map(cat => (
          <CategorySection
            key={cat}
            category={cat}
            items={byCategory[cat]}
            onToggle={toggleItem}
            collapsed={!!collapsed[cat]}
            onToggleCollapse={() => toggleCollapse(cat)}
          />
        ))}
      </div>

      <p style={{ fontSize: 10, color: "#8A9BA5", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
        🛒 Buy &amp; Rent links are affiliate links (Amazon, BabyQuip) — supports this site at no extra cost to you.
      </p>
    </div>
  );
}
