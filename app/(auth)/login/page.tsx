"use client";

export const dynamic = "force-dynamic";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/home" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F4EF", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Desktop: two column. Mobile: stacked */}
      <div className="login-container">

        {/* Left / Top dark panel */}
        <div className="login-left">
          <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)", top: "-150px", right: "-150px" }}/>
          <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)", top: "-80px", right: "-60px" }}/>
          <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)", bottom: "-150px", left: "-80px" }}/>

          <div style={{ position: "relative", zIndex: 1, marginBottom: "auto" }}>
            <span style={{ fontSize: "1rem", color: "#FFFFFF", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>
              ✦ Gift Finder
            </span>
          </div>

          <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontSize: "0.8rem", color: "#E8622A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
              The art of gifting
            </p>
            <h1 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              color: "#F7F4EF", lineHeight: 1.1, margin: 0, fontWeight: 400,
            }}>
              Share what<br />
              you want.<br />
              <em style={{ color: "#E8622A" }}>Gift with confidence.</em>
            </h1>
          </div>

          <div style={{ position: "relative", zIndex: 1, marginTop: "auto" }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", lineHeight: 1.7, margin: 0 }}>
              No more guessing.<br />
              No more endless searching.
            </p>
          </div>
        </div>

        {/* Right / Bottom sign-in panel */}
        <div className="login-right">
          <div style={{ width: "100%", maxWidth: "360px" }}>
            <div style={{ width: "52px", height: "52px", background: "#1C1917", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.75rem", fontSize: "1.4rem" }}>
              🎁
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.85rem", color: "#1C1917", margin: "0 0 0.4rem", fontWeight: 400 }}>
              Welcome
            </h2>
            <p style={{ color: "#78716C", fontSize: "0.9rem", margin: "0 0 2rem", lineHeight: 1.6 }}>
              No more guessing. No more endless searching.
            </p>
            <button
              onClick={handleSignIn}
              disabled={loading}
              style={{
                width: "100%", padding: "0.9rem 1.5rem",
                background: loading ? "#C94E1E" : "#E8622A",
                color: "#F7F4EF", border: "none", borderRadius: "12px",
                fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
              }}
            >
              {loading ? <span style={{ opacity: 0.7 }}>Signing in...</span> : <><GoogleIcon />Continue with Google</>}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.5rem 0" }}>
              <div style={{ flex: 1, height: "1px", background: "#E8E8E8" }}/>
              <span style={{ fontSize: "0.8rem", color: "#A8A29E" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "#E8E8E8" }}/>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#A8A29E", textAlign: "center", lineHeight: 1.6, margin: 0 }}>
              By continuing, you agree to our{" "}
              <a href="#" style={{ color: "#78716C", textDecoration: "underline" }}>Terms</a>{" "}and{" "}
              <a href="#" style={{ color: "#78716C", textDecoration: "underline" }}>Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }

        .login-container {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
        }

        .login-left {
          flex: 0 0 52%;
          background: #1C1917;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          position: relative;
          overflow: hidden;
          min-height: 100vh;
        }

        .login-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem 2rem;
        }

        @media (max-width: 680px) {
          .login-container {
            flex-direction: column;
          }
          .login-left {
            flex: none;
            min-height: auto;
            padding: 2.5rem 1.5rem 3rem;
          }
          .login-left > div:last-child {
            display: none;
          }
          .login-right {
            flex: 1;
            align-items: flex-start;
            padding: 2.5rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}





