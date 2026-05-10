"use client";


import ItemImage from "@/components/ItemImage";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { WishlistItem } from "@/types";

type ProfileUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type ViewState = "loading" | "own" | "connected" | "pending_sent" | "pending_received" | "not_connected" | "not_found";

export default function ProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  // @ts-ignore
  const currentUsername = session?.user?.username ?? "";
  // @ts-ignore
  const currentUserId = session?.user?.id ?? "";

  useEffect(() => {
    if (session && username) init();
  }, [session, username]);

  async function init() {
    // Redirect to own wishlist page if viewing own profile
    if (username === currentUsername) {
      setViewState("own");
      await loadWishlist();
      return;
    }

    // Check connection status
    const res = await fetch("/api/connections");
    if (!res.ok) return;
    const connections = await res.json();

    // Find connection with this user
    const conn = connections.find((c: any) =>
      c.user.username === username
    );

    // Get profile user info from search
    const searchRes = await fetch(`/api/users/search?q=${encodeURIComponent(username)}`);
    const searchData = searchRes.ok ? await searchRes.json() : [];
    const found = searchData.find((u: any) => u.username === username);

    if (!found) { setViewState("not_found"); return; }
    setProfileUser(found);

    if (!conn) {
      setViewState("not_connected");
      return;
    }

    setConnectionId(conn.id);

    if (conn.status === "connected") {
      setViewState("connected");
      await loadWishlist();
    } else if (conn.requester_id === currentUserId) {
      setViewState("pending_sent");
    } else {
      setViewState("pending_received");
    }
  }

  async function loadWishlist() {
    const res = await fetch(`/api/wishlist?username=${username}`);
    if (res.ok) setItems(await res.json());
  }

  async function sendRequest() {
    if (!profileUser) return;
    setActioning(true);
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient_id: profileUser.id }),
    });
    if (res.ok) setViewState("pending_sent");
    setActioning(false);
  }

  async function acceptRequest() {
    if (!connectionId) return;
    setActioning(true);
    const res = await fetch(`/api/connections/${connectionId}`, { method: "PATCH" });
    if (res.ok) {
      setViewState("connected");
      await loadWishlist();
    }
    setActioning(false);
  }

  async function claimItem(itemId: string) {
    setClaimingId(itemId);
    const res = await fetch(`/api/wishlist/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimed: true }),
    });
    if (res.ok) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, claimed: true } : i));
      setClaimedIds(prev => new Set([...prev, itemId]));
    }
    setClaimingId(null);
  }

  const displayName = profileUser?.display_name ?? profileUser?.username ?? username;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = profileUser?.avatar_url;
  // Owner sees all items as available — hide claimed status to preserve surprise
  const displayItems = viewState === "own" ? items.map(i => ({ ...i, claimed: false })) : items;
  const unclaimed = displayItems.filter(i => !i.claimed);
  const claimed = displayItems.filter(i => i.claimed);

  // ── Loading ──
  if (viewState === "loading") {
    return (
      <div style={{ color: "#A8A29E", fontSize: "0.9rem", fontFamily: "'DM Sans', sans-serif" }}>
        Loading...
      </div>
    );
  }

  // ── Not found ──
  if (viewState === "not_found") {
    return (
      <div style={{ textAlign: "center", padding: "5rem 2rem", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 400, color: "#1C1917", margin: "0 0 0.5rem" }}>
          User not found
        </h2>
        <p style={{ color: "#78716C", fontSize: "0.9rem" }}>
          No account exists for @{username}.
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: "640px", margin: "0 auto" }}>

      {/* Profile header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1.25rem",
        marginBottom: "2.5rem",
        paddingBottom: "2rem",
        borderBottom: "1px solid #E5E0D8",
      }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName}
            style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            onError={() => {}} />
        ) : (
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "#1C1917", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "1.5rem", fontWeight: 500,
            color: "#F7F4EF", flexShrink: 0,
          }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "1.75rem", color: "#1C1917", fontWeight: 400, margin: "0 0 0.2rem",
          }}>
            {viewState === "own" ? "My Wishlist" : `${displayName}'s Wishlist`}
          </h1>
          <p style={{ color: "#A8A29E", fontSize: "0.875rem", margin: 0 }}>
            @{username}
          </p>
        </div>

        {/* Connection action for non-connected states */}
        {viewState === "not_connected" && (
          <button onClick={sendRequest} disabled={actioning}
            style={{
              padding: "0.55rem 1.1rem", background: "#1C1917", color: "#F7F4EF",
              border: "none", borderRadius: "10px", fontSize: "0.875rem",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              cursor: actioning ? "not-allowed" : "pointer", flexShrink: 0,
            }}>
            {actioning ? "..." : "Connect"}
          </button>
        )}
        {viewState === "pending_sent" && (
          <span style={{
            fontSize: "0.8rem", color: "#A8A29E", background: "#F7F4EF",
            border: "1px solid #E5E0D8", borderRadius: "10px",
            padding: "0.5rem 0.9rem", flexShrink: 0,
          }}>
            Request sent
          </span>
        )}
        {viewState === "pending_received" && (
          <button onClick={acceptRequest} disabled={actioning}
            style={{
              padding: "0.55rem 1.1rem", background: "#1C1917", color: "#F7F4EF",
              border: "none", borderRadius: "10px", fontSize: "0.875rem",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              cursor: actioning ? "not-allowed" : "pointer", flexShrink: 0,
            }}>
            {actioning ? "..." : "Accept request"}
          </button>
        )}
      </div>

      {/* Not connected — gated state */}
      {(viewState === "not_connected" || viewState === "pending_sent" || viewState === "pending_received") && (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "#FFFFFF", borderRadius: "16px",
          border: "1px dashed #D6CFC8",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔒</div>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "1.35rem", fontWeight: 400, color: "#1C1917", margin: "0 0 0.5rem",
          }}>
            {viewState === "pending_sent"
              ? "Request sent!"
              : viewState === "pending_received"
              ? `${displayName} wants to connect`
              : "Connect to see this wishlist"}
          </h2>
          <p style={{ color: "#78716C", fontSize: "0.875rem", margin: 0, lineHeight: 1.6 }}>
            {viewState === "pending_sent"
              ? `Once ${displayName} accepts, you'll be able to see their wishlist.`
              : viewState === "pending_received"
              ? "Accept their request to see each other's wishlists."
              : `Send ${displayName} a connection request to view their wishlist.`}
          </p>
        </div>
      )}

      {/* Wishlist — own or connected */}
      {(viewState === "own" || viewState === "connected") && (
        <>
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
                {viewState === "own" ? "Your wishlist is empty" : `${displayName} hasn't added anything yet`}
              </p>
              <p style={{ color: "#78716C", fontSize: "0.875rem", margin: 0 }}>
                {viewState === "own" ? "Head to My Wishlist to add items." : "Check back later!"}
              </p>
            </div>
          )}

          {items.length > 0 && (
            <>
              {/* Stats */}
              <div style={{
                display: "flex", gap: "1rem", marginBottom: "1.5rem",
              }}>
                {[
                  { label: "Available", value: unclaimed.length, color: "#1C1917" },
                  { label: "Claimed", value: claimed.length, color: "#A8A29E" },
                ].map(stat => (
                  <div key={stat.label} style={{
                    flex: 1, background: "#FFFFFF", border: "1px solid #E5E0D8",
                    borderRadius: "12px", padding: "1rem 1.25rem",
                  }}>
                    <p style={{ fontSize: "1.5rem", fontWeight: 500, color: stat.color, margin: "0 0 0.2rem" }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "#A8A29E", margin: 0 }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[...unclaimed, ...claimed].map(item => {
                  const justClaimed = claimedIds.has(item.id);
                  return (
                    <div key={item.id} style={{
                      background: "#FFFFFF", border: "1px solid #E5E0D8",
                      borderRadius: "14px", padding: "1.1rem 1.25rem",
                      display: "flex", alignItems: "center", gap: "1rem",
                      opacity: item.claimed ? 0.55 : 1, transition: "opacity 0.2s",
                    }}>
                      <ItemImage src={item.image_url} alt={item.name} size={56} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.95rem", fontWeight: 500, color: "#1C1917" }}>
                            {item.name}
                          </span>
                          {item.claimed && (
                            <span style={{
                              fontSize: "0.7rem", fontWeight: 500,
                              background: (justClaimed || (item as any).claimed_by === currentUserId) ? "#EFF6FF" : "#FEF9C3",
                              color: (justClaimed || (item as any).claimed_by === currentUserId) ? "#1D4ED8" : "#854D0E",
                              padding: "2px 8px", borderRadius: "100px",
                            }}>
                              {(justClaimed || (item as any).claimed_by === currentUserId) ? "✓ You've claimed this" : "Someone's getting this"}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                          {item.brand && <span style={{ fontSize: "0.8rem", color: "#A8A29E" }}>{item.brand}</span>}
                          {item.price_display && <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#78716C" }}>{item.price_display}</span>}
                          {item.note && <span style={{ fontSize: "0.8rem", color: "#A8A29E", fontStyle: "italic" }}>{item.note}</span>}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                        {item.product_url && (
                          <a href={item.product_url} target="_blank" rel="noopener noreferrer"
                            style={{
                              width: "32px", height: "32px", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              borderRadius: "8px", border: "1px solid #E5E0D8",
                              color: "#78716C", textDecoration: "none", fontSize: "0.9rem",
                            }}>↗</a>
                        )}
                        {/* Only show claim button for connected gift-givers, not own profile */}
                        {viewState === "connected" && !item.claimed && (
                          <button
                            onClick={() => claimItem(item.id)}
                            disabled={claimingId === item.id}
                            style={{
                              padding: "0.35rem 0.85rem", background: "#1C1917",
                              color: "#F7F4EF", border: "none", borderRadius: "8px",
                              fontSize: "0.78rem", fontFamily: "'DM Sans', sans-serif",
                              fontWeight: 500, cursor: claimingId === item.id ? "not-allowed" : "pointer",
                            }}>
                            {claimingId === item.id ? "..." : "I'll get this"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    <style>{`
        .profile-header {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 2.5rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #E5E0D8;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .profile-header { gap: 0.75rem; }
        }
      `}</style>
    </div>
  );
}



