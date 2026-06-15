import { useState, useEffect } from "react";
import { api } from "../api";

function Section({ title, children }) {
  return (
    <div className="report-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export default function Reports() {
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.mostBorrowed(),
      api.activeUsers(),
      api.overdue(),
      api.monthlyStats(year),
    ]).then(([mb, au, od, ms]) => {
      setMostBorrowed(mb);
      setActiveUsers(au);
      setOverdue(od);
      setMonthly(ms);
    }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>Loading reports…</p>;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div>
<Section title="Most Borrowed Books — Top 10">
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>#</th><th>ISBN</th><th>Title</th><th>Borrows</th></tr></thead>
            <tbody>
              {mostBorrowed.map((r, i) => (
                <tr key={r.isbn}>
                  <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  <td className="mono">{r.isbn}</td>
                  <td>{r.title}</td>
                  <td><span className="badge-yellow">{r.borrow_count}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Most Active Users — Top 10">
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>#</th><th>Username</th><th>Total Borrows</th></tr></thead>
            <tbody>
              {activeUsers.map((r, i) => (
                <tr key={r.user_id}>
                  <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  <td>{r.username}</td>
                  <td><span className="badge-green">{r.borrow_count}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={`Overdue Books — ${overdue.length} active`}>
        {overdue.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No overdue books.</p>
        ) : (
          <div className="table-card">
            <table className="data-table">
              <thead><tr><th>User</th><th>ISBN</th><th>Title</th><th>Due Date</th><th>Days Overdue</th></tr></thead>
              <tbody>
                {overdue.map((r) => (
                  <tr key={r.transaction_id} className="row-overdue">
                    <td>{r.username}</td>
                    <td className="mono">{r.isbn}</td>
                    <td>{r.title}</td>
                    <td>{r.due_date}</td>
                    <td><span className="badge-red">{r.days_overdue}d</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Monthly Statistics">
        <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "12px", marginBottom: "16px", textTransform: "uppercase", fontSize: "11px", letterSpacing: ".07em", color: "var(--text-muted)" }}>
          Year
          <input type="number" value={year} min="2000" max={new Date().getFullYear()}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{ width: 90, background: "rgba(247,243,233,0.08)", border: "1.5px solid rgba(247,243,233,0.15)", color: "var(--cream)", borderRadius: "var(--radius-pill)", padding: "7px 14px" }} />
        </label>
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>Month</th><th>Borrows</th><th>Returns</th></tr></thead>
            <tbody>
              {monthly.map((r) => (
                <tr key={r.month}>
                  <td>{MONTHS[r.month - 1]}</td>
                  <td>{r.borrows}</td>
                  <td>{r.returns}</td>
                </tr>
              ))}
              {monthly.length === 0 && <tr><td colSpan={3} style={{ color: "var(--text-muted)" }}>No data for {year}.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
