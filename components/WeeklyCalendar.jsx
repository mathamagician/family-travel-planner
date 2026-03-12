"use client";

/* ─── Module 3B: Schedule Module (WeeklyCalendar) ─────────────────────────
   Standalone reusable weekly calendar component.
   Designed to be extractable as a plug-in for future projects.
   ────────────────────────────────────────────────────────────────────────── */

import { useState, useRef, useCallback, useEffect } from "react";
import { TYPE_CONFIG, CAT_LABELS, ENERGY_EMOJI_BY_TYPE, ENERGY_CONFIG } from "./shared/config";
import { timeToMins, minsToTime, formatTime12, formatTimeShort, formatDateShort, getMockWeather, snapMins } from "./shared/utils";

// ── Schedule-specific Constants ───────────────────────────────────────────

const PX_PER_MIN = 0.8;
const SNAP_MINS  = 15;

// Height of the desktop day header card (approx) — used to offset the time gutter
const DESKTOP_HEADER_H = 78;

function snap(mins) {
  return snapMins(mins, SNAP_MINS);
}

// ── Time Gutter ────────────────────────────────────────────────────────────
// Sticky left column showing hour labels aligned to the day columns.
// topOffset = pixel height of the day header card so labels align with column body.

function TimeGutter({ wakeMins, bedMins, topOffset }) {
  const totalMins = bedMins - wakeMins;
  const labels = [];
  for (let m = 0; m < totalMins; m += 60) {
    labels.push(
      <div key={m} style={{
        position: "absolute",
        top: topOffset + m * PX_PER_MIN,
        right: 4,
        fontSize: 9,
        fontWeight: 700,
        color: "#8A9BA5",
        lineHeight: 1,
        whiteSpace: "nowrap",
        transform: "translateY(-50%)",
        pointerEvents: "none",
      }}>
        {formatTimeShort(minsToTime(wakeMins + m))}
      </div>
    );
  }
  return (
    <div style={{
      position: "sticky",
      left: 0,
      zIndex: 2,
      flexShrink: 0,
      width: 36,
      height: topOffset + totalMins * PX_PER_MIN,
      background: "#fff",
      borderRight: "1px solid #E0DCD8",
    }}>
      <div style={{ position: "relative", height: "100%" }}>
        {labels}
      </div>
    </div>
  );
}

// ── Block Notes Modal ──────────────────────────────────────────────────────

function BlockNotesModal({ block, onSave, onClose, dayIndex, totalDays, onMoveToDay }) {
  const [notes, setNotes] = useState(block.notes ?? "");
  const [startTime, setStartTime] = useState(block.start ?? "09:00");
  const [duration, setDuration] = useState(block.duration_mins ?? 60);
  const c = TYPE_CONFIG[block.type] || TYPE_CONFIG.custom;
  const catLabel = block.duration_category ? CAT_LABELS[block.duration_category] : null;

  const inputStyle = { padding:"5px 8px", borderRadius:7, border:"1.5px solid #E8E4DF", fontSize:12, fontWeight:600, background:"#fff" };
  const isMovable = block.type !== "rest" || block.title === "Free Time";

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

        {catLabel && (
          <span style={{ fontSize:10,fontWeight:700,color:c.color,background:c.bg,padding:"1px 6px",borderRadius:4,display:"inline-block",marginBottom:8 }}>
            {catLabel}
          </span>
        )}

        {/* Start time + duration — editable */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
          <div>
            <label style={{ display:"block",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"#8A9BA5",marginBottom:4 }}>Start Time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ ...inputStyle, width:"100%", boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ display:"block",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"#8A9BA5",marginBottom:4 }}>Duration</label>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ ...inputStyle, width:"100%", boxSizing:"border-box" }}>
              {[15,30,45,60,90,120,150,180,240,300,360,480].map(d => (
                <option key={d} value={d}>{d < 60 ? d+"m" : Math.floor(d/60)+"h"+(d%60?` ${d%60}m`:"")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Move to another day — useful on mobile */}
        {isMovable && totalDays > 1 && onMoveToDay && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display:"block",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"#8A9BA5",marginBottom:4 }}>
              Move to Day
            </label>
            <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
              {Array.from({ length: totalDays }, (_, i) => (
                <button
                  key={i}
                  disabled={i === dayIndex}
                  onClick={() => { onMoveToDay(dayIndex, block.id, i, startTime); onClose(); }}
                  style={{
                    padding:"4px 10px", borderRadius:6, border:"1.5px solid",
                    borderColor: i === dayIndex ? "#E8E4DF" : "#0B7A8E",
                    background: i === dayIndex ? "#F0EDE8" : "#E6F6F8",
                    color: i === dayIndex ? "#8A9BA5" : "#0B7A8E",
                    fontSize:11, fontWeight:700, cursor: i === dayIndex ? "default" : "pointer",
                    opacity: i === dayIndex ? 0.5 : 1,
                  }}
                >
                  Day {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {block.location_name && (
          <p style={{ fontSize:11,color:"#8A9BA5",marginBottom:10,display:"flex",alignItems:"center",gap:4 }}>
            📍 <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{block.location_name}</span>
          </p>
        )}

        {/* Activity description */}
        {block.description && (
          <div style={{ fontSize:12,color:"#1C2B33",lineHeight:1.5,marginBottom:12,padding:"8px 10px",background:"#F9FAFB",borderRadius:8,border:"1px solid #F0EDE8" }}>
            {block.description}
          </div>
        )}

        <label style={{ display:"block",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"#8A9BA5",marginBottom:4 }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          autoFocus
          placeholder="Add reminders, tips, or anything useful…"
          style={{ width:"100%",padding:"9px 12px",borderRadius:9,border:"2px solid #F0EDE8",fontSize:13,fontWeight:600,boxSizing:"border-box",resize:"vertical",fontFamily:"'Nunito',sans-serif",lineHeight:1.5 }}
        />

        <div style={{ display:"flex",gap:8,marginTop:14 }}>
          <button
            onClick={() => onSave({ notes, start: startTime, duration_mins: duration })}
            style={{ flex:1,padding:"11px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#E8643A,#F09A3A)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer" }}
          >
            Save
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

function DayColumn({ day, dayIndex, wakeMins, bedMins, onMoveBlock, onRemoveBlock, onAddBlock, onDropFromSidebar, onResizeStart, onBlockClick, dragState, setDragState, activeResizeHandleRef, mobile, activityMap }) {
  const colRef = useRef(null);
  const totalMins = bedMins - wakeMins;
  const height = totalMins * PX_PER_MIN;

  const pxToMins = useCallback((py) => {
    return snap(Math.max(0, Math.min(totalMins - 15, Math.round(py / PX_PER_MIN))));
  }, [totalMins]);

  const handleColumnClick = (e) => {
    if (activeResizeHandleRef.current) return; // suppress click after resize drag
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

  // Hour + half-hour grid lines (labels live in TimeGutter, not here)
  const hourLines = [];
  for (let m = 0; m <= totalMins; m += 30) {
    hourLines.push(
      <div key={m} style={{
        position: "absolute", top: m * PX_PER_MIN, left: 0, right: 0,
        borderTop: `1px ${m % 60 === 0 ? "solid #E0DCD8" : "dashed #ECEAE6"}`,
        pointerEvents: "none",
      }} />
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
        position:"relative", width:"100%", height, flexShrink:0,
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

        // nap = draggable + resizable + deletable; fixed (meals) = truly immovable
        const isNap = slot.type === "nap";
        const isMeal = slot.type === "meal";
        const isFixed = (slot.type === "rest" && slot.title !== "Free Time" && !isNap);
        const isDraggable = !isFixed;
        const showDelete = !isFixed;

        const c = TYPE_CONFIG[slot.type] || TYPE_CONFIG[slot.block_type] || TYPE_CONFIG.custom;
        const catLabel = slot.duration_category ? CAT_LABELS[slot.duration_category] : null;
        const blockId = slot.id ?? `${slot.start}-${slot.title}`;
        const isBeingDragged = dragState.active && dragState.blockId === blockId;

        const blockBg    = isNap ? "#F3F4F6" : isMeal ? "#FFF9F0" : isFixed ? "#FFF9F0" : c.bg;
        const blockBorder = isNap ? "#D1D5DB" : isMeal ? "#F59E0B55" : isFixed ? "#F59E0B55" : c.color + "55";
        const labelColor  = isNap ? "#9CA3AF" : isMeal ? "#B45309" : isFixed ? "#B45309" : c.color;
        const handleColor = isNap ? "#D1D5DB" : isMeal ? "#F59E0B66" : c.color + "66";
        const titleEmoji  = isNap ? "😴 " : isMeal ? "🍽️ " : isFixed ? "" : (c.emoji + " ");

        // Resolve activity description from slot or activity map
        const actDesc = slot.description || (slot.activityId && activityMap?.[slot.activityId]?.notes) || null;

        return (
          <div
            key={blockId}
            draggable={isDraggable}
            title={actDesc || undefined}
            onClick={(e) => {
              // Don't open notes if clicking came from a stopPropagation child
              if (e.defaultPrevented) return;
              onBlockClick(dayIndex, { ...slot, description: actDesc });
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
              zIndex: isFixed ? 1 : isNap ? 3 : (slot.duration_category === "full_day" ? 1 : 2),
              opacity: isBeingDragged ? 0.4 : 1,
              display:"flex", flexDirection:"column",
            }}
          >
            {/* Content area — click opens notes modal */}
            <div style={{ flex:1, padding:"3px 5px 0", overflow:"hidden", minHeight:0 }}>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:2 }}>
                <div style={{ minWidth:0, flex:1 }}>
                  {/* Title + category badge + energy icon */}
                  <div style={{ display:"flex",alignItems:"center",gap:3,flexWrap:"wrap" }}>
                    <span style={{ fontSize:9,fontWeight:800,color:labelColor,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.4 }}>
                      {titleEmoji + slot.title}
                    </span>
                    {ENERGY_EMOJI_BY_TYPE[slot.type] && !isFixed && !isNap && !isMeal && (
                      <span style={{ fontSize:9,lineHeight:1.4,flexShrink:0 }} title={`Energy: ${slot.type}`}>{ENERGY_EMOJI_BY_TYPE[slot.type]}</span>
                    )}
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
                  {/* User notes — black text */}
                  {slot.notes && blockH > 46 && (
                    <div title={slot.notes} style={{ fontSize:9,color:"#1C2B33",fontWeight:600,marginTop:1,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>✏️ {slot.notes}</div>
                  )}
                  {/* Activity description — below notes */}
                  {actDesc && blockH > 60 && (
                    <div className="cal-block-desc" style={{ fontSize:8,color:"#8A9BA5",marginTop:1,lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:Math.max(1,Math.floor((blockH - 60) / 10)),WebkitBoxOrient:"vertical" }}>{actDesc}</div>
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

      {/* Travel time indicators between activity blocks */}
      {(() => {
        const activitySlots = day.slots.filter(s => s.type !== "rest" && s.type !== "nap" && s.type !== "meal" && s.title !== "Free Time");
        return activitySlots.map((slot, i) => {
          if (i === 0) return null;
          const prev = activitySlots[i - 1];
          const prevEnd = timeToMins(prev.start) - wakeMins + (prev.duration_mins ?? 60);
          const curStart = timeToMins(slot.start) - wakeMins;
          const gap = curStart - prevEnd;
          if (gap < 10 || gap > 90) return null; // only show for reasonable gaps
          const midY = (prevEnd + curStart) / 2 * PX_PER_MIN;
          return (
            <div key={`travel-${i}`} style={{
              position: "absolute", top: midY - 7, left: "50%", transform: "translateX(-50%)",
              background: "#fff", border: "1px solid #E8E4DF", borderRadius: 8,
              padding: "1px 6px", fontSize: 8, fontWeight: 700, color: "#8A9BA5",
              zIndex: 4, pointerEvents: "none", whiteSpace: "nowrap",
              boxShadow: "0 1px 3px rgba(0,0,0,.08)",
            }}>
              🚗 {gap}m
            </div>
          );
        });
      })()}

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

function CalendarSidebar({ unplaced, removedBlocks, onDragStart, onRestoreBlock }) {
  return (
    <div className="calendar-sidebar" style={{
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

      {/* Removed nap/rest/meal blocks */}
      {removedBlocks && removedBlocks.length > 0 && (
        <>
          <div style={{ fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#8A9BA5",marginTop:12,marginBottom:8,borderTop:"1px solid #F0EDE8",paddingTop:10 }}>
            Removed ({removedBlocks.length})
          </div>
          {removedBlocks.map((b, i) => {
            const isNap = b.type === "nap";
            const emoji = isNap ? "😴" : b.type === "meal" ? "🍽️" : "☁️";
            return (
              <div key={b.id + "-" + i}
                style={{
                  padding:"7px 8px", borderRadius:9, marginBottom:5,
                  background: isNap ? "#F3F4F6" : "#FFF9F0",
                  border: `1.5px solid ${isNap ? "#D1D5DB" : "#F59E0B55"}`,
                  display:"flex", alignItems:"center", gap:6,
                }}>
                <span style={{ fontSize:13, flexShrink:0 }}>{emoji}</span>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:"#1C2B33",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{b.title}</div>
                  <div style={{ fontSize:9,fontWeight:600,color:"#8A9BA5",marginTop:1 }}>{b.duration_mins}m</div>
                </div>
                <button onClick={() => onRestoreBlock(b, i)} style={{ padding:"3px 8px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#E8643A,#F09A3A)",color:"#fff",fontSize:9,fontWeight:700,cursor:"pointer",flexShrink:0 }}>
                  ↩
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── Trip Intensity Meter ──────────────────────────────────────────────────
// Speedometer-style indicator showing overall trip energy level.

function TripIntensityMeter({ tripIntensity, days }) {
  if (!tripIntensity) return null;

  const { level, label, highDays, medDays, totalDays, warning } = tripIntensity;
  const colors = { low: "#16A34A", medium: "#D97706", high: "#DC2626" };
  const bgColors = { low: "#F0FDF4", medium: "#FFFBEB", high: "#FEF2F2" };
  const icons = { low: "😌", medium: "⚡", high: "🔥" };
  const color = colors[level];
  const bg = bgColors[level];

  // Needle angle: low=~30°, medium=~90°, high=~150° (left to right arc)
  const ratio = (highDays + medDays * 0.5) / Math.max(totalDays, 1);
  const needleAngle = -90 + ratio * 180; // -90 = far left, 90 = far right

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      background: bg, borderRadius: 12, border: `1.5px solid ${color}33`,
      padding: "10px 20px", maxWidth: 340,
    }}>
      {/* Mini speedometer */}
      <div style={{ position: "relative", width: 80, height: 44 }}>
        {/* Arc background */}
        <svg viewBox="0 0 80 44" style={{ width: 80, height: 44 }}>
          {/* Green zone: 0–40% of arc (left side) */}
          <path d="M 8 40 A 32 32 0 0 1 18.3 14.5" fill="none" stroke="#16A34A" strokeWidth="6" strokeLinecap="round" />
          {/* Yellow/orange zone: 40–75% of arc (wide middle) */}
          <path d="M 18.3 14.5 A 32 32 0 0 1 58.5 11.5" fill="none" stroke="#D97706" strokeWidth="6" strokeLinecap="round" />
          {/* Red zone: 75–100% of arc (right side, narrow) */}
          <path d="M 58.5 11.5 A 32 32 0 0 1 72 40" fill="none" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" />
          {/* Needle */}
          <line
            x1="40" y1="40"
            x2={40 + 24 * Math.cos((needleAngle - 90) * Math.PI / 180)}
            y2={40 + 24 * Math.sin((needleAngle - 90) * Math.PI / 180)}
            stroke="#1C2B33" strokeWidth="2.5" strokeLinecap="round"
          />
          <circle cx="40" cy="40" r="3" fill="#1C2B33" />
        </svg>
      </div>

      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 16 }}>{icons[level]}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{label} Trip</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#8A9BA5" }}>
          ({highDays} high, {medDays ?? 0} med / {totalDays} days)
        </span>
      </div>

      {/* Day intensity dots */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
        {(days ?? []).map((day, i) => {
          const dc = colors[day.intensity] ?? colors.low;
          return (
            <div key={i} title={`Day ${day.day}: ${day.intensity}`} style={{
              width: 18, height: 18, borderRadius: "50%",
              background: dc, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, fontWeight: 800,
            }}>
              {day.day}
            </div>
          );
        })}
      </div>

      {/* Warning */}
      {warning && (
        <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", textAlign: "center", lineHeight: 1.4 }}>
          ⚠️ {warning}
        </div>
      )}
    </div>
  );
}

// ── Schedule Controls Bar ──────────────────────────────────────────────────
// Compact inline controls for wake/bed/nap times at the top of the schedule page.

function ScheduleControlsBar({ profile, onProfileChange }) {
  const WAKE_OPTIONS = [];
  const BED_OPTIONS = [];
  for (let h = 5; h <= 10; h++) { WAKE_OPTIONS.push(`${String(h).padStart(2,"0")}:00`); if (h < 10) WAKE_OPTIONS.push(`${String(h).padStart(2,"0")}:30`); }
  for (let h = 17; h <= 22; h++) { BED_OPTIONS.push(`${String(h).padStart(2,"0")}:00`); if (h < 22) BED_OPTIONS.push(`${String(h).padStart(2,"0")}:30`); }
  const NAP_TIMES = [];
  for (let h = 9; h <= 17; h++) { NAP_TIMES.push(`${String(h).padStart(2,"0")}:00`); NAP_TIMES.push(`${String(h).padStart(2,"0")}:30`); }
  const NAP_DURATIONS = [30, 45, 60, 90, 120];

  const selStyle = { padding:"3px 6px", borderRadius:6, border:"1.5px solid #E8E4DF", fontSize:11, fontWeight:600, background:"#fff", cursor:"pointer" };
  const lblStyle = { fontSize:10, fontWeight:700, color:"#8A9BA5", whiteSpace:"nowrap" };

  const updateNap = (i, field, value) => {
    const naps = [...profile.naps];
    naps[i] = { ...naps[i], [field]: field === "duration" ? parseInt(value) : value };
    onProfileChange({ ...profile, naps });
  };
  const removeNap = (i) => onProfileChange({ ...profile, naps: profile.naps.filter((_, j) => j !== i) });
  const addNap = () => onProfileChange({ ...profile, naps: [...profile.naps, { start: "14:00", duration: 60 }] });

  return (
    <div style={{
      display:"flex", flexWrap:"wrap", alignItems:"center", gap:10, justifyContent:"center",
      background:"#fff", borderRadius:10, border:"1px solid #F0EDE8", padding:"8px 14px",
      marginBottom:16, maxWidth:900, margin:"0 auto 16px",
    }}>
      {/* Wake */}
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <span style={lblStyle}>🌅 Wake</span>
        <select value={profile.wake_time} onChange={e => onProfileChange({ ...profile, wake_time: e.target.value })} style={selStyle}>
          {WAKE_OPTIONS.map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
        </select>
      </div>
      {/* Bed */}
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <span style={lblStyle}>🌙 Bed</span>
        <select value={profile.bed_time} onChange={e => onProfileChange({ ...profile, bed_time: e.target.value })} style={selStyle}>
          {BED_OPTIONS.map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
        </select>
      </div>
      {/* Divider */}
      <div style={{ width:1, height:20, background:"#E8E4DF" }} />
      {/* Naps */}
      {profile.naps.map((nap, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={lblStyle}>😴</span>
          <select value={nap.start} onChange={e => updateNap(i, "start", e.target.value)} style={selStyle}>
            {NAP_TIMES.map(t => <option key={t} value={t}>{formatTime12(t)}</option>)}
          </select>
          <select value={nap.duration} onChange={e => updateNap(i, "duration", e.target.value)} style={selStyle}>
            {NAP_DURATIONS.map(d => <option key={d} value={d}>{d}m</option>)}
          </select>
          <button onClick={() => removeNap(i)} style={{ background:"none", border:"none", color:"#8A9BA5", cursor:"pointer", fontSize:13, padding:0, lineHeight:1 }}>×</button>
        </div>
      ))}
      <button onClick={addNap} style={{ fontSize:10, fontWeight:700, color:"#8A9BA5", background:"none", border:"1px dashed #D1CCC6", borderRadius:6, padding:"3px 8px", cursor:"pointer" }}>+ Nap</button>
    </div>
  );
}

// ── Email Itinerary Modal ─────────────────────────────────────────────────

function EmailModal({ destination, days, onClose, calendarRef }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");

  const handleSend = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    setStatus("Generating PDF...");

    let pdfBase64 = null;
    try {
      if (calendarRef?.current) {
        const html2canvas = (await import("html2canvas")).default;
        const { jsPDF } = await import("jspdf");

        const el = calendarRef.current;
        // Temporarily hide no-print elements for capture
        const hiddenEls = el.querySelectorAll(".no-print, .calendar-sidebar");
        hiddenEls.forEach(e => e.dataset.prevDisplay = e.style.display);
        hiddenEls.forEach(e => e.style.display = "none");

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#FAFAF7",
          logging: false,
          windowWidth: el.scrollWidth + 40,
        });

        // Restore hidden elements
        hiddenEls.forEach(e => e.style.display = e.dataset.prevDisplay || "");

        const imgW = canvas.width;
        const imgH = canvas.height;
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [imgW / 2, imgH / 2] });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgW / 2, imgH / 2);
        pdfBase64 = pdf.output("datauristring").split(",")[1];
      }
    } catch (e) {
      console.warn("PDF generation failed, sending without attachment:", e);
    }

    setStatus("Sending email...");
    try {
      const res = await fetch("/api/send-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), destination, days, pdfBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
      setStatus("");
    }
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(28,43,51,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20 }}>
      <div style={{ background:"#fff",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:380,fontFamily:"'Nunito',sans-serif",boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:800,margin:0,color:"#1C2B33" }}>📧 Email Itinerary</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#8A9BA5",lineHeight:1 }}>×</button>
        </div>

        {sent ? (
          <div style={{ textAlign:"center",padding:"16px 0" }}>
            <div style={{ fontSize:36,marginBottom:8 }}>✅</div>
            <p style={{ fontSize:14,fontWeight:700,color:"#2D8A4E",marginBottom:4 }}>Itinerary sent!</p>
            <p style={{ fontSize:12,color:"#8A9BA5" }}>Check {email} for your {destination} itinerary.</p>
            <button onClick={onClose} style={{ marginTop:16,padding:"10px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#E8643A,#F09A3A)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer" }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize:12,color:"#8A9BA5",marginBottom:12,lineHeight:1.5 }}>
              We'll send your {destination} itinerary with a visual PDF attachment so you can access it on the go.
            </p>

            <label style={{ display:"block",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"#8A9BA5",marginBottom:4 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              onKeyDown={e => e.key === "Enter" && handleSend()}
              style={{ width:"100%",padding:"11px 14px",borderRadius:10,border:"2px solid #F0EDE8",fontSize:14,fontWeight:600,boxSizing:"border-box",fontFamily:"'Nunito',sans-serif" }}
            />

            {error && (
              <p style={{ fontSize:11,color:"#DC2626",marginTop:6,fontWeight:700 }}>⚠️ {error}</p>
            )}

            <div style={{ display:"flex",gap:8,marginTop:16 }}>
              <button
                onClick={handleSend}
                disabled={!email.trim() || sending}
                style={{
                  flex:1,padding:"11px 0",borderRadius:10,border:"none",
                  background: email.trim() && !sending ? "linear-gradient(135deg,#E8643A,#F09A3A)" : "#F0EDE8",
                  color: email.trim() && !sending ? "#fff" : "#8A9BA5",
                  fontSize:14,fontWeight:800,cursor: email.trim() && !sending ? "pointer" : "not-allowed",
                }}
              >
                {sending ? (status || "Sending...") : "Send Itinerary"}
              </button>
              <button onClick={onClose} style={{ padding:"11px 18px",borderRadius:10,border:"2px solid #F0EDE8",background:"transparent",color:"#8A9BA5",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main WeeklyCalendar ────────────────────────────────────────────────────

export default function WeeklyCalendar({ itinerary, activities, selectedIds, profile, onProfileChange, onBack, onBackToActivities, onNextStep, SaveTripButtonComponent }) {
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const calendarGridRef = useRef(null);
  const [weatherByDate, setWeatherByDate] = useState({});   // date -> { icon, highF, label }
  const [removedBlocks, setRemovedBlocks] = useState([]);   // nap/rest blocks removed by user

  // Fetch real weather on mount
  useEffect(() => {
    const destination = profile?.destination ?? itinerary?.destination;
    const startDate = profile?.start_date;
    const numDays = (itinerary?.days ?? []).length;
    if (!destination || !startDate || !numDays) return;
    fetch(`/api/weather?destination=${encodeURIComponent(destination)}&start_date=${startDate}&days=${numDays}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.weather) setWeatherByDate(data.weather); })
      .catch(() => {}); // silently fall back to mock
  }, []);

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
        const { blockId, dayIndex } = resizeRef.current;
        resizeRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        // Adjust free time blocks that now overlap with the resized block
        setDays(prev => prev.map((d, i) => {
          if (i !== dayIndex) return d;
          const resized = d.slots.find(s => s.id === blockId);
          if (!resized) return d;
          const rStart = timeToMins(resized.start);
          const rEnd = rStart + (resized.duration_mins ?? 60);
          const adjusted = [];
          for (const slot of d.slots) {
            if (slot.id === blockId) { adjusted.push(slot); continue; }
            if (slot.title === "Free Time" && slot.type === "rest") {
              const fStart = timeToMins(slot.start);
              const fEnd = fStart + (slot.duration_mins ?? 0);
              if (fEnd <= rStart || fStart >= rEnd) { adjusted.push(slot); }
              else {
                if (fStart < rStart && rStart - fStart >= 15) adjusted.push({ ...slot, duration_mins: rStart - fStart });
                if (fEnd > rEnd && fEnd - rEnd >= 15) adjusted.push({ ...slot, id: slot.id + "-after", start: minsToTime(rEnd), duration_mins: fEnd - rEnd });
              }
            } else { adjusted.push(slot); }
          }
          return { ...d, slots: adjusted.sort((a, b) => timeToMins(a.start) - timeToMins(b.start)) };
        }));
        // Delay clearing so the click event that follows mouseup can detect the resize
        setTimeout(() => { activeResizeHandleRef.current = false; }, 100);
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
    setDays(prev => {
      const day = prev[dayIndex];
      const block = day?.slots.find(s => s.id === blockId);
      // Save removed nap/rest/meal blocks so they can be re-placed from sidebar
      if (block && (block.type === "nap" || block.type === "rest" || block.type === "meal") && block.title !== "Free Time") {
        setRemovedBlocks(rb => [...rb, { ...block, _removedFrom: dayIndex }]);
      }
      return prev.map((d, i) =>
        i !== dayIndex ? d : { ...d, slots: d.slots.filter(s => s.id !== blockId) }
      );
    });
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
    const dur = activity.duration_mins_typical ?? activity.duration_mins ?? 90;
    const newBlock = {
      id: `act-${activity.id}-${Date.now()}`,
      title: activity.name,
      type: activity.type,
      block_type: "activity",
      activityId: activity.id,
      start: newStart,
      duration_mins: dur,
      location_name: activity.location ?? activity.address ?? null,
      hours: activity.hours,
      duration_category: activity.duration_category,
      description: activity.notes ?? activity.description ?? null,
    };
    const actStart = timeToMins(newStart);
    const actEnd = actStart + dur;

    setDays(prev => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      // Adjust/remove Free Time blocks that overlap with the new activity
      const adjusted = [];
      for (const slot of d.slots) {
        if (slot.title === "Free Time" && slot.type === "rest") {
          const fStart = timeToMins(slot.start);
          const fEnd = fStart + (slot.duration_mins ?? 0);
          // No overlap — keep as-is
          if (fEnd <= actStart || fStart >= actEnd) {
            adjusted.push(slot);
          } else {
            // Free time before the activity
            if (fStart < actStart) {
              const before = actStart - fStart;
              if (before >= 15) adjusted.push({ ...slot, duration_mins: before });
            }
            // Free time after the activity
            if (fEnd > actEnd) {
              const after = fEnd - actEnd;
              if (after >= 15) adjusted.push({ ...slot, id: slot.id + "-after", start: minsToTime(actEnd), duration_mins: after });
            }
          }
        } else {
          adjusted.push(slot);
        }
      }
      const slots = [...adjusted, newBlock].sort((a, b) => timeToMins(a.start) - timeToMins(b.start));
      return { ...d, slots };
    }));
  };

  const tapFromSidebar = (activity) => {
    dropFromSidebar(mobileDay, minsToTime(wakeMins + 120), activity);
    setShowMobileSidebar(false);
  };

  const restoreBlock = (block, removedIndex) => {
    // Put the removed nap/rest/meal block back on its original day
    const targetDay = block._removedFrom ?? 0;
    const restored = { ...block };
    delete restored._removedFrom;
    restored.id = restored.id + "-restored-" + Date.now();
    setDays(prev => prev.map((d, i) => {
      if (i !== targetDay) return d;
      const slots = [...d.slots, restored].sort((a, b) => timeToMins(a.start) - timeToMins(b.start));
      return { ...d, slots };
    }));
    setRemovedBlocks(rb => rb.filter((_, i) => i !== removedIndex));
  };

  const updateBlock = (dayIndex, blockId, updates) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      const slots = d.slots.map(s => {
        if (s.id !== blockId) return s;
        return { ...s, notes: updates.notes, start: updates.start ?? s.start, duration_mins: updates.duration_mins ?? s.duration_mins };
      }).sort((a, b) => timeToMins(a.start) - timeToMins(b.start));
      return { ...d, slots };
    }));
    setEditingNotes(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const placedIds = new Set(days.flatMap(d => d.slots.map(s => s.activityId).filter(Boolean)));
  const selectedActivities = (activities ?? []).filter(a => selectedIds?.has(a.id));
  const unplaced = selectedActivities.filter(a => !placedIds.has(a.id));

  // Build activity lookup map for descriptions
  const activityMap = {};
  for (const a of (activities ?? [])) { activityMap[a.id] = a; }

  // Resolve editing block from state — include description from activity map
  const editingBlock = editingNotes
    ? (() => {
        const slot = days[editingNotes.dayIndex]?.slots.find(s => s.id === editingNotes.blockId);
        if (!slot) return null;
        const desc = slot.description || (slot.activityId && activityMap[slot.activityId]?.notes) || null;
        return { ...slot, description: desc };
      })()
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
      {/* Header — icon inline with title */}
      <div style={{ textAlign:"center",marginBottom:8 }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:"clamp(20px,5vw,26px)",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:10,margin:0 }}>
          <span style={{ fontSize:"clamp(24px,5vw,32px)" }}>🗓️</span>
          {profile?.destination ?? itinerary?.destination} Itinerary
        </h2>
      </div>

      {/* Edit buttons (left) + Trip Intensity Meter (centered) */}
      <div className="no-print" style={{ display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,position:"relative" }}>
        {/* Edit buttons — stacked on left */}
        <div style={{ position:"absolute",left:0,display:"flex",flexDirection:"column",gap:4 }}>
          <button onClick={onBackToActivities} style={{ padding:"6px 12px",borderRadius:9,border:"2px solid #0B7A8E",background:"#fff",color:"#0B7A8E",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}>← Edit Activities</button>
          <button onClick={onBack} style={{ padding:"6px 12px",borderRadius:9,border:"2px solid #F0EDE8",background:"transparent",color:"#8A9BA5",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}>← Edit Family</button>
        </div>
        {/* Centered meter */}
        <TripIntensityMeter tripIntensity={itinerary?.tripIntensity} days={days} />
      </div>

      {/* Schedule Controls Bar — wake/bed/nap adjustment below meter */}
      {onProfileChange && (
        <div className="no-print">
          <ScheduleControlsBar profile={profile} onProfileChange={onProfileChange} />
        </div>
      )}

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
            const wx = weatherByDate[day.date] || getMockWeather(day.date);
            return (
              <div style={{
                padding:"10px 12px", borderRadius:"10px 10px 0 0",
                background: isWE ? "linear-gradient(135deg,#FFF3E0,#FFF9F0)" : "linear-gradient(135deg,#E6F6F8,#F0FAFB)",
                border:"1px solid #E8E4DF", borderBottom:"none",
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:800, color:"#1C2B33" }}>Day {day.day}</span>
                    <span style={{ display:"flex", alignItems:"center", gap:2 }} title={wx.label}>
                      <span style={{ fontSize:14 }}>{wx.icon}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:"#1C2B33" }}>{wx.highF}°F</span>
                    </span>
                  </div>
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

          {/* Full-width day column with time gutter */}
          {days[mobileDay] && (
            <div style={{ display:"flex" }}>
              <TimeGutter wakeMins={wakeMins} bedMins={bedMins} topOffset={0} />
              <div style={{ flex:1, minWidth:0 }}>
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
                  activityMap={activityMap}
                />
              </div>
            </div>
          )}

          {/* Unscheduled activities toggle */}
          <button className="no-print" onClick={() => setShowMobileSidebar(s => !s)}
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
            <div className="no-print" style={{ background:"#fff", borderRadius:"0 0 12px 12px", border:"1.5px solid #E8E4DF", borderTop:"none", padding:"10px" }}>
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

              {/* Removed nap/rest blocks */}
              {removedBlocks.length > 0 && (
                <>
                  <div style={{ fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#8A9BA5",marginTop:10,marginBottom:6,borderTop:"1px solid #F0EDE8",paddingTop:8 }}>
                    Removed ({removedBlocks.length})
                  </div>
                  {removedBlocks.map((b, i) => {
                    const emoji = b.type === "nap" ? "😴" : b.type === "meal" ? "🍽️" : "☁️";
                    return (
                      <div key={b.id + "-m-" + i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px", borderRadius:8, background:b.type === "nap" ? "#F3F4F6" : "#FFF9F0", border:`1.5px solid ${b.type === "nap" ? "#D1D5DB" : "#F59E0B55"}`, marginBottom:6 }}>
                        <span style={{ fontSize:15, flexShrink:0 }}>{emoji}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:"#1C2B33" }}>{b.title}</div>
                          <div style={{ fontSize:10, color:"#8A9BA5" }}>{b.duration_mins}m</div>
                        </div>
                        <button onClick={() => restoreBlock(b, i)}
                          style={{ padding:"6px 10px", borderRadius:6, border:"none", background:"linear-gradient(135deg,#E8643A,#F09A3A)", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                          ↩ Restore
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display:"flex", justifyContent:"center", marginTop:16, gap:10, flexWrap:"wrap", alignItems:"center" }}>
            {SaveTripButtonComponent && <SaveTripButtonComponent itinerary={currentItinerary} />}
            <button onClick={() => window.print()} className="no-print" style={{ padding:"11px 18px", borderRadius:12, border:"2px solid #0B7A8E", background:"#E6F6F8", color:"#0B7A8E", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              🖨️ Print / PDF
            </button>
            <button className="no-print" onClick={() => setShowEmailModal(true)} style={{ padding:"11px 18px", borderRadius:12, border:"2px solid #0B7A8E", background:"#fff", color:"#0B7A8E", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              📧 Email
            </button>
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
            removedBlocks={removedBlocks}
            onDragStart={(activity) => setDragState({ active: true, source: "sidebar", activity })}
            onRestoreBlock={restoreBlock}
          />

          <div ref={calendarGridRef} style={{ flex:1, minWidth:0 }}>
            {weeks.map((week, wi) => (
              <div key={wi} className={wi > 0 ? "print-break" : undefined} style={{ marginBottom:28 }}>
                {/* Print-only header repeat for page 2+ */}
                {wi > 0 && (
                  <div className="print-header" style={{ display:"none", textAlign:"center", marginBottom:8 }}>
                    <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:10, margin:0 }}>
                      <span style={{ fontSize:26 }}>🗓️</span>
                      {profile?.destination ?? itinerary?.destination} Itinerary
                    </h2>
                  </div>
                )}
                {weeks.length > 1 && (
                  <div style={{ fontSize:12, fontWeight:700, color:"#8A9BA5", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>
                    Week {wi + 1}
                  </div>
                )}
                <div className="week-scroll" style={{ display:"flex", gap:4, paddingBottom:8 }}>
                  <TimeGutter wakeMins={wakeMins} bedMins={bedMins} topOffset={DESKTOP_HEADER_H} />
                  {week.map((day) => {
                    const isWE = (() => { const d = new Date(day.date + "T00:00:00"); return d.getDay() === 0 || d.getDay() === 6; })();
                    return (
                      <div key={day.day} style={{ flex:1, minWidth:0 }}>
                        {(() => { const wx = weatherByDate[day.date] || getMockWeather(day.date); return (
                        <div style={{
                          padding:"8px 10px", borderRadius:"10px 10px 0 0",
                          background: isWE ? "linear-gradient(135deg,#FFF3E0,#FFF9F0)" : "linear-gradient(135deg,#E6F6F8,#F0FAFB)",
                          border:"1px solid #E8E4DF", borderBottom:"none",
                        }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:800, color:"#1C2B33" }}>Day {day.day}</div>
                            <span style={{ display:"flex", alignItems:"center", gap:2 }} title={wx.label}>
                              <span style={{ fontSize:13 }}>{wx.icon}</span>
                              <span style={{ fontSize:10, fontWeight:700, color:"#1C2B33" }}>{wx.highF}°</span>
                            </span>
                          </div>
                          <div style={{ fontSize:10, fontWeight:600, color: isWE ? "#E8643A" : "#0B7A8E", marginTop:1 }}>{formatDateShort(day.date)}</div>
                          <button
                            onClick={() => setShowAddModal({ dayIndex: day._idx, startTime: minsToTime(wakeMins + 120) })}
                            style={{ marginTop:5, padding:"2px 8px", borderRadius:6, border:"1px dashed #8A9BA5", background:"transparent", color:"#8A9BA5", fontSize:10, fontWeight:700, cursor:"pointer" }}
                          >+ Add block</button>
                        </div>); })()}

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
                          activityMap={activityMap}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="no-print" style={{ display:"flex", justifyContent:"center", marginTop:16, gap:12, flexWrap:"wrap", alignItems:"center" }}>
              {SaveTripButtonComponent && <SaveTripButtonComponent itinerary={currentItinerary} />}
              <button onClick={() => window.print()} style={{ padding:"11px 18px", borderRadius:12, border:"2px solid #0B7A8E", background:"#E6F6F8", color:"#0B7A8E", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                🖨️ Print / PDF
              </button>
              <button onClick={() => setShowEmailModal(true)} style={{ padding:"11px 18px", borderRadius:12, border:"2px solid #0B7A8E", background:"#fff", color:"#0B7A8E", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                📧 Email
              </button>
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

            <details className="no-print" style={{ marginTop:12 }}>
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
          dayIndex={editingNotes.dayIndex}
          totalDays={days.length}
          onSave={(updates) => updateBlock(editingNotes.dayIndex, editingNotes.blockId, updates)}
          onMoveToDay={moveBlock}
          onClose={() => setEditingNotes(null)}
        />
      )}

      {/* Email itinerary modal */}
      {showEmailModal && (
        <EmailModal
          destination={profile?.destination ?? itinerary?.destination ?? "Trip"}
          days={days}
          onClose={() => setShowEmailModal(false)}
          calendarRef={calendarGridRef}
        />
      )}
    </div>
  );
}
