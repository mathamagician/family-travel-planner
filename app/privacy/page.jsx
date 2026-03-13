import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "Toddler Trip privacy policy — how we collect, use, and protect your data.",
};

const INK = "#1C2B33";
const STONE = "#8A9BA5";
const MIST = "#F0EDE8";
const CLOUD = "#FAFAF7";
const SUNSET = "#E8643A";

export default function PrivacyPage() {
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
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: STONE, fontWeight: 600, marginBottom: 32 }}>Last updated: March 13, 2026</p>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: STONE, fontWeight: 600 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: INK, marginTop: 28, marginBottom: 10 }}>What we collect</h2>
          <ul style={{ paddingLeft: 24 }}>
            <li><strong style={{ color: INK }}>Account info</strong> &mdash; email address and display name when you sign up.</li>
            <li><strong style={{ color: INK }}>Family profile</strong> &mdash; children&apos;s birth dates, destination, trip dates, and preferences you enter.</li>
            <li><strong style={{ color: INK }}>Trip data</strong> &mdash; saved itineraries, packing lists, and activity selections.</li>
            <li><strong style={{ color: INK }}>Usage analytics</strong> &mdash; page views and feature usage via Google Analytics (anonymized).</li>
          </ul>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: INK, marginTop: 28, marginBottom: 10 }}>How we use it</h2>
          <ul style={{ paddingLeft: 24 }}>
            <li>Generate personalized itineraries and packing lists for your family.</li>
            <li>Save and share your trips across sessions.</li>
            <li>Improve our activity recommendations and scheduling algorithms.</li>
            <li>Send your itinerary via email (only when you request it).</li>
          </ul>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: INK, marginTop: 28, marginBottom: 10 }}>What we don&apos;t do</h2>
          <ul style={{ paddingLeft: 24 }}>
            <li>We never sell your personal data to third parties.</li>
            <li>We never share your children&apos;s information with advertisers.</li>
            <li>We don&apos;t send marketing emails unless you opt in.</li>
          </ul>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: INK, marginTop: 28, marginBottom: 10 }}>Third-party services</h2>
          <ul style={{ paddingLeft: 24 }}>
            <li><strong style={{ color: INK }}>Supabase</strong> &mdash; database and authentication (data stored in the US).</li>
            <li><strong style={{ color: INK }}>Google Analytics</strong> &mdash; anonymized usage analytics.</li>
            <li><strong style={{ color: INK }}>Resend</strong> &mdash; transactional email delivery.</li>
            <li><strong style={{ color: INK }}>Affiliate partners</strong> (Viator, BabyQuip, Amazon) &mdash; when you click affiliate links, those partners may set cookies per their own privacy policies.</li>
          </ul>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: INK, marginTop: 28, marginBottom: 10 }}>Data retention &amp; deletion</h2>
          <p>You can delete your account and all associated data at any time by contacting us. Trip data for deleted accounts is purged within 30 days.</p>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: INK, marginTop: 28, marginBottom: 10 }}>Contact</h2>
          <p>For privacy questions, email <a href="mailto:hello@toddlertrip.com" style={{ color: "#0B7A8E", fontWeight: 700 }}>hello@toddlertrip.com</a>.</p>
        </div>
      </main>
    </div>
  );
}
