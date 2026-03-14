import Link from "next/link";
import NewsletterSignup from "../components/NewsletterSignup";

export const metadata = {
  title: "Toddler Trip — AI Family Travel Planner Built Around Nap Time",
  description:
    "The only travel planner that schedules around your kids' nap times. AI-powered day-by-day itineraries, drag-and-drop scheduling, and a smart packing list — free.",
  alternates: { canonical: "/" },
};

/** JSON-LD structured data for the landing page */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Toddler Trip",
  url: "https://www.toddlertrip.com",
  applicationCategory: "TravelApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "AI-powered family travel planner that builds day-by-day itineraries around kids' nap schedules, ages, and interests.",
  featureList: [
    "Nap-aware scheduling",
    "AI-curated age-appropriate activities",
    "Drag-and-drop weekly calendar",
    "Smart packing list with affiliate links",
    "Energy-balanced day planning",
  ],
};

const INK    = "#1C2B33";
const OCEAN  = "#0B7A8E";
const SUNSET = "#E8643A";
const STONE  = "#8A9BA5";
const MIST   = "#F0EDE8";
const CLOUD  = "#FAFAF7";

const FEATURES = [
  {
    emoji: "😴",
    title: "Nap-Aware Scheduling",
    desc: "The only planner that actually accounts for nap time. Every day is built around your family's sleep needs — not despite them.",
    color: "#8A9BA5", bg: "#F3F4F6",
  },
  {
    emoji: "🧠",
    title: "AI That Knows Your Kids",
    desc: "Enter your children's ages and the AI picks age-appropriate activities, flags stroller access, and avoids scheduling pitfalls.",
    color: OCEAN, bg: "#E6F6F8",
  },
  {
    emoji: "🗓️",
    title: "Drag-and-Drop Itinerary",
    desc: "A visual weekly calendar — move activities, resize blocks, and add custom events. Like Google Calendar, but for vacation.",
    color: "#7C3AED", bg: "#FAF5FF",
  },
  {
    emoji: "🧳",
    title: "Smart Packing List",
    desc: "AI generates a personalized checklist based on your destination, kids' ages, and planned activities — with one-click shopping links.",
    color: "#2D8A4E", bg: "#F0FAF4",
  },
];

const STEPS = [
  { n: "1", emoji: "👨‍👩‍👧‍👦", title: "Set your family profile", desc: "Kids' ages, destination, trip length, and your daily wake/nap/bed schedule." },
  { n: "2", emoji: "🎯", title: "Pick your activities", desc: "AI generates 14–18 real, family-tested activities for your destination. Select what fits." },
  { n: "3", emoji: "✨", title: "Get your itinerary", desc: "A nap-aware day-by-day schedule and personalized packing list — ready in seconds." },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: CLOUD, minHeight: "100vh", color: INK }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Nunito:wght@400;600;700;800&display=swap');
        .hero-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 36px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, ${SUNSET}, #F09A3A);
          color: #fff; font-size: 16px; font-weight: 800; cursor: pointer;
          box-shadow: 0 8px 28px rgba(232,100,58,.35);
          text-decoration: none; font-family: 'Nunito', sans-serif;
          transition: transform .15s, box-shadow .15s;
        }
        .hero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(232,100,58,.4); }
        .hero-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 28px; border-radius: 14px;
          border: 2px solid ${MIST}; background: #fff;
          color: ${STONE}; font-size: 15px; font-weight: 700; cursor: pointer;
          text-decoration: none; font-family: 'Nunito', sans-serif;
          transition: border-color .15s, color .15s;
        }
        .hero-btn-secondary:hover { border-color: ${OCEAN}; color: ${OCEAN}; }
        .feature-card { transition: transform .2s, box-shadow .2s; }
        .feature-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.08); }
        .nav-cta {
          padding: 8px 20px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, ${SUNSET}, #F09A3A);
          color: #fff; font-size: 13px; font-weight: 800; cursor: pointer;
          text-decoration: none; font-family: 'Nunito', sans-serif;
        }
        @media (max-width: 640px) {
          .hero-headline { font-size: 34px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-row { flex-direction: column !important; align-items: center; }
          .steps-row > div { max-width: 320px; width: 100%; }
          .hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .hero-btns a { text-align: center; justify-content: center; }
          .bottom-cta { padding: 40px 24px !important; }
        }
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
          <span style={{ fontSize: 24 }}>🧳</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 800, color: INK }}>
            Toddler Trip
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/plan" style={{ fontSize: 13, fontWeight: 700, color: STONE, textDecoration: "none" }}>Sign in</Link>
          <Link href="/plan" className="nav-cta">Plan a Trip →</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: "center", padding: "72px 24px 64px", maxWidth: 780, margin: "0 auto" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#E6F6F8", border: `1px solid ${OCEAN}33`,
          borderRadius: 20, padding: "5px 14px", marginBottom: 28,
          fontSize: 12, fontWeight: 800, color: OCEAN, letterSpacing: ".04em",
        }}>
          ✨ Free to use · No credit card needed
        </div>

        <h1 className="hero-headline" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 52, fontWeight: 900, lineHeight: 1.15,
          color: INK, marginBottom: 22, letterSpacing: "-.01em",
        }}>
          Trip planning that works<br />
          <span style={{ color: SUNSET }}>around nap time</span>
        </h1>

        <p style={{
          fontSize: 18, color: STONE, lineHeight: 1.65,
          maxWidth: 560, margin: "0 auto 36px", fontWeight: 600,
        }}>
          AI-powered itineraries built around your kids&apos; ages, nap schedules, and interests.
          Get a personalized day-by-day plan in minutes — free.
        </p>

        <div className="hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <Link href="/plan" className="hero-btn-primary">✨ Plan My Family Trip</Link>
          <a href="#how-it-works" className="hero-btn-secondary">See how it works ↓</a>
        </div>
        <div style={{ marginBottom: 36 }}>
          <Link href="/destinations" style={{ fontSize: 13, fontWeight: 700, color: OCEAN, textDecoration: "none" }}>
            Browse destinations &rarr;
          </Link>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {["✓ Nap-aware scheduling", "✓ 14–18 AI-curated activities", "✓ Drag-and-drop calendar", "✓ Smart packing list"].map(f => (
            <span key={f} style={{
              fontSize: 12, fontWeight: 700, color: STONE,
              background: "#fff", border: `1px solid ${MIST}`,
              borderRadius: 20, padding: "5px 13px",
            }}>{f}</span>
          ))}
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how-it-works" style={{ background: "#fff", padding: "64px 24px", borderTop: `1px solid ${MIST}`, borderBottom: `1px solid ${MIST}` }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: OCEAN, marginBottom: 10 }}>HOW IT WORKS</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, textAlign: "center", marginBottom: 48, color: INK }}>
            From family profile to itinerary in 3 steps
          </h2>
          <div className="steps-row" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 14px", fontSize: 24,
                  boxShadow: "0 4px 16px rgba(232,100,58,.25)",
                }}>
                  {step.emoji}
                </div>
                <div style={{
                  background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`,
                  color: "#fff", fontSize: 10, fontWeight: 800,
                  borderRadius: 10, padding: "2px 8px", display: "inline-block",
                  marginBottom: 10, letterSpacing: ".04em",
                }}>STEP {step.n}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8, lineHeight: 1.3 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13, color: STONE, lineHeight: 1.6, fontWeight: 600 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "72px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <p style={{ textAlign: "center", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: OCEAN, marginBottom: 10 }}>FEATURES</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, textAlign: "center", marginBottom: 12, color: INK }}>
          Built for families with young kids
        </h2>
        <p style={{ textAlign: "center", color: STONE, fontSize: 15, fontWeight: 600, marginBottom: 48, maxWidth: 520, margin: "0 auto 48px" }}>
          Every feature was designed around the real constraints of traveling with toddlers.
        </p>
        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card" style={{
              background: "#fff", borderRadius: 18, padding: "28px 26px",
              border: `1px solid ${MIST}`,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: f.bg, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 26, marginBottom: 16,
              }}>{f.emoji}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: INK, marginBottom: 8 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13, color: STONE, lineHeight: 1.65, fontWeight: 600 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section style={{ background: "#fff", borderTop: `1px solid ${MIST}`, borderBottom: `1px solid ${MIST}`, padding: "56px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: OCEAN, marginBottom: 10 }}>WHO IT&apos;S FOR</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: INK, marginBottom: 28 }}>
            Perfect if you&apos;ve ever Googled<br />&ldquo;things to do with a toddler in…&rdquo;
          </h2>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              "Families with kids ages 0–12",
              "Parents who plan around nap time",
              "Beach vacations with little ones",
              "City trips with a stroller",
              "Outdoor families with young kids",
              "Anyone tired of generic travel guides",
            ].map(tag => (
              <span key={tag} style={{
                fontSize: 13, fontWeight: 700, color: INK,
                background: CLOUD, border: `1.5px solid ${MIST}`,
                borderRadius: 20, padding: "7px 16px",
              }}>✓ {tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section style={{ padding: "40px 24px", background: CLOUD }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              "Free forever — no credit card",
              "Your data stays private",
              "No ads in the planner",
            ].map(t => (
              <span key={t} style={{ fontSize: 12, fontWeight: 700, color: STONE, background: "#fff", border: `1px solid ${MIST}`, borderRadius: 20, padding: "6px 14px" }}>
                ✓ {t}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <Link href="/destinations" style={{ fontSize: 13, fontWeight: 700, color: OCEAN, textDecoration: "none" }}>
              Browse {">"}100 family destinations &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <div className="bottom-cta" style={{
          maxWidth: 600, margin: "0 auto",
          background: "linear-gradient(135deg, #1C3B4A, #0B5C6E)",
          borderRadius: 24, padding: "52px 40px",
          boxShadow: "0 20px 60px rgba(11,122,142,.2)",
        }}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>🧳</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, color: "#fff", marginBottom: 14 }}>
            Ready to plan your family trip?
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.75)", fontWeight: 600, marginBottom: 32, lineHeight: 1.6 }}>
            Free to use. Takes about 5 minutes to get a full itinerary.
          </p>
          <Link href="/plan" className="hero-btn-primary" style={{ fontSize: 17, padding: "16px 44px" }}>
            ✨ Start Planning — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section style={{ padding: "0 24px 56px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <NewsletterSignup source="homepage" variant="card" />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${MIST}`, padding: "40px 24px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", marginBottom: 28 }}>
            {/* Brand */}
            <div style={{ minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>🧳</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 800, color: INK }}>Toddler Trip</span>
              </div>
              <p style={{ fontSize: 12, color: STONE, fontWeight: 600, lineHeight: 1.6, maxWidth: 240 }}>
                AI-powered family travel planning built around nap time.
              </p>
            </div>
            {/* Links */}
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: INK, marginBottom: 10 }}>Product</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <Link href="/plan" style={{ fontSize: 13, fontWeight: 600, color: STONE, textDecoration: "none" }}>Plan a Trip</Link>
                  <Link href="/destinations" style={{ fontSize: 13, fontWeight: 600, color: STONE, textDecoration: "none" }}>Destinations</Link>
                  <Link href="/blog" style={{ fontSize: 13, fontWeight: 600, color: STONE, textDecoration: "none" }}>Blog</Link>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: INK, marginBottom: 10 }}>Company</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <Link href="/about" style={{ fontSize: 13, fontWeight: 600, color: STONE, textDecoration: "none" }}>About</Link>
                  <Link href="/privacy" style={{ fontSize: 13, fontWeight: 600, color: STONE, textDecoration: "none" }}>Privacy Policy</Link>
                  <Link href="/terms" style={{ fontSize: 13, fontWeight: 600, color: STONE, textDecoration: "none" }}>Terms of Service</Link>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${MIST}`, paddingTop: 20, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 11, color: STONE, fontWeight: 600 }}>
              &copy; {new Date().getFullYear()} Toddler Trip. Some links are affiliate links — we may earn a small commission at no extra cost to you.
            </p>
            <Link href="/plan" style={{ fontSize: 13, fontWeight: 800, color: OCEAN, textDecoration: "none" }}>
              Plan a Trip &rarr;
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
