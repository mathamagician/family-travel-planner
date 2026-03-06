"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
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

const CAT_LABELS = {
  full_day: "Full Day",
  half_day: "Half Day",
  "2-4h": "2–4h",
  "1-2h": "1–2h",
  under_1h: "<1h",
};

const PX_PER_MIN = 1.2;
const SNAP_MINS  = 15;

// ── Helpers ────────────────────────────────────────────────────────────────

function timeToMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minsToTime(m) {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
function formatTime12(t) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function formatDateShort(ds) {
  return new Date(ds + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function snap(mins) {
  return Math.round(mins / SNAP_MINS) * SNAP_MINS;
}

// ── Block Notes Modal ──────────────────────────────────────────────────────

function BlockNotesModal({ block, onSave, onClose }) {
  const [notes, setNotes] = useState(block.notes ?? "");
  const c = TYPE_CONFIG[block.type] || TYPE_CONFIG.custom;
  const catLabel = block.duration_category ? CAT_LABELS[block.duration_category] : null;

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(28,43,51,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20 }}>
      <div style={{ background:"#fff",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:380,fontFamily:"'Nunito',sans-serif",boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:20 }}>{c.emoji}</span>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:800,margin:0,color:"#1C2B33" }}>{block.title}</h3>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#8A9BA5",lineHeight:1 }}>×</button>
        </div>

        <div style={{ display:"flex",gap:8,marginBottom:10,flexWrap:"wrap" }}>
          <span style={{ fontSize:11,color:"#8A9BA5",fontWeight:600 }}>
            {formatTime12(block.start)} · {block.duration_mins}m
          </span>
          {catLabel && (
            <span style={{ fontSize:10,fontWeight:700,color:c.color,background:c.bg,padding:"1px 6px",borderRadius:4 }}>
              {catLabel}
            </span>
          )}
        </div>

        {block.location_name && (
          <p style={{ fontSize:11,color:"#8A9BA5",marginBottom:14,display:"flex",alignItems:"center",gap:4 }}>
            📍 <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{block.location_name}</span>
          </p>
        )}

        <label style={{ display:"block",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#8A9BA5",marginBottom:6 }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Add reminders, tips, or anything useful…"
          style={{ width:"100%",padding:"9px 12px",borderRadius:9,border:"2px solid #F0EDE8",fontSize:13,fontWeight:600,boxSizing:"border-box",resize:"vertical",fontFamily:"'Nunito',sans-serif",lineHeight:1.5 }}
        />

        <div style={{ display:"flex",gap:8,marginTop:14 }}>
          <button
            onClick={() => onSave(notes)}
            style={{ flex:1,padding:"11px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#E8643A,#F09A3A)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer" }}
          >
            Save Notes
          </button>
          <button onClick={onClose} style={{ padding:"11px 18px",borderRadius:10,border:"2px solid #F0EDE8",background:"transparent",color:"#8A9BA5",fontSize:13,fontWeight:700,cursor:"pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Custom Block Modal ─────────────────────────────────────────────────────

function CustomBlockModal({ startTime, onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("custom");
  const [start, setStart] = useState(startTime || "09:00");
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const types = ["custom", "food", "attraction", "park", "outdoors", "museum", "culture", "entertainment", "hike"];

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(28,43,51,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20 }}>
      <div style={{ background:"#fff",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:380,fontFamily:"'Nunito',sans-serif",boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:800,margin:0 }}>Add Block</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#8A9BA5" }}>×</button>
        </div>

        <label style={{ display:"block",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#8A9BA5",marginBottom:4 }}>Title *</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Pool time, Museum visit..." autoFocus
          style={{ width:"100%",padding:"9px 12px",borderRadius:9,border:"2px solid #F0EDE8",fontSize:14,fontWeight:600,boxSizing:"border-box",marginBottom:12 }} />

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
          <div>
            <label style={{ display:"block",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#8A9BA5",marginBottom:4 }}>Start Time</label>
            <input type="time" value={start} onChange={e=>setStart(e.target.value)}
              style={{ width:"100%",padding:"9px 12px",borderRadius:9,border:"2px solid #F0EDE8",fontSize:14,fontWeight:600,boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ display:"block",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#8A9BA5",marginBottom:4 }}>Duration (min)</label>
            <select value={duration} onChange={e=>setDuration(Number(e.target.value))}
              style={{ width:"100%",padding:"9px 12px",borderRadius:9,border:"2px solid #F0EDE8",fontSize:14,fontWeight:600,boxSizing:"border-box" }}>
              {[30,45,60,90,120,150,180,240,300,360,480].map(d=><option key={d} value={d}>{d < 60 ? d+"m" : (d/60)+"h"+(d%60?` ${d%60}m`:"")}</option>)}
            </select>
          </div>
        </div>

        <label style={{ display:"block",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#8A9BA5",marginBottom:4 }}>Type</label>
        <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:12 }}>
          {types.map(t=>{
            const c=TYPE_CONFIG[t]||TYPE_CONFIG.custom;
            return <button key={t} onClick={()=>setType(t)} style={{ padding:"4px 10px",borderRadius:12,border:"2px solid"+(type===t?c.color:"#F0EDE8"),background:type===t?c.bg:"transparent",color:type===t?c.color:"#8A9BA5",fontSize:11,fontWeight:700,cursor:"pointer" }}>{c.emoji} {t}</button>;
          })}
        </div>

        <label style={{ display:"block",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#8A9BA5",marginBottom:4 }}>Location (optional)</label>
        <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Address or venue name"
          style={{ width:"100%",padding:"9px 12px",borderRadius:9,border:"2px solid #F0EDE8",fontSize:14,fontWeight:600,boxSizing:"border-box",marginBottom:12 }} />

        <label style={{ display:"block",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#8A9BA5",marginBottom:4 }}>Notes (optional)</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Any reminders or tips..."
          style={{ width:"100%",padding:"9px 12px",borderRadius:9,border:"2px solid #F0EDE8",fontSize:13,fontWeight:600,boxSizing:"border-box",resize:"vertical",fontFamily:"'Nunito',sans-serif" }} />

        <div style={{ display:"flex",gap:8,marginTop:16 }}>
          <button onClick={()=>title.trim()&&onSave({title,type,start,end:minsToTime(timeToMins(start)+duration),duration_mins:duration,location_name:location,notes,block_type:type})}
            disabled={!title.trim()}
            style={{ flex:1,padding:"11px 0",borderRadius:10,border:"none",background:title.trim()?"linear-gradient(135deg,#E8643A,#F09A3A)":"#F0EDE8",color:title.trim()?"#fff":"#8A9BA5",fontSize:14,fontWeight:800,cursor:title.trim()?"pointer":"not-allowed" }}>
            Add Block
          </button>
          <button onClick={onClose} style={{ padding:"11px 18px",borderRadius:10,border:"2px solid #F0EDE8",background:"transparent",color:"#8A9BA5",fontSize:13,fontWeight:700,cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Day Column ─────────────────────────────────────────────────────────────

function DayColumn({ day, dayIndex, wakeMins, bedMins, onMoveBlock, onRemoveBlock, onAddBlock, onDropFromSidebar, onResizeStart, onBlockClick, dragState, setDragState, activeResizeHandleRef, mobile }) {
  const colRef = useRef(null);
  const totalMins = bedMins - wakeMins;
  const height = totalMins * PX_PER_MIN;

  const pxToMins = useCallback((py) => {
    return snap(Math.max(0, Math.min(totalMins - 15, Math.round(py / PX_PER_MIN))));
  }, [totalMins]);

  const handleColumnClick = (e) => {
    if (e.target !== colRef.current && !e.target.classList.contains("cal-empty")) return;
    const rect = colRef.current.getBoundingClientRect();
    const minsFromWake = pxToMins(e.clientY - rect.top);
    onAddBlock(dayIndex, minsToTime(wakeMins + minsFromWake));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!colRef.current || !dragState.active) return;
    const rect = colRef.current.getBoundingClientRect();
    const minsFromWake = pxToMins(e.clientY - rect.top - (dragState.offsetPx ?? 0));
    setDragState(s => ({ ...s, overDay: dayIndex, overMin: minsFromWake }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!dragState.active) return;
    const rect = colRef.current.getBoundingClientRect();
    const minsFromWake = pxToMins(e.clientY - rect.top - (dragState.offsetPx ?? 0));
    const newStart = minsToTime(wakeMins + minsFromWake);
    if (dragState.source === "sidebar") {
      onDropFromSidebar(dayIndex, newStart, dragState.activity);
    } else {
      onMoveBlock(dragState.fromDay, dragState.blockId, dayIndex, newStart);
    }
    setDragState({ active: false });
  };

  // Hour grid lines
  const hourLines = [];
  for (let m = 0; m <= totalMins; m += 60) {
    const timeStr = minsToTime(wakeMins + m);
    hourLines.push(
      <div key={m} style={{ position:"absolute",top:m*PX_PER_MIN,left:0,right:0,borderTop:`1px ${m%60===0?"solid #E8E4DF":"dashed #F0EDE8"}`,pointerEvents:"none" }}>
        {m % 60 === 0 && m < totalMins && (
          <span style={{ position:"absolute",top:-9,left:2,fontSize:9,fontWeight:700,color:"#8A9BA5",lineHeight:1 }}>
            {formatTime12(timeStr)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      ref={colRef}
      onClick={handleColumnClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={() => setDragState(s => ({ ...s, overDay: null }))}
      className="cal-empty"
      style={{
        position:"relative", width: mobile ? "100%" : 160, minWidth: mobile ? undefined : 160, height, flexShrink:0,
        background: dragState.active && dragState.overDay === dayIndex ? "#FEF0EB" : "#FAFAF7",
        borderRadius:12, border:"1px solid " + (dragState.active && dragState.overDay === dayIndex ? "#E8643A" : "#E8E4DF"),
        overflow:"hidden", transition:"background .15s,border-color .15s", cursor:"crosshair",
      }}
    >
      {hourLines}

      {day.slots.map((slot) => {
        const startM = timeToMins(slot.start) - wakeMins;
        const dur = slot.duration_mins ?? 60;
        const blockH = Math.max(dur * PX_PER_MIN - 2, 36);

        // nap = draggable + resizable, no delete; fixed = truly immovable
        const isNap = slot.type === "nap";
        const isFixed = slot.type === "meal" || (slot.type === "rest" && slot.title !== "Free Time");
        const isDraggable = !isFixed;
        const showDelete = !isFixed && !isNap;

        const c = TYPE_CONFIG[slot.type] || TYPE_CONFIG[slot.block_type] || TYPE_CONFIG.custom;
        const catLabel = slot.duration_category ? CAT_LABELS[slot.duration_category] : null;
        const blockId = slot.id ?? `${slot.start}-${slot.title}`;
        const isBeingDragged = dragState.active && dragState.blockId === blockId;

        const blockBg    = isNap ? "#F3F4F6" : isFixed ? "#FFF9F0" : c.bg;
        const blockBorder = isNap ? "#D1D5DB" : isFixed ? "#F59E0B55" : c.color + "55";
        const labelColor  = isNap ? "#9CA3AF" : isFixed ? "#B45309" : c.color;
        const handleColor = isNap ? "#D1D5DB" : c.color + "66";
        const titleEmoji  = isNap ? "😴 " : isFixed ? "🍽️ " : (c.emoji + " ");

        return (
          <div
            key={blockId}
            draggable={isDraggable}
            onClick={(e) => {
              // Don't open notes if clicking came from a stopPropagation child
              if (e.defaultPrevented) return;
              onBlockClick(dayIndex, slot);
            }}
            onDragStart={(e) => {
              if (isFixed || activeResizeHandleRef.current) { e.preventDefault(); return; }
              const rect = e.currentTarget.getBoundingClientRect();
              setDragState({
                active: true, source: "calendar",
                fromDay: dayIndex, blockId,
                slotRef: slot,
                offsetPx: e.clientY - rect.top,
              });
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => setDragState({ active: false })}
            style={{
              position:"absolute",
              top: startM * PX_PER_MIN, left:4, right:4,
              height: blockH,
              background: blockBg,
              border: `1.5px solid ${blockBorder}`,
              borderRadius:8,
              overflow:"hidden",
              cursor: isFixed ? "default" : "grab",
              boxSizing:"border-box",
              zIndex: isFixed ? 1 : 2,
              opacity: isBeingDragged ? 0.4 : 1,
              display:"flex", flexDirection:"column",
            }}
          >
            {/* Content area — click opens notes modal */}
            <div style={{ flex:1, padding:"3px 5px 0", overflow:"hidden", minHeight:0 }}>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:2 }}>
                <div style={{ minWidth:0, flex:1 }}>
                  {/* Title + category badge */}
                  <div style={{ display:"flex",alignItems:"center",gap:3,flexWrap:"wrap" }}>
                    <span style={{ fontSize:9,fontWeight:800,color:labelColor,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.4 }}>
                      {titleEmoji + slot.title}
                    </span>
                    {catLabel && blockH > 38 && (
                      <span style={{ fontSize:8,fontWeight:700,color:labelColor,background:isNap?"#E5E7EB":c.bg,padding:"0 4px",borderRadius:3,whiteSpace:"nowrap",flexShrink:0,lineHeight:"14px",border:`1px solid ${isNap?"#D1D5DB":c.color+"33"}` }}>
                        {catLabel}
                      </span>
                    )}
                  </div>
                  {/* Time + duration */}
                  {blockH > 34 && (
                    <div style={{ fontSize:8,fontWeight:600,color:"#8A9BA5",marginTop:1,lineHeight:1.3 }}>
                      {formatTime12(slot.start)} · {slot.duration_mins}m
                    </div>
                  )}
                  {/* Location */}
                  {slot.location_name && blockH > 52 && (
                    <div style={{ fontSize:8,color:"#8A9BA5",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.3 }}>
                      📍 {slot.location_name}
                    </div>
                  )}
                  {/* Notes indicator */}
                  {slot.notes && blockH > 46 && (
                    <div style={{ fontSize:8,color:"#8A9BA5",marginTop:1,lineHeight:1.3 }}>✏️ note</div>
                  )}
                </div>

                {showDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRemoveBlock(dayIndex, blockId); }}
                    style={{ background:"none",border:"none",color:"#9CA3AF",cursor:"pointer",fontSize:10,padding:"0 2px",lineHeight:1,flexShrink:0 }}
                  >×</button>
                )}
              </div>
            </div>

            {/* Resize handle — bottom strip, drag to extend/shrink */}
            {!isFixed && (
              <div
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onResizeStart(blockId, dayIndex, slot.duration_mins, e.clientY);
                }}
                style={{
                  height:8, flexShrink:0,
                  borderTop:`1px solid ${handleColor}`,
                  cursor:"ns-resize",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background:"transparent",
                }}
              >
                <div style={{ width:18,height:2,borderRadius:1,background:handleColor }} />
              </div>
            )}
          </div>
        );
      })}

      {/* Drop preview indicator */}
      {dragState.active && dragState.overDay === dayIndex && dragState.overMin != null && (
        <div style={{
          position:"absolute",
          top: dragState.overMin * PX_PER_MIN,
          left:4, right:4, height:4,
          background:"#E8643A", borderRadius:2, pointerEvents:"none", zIndex:10,
        }} />
      )}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

function CalendarSidebar({ unplaced, onDragStart }) {
  return (
    <div style={{
      width:180, minWidth:180, flexShrink:0,
      background:"#fff", borderRadius:14, border:"1px solid #F0EDE8",
      padding:"12px 10px", maxHeight:"calc(100vh - 160px)", overflowY:"auto",
      position:"sticky", top:16, fontFamily:"'Nunito',sans-serif",
    }}>
      <div style={{ fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#8A9BA5",marginBottom:10 }}>
        Unscheduled ({unplaced.length})
      </div>
      {unplaced.length === 0 && (
        <p style={{ fontSize:11,color:"#8A9BA5",fontStyle:"italic",lineHeight:1.5 }}>
          All activities placed! Remove one to free it up.
        </p>
      )}
      {unplaced.map(a => {
        const c = TYPE_CONFIG[a.type] || TYPE_CONFIG.custom;
        return (
          <div
            key={a.id}
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(a); }}
            style={{
              padding:"7px 8px", borderRadius:9, marginBottom:5,
              background:c.bg, border:`1.5px solid ${c.color}33`,
              display:"flex", alignItems:"center", gap:6, cursor:"grab",
            }}
            onMouseDown={e => e.currentTarget.style.transform="scale(1.03)"}
            onMouseUp={e => e.currentTarget.style.transform=""}
          >
            <span style={{ fontSize:13, flexShrink:0 }}>{c.emoji}</span>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#1C2B33",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{a.name}</div>
              <div style={{ fontSize:9,fontWeight:600,color:"#8A9BA5",marginTop:1 }}>
                {a.duration_category ? (CAT_LABELS[a.duration_category] ?? a.duration_category) : (a.duration_mins_typical ? Math.round(a.duration_mins_typical/60*10)/10+"h" : "")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main WeeklyCalendar ────────────────────────────────────────────────────

export default function WeeklyCalendar({ itinerary, activities, selectedIds, profile, onBack, onBackToActivities, onNextStep, SaveTripButtonComponent }) {
  const [days, setDays] = useState(() =>
    (itinerary?.days ?? []).map((d, i) => ({
      ...d,
      slots: (d.slots ?? []).map((s, j) => ({ ...s, id: `d${i}s${j}` })),
    }))
  );
  const [dragState, setDragState] = useState({ active: false });
  const [showAddModal, setShowAddModal] = useState(null);   // { dayIndex, startTime }
  const [editingNotes, setEditingNotes] = useState(null);   // { dayIndex, blockId }
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDay, setMobileDay] = useState(0);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Refs for resize operation
  const resizeRef = useRef(null); // { blockId, dayIndex, startDuration, startY }
  const activeResizeHandleRef = useRef(false);

  const wakeMins = timeToMins(profile?.wake_time ?? "07:00");
  const bedMins  = timeToMins(profile?.bed_time  ?? "20:00");

  // Global mouse handlers for block resizing
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!resizeRef.current) return;
      const { blockId, dayIndex, startDuration, startY } = resizeRef.current;
      const deltaPx   = e.clientY - startY;
      const deltaMins = Math.round(deltaPx / PX_PER_MIN / SNAP_MINS) * SNAP_MINS;
      const newDur    = Math.max(SNAP_MINS, startDuration + deltaMins);
      setDays(prev => prev.map((d, i) => {
        if (i !== dayIndex) return d;
        return { ...d, slots: d.slots.map(s => s.id === blockId ? { ...s, duration_mins: newDur } : s) };
      }));
    };
    const onMouseUp = () => {
      if (resizeRef.current) {
        resizeRef.current = null;
        activeResizeHandleRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleResizeStart = useCallback((blockId, dayIndex, startDuration, clientY) => {
    resizeRef.current = { blockId, dayIndex, startDuration, startY: clientY };
    activeResizeHandleRef.current = true;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleBlockClick = useCallback((dayIndex, slot) => {
    setEditingNotes({ dayIndex, blockId: slot.id });
  }, []);

  const moveBlock = (fromDay, blockId, toDay, newStart) => {
    setDays(prev => {
      const next = prev.map(d => ({ ...d, slots: [...d.slots] }));
      const srcDay = next[fromDay];
      const idx = srcDay.slots.findIndex(s => s.id === blockId);
      if (idx === -1) return prev;
      const block = { ...srcDay.slots[idx], start: newStart };
      srcDay.slots.splice(idx, 1);
      next[toDay].slots.push(block);
      next[toDay].slots.sort((a, b) => timeToMins(a.start) - timeToMins(b.start));
      return next;
    });
  };

  const removeBlock = (dayIndex, blockId) => {
    setDays(prev => prev.map((d, i) =>
      i !== dayIndex ? d : { ...d, slots: d.slots.filter(s => s.id !== blockId) }
    ));
  };

  const addCustomBlock = (dayIndex, blockData) => {
    const newBlock = {
      id: `custom-${Date.now()}`,
      title: blockData.title,
      type: blockData.type ?? "custom",
      block_type: blockData.block_type ?? "custom",
      start: blockData.start,
      duration_mins: blockData.duration_mins ?? 60,
      location_name: blockData.location_name ?? null,
      notes: blockData.notes ?? null,
    };
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      const slots = [...d.slots, newBlock].sort((a, b) => timeToMins(a.start) - timeToMins(b.start));
      return { ...d, slots };
    }));
    setShowAddModal(null);
  };

  const dropFromSidebar = (dayIndex, newStart, activity) => {
    const newBlock = {
      id: `act-${activity.id}-${Date.now()}`,
      title: activity.name,
      type: activity.type,
      block_type: "activity",
      activityId: activity.id,
      start: newStart,
      duration_mins: activity.duration_mins_typical ?? activity.duration_mins ?? 90,
      location_name: activity.location ?? activity.address ?? null,
      hours: activity.hours,
      duration_category: activity.duration_category,
    };
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      const slots = [...d.slots, newBlock].sort((a, b) => timeToMins(a.start) - timeToMins(b.start));
      return { ...d, slots };
    }));
  };

  const tapFromSidebar = (activity) => {
    dropFromSidebar(mobileDay, minsToTime(wakeMins + 120), activity);
    setShowMobileSidebar(false);
  };

  const updateBlockNotes = (dayIndex, blockId, notes) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      return { ...d, slots: d.slots.map(s => s.id === blockId ? { ...s, notes } : s) };
    }));
    setEditingNotes(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const placedIds = new Set(days.flatMap(d => d.slots.map(s => s.activityId).filter(Boolean)));
  const selectedActivities = (activities ?? []).filter(a => selectedIds?.has(a.id));
  const unplaced = selectedActivities.filter(a => !placedIds.has(a.id));

  // Resolve editing block from state
  const editingBlock = editingNotes
    ? days[editingNotes.dayIndex]?.slots.find(s => s.id === editingNotes.blockId)
    : null;

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7).map((d, j) => ({ ...d, _idx: i + j })));

  const currentItinerary = {
    destination: profile?.destination ?? itinerary?.destination,
    profile: itinerary?.profile,
    days: days.map(d => ({ ...d, slots: d.slots })),
  };

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign:"center",marginBottom:16 }}>
        <span style={{ fontSize:44,display:"block",marginBottom:6 }}>🗓️</span>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:800 }}>
          {profile?.destination ?? itinerary?.destination} Itinerary
        </h2>
        <p style={{ color:"#8A9BA5",fontSize:13,marginTop:4 }}>
          Click a block to add notes · Drag to reschedule · Drag bottom handle to resize
        </p>
      </div>

      {/* Nav buttons */}
      <div style={{ display:"flex",justifyContent:"center",gap:10,marginBottom:20 }}>
        <button onClick={onBackToActivities} style={{ padding:"9px 18px",borderRadius:9,border:"2px solid #0B7A8E",background:"#fff",color:"#0B7A8E",fontSize:12,fontWeight:700,cursor:"pointer" }}>← Edit Activities</button>
        <button onClick={onBack} style={{ padding:"9px 18px",borderRadius:9,border:"2px solid #F0EDE8",background:"transparent",color:"#8A9BA5",fontSize:12,fontWeight:700,cursor:"pointer" }}>← Edit Family</button>
      </div>

      {isMobile ? (
        /* ── Mobile: single-day view with tab navigation ── */
        <div>
          {/* Day tab strip */}
          <div style={{ display:"flex", overflowX:"auto", gap:6, marginBottom:12, paddingBottom:4, WebkitOverflowScrolling:"touch" }}>
            {days.map((day, i) => (
              <button key={i} onClick={() => setMobileDay(i)}
                style={{
                  flexShrink:0, padding:"6px 14px", borderRadius:20, border:"none",
                  background: i === mobileDay ? "linear-gradient(135deg,#E8643A,#F09A3A)" : "#fff",
                  color: i === mobileDay ? "#fff" : "#8A9BA5",
                  fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
                  boxShadow: i === mobileDay ? "0 3px 10px rgba(232,100,58,.3)" : "0 1px 4px rgba(0,0,0,.08)",
                }}>
                Day {day.day}
              </button>
            ))}
          </div>

          {/* Current day header */}
          {days[mobileDay] && (() => {
            const day = days[mobileDay];
            const isWE = (() => { const d = new Date(day.date + "T00:00:00"); return d.getDay() === 0 || d.getDay() === 6; })();
            return (
              <div style={{
                padding:"10px 12px", borderRadius:"10px 10px 0 0",
                background: isWE ? "linear-gradient(135deg,#FFF3E0,#FFF9F0)" : "linear-gradient(135deg,#E6F6F8,#F0FAFB)",
                border:"1px solid #E8E4DF", borderBottom:"none",
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:800, color:"#1C2B33" }}>Day {day.day}</div>
                  <div style={{ fontSize:11, fontWeight:600, color: isWE ? "#E8643A" : "#0B7A8E", marginTop:1 }}>{formatDateShort(day.date)}</div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {mobileDay > 0 && (
                    <button onClick={() => setMobileDay(prev => prev - 1)} style={{ padding:"5px 10px", borderRadius:6, border:"1.5px solid #E8E4DF", background:"transparent", color:"#8A9BA5", fontSize:11, fontWeight:700, cursor:"pointer" }}>← Prev</button>
                  )}
                  <button onClick={() => setShowAddModal({ dayIndex: mobileDay, startTime: minsToTime(wakeMins + 120) })}
                    style={{ padding:"5px 10px", borderRadius:6, border:"1px dashed #8A9BA5", background:"transparent", color:"#8A9BA5", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                    + Add
                  </button>
                  {mobileDay < days.length - 1 && (
                    <button onClick={() => setMobileDay(prev => prev + 1)} style={{ padding:"5px 10px", borderRadius:6, border:"1.5px solid #E8E4DF", background:"transparent", color:"#8A9BA5", fontSize:11, fontWeight:700, cursor:"pointer" }}>Next →</button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Full-width day column */}
          {days[mobileDay] && (
            <DayColumn
              day={days[mobileDay]}
              dayIndex={mobileDay}
              wakeMins={wakeMins}
              bedMins={bedMins}
              onMoveBlock={moveBlock}
              onRemoveBlock={removeBlock}
              onAddBlock={(di, st) => setShowAddModal({ dayIndex: di, startTime: st })}
              onDropFromSidebar={dropFromSidebar}
              onResizeStart={handleResizeStart}
              onBlockClick={handleBlockClick}
              dragState={dragState}
              setDragState={setDragState}
              activeResizeHandleRef={activeResizeHandleRef}
              mobile={true}
            />
          )}

          {/* Unscheduled activities toggle */}
          <button onClick={() => setShowMobileSidebar(s => !s)}
            style={{
              marginTop:12, width:"100%", padding:"11px 14px", borderRadius:10,
              border:"1.5px solid #E8E4DF", background:"#fff", color:"#1C2B33",
              fontSize:13, fontWeight:700, cursor:"pointer",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              boxSizing:"border-box",
            }}>
            <span>Unscheduled Activities ({unplaced.length})</span>
            <span style={{ fontSize:10, color:"#8A9BA5" }}>{showMobileSidebar ? "▲ Hide" : "▼ Show"}</span>
          </button>

          {showMobileSidebar && (
            <div style={{ background:"#fff", borderRadius:"0 0 12px 12px", border:"1.5px solid #E8E4DF", borderTop:"none", padding:"10px" }}>
              {unplaced.length === 0 ? (
                <p style={{ fontSize:12, color:"#8A9BA5", textAlign:"center", padding:"8px 0", fontStyle:"italic" }}>All activities placed!</p>
              ) : unplaced.map(a => {
                const c = TYPE_CONFIG[a.type] || TYPE_CONFIG.custom;
                return (
                  <div key={a.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px", borderRadius:8, background:c.bg, border:`1.5px solid ${c.color}33`, marginBottom:6 }}>
                    <span style={{ fontSize:15, flexShrink:0 }}>{c.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#1C2B33", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name}</div>
                      <div style={{ fontSize:10, color:"#8A9BA5" }}>{a.duration_category ? (CAT_LABELS[a.duration_category] ?? a.duration_category) : ""}</div>
                    </div>
                    <button onClick={() => tapFromSidebar(a)}
                      style={{ padding:"6px 10px", borderRadius:6, border:"none", background:"linear-gradient(135deg,#E8643A,#F09A3A)", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                      + Day {mobileDay + 1}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display:"flex", justifyContent:"center", marginTop:16, gap:10, flexWrap:"wrap", alignItems:"center" }}>
            {SaveTripButtonComponent && <SaveTripButtonComponent itinerary={currentItinerary} />}
            {onNextStep && (
              <button onClick={onNextStep} style={{ padding:"11px 24px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#7C3AED,#4F46E5)", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                🧳 Build Packing List →
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── Desktop: multi-column week view ── */
        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
          <CalendarSidebar
            unplaced={unplaced}
            onDragStart={(activity) => setDragState({ active: true, source: "sidebar", activity })}
          />

          <div style={{ flex:1, minWidth:0 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ marginBottom:28 }}>
                {weeks.length > 1 && (
                  <div style={{ fontSize:12, fontWeight:700, color:"#8A9BA5", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>
                    Week {wi + 1}
                  </div>
                )}
                <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8 }}>
                  {week.map((day) => {
                    const isWE = (() => { const d = new Date(day.date + "T00:00:00"); return d.getDay() === 0 || d.getDay() === 6; })();
                    return (
                      <div key={day.day} style={{ flexShrink:0 }}>
                        <div style={{
                          width:160, padding:"8px 10px", borderRadius:"10px 10px 0 0",
                          background: isWE ? "linear-gradient(135deg,#FFF3E0,#FFF9F0)" : "linear-gradient(135deg,#E6F6F8,#F0FAFB)",
                          border:"1px solid #E8E4DF", borderBottom:"none",
                        }}>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:800, color:"#1C2B33" }}>Day {day.day}</div>
                          <div style={{ fontSize:10, fontWeight:600, color: isWE ? "#E8643A" : "#0B7A8E", marginTop:1 }}>{formatDateShort(day.date)}</div>
                          <button
                            onClick={() => setShowAddModal({ dayIndex: day._idx, startTime: minsToTime(wakeMins + 120) })}
                            style={{ marginTop:5, padding:"2px 8px", borderRadius:6, border:"1px dashed #8A9BA5", background:"transparent", color:"#8A9BA5", fontSize:10, fontWeight:700, cursor:"pointer" }}
                          >+ Add block</button>
                        </div>

                        <DayColumn
                          day={day}
                          dayIndex={day._idx}
                          wakeMins={wakeMins}
                          bedMins={bedMins}
                          onMoveBlock={moveBlock}
                          onRemoveBlock={removeBlock}
                          onAddBlock={(di, st) => setShowAddModal({ dayIndex: di, startTime: st })}
                          onDropFromSidebar={dropFromSidebar}
                          onResizeStart={handleResizeStart}
                          onBlockClick={handleBlockClick}
                          dragState={dragState}
                          setDragState={setDragState}
                          activeResizeHandleRef={activeResizeHandleRef}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ display:"flex", justifyContent:"center", marginTop:16, gap:12, flexWrap:"wrap", alignItems:"center" }}>
              {SaveTripButtonComponent && <SaveTripButtonComponent itinerary={currentItinerary} />}
              {onNextStep && (
                <button onClick={onNextStep} style={{
                  padding:"11px 24px", borderRadius:12, border:"none",
                  background:"linear-gradient(135deg,#7C3AED,#4F46E5)",
                  color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer",
                  boxShadow:"0 6px 20px rgba(124,58,237,.25)", fontFamily:"'Nunito',sans-serif",
                }}>
                  🧳 Build Packing List →
                </button>
              )}
            </div>

            <details style={{ marginTop:12 }}>
              <summary style={{ cursor:"pointer", fontSize:12, fontWeight:700, color:"#8A9BA5", padding:"6px 0" }}>View JSON Export</summary>
              <pre style={{ background:"#1C2B33", color:"#81D4C8", borderRadius:12, padding:16, fontSize:11, lineHeight:1.5, overflow:"auto", maxHeight:300, marginTop:6 }}>
                {JSON.stringify(currentItinerary, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Add block modal */}
      {showAddModal && (
        <CustomBlockModal
          startTime={showAddModal.startTime}
          onSave={(block) => addCustomBlock(showAddModal.dayIndex, block)}
          onClose={() => setShowAddModal(null)}
        />
      )}

      {/* Notes editor modal */}
      {editingBlock && (
        <BlockNotesModal
          block={editingBlock}
          onSave={(notes) => updateBlockNotes(editingNotes.dayIndex, editingNotes.blockId, notes)}
          onClose={() => setEditingNotes(null)}
        />
      )}
    </div>
  );
}
