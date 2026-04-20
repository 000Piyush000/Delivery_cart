import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "Alice Admin", password: "password123" });
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const user = await login(form.name, form.password);
      navigate(`/${user.role}`);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Full Stack Demo</p>
        <h1>Logistics Delivery Management</h1>
        <p className="muted">
          Sample users: Alice Admin, Raj Rider, Cathy Customer, Sam Support, Ava Auditor
        </p>
        <label>
          User name
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
