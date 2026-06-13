import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Books from "./pages/Books";
import MyHistory from "./pages/MyHistory";
import MyReservations from "./pages/MyReservations";
import Reports from "./pages/Reports";
import Users from "./pages/Users";

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;

  return (
    <>
      {user && <Navbar />}
      <main className="container">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={<PrivateRoute><Books /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><MyHistory /></PrivateRoute>} />
          <Route path="/reservations" element={<PrivateRoute><MyReservations /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute roles={["librarian","admin"]}><Reports /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute roles={["admin"]}><Users /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
