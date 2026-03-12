"use client";

/* ─── App Orchestrator ─────────────────────────────────────────────────────
   Thin shell that manages step navigation and shared state.
   All business logic and UI lives in the individual modules.
   ────────────────────────────────────────────────────────────────────────── */

import { useState } from "react";
import { DEFAULT_PROFILE, GLOBAL_CSS } from "./shared/config";

// Auth & persistence components
import { useSupabase } from "./Providers";
import UserMenu from "./UserMenu";
import MyTripsPanel from "./MyTripsPanel";
import SaveTripButton from "./SaveTripButton";

// Modules
import FamilyModule from "./modules/family/FamilyModule";
import ActivitiesModule from "./modules/activities/ActivitiesModule";
import WeeklyCalendar from "./WeeklyCalendar";
import PackingModule from "./modules/packing/PackingModule";

// Agents
import { generateItinerary } from "./modules/schedule/PlanningAgent";

/* ─── Step Indicator ─── */

function StepIndicator({ current, steps }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "14px 0 6px" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: i < current ? "var(--ocean)" : i === current ? "var(--sunset)" : "var(--mist)",
              color: i <= current ? "#fff" : "var(--stone)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 11, transition: "all .3s",
              boxShadow: i === current ? "0 3px 10px rgba(232,100,58,.3)" : "none",
            }}>{i < current ? "✓" : i + 1}</div>
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em",
              color: i === current ? "var(--sunset)" : i < current ? "var(--ocean)" : "var(--stone)",
              whiteSpace: "nowrap",
            }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 28, height: 2, margin: "0 4px", background: i < current ? "var(--ocean)" : "var(--mist)", borderRadius: 2, marginBottom: 14 }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Share Bar ─── */

function ShareBar({ shareToken, onCopy, copied }) {
  if (!shareToken) return null;
  const shareUrl = `${window.location.origin}/share/${shareToken}`;
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center", background: "#F0FAF4", borderRadius: 12, padding: "10px 16px", border: "1.5px solid #2D8A4E" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2D8A4E" }}>🔗 Trip saved!</span>
        <input readOnly value={shareUrl} onClick={e => e.target.select()}
          style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #D1FAE5", fontSize: 11, fontWeight: 600, background: "#fff", width: 230, overflow: "hidden", textOverflow: "ellipsis" }} />
        <button onClick={onCopy}
          style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: copied ? "#2D8A4E" : "linear-gradient(135deg,#2D8A4E,#0B7A8E)", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", transition: "background .2s" }}>
          {copied ? "✓ Copied!" : "Share Trip →"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Orchestrator ─── */

export default function FamilyTravelPlanner() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [activities, setActivities] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [itinerary, setItinerary] = useState(null);
  const [shareToken, setShareToken] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [packingItems, setPackingItems] = useState([]);
  const [packingGenerated, setPackingGenerated] = useState(false);

  // Compute itinerary when moving to step 2
  const goToItinerary = () => {
    const selected = activities.filter(a => selectedIds.has(a.id));
    setItinerary(generateItinerary(profile, selected));
    setStep(2);
  };

  // Load a saved trip: restore profile + activities then jump to itinerary
  const handleLoadTrip = (tripData) => {
    const snap = tripData.profile_snapshot;
    if (snap) setProfile(snap);
    const acts = tripData.activities_snapshot ?? [];
    if (acts.length) {
      setActivities(acts);
      setSelectedIds(new Set(acts.map(a => a.id)));
      setItinerary(generateItinerary(snap ?? profile, acts));
    }
    setStep(2);
  };

  const handleShareCopy = () => {
    if (!shareToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  // SaveTripButton wrapper — receives itinerary from WeeklyCalendar's current state
  const SaveBtn = ({ itinerary: currentItinerary }) => (
    <SaveTripButton
      profile={profile}
      activities={activities}
      selectedIds={selectedIds}
      itinerary={currentItinerary ?? itinerary}
      onSaved={(data) => { if (data?.share_token) setShareToken(data.share_token); }}
    />
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--sand)", fontFamily: "'Nunito',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <header style={{ padding: "12px 20px 0", maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 24 }}>🧳</span>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(16px,3vw,22px)", fontWeight: 800, color: "var(--ink)" }}>ToddlerTrip</h1>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ocean)", background: "var(--ocean-light)", padding: "2px 8px", borderRadius: 4, marginLeft: 4 }}>Beta</span>
        </div>
        <UserMenu />
      </header>

      <StepIndicator current={step} steps={["Family", "Activities", "Itinerary", "Packing"]} />

      <main style={{ padding: "8px 16px 40px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Step 0: Family Profile */}
        {step === 0 && <>
          <MyTripsPanel onLoadTrip={handleLoadTrip} />
          <FamilyModule profile={profile} setProfile={setProfile} onNext={() => setStep(1)} />
        </>}

        {/* Step 1: Activities */}
        {step === 1 && (
          <ActivitiesModule
            profile={profile}
            activities={activities}
            setActivities={setActivities}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onNext={goToItinerary}
            onBack={() => setStep(0)}
          />
        )}

        {/* Step 2: Itinerary / Schedule */}
        {step === 2 && itinerary && <>
          <ShareBar shareToken={shareToken} onCopy={handleShareCopy} copied={shareCopied} />
          <WeeklyCalendar
            itinerary={itinerary}
            activities={activities}
            selectedIds={selectedIds}
            profile={profile}
            onBack={() => setStep(0)}
            onBackToActivities={() => setStep(1)}
            onNextStep={() => setStep(3)}
            SaveTripButtonComponent={SaveBtn}
          />
          <ShareBar shareToken={shareToken} onCopy={handleShareCopy} copied={shareCopied} />
        </>}

        {/* Step 3: Packing List */}
        {step === 3 && <>
          <ShareBar shareToken={shareToken} onCopy={handleShareCopy} copied={shareCopied} />
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <button onClick={() => setStep(2)} style={{ padding: "9px 18px", borderRadius: 9, border: "2px solid var(--ocean)", background: "var(--cloud)", color: "var(--ocean)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>← Back to Itinerary</button>
          </div>
          <PackingModule
            profile={profile}
            activities={activities.filter(a => selectedIds.has(a.id))}
            destination={profile.destination}
            savedItems={packingItems}
            savedGenerated={packingGenerated}
            onItemsChange={setPackingItems}
            onGeneratedChange={setPackingGenerated}
          />
        </>}
      </main>
    </div>
  );
}
