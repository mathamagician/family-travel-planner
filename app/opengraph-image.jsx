import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Toddler Trip — Family Travel Planner Built Around Nap Time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1C3B4A, #0B5C6E)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 12 }}>🧳</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "#fff",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          Toddler Trip
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: "rgba(255,255,255,0.8)",
            marginBottom: 36,
          }}
        >
          Trip planning that works around nap time
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >
          {["😴 Nap-Aware", "🧠 AI-Powered", "🗓️ Drag & Drop", "🧳 Packing List"].map(
            (f) => (
              <div
                key={f}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  padding: "10px 20px",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {f}
              </div>
            )
          )}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 28,
            fontSize: 16,
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          toddlertrip.com
        </div>
      </div>
    ),
    { ...size }
  );
}
