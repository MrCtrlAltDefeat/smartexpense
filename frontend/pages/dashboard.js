import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";
import { getSummary, getExpenses } from "../lib/api";
import { useRouter } from "next/router";
import { format } from "date-fns";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const CATEGORY_COLORS = {
  "Food & Drink": "#f0a961",
  "Transport": "#61b4f0",
  "Housing": "#a361f0",
  "Entertainment": "#f061a9",
  "Health": "#61f0a9",
  "Shopping": "#f0d861",
  "Utilities": "#61d4f0",
  "Other": "#8b9098",
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ flex: 1 }}>
      <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </p>
      <p style={{ margin: "0 0 0.25rem", fontSize: "2rem", fontFamily: "DM Serif Display, serif", color: accent || "var(--text-primary)", letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {sub && <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const now = new Date();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getSummary({ month: now.getMonth() + 1, year: now.getFullYear() }),
      getExpenses({ month: now.getMonth() + 1, year: now.getFullYear() }),
    ]).then(([s, e]) => {
      setSummary(s.data);
      setRecentExpenses(e.data.slice(0, 5));
    });
  }, [user]);

  if (loading || !user) return null;

  const pct = summary ? Math.min((summary.total / summary.monthly_limit) * 100, 100) : 0;
  const pctColor = pct > 90 ? "var(--danger)" : pct > 70 ? "var(--warning)" : "var(--accent)";

  const pieData = summary
    ? Object.entries(summary.by_category).map(([name, value]) => ({ name, value }))
    : [];

  const barData = summary
    ? Object.entries(summary.by_category)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name: name.split(" ")[0], value }))
    : [];

  return (
    <Layout>
      <div style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ margin: "0 0 0.25rem", fontSize: "2rem" }}>
            Good {now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"},{" "}
            <em style={{ color: "var(--accent)" }}>{user.name.split(" ")[0]}</em>
          </h2>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            {format(now, "EEEE, MMMM do yyyy")}
          </p>
        </div>

        {/* Stat cards */}
        <div className="stagger" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <StatCard
            label="Spent this month"
            value={`$${(summary?.total || 0).toFixed(2)}`}
            sub={`of $${(summary?.monthly_limit || 0).toFixed(0)} budget`}
            accent={pctColor}
          />
          <StatCard
            label="Remaining"
            value={`$${Math.max((summary?.monthly_limit || 0) - (summary?.total || 0), 0).toFixed(2)}`}
            sub="until end of month"
          />
          <StatCard
            label="Transactions"
            value={summary?.expense_count || 0}
            sub="this month"
          />
          <StatCard
            label="Top category"
            value={pieData.sort((a,b) => b.value - a.value)[0]?.name || "—"}
            sub={pieData[0] ? `$${pieData[0].value.toFixed(2)}` : "No data yet"}
          />
        </div>

        {/* Budget bar */}
        {summary && (
          <div className="card stagger" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>Monthly Budget Progress</span>
              <span style={{ fontSize: "0.85rem", color: pctColor, fontWeight: 600 }}>{pct.toFixed(1)}%</span>
            </div>
            <div style={{
              height: 10, background: "var(--bg-elevated)",
              borderRadius: 100, overflow: "hidden",
            }}>
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
            {pct > 90 && (
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--danger)" }}>
                ⚠ You've used {pct.toFixed(0)}% of your budget. Consider slowing down spending.
              </p>
            )}
          </div>
        )}

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* Pie chart */}
          <div className="card">
            <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}>
              Spending by Category
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#8b9098"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
                    labelStyle={{ color: "var(--text-primary)" }}
                    formatter={(val) => [`$${val.toFixed(2)}`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                No expenses this month
              </div>
            )}
          </div>

          {/* Bar chart */}
          <div className="card">
            <h3 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}>
              Top Categories
            </h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
                    formatter={(val) => [`$${val.toFixed(2)}`, "Amount"]}
                    cursor={{ fill: "rgba(200,240,97,0.05)" }}
                  />
                  <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                No expenses this month
              </div>
            )}
          </div>
        </div>

        {/* Recent expenses */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}>
              Recent Transactions
            </h3>
            <a href="/expenses" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none" }}>
              View all →
            </a>
          </div>

          {recentExpenses.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0", margin: 0 }}>
              No expenses yet this month.{" "}
              <a href="/expenses" style={{ color: "var(--accent)", textDecoration: "none" }}>Add your first one →</a>
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {recentExpenses.map((e) => (
                <div key={e.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-elevated)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: `${CATEGORY_COLORS[e.category] || "#8b9098"}18`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.85rem",
                    }}>
                      {e.category === "Food & Drink" ? "🍔" :
                       e.category === "Transport" ? "🚗" :
                       e.category === "Housing" ? "🏠" :
                       e.category === "Entertainment" ? "🎬" :
                       e.category === "Health" ? "💊" :
                       e.category === "Shopping" ? "🛍" :
                       e.category === "Utilities" ? "⚡" : "📦"}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500 }}>{e.category}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {e.note || "No note"} · {format(new Date(e.date), "MMM d")}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    −${e.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
