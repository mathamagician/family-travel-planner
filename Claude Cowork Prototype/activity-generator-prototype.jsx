import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `You are a family travel expert who recommends activities for families with young children. 

When given a city and children's ages, generate 5-7 activities perfect for that family. 

CRITICAL: Respond with ONLY a valid JSON array, no markdown, no backticks, no explanation. Each object must match this exact schema:

{
  "id": "short_snake_case_id",
  "name": "Activity Name",
  "type": "attraction" | "park" | "outdoors" | "culture" | "museum" | "food" | "entertainment",
  "hours": "HH:MM-HH:MM",
  "notes": "Brief family-friendly description with practical tips for parents with young kids.",
  "location": "Full address or location name, City, State",
  "age_range": "min-max",
  "duration_mins": number,
  "affiliate": "https://official-website-url"
}

Rules:
- Only recommend places that actually exist
- Prioritize stroller-accessible, toddler-friendly spots
- Include practical parent tips in notes (shade, bathrooms, nap-friendly, etc.)
- Mix indoor and outdoor activities
- Include realistic duration estimates
- Use real website URLs when you know them, otherwise use the city's tourism board URL`;

const TYPE_CONFIG = {
  attraction: { emoji: "🎢", color: "#E8443A", bg: "#FEF2F1" },
  park: { emoji: "🌳", color: "#2D8A4E", bg: "#F0FAF4" },
  outdoors: { emoji: "🏖️", color: "#0EA5E9", bg: "#F0F9FF" },
  culture: { emoji: "🏛️", color: "#9333EA", bg: "#FAF5FF" },
  museum: { emoji: "🔬", color: "#D97706", bg: "#FFFBEB" },
  food: { emoji: "🍽️", color: "#DC2626", bg: "#FFF5F5" },
  entertainment: { emoji: "🎭", color: "#6366F1", bg: "#F5F3FF" },
};

const SAMPLE_ACTIVITIES = [
  {
    id: "sdzoo",
    name: "San Diego Zoo",
    type: "attraction",
    hours: "9:00-17:00",
    notes: "Large zoo with kid-friendly exhibits. Stroller-friendly. Many rest areas.",
    location: "2920 Zoo Dr, San Diego, CA",
    age_range: "0-12",
    duration_mins: 180,
    affiliate: "https://www.sandiegozoo.org/tickets",
  },
  {
    id: "balboa",
    name: "Balboa Park (parks + museums)",
    type: "park",
    hours: "10:00-18:00",
    notes: "Large park with playgrounds, museums; good for flexible days and naps in stroller.",
    location: "Balboa Park, San Diego, CA",
    age_range: "0-12",
    duration_mins: 180,
    affiliate: "https://www.balboapark.org",
  },
  {
    id: "la_jolla_cove",
    name: "La Jolla Cove / Beach",
    type: "outdoors",
    hours: "06:00-20:00",
    notes: "Beach time, tide pools, easy strolls. Bring sun protection.",
    location: "La Jolla Cove, San Diego, CA",
    age_range: "0-12",
    duration_mins: 180,
    affiliate: "https://www.sandiego.org/explore/things-to-do/beaches-bays/la-jolla-cove.aspx",
  },
  {
    id: "fleet_science",
    name: "Fleet Science Center",
    type: "museum",
    hours: "10:00-18:00",
    notes: "Hands-on exhibits for kids; good indoor backup for rainy or hot afternoons.",
    location: "1875 El Prado, San Diego, CA",
    age_range: "3-12",
    duration_mins: 120,
    affiliate: "https://www.rhfleet.org",
  },
  {
    id: "old_town",
    name: "Old Town San Diego Historic Park",
    type: "culture",
    hours: "10:00-17:00",
    notes: "Open-air historic area with shops and casual restaurants; good for stroller access.",
    location: "Old Town San Diego State Historic Park",
    age_range: "0-12",
    duration_mins: 120,
    affiliate: "https://www.parks.ca.gov/?page_id=663",
  },
];

function formatDuration(mins) {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function ActivityCard({ activity, index }) {
  const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.attraction;
  return (
    <div
      style={{
        opacity: 0,
        animation: `cardSlideIn 0.5s ease-out ${index * 0.08}s forwards`,
        background: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        overflow: "hidden",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
            <span style={{ fontSize: "28px", lineHeight: 1 }}>{config.emoji}</span>
            <h3
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "18px",
                fontWeight: 700,
                color: "#1a1a2e",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {activity.name}
            </h3>
          </div>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: config.color,
              background: config.bg,
              padding: "4px 10px",
              borderRadius: "20px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {activity.type}
          </span>
        </div>

        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "14px",
            color: "#6B7280",
            lineHeight: 1.6,
            margin: "0 0 16px 0",
          }}
        >
          {activity.notes}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
          {[
            { icon: "🕐", label: activity.hours },
            { icon: "⏱️", label: formatDuration(activity.duration_mins) },
            { icon: "👶", label: `Ages ${activity.age_range}` },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px" }}>{item.icon}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#9CA3AF" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>📍</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#9CA3AF" }}>
            {activity.location}
          </span>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #F3F4F6", padding: "12px 24px" }}>
        <a
          href={activity.affiliate}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: config.color,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          Visit Website →
        </a>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            padding: "24px",
            opacity: 0,
            animation: `cardSlideIn 0.4s ease-out ${i * 0.06}s forwards`,
          }}
        >
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
            <div style={{ flex: 1, height: 20, borderRadius: "6px", background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
          </div>
          <div style={{ height: 14, borderRadius: "4px", background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", marginBottom: 8, width: "90%" }} />
          <div style={{ height: 14, borderRadius: "4px", background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", width: "60%" }} />
        </div>
      ))}
    </div>
  );
}

export default function ActivityGenerator() {
  const [city, setCity] = useState("");
  const [ages, setAges] = useState("");
  const [activities, setActivities] = useState(SAMPLE_ACTIVITIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showingDemo, setShowingDemo] = useState(true);
  const [jsonView, setJsonView] = useState(false);
  const resultRef = useRef(null);

  async function generateActivities() {
    if (!city.trim() || !ages.trim()) return;
    setLoading(true);
    setError(null);
    setShowingDemo(false);
    setActivities([]);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Generate family activities for: ${city.trim()}. Children's ages: ${ages.trim()}. Return ONLY the JSON array.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setActivities(parsed);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      console.error(err);
      setError("Generation failed — check the console for details. In production, this calls your backend which forwards to Claude's API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(165deg, #FAFBFF 0%, #F0F4FF 40%, #FFF7ED 100%)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* Header */}
      <header style={{ padding: "48px 32px 0", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontSize: "36px" }}>🧳</span>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 800,
              color: "#1a1a2e",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Family Activity Finder
          </h1>
        </div>
        <p style={{ fontSize: "16px", color: "#6B7280", margin: "4px 0 0", maxWidth: "520px", lineHeight: 1.5 }}>
          AI-powered recommendations tailored to your kids' ages. Built with Claude Sonnet.
        </p>
      </header>

      {/* Input Section */}
      <section style={{ padding: "32px 32px 0", maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            padding: "28px 32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            border: "1px solid #E5E7EB",
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: "1 1 220px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              Destination
            </label>
            <input
              type="text"
              placeholder="e.g. San Diego, CA"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateActivities()}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "2px solid #E5E7EB",
                fontSize: "15px",
                fontFamily: "'DM Sans', sans-serif",
                color: "#1a1a2e",
                background: "#FAFBFF",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#818CF8")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              Children's Ages
            </label>
            <input
              type="text"
              placeholder="e.g. 2 and 5"
              value={ages}
              onChange={(e) => setAges(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateActivities()}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "2px solid #E5E7EB",
                fontSize: "15px",
                fontFamily: "'DM Sans', sans-serif",
                color: "#1a1a2e",
                background: "#FAFBFF",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#818CF8")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>
          <button
            onClick={generateActivities}
            disabled={loading || !city.trim() || !ages.trim()}
            style={{
              padding: "12px 32px",
              borderRadius: "12px",
              border: "none",
              background: loading ? "#A5B4FC" : !city.trim() || !ages.trim() ? "#D1D5DB" : "linear-gradient(135deg, #6366F1, #818CF8)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: loading || !city.trim() || !ages.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              boxShadow: loading || !city.trim() || !ages.trim() ? "none" : "0 4px 14px rgba(99,102,241,0.3)",
              animation: loading ? "pulse 1.5s infinite" : "none",
            }}
          >
            {loading ? "Generating..." : "Find Activities ✨"}
          </button>
        </div>
      </section>

      {/* Results */}
      <section ref={resultRef} style={{ padding: "32px 32px 64px", maxWidth: "1100px", margin: "0 auto" }}>
        {showingDemo && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", animation: "fadeIn 0.5s ease" }}>
            <span style={{ fontSize: "13px", color: "#9CA3AF", fontStyle: "italic" }}>
              Showing sample data from your san_diego_activities.json — try generating new results above
            </span>
          </div>
        )}

        {!showingDemo && activities.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "14px", color: "#6B7280" }}>
              {activities.length} activities found
            </span>
            <button
              onClick={() => setJsonView(!jsonView)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                background: jsonView ? "#1a1a2e" : "#fff",
                color: jsonView ? "#fff" : "#6B7280",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "'DM Mono', 'DM Sans', monospace",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {jsonView ? "Card View" : "{ } JSON"}
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "20px",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <p style={{ color: "#DC2626", fontSize: "14px", margin: 0 }}>{error}</p>
            <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "8px 0 0" }}>
              💡 In your production app, the API call goes through your backend (never expose the key client-side). This prototype calls the API directly for demo purposes.
            </p>
          </div>
        )}

        {loading && <LoadingSkeleton />}

        {!loading && activities.length > 0 && !jsonView && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
            {activities.map((a, i) => (
              <ActivityCard key={a.id} activity={a} index={i} />
            ))}
          </div>
        )}

        {!loading && activities.length > 0 && jsonView && (
          <pre
            style={{
              background: "#1a1a2e",
              color: "#A5B4FC",
              borderRadius: "16px",
              padding: "24px",
              fontSize: "13px",
              lineHeight: 1.6,
              overflow: "auto",
              maxHeight: "600px",
              fontFamily: "'DM Mono', 'Fira Code', monospace",
              animation: "fadeIn 0.3s ease",
            }}
          >
            {JSON.stringify(activities, null, 2)}
          </pre>
        )}
      </section>

      {/* Architecture Info */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 32px 64px",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(8px)",
            borderRadius: "20px",
            border: "1px solid #E5E7EB",
            padding: "32px",
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1a1a2e",
              margin: "0 0 16px",
            }}
          >
            How It Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            {[
              { step: "1", title: "User Input", desc: "City + kids' ages entered in the form above" },
              { step: "2", title: "Claude API Call", desc: "Sonnet generates activities with a schema-locked system prompt" },
              { step: "3", title: "JSON Response", desc: "Structured data matching your exact schema — toggle JSON view to see" },
              { step: "4", title: "Render Cards", desc: "React maps the array into these activity cards" },
            ].map((item) => (
              <div key={item.step} style={{ display: "flex", gap: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #6366F1, #818CF8)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "14px",
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a2e", marginBottom: "2px" }}>{item.title}</div>
                  <div style={{ fontSize: "13px", color: "#9CA3AF", lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
