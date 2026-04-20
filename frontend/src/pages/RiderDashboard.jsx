import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest, apiRequestOrFallback } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";
import PodViewer from "../components/PodViewer.jsx";
import DateFilterSummary from "../components/DateFilterSummary.jsx";
import DashboardDateControl from "../components/DashboardDateControl.jsx";
import { matchesSelectedDate } from "../utils/dateFilters.js";

export default function RiderDashboard({ searchQuery = "", selectedDate = "", onSelectedDateChange = () => {} }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pods, setPods] = useState({});
  const [previews, setPreviews] = useState({});
  const [message, setMessage] = useState("");
  const [agentSupportTopic, setAgentSupportTopic] = useState("Address unreachable");
  const [podCheckingOrders, setPodCheckingOrders] = useState({});
  const [activeAction, setActiveAction] = useState("");
  const [activePodTask, setActivePodTask] = useState({});

  const loadTasks = async () => {
    const data = await apiRequestOrFallback("/riders/me/tasks", []);
    setTasks(data);
  };

  const loadPodForOrder = async (orderId) => {
    const pod = await apiRequestOrFallback(`/pod/${orderId}`, null);
    if (pod) {
      setPods((current) => ({ ...current, [orderId]: pod }));
    }
    return pod;
  };

  useEffect(() => {
    loadTasks();
    const intervalId = window.setInterval(() => {
      loadTasks().catch(() => null);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [user.id]);

  useEffect(() => {
    const deliveredOrdersMissingPod = tasks
      .filter((task) => task.order_status === "delivered" && !pods[task.order_id])
      .map((task) => task.order_id);

    if (!deliveredOrdersMissingPod.length) {
      return;
    }

    deliveredOrdersMissingPod.forEach((orderId) => {
      loadPodForOrder(orderId).catch(() => null);
    });
  }, [tasks, pods]);

  const updateStatus = async (orderId, status) => {
    const actionKey = `${orderId}:${status}`;
    setActiveAction(actionKey);
    const previousTasks = tasks;

    setTasks((current) =>
      current.map((task) =>
        task.order_id === orderId ? { ...task, order_status: status } : task
      )
    );

    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      if (status === "delivered") {
        setPodCheckingOrders((current) => ({ ...current, [orderId]: true }));
      }
      setMessage(`Order #${orderId} updated to ${status.replaceAll("_", " ")}`);
      await loadTasks();
    } catch (error) {
      setTasks(previousTasks);
      setMessage(`Unable to update order #${orderId} right now.`);
    } finally {
      setActiveAction("");
    }
  };

  const uploadPod = async (orderId, file) => {
    if (!file) {
      return;
    }

    const actionKey = `${orderId}:pod-upload`;
    setActiveAction(actionKey);
    const localPreview = URL.createObjectURL(file);
    setPreviews((current) => ({ ...current, [orderId]: localPreview }));

    try {
      const formData = new FormData();
      formData.append("pod", file);
      const pod = await apiRequest(`/pod/${orderId}`, {
        method: "POST",
        body: formData
      });
      setPods((current) => ({ ...current, [orderId]: pod }));
      setPodCheckingOrders((current) => ({ ...current, [orderId]: false }));
      setActivePodTask((current) => ({ ...current, [orderId]: false }));
      setMessage(`POD uploaded for order #${orderId}`);
    } catch (error) {
      setMessage(`Unable to upload POD for order #${orderId} right now.`);
    } finally {
      setActiveAction("");
    }
  };

  const rejectOrder = async (task) => {
    const actionKey = `${task.order_id}:reject`;
    setActiveAction(actionKey);
    const previousTasks = tasks;

    setTasks((current) => current.filter((item) => item.order_id !== task.order_id));

    try {
      await apiRequest(`/assignments/${task.order_id}/reject/${task.rider_id}`, {
        method: "POST"
      });
      setMessage(`Order #${task.order_id} rejected and sent back for reassignment`);
      await loadTasks();
    } catch (error) {
      setTasks(previousTasks);
      setMessage(`Unable to reject order #${task.order_id} right now.`);
    } finally {
      setActiveAction("");
    }
  };

  const requestAgentSupport = () => {
    setMessage(`Agent support request created for: ${agentSupportTopic}`);
  };

  const startPodChecking = (orderId) => {
    setActivePodTask((current) => ({ ...current, [orderId]: true }));
    setMessage(`POD checking started for order #${orderId}. Upload the POD screenshot to complete it.`);
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const dateFilteredTasks = tasks.filter((task) =>
    matchesSelectedDate(task.assigned_at || task.promised_at, selectedDate)
  );
  const filteredTasks = dateFilteredTasks.filter((task) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      task.order_id,
      task.order_status,
      task.delivery_address,
      task.eta,
      task.latitude,
      task.longitude
    ].some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
  });

  return (
    <section>
      <div className="hero page-hero">
        <div className="page-hero-heading">
          <p className="eyebrow">Rider</p>
          <div className="page-hero-title-row">
            <h2>My delivery route</h2>
            <DashboardDateControl
              selectedDate={selectedDate}
              onChange={onSelectedDateChange}
              variant="inline"
              clearable
            />
          </div>
        </div>
      </div>

      {message ? <p className="banner">{message}</p> : null}

      <DateFilterSummary
        title="Assigned stops by month"
        subtitle="Daily route cards below show only the deliveries for the selected date."
        items={tasks}
        getDateValue={(task) => task.assigned_at || task.promised_at}
        selectedDate={selectedDate}
        valueLabel="stops"
      />

      <div className="rider-route-shell">
        <div className="two-column">
          <div className="card route-summary-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Route details</p>
                <h3>Today&apos;s assigned sequence</h3>
              </div>
              <span className="muted">{filteredTasks.length} active stops</span>
            </div>
            <div className="route-sequence">
              {filteredTasks.map((task, index) => (
                <div className="route-stop compact-stop" key={task.order_id}>
                  <div className="route-index">{index + 1}</div>
                  <div className="route-stop-body">
                    <div className="route-stop-topline">
                      <strong>Order #{task.order_id}</strong>
                      <StatusBadge status={task.order_status} />
                    </div>
                    <p>{task.delivery_address}</p>
                    <div className="route-meta">
                      <span>{task.eta || "ETA pending"}</span>
                      <span>{new Date(task.promised_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {task.customer_feedback_created_at ? (
                      <div className="feedback-inline">
                        <strong>Feedback</strong>
                        <span>{task.customer_feedback_rating}/5 from customer</span>
                        {task.customer_feedback_comment ? <span>{task.customer_feedback_comment}</span> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            {!filteredTasks.length ? <p className="muted empty-state-text">No delivery tasks match the selected date and search.</p> : null}
          </div>

          <div className="card support-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Agent support</p>
                <h3>Need help on the route?</h3>
              </div>
            </div>
            <p className="muted">Use agent support for route blocks, address problems, or customer contact issues.</p>
            <label>
              Issue type
              <select value={agentSupportTopic} onChange={(event) => setAgentSupportTopic(event.target.value)}>
                <option>Address unreachable</option>
                <option>Customer unavailable</option>
                <option>Vehicle issue</option>
                <option>POD upload problem</option>
              </select>
            </label>
            <div className="support-chip-row">
              <button className="ghost-button" type="button" onClick={() => setAgentSupportTopic("Address unreachable")}>Address</button>
              <button className="ghost-button" type="button" onClick={() => setAgentSupportTopic("Customer unavailable")}>Customer</button>
              <button className="ghost-button" type="button" onClick={() => setAgentSupportTopic("POD upload problem")}>POD</button>
            </div>
            <button type="button" onClick={requestAgentSupport}>Request agent support</button>
          </div>
        </div>

        <div className="list-grid">
          {filteredTasks.map((task) => (
            <div className="card delivery-task-card" key={task.order_id}>
              <div className="task-head">
                <div>
                  <p className="section-kicker">Assigned delivery</p>
                  <h3>Order #{task.order_id}</h3>
                </div>
                <StatusBadge status={task.order_status} />
              </div>
              <p>{task.delivery_address}</p>
              <div className="route-meta">
                <span>{task.eta}</span>
                <span>
                  {task.latitude}, {task.longitude}
                </span>
              </div>
              {task.order_status !== "delivered" ? (
                <>
                  <div className="button-row">
                    <button
                      type="button"
                      disabled={activeAction === `${task.order_id}:out_for_delivery`}
                      onClick={() => updateStatus(task.order_id, "out_for_delivery")}
                    >
                      {activeAction === `${task.order_id}:out_for_delivery` ? "Updating..." : "Mark in transit"}
                    </button>
                    <button
                      type="button"
                      disabled={activeAction === `${task.order_id}:delivered`}
                      onClick={() => updateStatus(task.order_id, "delivered")}
                    >
                      {activeAction === `${task.order_id}:delivered` ? "Updating..." : "Order delivered"}
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={activeAction === `${task.order_id}:reject`}
                      onClick={() => rejectOrder(task)}
                    >
                      {activeAction === `${task.order_id}:reject` ? "Rejecting..." : "Reject order"}
                    </button>
                  </div>
                  <label className="upload-field">
                    {activeAction === `${task.order_id}:pod-upload` ? "Uploading POD..." : "Upload POD screenshot"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={activeAction === `${task.order_id}:pod-upload`}
                      onChange={(event) => uploadPod(task.order_id, event.target.files[0])}
                    />
                  </label>
                </>
              ) : null}
              {task.order_status === "delivered" && !pods[task.order_id] ? (
                <label className="upload-field">
                  {activeAction === `${task.order_id}:pod-upload`
                    ? "Uploading POD..."
                    : "Upload POD screenshot"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={activeAction === `${task.order_id}:pod-upload`}
                    onChange={(event) => uploadPod(task.order_id, event.target.files[0])}
                  />
                </label>
              ) : null}
              {task.order_status !== "delivered" && podCheckingOrders[task.order_id] ? (
                <div className={`pod-checking-task${activePodTask[task.order_id] ? " pod-checking-task-active" : ""}`}>
                  <div>
                    <p className="section-kicker">New task</p>
                    <h4>POD checking</h4>
                    <p className="muted">
                      {activePodTask[task.order_id]
                        ? "POD checking is active. Upload the proof of delivery screenshot now."
                        : "Verify the proof of delivery and upload the screenshot to complete the stop."}
                    </p>
                  </div>
                  <button type="button" className="ghost-button" onClick={() => startPodChecking(task.order_id)}>
                    {activePodTask[task.order_id] ? "In progress" : "Get started"}
                  </button>
                </div>
              ) : null}
              {task.customer_feedback_created_at ? (
                <div className="support-note feedback-section">
                  <strong>Feedback</strong>
                  <span>{task.customer_feedback_rating}/5 from customer</span>
                  {task.customer_feedback_comment ? <span>{task.customer_feedback_comment}</span> : null}
                </div>
              ) : null}
              <PodViewer pod={pods[task.order_id]} localPreview={previews[task.order_id]} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
