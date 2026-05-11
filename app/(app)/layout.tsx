"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    // @ts-ignore
    if (status === "authenticated" && session?.user?.needsSetup) router.push("/setup");
  }, [status, session, router]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F4EF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#A8A29E", fontSize: "0.9rem" }}>
        Loading...
      </div>
    );
  }

  if (!session) return null;

  // @ts-ignore
  const username = session.user?.username ?? "";
  const avatarUrl = session.user?.image;
  const initials = (session.user?.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const navLinks = [
    { href: "/wishlist", label: "My Wishlist" },
    { href: "/connections", label: "Connections" },
    { href: "/gifts-giving", label: "Items I've Claimed" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F7F4EF" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E5E0D8" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1rem", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>

          {/* Mobile: hamburger on left */}
          <button
            className="mobile-only"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0.4rem", flexShrink: 0, lineHeight: 1 }}
            aria-label="Menu"
          >
            <div style={{ width: "20px", height: "2px", background: "#57534E", marginBottom: "5px", borderRadius: "1px" }}/>
            <div style={{ width: "20px", height: "2px", background: "#57534E", marginBottom: "5px", borderRadius: "1px" }}/>
            <div style={{ width: "20px", height: "2px", background: "#57534E", borderRadius: "1px" }}/>
          </button>

          {/* Logo */}
          <Link href="/home" style={{ textDecoration: "none", flexShrink: 0 }}>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.1rem", color: "#1C1917" }}>
              ✦ Gifting
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: "0.15rem", flex: 1, justifyContent: "center" }}>
            {navLinks.map(link => {
              const active = pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} style={{
                  textDecoration: "none", fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.875rem", fontWeight: active ? 500 : 400,
                  color: active ? "#E8622A" : "#57534E",
                  padding: "0.4rem 0.75rem", borderRadius: "8px",
                  background: active ? "#FFF0E8" : "transparent", whiteSpace: "nowrap",
                }}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Avatar / user menu */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "1px solid #E5E0D8", borderRadius: "100px", padding: "0.25rem 0.5rem 0.25rem 0.25rem", cursor: "pointer" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#1C1917", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 500, color: "#F7F4EF", fontFamily: "'DM Sans', sans-serif" }}>
                  {initials}
                </div>
              )}
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", color: "#78716C" }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {menuOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#FFFFFF", border: "1px solid #E5E0D8", borderRadius: "12px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", minWidth: "180px", overflow: "hidden", zIndex: 100 }}>
                <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #F0EBE3" }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#A8A29E", margin: 0 }}>Signed in as</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.825rem", color: "#1C1917", fontWeight: 500, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user?.email}</p>
                </div>
                <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "0.65rem 1rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "#DC2626", background: "none", border: "none", borderTop: "1px solid #F0EBE3", cursor: "pointer" }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="mobile-only" style={{ borderTop: "1px solid #E5E0D8", background: "#FFFFFF" }}>
            {navLinks.map(link => {
              const active = pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "block", padding: "0.9rem 1.25rem",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem",
                    fontWeight: active ? 500 : 400,
                    color: active ? "#1C1917" : "#57534E",
                    textDecoration: "none",
                    borderBottom: "1px solid #F5F0EB",
                    background: active ? "#FFF0E8" : "transparent",
                  }}>
                  {link.label}
                </Link>
              );
            })}
            <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/login" }); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "0.9rem 1.25rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "#DC2626", background: "none", border: "none", cursor: "pointer" }}>
              Sign out
            </button>
          </div>
        )}
      </nav>

      {/* Overlays to close menus */}
      {menuOpen && <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />}
      {mobileOpen && <div className="mobile-only" style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setMobileOpen(false)} />}

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        {children}
      </main>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        a { color: inherit; }
        .mobile-only { display: none !important; }
        .desktop-only { display: flex; }
        @media (max-width: 600px) {
          .mobile-only { display: block !important; }
          .desktop-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}

