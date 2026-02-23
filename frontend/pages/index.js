import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.replace("/dashboard");
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      background: "var(--bg)",
      textAlign: "center",
    }}>
      {/* Decorative blob */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 400,
        background: "radial-gradient(ellipse, rgba(200,240,97,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="fade-up" style={{ maxWidth: 540, position: "relative" }}>
        <div style={{
          display: "inline-block",
          background: "var(--accent-dim)",
          border: "1px solid rgba(200,240,97,0.2)",
          borderRadius: 100,
          padding: "0.35rem 1rem",
          fontSize: "0.75rem",
          color: "var(--accent)",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "1.5rem",
        }}>
          Personal Finance Tracker
        </div>

        <h1 style={{ fontSize: "3.5rem", margin: "0 0 1rem", letterSpacing: "-0.03em" }}>
          Take control of
          <br />
          <em style={{ color: "var(--accent)" }}>your money</em>
        </h1>

        <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", margin: "0 0 2.5rem", lineHeight: 1.7 }}>
          Track expenses, set budgets, and get clear visibility into where your money goes — all in one place.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link href="/register" className="btn btn-primary" style={{ padding: "0.75rem 1.75rem", fontSize: "0.95rem" }}>
            Get started free
          </Link>
          <Link href="/login" className="btn btn-ghost" style={{ padding: "0.75rem 1.75rem", fontSize: "0.95rem" }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
