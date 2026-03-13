import Link from "next/link";
import { DESTINATIONS, slugify } from "../_lib/destinations";

export const metadata = {
  title: "Family Travel Destinations — Toddler Trip",
  description:
    "Browse 100+ family-friendly destinations with kid-friendly activities, nap-aware itineraries, and personalized packing lists. Plan your next family trip for free.",
  alternates: { canonical: "/destinations" },
};

const INK = "#1C2B33";
const OCEAN = "#0B7A8E";
const SUNSET = "#E8643A";
const STONE = "#8A9BA5";
const MIST = "#F0EDE8";
const CLOUD = "#FAFAF7";

const SECTIONS = [
  { title: "Popular US Cities", filter: d => d.type === "city" && d.country === "US" },
  { title: "National Parks", filter: d => d.type === "national_park" },
  { title: "International Destinations", filter: d => d.type === "international" },
];

export default function DestinationsIndex() {
  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: CLOUD, minHeight: "100vh", color: INK }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Nunito:wght@400;600;700;800&display=swap');
        .dest-chip{transition:transform .1s,box-shadow .1s}.dest-chip:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.06)}
        @media(max-width:640px){.dest-wrap{gap:6px!important}}
      `}</style>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(250,250,247,.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${MIST}`, padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <span style={{ fontSize: 24 }}>🧳</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 800, color: INK }}>Toddler Trip</span>
        </Link>
        <Link href="/plan" style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`, color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
          Plan a Trip &rarr;
        </Link>
      </nav>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900, marginBottom: 10 }}>
          Family Travel Destinations
        </h1>
        <p style={{ fontSize: 16, color: STONE, fontWeight: 600, lineHeight: 1.6, marginBottom: 40, maxWidth: 600 }}>
          Browse {DESTINATIONS.length}+ destinations with AI-curated activities for families with kids ages 0&ndash;12.
          Pick a destination to see top activities and start planning.
        </p>

        {SECTIONS.map(section => {
          const items = DESTINATIONS.filter(section.filter);
          return (
            <section key={section.title} style={{ marginBottom: 40 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, marginBottom: 16, color: INK }}>
                {section.title}
                <span style={{ fontSize: 13, fontWeight: 600, color: STONE, marginLeft: 10 }}>({items.length})</span>
              </h2>
              <div className="dest-wrap" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {items.map(d => {
                  const label = d.state ? `${d.city}, ${d.state}` : d.city;
                  return (
                    <Link key={slugify(d.city)} href={`/destinations/${slugify(d.city)}`} className="dest-chip"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 13, fontWeight: 700, color: INK,
                        background: "#fff", border: `1.5px solid ${MIST}`,
                        borderRadius: 20, padding: "8px 16px",
                        textDecoration: "none",
                      }}>
                      {d.type === "national_park" ? "🏔️" : d.country !== "US" ? "🌍" : "🏙️"} {label}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/plan" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 32px", borderRadius: 14, border: "none",
            background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`,
            color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none",
            boxShadow: "0 6px 20px rgba(232,100,58,.3)",
          }}>
            ✨ Plan Your Family Trip — Free
          </Link>
        </div>
      </main>
    </div>
  );
}
