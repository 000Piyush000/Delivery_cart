import { useEffect, useState } from "react";
import { apiRequest, apiRequestOrFallback } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const pickupAddressByCustomer = {
  "Ananya Verma": "12 A , Ramnagar, near Railway Station",
  "Arjun Rao": "Sector 17, Greator Noida"
};

export default function CustomerPage({ searchQuery = "" }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [tracking, setTracking] = useState({});
  const [feedbackForms, setFeedbackForms] = useState({});
  const [message, setMessage] = useState("");
  const [supportTopic, setSupportTopic] = useState("Delivery delay");
  const [form, setForm] = useState({
    hubId: "",
    pickupAddress: "Delhi Central Hub, New Delhi",
    deliveryAddress: "14 Lodhi Estate, New Delhi",
    latitude: "28.6139",
    longitude: "77.2090",
    promisedAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  const loadData = async () => {
    const [ordersData, hubsData] = await Promise.all([
      apiRequestOrFallback("/orders", []),
      apiRequestOrFallback("/hubs", [])
    ]);
    setOrders(ordersData);
    setHubs(hubsData);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!hubs.length || form.hubId) {
      return;
    }

    setForm((current) => ({ ...current, hubId: String(hubs[0].id) }));
  }, [form.hubId, hubs]);

  useEffect(() => {
    const nextPickupAddress = user?.address?.trim() || pickupAddressByCustomer[user?.name];

    if (!nextPickupAddress) {
      return;
    }

    setForm((current) => {
      if (current.pickupAddress && current.pickupAddress !== "Delhi Central Hub, New Delhi") {
        return current;
      }

      return { ...current, pickupAddress: nextPickupAddress };
    });
  }, [user?.address, user?.name]);

  const createOrder = async (event) => {
    event.preventDefault();

    if (!form.hubId) {
      setMessage("Select a hub before placing the order.");
      return;
    }

    try {
      await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          hubId: Number(form.hubId),
          pickupAddress: form.pickupAddress,
          deliveryAddress: form.deliveryAddress,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          promisedAt: new Date(form.promisedAt).toISOString()
        })
      });
      setMessage("Order created successfully from your customer account.");
      await loadData();
    } catch (error) {
      setMessage("Unable to create your order right now.");
    }
  };

  const raiseDispute = async (orderId) => {
    try {
      await apiRequest(`/disputes/${orderId}`, {
        method: "POST",
        body: JSON.stringify({ reason: "Package damaged at delivery" })
      });
      setMessage(`Dispute opened for order #${orderId}`);
    } catch (error) {
      setMessage("Unable to raise a dispute right now.");
    }
  };

  const loadTracking = async (orderId) => {
    const data = await apiRequestOrFallback(`/orders/${orderId}/track`, null);
    if (!data?.timeline) {
      return;
    }

    setTracking((current) => ({ ...current, [orderId]: data.timeline }));
  };

  const updateFeedbackForm = (orderId, key, value) => {
    setFeedbackForms((current) => ({
      ...current,
      [orderId]: {
        rating: current[orderId]?.rating ?? "5",
        comment: current[orderId]?.comment ?? "",
        [key]: value
      }
    }));
  };

  const submitFeedback = async (orderId) => {
    const feedback = feedbackForms[orderId] ?? { rating: "5", comment: "" };
    try {
      await apiRequest(`/orders/${orderId}/feedback`, {
        method: "POST",
        body: JSON.stringify({
          rating: Number(feedback.rating),
          comment: feedback.comment
        })
      });
      setMessage(`Feedback submitted for order #${orderId}`);
      setFeedbackForms((current) => ({
        ...current,
        [orderId]: { rating: "5", comment: "" }
      }));
      await loadData();
    } catch (error) {
      setMessage(error.message || "Unable to submit feedback right now.");
    }
  };

  const requestSupport = () => {
    setMessage(`Customer support request noted for: ${supportTopic}`);
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      order.id,
      order.status,
      order.rider_name,
      order.eta,
      order.delivery_address
    ].some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
  });

  return (
    <section>
      <div className="hero page-hero">
        <div>
          <p className="eyebrow">Customer</p>
          <h2>Create and track orders</h2>
        </div>
        <button className="ghost-button" type="button">Self service</button>
      </div>

      {message ? <p className="banner">{message}</p> : null}

      <div className="two-column">
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">New order</p>
              <h3>Create order</h3>
            </div>
            <span className="muted">Orders are linked to your current login automatically.</span>
          </div>
          <form className="form-grid" onSubmit={createOrder}>
            <label>
              Hub
              <select
                value={form.hubId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, hubId: event.target.value }))
                }
              >
                <option value="">Select hub</option>
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pickup address
              <input
                value={form.pickupAddress}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pickupAddress: event.target.value }))
                }
              />
            </label>
            <label>
              Delivery address
              <input
                value={form.deliveryAddress}
                onChange={(event) =>
                  setForm((current) => ({ ...current, deliveryAddress: event.target.value }))
                }
              />
            </label>
            <label>
              Promised by
              <input
                type="datetime-local"
                value={form.promisedAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, promisedAt: event.target.value }))
                }
              />
            </label>
            <button type="submit">Create order</button>
          </form>
        </div>

        <div className="card support-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Customer support</p>
              <h3>Need help with an order?</h3>
            </div>
          </div>
          <p className="muted">Choose the issue type and our support desk can follow up faster.</p>
          <label>
            Support topic
            <select value={supportTopic} onChange={(event) => setSupportTopic(event.target.value)}>
              <option>Delivery delay</option>
              <option>Address correction</option>
              <option>Package damaged</option>
              <option>Payment clarification</option>
            </select>
          </label>
          <div className="support-chip-row">
            <button className="ghost-button" type="button" onClick={() => setSupportTopic("Delivery delay")}>Delay</button>
            <button className="ghost-button" type="button" onClick={() => setSupportTopic("Address correction")}>Address</button>
            <button className="ghost-button" type="button" onClick={() => setSupportTopic("Package damaged")}>Damage</button>
          </div>
          <button type="button" onClick={requestSupport}>Request support</button>
          <div className="support-note">
            <strong>Fast path</strong>
            <span>Use "Raise dispute" on a specific order when the issue belongs to one delivery.</span>
          </div>
        </div>
      </div>

      <div className="list-grid">
        {filteredOrders.map((order) => (
          <div className="card" key={order.id}>
            <h3>Order #{order.id}</h3>
            <StatusBadge status={order.status} />
            <div className="metric-stack">
              <p>Rider: {order.rider_name || "Pending assignment"}</p>
              {order.rider_name ? (
                <span className="muted rider-rating-text">
                  rated="{order.average_feedback_rating ?? "new"}"
                  {Number(order.feedback_count) > 0 ? ` from ${order.feedback_count} feedback` : ""}
                </span>
              ) : null}
            </div>
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
            {order.status === "delivered" ? (
              <div className="support-note feedback-section">
                <strong>Feedback</strong>
                {order.customer_feedback_created_at ? (
                  <span>
                    {order.customer_feedback_rating}/5 for {order.rider_name || "the assigned rider"}
                    {order.customer_feedback_comment
                      ? ` - ${order.customer_feedback_comment}`
                      : ""}
                  </span>
                ) : (
                  <>
                    <label>
                      Rating
                      <select
                        value={feedbackForms[order.id]?.rating ?? "5"}
                        onChange={(event) => updateFeedbackForm(order.id, "rating", event.target.value)}
                      >
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Poor</option>
                        <option value="1">1 - Very poor</option>
                      </select>
                    </label>
                    <label>
                      Comments
                      <textarea
                        rows="3"
                        value={feedbackForms[order.id]?.comment ?? ""}
                        onChange={(event) => updateFeedbackForm(order.id, "comment", event.target.value)}
                        placeholder="Share your experience with the delivery agent"
                      />
                    </label>
                    <button type="button" onClick={() => submitFeedback(order.id)}>
                      Submit feedback
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {!filteredOrders.length ? <p className="muted empty-state-text">No customer orders match this search.</p> : null}
    </section>
  );
}
