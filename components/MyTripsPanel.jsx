"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "./Providers";

export default function MyTripsPanel({ onLoadTrip }) {
  const { user } = useSupabase();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (user && expanded) fetchTrips();
  }, [user, expanded]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trips");
      if (res.ok) setTrips(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (id) => {
    setDeleting(id);
    await fetch(`/api/trips/${id}`, { method: "DELETE" });
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setDeleting(null);
  };

  const loadTrip = async (trip) => {
    const res = await fetch(`/api/trips/${trip.id}`);
    if (!res.ok) return;
    const data = await res.json();
    onLoadTrip?.(data);
    setExpanded(false);
  };

  if (!user) return null;

  const fmt = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  return (
    <div style={{ marginBottom: 18, fontFamily: "'Nunito', sans-serif" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          background: expanded ? "#E6F6F8" : "#F0EDE8",
          borderRadius: 12, padding: "10px 16px", border: "1.5px solid " + (expanded ? "#0B7A8E" : "#D8D4CF"),
          cursor: "pointer", fontFamily: "'Nunito', sans-serif",
        }}
      >
        <span style={{ fontSize: 16 }}>📂</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: expanded ? "#0B7A8E" : "#1C2B33", flex: 1, textAlign: "left" }}>
          My Saved Trips
        </span>
        <span style={{ fontSize: 12, color: "#8A9BA5", fontWeight: 700 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div style={{
          background: "#fff", borderRadius: "0 0 12px 12px",
          border: "1.5px solid #0B7A8E", borderTop: "none",
          padding: 12, maxHeight: 280, overflowY: "auto",
        }}>
          {loading && (
            <p style={{ color: "#8A9BA5", fontSize: 12, textAlign: "center", padding: 12 }}>Loading trips…</p>
          )}
          {!loading && trips.length === 0 && (
            <p style={{ color: "#8A9BA5", fontSize: 12, textAlign: "center", padding: 12, fontStyle: "italic" }}>
              No saved trips yet — build one and save it!
            </p>
          )}
          {trips.map((trip) => (
            <div
              key={trip.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 9, marginBottom: 4,
                background: "#FAF6F1", border: "1px solid #F0EDE8",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1C2B33", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {trip.name}
                </div>
                <div style={{ fontSize: 11, color: "#8A9BA5", fontWeight: 600, marginTop: 1 }}>
                  {trip.destination_name} · {fmt(trip.start_date)}
                </div>
              </div>
              <button
                onClick={() => loadTrip(trip)}
                style={{
                  padding: "5px 12px", borderRadius: 7, border: "1.5px solid #0B7A8E",
                  background: "#E6F6F8", color: "#0B7A8E", fontSize: 11, fontWeight: 800, cursor: "pointer",
                }}
              >
                Load
              </button>
              <button
                onClick={() => deleteTrip(trip.id)}
                disabled={deleting === trip.id}
                style={{
                  padding: "5px 8px", borderRadius: 7, border: "1.5px solid #F0EDE8",
                  background: "transparent", color: "#8A9BA5", fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}
                title="Delete trip"
              >
                {deleting === trip.id ? "…" : "✕"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
