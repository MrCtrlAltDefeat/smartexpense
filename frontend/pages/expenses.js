import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";
import ExpenseModal from "../components/ExpenseModal";
import { getExpenses, deleteExpense } from "../lib/api";
import { useRouter } from "next/router";
import { format } from "date-fns";
import toast from "react-hot-toast";

const CATEGORIES = [
  "All", "Food & Drink", "Transport", "Housing", "Entertainment",
  "Health", "Shopping", "Utilities", "Other"
];

const CATEGORY_ICONS = {
  "Food & Drink": "🍔", "Transport": "🚗", "Housing": "🏠",
  "Entertainment": "🎬", "Health": "💊", "Shopping": "🛍",
  "Utilities": "⚡", "Other": "📦",
};

export default function ExpensesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading]);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    const params = {};
    if (category !== "All") params.category = category;
    if (search) params.search = search;
    const { data } = await getExpenses(params);
    setExpenses(data);
    setFetching(false);
  }, [user, category, search]);

  useEffect(() => {
    const t = setTimeout(fetchExpenses, 300);
    return () => clearTimeout(t);
  }, [fetchExpenses]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    await deleteExpense(id);
    toast.success("Expense deleted");
    fetchExpenses();
  };

  const handleEdit = (expense) => {
    setEditExpense(expense);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditExpense(null);
    fetchExpenses();
  };

  if (loading || !user) return null;

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Layout>
      <div style={{ maxWidth: 1000 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.25rem", fontSize: "2rem" }}>Expenses</h2>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              {expenses.length} transactions · ${total.toFixed(2)} total
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditExpense(null); setShowModal(true); }}>
            + Add Expense
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <input
            type="text"
            className="input"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 180 }}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.5fr 2fr 1fr auto",
            padding: "0.75rem 1.25rem",
            background: "var(--bg-elevated)",
            borderBottom: "1px solid var(--border)",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-muted)",
            fontWeight: 500,
          }}>
            <span>Category</span>
            <span>Date</span>
            <span>Note</span>
            <span style={{ textAlign: "right" }}>Amount</span>
            <span></span>
          </div>

          {fetching ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          ) : expenses.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              <p style={{ margin: "0 0 0.75rem", fontSize: "1.5rem" }}>🧾</p>
              <p style={{ margin: 0 }}>No expenses found</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
                Try adjusting your filters or{" "}
                <button onClick={() => setShowModal(true)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", padding: 0, font: "inherit" }}>
                  add a new expense
                </button>
              </p>
            </div>
          ) : (
            expenses.map((e, i) => (
              <div key={e.id} style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 2fr 1fr auto",
                padding: "0.875rem 1.25rem",
                borderBottom: i < expenses.length - 1 ? "1px solid var(--border)" : "none",
                alignItems: "center",
                transition: "background 0.1s",
              }}
              onMouseEnter={(el) => el.currentTarget.style.background = "var(--bg-elevated)"}
              onMouseLeave={(el) => el.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{ fontSize: "1rem" }}>{CATEGORY_ICONS[e.category] || "📦"}</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{e.category}</span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {format(new Date(e.date), "MMM d, yyyy")}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.note || "—"}
                </span>
                <span style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  ${e.amount.toFixed(2)}
                </span>
                <div style={{ display: "flex", gap: "0.25rem", justifyContent: "flex-end" }}>
                  <button onClick={() => handleEdit(e)} className="btn btn-ghost" style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem" }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="btn btn-danger" style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <ExpenseModal
          expense={editExpense}
          onClose={() => { setShowModal(false); setEditExpense(null); }}
          onSaved={handleSaved}
        />
      )}
    </Layout>
  );
}
