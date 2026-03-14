"use client";

import { useState } from "react";

const INK = "#1C2B33";
const OCEAN = "#0B7A8E";
const SUNSET = "#E8643A";
const STONE = "#8A9BA5";
const MIST = "#F0EDE8";

/**
 * Reusable newsletter signup form.
 * Props:
 *  - source: string identifying where the signup came from (e.g. "homepage", "blog", "destination")
 *  - variant: "inline" (default) | "card" — card adds a background + border
 *  - heading: optional custom heading text
 *  - subtext: optional custom description text
 */
export default function NewsletterSignup({
  source = "website",
  variant = "inline",
  heading = "Get family travel tips & deals",
  subtext = "Packing hacks, destination guides, and nap-friendly itinerary ideas — delivered to your inbox.",
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong.");
        return;
      }

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div style={{
        ...(variant === "card" ? cardStyle : {}),
        textAlign: "center",
        padding: variant === "card" ? "32px 24px" : "20px 0",
      }}>
        <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>✉️</span>
        <p style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 4 }}>You&apos;re on the list!</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: STONE }}>We&apos;ll send you our best family travel tips.</p>
      </div>
    );
  }

  return (
    <div style={variant === "card" ? cardStyle : {}}>
      <p style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 18, fontWeight: 800, color: INK,
        marginBottom: 6, lineHeight: 1.3,
      }}>
        {heading}
      </p>
      <p style={{ fontSize: 13, fontWeight: 600, color: STONE, marginBottom: 16, lineHeight: 1.6 }}>
        {subtext}
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          style={{
            flex: "1 1 200px", padding: "10px 14px",
            borderRadius: 10, border: `1.5px solid ${MIST}`,
            fontSize: 14, fontWeight: 600, color: INK,
            fontFamily: "'Nunito', sans-serif",
            outline: "none", background: "#fff",
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            padding: "10px 22px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${SUNSET}, #F09A3A)`,
            color: "#fff", fontSize: 13, fontWeight: 800,
            fontFamily: "'Nunito', sans-serif", cursor: "pointer",
            opacity: status === "loading" ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {status === "loading" ? "Joining..." : "Subscribe"}
        </button>
      </form>

      {status === "error" && (
        <p style={{ fontSize: 12, fontWeight: 600, color: "#D44", marginTop: 8 }}>
          {errorMsg}
        </p>
      )}

      <p style={{ fontSize: 11, fontWeight: 600, color: STONE, marginTop: 10, opacity: 0.7 }}>
        Free forever. Unsubscribe anytime. No spam.
      </p>
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  border: `1px solid ${MIST}`,
  borderRadius: 18,
  padding: "28px 24px",
};
