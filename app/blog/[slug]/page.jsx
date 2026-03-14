import Link from "next/link";
import { notFound } from "next/navigation";
import { findPost, getAllPosts } from "../../_lib/blog-posts";
import NewsletterSignup from "../../../components/NewsletterSignup";

const INK = "#1C2B33";
const OCEAN = "#0B7A8E";
const SUNSET = "#E8643A";
const STONE = "#8A9BA5";
const MIST = "#F0EDE8";
const CLOUD = "#FAFAF7";

/* ── Static params for build-time generation ── */
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

/* ── Dynamic metadata ── */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

/* ── Content block renderer ── */
function ContentBlock({ block }) {
  switch (block.type) {
    case "heading":
      return (
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 24, fontWeight: 800, color: INK,
          marginTop: 40, marginBottom: 14, lineHeight: 1.3,
        }}>
          {block.text}
        </h2>
      );
    case "subheading":
      return (
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 19, fontWeight: 800, color: INK,
          marginTop: 28, marginBottom: 10, lineHeight: 1.3,
        }}>
          {block.text}
        </h3>
      );
    case "paragraph":
      return (
        <p style={{
          fontSize: 16, lineHeight: 1.75, color: STONE,
          fontWeight: 600, marginBottom: 20,
        }}>
          {block.text}
        </p>
      );
    case "callout":
      return (
        <div style={{
          background: "#E6F6F8", border: `1px solid ${OCEAN}22`,
          borderRadius: 14, padding: "20px 24px", marginBottom: 24,
          borderLeft: `4px solid ${OCEAN}`,
        }}>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: INK, fontWeight: 600, marginBottom: block.link ? 10 : 0 }}>
            {block.text}
          </p>
          {block.link && (
            <Link href={block.link} style={{
              fontSize: 14, fontWeight: 800, color: OCEAN, textDecoration: "none",
            }}>
              {block.linkText || "Learn more"} &rarr;
            </Link>
          )}
        </div>
      );
    case "cta":
      return (
        <div style={{
          background: "linear-gradient(135deg, #1C3B4A, #0B5C6E)",
          borderRadius: 18, padding: "36px 32px", marginTop: 40,
          marginBottom: 24, textAlign: "center",
        }}>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.85)", fontWeight: 600, marginBottom: 20, lineHeight: 1.6 }}>
            {block.text}
          </p>
          <Link href={block.link} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 32px", borderRadius: 14, border: "none",
            background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`,
            color: "#fff", fontSize: 15, fontWeight: 800,
            boxShadow: "0 8px 28px rgba(232,100,58,.35)",
            textDecoration: "none", fontFamily: "'Nunito', sans-serif",
          }}>
            {block.linkText || "Get Started"}
          </Link>
        </div>
      );
    default:
      return null;
  }
}

/* ── Page ── */
export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: "Toddler Trip", url: "https://www.toddlertrip.com" },
    publisher: { "@type": "Organization", name: "Toddler Trip", url: "https://www.toddlertrip.com" },
    mainEntityOfPage: `https://www.toddlertrip.com/blog/${slug}`,
    keywords: post.tags,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.toddlertrip.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.toddlertrip.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: CLOUD, minHeight: "100vh", color: INK }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Nunito:wght@400;600;700;800&display=swap');
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
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 24px 0" }}>
        <nav style={{ fontSize: 12, fontWeight: 600, color: STONE }}>
          <Link href="/" style={{ color: STONE, textDecoration: "none" }}>Home</Link>
          {" / "}
          <Link href="/blog" style={{ color: STONE, textDecoration: "none" }}>Blog</Link>
          {" / "}
          <span style={{ color: INK }}>{post.title}</span>
        </nav>
      </div>

      {/* ── Article Header ── */}
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 80px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#E6F6F8", border: `1px solid ${OCEAN}33`,
          borderRadius: 20, padding: "4px 12px", marginBottom: 16,
          fontSize: 11, fontWeight: 800, color: OCEAN, textTransform: "uppercase",
          letterSpacing: ".06em",
        }}>
          {post.category}
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900,
          lineHeight: 1.15, marginBottom: 16,
        }}>
          {post.title}
        </h1>

        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          fontSize: 13, fontWeight: 600, color: STONE, marginBottom: 40,
        }}>
          <span>{post.author}</span>
          <span style={{ color: MIST }}>·</span>
          <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span style={{ color: MIST }}>·</span>
          <span>{post.readTime}</span>
        </div>

        {/* ── Article Body ── */}
        <div>
          {post.content.map((block, i) => (
            <ContentBlock key={i} block={block} />
          ))}
        </div>

        {/* ── Tags ── */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${MIST}` }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {post.tags.map((tag) => (
              <span key={tag} style={{
                fontSize: 12, fontWeight: 700, color: STONE,
                background: "#fff", border: `1px solid ${MIST}`,
                borderRadius: 20, padding: "4px 12px",
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Newsletter ── */}
        <div style={{ marginTop: 40 }}>
          <NewsletterSignup source="blog-post" variant="card" />
        </div>

        {/* ── Back to Blog ── */}
        <div style={{ marginTop: 32 }}>
          <Link href="/blog" style={{
            fontSize: 14, fontWeight: 800, color: OCEAN, textDecoration: "none",
          }}>
            &larr; Back to Blog
          </Link>
        </div>
      </article>

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
