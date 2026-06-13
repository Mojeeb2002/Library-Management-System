import { useState, useEffect } from "react";
import { api } from "../api";

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setReservations(await api.myReservations());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(id) {
    try {
      await api.cancelReservation(id);
      setMessage({ type: "success", text: "Reservation cancelled." });
      load();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  }

  const statusBadge = (s) => {
    if (s === "active") return <span className="badge-yellow">Active</span>;
    if (s === "fulfilled") return <span className="badge-green">Fulfilled</span>;
    return <span className="badge-grey">{s}</span>;
  };

  return (
    <div>
      <h2>My Reservations</h2>
      {message && <div className={`flash flash-${message.type}`}>{message.text}</div>}
      {loading ? <p>Loading…</p> : reservations.length === 0 ? <p>No reservations.</p> : (
        <table className="data-table">
          <thead>
            <tr><th>ISBN</th><th>Reserved On</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.isbn}</td>
                <td>{r.reservation_date}</td>
                <td>{statusBadge(r.status)}</td>
                <td>
                  {r.status === "active" && (
                    <button className="btn-sm btn-danger" onClick={() => handleCancel(r.id)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
