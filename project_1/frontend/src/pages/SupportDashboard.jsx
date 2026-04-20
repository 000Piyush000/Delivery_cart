import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";

export default function SupportDashboard() {
  const [disputes, setDisputes] = useState([]);
  const [message, setMessage] = useState("");

  const loadDisputes = async () => {
    const data = await apiRequest("/disputes");
    setDisputes(data);
  };

  useEffect(() => {
    loadDisputes().catch((error) => setMessage(error.message));
  }, []);

  const updateDispute = async (id, status, resolution) => {
    await apiRequest(`/disputes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, resolution })
    });
    setMessage(`Dispute #${id} moved to ${status}`);
    loadDisputes();
  };

  return (
    <section>
      <div className="hero">
        <div>
          <p className="eyebrow">Support</p>
          <h2>Dispute resolution desk</h2>
        </div>
        <p className="muted">Investigate claims and record refund or replacement outcomes.</p>
      </div>
      {message ? <p className="banner">{message}</p> : null}
      <div className="list-grid">
        {disputes.map((dispute) => (
          <div className="card" key={dispute.id}>
            <h3>Dispute #{dispute.id}</h3>
            <p>Order #{dispute.order_id}</p>
            <p>Customer: {dispute.customer_name}</p>
            <p>Reason: {dispute.reason}</p>
            <p>Status: {dispute.status}</p>
            <div className="button-row">
              <button onClick={() => updateDispute(dispute.id, "investigate", "Investigating issue")}>
                Investigate
              </button>
              <button onClick={() => updateDispute(dispute.id, "resolve", "Refund approved")}>
                Resolve
              </button>
              <button onClick={() => updateDispute(dispute.id, "close", "Case closed")}>Close</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
