"use client";

import { useState, useEffect } from "react";

const OCEAN = "#0B7A8E";
const STONE = "#8A9BA5";
const MIST = "#F0EDE8";
const INK = "#1C2B33";

export default function WeatherWidget({ city }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetch(`/api/weather?destination=${encodeURIComponent(city)}&start_date=${today}&days=7`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.weather) setWeather(data.weather); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city]);

  if (loading) {
    return (
      <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${MIST}`, padding: "20px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: OCEAN, marginBottom: 12 }}>
          This Week's Weather
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: STONE }}>Loading forecast...</div>
      </div>
    );
  }

  if (!weather) return null;

  const days = Object.entries(weather).slice(0, 7);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${MIST}`, padding: "20px 24px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: OCEAN, marginBottom: 14 }}>
        This Week in {city}
      </div>
      <div style={{ display: "flex", gap: 0, justifyContent: "space-between", overflowX: "auto" }}>
        {days.map(([date, w]) => {
          const d = new Date(date + "T12:00:00");
          const dayName = dayNames[d.getDay()];
          const monthDay = `${d.getMonth() + 1}/${d.getDate()}`;
          return (
            <div key={date} style={{ textAlign: "center", minWidth: 52, padding: "8px 4px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: INK, marginBottom: 4 }}>{dayName}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: STONE, marginBottom: 6 }}>{monthDay}</div>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{w.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>{w.highF}°F</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: STONE, marginTop: 2 }}>{w.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
