import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";

export default function CustomerPage() {
  const [orders, setOrders] = useState([]);
  const [tracking, setTracking] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiRequest("/orders")
      .then(setOrders)
      .catch((error) => setMessage(error.message));
  }, []);

  const raiseDispute = async (orderId) => {
    await apiRequest(`/disputes/${orderId}`, {
      method: "POST",
      body: JSON.stringify({ reason: "Package damaged at delivery" })
    });
    setMessage(`Dispute opened for order #${orderId}`);
  };

  const loadTracking = async (orderId) => {
    const data = await apiRequest(`/orders/${orderId}/track`);
    setTracking((current) => ({ ...current, [orderId]: data.timeline }));
  };

  return (
    <section>
      <div className="hero">
        <div>
          <p className="eyebrow">Customer</p>
          <h2>Track orders</h2>
        </div>
        <p className="muted">Watch the status timeline and raise a dispute when something goes wrong.</p>
      </div>
      {message ? <p className="banner">{message}</p> : null}
      <div className="list-grid">
        {orders.map((order) => (
          <div className="card" key={order.id}>
            <h3>Order #{order.id}</h3>
            <p>Status: {order.status}</p>
            <p>Rider: {order.rider_name || "Pending assignment"}</p>
            <p>ETA: {order.eta || "Not available"}</p>
            <div className="button-row">
              <button onClick={() => loadTracking(order.id)}>View timeline</button>
              <button onClick={() => raiseDispute(order.id)}>Raise dispute</button>
            </div>
            {tracking[order.id]?.length ? (
              <div className="timeline">
                {tracking[order.id].map((item) => (
                  <div key={`${order.id}-${item.id}`} className="timeline-item">
                    <strong>{item.status}</strong>
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
