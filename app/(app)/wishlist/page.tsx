"use client";


import ItemImage from "@/components/ItemImage";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { WishlistItem } from "@/types";

type ItemForm = {
  url: string;
  name: string;
  brand: string;
  price_display: string;
  image_url: string;
  product_url: string;
  note: string;
};

const empty: ItemForm = {
  url: "",
  name: "",
  brand: "",
  price_display: "",
  image_url: "",
  product_url: "",
  note: "",
};

export default function WishlistPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ItemForm>(empty);
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [resetingId, setResetingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // @ts-ignore
  const username = session?.user?.username ?? "";
  // @ts-ignore
  const shareToken = session?.user?.share_token ?? "";
  const shareUrl = typeof window !== "undefined" && shareToken ? `${window.location.origin}/share/${shareToken}` : "";

  useEffect(() => {
    if (username) fetchItems();
  }, [username]);

  async function fetchItems() {
    setLoading(true);
    const res = await fetch(`/api/wishlist?username=${username}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  async function handleUrlScrape() {
    if (!form.url.trim()) return;
    setScraping(true);
    setError("");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url }),
      });
      const data = await res.json();
      setForm(f => ({
        ...f,
        name: data.name ?? f.name,
        brand: data.brand ?? f.brand,
        price_display: data.price_display ?? f.price_display,
        image_url: data.image_url ?? f.image_url,
        product_url: form.url,
        note: data.note ?? f.note,
      }));
    } catch {
      setError("Couldn't fetch that URL. Fill in the details manually.");
    }
    setScraping(false);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Item name is required."); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        brand: form.brand || null,
        price_display: form.price_display || null,
        image_url: form.image_url || null,
        product_url: form.product_url || null,
        note: form.note || null,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems(prev => [...prev, item]);
      setForm(empty);
      setShowForm(false);
    } else {
      setError("Failed to save. Please try again.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    setDeletingId(null);
  }

  async function handleResetClaim(id: string) {
    setResetingId(id);
    const res = await fetch(`/api/wishlist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimed: false }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    }
    setResetingId(null);
  }

  async function copyProfileUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const claimed = items.filter(i => i.claimed);
  const unclaimed = items.filter(i => !i.claimed);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "2.5rem",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <div>
          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "2rem",
            color: "#1C1917",
            fontWeight: 400,
            margin: "0 0 0.4rem",
          }}>
            My Wishlist
          </h1>
          <p style={{ color: "#78716C", fontSize: "0.9rem", margin: 0 }}>
            {items.length === 0
              ? "Add items you'd love to receive."
              : `${items.length} item${items.length === 1 ? "" : "s"} on your list`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={copyProfileUrl}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.55rem 1rem", background: "transparent",
              border: "1px solid #E5E0D8", borderRadius: "10px",
              fontSize: "0.875rem", color: copied ? "#16A34A" : "#78716C",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {copied ? "✓ Copied!" : "⇗ Share wishlist"}
          </button>
          <button
            onClick={() => { setShowForm(true); setError(""); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.55rem 1.1rem", background: "#1C1917",
              border: "none", borderRadius: "10px", fontSize: "0.875rem",
              color: "#F7F4EF", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            }}
          >
            + Add item
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{
          background: "#FFFFFF", border: "1px solid #E5E0D8",
          borderRadius: "16px", padding: "1.75rem", marginBottom: "2rem",
        }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "1.25rem", color: "#1C1917", fontWeight: 400, margin: "0 0 1.5rem",
          }}>
            Add a new item
          </h2>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={labelStyle}>Paste a product URL</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="url" placeholder="https://example.com/product"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") handleUrlScrape(); }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={handleUrlScrape}
                disabled={scraping || !form.url.trim()}
                style={{
                  padding: "0 1.1rem", background: scraping ? "#E5E0D8" : "#1C1917",
                  color: "#F7F4EF", border: "none", borderRadius: "10px",
                  fontSize: "0.875rem", fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500, cursor: scraping ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap", minWidth: "80px",
                }}
              >
                {scraping ? "Fetching..." : "Auto-fill"}
              </button>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#A8A29E", margin: "0.4rem 0 0" }}>
              We'll try to fill in the details automatically.
            </p>
          </div>

          <div style={{ borderTop: "1px solid #F0EBE3", margin: "1.25rem 0" }} />

          {form.image_url && (
            <div style={{ marginBottom: "1.25rem" }}>
              <img
                src={form.image_url} alt="Product"
                style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "10px", border: "1px solid #E5E0D8" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={labelStyle}>Item name *</label>
              <input type="text" placeholder="e.g. Leather tote bag" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Brand / retailer</label>
              <input type="text" placeholder="e.g. Everlane" value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Price</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#78716C", fontSize: "0.875rem", pointerEvents: "none" }}>$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.price_display.replace(/^\$/, "")}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setForm(f => ({ ...f, price_display: val ? `$${val}` : "" }));
                  }}
                  style={{ ...inputStyle, paddingLeft: "1.75rem" }}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Product link</label>
              <input type="url" placeholder="https://..." value={form.product_url}
                onChange={e => setForm(f => ({ ...f, product_url: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={labelStyle}>
              Note <span style={{ color: "#A8A29E" }}>(optional — size, colour, etc.)</span>
            </label>
            <input type="text" placeholder="e.g. Size M, forest green" value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              maxLength={200} style={inputStyle} />
            <p style={{ fontSize: "0.75rem", color: "#A8A29E", margin: "0.3rem 0 0", textAlign: "right" }}>
              {form.note.length}/200
            </p>
          </div>

          {error && <p style={{ color: "#DC2626", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setShowForm(false); setForm(empty); setError(""); }}
              style={{
                padding: "0.6rem 1.1rem", background: "transparent",
                border: "1px solid #E5E0D8", borderRadius: "10px",
                fontSize: "0.875rem", color: "#78716C", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave} disabled={saving}
              style={{
                padding: "0.6rem 1.25rem", background: saving ? "#A8A29E" : "#1C1917",
                border: "none", borderRadius: "10px", fontSize: "0.875rem",
                color: "#F7F4EF", cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              }}
            >
              {saving ? "Saving..." : "Save item"}
            </button>
          </div>
        </div>
      )}

      {!loading && items.length === 0 && !showForm && (
        <div style={{
          textAlign: "center", padding: "5rem 2rem", background: "#FFFFFF",
          borderRadius: "16px", border: "1px dashed #D6CFC8",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎁</div>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.5rem",
            fontWeight: 400, color: "#1C1917", margin: "0 0 0.5rem",
          }}>
            Your wishlist is empty
          </h2>
          <p style={{ color: "#78716C", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
            Add items you'd love to receive and share your list with friends.
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "0.65rem 1.5rem", background: "#1C1917", border: "none",
              borderRadius: "10px", fontSize: "0.875rem", color: "#F7F4EF",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            }}
          >
            Add your first item
          </button>
        </div>
      )}

      {loading && (
        <div style={{ color: "#A8A29E", fontSize: "0.9rem", padding: "2rem 0" }}>
          Loading your wishlist...
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[...unclaimed, ...claimed].map(item => (
            <div key={item.id} style={{
              background: "#FFFFFF", border: "1px solid #E5E0D8", borderRadius: "14px",
              padding: "1.1rem 1.25rem", display: "flex", alignItems: "center",
              gap: "1rem", 
            }}>
              <ItemImage src={item.image_url} alt={item.name} size={56} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 500, color: "#1C1917", wordBreak: "break-word" }}>
                    {item.name}
                  </span>

                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                  {item.brand && <span style={{ fontSize: "0.8rem", color: "#A8A29E" }}>{item.brand}</span>}
                  {item.price_display && <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#78716C" }}>{item.price_display}</span>}
                  {item.note && <span style={{ fontSize: "0.8rem", color: "#A8A29E", fontStyle: "italic" }}>{item.note}</span>}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                {item.product_url && (
                  <a href={item.product_url} target="_blank" rel="noopener noreferrer"
                    style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #E5E0D8", color: "#78716C", textDecoration: "none" }}>
                    ↗
                  </a>
                )}

                <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                  style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #E5E0D8", background: "transparent", color: deletingId === item.id ? "#A8A29E" : "#EF4444", cursor: deletingId === item.id ? "not-allowed" : "pointer" }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.8rem", fontWeight: 500,
  color: "#57534E", marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.6rem 0.875rem", background: "#FAFAF9",
  border: "1px solid #E5E0D8", borderRadius: "10px", fontSize: "0.875rem",
  color: "#1C1917", fontFamily: "'DM Sans', sans-serif", outline: "none",
  boxSizing: "border-box",
};





