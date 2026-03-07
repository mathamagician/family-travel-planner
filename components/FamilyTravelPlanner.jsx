"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSupabase } from "./Providers";
import UserMenu from "./UserMenu";
import MyTripsPanel from "./MyTripsPanel";
import SaveTripButton from "./SaveTripButton";
import WeeklyCalendar from "./WeeklyCalendar";
import PackingList from "./PackingList";

const VIATOR_PID = process.env.NEXT_PUBLIC_VIATOR_PID;
const BOOKABLE_TYPES = new Set(["attraction", "entertainment", "museum", "hike", "outdoors", "culture"]);

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
        display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:7,
        background:"#EEF6FF",border:"1px solid #60A5FA",color:"#1D4ED8",
        fontSize:10,fontWeight:800,textDecoration:"none",
      }}
    >
      🎟 Book tickets
    </a>
  );
}

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

const ENERGY_CONFIG = {
  low: { icon: "😌", label: "Chill", color: "#16A34A", bg: "#F0FDF4" },
  med: { icon: "⚡", label: "Moderate", color: "#D97706", bg: "#FFFBEB" },
  high: { icon: "🔥", label: "High", color: "#DC2626", bg: "#FEF2F2" },
};
const ENERGY_BY_TYPE = {
  attraction:"high", entertainment:"high",
  outdoors:"med", hike:"med",
  museum:"low", culture:"low", park:"low", food:"low",
};

// Map activity types to preference keys
const TYPE_TO_PREF = {
  outdoors: ["beach_water", "hiking_nature"],
  park: ["parks_playgrounds"],
  hike: ["hiking_nature"],
  museum: ["museums_science"],
  attraction: ["theme_parks"],
  entertainment: ["theme_parks", "indoor_play"],
  culture: ["arts_culture"],
  food: [],
};

function isPreferred(activity, preferences) {
  const prefKeys = TYPE_TO_PREF[activity.type] || [];
  return prefKeys.some(k => preferences[k]);
}

function getMockWeather(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
  const seed = Math.abs(hash);
  const conditions = [
    { icon: "☀️", label: "Sunny" },
    { icon: "⛅", label: "Partly Cloudy" },
    { icon: "☁️", label: "Cloudy" },
    { icon: "🌧️", label: "Rain" },
    { icon: "☀️", label: "Sunny" },
    { icon: "⛅", label: "Partly Cloudy" },
    { icon: "☀️", label: "Sunny" },
  ];
  const month = parseInt(dateStr.split("-")[1]);
  const baseTempByMonth = { 1:38,2:42,3:52,4:62,5:72,6:82,7:88,8:86,9:78,10:66,11:52,12:40 };
  const base = baseTempByMonth[month] || 70;
  return { ...conditions[seed % conditions.length], highF: base + (seed % 15) - 7 };
}

const SAMPLE_ACTIVITIES = [
  { id: "sdzoo", name: "San Diego Zoo", type: "attraction", hours: "9:00 AM – 5:00 PM", notes: "Large zoo with kid-friendly exhibits. Stroller-friendly.", location: "2920 Zoo Dr, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "#" },
  { id: "balboa", name: "Balboa Park", type: "park", hours: "6:00 AM – 10:00 PM", notes: "Large park with playgrounds, museums; good for flexible days.", location: "Balboa Park, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "#" },
  { id: "la_jolla_cove", name: "La Jolla Cove / Beach", type: "outdoors", hours: "Open 24 hrs; best 7 AM – 7 PM", notes: "Beach time, tide pools, easy strolls. Bring sun protection.", location: "La Jolla Cove, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "#" },
  { id: "seaworld", name: "SeaWorld San Diego", type: "attraction", hours: "10:00 AM – 6:00 PM", notes: "Marine shows and aquarium exhibits; toddler-friendly areas.", location: "500 Sea World Dr, San Diego, CA", age_range: "2-12", duration_mins: 240, affiliate: "#" },
  { id: "old_town", name: "Old Town Historic Park", type: "culture", hours: "10:00 AM – 5:00 PM", notes: "Open-air historic area with shops and casual restaurants.", location: "Old Town San Diego State Historic Park", age_range: "0-12", duration_mins: 120, affiliate: "#" },
  { id: "fleet_science", name: "Fleet Science Center", type: "museum", hours: "10:00 AM – 5:00 PM", notes: "Hands-on exhibits for kids; good indoor backup.", location: "1875 El Prado, San Diego, CA", age_range: "3-12", duration_mins: 120, affiliate: "#" },
  { id: "torrey_pines", name: "Torrey Pines Reserve", type: "outdoors", hours: "7:15 AM – sunset", notes: "Short, scenic trails suitable for families.", location: "12600 N Torrey Pines Rd, La Jolla, CA", age_range: "2-12", duration_mins: 120, affiliate: "#" },
  { id: "legoland", name: "LEGOLAND California", type: "attraction", hours: "10:00 AM – 6:00 PM", notes: "Theme park designed for kids 2-12. Many rides for little ones.", location: "1 Legoland Dr, Carlsbad, CA", age_range: "2-12", duration_mins: 300, affiliate: "#" },
  { id: "birch_aquarium", name: "Birch Aquarium", type: "museum", hours: "9:00 AM – 5:00 PM", notes: "Small, manageable aquarium perfect for toddlers.", location: "2300 Expedition Way, La Jolla, CA", age_range: "0-12", duration_mins: 120, affiliate: "#" },
  { id: "mission_bay", name: "Mission Bay Park", type: "park", hours: "Open 24 hrs", notes: "Calm water, playgrounds, bike paths. Great for picnics.", location: "Mission Bay Park, San Diego, CA", age_range: "0-12", duration_mins: 180, affiliate: "#" },
  { id: "uss_midway", name: "USS Midway Museum", type: "museum", hours: "10:00 AM – 5:00 PM", notes: "Aircraft carrier museum. Best for 4+.", location: "910 N Harbor Dr, San Diego, CA", age_range: "4-12", duration_mins: 150, affiliate: "#" },
  { id: "coronado_beach", name: "Coronado Beach", type: "outdoors", hours: "Open 24 hrs", notes: "Wide sandy beach, gentle waves.", location: "Coronado Beach, Coronado, CA", age_range: "0-12", duration_mins: 180, affiliate: "#" },
  { id: "sd_nat_history", name: "SD Natural History Museum", type: "museum", hours: "10:00 AM – 5:00 PM", notes: "Dinosaur exhibits kids love. Inside Balboa Park.", location: "1788 El Prado, San Diego, CA", age_range: "2-12", duration_mins: 120, affiliate: "#" },
  { id: "belmont_park", name: "Belmont Park", type: "entertainment", hours: "11:00 AM – 8:00 PM", notes: "Beachside amusement park with kiddie rides.", location: "3146 Mission Blvd, San Diego, CA", age_range: "2-12", duration_mins: 150, affiliate: "#" },
];

const HALF_HOURS = [];
for (let h = 5; h <= 22; h++) {
  HALF_HOURS.push(String(h).padStart(2, "0") + ":00");
  if (h < 22) HALF_HOURS.push(String(h).padStart(2, "0") + ":30");
}
const DURATIONS = [30, 60, 90, 120, 150, 180];

const DEFAULT_PROFILE = {
  adults: 2, kids: [{ age: 5 }, { age: 2 }], trip_length_days: 5,
  wake_time: "07:00", bed_time: "20:00",
  naps: [{ start: "12:30", duration: 90 }],
  preferences: { beach_water: true, parks_playgrounds: true, hiking_nature: true, farms_animals: true, museums_science: true, theme_parks: true, indoor_play: true, arts_culture: true },
  restaurants: { american: true, mexican: true, asian: true, italian: true, seafood: true, other: true, none: false },
  destination: "San Diego", start_date: "2026-04-15",
};

/* ─── UTILITIES ─── */

function formatDuration(mins) { if (mins < 60) return mins + "m"; const h = Math.floor(mins/60), m = mins%60; return m > 0 ? h+"h "+m+"m" : h+"h"; }
function timeToMins(t) { const [h,m] = t.split(":").map(Number); return h*60+m; }
function minsToTime(m) { return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0"); }
function formatTime12(t) { const [h,m] = t.split(":").map(Number); return (h%12||12)+":"+String(m).padStart(2,"0")+" "+(h>=12?"PM":"AM"); }
function addDays(ds,n) { const d=new Date(ds+"T00:00:00"); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0]; }
function formatDateShort(ds) { return new Date(ds+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}); }

/* ─── ITINERARY GENERATION — Phase B: Duration-aware genius scheduler ─── */

// Duration category → preferred minutes (used for scheduling decisions)
const CAT_MINS = { "full_day":480, "half_day":240, "2-4h":180, "1-2h":90, "under_1h":45 };

function activityDuration(act) {
  return CAT_MINS[act.duration_category] ?? act.duration_mins_typical ?? act.duration_mins ?? 90;
}

function generateItinerary(profile, selectedActivities) {
  const wake=timeToMins(profile.wake_time), bed=timeToMins(profile.bed_time);
  const naps=profile.naps.map(n=>({start:timeToMins(n.start),end:timeToMins(n.start)+n.duration})).sort((a,b)=>a.start-b.start);

  function getWindows(){
    const w=[];let cur=wake;
    for(const nap of naps){
      if(nap.start>cur+45)w.push({start:cur,end:nap.start,type:"free"});
      w.push({start:nap.start,end:nap.end,type:"nap"});
      cur=nap.end+15;
    }
    const dinnerStart=bed-90;
    if(dinnerStart>cur+45)w.push({start:cur,end:dinnerStart,type:"free"});
    w.push({start:dinnerStart,end:bed,type:"dinner"});
    return w;
  }

  // Sort: longest activities first so they get the best time slots
  const pool=[...selectedActivities].sort((a,b)=>activityDuration(b)-activityDuration(a));
  const windows=getWindows();
  const days=[];
  let poolIdx=0;

  for(let d=0;d<profile.trip_length_days;d++){
    const date=addDays(profile.start_date,d);
    const slots=[];
    let dayConsumed=false;

    for(const w of windows){
      if(w.type==="nap"){
        slots.push({title:"Nap / Rest",start:minsToTime(w.start),duration_mins:w.end-w.start,type:"rest"});
        continue;
      }
      if(w.type==="dinner"){
        slots.push({title:"Dinner / Wind Down",start:minsToTime(w.start),duration_mins:w.end-w.start,type:"rest"});
        continue;
      }
      if(dayConsumed){
        slots.push({title:"Free Time",start:minsToTime(w.start),duration_mins:w.end-w.start-15,type:"rest"});
        continue;
      }

      const windowDuration=w.end-w.start-15;
      if(windowDuration<45)continue;

      // Check: is the next activity a full_day? If window is large enough, let it own the day
      const peek=pool[poolIdx];
      if(peek && peek.duration_category==="full_day" && windowDuration>=300){
        slots.push({title:peek.name,start:minsToTime(w.start),duration_mins:windowDuration,location:peek.location,type:peek.type,activityId:peek.id,hours:peek.hours,duration_category:peek.duration_category});
        poolIdx++;
        dayConsumed=true;
        continue;
      }

      // Fill window greedily with activities that fit
      let t=w.start;
      let avail=windowDuration;

      while(avail>=45 && poolIdx<pool.length){
        const act=pool[poolIdx];
        const needed=activityDuration(act);

        // Skip full_day activities if window isn't big enough
        if(act.duration_category==="full_day" && avail<300)break;

        // If activity needs more time than available AND there are other activities left, move on
        if(needed>avail+60 && pool.length-poolIdx>1)break;

        const used=Math.min(needed,avail);
        slots.push({title:act.name,start:minsToTime(t),duration_mins:used,location:act.location,type:act.type,activityId:act.id,hours:act.hours,duration_category:act.duration_category});
        t+=used+15; // 15 min travel/buffer between activities
        avail-=(used+15);
        poolIdx++;

        // After a half_day or longer, stop filling this window (don't over-schedule)
        if(["full_day","half_day"].includes(act.duration_category))break;
      }

      // Fill any remaining window with free time
      if(avail>=45){
        slots.push({title:"Free Time",start:minsToTime(t),duration_mins:avail,type:"rest"});
      }
    }
    days.push({day:d+1,date,slots});
  }

  return {profile:profile.adults+" adults, "+profile.kids.length+" kids",destination:profile.destination,days};
}

/* ─── STYLES ─── */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Nunito:wght@400;500;600;700;800&display=swap');
:root{--sand:#FAF6F1;--ocean:#0B7A8E;--ocean-light:#E6F6F8;--sunset:#E8643A;--sunset-light:#FEF0EB;--ink:#1C2B33;--stone:#8A9BA5;--cloud:#FFF;--mist:#F0EDE8;}
*{box-sizing:border-box;margin:0;padding:0;}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
.step-enter{animation:slideUp .5s ease-out forwards}
input,select{font-family:'Nunito',sans-serif}
input:focus,select:focus{outline:none;border-color:var(--ocean)!important;box-shadow:0 0 0 3px rgba(11,122,142,.12)}
.week-scroll::-webkit-scrollbar{height:6px}.week-scroll::-webkit-scrollbar-track{background:var(--mist);border-radius:3px}.week-scroll::-webkit-scrollbar-thumb{background:var(--stone);border-radius:3px}
.sidebar-scroll::-webkit-scrollbar{width:5px}.sidebar-scroll::-webkit-scrollbar-track{background:transparent}.sidebar-scroll::-webkit-scrollbar-thumb{background:var(--stone);border-radius:3px}
.drag-chip{cursor:grab;user-select:none;transition:transform .15s,box-shadow .15s}.drag-chip:active{cursor:grabbing;transform:scale(1.05);box-shadow:0 6px 20px rgba(0,0,0,.15)}
.drop-zone{transition:background .2s,border-color .2s}
.drop-zone.drag-over{background:var(--sunset-light)!important;border-color:var(--sunset)!important}
`;

/* ─── STEP INDICATOR ─── */

function StepIndicator({current,steps}){return(
<div style={{display:"flex",alignItems:"center",justifyContent:"center",margin:"14px 0 6px"}}>
{steps.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center"}}>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
<div style={{width:28,height:28,borderRadius:"50%",background:i<current?"var(--ocean)":i===current?"var(--sunset)":"var(--mist)",color:i<=current?"#fff":"var(--stone)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,transition:"all .3s",boxShadow:i===current?"0 3px 10px rgba(232,100,58,.3)":"none"}}>{i<current?"✓":i+1}</div>
<span style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:i===current?"var(--sunset)":i<current?"var(--ocean)":"var(--stone)",whiteSpace:"nowrap"}}>{s}</span>
</div>{i<steps.length-1&&<div style={{width:28,height:2,margin:"0 4px",background:i<current?"var(--ocean)":"var(--mist)",borderRadius:2,marginBottom:14}}/>}</div>)}
</div>);}

/* ─── STEP 1: FAMILY ─── */

function FamilyProfileStep({profile,setProfile,onNext}){
  const updateKid=(i,age)=>{const k=[...profile.kids];k[i]={age:parseInt(age)||0};setProfile({...profile,kids:k});};
  const addKid=()=>setProfile({...profile,kids:[...profile.kids,{age:1}]});
  const removeKid=i=>setProfile({...profile,kids:profile.kids.filter((_,j)=>j!==i)});
  const togglePref=k=>setProfile({...profile,preferences:{...profile.preferences,[k]:!profile.preferences[k]}});
  const toggleRestaurant=k=>{
    if(k==="none"){
      const newNone=!profile.restaurants?.none;
      if(newNone)setProfile({...profile,restaurants:{american:false,mexican:false,asian:false,italian:false,seafood:false,other:false,none:true}});
      else setProfile({...profile,restaurants:{...profile.restaurants,none:false}});
    } else {
      setProfile({...profile,restaurants:{...profile.restaurants,[k]:!profile.restaurants?.[k],none:false}});
    }
  };
  const addNap=()=>setProfile({...profile,naps:[...profile.naps,{start:"14:00",duration:60}]});
  const removeNap=i=>setProfile({...profile,naps:profile.naps.filter((_,j)=>j!==i)});
  const updateNap=(i,f,v)=>{const n=[...profile.naps];n[i]={...n[i],[f]:f==="duration"?parseInt(v):v};setProfile({...profile,naps:n});};
  const [daysInput, setDaysInput] = useState(String(profile.trip_length_days));
  const [adultsInput, setAdultsInput] = useState(String(profile.adults));
  const S={width:"100%",padding:"9px 12px",borderRadius:9,border:"2px solid var(--mist)",fontSize:13,fontWeight:600,background:"#fff",color:"var(--ink)",transition:"all .2s"};
  const L={display:"block",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"var(--stone)",marginBottom:5};
  const ok=profile.destination.trim()&&profile.kids.length>0&&profile.trip_length_days>0;
  const prefBtn=(active,color)=>({padding:"5px 10px",borderRadius:14,fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",border:`2px solid ${active?color:"var(--mist)"}`,background:active?(color==="var(--ocean)"?"var(--ocean-light)":"#FAF5FF"):"transparent",color:active?color:"var(--stone)"});
  const restaurants=profile.restaurants??{american:true,mexican:true,asian:false,italian:false,seafood:false,other:false,none:false};
  return(
  <div className="step-enter" style={{maxWidth:620,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:4,marginTop:8}}>
      <span style={{fontSize:32}}>👨‍👩‍👧‍👦</span>
      <div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:800,lineHeight:1.2}}>Tell Us About Your Family</h2>
        <p style={{color:"var(--stone)",fontSize:11,marginTop:1}}>We&apos;ll build an itinerary around your kids&apos; routine.</p>
      </div>
    </div>
    <div style={{background:"var(--cloud)",borderRadius:16,padding:18,border:"1px solid var(--mist)",boxShadow:"0 2px 10px rgba(0,0,0,.04)"}}>
      {/* Destination + Date + Days + Adults — responsive (desktop: row, mobile: stacked) */}
      <div className="trip-fields-grid">
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <label style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"var(--stone)",whiteSpace:"nowrap"}}>Destination</label>
          <input style={{...S,padding:"7px 10px",fontSize:12}} type="text" value={profile.destination} onChange={e=>setProfile({...profile,destination:e.target.value})} placeholder="e.g. San Diego"/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <label style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"var(--stone)",whiteSpace:"nowrap"}}>Date</label>
          <input style={{...S,padding:"7px 10px",fontSize:12}} type="date" value={profile.start_date} onChange={e=>setProfile({...profile,start_date:e.target.value})}/>
        </div>
        <div className="trip-days-adults">
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <label style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"var(--stone)",whiteSpace:"nowrap"}}>Days</label>
            <input style={{...S,padding:"7px 10px",fontSize:12}} type="number" value={daysInput} onChange={e=>setDaysInput(e.target.value)} onBlur={()=>{const v=Math.max(1,parseInt(daysInput)||1);setDaysInput(String(v));setProfile(p=>({...p,trip_length_days:v}));}} min={1} max={21}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <label style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"var(--stone)",whiteSpace:"nowrap"}}>Adults</label>
            <input style={{...S,padding:"7px 10px",fontSize:12}} type="number" value={adultsInput} onChange={e=>setAdultsInput(e.target.value)} onBlur={()=>{const v=Math.max(1,parseInt(adultsInput)||1);setAdultsInput(String(v));setProfile(p=>({...p,adults:v}));}} min={1} max={6}/>
          </div>
        </div>
      </div>
      {/* Children */}
      <div style={{marginBottom:12}}>
        <label style={L}>Children</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {profile.kids.map((kid,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,background:"var(--ocean-light)",borderRadius:8,padding:"5px 8px"}}>
            <span style={{fontSize:14}}>👶</span><span style={{fontSize:11,fontWeight:700,color:"var(--ocean)"}}>Age</span>
            <input type="number" min={0} max={17} value={kid.age} onChange={e=>updateKid(i,e.target.value)} style={{width:38,padding:"2px 4px",borderRadius:5,border:"2px solid transparent",fontSize:12,fontWeight:700,textAlign:"center",background:"#fff"}}/>
            {profile.kids.length>1&&<button onClick={()=>removeKid(i)} style={{background:"none",border:"none",color:"var(--stone)",cursor:"pointer",fontSize:14,lineHeight:1,padding:0}}>×</button>}
          </div>)}
          <button onClick={addKid} style={{display:"flex",alignItems:"center",gap:3,background:"var(--mist)",borderRadius:8,padding:"5px 10px",border:"2px dashed var(--stone)",cursor:"pointer",fontSize:11,fontWeight:700,color:"var(--stone)"}}>+ Add Child</button>
        </div>
      </div>
      {/* Wake + Bed inline */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <label style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"var(--stone)",whiteSpace:"nowrap"}}>🌅 Wake</label>
          <select style={{...S,padding:"7px 10px",fontSize:12}} value={profile.wake_time} onChange={e=>setProfile({...profile,wake_time:e.target.value})}>
            {HALF_HOURS.filter(t=>timeToMins(t)>=300&&timeToMins(t)<=600).map(t=><option key={t} value={t}>{formatTime12(t)}</option>)}
          </select>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <label style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"var(--stone)",whiteSpace:"nowrap"}}>🌙 Bed</label>
          <select style={{...S,padding:"7px 10px",fontSize:12}} value={profile.bed_time} onChange={e=>setProfile({...profile,bed_time:e.target.value})}>
            {HALF_HOURS.filter(t=>timeToMins(t)>=1020&&timeToMins(t)<=1320).map(t=><option key={t} value={t}>{formatTime12(t)}</option>)}
          </select>
        </div>
      </div>
      {/* Naps inline chips */}
      <div style={{marginBottom:12}}>
        <label style={L}>😴 Nap Times</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
          {profile.naps.map((nap,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"#FFF9F0",borderRadius:8,padding:"5px 10px",border:"1px solid #F0E6D6"}}>
              <span style={{fontSize:14}}>😴</span>
              <select value={nap.start} onChange={e=>updateNap(i,"start",e.target.value)} style={{padding:"2px 4px",borderRadius:5,border:"1.5px solid var(--mist)",fontSize:11,fontWeight:600,background:"#fff"}}>
                {HALF_HOURS.filter(t=>timeToMins(t)>=540&&timeToMins(t)<=1020).map(t=><option key={t} value={t}>{formatTime12(t)}</option>)}
              </select>
              <span style={{fontSize:10,color:"var(--stone)",fontWeight:700}}>for</span>
              <select value={nap.duration} onChange={e=>updateNap(i,"duration",e.target.value)} style={{padding:"2px 4px",borderRadius:5,border:"1.5px solid var(--mist)",fontSize:11,fontWeight:600,background:"#fff"}}>
                {DURATIONS.map(d=><option key={d} value={d}>{formatDuration(d)}</option>)}
              </select>
              <button onClick={()=>removeNap(i)} style={{background:"none",border:"none",color:"var(--stone)",cursor:"pointer",fontSize:13,lineHeight:1,padding:0}}>×</button>
            </div>
          ))}
          <button onClick={addNap} style={{display:"flex",alignItems:"center",gap:3,background:"var(--mist)",borderRadius:8,padding:"5px 10px",border:"2px dashed var(--stone)",cursor:"pointer",fontSize:11,fontWeight:700,color:"var(--stone)"}}>+ Add Nap</button>
        </div>
      </div>
      {/* Preferences */}
      <div>
        <label style={L}>🌞 Outdoor</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5,marginBottom:10}}>
          {[{key:"beach_water",label:"🏖️ Beach"},{key:"parks_playgrounds",label:"🌳 Parks"},{key:"hiking_nature",label:"🥾 Hikes"},{key:"farms_animals",label:"🐄 Farms"}].map(p=>
            <button key={p.key} onClick={()=>togglePref(p.key)} style={prefBtn(profile.preferences[p.key],"var(--ocean)")}>{p.label}</button>)}
        </div>
        <label style={L}>🏠 Indoor</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5,marginBottom:10}}>
          {[{key:"museums_science",label:"🔬 Museums"},{key:"theme_parks",label:"🎢 Theme Parks"},{key:"indoor_play",label:"🎪 Play"},{key:"arts_culture",label:"🎭 Arts"}].map(p=>
            <button key={p.key} onClick={()=>togglePref(p.key)} style={prefBtn(profile.preferences[p.key],"#7C3AED")}>{p.label}</button>)}
        </div>
        <label style={L}>🍽️ Restaurants</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {[{key:"american",label:"🍔 American"},{key:"mexican",label:"🌮 Mexican"},{key:"asian",label:"🍜 Asian"},{key:"italian",label:"🍕 Italian"},{key:"seafood",label:"🦞 Seafood"},{key:"other",label:"🍽️ Other"},{key:"none",label:"🚫 None"}].map(p=>{
            const isNone=p.key==="none";const active=restaurants[p.key];const disabled=!isNone&&restaurants.none;
            return(<button key={p.key} onClick={()=>!disabled&&toggleRestaurant(p.key)} style={{
              padding:"5px 10px",borderRadius:14,fontSize:11,fontWeight:700,cursor:disabled?"not-allowed":"pointer",transition:"all .2s",whiteSpace:"nowrap",
              border:`2px solid ${active?(isNone?"#9CA3AF":"#DC2626"):"var(--mist)"}`,
              background:active?(isNone?"#F3F4F6":"#FFF5F5"):"transparent",
              color:active?(isNone?"#6B7280":"#DC2626"):disabled?"#D1CCC6":"var(--stone)",opacity:disabled?0.5:1,
            }}>{p.label}</button>);
          })}
        </div>
      </div>
    </div>
    <div style={{textAlign:"center",marginTop:18}}>
      <button onClick={onNext} disabled={!ok} style={{padding:"12px 40px",borderRadius:11,border:"none",background:ok?"linear-gradient(135deg,var(--sunset),#F09A3A)":"var(--mist)",color:ok?"#fff":"var(--stone)",fontSize:14,fontWeight:800,cursor:ok?"pointer":"not-allowed",boxShadow:ok?"0 5px 16px rgba(232,100,58,.3)":"none"}}>Find Activities →</button>
    </div>
  </div>);
}

/* ─── STEP 2: ACTIVITIES ─── */

function ActivityCard({activity,selected,onToggle,index,destination,isNonPref}){
  const c=TYPE_CONFIG[activity.type]||TYPE_CONFIG.attraction;
  const en=ENERGY_CONFIG[activity.energy ?? ENERGY_BY_TYPE[activity.type] ?? "med"];
  const showGray=isNonPref&&!selected;
  const admissionText = activity.admission_adult_usd > 0
    ? `$${activity.admission_adult_usd}/adult${activity.admission_child_usd > 0 ? ` · $${activity.admission_child_usd}/child` : ""}`
    : (activity.admission_adult_usd === 0 ? "Free" : null);
  return(<div onClick={onToggle} style={{opacity:0,animation:"slideUp .4s ease-out "+index*.04+"s forwards",background:showGray?"#F5F4F2":"#fff",borderRadius:12,border:showGray?"2px dashed #D1CCC6":"2px solid "+(selected?c.color:"#E8E4DF"),cursor:"pointer",transition:"all .25s",boxShadow:selected?"0 3px 12px "+c.color+"22":"none",position:"relative"}}>
    <div style={{position:"absolute",top:10,right:10,width:20,height:20,borderRadius:5,border:"2px solid "+(selected?c.color:"#D1CCC6"),background:selected?c.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {selected&&<span style={{color:"#fff",fontSize:11,fontWeight:800}}>✓</span>}</div>
    <div style={{padding:"12px 12px 10px"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,paddingRight:24}}>
        <span style={{fontSize:18}}>{c.emoji}</span>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:showGray?"var(--stone)":"var(--ink)",lineHeight:1.3}}>{activity.name}</h3>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:5,flexWrap:"wrap"}}>
        <span style={{fontSize:8,fontWeight:800,textTransform:"uppercase",letterSpacing:".05em",color:showGray?"var(--stone)":c.color,background:showGray?"#EBEBEB":c.bg,padding:"1px 6px",borderRadius:4}}>{activity.type}</span>
        {en&&<span style={{fontSize:8,fontWeight:800,color:showGray?"var(--stone)":en.color,background:showGray?"#EBEBEB":en.bg,padding:"1px 6px",borderRadius:4}}>{en.icon} {en.label}</span>}
        {admissionText&&<span style={{fontSize:8,fontWeight:700,color:admissionText==="Free"?"#2D8A4E":"#1C2B33",background:admissionText==="Free"?"#F0FAF4":"#F8F6F2",padding:"1px 6px",borderRadius:4}}>{admissionText}</span>}
      </div>
      <p style={{fontSize:11,color:"var(--stone)",lineHeight:1.4,marginBottom:6}}>{activity.notes}</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,fontSize:10,color:"var(--stone)",marginBottom:6}}>
        <span>🕐 {activity.hours}</span><span>⏱️ {formatDuration(activity.duration_mins)}</span><span>👶 {activity.age_range}</span>
      </div>
      <ViatorButton activity={activity} destination={destination} />
    </div>
  </div>);
}

function ActivitiesStep({profile,activities,setActivities,selectedIds,setSelectedIds,onNext,onBack}){
  const[loading,setLoading]=useState(false),[error,setError]=useState(null);

  const generate=async()=>{setLoading(true);setError(null);try{
    const r=await fetch("/api/generate-activities",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({destination:profile.destination,kids:profile.kids,trip_length_days:profile.trip_length_days,preferences:profile.preferences})});
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||"API error "+r.status);
    const list=Array.isArray(data)?data:(data.activities??[]);
    if(!list.length)throw new Error("No activities returned");
    setActivities(list);
    // Auto-select only preferred activities
    const prefIds=new Set(list.filter(a=>isPreferred(a,profile.preferences)).map(a=>a.id));
    setSelectedIds(prefIds.size>0?prefIds:new Set(list.map(a=>a.id)));
  }catch(e){console.error(e);setError("Generation failed: "+e.message);if(!activities.length){setActivities(SAMPLE_ACTIVITIES);setSelectedIds(new Set(SAMPLE_ACTIVITIES.map(a=>a.id)));}}finally{setLoading(false);}};

  // Auto-generate for the chosen destination on first visit to this step
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{if(!activities.length){generate();}},[]);
  const toggle=id=>{const n=new Set(selectedIds);n.has(id)?n.delete(id):n.add(id);setSelectedIds(n);};

  // Sort: preferred first, then non-preferred
  const preferred=activities.filter(a=>isPreferred(a,profile.preferences));
  const nonPreferred=activities.filter(a=>!isPreferred(a,profile.preferences));
  const sorted=[...preferred,...nonPreferred];

  // 3-state toggle: All → Preferred Only → None → All
  const allSelected=activities.length>0&&selectedIds.size===activities.length;
  const prefOnlySelected=activities.length>0&&preferred.length>0&&preferred.every(a=>selectedIds.has(a.id))&&nonPreferred.every(a=>!selectedIds.has(a.id));
  const cycleSelection=()=>{
    if(allSelected) setSelectedIds(new Set(preferred.map(a=>a.id)));
    else if(prefOnlySelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(activities.map(a=>a.id)));
  };
  const toggleLabel=allSelected?"Preferred Only":prefOnlySelected?"Deselect All":"Select All";

  const NavRow = ({ compact }) => (
    <div style={{display:"flex",alignItems:"center",maxWidth:1060,margin:compact?"16px auto 10px":"0 auto 14px"}}>
      <button onClick={onBack} style={{padding:"7px 14px",borderRadius:9,border:"2px solid var(--mist)",background:"transparent",color:"var(--stone)",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>← Family</button>
      <div style={{flex:1,display:"flex",justifyContent:"center",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        {!compact&&<>
          <button onClick={generate} disabled={loading} style={{padding:"7px 16px",borderRadius:9,border:"2px solid var(--ocean)",background:loading?"var(--ocean-light)":"var(--cloud)",color:"var(--ocean)",fontSize:11,fontWeight:700,cursor:loading?"wait":"pointer",animation:loading?"pulse 1.5s infinite":"none"}}>{loading?"Generating...":"✨ Generate with AI"}</button>
          {activities.length>0&&(
            <button onClick={cycleSelection} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:9,border:"2px solid var(--mist)",background:"transparent",cursor:"pointer",fontSize:11,fontWeight:700,color:"var(--stone)"}}>
              <div style={{width:15,height:15,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid "+(allSelected?"var(--ocean)":prefOnlySelected?"var(--sunset)":"var(--stone)"),background:allSelected?"var(--ocean)":prefOnlySelected?"var(--sunset)":"transparent"}}>
                {(allSelected||prefOnlySelected)&&<span style={{color:"#fff",fontSize:9,fontWeight:800}}>{allSelected?"✓":"★"}</span>}
              </div>
              {toggleLabel}
            </button>
          )}
          {activities.length>0&&<span style={{fontSize:11,color:"var(--stone)",fontWeight:600}}>{selectedIds.size}/{activities.length}</span>}
        </>}
        {compact&&<>
          <div style={{flex:1,height:1,background:"var(--mist)"}}/>
          <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--stone)"}}>Other Activities</span>
          <div style={{flex:1,height:1,background:"var(--mist)"}}/>
        </>}
      </div>
      <button onClick={onNext} disabled={!selectedIds.size} style={{padding:"7px 16px",borderRadius:9,border:"none",background:selectedIds.size?"linear-gradient(135deg,var(--sunset),#F09A3A)":"var(--mist)",color:selectedIds.size?"#fff":"var(--stone)",fontSize:11,fontWeight:800,cursor:selectedIds.size?"pointer":"not-allowed",boxShadow:selectedIds.size?"0 4px 12px rgba(232,100,58,.3)":"none",flexShrink:0}}>Build Itinerary →</button>
    </div>
  );

  return(<div className="step-enter">
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8,marginTop:8}}>
      <span style={{fontSize:28}}>🎯</span>
      <div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:800}}>Activities in {profile.destination}</h2>
        <p style={{color:"var(--stone)",fontSize:11,marginTop:1}}>Preferred activities are pre-selected. Others appear below.</p>
      </div>
    </div>

    {/* Top nav row: ← Family | Generate | Toggle | count | Build Itinerary → */}
    <NavRow compact={false} />

    {error&&<div style={{background:"var(--sunset-light)",borderRadius:9,padding:"8px 12px",marginBottom:12,maxWidth:1060,margin:"0 auto 12px"}}><p style={{color:"var(--sunset)",fontSize:11,margin:0}}>{error}</p></div>}
    {activities.length===0&&!loading&&(
      <div style={{textAlign:"center",padding:"36px 24px",maxWidth:460,margin:"0 auto"}}>
        <div style={{fontSize:52,marginBottom:10}}>🗺️</div>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:800,color:"var(--ink)",marginBottom:6}}>Ready to explore {profile.destination}?</h3>
        <p style={{fontSize:12,color:"var(--stone)",lineHeight:1.5,marginBottom:16}}>Hit "Generate with AI" above to find family-friendly activities.</p>
        <button onClick={generate} style={{padding:"10px 28px",borderRadius:10,border:"none",background:"linear-gradient(135deg,var(--ocean),#0EA5A3)",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(11,122,142,.3)"}}>✨ Generate Activities</button>
      </div>
    )}

    {/* Preferred activities */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12,maxWidth:1060,margin:"0 auto"}}>
      {preferred.map((a,i)=><ActivityCard key={a.id} activity={a} selected={selectedIds.has(a.id)} onToggle={()=>toggle(a.id)} index={i} destination={profile.destination} isNonPref={false}/>)}
    </div>

    {/* Mid nav row: ← Family | —— Other Activities —— | Build Itinerary → */}
    {nonPreferred.length>0&&<NavRow compact={true} />}

    {/* Non-preferred activities */}
    {nonPreferred.length>0&&(
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12,maxWidth:1060,margin:"0 auto"}}>
        {nonPreferred.map((a,i)=><ActivityCard key={a.id} activity={a} selected={selectedIds.has(a.id)} onToggle={()=>toggle(a.id)} index={preferred.length+i} destination={profile.destination} isNonPref={!selectedIds.has(a.id)}/>)}
      </div>
    )}

    {/* Bottom nav row */}
    <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:20}}>
      <button onClick={onBack} style={{padding:"10px 24px",borderRadius:9,border:"2px solid var(--mist)",background:"transparent",color:"var(--stone)",fontSize:12,fontWeight:700,cursor:"pointer"}}>← Family</button>
      <button onClick={onNext} disabled={!selectedIds.size} style={{padding:"10px 32px",borderRadius:9,border:"none",background:selectedIds.size?"linear-gradient(135deg,var(--sunset),#F09A3A)":"var(--mist)",color:selectedIds.size?"#fff":"var(--stone)",fontSize:12,fontWeight:800,cursor:selectedIds.size?"pointer":"not-allowed",boxShadow:selectedIds.size?"0 5px 16px rgba(232,100,58,.3)":"none"}}>Build Itinerary →</button>
    </div>
  </div>);
}

/* ─── STEP 3: ITINERARY + DRAG & DROP + SIDEBAR ─── */

function ItineraryStep({profile,activities,selectedIds,onBack,onBackToActivities}){
  // profile, activities, selectedIds forwarded to SaveTripButton
  const[itinerary,setItinerary]=useState(null);
  const[dragSrc,setDragSrc]=useState(null);
  const[dragOver,setDragOver]=useState(null);
  const selected=activities.filter(a=>selectedIds.has(a.id));

  useEffect(()=>{setItinerary(generateItinerary(profile,selected));},[]);
  if(!itinerary) return null;

  const placedIds=new Set();
  itinerary.days.forEach(d=>d.slots.forEach(s=>{if(s.activityId)placedIds.add(s.activityId);}));
  const unplaced=selected.filter(a=>!placedIds.has(a.id));

  function onSidebarDragStart(e,a){setDragSrc({type:"sidebar",activityId:a.id});e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",a.id);}
  function onSlotDragStart(e,di,si,s){if(!s.activityId)return;setDragSrc({type:"slot",dayIdx:di,slotIdx:si,activityId:s.activityId});e.dataTransfer.effectAllowed="move";}
  function onSlotDragOver(e,di,si){e.preventDefault();setDragOver({dayIdx:di,slotIdx:si});}
  function onSlotDragLeave(){setDragOver(null);}

  function onSlotDrop(e,di,si){
    e.preventDefault();setDragOver(null);if(!dragSrc)return;
    const target=itinerary.days[di].slots[si];
    if(target.type==="rest"&&target.title!=="Free Time"){setDragSrc(null);return;}
    const act=activities.find(a=>a.id===dragSrc.activityId);
    if(!act){setDragSrc(null);return;}
    const nd=JSON.parse(JSON.stringify(itinerary.days));
    if(dragSrc.type==="slot"){
      const src=nd[dragSrc.dayIdx].slots[dragSrc.slotIdx];
      if(target.activityId){
        const tAct=activities.find(a=>a.id===target.activityId);
        src.title=tAct.name;src.activityId=tAct.id;src.location=tAct.location;src.type=tAct.type;src.hours=tAct.hours;
      } else {
        src.title="Free Time";delete src.activityId;delete src.location;delete src.hours;src.type="rest";
      }
    } else if(target.activityId){
      setDragSrc(null);return;
    }
    const t=nd[di].slots[si];
    t.title=act.name;t.activityId=act.id;t.location=act.location;t.type=act.type;t.hours=act.hours;
    t.duration_mins=Math.min(act.duration_mins,t.duration_mins);
    setItinerary({...itinerary,days:nd});setDragSrc(null);
  }

  function removeFromSlot(di,si){
    const nd=JSON.parse(JSON.stringify(itinerary.days));const s=nd[di].slots[si];
    s.title="Free Time";delete s.activityId;delete s.location;delete s.hours;s.type="rest";
    setItinerary({...itinerary,days:nd});
  }

  const weeks=[];for(let i=0;i<itinerary.days.length;i+=7)weeks.push(itinerary.days.slice(i,i+7));

  return(<div className="step-enter">
    <div style={{textAlign:"center",marginBottom:16}}>
      <span style={{fontSize:44,display:"block",marginBottom:6}}>🗓️</span>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:800}}>{profile.destination} Itinerary</h2>
      <p style={{color:"var(--stone)",fontSize:13,marginTop:4}}>Drag activities from the sidebar into slots, or rearrange between days.</p>
    </div>
    <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:20}}>
      <button onClick={onBackToActivities} style={{padding:"9px 18px",borderRadius:9,border:"2px solid var(--ocean)",background:"var(--cloud)",color:"var(--ocean)",fontSize:12,fontWeight:700,cursor:"pointer"}}>← Edit Activities</button>
      <button onClick={onBack} style={{padding:"9px 18px",borderRadius:9,border:"2px solid var(--mist)",background:"transparent",color:"var(--stone)",fontSize:12,fontWeight:700,cursor:"pointer"}}>← Edit Family</button>
    </div>
    <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
      {/* SIDEBAR */}
      <div className="sidebar-scroll" style={{width:195,minWidth:195,flexShrink:0,position:"sticky",top:16,background:"var(--cloud)",borderRadius:14,border:"1px solid var(--mist)",padding:"14px 12px",maxHeight:"calc(100vh - 40px)",overflowY:"auto"}}>
        <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"var(--stone)",marginBottom:10}}>
          Activities ({unplaced.length} available)
        </div>
        {!unplaced.length&&<p style={{fontSize:11,color:"var(--stone)",fontStyle:"italic",lineHeight:1.4}}>All placed! Remove one from the calendar to free it up.</p>}
        {unplaced.map(a=>{const c=TYPE_CONFIG[a.type]||TYPE_CONFIG.attraction;return(
          <div key={a.id} draggable onDragStart={e=>onSidebarDragStart(e,a)} className="drag-chip"
            style={{padding:"7px 9px",borderRadius:9,marginBottom:5,background:c.bg,border:"1.5px solid "+c.color+"33",display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:13}}>{c.emoji}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--ink)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.name}</div>
              <div style={{fontSize:10,color:"var(--stone)"}}>{formatDuration(a.duration_mins)}</div>
            </div>
            <span style={{fontSize:10,color:"var(--stone)"}}>⠿</span>
          </div>);})}
        {selected.filter(a=>placedIds.has(a.id)).length>0&&<>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:"var(--stone)",marginTop:10,marginBottom:5,opacity:.6}}>Placed</div>
          {selected.filter(a=>placedIds.has(a.id)).map(a=>{const c=TYPE_CONFIG[a.type]||TYPE_CONFIG.attraction;return(
            <div key={a.id} style={{padding:"5px 9px",borderRadius:7,marginBottom:3,background:"var(--mist)",opacity:.5,display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:11}}>{c.emoji}</span>
              <div style={{fontSize:10,fontWeight:600,color:"var(--stone)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.name}</div>
            </div>);})}
        </>}
      </div>
      {/* CALENDAR */}
      <div style={{flex:1,minWidth:0}}>
        {weeks.map((week,wi)=><div key={wi} style={{marginBottom:20}}>
          {weeks.length>1&&<div style={{fontSize:12,fontWeight:700,color:"var(--stone)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Week {wi+1}</div>}
          <div className="week-scroll" style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8}}>
            {week.map((day,dli)=>{const di=wi*7+dli;
              const isWE=(()=>{const d=new Date(day.date+"T00:00:00");return d.getDay()===0||d.getDay()===6;})();
              return(<div key={day.day} style={{minWidth:172,maxWidth:172,flex:"0 0 172px",background:"var(--cloud)",borderRadius:14,border:"1px solid "+(isWE?"#E0D6C8":"#E8E4DF"),overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,.04)"}}>
                <div style={{padding:"9px 12px",background:isWE?"linear-gradient(135deg,#FFF3E0,#FFF9F0)":"linear-gradient(135deg,var(--ocean-light),#F0FAFB)",borderBottom:"1px solid #E8E4DF"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:800,color:"var(--ink)"}}>Day {day.day}</div>
                  <div style={{fontSize:11,fontWeight:600,color:isWE?"var(--sunset)":"var(--ocean)",marginTop:1}}>{formatDateShort(day.date)}</div>
                </div>
                <div style={{padding:"6px 7px"}}>
                  {day.slots.map((slot,si)=>{
                    const isRest=slot.type==="rest";const isFree=slot.title==="Free Time";
                    const isNapDin=isRest&&!isFree;
                    const c=TYPE_CONFIG[slot.type]||{emoji:"😴",color:"#9CA3AF",bg:"#F3F4F6"};
                    const emoji=isNapDin?(slot.title.includes("Nap")?"😴":"🍽️"):isFree?"➕":c.emoji;
                    const isDO=dragOver&&dragOver.dayIdx===di&&dragOver.slotIdx===si;
                    return(<div key={si}
                      draggable={!!slot.activityId}
                      onDragStart={e=>onSlotDragStart(e,di,si,slot)}
                      onDragOver={!isNapDin?e=>onSlotDragOver(e,di,si):undefined}
                      onDragLeave={!isNapDin?onSlotDragLeave:undefined}
                      onDrop={!isNapDin?e=>onSlotDrop(e,di,si):undefined}
                      className={"drop-zone"+(isDO&&!isNapDin?" drag-over":"")}
                      style={{padding:"7px 8px",borderRadius:8,marginBottom:4,
                        background:isFree?"#FAFAF7":isNapDin?"#FAFAF7":c.bg,
                        border:isFree?"2px dashed #D1CCC6":isNapDin?"1px dashed #DDD8D0":"1px solid "+c.color+"22",
                        cursor:slot.activityId?"grab":isFree?"default":"default",
                        position:"relative",minHeight:isFree?44:"auto",
                        display:"flex",flexDirection:"column",justifyContent:"center"}}>
                      {slot.activityId&&<button onClick={e=>{e.stopPropagation();removeFromSlot(di,si);}}
                        style={{position:"absolute",top:3,right:3,width:16,height:16,borderRadius:3,background:"rgba(0,0,0,.06)",border:"none",color:"var(--stone)",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}} title="Remove">×</button>}
                      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:1}}>
                        <span style={{fontSize:11}}>{emoji}</span>
                        <span style={{fontSize:10,fontWeight:700,lineHeight:1.3,color:isFree?"var(--stone)":isNapDin?"var(--stone)":"var(--ink)",fontStyle:isRest?"italic":"normal",paddingRight:slot.activityId?14:0}}>
                          {isFree?"Drop here":slot.title}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"var(--stone)",fontWeight:600}}>
                        <span>{formatTime12(slot.start)}</span><span style={{opacity:.4}}>·</span><span>{formatDuration(slot.duration_mins)}</span>
                      </div>
                    </div>);})}
                </div>
              </div>);})}
          </div>
        </div>)}
        <div style={{display:"flex",justifyContent:"center",marginTop:16,gap:12,flexWrap:"wrap"}}>
          <SaveTripButton
            profile={profile}
            activities={activities}
            selectedIds={selectedIds}
            itinerary={itinerary}
          />
        </div>
        <details style={{marginTop:8}}><summary style={{cursor:"pointer",fontSize:12,fontWeight:700,color:"var(--stone)",padding:"6px 0"}}>View JSON Export</summary>
          <pre style={{background:"var(--ink)",color:"#81D4C8",borderRadius:12,padding:16,fontSize:11,lineHeight:1.5,overflow:"auto",maxHeight:300,fontFamily:"'Fira Code',monospace",marginTop:6}}>{JSON.stringify(itinerary,null,2)}</pre>
        </details>
      </div>
    </div>
  </div>);
}

/* ─── SHARE BAR ─── */

function ShareBar({shareToken,onCopy,copied}){
  if(!shareToken)return null;
  const shareUrl=`${window.location.origin}/share/${shareToken}`;
  return(
    <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"center",background:"#F0FAF4",borderRadius:12,padding:"10px 16px",border:"1.5px solid #2D8A4E"}}>
        <span style={{fontSize:13,fontWeight:700,color:"#2D8A4E"}}>🔗 Trip saved!</span>
        <input readOnly value={shareUrl} onClick={e=>e.target.select()}
          style={{padding:"5px 10px",borderRadius:7,border:"1px solid #D1FAE5",fontSize:11,fontWeight:600,background:"#fff",width:230,overflow:"hidden",textOverflow:"ellipsis"}}/>
        <button onClick={onCopy}
          style={{padding:"6px 16px",borderRadius:7,border:"none",background:copied?"#2D8A4E":"linear-gradient(135deg,#2D8A4E,#0B7A8E)",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",transition:"background .2s"}}>
          {copied?"✓ Copied!":"Share Trip →"}
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN ─── */

export default function FamilyTravelPlanner(){
  const[step,setStep]=useState(0),[profile,setProfile]=useState(DEFAULT_PROFILE);
  const[activities,setActivities]=useState([]),[selectedIds,setSelectedIds]=useState(new Set());
  const[itinerary,setItinerary]=useState(null);
  const[shareToken,setShareToken]=useState(null);
  const[shareCopied,setShareCopied]=useState(false);
  const[packingItems,setPackingItems]=useState([]);
  const[packingGenerated,setPackingGenerated]=useState(false);

  // Compute itinerary when moving to step 2
  const goToItinerary=()=>{
    const selected=activities.filter(a=>selectedIds.has(a.id));
    setItinerary(generateItinerary(profile,selected));
    setStep(2);
  };

  // Load a saved trip: restore profile + activities then jump to itinerary
  const handleLoadTrip=(tripData)=>{
    const snap=tripData.profile_snapshot;
    if(snap) setProfile(snap);
    const acts=tripData.activities_snapshot??[];
    if(acts.length){
      setActivities(acts);
      setSelectedIds(new Set(acts.map(a=>a.id)));
      setItinerary(generateItinerary(snap??profile,acts));
    }
    setStep(2);
  };

  const handleShareCopy=()=>{
    if(!shareToken)return;
    navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`);
    setShareCopied(true);
    setTimeout(()=>setShareCopied(false),2500);
  };

  // SaveTripButton wrapper — receives itinerary from WeeklyCalendar's current state
  const SaveBtn=({itinerary:currentItinerary})=>(
    <SaveTripButton
      profile={profile}
      activities={activities}
      selectedIds={selectedIds}
      itinerary={currentItinerary??itinerary}
      onSaved={(data)=>{if(data?.share_token)setShareToken(data.share_token);}}
    />
  );

  return(<div style={{minHeight:"100vh",background:"var(--sand)",fontFamily:"'Nunito',sans-serif"}}>
    <style>{CSS}</style>
    <header style={{padding:"12px 20px 0",maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <span style={{fontSize:24}}>🧳</span>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(16px,3vw,22px)",fontWeight:800,color:"var(--ink)"}}>ToddlerTrip</h1>
        <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"var(--ocean)",background:"var(--ocean-light)",padding:"2px 8px",borderRadius:4,marginLeft:4}}>Beta</span>
      </div>
      <UserMenu/>
    </header>
    <StepIndicator current={step} steps={["Family","Activities","Itinerary","Packing"]}/>
    <main style={{padding:"8px 16px 40px",maxWidth:1200,margin:"0 auto"}}>
      {step===0&&<>
        <MyTripsPanel onLoadTrip={handleLoadTrip}/>
        <FamilyProfileStep profile={profile} setProfile={setProfile} onNext={()=>setStep(1)}/>
      </>}
      {step===1&&<ActivitiesStep profile={profile} activities={activities} setActivities={setActivities} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onNext={goToItinerary} onBack={()=>setStep(0)}/>}
      {step===2&&itinerary&&<>
        <ShareBar shareToken={shareToken} onCopy={handleShareCopy} copied={shareCopied}/>
        <WeeklyCalendar
          itinerary={itinerary}
          activities={activities}
          selectedIds={selectedIds}
          profile={profile}
          onBack={()=>setStep(0)}
          onBackToActivities={()=>setStep(1)}
          onNextStep={()=>setStep(3)}
          SaveTripButtonComponent={SaveBtn}
        />
        <ShareBar shareToken={shareToken} onCopy={handleShareCopy} copied={shareCopied}/>
      </>}
      {step===3&&<>
        <ShareBar shareToken={shareToken} onCopy={handleShareCopy} copied={shareCopied}/>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:20}}>
          <button onClick={()=>setStep(2)} style={{padding:"9px 18px",borderRadius:9,border:"2px solid var(--ocean)",background:"var(--cloud)",color:"var(--ocean)",fontSize:12,fontWeight:700,cursor:"pointer"}}>← Back to Itinerary</button>
        </div>
        <PackingList
          profile={profile}
          activities={activities.filter(a=>selectedIds.has(a.id))}
          destination={profile.destination}
          savedItems={packingItems}
          savedGenerated={packingGenerated}
          onItemsChange={setPackingItems}
          onGeneratedChange={setPackingGenerated}
        />
      </>}
    </main>
  </div>);
}
