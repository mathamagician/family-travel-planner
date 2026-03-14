import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminClient } from "../../../lib/supabase/admin";
import { DESTINATIONS, slugify, findDestination } from "../../_lib/destinations";
import DestinationActivities from "./DestinationActivities";
import WeatherWidget from "./WeatherWidget";

export const dynamic = "force-dynamic";

/** Generate metadata for SEO */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const dest = findDestination(slug);
  if (!dest) return {};

  const label = dest.type === "national_park"
    ? `${dest.city} National Park`
    : dest.state
      ? `${dest.city}, ${dest.state}`
      : dest.city;

  return {
    title: `Things to Do with Kids in ${label} — Toddler Trip`,
    description: `Plan a family trip to ${label}. AI-curated kid-friendly activities, nap-aware itineraries, and packing lists — all free on Toddler Trip.`,
    alternates: { canonical: `/destinations/${slug}` },
    openGraph: {
      title: `Things to Do with Kids in ${label}`,
      description: `Top family activities in ${label} — age-appropriate, nap-aware, and ready to drop into your itinerary.`,
    },
  };
}

const INK = "#1C2B33";
const OCEAN = "#0B7A8E";
const SUNSET = "#E8643A";
const STONE = "#8A9BA5";
const MIST = "#F0EDE8";
const CLOUD = "#FAFAF7";

const TYPE_EMOJI = {
  attraction: "🎡", museum: "🏛️", park: "🌳", beach: "🏖️",
  zoo: "🦁", aquarium: "🐠", playground: "🛝", hike: "🥾",
  show: "🎭", shopping: "🛍️", food: "🍕", garden: "🌷",
  landmark: "📍", water_park: "💦", theme_park: "🎢", farm: "🐄",
  tour: "🚌", sports: "⚽", custom: "📌",
};

const DURATION_LABELS = {
  full_day: "Full Day", half_day: "Half Day",
  "2-4h": "2–4 hours", "1-2h": "1–2 hours", "<1h": "Under 1 hour",
};

export default async function DestinationPage({ params }) {
  const { slug } = await params;
  const dest = findDestination(slug);
  if (!dest) notFound();

  const label = dest.type === "national_park"
    ? `${dest.city} National Park`
    : dest.state
      ? `${dest.city}, ${dest.state}`
      : dest.city;

  // Fetch activities from Supabase
  const supabase = getAdminClient();
  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .ilike("destination_city", dest.city)
    .order("google_rating", { ascending: false, nullsFirst: false })
    .limit(40);

  const acts = activities ?? [];

  // FAQ schema
  const faqs = [
    {
      q: `What are the best things to do with kids in ${dest.city}?`,
      a: acts.length > 0
        ? `Top family activities include ${acts.slice(0, 5).map(a => a.name).join(", ")}. Toddler Trip curates age-appropriate activities and builds nap-aware itineraries for your family.`
        : `Toddler Trip generates AI-curated, age-appropriate activities for ${dest.city}. Enter your kids' ages and we'll build a personalized itinerary.`,
    },
    {
      q: `Is ${dest.city} good for toddlers?`,
      a: `Yes! Many activities in ${dest.city} are suitable for toddlers. Toddler Trip filters activities by your children's ages and schedules around nap time so everyone enjoys the trip.`,
    },
    {
      q: `How do I plan a family trip to ${dest.city}?`,
      a: `Use Toddler Trip's free planner: enter your family profile, pick from AI-curated activities, and get a nap-aware day-by-day itinerary with a personalized packing list — all in about 5 minutes.`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.toddlertrip.com" },
      { "@type": "ListItem", position: 2, name: "Destinations", item: "https://www.toddlertrip.com/destinations" },
      { "@type": "ListItem", position: 3, name: label },
    ],
  };

  const planUrl = `/plan?destination=${encodeURIComponent(dest.city)}`;

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: CLOUD, minHeight: "100vh", color: INK }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Nunito:wght@400;600;700;800&display=swap');
        .act-card{transition:transform .15s,box-shadow .15s}.act-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
        .dest-cta{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:14px;border:none;background:linear-gradient(135deg,${SUNSET},#F09A3A);color:#fff;font-size:15px;font-weight:800;cursor:pointer;text-decoration:none;font-family:'Nunito',sans-serif;box-shadow:0 6px 20px rgba(232,100,58,.3);transition:transform .15s}
        .dest-cta:hover{transform:translateY(-2px)}
        @media(max-width:640px){.act-grid{grid-template-columns:1fr!important}.faq-grid{grid-template-columns:1fr!important}.enrichment-grid{grid-template-columns:1fr!important}}
      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

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

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "14px 24px 0" }}>
        <nav style={{ fontSize: 12, fontWeight: 600, color: STONE }}>
          <Link href="/" style={{ color: STONE, textDecoration: "none" }}>Home</Link>
          {" / "}
          <Link href="/destinations" style={{ color: STONE, textDecoration: "none" }}>Destinations</Link>
          {" / "}
          <span style={{ color: INK }}>{label}</span>
        </nav>
      </div>

      {/* Hero */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 40px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#E6F6F8", border: `1px solid ${OCEAN}33`, borderRadius: 20, padding: "4px 12px", marginBottom: 16, fontSize: 11, fontWeight: 800, color: OCEAN }}>
          {dest.type === "national_park" ? "🏔️ National Park" : dest.country !== "US" ? "🌍 International" : "🏙️ City"}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 14 }}>
          Things to Do with Kids in {label}
        </h1>
        <p style={{ fontSize: 17, color: STONE, fontWeight: 600, lineHeight: 1.6, maxWidth: 640, marginBottom: 24 }}>
          {acts.length > 0
            ? `Explore ${acts.length} family-friendly activities in ${dest.city} — filtered by age, scheduled around nap time, and ready to drop into your personalized itinerary.`
            : `Plan a family trip to ${dest.city} with AI-curated activities tailored to your kids' ages and nap schedule.`}
        </p>
      </section>

      {/* Interactive Activities Grid */}
      {acts.length > 0 && (
        <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 48px" }}>
          <DestinationActivities activities={acts} city={dest.city} planUrl={planUrl} />
        </section>
      )}

      {/* Weather + Mini-Itinerary + Packing Tips */}
      {acts.length > 0 && (() => {
        // Build a sample 2-day mini-itinerary from top activities
        const morning = acts.filter(a => ["1-2h", "<1h", "2-4h"].includes(a.duration_category)).slice(0, 2);
        const afternoon = acts.filter(a => ["half_day", "2-4h"].includes(a.duration_category) && !morning.includes(a)).slice(0, 2);
        const fullDay = acts.filter(a => a.duration_category === "full_day").slice(0, 1);
        const sampleDays = [
          { label: "Day 1 — Explore", blocks: [...morning.slice(0, 1), { name: "Lunch Break", icon: "🍕" }, ...afternoon.slice(0, 1)] },
          { label: "Day 2 — Adventure", blocks: fullDay.length > 0 ? [fullDay[0]] : [...morning.slice(1, 2), { name: "Nap Time", icon: "😴" }, ...afternoon.slice(1, 2)] },
        ].filter(d => d.blocks.length > 0);

        // Packing tips based on activity types
        const types = new Set(acts.map(a => a.type));
        const tips = [
          { text: "Sunscreen & hats for outdoor activities", show: types.has("park") || types.has("beach") || types.has("hike") || types.has("zoo") || types.has("playground") },
          { text: "Comfortable walking shoes for the whole family", show: true },
          { text: "Stroller or baby carrier", show: acts.some(a => a.stroller_accessible) },
          { text: "Swimwear & water shoes", show: types.has("beach") || types.has("water_park") || types.has("aquarium") },
          { text: "Snacks & water bottles", show: true },
          { text: "Rain jacket or poncho (just in case)", show: true },
          { text: "Small first-aid kit with band-aids", show: true },
          { text: "Entertainment for transit (books, tablet, coloring)", show: true },
          { text: "Hiking gear & bug spray", show: types.has("hike") },
          { text: "Change of clothes for little ones", show: types.has("water_park") || types.has("beach") || types.has("playground") },
        ].filter(t => t.show).slice(0, 8);

        return (
          <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 48px" }}>
            <div className="enrichment-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Left column: Weather + Packing */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <WeatherWidget city={dest.city} />

                {/* Packing Tips */}
                <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${MIST}`, padding: "20px 24px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: OCEAN, marginBottom: 14 }}>
                    Packing Tips for {dest.city}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                    {tips.map((t, i) => (
                      <li key={i} style={{ fontSize: 13, fontWeight: 600, color: INK, lineHeight: 1.5 }}>{t.text}</li>
                    ))}
                  </ul>
                  <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: STONE }}>
                    Get a full personalized packing list when you <a href={planUrl} style={{ color: OCEAN, textDecoration: "none", fontWeight: 800 }}>plan your trip</a>.
                  </div>
                </div>
              </div>

              {/* Right column: Mini-Itinerary */}
              <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${MIST}`, padding: "20px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: OCEAN, marginBottom: 14 }}>
                  Sample Family Itinerary
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {sampleDays.map((day, di) => (
                    <div key={di}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 8 }}>{day.label}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {day.blocks.map((b, bi) => (
                          <div key={bi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#FAFAF7", borderRadius: 8, borderLeft: `3px solid ${OCEAN}` }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>{b.icon || (TYPE_EMOJI[b.type] || "📌")}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{b.name}</div>
                              {b.duration_category && (
                                <div style={{ fontSize: 10, fontWeight: 600, color: STONE }}>
                                  {DURATION_LABELS[b.duration_category] || b.duration_category}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <a href={planUrl} className="dest-cta" style={{ fontSize: 13, padding: "10px 24px" }}>
                    Build Your Custom Itinerary
                  </a>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* FAQ */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 56px" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
          Frequently Asked Questions
        </h2>
        <div className="faq-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {faqs.map((f, i) => (
            <details key={i} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${MIST}`, padding: "16px 20px" }}>
              <summary style={{ fontSize: 14, fontWeight: 800, color: INK, cursor: "pointer", lineHeight: 1.4 }}>{f.q}</summary>
              <p style={{ fontSize: 13, color: STONE, fontWeight: 600, lineHeight: 1.7, marginTop: 10, marginBottom: 0 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related destinations */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 56px" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
          Explore More Destinations
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DESTINATIONS.filter(d => d.city !== dest.city).sort(() => 0.5 - Math.random()).slice(0, 12).map(d => (
            <Link key={slugify(d.city)} href={`/destinations/${slugify(d.city)}`}
              style={{ fontSize: 12, fontWeight: 700, color: OCEAN, background: "#E6F6F8", borderRadius: 20, padding: "6px 14px", textDecoration: "none", border: `1px solid ${OCEAN}22` }}>
              {d.city}
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${MIST}`, padding: "28px 24px", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🧳</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: STONE }}>Toddler Trip</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/about" style={{ fontSize: 12, fontWeight: 600, color: STONE, textDecoration: "none" }}>About</Link>
          <Link href="/privacy" style={{ fontSize: 12, fontWeight: 600, color: STONE, textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ fontSize: 12, fontWeight: 600, color: STONE, textDecoration: "none" }}>Terms</Link>
        </div>
        <p style={{ fontSize: 11, color: STONE, fontWeight: 600 }}>&copy; {new Date().getFullYear()} Toddler Trip</p>
      </footer>
    </div>
  );
}
