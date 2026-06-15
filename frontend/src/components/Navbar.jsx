import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/",             label: "Catalog",      roles: null },
  { to: "/history",      label: "My History",   roles: null },
  { to: "/reservations", label: "Reservations", roles: null },
  { to: "/reports",      label: "Reports",      roles: ["librarian", "admin"] },
  { to: "/users",        label: "Members",      roles: ["admin"] },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <aside className="sx-sidebar">
      <div className="sx-brand">
        <span className="sx-brand__name">Library</span>
        <span className="sx-brand__sub">{user.role}</span>
      </div>

      <nav className="sx-nav">
        {NAV.filter(n => !n.roles || n.roles.includes(user.role)).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            className={({ isActive }) => `sx-navitem${isActive ? " is-active" : ""}`}
          >
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="sx-sidebar__foot">
        <button className="sx-logout" onClick={handleLogout}>Sign out</button>
        <div className="sx-userchip">
          <span className="sx-avatar">{initials}</span>
          <div className="sx-userchip__meta">
            <span className="sx-userchip__name">{user.username}</span>
            <span className="sx-userchip__role">{user.role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
