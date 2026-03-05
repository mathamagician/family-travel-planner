"use client";

import { useState } from "react";
import { useSupabase } from "./Providers";

const S = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(28,43,51,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 20,
  },
  card: {
    background: "#fff", borderRadius: 20, padding: "32px 28px",
    width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    fontFamily: "'Nunito', sans-serif",
  },
  input: {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "2px solid #F0EDE8", fontSize: 14, fontWeight: 600,
    background: "#fff", color: "#1C2B33", boxSizing: "border-box",
    marginTop: 6, outline: "none", transition: "border-color .2s",
  },
  label: {
    display: "block", fontSize: 11, fontWeight: 800,
    textTransform: "uppercase", letterSpacing: ".08em", color: "#8A9BA5",
    marginTop: 14,
  },
  btn: (primary) => ({
    width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
    background: primary ? "linear-gradient(135deg,#E8643A,#F09A3A)" : "#F0EDE8",
    color: primary ? "#fff" : "#1C2B33", fontSize: 14, fontWeight: 800,
    cursor: "pointer", marginTop: 10,
    boxShadow: primary ? "0 6px 20px rgba(232,100,58,.3)" : "none",
  }),
  divider: { textAlign: "center", fontSize: 12, color: "#8A9BA5", margin: "14px 0", fontWeight: 600 },
  googleBtn: {
    width: "100%", padding: "12px 0", borderRadius: 12,
    border: "2px solid #E8E4DF", background: "#fff",
    fontSize: 14, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 10,
  },
  error: {
    background: "#FEF0EB", borderRadius: 8, padding: "8px 12px",
    color: "#E8643A", fontSize: 12, fontWeight: 600, marginTop: 10,
  },
  toggle: { textAlign: "center", marginTop: 16, fontSize: 12, color: "#8A9BA5" },
  toggleBtn: { background: "none", border: "none", color: "#0B7A8E", fontWeight: 700, cursor: "pointer", fontSize: 12 },
};

export default function AuthModal({ onClose }) {
  const { supabase } = useSupabase();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onClose();
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account!");
    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) setError(error.message);
      else setMessage("Password reset email sent!");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const titles = { signin: "Welcome Back", signup: "Create Account", reset: "Reset Password" };

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, margin: 0 }}>
            {titles[mode]}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#8A9BA5" }}>×</button>
        </div>

        {message && <div style={{ ...S.error, background: "#E6F6F8", color: "#0B7A8E" }}>{message}</div>}

        {mode !== "reset" && (
          <>
            <button onClick={handleGoogle} style={S.googleBtn} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.4 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.4 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5L31 33.5C29.1 34.8 26.6 36 24 36c-5.2 0-9.6-2.9-11.7-7.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.4-2.4 4.5-4.4 6l6.5 5.1C41.4 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
              </svg>
              Continue with Google
            </button>
            <div style={S.divider}>— or —</div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label style={S.label}>Your Name</label>
              <input style={S.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" required />
            </>
          )}
          <label style={S.label}>Email</label>
          <input style={S.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />

          {mode !== "reset" && (
            <>
              <label style={S.label}>Password</label>
              <input style={S.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </>
          )}

          {error && <div style={S.error}>{error}</div>}

          <button type="submit" style={S.btn(true)} disabled={loading}>
            {loading ? "..." : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Email"}
          </button>
        </form>

        <div style={S.toggle}>
          {mode === "signin" && (
            <>
              No account?{" "}
              <button style={S.toggleBtn} onClick={() => { setMode("signup"); setError(null); }}>Sign up free</button>
              {" · "}
              <button style={S.toggleBtn} onClick={() => { setMode("reset"); setError(null); }}>Forgot password?</button>
            </>
          )}
          {mode === "signup" && (
            <>Already have an account? <button style={S.toggleBtn} onClick={() => { setMode("signin"); setError(null); }}>Sign in</button></>
          )}
          {mode === "reset" && (
            <button style={S.toggleBtn} onClick={() => { setMode("signin"); setError(null); }}>← Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}
