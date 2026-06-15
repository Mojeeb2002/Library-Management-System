import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Books from "./pages/Books";
import MyHistory from "./pages/MyHistory";
import MyReservations from "./pages/MyReservations";
import Reports from "./pages/Reports";
import Users from "./pages/Users";

const PAGE_TITLES = {
  "/":             "Catalog",
  "/history":      "My History",
  "/reservations": "Reservations",
  "/reports":      "Reports",
  "/users":        "Members",
};

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppShell({ children }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "Library";
  return (
    <div className="sx-app">
      <Navbar />
      <div className="sx-main">
        <header className="sx-topbar">
          <h1 className="sx-topbar__title">{title}</h1>
        </header>
        <div className="sx-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><AppShell><Books /></AppShell></PrivateRoute>} />
      <Route path="/history" element={<PrivateRoute><AppShell><MyHistory /></AppShell></PrivateRoute>} />
      <Route path="/reservations" element={<PrivateRoute><AppShell><MyReservations /></AppShell></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute roles={["librarian","admin"]}><AppShell><Reports /></AppShell></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute roles={["admin"]}><AppShell><Users /></AppShell></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
