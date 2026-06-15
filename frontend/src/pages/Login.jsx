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
    <div className="sx-login">
      <div className="sx-login__art">
        <div className="sx-login__brand">
          <span>Library</span>
        </div>
        <div className="sx-login__tag">
          <h2>Your library,<br />always open.</h2>
          <p>Search, borrow, and reserve from a catalogue of thousands of books. Staff can manage the entire collection from one place.</p>
        </div>
        <div className="sx-login__stats">
          <div className="sx-login__stat">
            <div className="n">270k+</div>
            <div className="l">Books catalogued</div>
          </div>
          <div className="sx-login__stat">
            <div className="n">14d</div>
            <div className="l">Loan period</div>
          </div>
          <div className="sx-login__stat">
            <div className="n">3</div>
            <div className="l">Access roles</div>
          </div>
        </div>
      </div>

      <div className="sx-login__form">
        <div className="sx-login__box">
          <h3>{mode === "login" ? "Sign in" : "Create account"}</h3>
          <p className="sub">{mode === "login" ? "Welcome back." : "Join the library system."}</p>

          <div className="tab-bar" style={{ marginBottom: 0 }}>
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
          </div>

          <form onSubmit={handleSubmit} style={{ gap: 14 }}>
            <label>Username
              <input value={form.username} onChange={set("username")} required autoFocus placeholder="your_username" />
            </label>
            {mode === "register" && (
              <label>Email
                <input type="email" value={form.email} onChange={set("email")} required placeholder="you@example.com" />
              </label>
            )}
            <label>Password
              <input type="password" value={form.password} onChange={set("password")} required placeholder="••••••••" />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: 4 }}>
              {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
