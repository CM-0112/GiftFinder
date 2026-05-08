"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/wishlist" });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F7F4EF",
      display: "flex",
      fontFamily: "'DM Serif Display', Georgia, serif",
    }}>
      {/* Left panel */}
      <div style={{
        flex: "0 0 52%",
        background: "#1C1917",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "3rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.06)",
          top: "-200px",
          right: "-200px",
        }}/>
        <div style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.06)",
          top: "-100px",
          right: "-100px",
        }}/>
        <div style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.04)",
          bottom: "-200px",
          left: "-100px",
        }}/>

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{
            fontSize: "1.1rem",
            color: "#E8DDD0",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
          }}>
            ✦ Wishlist
          </span>
        </div>

        {/* Main copy */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{
            fontSize: "0.85rem",
            color: "#8B7355",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: "1.5rem",
          }}>
            The art of gifting
          </p>
          <h1 style={{
            fontSize: "clamp(2.8rem, 4vw, 4rem)",
            color: "#F7F4EF",
            lineHeight: 1.1,
            margin: 0,
            fontWeight: 400,
          }}>
            Tell the people<br />
            who love you<br />
            <em style={{ color: "#C4A882" }}>what you want.</em>
          </h1>
        </div>

        {/* Bottom tagline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{
            color: "#5C5048",
            fontSize: "0.9rem",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.7,
            margin: 0,
            maxWidth: "320px",
          }}>
            Share your wishlist with the people who matter.
            No more guessing. No more duplicate gifts.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "3rem",
      }}>
        <div style={{ width: "100%", maxWidth: "360px" }}>

          {/* Gift icon */}
          <div style={{
            width: "56px",
            height: "56px",
            background: "#1C1917",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "2rem",
            fontSize: "1.5rem",
          }}>
            🎁
          </div>

          <h2 style={{
            fontSize: "2rem",
            color: "#1C1917",
            margin: "0 0 0.5rem",
            fontWeight: 400,
          }}>
            Welcome back
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            color: "#78716C",
            fontSize: "0.95rem",
            margin: "0 0 2.5rem",
            lineHeight: 1.6,
          }}>
            Sign in to manage your wishlist or browse a friend's.
          </p>

          {/* Sign in button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.9rem 1.5rem",
              background: loading ? "#D6CFC8" : "#1C1917",
              color: "#F7F4EF",
              border: "none",
              borderRadius: "12px",
              fontSize: "0.95rem",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              transition: "background 0.2s, transform 0.1s",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => {
              if (!loading) (e.target as HTMLButtonElement).style.background = "#2C2420";
            }}
            onMouseLeave={e => {
              if (!loading) (e.target as HTMLButtonElement).style.background = "#1C1917";
            }}
            onMouseDown={e => {
              (e.target as HTMLButtonElement).style.transform = "scale(0.98)";
            }}
            onMouseUp={e => {
              (e.target as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            {loading ? (
              <span style={{ opacity: 0.7 }}>Signing in...</span>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            margin: "2rem 0",
          }}>
            <div style={{ flex: 1, height: "1px", background: "#E5E0D8" }}/>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              color: "#A8A29E",
              letterSpacing: "0.05em",
            }}>
              or
            </span>
            <div style={{ flex: 1, height: "1px", background: "#E5E0D8" }}/>
          </div>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.8rem",
            color: "#A8A29E",
            textAlign: "center",
            lineHeight: 1.6,
            margin: 0,
          }}>
            By continuing, you agree to our{" "}
            <a href="#" style={{ color: "#78716C", textDecoration: "underline" }}>Terms</a>
            {" "}and{" "}
            <a href="#" style={{ color: "#78716C", textDecoration: "underline" }}>Privacy Policy</a>.
          </p>
        </div>
      </div>

      {/* Google Fonts */}
      <style>{`
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
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
