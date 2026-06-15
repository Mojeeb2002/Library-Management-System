import { useState, useEffect } from "react";
import { api } from "../api";

const ROLES = ["student", "librarian", "admin"];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setUsers(await api.users());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(id, role) {
    try {
      await api.updateRole(id, role);
      setMessage({ type: "success", text: "Role updated." });
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
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="mono">{u.id}</td>
                  <td style={{ fontWeight: 600, color: "var(--text-strong)" }}>{u.username}</td>
                  <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ width: "auto", height: 30, fontSize: "13px" }}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
