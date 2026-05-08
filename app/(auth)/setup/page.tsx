"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

export default function SetupPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill display name from Google
  useEffect(() => {
    if (session?.user?.name) setDisplayName(session.user.name);
    // @ts-ignore
    if (session?.user?.username && !session.user.username.startsWith("user-")) {
      // @ts-ignore
      setUsername(session.user.username);
    }
  }, [session]);

  // Debounced username availability check
  useEffect(() => {
    if (!username.trim()) { setCheckState("idle"); return; }
    if (!isValidUsername(username)) { setCheckState("invalid"); return; }
    setCheckState("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setCheckState(data.available ? "available" : "taken");
      } catch {
        setCheckState("idle");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  function isValidUsername(val: string) {
    return /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(val);
  }

  async function handleSave() {
    if (!displayName.trim()) { setError("Please enter your name."); return; }
    if (checkState !== "available") return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, display_name: displayName.trim() }),
      });
      if (res.ok) {
        await update();
        router.push("/wishlist");
      } else {
        const data = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  }

  const checkLabel: Record<CheckState, { text: string; color: string }> = {
    idle: { text: "", color: "transparent" },
    checking: { text: "Checking...", color: "#A8A29E" },
    available: { text: "✓ Available", color: "#16A34A" },
    taken: { text: "✕ Already taken", color: "#DC2626" },
    invalid: { text: "Lowercase letters, numbers, and hyphens only. Min 3 chars.", color: "#A8A29E" },
  };

  const canSave = displayName.trim().length > 0 && checkState === "available" && !saving;

  return (
    <div style={{
      minHeight: "100vh", background: "#F7F4EF", display: "flex",
      alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        <div style={{
          width: "52px", height: "52px", background: "#1C1917", borderRadius: "14px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.4rem", marginBottom: "1.75rem", color: "#F7F4EF",
        }}>
          ✦
        </div>

        <h1 style={{
          fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "2rem",
          color: "#1C1917", fontWeight: 400, margin: "0 0 0.5rem",
        }}>
          Set up your profile
        </h1>
        <p style={{ color: "#78716C", fontSize: "0.9rem", margin: "0 0 2rem", lineHeight: 1.6 }}>
          Choose how you appear to your connections and pick your unique profile address.
        </p>

        {/* Display name */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Your name</label>
          <input
            type="text"
            placeholder="e.g. Maria Carolina"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={60}
            style={inputStyle}
          />
          <p style={{ fontSize: "0.78rem", color: "#A8A29E", margin: "0.35rem 0 0" }}>
            This is how you'll appear to your connections.
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #E5E0D8", margin: "1.5rem 0" }} />

        {/* Username */}
        <div style={{ marginBottom: "0.5rem" }}>
          <label style={labelStyle}>Username</label>

          {/* URL preview */}
          <div style={{
            background: "#FFFFFF", border: "1px solid #E5E0D8", borderRadius: "10px",
            padding: "0.6rem 1rem", marginBottom: "0.75rem",
            display: "flex", alignItems: "center",
          }}>
            <span style={{ color: "#A8A29E", fontSize: "0.875rem" }}>wishlist.app/</span>
            <span style={{ color: username ? "#1C1917" : "#D6CFC8", fontSize: "0.875rem", fontWeight: 500 }}>
              {username || "your-username"}
            </span>
          </div>

          <input
            type="text"
            placeholder="e.g. mariacarolina"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            maxLength={30}
            style={{
              ...inputStyle,
              borderColor: checkState === "available" ? "#16A34A" : checkState === "taken" ? "#DC2626" : "#E5E0D8",
            }}
            onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); }}
          />
        </div>

        <p style={{
          fontSize: "0.8rem", color: checkLabel[checkState].color,
          margin: "0 0 1.5rem", minHeight: "1.2rem",
        }}>
          {checkLabel[checkState].text}
        </p>

        {error && (
          <p style={{ color: "#DC2626", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            width: "100%", padding: "0.85rem",
            background: canSave ? "#1C1917" : "#E5E0D8",
            color: canSave ? "#F7F4EF" : "#A8A29E",
            border: "none", borderRadius: "12px", fontSize: "0.95rem",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            cursor: canSave ? "pointer" : "not-allowed", transition: "all 0.15s",
          }}
        >
          {saving ? "Saving..." : "Confirm profile"}
        </button>

        <p style={{
          fontSize: "0.78rem", color: "#A8A29E", textAlign: "center",
          marginTop: "1rem", lineHeight: 1.5,
        }}>
          You can update these in settings later.
        </p>
      </div>

      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { margin: 0; }`}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.8rem", fontWeight: 500,
  color: "#57534E", marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.7rem 1rem", background: "#FFFFFF",
  border: "1px solid #E5E0D8", borderRadius: "12px", fontSize: "0.9rem",
  color: "#1C1917", fontFamily: "'DM Sans', sans-serif", outline: "none",
  boxSizing: "border-box", transition: "border-color 0.15s",
};