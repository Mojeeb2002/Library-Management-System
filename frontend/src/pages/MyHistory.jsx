import { useState, useEffect } from "react";
import { api } from "../api";

export default function MyHistory() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setTxs(await api.myTransactions());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleReturn(isbn) {
    try {
      await api.return(isbn);
      setMessage({ type: "success", text: "Book returned!" });
      load();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  }

  return (
    <div>
{message && <div className={`flash flash-${message.type}`}>{message.text}</div>}
      {loading ? (
        <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>Loading…</p>
      ) : txs.length === 0 ? (
        <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>No transactions yet.</p>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr><th>ISBN</th><th>Borrowed</th><th>Due</th><th>Returned</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {txs.map((tx) => (
                <tr key={tx.id} className={tx.overdue ? "row-overdue" : ""}>
                  <td className="mono">{tx.isbn}</td>
                  <td>{tx.borrow_date}</td>
                  <td>{tx.due_date}</td>
                  <td>{tx.return_date || "—"}</td>
                  <td>
                    {tx.overdue
                      ? <span className="badge-red">Overdue</span>
                      : tx.status === "returned"
                        ? <span className="badge-green">Returned</span>
                        : <span className="badge-yellow">Borrowed</span>}
                  </td>
                  <td>
                    {tx.status === "borrowed" && (
                      <button className="btn-sm btn-primary" onClick={() => handleReturn(tx.isbn)}>Return</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
