"use client";

import { useState } from "react";
import { useSupabase } from "./Providers";

export default function SaveTripButton({ profile, activities, selectedIds, itinerary, onSaved }) {
  const { user } = useSupabase();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [shareToken, setShareToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [tripName, setTripName] = useState(
    `${profile?.destination ?? "My Trip"} — ${profile?.start_date ?? new Date().toISOString().split("T")[0]}`
  );

  if (!user) return null;
  if (!itinerary) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const selectedActivities = (activities ?? []).filter((a) => selectedIds?.has(a.id));
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tripName,
          profile,
          activities: selectedActivities,
          itinerary,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      const data = await res.json();
      setSaved(true);
      setSavedId(data.id);
      setShareToken(data.share_token ?? null);
      setShowNameInput(false);
      onSaved?.(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : null;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (saved) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontFamily: "'Nunito', sans-serif" }}>
        <div style={{
          background: "#F0FAF4", borderRadius: 12, padding: "10px 18px",
          border: "1.5px solid #2D8A4E", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#2D8A4E" }}>Trip saved!</span>
        </div>
        {shareUrl && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              readOnly
              value={shareUrl}
              style={{
                padding: "7px 12px", borderRadius: 8, border: "1.5px solid #D1FAE5",
                fontSize: 11, fontWeight: 600, color: "#1C2B33", background: "#F0FAF4",
                width: 260, overflow: "hidden", textOverflow: "ellipsis",
              }}
              onClick={e => e.target.select()}
            />
            <button
              onClick={handleCopy}
              style={{
                padding: "7px 14px", borderRadius: 8, border: "none",
                background: copied ? "#2D8A4E" : "linear-gradient(135deg,#2D8A4E,#0B7A8E)",
                color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer",
                transition: "background .2s", flexShrink: 0,
              }}
            >
              {copied ? "✓ Copied!" : "Share Trip →"}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (showNameInput) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontFamily: "'Nunito', sans-serif" }}>
        <input
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          style={{
            padding: "10px 14px", borderRadius: 10, border: "2px solid #0B7A8E",
            fontSize: 14, fontWeight: 600, width: 280, textAlign: "center",
          }}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving || !tripName.trim()}
            style={{
              padding: "9px 24px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,#2D8A4E,#0B7A8E)",
              color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(45,138,78,.3)",
            }}
          >
            {saving ? "Saving…" : "Save Trip"}
          </button>
          <button
            onClick={() => setShowNameInput(false)}
            style={{
              padding: "9px 18px", borderRadius: 10, border: "2px solid #F0EDE8",
              background: "transparent", color: "#8A9BA5", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
        {error && <p style={{ color: "#E8643A", fontSize: 12, fontWeight: 600 }}>{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowNameInput(true)}
      style={{
        padding: "11px 28px", borderRadius: 12, border: "none",
        background: "linear-gradient(135deg,#2D8A4E,#0B7A8E)",
        color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
        boxShadow: "0 6px 20px rgba(45,138,78,.25)",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      💾 Save Trip
    </button>
  );
}
