import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "Priya Mehta", password: "password123" });
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const demoUsers = [
    "Priya Mehta",
    "Rohan Yadav",
    "Ananya Verma",
    "Neha Singh",
    "Vikram Iyer"
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "User name is required";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required";
    }

    setValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      const user = await login(form.name, form.password);
      navigate(`/${user.role}`);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <div className="login-orb login-orb-three" />

      <div className="login-shell card">
        <div className="login-showcase">
          <div className="login-illustration-panel">
            <div className="login-artboard">
              <div className="art-message art-message-left">Track</div>
              <div className="art-message art-message-right">Deliver</div>
              <div className="art-character art-wordmark">
                <span>Delivery</span>
                <span>Cart</span>
              </div>
              <div className="art-grass art-grass-left" />
              <div className="art-grass art-grass-right" />
            </div>

            <div className="login-copy">
              <p className="eyebrow">Turn your ideas into reality.</p>
              <h1>Smart delivery workflows for every team.</h1>
              <p className="muted">
                Route planning, proof of delivery, customer support, and analytics in one place.
              </p>
            </div>
          </div>

          <form className="login-card login-form-card" onSubmit={handleSubmit}>
            <div className="login-logo">
              <span className="logo-star">+</span>
              <strong>Delivery Cart</strong>
            </div>
            <div className="login-form-copy">
              <h2>Login to your Account</h2>
            </div>

            <label>
              User name
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Enter your full name"
              />
              {validationErrors.name ? <span className="error-text">{validationErrors.name}</span> : null}
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter your password"
              />
              {validationErrors.password ? (
                <span className="error-text">{validationErrors.password}</span>
              ) : null}
            </label>

            {error ? <p className="error-text">{error}</p> : null}

            <div className="auth-action-stack">
              <button type="submit">Login</button>

              <Link className="register-cta" to="/register">
                <span className="register-cta-copy">
                  <span className="register-cta-title">Register new customer</span>
                  <span className="register-cta-subtitle">
                    Create an account to open the customer dashboard
                  </span>
                </span>
                <span className="register-cta-badge" aria-hidden="true">
                  New
                </span>
              </Link>
            </div>

            <div className="login-demo-strip">
              {demoUsers.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="ghost-button login-chip"
                  onClick={() => setForm((current) => ({ ...current, name, password: "password123" }))}
                >
                  {name}
                </button>
              ))}
            </div>

            <p className="login-footnote">
              Password for all demo accounts: <strong>password123</strong>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
