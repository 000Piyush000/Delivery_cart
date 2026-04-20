import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterCustomerPage() {
  const navigate = useNavigate();
  const { registerCustomer } = useAuth();
  const [form, setForm] = useState({
    name: "",
    password: "",
    address: ""
  });
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name is required";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Address is required";
    }

    setValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      await registerCustomer(form);
      navigate("/customer");
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
              <div className="art-message art-message-left">Join</div>
              <div className="art-message art-message-right">Order</div>
              <div className="art-character art-wordmark">
                <span>Delivery</span>
                <span>Cart</span>
              </div>
              <div className="art-grass art-grass-left" />
              <div className="art-grass art-grass-right" />
            </div>

            <div className="login-copy">
              <p className="eyebrow">New customer registration.</p>
              <h1>Create your customer account.</h1>
              <p className="muted">
                Enter your name, password, and address to open your customer dashboard.
              </p>
            </div>
          </div>

          <form className="login-card login-form-card" onSubmit={handleSubmit}>
            <div className="login-logo">
              <span className="logo-star">+</span>
              <strong>Delivery Cart</strong>
            </div>
            <div className="login-form-copy">
              <h2>Register new customer</h2>
            </div>

            <label>
              Name
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
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Create your password"
              />
              {validationErrors.password ? (
                <span className="error-text">{validationErrors.password}</span>
              ) : null}
            </label>

            <label>
              Address
              <textarea
                rows="4"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                placeholder="Enter your address"
              />
              {validationErrors.address ? (
                <span className="error-text">{validationErrors.address}</span>
              ) : null}
            </label>

            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit">Submit</button>

            <p className="login-footnote">
              Already have an account? <Link to="/login">Back to login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
