"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { WishlistItem } from "@/types";

type ShareData = {
  user: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  items: WishlistItem[];
};

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/share?token=${token}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F4EF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#A8A29E" }}>
        Loading...
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F4EF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 400, color: "#1C1917", margin: "0 0 0.5rem" }}>
          Wishlist not found
        </h2>
        <p style={{ color: "#78716C", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
          This link may have expired or been removed.
        </p>
        <Link href="/" style={{ color: "#1C1917", fontSize: "0.9rem" }}>Go to Gift Finder →</Link>
      </div>
    );
  }

  if (!data) return null;

  const { user, items } = data;
  const displayName = user.display_name ?? user.username;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const unclaimed = items.filter(i => !i.claimed);
  const claimed = items.filter(i => i.claimed);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F4EF", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Soft nudge banner */}
      <div style={{
        background: "#1C1917", color: "#F7F4EF",
        padding: "0.75rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "0.5rem",
      }}>
        <p style={{ fontSize: "0.85rem", margin: 0 }}>
          ✦ Want to create your own wishlist or claim gifts?
        </p>
        <Link href="/login" style={{
          fontSize: "0.8rem", fontWeight: 500, color: "#F7F4EF",
          background: "rgba(255,255,255,0.15)", padding: "0.3rem 0.85rem",
          borderRadius: "100px", textDecoration: "none", whiteSpace: "nowrap",
          border: "1px solid rgba(255,255,255,0.2)",
        }}>
          Join Gift Finder →
        </Link>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* Profile header */}
        <div style={{
          display: "flex", alignItems: "center", gap: "1.25rem",
          marginBottom: "2rem", paddingBottom: "2rem",
          borderBottom: "1px solid #E5E0D8",
        }}>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={displayName}
              style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%", background: "#1C1917",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.4rem", fontWeight: 500, color: "#F7F4EF", flexShrink: 0,
            }}>
              {initials}
            </div>
          )}
          <div>
            <h1 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "1.75rem", color: "#1C1917", fontWeight: 400, margin: "0 0 0.2rem",
            }}>
              {displayName}'s Wishlist
            </h1>
            <p style={{ color: "#A8A29E", fontSize: "0.875rem", margin: 0 }}>
              {unclaimed.length} available · {claimed.length} claimed
            </p>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div style={{
            textAlign: "center", padding: "4rem 2rem",
            background: "#FFFFFF", borderRadius: "16px",
            border: "1px dashed #D6CFC8",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🎁</div>
            <p style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "1.25rem", fontWeight: 400, color: "#1C1917", margin: "0 0 0.4rem",
            }}>
              Nothing here yet
            </p>
            <p style={{ color: "#78716C", fontSize: "0.875rem", margin: 0 }}>
              {displayName} hasn't added any items yet. Check back later!
            </p>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[...unclaimed, ...claimed].map(item => (
              <div key={item.id} style={{
                background: "#FFFFFF", border: "1px solid #E5E0D8",
                borderRadius: "14px", padding: "1.1rem 1.25rem",
                display: "flex", alignItems: "center", gap: "1rem",
                opacity: item.claimed ? 0.55 : 1,
              }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name}
                    style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "10px", border: "1px solid #E5E0D8", flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div style={{
                    width: "56px", height: "56px", background: "#F7F4EF",
                    borderRadius: "10px", border: "1px solid #E5E0D8", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem",
                  }}>🎁</div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 500, color: "#1C1917" }}>
                      {item.name}
                    </span>
                    {item.claimed && (
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 500,
                        background: "#FEF9C3", color: "#854D0E",
                        padding: "2px 8px", borderRadius: "100px",
                      }}>
                        Someone's getting this
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                    {item.brand && <span style={{ fontSize: "0.8rem", color: "#A8A29E" }}>{item.brand}</span>}
                    {item.price_display && <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#78716C" }}>{item.price_display}</span>}
                    {item.note && <span style={{ fontSize: "0.8rem", color: "#A8A29E", fontStyle: "italic" }}>{item.note}</span>}
                  </div>
                </div>

                {item.product_url && (
                  <a href={item.product_url} target="_blank" rel="noopener noreferrer"
                    style={{
                      width: "32px", height: "32px", display: "flex", alignItems: "center",
                      justifyContent: "center", borderRadius: "8px", border: "1px solid #E5E0D8",
                      color: "#78716C", textDecoration: "none", fontSize: "0.9rem", flexShrink: 0,
                    }}>↗</a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom nudge */}
        <div style={{
          marginTop: "3rem", textAlign: "center",
          padding: "1.5rem", background: "#FFFFFF",
          borderRadius: "14px", border: "1px solid #E5E0D8",
        }}>
          <p style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "1.1rem", color: "#1C1917", fontWeight: 400, margin: "0 0 0.75rem",
          }}>
            Create your own wishlist
          </p>
          <p style={{ color: "#78716C", fontSize: "0.85rem", margin: "0 0 1rem" }}>
            Share what you want. No more duplicate gifts.
          </p>
          <Link href="/login" style={{
            display: "inline-block", padding: "0.65rem 1.5rem",
            background: "#1C1917", color: "#F7F4EF", textDecoration: "none",
            borderRadius: "10px", fontSize: "0.875rem", fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Get started →
          </Link>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
