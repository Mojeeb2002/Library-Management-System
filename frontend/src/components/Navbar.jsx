import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">📚 Library System</span>
      <div className="navbar-links">
        <Link to="/">Books</Link>
        <Link to="/history">My History</Link>
        <Link to="/reservations">Reservations</Link>
        {(user.role === "librarian" || user.role === "admin") && (
          <Link to="/reports">Reports</Link>
        )}
        {user.role === "admin" && <Link to="/users">Users</Link>}
      </div>
      <div className="navbar-user">
        <span>{user.username} <em>({user.role})</em></span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
