import { cloneElement, isValidElement, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navigationByRole = {
  admin: [
    { to: "/admin", label: "Dashboard", icon: "DB", end: true },
    { to: "/auditor", label: "Analytics", icon: "AN" },
    { to: "/admin/orders", label: "Orders", icon: "OR" },
    { to: "/admin/customers", label: "Customers Overview", icon: "CU" },
    { to: "/admin/admins", label: "Admins", icon: "AD" },
    { to: "/admin/delivery-agents", label: "Delivery Agents", icon: "DA" },
    { to: "/admin/hubs", label: "Hub Details", icon: "HB" },
    { to: "/admin/audit-logs", label: "Recent Audit Log", icon: "AL" }
  ],
  rider: [{ to: "/rider", label: "My Deliveries", icon: "RD" }],
  customer: [{ to: "/customer", label: "Customer Desk", icon: "CU" }],
  support_agent: [{ to: "/support_agent", label: "Support Desk", icon: "SP" }],
  auditor: [{ to: "/auditor", label: "Audit & Analytics", icon: "AU" }]
};

const headerMeta = {
  "/admin": {
    title: "Dashboard",
    subtitle: "Overview of orders, riders, and live assignments."
  },
  "/admin/orders": {
    title: "Orders",
    subtitle: "Track assigned and unassigned orders with fast date filtering."
  },
  "/admin/customers": {
    title: "Customer Overview",
    subtitle: "Review customers, inspect order detail, and place new orders."
  },
  "/admin/admins": {
    title: "Admin Access",
    subtitle: "Create additional admin accounts without affecting existing records."
  },
  "/admin/delivery-agents": {
    title: "Delivery Agents",
    subtitle: "Manage riders, capacity, availability, and order assignments."
  },
  "/admin/hubs": {
    title: "Hub Details",
    subtitle: "View all hubs and create new operational hubs."
  },
  "/admin/audit-logs": {
    title: "Recent Audit Log",
    subtitle: "Inspect the latest operational and admin activity."
  },
  "/rider": {
    title: "Delivery Agent Hub",
    subtitle: "Route execution, POD capture, and support escalation."
  },
  "/customer": {
    title: "Customer Desk",
    subtitle: "Create orders, track timelines, and reach support fast."
  },
  "/support_agent": {
    title: "Support Center",
    subtitle: "Investigate issues and coordinate recovery actions."
  },
  "/auditor": {
    title: "Analytics",
    subtitle: "Operational graphs, rider quality, and audit visibility."
  }
};

const helpContentByRole = {
  rider: {
    eyebrow: "How To Use App",
    title: "Rider workflow guide",
    intro: "Follow this flow to handle deliveries smoothly from assignment to proof of delivery.",
    steps: [
      "Check the assigned delivery list and open the order card you want to work on.",
      "Use `Mark in transit` when you have started moving toward the customer location.",
      "Use `Order delivered` only after the package has been handed over successfully.",
      "If POD is pending after delivery, upload the delivery screenshot or signature from the same card.",
      "Review customer feedback when it appears, and use `Request agent support` if you get blocked."
    ]
  },
  customer: {
    eyebrow: "How To Use App",
    title: "Customer workflow guide",
    intro: "This quick guide covers the normal order journey from creating an order to giving feedback.",
    steps: [
      "Create a new order by selecting a hub and filling the delivery details.",
      "Track active orders from your dashboard and use `View timeline` to see progress updates.",
      "Use `Raise dispute` if a specific delivered order has an issue that needs support attention.",
      "After the order is delivered, submit feedback with a rating and optional comment for the rider.",
      "Use the support section for general help when the issue is not tied to only one order."
    ]
  }
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const links = navigationByRole[user.role] || [];
  const currentHeader = headerMeta[location.pathname] || headerMeta[`/${user.role}`];
  const helpContent = helpContentByRole[user.role];
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const content = isValidElement(children)
    ? cloneElement(children, {
        searchQuery,
        selectedDate,
        onSelectedDateChange: setSelectedDate
      })
    : children;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-lockup brand-lockup-dashboard">
            <div className="brand-mark">dc</div>
            <div>
              <h1>Delivery Cart</h1>
              <p className="muted">Logistics workspace</p>
            </div>
          </div>
          <nav className="nav">
            {user.role === "admin" ? <p className="nav-section-label">Admin workspace</p> : null}
            {links.map((link) => (
              <NavLink
                key={link.to}
                end={link.end}
                to={link.to}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="nav-icon">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          {helpContent ? (
            <button className="ghost-button sidebar-help-button" type="button" onClick={() => setIsHelpOpen(true)}>
              How to use app
            </button>
          ) : null}
          <button className="secondary-button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <h2 className="topbar-title">{currentHeader.title}</h2>
            <p className="muted topbar-subtitle">{currentHeader.subtitle}</p>
          </div>
          <div className="topbar-tools">
            <label className="topbar-search">
              <span>SR</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search current page..."
              />
            </label>
            <div className="topbar-profile">
              <div className="topbar-avatar">{initials}</div>
              <div>
                <strong>{user.name}</strong>
                <span className="profile-role">{user.role.replaceAll("_", " ")}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="content">{content}</main>
      </div>

      {isHelpOpen && helpContent ? (
        <div className="modal-backdrop" onClick={() => setIsHelpOpen(false)}>
          <div className="modal-card help-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="help-modal-header">
              <div>
                <p className="section-kicker">{helpContent.eyebrow}</p>
                <h3>{helpContent.title}</h3>
                <p className="muted">{helpContent.intro}</p>
              </div>
              <button
                type="button"
                className="ghost-button modal-close"
                onClick={() => setIsHelpOpen(false)}
              >
                Cancel
              </button>
            </div>
            <div className="help-modal-steps">
              {helpContent.steps.map((step, index) => (
                <div key={step} className="help-step-card">
                  <span className="help-step-index">{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
