"use client";

import { useState, useMemo } from "react";

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

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG ?? "familytravel0a-20";

function AffiliateButton({ searchQuery }) {
  if (!searchQuery) return null;
  const url = `https://www.amazon.com/s?tag=${AMAZON_TAG}&k=${encodeURIComponent(searchQuery)}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{
        display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:6,
        background:"#FFF3E0",border:"1px solid #F59E0B",color:"#B45309",
        fontSize:9,fontWeight:800,textDecoration:"none",marginLeft:4,
      }}
      onClick={e => e.stopPropagation()}
    >
      🛒 Buy
    </a>
  );
}

function PackingItem({ item, onToggle }) {
  return (
    <div
      onClick={() => onToggle(item.id)}
      style={{
        display:"flex",alignItems:"flex-start",gap:10,padding:"8px 10px",
        borderRadius:9,marginBottom:4,cursor:"pointer",
        background: item.packed ? "#F0FAF4" : item.essential ? "#FFF9F0" : "#fff",
        border: `1.5px solid ${item.packed ? "#2D8A4E44" : item.essential ? "#F59E0B44" : "#F0EDE8"}`,
        transition:"background .15s,border-color .15s",
        opacity: item.packed ? 0.7 : 1,
      }}
    >
      {/* Checkbox */}
      <div style={{
        width:18,height:18,borderRadius:5,flexShrink:0,marginTop:1,
        border:`2px solid ${item.packed ? "#2D8A4E" : "#D1CCC6"}`,
        background:item.packed?"#2D8A4E":"transparent",
        display:"flex",alignItems:"center",justifyContent:"center",
      }}>
        {item.packed && <span style={{color:"#fff",fontSize:11,fontWeight:800,lineHeight:1}}>✓</span>}
      </div>

      {/* Content */}
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:"flex",alignItems:"center",flexWrap:"wrap",gap:4 }}>
          <span style={{
            fontSize:13,fontWeight:item.packed?600:700,
            color:item.packed?"#8A9BA5":"#1C2B33",
            textDecoration:item.packed?"line-through":"none",
          }}>
            {item.name}
          </span>
          {item.essential && !item.packed && (
            <span style={{ fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"#B45309",background:"#FFF3E0",padding:"1px 5px",borderRadius:4 }}>Essential</span>
          )}
          {item.quantity_note && (
            <span style={{ fontSize:10,color:"#8A9BA5",fontWeight:600 }}>{item.quantity_note}</span>
          )}
          {!item.packed && <AffiliateButton searchQuery={item.affiliate_search} />}
        </div>
        {item.notes && !item.packed && (
          <p style={{ fontSize:11,color:"#8A9BA5",margin:"2px 0 0",lineHeight:1.4 }}>{item.notes}</p>
        )}
      </div>
    </div>
  );
}

function CategorySection({ category, items, onToggle, collapsed, onToggleCollapse }) {
  const cfg = CATEGORY_CONFIG[category] || { emoji: "📦", label: category };
  const packed = items.filter(i => i.packed).length;

  return (
    <div style={{ marginBottom:16 }}>
      <button
        onClick={onToggleCollapse}
        style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",
          background:"none",border:"none",cursor:"pointer",padding:"6px 0",
          fontFamily:"'Nunito',sans-serif",
        }}
      >
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:18 }}>{cfg.emoji}</span>
          <span style={{ fontSize:14,fontWeight:800,color:"#1C2B33" }}>{cfg.label}</span>
          <span style={{ fontSize:11,fontWeight:700,color:"#8A9BA5" }}>({packed}/{items.length})</span>
        </div>
        {packed > 0 && (
          <div style={{ width:80,height:4,borderRadius:2,background:"#F0EDE8",overflow:"hidden" }}>
            <div style={{ width:`${(packed/items.length)*100}%`,height:"100%",background:"#2D8A4E",borderRadius:2,transition:"width .3s" }} />
          </div>
        )}
        <span style={{ fontSize:12,color:"#8A9BA5" }}>{collapsed ? "▼" : "▲"}</span>
      </button>

      {!collapsed && (
        <div style={{ paddingLeft:4 }}>
          {items.map(item => <PackingItem key={item.id} item={item} onToggle={onToggle} />)}
        </div>
      )}
    </div>
  );
}

export default function PackingList({ profile, activities, destination }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [filter, setFilter] = useState("all"); // 'all' | 'unpacked' | 'essential'

  const generateList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-packing-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, activities, destination }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail ?? e.error ?? "Generation failed"); }
      const data = await res.json();
      setItems((data.items ?? []).map(i => ({ ...i, packed: false })));
      setGenerated(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, packed: !i.packed } : i));
  const toggleCollapse = (cat) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  // Group by category
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
    <div style={{ fontFamily:"'Nunito',sans-serif", maxWidth:700, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ textAlign:"center",marginBottom:20 }}>
        <span style={{ fontSize:44,display:"block",marginBottom:6 }}>🧳</span>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:800,margin:0 }}>Packing List</h2>
        {destination && <p style={{ color:"#8A9BA5",fontSize:13,marginTop:4 }}>For your {destination} trip</p>}
      </div>

      {!generated && !loading && (
        <div style={{ textAlign:"center",padding:"32px 0" }}>
          <p style={{ color:"#8A9BA5",fontSize:14,marginBottom:16 }}>
            Generate a personalized packing list based on your family profile, destination, and planned activities.
          </p>
          <button onClick={generateList} style={{
            padding:"12px 32px",borderRadius:12,border:"none",
            background:"linear-gradient(135deg,#E8643A,#F09A3A)",
            color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",
            boxShadow:"0 6px 20px rgba(232,100,58,.3)",
          }}>
            ✨ Generate Packing List
          </button>
          {error && <p style={{ color:"#E8643A",fontSize:12,marginTop:10 }}>{error}</p>}
        </div>
      )}

      {loading && (
        <div style={{ textAlign:"center",padding:"48px 0",color:"#8A9BA5" }}>
          <div style={{ fontSize:32,marginBottom:12,animation:"spin 1s linear infinite" }}>⏳</div>
          <p style={{ fontWeight:700 }}>Building your packing list…</p>
          <p style={{ fontSize:12,marginTop:4 }}>Claude is customizing this for your family</p>
        </div>
      )}

      {generated && !loading && (
        <>
          {/* Progress bar */}
          <div style={{ background:"#fff",borderRadius:12,padding:"12px 16px",marginBottom:16,border:"1px solid #F0EDE8" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
              <span style={{ fontSize:13,fontWeight:800,color:"#1C2B33" }}>Packing Progress</span>
              <span style={{ fontSize:13,fontWeight:700,color:pct===100?"#2D8A4E":"#8A9BA5" }}>{totalPacked}/{items.length} packed {pct===100?"🎉":""}</span>
            </div>
            <div style={{ height:8,borderRadius:4,background:"#F0EDE8",overflow:"hidden" }}>
              <div style={{ width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#2D8A4E,#0B7A8E)",borderRadius:4,transition:"width .4s" }} />
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display:"flex",gap:6,marginBottom:16 }}>
            {[["all","All Items"],["unpacked","Unpacked"],["essential","Essentials"]].map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)} style={{
                padding:"6px 14px",borderRadius:20,border:"2px solid"+(filter===v?"#0B7A8E":"#F0EDE8"),
                background:filter===v?"#E6F6F8":"transparent",color:filter===v?"#0B7A8E":"#8A9BA5",
                fontSize:12,fontWeight:700,cursor:"pointer",
              }}>{l}</button>
            ))}
            <button onClick={generateList} style={{
              marginLeft:"auto",padding:"6px 14px",borderRadius:20,border:"2px solid #F0EDE8",
              background:"transparent",color:"#8A9BA5",fontSize:12,fontWeight:700,cursor:"pointer",
            }}>↻ Regenerate</button>
          </div>

          {/* Categories */}
          <div style={{ background:"#fff",borderRadius:16,padding:"12px 14px",border:"1px solid #F0EDE8" }}>
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

          <p style={{ fontSize:10,color:"#8A9BA5",textAlign:"center",marginTop:12,lineHeight:1.5 }}>
            🛒 Buy links use our Amazon affiliate code — supports this site at no extra cost to you.
          </p>
        </>
      )}
    </div>
  );
}
