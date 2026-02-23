import { useAuth } from "../hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/expenses", label: "Expenses", icon: "≡" },
  { href: "/budget", label: "Budget", icon: "◎" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "2rem 1.25rem",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 10,
      }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.1rem", color: "var(--accent)" }}>
            SmartExpense
          </h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Personal Finance
          </p>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV.map(({ href, label, icon }) => {
            const active = router.pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 0.875rem",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: active ? 500 : 400,
                background: active ? "var(--accent-dim)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                border: active ? "1px solid rgba(200,240,97,0.15)" : "1px solid transparent",
                transition: "all 0.15s ease",
              }}>
                <span style={{ fontSize: "1rem" }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
            <p style={{ margin: "0 0 0.1rem", fontSize: "0.85rem", fontWeight: 500 }}>
              {user.name}
            </p>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {user.email}
            </p>
            <button className="btn btn-ghost" onClick={logout} style={{ width: "100%", justifyContent: "center", fontSize: "0.8rem" }}>
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: "100vh", padding: "2.5rem 2rem" }}>
        {children}
      </main>
    </div>
  );
}
