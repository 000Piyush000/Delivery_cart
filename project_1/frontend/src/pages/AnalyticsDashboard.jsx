import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiRequest("/analytics")
      .then(setAnalytics)
      .catch((error) => setMessage(error.message));
  }, []);

  if (message) {
    return <p className="banner">{message}</p>;
  }

  if (!analytics) {
    return <p className="muted">Loading analytics...</p>;
  }

  return (
    <section>
      <div className="hero">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2>Audit and performance snapshot</h2>
        </div>
        <p className="muted">Monitor delivery reliability, rider quality, and audit activity.</p>
      </div>

      <div className="stats-grid">
        <StatCard label="On-time delivery rate" value={`${analytics.summary.on_time_delivery_rate}%`} />
        <StatCard label="Dispute rate" value={`${analytics.summary.dispute_rate}%`} />
        <StatCard label="Recent audit events" value={analytics.auditLogs.length} />
      </div>

      <div className="two-column">
        <div className="card">
          <h3>Rider performance</h3>
          <table>
            <thead>
              <tr>
                <th>Rider</th>
                <th>Assignments</th>
                <th>Delivered</th>
                <th>On-time rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.riderPerformance.map((rider) => (
                <tr key={rider.id}>
                  <td>{rider.name}</td>
                  <td>{rider.total_assignments}</td>
                  <td>{rider.delivered_orders}</td>
                  <td>{rider.on_time_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Recent audit logs</h3>
          <div className="audit-feed">
            {analytics.auditLogs.map((log) => (
              <div key={log.id} className="audit-item">
                <strong>{log.action}</strong>
                <span>{log.user_name || "System"}</span>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
