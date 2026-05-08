"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type RelationshipStatus = "none" | "pending_sent" | "pending_received" | "connected";

type SearchUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  relationship: RelationshipStatus;
};

type Connection = {
  id: string;
  status: "pending" | "connected";
  requester_id: string;
  recipient_id: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export default function ConnectionsPage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // @ts-ignore
  const currentUserId = session?.user?.id ?? "";

  const pending = connections.filter(c => c.status === "pending");
  const confirmed = connections.filter(c => c.status === "connected");

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    setLoadingConnections(true);
    const res = await fetch("/api/connections");
    if (res.ok) setConnections(await res.json());
    setLoadingConnections(false);
  }

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setSearchResults(await res.json());
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  async function sendRequest(recipientId: string) {
    setActioningId(recipientId);
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient_id: recipientId }),
    });
    if (res.ok) {
      setSearchResults(prev =>
        prev.map(u => u.id === recipientId ? { ...u, relationship: "pending_sent" } : u)
      );
      await fetchConnections();
    }
    setActioningId(null);
  }

  async function acceptRequest(connectionId: string) {
    setActioningId(connectionId);
    const res = await fetch(`/api/connections/${connectionId}`, { method: "PATCH" });
    if (res.ok) await fetchConnections();
    setActioningId(null);
  }

  async function declineOrRemove(connectionId: string) {
    setActioningId(connectionId);
    const res = await fetch(`/api/connections/${connectionId}`, { method: "DELETE" });
    if (res.ok) {
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      await fetchConnections();
    }
    setActioningId(null);
  }

  function Avatar({ user, size = 40 }: { user: { display_name: string | null; avatar_url: string | null; username: string }; size?: number }) {
    const initials = (user.display_name ?? user.username)
      .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    return user.avatar_url ? (
      <img src={user.avatar_url} alt={user.username}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
    ) : (
      <div style={{
        width: size, height: size, borderRadius: "50%", background: "#1C1917",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.32, fontWeight: 500, color: "#F7F4EF",
        fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
      }}>
        {initials}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: "2rem", color: "#1C1917", fontWeight: 400, margin: "0 0 0.4rem",
        }}>
          Connections
        </h1>
        <p style={{ color: "#78716C", fontSize: "0.9rem", margin: 0 }}>
          Connect with friends to see each other's wishlists.
        </p>
      </div>

      {/* Search */}
      <div style={{
        background: "#FFFFFF", border: "1px solid #E5E0D8",
        borderRadius: "16px", padding: "1.5rem", marginBottom: "2rem",
      }}>
        <label style={{
          display: "block", fontSize: "0.8rem", fontWeight: 500,
          color: "#57534E", marginBottom: "0.5rem",
        }}>
          Find someone by username
        </label>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: "0.875rem", top: "50%",
            transform: "translateY(-50%)", color: "#A8A29E", pointerEvents: "none",
          }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search by username..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: "100%", padding: "0.65rem 1rem 0.65rem 2.5rem",
              background: "#FAFAF9", border: "1px solid #E5E0D8",
              borderRadius: "10px", fontSize: "0.9rem", color: "#1C1917",
              fontFamily: "'DM Sans', sans-serif", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Search results */}
        {(searchResults.length > 0 || searching) && (
          <div style={{ marginTop: "0.75rem" }}>
            {searching && (
              <p style={{ color: "#A8A29E", fontSize: "0.85rem", padding: "0.5rem 0" }}>
                Searching...
              </p>
            )}
            {!searching && searchResults.map(user => (
              <div key={user.id} style={{
                display: "flex", alignItems: "center", gap: "0.875rem",
                padding: "0.75rem 0",
                borderTop: "1px solid #F0EBE3",
              }}>
                <Avatar user={user} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1C1917", margin: 0 }}>
                    {user.display_name ?? user.username}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "#A8A29E", margin: "1px 0 0" }}>
                    @{user.username}
                  </p>
                </div>
                {user.relationship === "none" && (
                  <button
                    onClick={() => sendRequest(user.id)}
                    disabled={actioningId === user.id}
                    style={actionBtnStyle("#1C1917", "#F7F4EF")}
                  >
                    {actioningId === user.id ? "..." : "Connect"}
                  </button>
                )}
                {user.relationship === "pending_sent" && (
                  <span style={pillStyle("#F7F4EF", "#A8A29E")}>Request sent</span>
                )}
                {user.relationship === "pending_received" && (
                  <span style={pillStyle("#FEF9C3", "#854D0E")}>Wants to connect</span>
                )}
                {user.relationship === "connected" && (
                  <span style={pillStyle("#F0FDF4", "#16A34A")}>✓ Connected</span>
                )}
              </div>
            ))}
            {!searching && searchResults.length === 0 && query.length >= 2 && (
              <p style={{ color: "#A8A29E", fontSize: "0.85rem", padding: "0.75rem 0 0" }}>
                No users found for "{query}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "1.25rem", color: "#1C1917", fontWeight: 400,
            margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            Pending requests
            <span style={{
              fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif",
              background: "#1C1917", color: "#F7F4EF",
              padding: "2px 8px", borderRadius: "100px", fontWeight: 500,
            }}>
              {pending.length}
            </span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {pending.map(c => {
              const isIncoming = c.recipient_id === currentUserId;
              return (
                <div key={c.id} style={{
                  background: "#FFFFFF", border: "1px solid #E5E0D8",
                  borderRadius: "14px", padding: "1rem 1.25rem",
                  display: "flex", alignItems: "center", gap: "0.875rem",
                }}>
                  <Avatar user={c.user} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1C1917", margin: 0 }}>
                      {c.user.display_name ?? c.user.username}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "#A8A29E", margin: "1px 0 0" }}>
                      {isIncoming ? "wants to connect with you" : "request sent"}
                    </p>
                  </div>
                  {isIncoming ? (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => acceptRequest(c.id)}
                        disabled={actioningId === c.id}
                        style={actionBtnStyle("#1C1917", "#F7F4EF")}
                      >
                        {actioningId === c.id ? "..." : "Accept"}
                      </button>
                      <button
                        onClick={() => declineOrRemove(c.id)}
                        disabled={actioningId === c.id}
                        style={actionBtnStyle("transparent", "#78716C", "#E5E0D8")}
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => declineOrRemove(c.id)}
                      disabled={actioningId === c.id}
                      style={actionBtnStyle("transparent", "#78716C", "#E5E0D8")}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmed connections */}
      <div>
        <h2 style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: "1.25rem", color: "#1C1917", fontWeight: 400, margin: "0 0 1rem",
        }}>
          My connections
          {confirmed.length > 0 && (
            <span style={{
              fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif",
              color: "#A8A29E", fontWeight: 400, marginLeft: "0.5rem",
            }}>
              {confirmed.length}
            </span>
          )}
        </h2>

        {loadingConnections && (
          <p style={{ color: "#A8A29E", fontSize: "0.9rem" }}>Loading...</p>
        )}

        {!loadingConnections && confirmed.length === 0 && (
          <div style={{
            textAlign: "center", padding: "3.5rem 2rem",
            background: "#FFFFFF", borderRadius: "16px",
            border: "1px dashed #D6CFC8",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🤝</div>
            <p style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "1.25rem", color: "#1C1917", fontWeight: 400, margin: "0 0 0.4rem",
            }}>
              No connections yet
            </p>
            <p style={{ color: "#78716C", fontSize: "0.875rem", margin: 0 }}>
              Search for friends above to get started.
            </p>
          </div>
        )}

        {!loadingConnections && confirmed.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {confirmed.map(c => (
              <div key={c.id} style={{
                background: "#FFFFFF", border: "1px solid #E5E0D8",
                borderRadius: "14px", padding: "1rem 1.25rem",
                display: "flex", alignItems: "center", gap: "0.875rem",
              }}>
                <Avatar user={c.user} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1C1917", margin: 0 }}>
                    {c.user.display_name ?? c.user.username}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "#A8A29E", margin: "1px 0 0" }}>
                    @{c.user.username}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <Link
                    href={`/${c.user.username}`}
                    style={{
                      fontSize: "0.8rem", padding: "0.35rem 0.85rem",
                      background: "transparent", border: "1px solid #E5E0D8",
                      borderRadius: "8px", color: "#57534E", textDecoration: "none",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    View wishlist
                  </Link>
                  <button
                    onClick={() => declineOrRemove(c.id)}
                    disabled={actioningId === c.id}
                    title="Remove connection"
                    style={{
                      width: "30px", height: "30px", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      background: "transparent", border: "1px solid #E5E0D8",
                      borderRadius: "8px", color: "#EF4444", cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function actionBtnStyle(bg: string, color: string, borderColor?: string): React.CSSProperties {
  return {
    padding: "0.4rem 0.9rem", background: bg, color,
    border: `1px solid ${borderColor ?? bg}`, borderRadius: "8px",
    fontSize: "0.8rem", fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  };
}

function pillStyle(bg: string, color: string): React.CSSProperties {
  return {
    fontSize: "0.75rem", fontWeight: 500, background: bg, color,
    padding: "3px 10px", borderRadius: "100px", whiteSpace: "nowrap",
    fontFamily: "'DM Sans', sans-serif",
  };
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
