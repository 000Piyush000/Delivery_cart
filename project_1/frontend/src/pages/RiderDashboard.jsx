import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../api/client.js";

export default function RiderDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState("");

  const loadTasks = async () => {
    const data = await apiRequest("/riders/me/tasks");
    setTasks(data);
  };

  useEffect(() => {
    loadTasks().catch((error) => setMessage(error.message));
  }, [user.id]);

  const updateStatus = async (orderId, status) => {
    await apiRequest(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    setMessage(`Order #${orderId} updated to ${status}`);
    loadTasks();
  };

  const uploadPod = async (orderId, file) => {
    const formData = new FormData();
    formData.append("pod", file);
    await apiRequest(`/pod/${orderId}`, {
      method: "POST",
      body: formData
    });
    setMessage(`POD uploaded for order #${orderId}`);
  };

  return (
    <section>
      <div className="hero">
        <div>
          <p className="eyebrow">Rider</p>
          <h2>Assigned deliveries</h2>
        </div>
        <p className="muted">Move each order through the delivery lifecycle and upload POD.</p>
      </div>

      {message ? <p className="banner">{message}</p> : null}

      <div className="list-grid">
        {tasks.map((task) => (
          <div className="card" key={task.order_id}>
            <h3>Order #{task.order_id}</h3>
            <p>{task.delivery_address}</p>
            <p className="muted">ETA: {task.eta}</p>
            <div className="button-row">
              <button onClick={() => updateStatus(task.order_id, "out_for_delivery")}>
                Mark out for delivery
              </button>
              <button onClick={() => updateStatus(task.order_id, "delivered")}>Mark delivered</button>
            </div>
            <label className="upload-field">
              Upload POD
              <input type="file" onChange={(event) => uploadPod(task.order_id, event.target.files[0])} />
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
