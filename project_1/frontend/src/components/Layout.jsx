import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navigationByRole = {
  admin: [
    { to: "/admin", label: "Admin Dashboard" },
    { to: "/auditor", label: "Analytics" }
  ],
  rider: [{ to: "/rider", label: "Rider Dashboard" }],
  customer: [{ to: "/customer", label: "Customer Tracking" }],
  support_agent: [{ to: "/support_agent", label: "Support Dashboard" }],
  auditor: [{ to: "/auditor", label: "Audit & Analytics" }]
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const links = navigationByRole[user.role] || [];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Logistics Delivery</p>
          <h1>Control Center</h1>
          <p className="muted">
            Signed in as <strong>{user.name}</strong>
          </p>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>
        <button className="secondary-button" onClick={logout}>
          Logout
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
