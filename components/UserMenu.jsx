"use client";

import { useState } from "react";
import { useSupabase } from "./Providers";
import AuthModal from "./AuthModal";

export default function UserMenu() {
  const { user, supabase, loading } = useSupabase();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
  };

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "7px 18px", borderRadius: 20,
            border: "2px solid #0B7A8E", background: "transparent",
            color: "#0B7A8E", fontSize: 12, fontWeight: 800,
            cursor: "pointer", fontFamily: "'Nunito', sans-serif",
          }}
        >
          Sign In
        </button>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  const initials = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowMenu((v) => !v)}
        style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg,#0B7A8E,#2D8A4E)",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 800,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
        title={user.email}
      >
        {initials}
      </button>

      {showMenu && (
        <div
          style={{
            position: "absolute", top: 44, right: 0, background: "#fff",
            borderRadius: 12, border: "1px solid #F0EDE8",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            minWidth: 180, zIndex: 100, overflow: "hidden",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #F0EDE8" }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#8A9BA5" }}>Signed in as</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1C2B33", marginTop: 2, wordBreak: "break-all" }}>{user.email}</div>
          </div>
          <button
            onClick={signOut}
            style={{
              display: "block", width: "100%", padding: "10px 14px",
              background: "none", border: "none", textAlign: "left",
              fontSize: 13, fontWeight: 700, color: "#E8643A", cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      )}

      {showMenu && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
