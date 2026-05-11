"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import ItemImage from "@/components/ItemImage";

type Stats = {
  wishlistCount: number;
  claimedCount: number;
  pendingCount: number;
  confirmedCount: number;
};

export default function HomePage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // @ts-ignore
  const firstName = (session?.user?.display_name ?? session?.user?.name ?? "").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/home");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
      setLoading(false);
    }
    load();
  }, []);

  const quickActions = [
    {
      href: "/wishlist",
      icon: "🎁",
      label: "My Wishlist",
      sublabel: loading ? "..." : stats?.wishlistCount === 0 ? "Add your first item" : `${stats?.wishlistCount} item${stats?.wishlistCount === 1 ? "" : "s"} on your list`,
      cta: "View list",
      accent: "#FFF0E8",
    },
    {
      href: "/connections",
      icon: "🤝",
      label: "Connections",
      sublabel: loading ? "..." : `${stats?.confirmedCount ?? 0} connection${stats?.confirmedCount === 1 ? "" : "s"}${stats?.pendingCount ? ` · ${stats.pendingCount} pending` : ""}`,
      cta: "View connections",
      accent: "#FFF0E8",
      badge: stats?.pendingCount ?? 0,
    },
    {
      href: "/gifts-giving",
      icon: "✨",
      label: "Items I've Claimed",
      sublabel: loading ? "..." : stats?.claimedCount === 0 ? "Nothing claimed yet" : `${stats?.claimedCount} item${stats?.claimedCount === 1 ? "" : "s"} claimed`,
      note: "Only visible to you",
      cta: "View claims",
      accent: "#FFF0E8",
    },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: "900px", margin: "0 auto" }}>

      {/* Greeting */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontSize: "0.85rem", color: "#A8A29E", margin: "0 0 0.35rem", letterSpacing: "0.02em" }}>
          {greeting}
        </p>
        <h1 style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
          color: "#1C1917",
          fontWeight: 400,
          margin: "0 0 0.5rem",
        }}>
          Welcome, {firstName} 👋
        </h1>
        
      </div>

      {/* Quick action cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem",
        marginBottom: "3rem",
      }}
        className="quick-actions"
      >
        {quickActions.map(action => (
          <Link
            key={action.href}
            href={action.href}
            style={{ textDecoration: "none" }}
          >
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #E5E0D8",
              borderRadius: "16px",
              padding: "1.5rem",
              height: "100%",
              transition: "box-shadow 0.2s, transform 0.15s",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(232,98,42,0.12)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {/* Accent bg */}
              <div style={{
                position: "absolute", top: 0, right: 0,
                width: "80px", height: "80px",
                background: action.accent,
                borderRadius: "0 16px 0 80px",
                opacity: 0.6,
              }} />

              {/* Badge */}
              {action.badge ? (
                <div style={{
                  position: "absolute", top: "1rem", right: "1rem",
                  background: "#E8622A", color: "#FFFFFF",
                  borderRadius: "100px", fontSize: "0.7rem",
                  fontWeight: 500, padding: "2px 8px",
                  zIndex: 1,
                }}>
                  {action.badge}
                </div>
              ) : null}

              <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{action.icon}</div>
              <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.3rem" }}>
                {action.label}
              </p>
              <p style={{ fontSize: "1rem", fontWeight: 500, color: "#1C1917", margin: "0 0 1rem", lineHeight: 1.3 }}>
                {action.sublabel}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                <span style={{ fontSize: "0.8rem", color: "#E8622A", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  {action.cta} →
                </span>
                {(action as any).note && (
                  <span style={{ fontSize: "0.7rem", color: "#A8A29E", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    🔒 {(action as any).note}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .quick-actions { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}






