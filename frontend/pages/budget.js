import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";
import { getBudget, updateBudget, getSummary } from "../lib/api";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function BudgetPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [budget, setBudget] = useState(null);
  const [summary, setSummary] = useState(null);
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const now = new Date();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getBudget(),
      getSummary({ month: now.getMonth() + 1, year: now.getFullYear() }),
    ]).then(([b, s]) => {
      setBudget(b.data);
      setLimit(b.data.monthly_limit);
      setSummary(s.data);
    });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!limit || parseFloat(limit) <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const { data } = await updateBudget({ monthly_limit: parseFloat(limit) });
      setBudget(data);
      toast.success("Budget updated!");
    } catch {
      toast.error("Failed to update budget");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  const spent = summary?.total || 0;
  const currentLimit = budget?.monthly_limit || 2000;
  const pct = Math.min((spent / currentLimit) * 100, 100);
  const pctColor = pct > 90 ? "var(--danger)" : pct > 70 ? "var(--warning)" : "var(--accent)";
  const remaining = Math.max(currentLimit - spent, 0);
  const dailyRemaining = remaining / (new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1);

  return (
    <Layout>
      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ margin: "0 0 0.25rem", fontSize: "2rem" }}>Budget</h2>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Set and track your monthly spending limit</p>
        </div>

        {/* Current status */}
        {summary && (
          <div className="card stagger" style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontFamily: "DM Sans", fontWeight: 600 }}>
              This Month's Status
            </h3>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Spent: <strong style={{ color: pctColor }}>${spent.toFixed(2)}</strong>
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Budget: <strong>${currentLimit.toFixed(0)}</strong>
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 14, background: "var(--bg-elevated)", borderRadius: 100, overflow: "hidden", marginBottom: "0.75rem" }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                background: pct > 90
                  ? "linear-gradient(90deg, var(--warning), var(--danger))"
                  : pct > 70
                  ? "linear-gradient(90deg, var(--accent), var(--warning))"
                  : "var(--accent)",
                borderRadius: 100,
                transition: "width 0.8s ease",
              }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1.5rem" }}>
              {[
                { label: "Spent", value: `$${spent.toFixed(2)}`, color: pctColor },
                { label: "Remaining", value: `$${remaining.toFixed(2)}`, color: "var(--text-primary)" },
                { label: "Daily budget left", value: `$${dailyRemaining.toFixed(2)}`, color: "var(--text-secondary)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: "1.25rem", fontFamily: "DM Serif Display", color }}>{value}</p>
                </div>
              ))}
            </div>

            {pct >= 100 && (
              <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "var(--danger-dim)", border: "1px solid rgba(240,97,97,0.2)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--danger)" }}>
                  🚨 You've exceeded your budget for this month. Consider reviewing your expenses.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Edit budget */}
        <div className="card">
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontFamily: "DM Sans", fontWeight: 600 }}>
            Update Monthly Budget
          </h3>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">Monthly limit ($)</label>
              <input
                type="number"
                min="1"
                step="50"
                className="input"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="2000"
                style={{ fontSize: "1.5rem", padding: "0.75rem 1rem" }}
              />
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                This sets how much you aim to spend per calendar month.
              </p>
            </div>

            {/* Quick presets */}
            <div>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Quick presets
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[500, 1000, 1500, 2000, 3000, 5000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setLimit(v)}
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.4rem 0.75rem",
                      borderColor: parseFloat(limit) === v ? "var(--accent)" : undefined,
                      color: parseFloat(limit) === v ? "var(--accent)" : undefined,
                    }}
                  >
                    ${v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: "flex-start", padding: "0.75rem 2rem" }}>
              {saving ? "Saving..." : "Save Budget"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
