import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.username, form.password);
      } else {
        await api.register({ username: form.username, email: form.email, password: form.password });
        await login(form.username, form.password);
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Library</h1>
      <div className="tab-bar">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
      </div>
      <form onSubmit={handleSubmit}>
        <label>Username
          <input value={form.username} onChange={set("username")} required autoFocus />
        </label>
        {mode === "register" && (
          <label>Email
            <input type="email" value={form.email} onChange={set("email")} required />
          </label>
        )}
        <label>Password
          <input type="password" value={form.password} onChange={set("password")} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "…" : mode === "login" ? "Login" : "Register"}
        </button>
      </form>
    </div>
  );
}
