import { useEffect, useState } from "react";
import { apiRequest, apiRequestOrFallback } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import DateFilterSummary from "../components/DateFilterSummary.jsx";
import DashboardDateControl from "../components/DashboardDateControl.jsx";
import PodViewer from "../components/PodViewer.jsx";
import PodVerificationBadge from "../components/PodVerificationBadge.jsx";
import { matchesSelectedDate } from "../utils/dateFilters.js";

const INITIAL_AUDIT_LOG_COUNT = 4;
const EMPTY_ANALYTICS = {
  summary: {},
  riderPerformance: [],
  auditLogs: []
};

export default function AnalyticsDashboard({ searchQuery = "", selectedDate = "", onSelectedDateChange = () => {} }) {
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllAuditLogs, setShowAllAuditLogs] = useState(false);
  const [auditMessage, setAuditMessage] = useState("");
  const [activeReviewOrderId, setActiveReviewOrderId] = useState(null);
  const normalizedSearch = searchQuery.trim().toLowerCase();

  useEffect(() => {
    const loadAnalytics = async () => {
      const [analyticsData, ordersData, disputesData, podsData] = await Promise.all([
        apiRequestOrFallback("/analytics", EMPTY_ANALYTICS),
        apiRequestOrFallback("/orders", []),
        apiRequestOrFallback("/disputes", []),
        apiRequestOrFallback("/pod", [])
      ]);
      setAnalytics(analyticsData);
      setOrders(ordersData);
      setDisputes(disputesData);
      setPods(podsData);
      setLoading(false);
    };

    loadAnalytics();

    const intervalId = window.setInterval(() => {
      Promise.all([
        apiRequestOrFallback("/analytics", EMPTY_ANALYTICS),
        apiRequestOrFallback("/orders", []),
        apiRequestOrFallback("/disputes", []),
        apiRequestOrFallback("/pod", [])
      ])
        .then(([analyticsData, ordersData, disputesData, podsData]) => {
          setAnalytics(analyticsData);
          setOrders(ordersData);
          setDisputes(disputesData);
          setPods(podsData);
        })
        .catch(() => null);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setShowAllAuditLogs(false);
  }, [normalizedSearch, selectedDate]);

  const reviewPod = async (orderId, verified) => {
    setActiveReviewOrderId(orderId);

    try {
      await apiRequest(`/pod/${orderId}/verification`, {
        method: "PATCH",
        body: JSON.stringify({ verified })
      });

      const [ordersData, disputesData, podsData, analyticsData] = await Promise.all([
        apiRequestOrFallback("/orders", []),
        apiRequestOrFallback("/disputes", []),
        apiRequestOrFallback("/pod", []),
        apiRequestOrFallback("/analytics", EMPTY_ANALYTICS)
      ]);

      setOrders(ordersData);
      setDisputes(disputesData);
      setPods(podsData);
      setAnalytics(analyticsData);
      setAuditMessage(
        verified
          ? `Order #${orderId} marked as POD verified.`
          : `Order #${orderId} moved to investigation.`
      );
    } catch (error) {
      setAuditMessage(error.message || "Unable to review the POD right now.");
    } finally {
      setActiveReviewOrderId(null);
    }
  };

  if (loading) {
    return <p className="muted">Loading analytics...</p>;
  }

  const dateFilteredOrders = orders.filter((order) =>
    matchesSelectedDate(order.created_at || order.promised_at, selectedDate)
  );
  const dateFilteredDisputes = disputes.filter((dispute) =>
    matchesSelectedDate(dispute.updated_at || dispute.created_at, selectedDate)
  );
  const riderPerformance = dateFilteredOrders.reduce((accumulator, order) => {
    const riderName = order.rider_name || "Unassigned";
    const current = accumulator[riderName] || {
      id: riderName,
      name: riderName,
      total_assignments: 0,
      delivered_orders: 0,
      onTimeDelivered: 0
    };

    current.total_assignments += 1;

    if (order.status === "delivered") {
      current.delivered_orders += 1;

      const promisedAt = new Date(order.promised_at).getTime();
      const deliveredAt = new Date(order.delivered_at).getTime();
      if (!Number.isNaN(promisedAt) && !Number.isNaN(deliveredAt) && deliveredAt <= promisedAt) {
        current.onTimeDelivered += 1;
      }
    }

    accumulator[riderName] = current;
    return accumulator;
  }, {});

  const riderPerformanceRows = Object.values(riderPerformance)
    .map((rider) => ({
      ...rider,
      on_time_rate: rider.delivered_orders
        ? ((rider.onTimeDelivered / rider.delivered_orders) * 100).toFixed(2)
        : "0.00"
    }))
    .filter((rider) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        rider.name,
        rider.total_assignments,
        rider.delivered_orders,
        rider.on_time_rate
      ].some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });

  const filteredAuditLogs = (analytics.auditLogs || []).filter((log) => {
    if (!matchesSelectedDate(log.timestamp, selectedDate)) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [
      log.action,
      log.user_name || "System",
      new Date(log.timestamp).toLocaleString()
    ].some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  const deliveredOrders = dateFilteredOrders.filter((order) => order.status === "delivered");
  const onTimeDeliveredOrders = deliveredOrders.filter((order) => {
    const promisedAt = new Date(order.promised_at).getTime();
    const deliveredAt = new Date(order.delivered_at).getTime();
    return !Number.isNaN(promisedAt) && !Number.isNaN(deliveredAt) && deliveredAt <= promisedAt;
  });
  const onTimeRate = deliveredOrders.length
    ? ((onTimeDeliveredOrders.length / deliveredOrders.length) * 100).toFixed(2)
    : "0.00";
  const disputeRate = dateFilteredOrders.length
    ? ((dateFilteredDisputes.length / dateFilteredOrders.length) * 100).toFixed(2)
    : "0.00";
  const deliveredPercent = dateFilteredOrders.length
    ? (deliveredOrders.length / dateFilteredOrders.length) * 100
    : 0;
  const inFlightPercent = dateFilteredOrders.length
    ? (dateFilteredOrders.filter((order) => order.status === "out_for_delivery").length / dateFilteredOrders.length) * 100
    : 0;
  const atRiskPercent = Math.min(100, Number(disputeRate) * 3);
  const delayedPercent = Math.max(0, 100 - deliveredPercent);

  const summaryCards = [
    {
      label: "On-time delivery",
      value: `${onTimeRate}%`,
      helper: "Delivered within the selected date window",
      icon: "OT",
      trend: "+8%",
      tone: "positive"
    },
    {
      label: "Dispute rate",
      value: `${disputeRate}%`,
      helper: "Customer issues in the current filtered order set",
      icon: "DP",
      trend: "-3%",
      tone: "negative"
    },
    {
      label: "Audit events",
      value: filteredAuditLogs.length,
      helper: "Recent logged actions",
      icon: "AL",
      trend: "+14%",
      tone: "positive"
    }
  ];

  const progressBars = [
    { label: "Completed", value: deliveredPercent },
    { label: "On going", value: inFlightPercent },
    { label: "At risk", value: atRiskPercent },
    { label: "Delayed", value: delayedPercent }
  ];

  const auditGroups = filteredAuditLogs.reduce((accumulator, log) => {
    accumulator[log.action] = (accumulator[log.action] || 0) + 1;
    return accumulator;
  }, {});

  const auditBars = Object.entries(auditGroups)
    .slice(0, 4)
    .map(([label, count]) => ({ label, value: count * 20 }));
  const visibleAuditLogs = showAllAuditLogs
    ? filteredAuditLogs
    : filteredAuditLogs.slice(0, INITIAL_AUDIT_LOG_COUNT);
  const canToggleAuditLogs = filteredAuditLogs.length > INITIAL_AUDIT_LOG_COUNT;
  const auditPodQueue = pods.filter((pod) => {
    if (pod.order_status !== "delivered") {
      return false;
    }

    if (!matchesSelectedDate(pod.uploaded_at || pod.delivered_at, selectedDate)) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [
      pod.order_id,
      pod.customer_name,
      pod.rider_name,
      pod.delivery_address,
      pod.verification_status
    ].some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
  });

  return (
    <section>
      <div className="hero page-hero">
        <div className="page-hero-heading">
          <p className="eyebrow">Analytics</p>
          <div className="page-hero-title-row">
            <h2>Performance command board</h2>
            <DashboardDateControl
              selectedDate={selectedDate}
              onChange={onSelectedDateChange}
              variant="inline"
              clearable
            />
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {summaryCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {auditMessage ? <p className="banner">{auditMessage}</p> : null}

      <DateFilterSummary
        title="Orders by month"
        subtitle="Analytics cards and logs respond to the same date chosen on this page."
        items={orders}
        getDateValue={(order) => order.created_at || order.promised_at}
        selectedDate={selectedDate}
        valueLabel="orders"
      />

      <div className="two-column">
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">POD audit</p>
              <h3>Verify uploaded POD files</h3>
            </div>
            <span className="muted">{auditPodQueue.length} uploaded PODs</span>
          </div>
          <div className="list-grid">
            {auditPodQueue.map((pod) => (
              <div className="card" key={pod.order_id}>
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Order #{pod.order_id}</p>
                    <h3>{pod.customer_name || "Customer"}</h3>
                  </div>
                  <PodVerificationBadge status={pod.verification_status} />
                </div>
                <p className="muted">Rider: {pod.rider_name || "Unassigned"}</p>
                <p className="muted">Hash check: {pod.verified ? "true" : "false"}</p>
                <PodViewer pod={pod} />
                <div className="button-row">
                  <button
                    type="button"
                    disabled={activeReviewOrderId === pod.order_id || !pod.verified}
                    onClick={() => reviewPod(pod.order_id, true)}
                  >
                    {activeReviewOrderId === pod.order_id ? "Saving..." : "True"}
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={activeReviewOrderId === pod.order_id}
                    onClick={() => reviewPod(pod.order_id, false)}
                  >
                    False
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!auditPodQueue.length ? <p className="muted empty-state-text">No delivered orders with uploaded POD files match the current filters.</p> : null}
        </div>

        <div className="card graph-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Overall progress</p>
              <h3>Operational status mix</h3>
            </div>
            <button className="ghost-button" type="button">All</button>
          </div>
          <div className="graph-columns">
            {progressBars.map((item) => (
              <div key={item.label} className="graph-column-card">
                <div className="graph-column-track">
                  <div className="graph-column-fill" style={{ height: `${Math.max(8, item.value)}%` }} />
                </div>
                <strong>{Math.round(item.value)}%</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card graph-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Audit activity</p>
              <h3>Action frequency</h3>
            </div>
            <button className="ghost-button" type="button">Recent</button>
          </div>
          <div className="mini-bars">
            {auditBars.map((item) => (
              <div key={item.label} className="mini-bar-row">
                <span>{item.label.replaceAll("_", " ")}</span>
                <div className="mini-bar-track">
                  <div className="mini-bar-fill" style={{ width: `${Math.min(item.value, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="two-column">
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Project summary</p>
              <h3>Rider performance</h3>
            </div>
            <div className="button-row">
              <button className="ghost-button" type="button">Project</button>
              <button className="ghost-button" type="button">Status</button>
            </div>
          </div>
          <div className="table-wrap">
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
                {riderPerformanceRows.map((rider) => (
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
          {!riderPerformanceRows.length ? <p className="muted empty-state-text">No riders match the selected date and search.</p> : null}
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Audit feed</p>
              <h3>Recent audit logs</h3>
            </div>
            <button className="ghost-button" type="button">Live</button>
          </div>
          <div className="audit-feed">
            {visibleAuditLogs.map((log) => (
              <div key={log.id} className="audit-item">
                <strong>{log.action}</strong>
                <span>{log.user_name || "System"}</span>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
          {!filteredAuditLogs.length ? <p className="muted empty-state-text">No audit logs match the selected date and search.</p> : null}
          {canToggleAuditLogs ? (
            <button
              className="ghost-button audit-toggle-button"
              type="button"
              onClick={() => setShowAllAuditLogs((current) => !current)}
            >
              {showAllAuditLogs ? "Show less" : "Show more"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
