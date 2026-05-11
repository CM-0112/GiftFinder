"use client";

import ItemImage from "@/components/ItemImage";

import { useEffect, useState } from "react";
import Link from "next/link";

type ClaimedItem = {
  id: string;
  name: string;
  brand: string | null;
  price_display: string | null;
  image_url: string | null;
  product_url: string | null;
  note: string | null;
  claimed_at: string | null;
  owner: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export default function GiftsGivingPage() {
  const [items, setItems] = useState<ClaimedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unclaimingId, setUnclaimingId] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const res = await fetch("/api/gifts-giving");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  async function unclaim(itemId: string) {
    setUnclaimingId(itemId);
    const res = await fetch(`/api/wishlist/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimed: false }),
    });
    if (res.ok) setItems(prev => prev.filter(i => i.id !== itemId));
    setUnclaimingId(null);
  }

  // Group by owner
  const grouped = items.reduce((acc, item) => {
    const key = item.owner.username;
    if (!acc[key]) acc[key] = { owner: item.owner, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { owner: ClaimedItem["owner"]; items: ClaimedItem[] }>);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: "2rem", color: "#1C1917", fontWeight: 400, margin: "0 0 0.4rem",
        }}>
          Items I've Claimed
        </h1>
        <p style={{ color: "#78716C", fontSize: "0.9rem", margin: 0 }}>
          {items.length === 0
            ? "Items you've claimed from friends' wishlists."
            : `${items.length} item${items.length === 1 ? "" : "s"} claimed across ${Object.keys(grouped).length} ${Object.keys(grouped).length === 1 ? "person" : "people"}`}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ color: "#A8A29E", fontSize: "0.9rem" }}>Loading...</p>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "#FFFFFF", borderRadius: "16px",
          border: "1px dashed #D6CFC8",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🎁</div>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "1.35rem", fontWeight: 400, color: "#1C1917", margin: "0 0 0.5rem",
          }}>
            Nothing claimed yet
          </h2>
          <p style={{ color: "#78716C", fontSize: "0.875rem", margin: "0 0 1.5rem" }}>
            Browse your connections' wishlists and claim items to track them here.
          </p>
          <Link href="/connections" style={{
            display: "inline-block", padding: "0.65rem 1.5rem",
            background: "#1C1917", color: "#F7F4EF", textDecoration: "none",
            borderRadius: "10px", fontSize: "0.875rem", fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Browse connections
          </Link>
        </div>
      )}

      {/* Grouped by person */}
      {!loading && Object.values(grouped).map(({ owner, items: ownerItems }) => {
        const initials = (owner.display_name ?? owner.username)
          .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

        return (
          <div key={owner.username} style={{ marginBottom: "2rem" }}>

            {/* Person header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              marginBottom: "0.75rem",
            }}>
              {owner.avatar_url ? (
                <img src={owner.avatar_url} alt={owner.display_name ?? owner.username}
                  style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                  onError={() => {}} />
              ) : (
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%", background: "#1C1917",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", fontWeight: 500, color: "#F7F4EF",
                }}>
                  {initials}
                </div>
              )}
              <div>
                <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1C1917" }}>
                  {owner.display_name ?? owner.username}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#A8A29E", marginLeft: "0.4rem" }}>
                  {ownerItems.length} gift{ownerItems.length === 1 ? "" : "s"}
                </span>
              </div>
              <Link href={`/${owner.username}`} style={{
                marginLeft: "auto", fontSize: "0.78rem", color: "#78716C",
                textDecoration: "none", padding: "0.3rem 0.7rem",
                border: "1px solid #E5E0D8", borderRadius: "8px",
              }}>
                View wishlist
              </Link>
            </div>

            {/* Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {ownerItems.map(item => (
                <div key={item.id} style={{
                  background: "#FFFFFF", border: "1px solid #E5E0D8",
                  borderRadius: "14px", padding: "1rem 1.25rem",
                  display: "flex", alignItems: "center", gap: "1rem",
                }}>
                  <ItemImage src={item.image_url} alt={item.name} size={50} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1C1917", margin: 0, wordBreak: "break-word" }}>
                      {item.name}
                    </p>
                    <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                      {item.brand && <span style={{ fontSize: "0.78rem", color: "#A8A29E" }}>{item.brand}</span>}
                      {item.price_display && <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#78716C" }}>{item.price_display}</span>}
                      {item.note && <span style={{ fontSize: "0.78rem", color: "#A8A29E", fontStyle: "italic" }}>{item.note}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                    {item.product_url && (
                      <a href={item.product_url} target="_blank" rel="noopener noreferrer"
                        style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #E5E0D8", color: "#78716C", textDecoration: "none", fontSize: "0.85rem" }}>
                        ↗
                      </a>
                    )}
                    <button
                      onClick={() => unclaim(item.id)}
                      disabled={unclaimingId === item.id}
                      title="Unclaim this item"
                      style={{
                        width: "30px", height: "30px", display: "flex", alignItems: "center",
                        justifyContent: "center", borderRadius: "8px", border: "1px solid #E5E0D8",
                        background: "transparent", color: unclaimingId === item.id ? "#A8A29E" : "#EF4444",
                        cursor: unclaimingId === item.id ? "not-allowed" : "pointer", fontSize: "0.8rem",
                      }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}



