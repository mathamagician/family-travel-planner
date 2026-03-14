import Link from "next/link";
import { getAllPosts } from "../_lib/blog-posts";
import NewsletterSignup from "../../components/NewsletterSignup";

export const metadata = {
  title: "Family Travel Blog — Toddler Trip",
  description:
    "Practical family travel tips, destination guides, and nap-aware planning advice for parents traveling with young kids.",
  alternates: { canonical: "/blog" },
};

const INK = "#1C2B33";
const OCEAN = "#0B7A8E";
const SUNSET = "#E8643A";
const STONE = "#8A9BA5";
const MIST = "#F0EDE8";
const CLOUD = "#FAFAF7";

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: CLOUD, minHeight: "100vh", color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Nunito:wght@400;600;700;800&display=swap');
        .blog-card { transition: transform .2s, box-shadow .2s; cursor: pointer; }
        .blog-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.08); }
        .blog-card a { text-decoration: none; color: inherit; }
        @media (max-width: 640px) {
          .blog-grid { grid-template-columns: 1fr !important; }
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
        <Link href="/plan" style={{
          padding: "8px 20px", borderRadius: 10, border: "none",
          background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`,
          color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none",
        }}>
          Plan a Trip →
        </Link>
      </nav>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "14px 24px 0" }}>
        <nav style={{ fontSize: 12, fontWeight: 600, color: STONE }}>
          <Link href="/" style={{ color: STONE, textDecoration: "none" }}>Home</Link>
          {" / "}
          <span style={{ color: INK }}>Blog</span>
        </nav>
      </div>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 48px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#E6F6F8", border: `1px solid ${OCEAN}33`,
          borderRadius: 20, padding: "4px 12px", marginBottom: 16,
          fontSize: 11, fontWeight: 800, color: OCEAN,
        }}>
          FAMILY TRAVEL BLOG
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900,
          lineHeight: 1.15, marginBottom: 14,
        }}>
          Tips, Guides & Destination Ideas
        </h1>
        <p style={{
          fontSize: 17, color: STONE, fontWeight: 600, lineHeight: 1.6,
          maxWidth: 560, margin: "0 auto",
        }}>
          Practical advice for parents traveling with young kids — from nap-aware scheduling to packing, flying tips, and the best family destinations.
        </p>
      </section>

      {/* ── Posts Grid ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        <div className="blog-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {posts.map((post) => (
            <article key={post.slug} className="blog-card" style={{
              background: "#fff", borderRadius: 18, border: `1px solid ${MIST}`,
              padding: "28px 26px", display: "flex", flexDirection: "column",
            }}>
              <Link href={`/blog/${post.slug}`}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: ".06em", color: OCEAN, marginBottom: 12,
                }}>
                  {post.category}
                </div>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20, fontWeight: 800, lineHeight: 1.3,
                  color: INK, marginBottom: 10,
                }}>
                  {post.title}
                </h2>
                <p style={{
                  fontSize: 14, color: STONE, lineHeight: 1.6,
                  fontWeight: 600, marginBottom: 16, flex: 1,
                }}>
                  {post.description}
                </p>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  fontSize: 12, fontWeight: 600, color: STONE,
                }}>
                  <span>{post.readTime}</span>
                  <span style={{ color: MIST }}>·</span>
                  <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 24px", color: STONE }}>
            <p style={{ fontSize: 16, fontWeight: 600 }}>New posts coming soon!</p>
          </div>
        )}
      </section>

      {/* ── Newsletter ── */}
      <section style={{ maxWidth: 520, margin: "0 auto", padding: "0 24px 56px" }}>
        <NewsletterSignup source="blog" variant="card" />
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "0 24px 80px", textAlign: "center" }}>
        <div style={{
          maxWidth: 600, margin: "0 auto",
          background: "linear-gradient(135deg, #1C3B4A, #0B5C6E)",
          borderRadius: 24, padding: "48px 40px",
          boxShadow: "0 20px 60px rgba(11,122,142,.2)",
        }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            Ready to plan your family trip?
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.75)", fontWeight: 600, marginBottom: 28, lineHeight: 1.6 }}>
            AI-powered itineraries built around nap time — free.
          </p>
          <Link href="/plan" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 36px", borderRadius: 14, border: "none",
            background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`,
            color: "#fff", fontSize: 15, fontWeight: 800,
            boxShadow: "0 8px 28px rgba(232,100,58,.35)",
            textDecoration: "none", fontFamily: "'Nunito', sans-serif",
          }}>
            Start Planning
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${MIST}`, padding: "40px 24px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", marginBottom: 28 }}>
            <div style={{ minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>🧳</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 800, color: INK }}>Toddler Trip</span>
              </div>
              <p style={{ fontSize: 12, color: STONE, fontWeight: 600, lineHeight: 1.6, maxWidth: 240 }}>
                AI-powered family travel planning built around nap time.
              </p>
            </div>
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
