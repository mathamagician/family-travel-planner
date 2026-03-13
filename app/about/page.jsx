import Link from "next/link";

export const metadata = {
  title: "About Toddler Trip",
  description:
    "Toddler Trip is a free AI-powered travel planner that builds family itineraries around nap time, kids' ages, and energy levels.",
};

const INK = "#1C2B33";
const OCEAN = "#0B7A8E";
const STONE = "#8A9BA5";
const MIST = "#F0EDE8";
const CLOUD = "#FAFAF7";
const SUNSET = "#E8643A";

export default function AboutPage() {
  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: CLOUD, minHeight: "100vh", color: INK }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Nunito:wght@400;600;700;800&display=swap');`}</style>

      <nav style={{ borderBottom: `1px solid ${MIST}`, padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <span style={{ fontSize: 24 }}>🧳</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 800, color: INK }}>Toddler Trip</span>
        </Link>
        <Link href="/plan" style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`, color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
          Plan a Trip &rarr;
        </Link>
      </nav>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "56px 24px 80px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800, marginBottom: 24 }}>About Toddler Trip</h1>

        <p style={{ fontSize: 16, lineHeight: 1.7, color: STONE, fontWeight: 600, marginBottom: 20 }}>
          Toddler Trip was built by parents who got tired of generic travel planners that ignore the reality of traveling with young kids.
        </p>

        <p style={{ fontSize: 16, lineHeight: 1.7, color: STONE, fontWeight: 600, marginBottom: 20 }}>
          Every family trip involves the same puzzle: how do you fit museums, beaches, and theme parks around nap time, early bedtimes, and the meltdown danger zone? Existing planners treat a family of four the same as a solo backpacker. We don&apos;t.
        </p>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, marginBottom: 12, marginTop: 36 }}>What makes us different</h2>

        <ul style={{ fontSize: 15, lineHeight: 1.8, color: STONE, fontWeight: 600, paddingLeft: 24 }}>
          <li><strong style={{ color: INK }}>Nap-aware scheduling</strong> &mdash; your itinerary is built around your kids&apos; sleep needs, not despite them.</li>
          <li><strong style={{ color: INK }}>Age-appropriate activities</strong> &mdash; AI filters and scores activities by your children&apos;s ages.</li>
          <li><strong style={{ color: INK }}>Energy-balanced days</strong> &mdash; mornings get high-energy activities, afternoons get calmer ones.</li>
          <li><strong style={{ color: INK }}>Smart packing lists</strong> &mdash; personalized by destination, weather, kids&apos; ages, and planned activities.</li>
        </ul>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, marginBottom: 12, marginTop: 36 }}>Free to use</h2>

        <p style={{ fontSize: 16, lineHeight: 1.7, color: STONE, fontWeight: 600, marginBottom: 20 }}>
          Toddler Trip is completely free. We earn a small commission when you book activities or buy gear through our affiliate links &mdash; at no extra cost to you. This keeps the tool free for every family.
        </p>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, marginBottom: 12, marginTop: 36 }}>Contact</h2>

        <p style={{ fontSize: 16, lineHeight: 1.7, color: STONE, fontWeight: 600, marginBottom: 32 }}>
          Questions or feedback? Email us at <a href="mailto:hello@toddlertrip.com" style={{ color: OCEAN, fontWeight: 700 }}>hello@toddlertrip.com</a>.
        </p>

        <Link href="/plan" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`, color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>
          ✨ Plan Your Family Trip &mdash; Free
        </Link>
      </main>
    </div>
  );
}
