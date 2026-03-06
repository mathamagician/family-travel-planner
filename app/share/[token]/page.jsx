import { getAdminClient } from "../../../lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";

const INK    = "#1C2B33";
const OCEAN  = "#0B7A8E";
const SUNSET = "#E8643A";
const STONE  = "#8A9BA5";
const MIST   = "#F0EDE8";
const CLOUD  = "#FAFAF7";

function formatTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function formatDateLong(ds) {
  return new Date(ds + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}
function formatDateRange(start, end) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end   + "T00:00:00");
  const opts = { month: "long", day: "numeric" };
  const endOpts = s.getFullYear() === e.getFullYear() ? opts : { ...opts, year: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", { ...endOpts, year: "numeric" })}`;
}

const BLOCK_CFG = {
  activity: { emoji: "🎯", color: OCEAN,     bg: "#E6F6F8" },
  nap:      { emoji: "😴", color: "#8A9BA5", bg: "#F3F4F6" },
  meal:     { emoji: "🍽️", color: "#B45309", bg: "#FFF9F0" },
};

async function getTrip(token) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("trips")
    .select(`
      id, name, destination_name, start_date, end_date, profile_snapshot,
      trip_days (
        id, date,
        schedule_blocks (id, block_type, title, start_time, end_time, location_name, position)
      )
    `)
    .eq("share_token", token)
    .single();
  if (error) return null;
  return data;
}

export async function generateMetadata({ params }) {
  const { token } = await params;
  const trip = await getTrip(token);
  if (!trip) return { title: "Family Trip — Family Travel Planner" };
  return {
    title: `${trip.name} — Family Travel Planner`,
    description: `Check out our family trip to ${trip.destination_name}!`,
    openGraph: {
      title: `${trip.name} — Family Travel Planner`,
      description: `Check out our family trip to ${trip.destination_name}!`,
      type: "website",
    },
  };
}

export default async function SharePage({ params }) {
  const { token } = await params;
  const trip = await getTrip(token);
  if (!trip) notFound();

  const days = [...(trip.trip_days ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  days.forEach(d => {
    if (d.schedule_blocks) d.schedule_blocks.sort((a, b) => a.position - b.position);
  });

  const profile  = trip.profile_snapshot ?? {};
  const kidsInfo = (profile.kids ?? []).map(k => `age ${k.age}`).join(", ");

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: CLOUD, minHeight: "100vh", color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .share-cta-btn { transition: transform .15s, box-shadow .15s; }
        .share-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(232,100,58,.45) !important; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250,250,247,.92)", backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${MIST}`,
        padding: "0 24px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <span style={{ fontSize: 22 }}>🧳</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 800, color: INK }}>
            Family Travel Planner
          </span>
        </Link>
        <Link href="/plan" style={{
          padding: "8px 18px", borderRadius: 10,
          background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`,
          color: "#fff", fontSize: 12, fontWeight: 800, textDecoration: "none",
        }}>
          Plan My Trip →
        </Link>
      </nav>

      {/* ── Trip hero ── */}
      <div style={{
        background: "linear-gradient(135deg, #1C3B4A, #0B5C6E)",
        padding: "52px 24px 44px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,.12)", borderRadius: 20,
          padding: "4px 14px", marginBottom: 22,
          fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.8)", letterSpacing: ".08em",
        }}>
          👁 Shared Itinerary · Read Only
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 900,
          color: "#fff", marginBottom: 10, lineHeight: 1.2,
        }}>
          {trip.destination_name}
        </h1>
        <p style={{ color: "rgba(255,255,255,.7)", fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
          {trip.name}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            trip.start_date && trip.end_date && `📅 ${formatDateRange(trip.start_date, trip.end_date)}`,
            days.length > 0 && `🗓 ${days.length} day${days.length !== 1 ? "s" : ""}`,
            profile.adults && `👤 ${profile.adults} adult${profile.adults !== 1 ? "s" : ""}`,
            kidsInfo && `👶 ${kidsInfo}`,
          ].filter(Boolean).map((item, i) => (
            <span key={i} style={{
              fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.9)",
              background: "rgba(255,255,255,.1)", borderRadius: 20, padding: "5px 14px",
            }}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── Day-by-day itinerary ── */}
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "44px 20px 64px" }}>
        {days.length === 0 && (
          <p style={{ textAlign: "center", color: STONE, fontSize: 15 }}>No itinerary days found.</p>
        )}

        {days.map((day, di) => (
          <div key={day.id} style={{ marginBottom: 36 }}>
            {/* Day header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 900, fontSize: 15,
                boxShadow: "0 3px 10px rgba(232,100,58,.28)",
              }}>
                {di + 1}
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 800, color: INK }}>
                  Day {di + 1}
                </div>
                <div style={{ fontSize: 12, color: STONE, fontWeight: 600, marginTop: 1 }}>
                  {formatDateLong(day.date)}
                </div>
              </div>
            </div>

            {/* Schedule blocks */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingLeft: 56 }}>
              {(day.schedule_blocks ?? []).map(block => {
                const cfg = BLOCK_CFG[block.block_type] ?? BLOCK_CFG.activity;
                const isRest = block.block_type !== "activity";
                return (
                  <div key={block.id} style={{
                    background: isRest ? "#FAFAF7" : "#fff",
                    border: `1.5px solid ${isRest ? MIST : cfg.color + "30"}`,
                    borderRadius: 12, padding: "10px 14px",
                    display: "flex", alignItems: "flex-start", gap: 10,
                    opacity: isRest ? 0.72 : 1,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: cfg.bg, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 15,
                    }}>
                      {cfg.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 3 }}>
                        {block.title}
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: STONE, fontWeight: 600 }}>
                          {formatTime12(block.start_time)} – {formatTime12(block.end_time)}
                        </span>
                        {block.location_name && (
                          <span style={{ fontSize: 11, color: STONE, fontWeight: 600 }}>
                            📍 {block.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── Bottom CTA ── */}
        <div style={{
          marginTop: 52, textAlign: "center",
          background: "linear-gradient(135deg, #1C3B4A, #0B5C6E)",
          borderRadius: 22, padding: "44px 28px",
          boxShadow: "0 16px 50px rgba(11,92,110,.2)",
        }}>
          <span style={{ fontSize: 42, display: "block", marginBottom: 14 }}>🧳</span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800,
            color: "#fff", marginBottom: 10,
          }}>
            Love this trip idea?
          </h2>
          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 14, fontWeight: 600, marginBottom: 26, lineHeight: 1.6 }}>
            Build your own nap-aware family itinerary in minutes — completely free.
          </p>
          <Link href="/plan" className="share-cta-btn" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 34px", borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`,
            color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none",
            boxShadow: "0 8px 24px rgba(232,100,58,.38)",
          }}>
            ✨ Plan My Family Trip — Free
          </Link>
        </div>
      </main>
    </div>
  );
}
