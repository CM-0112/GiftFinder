"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import ItemImage from "@/components/ItemImage";

type ShareData = {
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  items: any[];
};

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const { data: session } = useSession();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/share?token=${token}`);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      setData(await res.json());
      setLoading(false);
    }
    load();
  }, [token]);

  // Determine if viewer is the owner
  // @ts-ignore
  const currentUserId = (session?.user as any)?.id ?? "";
  // @ts-ignore
  const currentUsername = (session?.user as any)?.username ?? "";
  const isOwner = data ? (
    (currentUserId && currentUserId === data.user.id) ||
    (currentUsername && currentUsername === data.user.username)
  ) : false;

  const displayName = data ? (data.user.display_name ?? data.user.username) : "";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const items = data?.items ?? [];
  const unclaimed = items.filter((i: any) => !i.claimed);
  const claimed = items.filter((i: any) => i.claimed);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F7F4EF",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Force hide any app nav that might bleed in */}
      <style>{`
        nav[style*="sticky"], nav[style*="position: sticky"] { display: none !important; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
      `}</style>

      {/* Top banner — only for non-logged-in visitors */}
      {!session && <div style={{
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
          Join Gifting →
        </Link>
      </div>}

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {loading && (
          <p style={{ color: "#A8A29E", fontSize: "0.9rem", textAlign: "center", padding: "4rem 0" }}>Loading...</p>
        )}

        {notFound && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p style={{ fontSize: "1.25rem", color: "#1C1917", marginBottom: "0.5rem" }}>List not found</p>
            <p style={{ color: "#78716C", fontSize: "0.875rem" }}>This share link may be invalid or expired.</p>
          </div>
        )}

        {data && (
          <>
            {/* Profile header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "1.25rem",
              marginBottom: "2rem", paddingBottom: "2rem",
              borderBottom: "1px solid #E5E0D8",
            }}>
              {data.user.avatar_url ? (
                <img src={data.user.avatar_url} alt={displayName}
                  style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  onError={() => {}} />
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
                  {isOwner
                    ? `${items.length} item${items.length === 1 ? "" : "s"}`
                    : `${unclaimed.length} available · ${claimed.length} claimed`}
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
                {[...unclaimed, ...claimed].map((item: any) => (
                  <div key={item.id} style={{
                    background: "#FFFFFF", borderRadius: "14px",
                    border: "1px solid #E5E0D8",
                    padding: "1rem 1.25rem",
                    display: "flex", alignItems: "center", gap: "1rem",
                  }}>
                    <ItemImage src={item.image_url} alt={item.name} size={56} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1C1917", margin: "0 0 0.25rem", wordBreak: "break-word" }}>
                        {item.name}
                      </p>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        {item.brand && <span style={{ fontSize: "0.78rem", color: "#A8A29E" }}>{item.brand}</span>}
                        {item.price_display && <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#78716C" }}>{item.price_display}</span>}
                        {item.note && <span style={{ fontSize: "0.78rem", color: "#A8A29E", fontStyle: "italic" }}>{item.note}</span>}
                        {/* Only show claimed badge to non-owners */}
                        {item.claimed && !isOwner && (
                          <span style={{
                            fontSize: "0.7rem", fontWeight: 500,
                            background: "#FEF9C3", color: "#854D0E",
                            padding: "2px 8px", borderRadius: "100px",
                          }}>
                            Someone's getting this
                          </span>
                        )}
                      </div>
                    </div>
                    {item.product_url && (
                      <a href={item.product_url} target="_blank" rel="noopener noreferrer"
                        style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #E5E0D8", color: "#78716C", textDecoration: "none", flexShrink: 0, WebkitAppearance: "none" as any }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 11L11 2M11 2H5M11 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bottom CTA — only show to non-owners */}
            {!isOwner && (
              <div style={{
                marginTop: "3rem", padding: "2rem",
                background: "#FFFFFF", borderRadius: "16px",
                border: "1px solid #E5E0D8", textAlign: "center",
              }}>
                <h2 style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: "1.25rem", color: "#1C1917", fontWeight: 400, margin: "0 0 0.5rem",
                }}>
                  Create your own wishlist
                </h2>
                <p style={{ color: "#78716C", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>
                  Share what you want. Gift with confidence.
                </p>
                <Link href="/login" style={{
                  display: "inline-block", padding: "0.65rem 1.5rem",
                  background: "#E8622A", color: "#FFFFFF", textDecoration: "none",
                  borderRadius: "10px", fontSize: "0.875rem", fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  Get started →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}











