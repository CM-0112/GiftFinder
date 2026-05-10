export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#F7F4EF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "3rem", color: "#1C1917", fontWeight: 400, margin: "0 0 0.5rem" }}>404</h1>
        <p style={{ color: "#78716C", marginBottom: "1.5rem" }}>Page not found</p>
        <a href="/" style={{ color: "#E8622A", textDecoration: "none", fontSize: "0.9rem" }}>Go home →</a>
      </div>
    </div>
  );
}
