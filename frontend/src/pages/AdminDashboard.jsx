import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiRequest, apiRequestOrFallback } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PodVerificationBadge from "../components/PodVerificationBadge.jsx";
import DateFilterSummary from "../components/DateFilterSummary.jsx";
import DashboardDateControl from "../components/DashboardDateControl.jsx";
import { matchesSelectedDate } from "../utils/dateFilters.js";

const pickupAddressByCustomer = {
  "Ananya Verma": "12 A , Ramnagar, near Railway Station",
  "Arjun Rao": "Sector 17, Greator Noida"
};

const adminViews = {
  "/admin": {
    eyebrow: "Admin",
    title: "Operations command center",
    description: "Keep the main dashboard focused on live health, then move into orders, customers, riders, hubs, audit logs, and schema details from the left menu."
  },
  "/admin/orders": {
    eyebrow: "Orders",
    title: "Assigned and unassigned orders",
    description: "Use the date filter to inspect the order queue, then assign, reassign, or unassign from one place."
  },
  "/admin/customers": {
    eyebrow: "Customers",
    title: "Customer overview and order placement",
    description: "See customer information, review order detail, and place a new order without leaving the admin workspace."
  },
  "/admin/admins": {
    eyebrow: "Admins",
    title: "Admin access management",
    description: "Add new admin users with their details and keep existing operational records untouched."
  },
  "/admin/delivery-agents": {
    eyebrow: "Delivery agents",
    title: "Rider workload and roster management",
    description: "Track agent availability, mark riders busy after three active orders, add new riders, and remove old riders."
  },
  "/admin/hubs": {
    eyebrow: "Hubs",
    title: "Hub details and creation",
    description: "Monitor every hub, compare routed order volume, and create new hubs for operational coverage."
  },
  "/admin/audit-logs": {
    eyebrow: "Audit",
    title: "Recent audit log",
    description: "Review operational events across order creation, assignment, rider management, and hub changes."
  }
};

const adminShortcuts = [
  { to: "/admin/orders", title: "Orders", detail: "Assigned and unassigned queue with date filtering." },
  { to: "/admin/customers", title: "Customers", detail: "Customer info, order detail, and place-order flow." },
  { to: "/admin/admins", title: "Admins", detail: "Add more admins and review current admin access." },
  { to: "/admin/delivery-agents", title: "Delivery agents", detail: "Add riders, remove riders, and unassign work." },
  { to: "/admin/hubs", title: "Hub details", detail: "Hub registry and creation tools." },
  { to: "/admin/audit-logs", title: "Audit log", detail: "Recent admin and ops activity." }
];

const createInitialOrderForm = () => ({
  customerId: "",
  hubId: "",
  pickupAddress: "Delhi Central Hub, New Delhi",
  deliveryAddress: "14 Lodhi Estate, New Delhi",
  latitude: "28.6139",
  longitude: "77.2090",
  promisedAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
});

const createInitialHubForm = () => ({
  name: "Gurugram West Hub",
  latitude: "28.4595",
  longitude: "77.0266"
});

const createInitialRiderForm = () => ({
  name: "Aisha Khan",
  password: "password123",
  location: "Karol Bagh, Delhi",
  latitude: "28.6519",
  longitude: "77.1909",
  availability: true
});

const createInitialAdminForm = () => ({
  name: "Aarav Sharma",
  password: "password123",
  address: "Admin desk, Delhi HQ"
});

const matchesSearch = (values, normalizedSearch) => {
  if (!normalizedSearch) {
    return true;
  }

  return values.some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
};

const getOrderDateValue = (order) => order.created_at || order.promised_at;

const formatDateTime = (value) => {
  if (!value) {
    return "--";
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? "--" : parsedDate.toLocaleString();
};

const formatCoordinates = (latitude, longitude) => `${latitude}, ${longitude}`;
const formatStatusLabel = (status) =>
  String(status ?? "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getAssignmentState = (order) => (order.rider_id ? "assigned" : "unassigned");

const getRiderStatus = (rider) =>
  rider.workload_status ||
  (rider.can_take_orders === false || rider.availability === false ? "busy" : "available");

function AdminHero({
  eyebrow,
  title,
  description,
  selectedDate,
  onSelectedDateChange,
  showDateControl = true
}) {
  return (
    <div className="hero page-hero admin-hero">
      <div className="page-hero-heading">
        <p className="eyebrow">{eyebrow}</p>
        <div className="page-hero-title-row">
          <h2>{title}</h2>
          {showDateControl ? (
            <DashboardDateControl
              selectedDate={selectedDate}
              onChange={onSelectedDateChange}
              variant="inline"
              clearable
            />
          ) : null}
        </div>
        <p className="muted section-subcopy">{description}</p>
      </div>
    </div>
  );
}

function ShortcutCard({ to, title, detail, metrics = [] }) {
  return (
    <Link className="card shortcut-card" to={to}>
      <p className="section-kicker">Admin section</p>
      <h3>{title}</h3>
      <p className="muted">{detail}</p>
      {metrics.length ? (
        <div className="overview-card-metrics">
          {metrics.map((metric) => (
            <div key={`${title}-${metric.label}`} className="overview-card-metric">
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

function OverviewSection({
  selectedDate,
  onSelectedDateChange,
  message,
  riders,
  hubs,
  customers,
  filteredOrders,
  filteredAuditLogs
}) {
  const busyRiders = riders.filter((rider) => getRiderStatus(rider) === "busy");
  const unassignedOrders = filteredOrders.filter((order) => !order.rider_id);
  const deliveredOrders = filteredOrders.filter((order) => order.status === "delivered");
  const openOrders = filteredOrders.filter((order) => order.status !== "delivered");
  const customersWithOrders = new Set(filteredOrders.map((order) => order.customer_id)).size;
  const overviewCards = [
    {
      to: "/admin/orders",
      title: "Orders",
      detail: "Overview of assigned, unassigned, and active delivery flow.",
      metrics: [
        { label: "All", value: filteredOrders.length },
        { label: "Open", value: openOrders.length },
        { label: "Unassigned", value: unassignedOrders.length }
      ]
    },
    {
      to: "/admin/customers",
      title: "Customers Overview",
      detail: "Quick view of customers and current order activity.",
      metrics: [
        { label: "Customers", value: customers.length },
        { label: "Active buyers", value: customersWithOrders },
        { label: "Delivered", value: deliveredOrders.length }
      ]
    },
    {
      to: "/admin/delivery-agents",
      title: "Delivery Agents",
      detail: "Rider count, availability, and capacity snapshot.",
      metrics: [
        { label: "All riders", value: riders.length },
        { label: "Busy", value: busyRiders.length },
        { label: "Available", value: riders.length - busyRiders.length }
      ]
    },
    {
      to: "/admin/hubs",
      title: "Hub Details",
      detail: "Hub footprint and routing coverage at a glance.",
      metrics: [
        { label: "Hubs", value: hubs.length },
        { label: "Open orders", value: openOrders.length },
        { label: "Delivered", value: deliveredOrders.length }
      ]
    },
    {
      to: "/admin/audit-logs",
      title: "Recent Audit Log",
      detail: "Recent admin and operational event totals.",
      metrics: [
        { label: "Events", value: filteredAuditLogs.length },
        { label: "Order logs", value: filteredAuditLogs.filter((log) => log.action.includes("ORDER")).length },
        { label: "Rider logs", value: filteredAuditLogs.filter((log) => log.action.includes("RIDER")).length }
      ]
    }
  ];

  return (
    <section>
      <AdminHero
        eyebrow={adminViews["/admin"].eyebrow}
        title={adminViews["/admin"].title}
        description={adminViews["/admin"].description}
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
      />

      <div className="stats-grid">
        <StatCard label="Orders overview" value={filteredOrders.length} helper="All filtered orders" icon="OR" />
        <StatCard label="Customers overview" value={customers.length} helper="Registered customers" icon="CU" />
        <StatCard label="Delivery overview" value={riders.length} helper="All riders in roster" icon="DA" />
        <StatCard label="Hub overview" value={hubs.length} helper="Active hub locations" icon="HB" />
        <StatCard label="Audit overview" value={filteredAuditLogs.length} helper="Filtered audit events" icon="AL" />
      </div>

      {message ? <p className="banner">{message}</p> : null}

      <div className="shortcut-grid">
        {overviewCards.map((shortcut) => (
          <ShortcutCard key={shortcut.to} {...shortcut} />
        ))}
      </div>
    </section>
  );
}

function OrdersSection({
  selectedDate,
  onSelectedDateChange,
  message,
  orders,
  riders,
  filteredOrders,
  manualSelection,
  setManualSelection,
  autoAssign,
  manualAssign,
  unassignOrder
}) {
  const assignedOrders = filteredOrders.filter((order) => order.rider_id);
  const unassignedOrders = filteredOrders.filter((order) => !order.rider_id);

  return (
    <section>
      <AdminHero
        eyebrow={adminViews["/admin/orders"].eyebrow}
        title={adminViews["/admin/orders"].title}
        description={adminViews["/admin/orders"].description}
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
      />

      <div className="stats-grid">
        <StatCard label="All orders" value={filteredOrders.length} helper="Filtered by search and date" icon="OR" />
        <StatCard label="Assigned" value={assignedOrders.length} helper="Orders already linked to riders" icon="AS" />
        <StatCard label="Unassigned" value={unassignedOrders.length} helper="Orders still waiting for dispatch" icon="UA" />
        <StatCard label="Ready to route" value={unassignedOrders.filter((order) => order.status !== "delivered").length} helper="Open orders that still need a rider" icon="RT" />
      </div>

      <DateFilterSummary
        title="Orders by month"
        subtitle="This page shows both assigned and unassigned orders for the selected date."
        items={orders}
        getDateValue={getOrderDateValue}
        selectedDate={selectedDate}
        valueLabel="orders"
      />

      {message ? <p className="banner">{message}</p> : null}

      <div className="card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Dispatch board</p>
            <h3>All assigned and unassigned orders</h3>
          </div>
          <span className="muted">{filteredOrders.length} rows</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Created</th>
                <th>Customer</th>
                <th>Assignment</th>
                <th>Status</th>
                <th>Hub</th>
                <th>Rider</th>
                <th>Promised</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{formatDateTime(order.created_at)}</td>
                  <td>{order.customer_name}</td>
                  <td><StatusBadge status={getAssignmentState(order)} /></td>
                  <td>
                    <div className="status-stack">
                      <StatusBadge status={order.status} />
                      {order.status === "delivered" ? <PodVerificationBadge status={order.pod_verification_status} /> : null}
                    </div>
                  </td>
                  <td>{order.hub_name}</td>
                  <td>{order.rider_name || "Unassigned"}</td>
                  <td>{formatDateTime(order.promised_at)}</td>
                  <td className="table-action-cell">
                    {order.status === "delivered" ? (
                      <span className="muted">Delivered</span>
                    ) : !order.rider_id ? (
                      <div className="action-stack">
                        <button type="button" onClick={() => autoAssign(order.id)}>
                          Auto assign
                        </button>
                        <select
                          value={manualSelection[order.id] || ""}
                          onChange={(event) =>
                            setManualSelection((current) => ({
                              ...current,
                              [order.id]: event.target.value
                            }))
                          }
                        >
                          <option value="">Select rider</option>
                          {riders.map((rider) => (
                            <option key={rider.id} value={rider.id}>
                              {rider.name} ({getRiderStatus(rider)}, {rider.active_assignments || 0}/3)
                            </option>
                          ))}
                        </select>
                        <button type="button" onClick={() => manualAssign(order.id)}>
                          Manual assign
                        </button>
                      </div>
                    ) : (
                      <div className="action-stack">
                        <span className="muted action-note">Assigned to {order.rider_name || `rider #${order.rider_id}`}</span>
                        <button className="ghost-button" type="button" onClick={() => unassignOrder(order.id)}>
                          Unassign
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredOrders.length ? <p className="muted empty-state-text">No orders match the selected date and search.</p> : null}
      </div>
    </section>
  );
}

function CustomersSection({
  selectedDate,
  onSelectedDateChange,
  message,
  orders,
  filteredOrders,
  customers,
  hubs,
  normalizedSearch,
  orderForm,
  setOrderForm,
  createOrder
}) {
  const customerRows = customers
    .map((customer) => {
      const customerOrders = orders.filter((order) => order.customer_id === customer.id);
      const dateMatchedOrders = customerOrders.filter((order) =>
        matchesSelectedDate(getOrderDateValue(order), selectedDate)
      );
      const latestOrder = [...customerOrders].sort((left, right) =>
        String(right.created_at || "").localeCompare(String(left.created_at || ""))
      )[0];

      return {
        ...customer,
        totalOrders: customerOrders.length,
        openOrders: customerOrders.filter((order) => order.status !== "delivered").length,
        latestOrder,
        dateMatchedOrders
      };
    })
    .filter((customer) => {
      const matchesDate =
        !selectedDate ||
        matchesSelectedDate(customer.created_at, selectedDate) ||
        customer.dateMatchedOrders.length > 0;

      return (
        matchesDate &&
        matchesSearch(
          [
            customer.name,
            customer.address,
            customer.totalOrders,
            customer.openOrders,
            customer.latestOrder?.delivery_address,
            customer.latestOrder?.status
          ],
          normalizedSearch
        )
      );
    });
  const customersWithOrders = customerRows.filter((customer) => customer.totalOrders > 0).length;

  return (
    <section>
      <AdminHero
        eyebrow={adminViews["/admin/customers"].eyebrow}
        title={adminViews["/admin/customers"].title}
        description={adminViews["/admin/customers"].description}
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
      />

      <div className="stats-grid">
        <StatCard label="Customers" value={customerRows.length} helper="Visible customer records" icon="CU" />
        <StatCard label="Customers with orders" value={customersWithOrders} helper="Customers who have already placed an order" icon="CO" />
        <StatCard label="Open customer orders" value={filteredOrders.filter((order) => order.status !== "delivered").length} helper="Orders still moving through operations" icon="OO" />
        <StatCard label="Available hubs" value={hubs.length} helper="Hubs ready for new order placement" icon="HB" />
      </div>

      <DateFilterSummary
        title="Customer orders by month"
        subtitle="Use the selected date to narrow customer order detail before placing a new order."
        items={orders}
        getDateValue={getOrderDateValue}
        selectedDate={selectedDate}
        valueLabel="orders"
      />

      {message ? <p className="banner">{message}</p> : null}

      <div className="two-column">
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Place order</p>
              <h3>Create order for a customer</h3>
            </div>
          </div>
          <form className="form-grid" onSubmit={createOrder}>
            <label>
              Customer
              <select
                value={orderForm.customerId}
                onChange={(event) => {
                  const selectedCustomer = customers.find(
                    (customer) => String(customer.id) === String(event.target.value)
                  );
                  const nextPickupAddress =
                    selectedCustomer?.address || pickupAddressByCustomer[selectedCustomer?.name];

                  setOrderForm((current) => ({
                    ...current,
                    customerId: event.target.value,
                    pickupAddress: nextPickupAddress || current.pickupAddress
                  }));
                }}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Hub
              <select
                value={orderForm.hubId}
                onChange={(event) =>
                  setOrderForm((current) => ({ ...current, hubId: event.target.value }))
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
                value={orderForm.pickupAddress}
                onChange={(event) =>
                  setOrderForm((current) => ({ ...current, pickupAddress: event.target.value }))
                }
              />
            </label>
            <label>
              Delivery address
              <input
                value={orderForm.deliveryAddress}
                onChange={(event) =>
                  setOrderForm((current) => ({ ...current, deliveryAddress: event.target.value }))
                }
              />
            </label>
            <label>
              Promised by
              <input
                type="datetime-local"
                value={orderForm.promisedAt}
                onChange={(event) =>
                  setOrderForm((current) => ({ ...current, promisedAt: event.target.value }))
                }
              />
            </label>
            <button type="submit">Place order</button>
          </form>
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Customer info</p>
              <h3>Customer overview</h3>
            </div>
            <span className="muted">{customerRows.length} rows</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Total orders</th>
                  <th>Open orders</th>
                  <th>Latest order</th>
                </tr>
              </thead>
              <tbody>
                {customerRows.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.address || "--"}</td>
                    <td>{customer.totalOrders}</td>
                    <td>{customer.openOrders}</td>
                    <td>
                      {customer.latestOrder ? (
                        <div className="metric-stack">
                          <strong>#{customer.latestOrder.id}</strong>
                          <span className="muted">{customer.latestOrder.delivery_address}</span>
                          <div className="status-stack">
                            <StatusBadge status={customer.latestOrder.status} />
                            {customer.latestOrder.status === "delivered" ? (
                              <PodVerificationBadge status={customer.latestOrder.pod_verification_status} />
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <span className="muted">No orders yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!customerRows.length ? <p className="muted empty-state-text">No customers match the current filters.</p> : null}
        </div>
      </div>

      <div className="card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Order detail</p>
            <h3>Customer order detail</h3>
          </div>
          <span className="muted">{filteredOrders.length} visible orders</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Rider</th>
                <th>Hub</th>
                <th>Delivery address</th>
                <th>Promised</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td>
                    <div className="status-stack">
                      <StatusBadge status={order.status} />
                      {order.status === "delivered" ? <PodVerificationBadge status={order.pod_verification_status} /> : null}
                    </div>
                  </td>
                  <td>{order.rider_name || "Pending assignment"}</td>
                  <td>{order.hub_name}</td>
                  <td>{order.delivery_address}</td>
                  <td>{formatDateTime(order.promised_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredOrders.length ? <p className="muted empty-state-text">No customer orders match the selected date and search.</p> : null}
      </div>
    </section>
  );
}

function AdminsSection({
  selectedDate,
  onSelectedDateChange,
  message,
  admins,
  adminForm,
  setAdminForm,
  createAdmin
}) {
  return (
    <section>
      <AdminHero
        eyebrow={adminViews["/admin/admins"].eyebrow}
        title={adminViews["/admin/admins"].title}
        description={adminViews["/admin/admins"].description}
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
      />

      <div className="stats-grid">
        <StatCard label="Admins" value={admins.length} helper="Current admin accounts" icon="AD" />
        <StatCard label="Named accounts" value={admins.filter((admin) => admin.name).length} helper="Admins with login-ready profiles" icon="AC" />
        <StatCard label="Details saved" value={admins.filter((admin) => admin.address).length} helper="Admin records with detail or address" icon="DT" />
        <StatCard label="Latest account" value={admins[0] ? formatDateTime(admins[0].created_at) : "--"} helper="Most recently created admin" icon="NW" />
      </div>

      {message ? <p className="banner">{message}</p> : null}

      <div className="two-column">
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Admin creation</p>
              <h3>Add new admin</h3>
            </div>
          </div>
          <form className="form-grid" onSubmit={createAdmin}>
            <label>
              Admin name
              <input
                value={adminForm.name}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={adminForm.password}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>
            <label>
              Detail / address
              <input
                value={adminForm.address}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </label>
            <button type="submit">Add admin</button>
          </form>
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Access rules</p>
              <h3>What the new admin gets</h3>
            </div>
          </div>
          <div className="summary-list">
            <div className="summary-list-item">
              <strong>Full admin login</strong>
              <span className="muted">The new account uses the same admin role checks as existing admins.</span>
            </div>
            <div className="summary-list-item">
              <strong>Separate account record</strong>
              <span className="muted">Creating an admin inserts a new user only and does not edit customers, riders, hubs, or orders.</span>
            </div>
            <div className="summary-list-item">
              <strong>Audit visibility</strong>
              <span className="muted">Each admin creation is logged in the audit stream.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Admin registry</p>
            <h3>Current admins</h3>
          </div>
          <span className="muted">{admins.length} rows</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Detail</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.name}</td>
                  <td>{formatStatusLabel(admin.role)}</td>
                  <td>{admin.address || "--"}</td>
                  <td>{formatDateTime(admin.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!admins.length ? <p className="muted empty-state-text">No admins found.</p> : null}
      </div>
    </section>
  );
}

function DeliveryAgentsSection({
  selectedDate,
  onSelectedDateChange,
  message,
  riders,
  filteredOrders,
  riderForm,
  setRiderForm,
  createRider,
  toggleRiderAvailability,
  removeRider,
  unassignOrder
}) {
  const riderRows = riders;
  const availableRiders = riderRows.filter((rider) => getRiderStatus(rider) === "available");
  const busyRiders = riderRows.filter((rider) => getRiderStatus(rider) === "busy");
  const activeAssignedOrders = filteredOrders.filter(
    (order) => order.rider_id && order.status !== "delivered"
  );

  return (
    <section>
      <AdminHero
        eyebrow={adminViews["/admin/delivery-agents"].eyebrow}
        title={adminViews["/admin/delivery-agents"].title}
        description={adminViews["/admin/delivery-agents"].description}
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
      />

      <div className="stats-grid">
        <StatCard label="All agents" value={riderRows.length} helper="Visible rider roster" icon="RA" />
        <StatCard label="Available" value={availableRiders.length} helper="Can take more orders right now" icon="AV" />
        <StatCard label="Busy" value={busyRiders.length} helper="At capacity or manually unavailable" icon="BZ" />
        <StatCard label="Unassigned orders" value={filteredOrders.filter((order) => !order.rider_id && order.status !== "delivered").length} helper="Dispatch gaps still open" icon="UA" />
      </div>

      {message ? <p className="banner">{message}</p> : null}

      <div className="two-column">
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Roster update</p>
              <h3>Add new rider</h3>
            </div>
          </div>
          <form className="form-grid" onSubmit={createRider}>
            <label>
              Rider name
              <input
                value={riderForm.name}
                onChange={(event) =>
                  setRiderForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label>
              Password
              <input
                value={riderForm.password}
                onChange={(event) =>
                  setRiderForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>
            <label>
              Location
              <input
                value={riderForm.location}
                onChange={(event) =>
                  setRiderForm((current) => ({ ...current, location: event.target.value }))
                }
              />
            </label>
            <label>
              Manual availability
              <select
                value={riderForm.availability ? "available" : "busy"}
                onChange={(event) =>
                  setRiderForm((current) => ({
                    ...current,
                    availability: event.target.value === "available"
                  }))
                }
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </select>
            </label>
            <button type="submit">Add rider</button>
          </form>
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Workload rule</p>
              <h3>Capacity visibility</h3>
            </div>
          </div>
          <div className="summary-list">
            <div className="summary-list-item">
              <strong>Available riders</strong>
              <span className="muted">Shown when manual availability is on and active assignments stay below three.</span>
            </div>
            <div className="summary-list-item">
              <strong>Busy riders</strong>
              <span className="muted">Shown when a rider is manually unavailable or reaches three active assigned orders.</span>
            </div>
            <div className="summary-list-item">
              <strong>Unassign option</strong>
              <span className="muted">Use the order queue below to move work back to the unassigned state.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card section-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Agent roster</p>
            <h3>All delivery agents</h3>
          </div>
          <span className="muted">{riderRows.length} visible riders</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Location</th>
                <th>Coordinates</th>
                <th>Active assignments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {riderRows.map((rider) => (
                <tr key={rider.id}>
                  <td>
                    <div className="metric-stack">
                      <strong>{rider.name}</strong>
                      <span className="muted">User #{rider.user_id}</span>
                      <span className="muted rider-rating-text">
                        rated="{rider.average_feedback_rating ?? "new"}"
                        {Number(rider.feedback_count) > 0 ? ` from ${rider.feedback_count} feedback` : ""}
                      </span>
                    </div>
                  </td>
                  <td>{rider.location || "--"}</td>
                  <td>{formatCoordinates(rider.latitude, rider.longitude)}</td>
                  <td>{rider.active_assignments || 0}/3</td>
                  <td><StatusBadge status={getRiderStatus(rider)} /></td>
                  <td>
                    <div className="button-row">
                      <button className="ghost-button" type="button" onClick={() => toggleRiderAvailability(rider)}>
                        Mark {rider.availability ? "busy" : "available"}
                      </button>
                      <button className="danger-button" type="button" onClick={() => removeRider(rider)}>
                        Remove rider
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!riderRows.length ? <p className="muted empty-state-text">No riders match the selected date and search.</p> : null}
      </div>

      <div className="card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Assigned queue</p>
            <h3>Assigned orders with unassign option</h3>
          </div>
          <span className="muted">{activeAssignedOrders.length} active assignments</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Rider</th>
                <th>Status</th>
                <th>Promised</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeAssignedOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.rider_name}</td>
                  <td>
                    <div className="status-stack">
                      <StatusBadge status={order.status} />
                      {order.status === "delivered" ? <PodVerificationBadge status={order.pod_verification_status} /> : null}
                    </div>
                  </td>
                  <td>{formatDateTime(order.promised_at)}</td>
                  <td className="table-action-cell">
                    <div className="action-stack action-stack-compact">
                      <span className="muted action-note">Move this order back to the open queue.</span>
                      <button className="ghost-button" type="button" onClick={() => unassignOrder(order.id)}>
                        Unassign order
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!activeAssignedOrders.length ? <p className="muted empty-state-text">No assigned orders match the current filters.</p> : null}
      </div>
    </section>
  );
}

function HubsSection({
  selectedDate,
  onSelectedDateChange,
  message,
  orders,
  hubs,
  hubForm,
  setHubForm,
  createHub
}) {
  const hubRows = hubs.map((hub) => {
    const hubOrders = orders.filter((order) => order.hub_id === hub.id);
    const dateMatchedOrders = hubOrders.filter((order) => matchesSelectedDate(getOrderDateValue(order), selectedDate));
    const latestOrder = [...hubOrders].sort((left, right) =>
      String(right.created_at || "").localeCompare(String(left.created_at || ""))
    )[0];

    return {
      ...hub,
      totalOrders: hubOrders.length,
      openOrders: hubOrders.filter((order) => order.status !== "delivered").length,
      dateMatchedOrders,
      latestOrder
    };
  });

  return (
    <section>
      <AdminHero
        eyebrow={adminViews["/admin/hubs"].eyebrow}
        title={adminViews["/admin/hubs"].title}
        description={adminViews["/admin/hubs"].description}
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
      />

      <div className="stats-grid">
        <StatCard label="Hubs" value={hubRows.length} helper="Registered routing hubs" icon="HB" />
        <StatCard label="Orders through hubs" value={orders.length} helper="All routed orders across the network" icon="OR" />
        <StatCard label="Open hub orders" value={orders.filter((order) => order.status !== "delivered").length} helper="Orders still active across hubs" icon="OP" />
        <StatCard label="Filtered hub activity" value={hubRows.reduce((count, hub) => count + hub.dateMatchedOrders.length, 0)} helper="Orders matching the selected date" icon="FD" />
      </div>

      {message ? <p className="banner">{message}</p> : null}

      <div className="two-column">
        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Hub creation</p>
              <h3>Create hub</h3>
            </div>
          </div>
          <form className="form-grid" onSubmit={createHub}>
            <label>
              Hub name
              <input
                value={hubForm.name}
                onChange={(event) =>
                  setHubForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label>
              Latitude
              <input
                value={hubForm.latitude}
                onChange={(event) =>
                  setHubForm((current) => ({ ...current, latitude: event.target.value }))
                }
              />
            </label>
            <label>
              Longitude
              <input
                value={hubForm.longitude}
                onChange={(event) =>
                  setHubForm((current) => ({ ...current, longitude: event.target.value }))
                }
              />
            </label>
            <button type="submit">Create hub</button>
          </form>
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Coverage</p>
              <h3>Hub detail snapshot</h3>
            </div>
          </div>
          <div className="summary-list">
            {hubRows.map((hub) => (
              <div key={hub.id} className="summary-list-item">
                <strong>{hub.name}</strong>
                <span className="muted">
                  {hub.totalOrders} total orders, {hub.openOrders} open orders, latest activity {formatDateTime(hub.latestOrder?.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Hub registry</p>
            <h3>All hubs</h3>
          </div>
          <span className="muted">{hubRows.length} rows</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Hub</th>
                <th>Coordinates</th>
                <th>Total orders</th>
                <th>Open orders</th>
                <th>Latest activity</th>
              </tr>
            </thead>
            <tbody>
              {hubRows.map((hub) => (
                <tr key={hub.id}>
                  <td>{hub.name}</td>
                  <td>{formatCoordinates(hub.latitude, hub.longitude)}</td>
                  <td>{hub.totalOrders}</td>
                  <td>{hub.openOrders}</td>
                  <td>{formatDateTime(hub.latestOrder?.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AuditLogsSection({
  selectedDate,
  onSelectedDateChange,
  message,
  auditLogs,
  filteredAuditLogs
}) {
  const visibleAuditLogs = filteredAuditLogs.slice(0, 10);
  const orderEvents = filteredAuditLogs.filter((log) => log.action.includes("ORDER")).length;
  const riderEvents = filteredAuditLogs.filter((log) => log.action.includes("RIDER")).length;
  const hubEvents = filteredAuditLogs.filter((log) => log.action.includes("HUB")).length;

  return (
    <section>
      <AdminHero
        eyebrow={adminViews["/admin/audit-logs"].eyebrow}
        title={adminViews["/admin/audit-logs"].title}
        description={adminViews["/admin/audit-logs"].description}
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
      />

      <div className="stats-grid">
        <StatCard label="Audit events" value={filteredAuditLogs.length} helper="Events matching the current filters" icon="AL" />
        <StatCard label="Order events" value={orderEvents} helper="Order creation, status, or assignment activity" icon="OR" />
        <StatCard label="Rider events" value={riderEvents} helper="Rider roster and availability activity" icon="RD" />
        <StatCard label="Hub events" value={hubEvents} helper="Hub creation and hub-linked operations" icon="HB" />
      </div>

      <DateFilterSummary
        title="Audit events by month"
        subtitle="Review recent audit activity and use the date picker to isolate a single day."
        items={auditLogs}
        getDateValue={(log) => log.timestamp}
        selectedDate={selectedDate}
        valueLabel="events"
      />

      {message ? <p className="banner">{message}</p> : null}

      <div className="card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Audit stream</p>
            <h3>Recent audit log</h3>
          </div>
          <span className="muted">{visibleAuditLogs.length} rows</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>User</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {visibleAuditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDateTime(log.timestamp)}</td>
                  <td>{log.action}</td>
                  <td>{log.user_name || "System"}</td>
                  <td>{log.user_role || "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredAuditLogs.length ? <p className="muted empty-state-text">No audit logs match the selected date and search.</p> : null}
      </div>
    </section>
  );
}

export default function AdminDashboard({
  searchQuery = "",
  selectedDate = "",
  onSelectedDateChange = () => {}
}) {
  const location = useLocation();
  const currentView = adminViews[location.pathname] || adminViews["/admin"];
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [manualSelection, setManualSelection] = useState({});
  const [orderForm, setOrderForm] = useState(createInitialOrderForm());
  const [hubForm, setHubForm] = useState(createInitialHubForm());
  const [riderForm, setRiderForm] = useState(createInitialRiderForm());
  const [adminForm, setAdminForm] = useState(createInitialAdminForm());

  const loadData = async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }

    const [
      ordersData,
      ridersData,
      hubsData,
      customersData,
      adminsData,
      auditLogData
    ] = await Promise.all([
      apiRequestOrFallback("/orders", []),
      apiRequestOrFallback("/riders", []),
      apiRequestOrFallback("/hubs", []),
      apiRequestOrFallback("/users/role/customer", []),
      apiRequestOrFallback("/users/role/admin", []),
      apiRequestOrFallback("/analytics/audit", [])
    ]);

    setOrders(ordersData);
    setRiders(ridersData);
    setHubs(hubsData);
    setCustomers(customersData);
    setAdmins(adminsData);
    setAuditLogs(auditLogData);

    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const hydrate = async (showSpinner) => {
      if (!isMounted) {
        return;
      }

      await loadData(showSpinner);
    };

    hydrate(true);

    const intervalId = window.setInterval(() => {
      hydrate(false);
    }, 8000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!hubs.length || orderForm.hubId) {
      return;
    }

    setOrderForm((current) => ({ ...current, hubId: String(hubs[0].id) }));
  }, [hubs, orderForm.hubId]);

  const runAdminAction = async (task, successMessage, afterSuccess) => {
    try {
      await task();
      if (afterSuccess) {
        afterSuccess();
      }
      setMessage(successMessage);
      await loadData();
    } catch (error) {
      setMessage(error.message || "Unable to complete that action right now.");
    }
  };

  const autoAssign = async (orderId) => {
    await runAdminAction(
      () => apiRequest(`/assignments/${orderId}/auto`, { method: "POST" }),
      `Auto-assigned the nearest rider for order #${orderId}.`
    );
  };

  const manualAssign = async (orderId) => {
    const riderId = manualSelection[orderId];

    if (!riderId) {
      setMessage("Select a rider before using manual assignment.");
      return;
    }

    await runAdminAction(
      () =>
        apiRequest(`/assignments/${orderId}/manual`, {
          method: "POST",
          body: JSON.stringify({ riderId: Number(riderId), eta: "30 mins" })
        }),
      `Assigned rider ${riderId} to order #${orderId}.`
    );
  };

  const unassignOrder = async (orderId) => {
    await runAdminAction(
      () => apiRequest(`/assignments/${orderId}`, { method: "DELETE" }),
      `Order #${orderId} moved back to the unassigned queue.`
    );
  };

  const createOrder = async (event) => {
    event.preventDefault();

    if (!orderForm.customerId) {
      setMessage("Select a customer before placing the order.");
      return;
    }

    if (!orderForm.hubId) {
      setMessage("Select a hub before placing the order.");
      return;
    }

    await runAdminAction(
      () =>
        apiRequest("/orders", {
          method: "POST",
          body: JSON.stringify({
            customerId: Number(orderForm.customerId),
            hubId: Number(orderForm.hubId),
            pickupAddress: orderForm.pickupAddress,
            deliveryAddress: orderForm.deliveryAddress,
            latitude: Number(orderForm.latitude),
            longitude: Number(orderForm.longitude),
            promisedAt: new Date(orderForm.promisedAt).toISOString()
          })
        }),
      "Order placed successfully.",
      () =>
        setOrderForm((current) => ({
          ...createInitialOrderForm(),
          hubId: current.hubId
        }))
    );
  };

  const createHub = async (event) => {
    event.preventDefault();

    await runAdminAction(
      () =>
        apiRequest("/hubs", {
          method: "POST",
          body: JSON.stringify({
            name: hubForm.name,
            latitude: Number(hubForm.latitude),
            longitude: Number(hubForm.longitude)
          })
        }),
      "Hub created successfully.",
      () => setHubForm(createInitialHubForm())
    );
  };

  const createRider = async (event) => {
    event.preventDefault();

    await runAdminAction(
      () =>
        apiRequest("/riders", {
          method: "POST",
          body: JSON.stringify({
            ...riderForm,
            latitude: Number(riderForm.latitude),
            longitude: Number(riderForm.longitude)
          })
        }),
      `Added rider ${riderForm.name}.`,
      () => setRiderForm(createInitialRiderForm())
    );
  };

  const createAdmin = async (event) => {
    event.preventDefault();

    if (!adminForm.name.trim() || !adminForm.password.trim()) {
      setMessage("Admin name and password are required before submitting.");
      return;
    }

    await runAdminAction(
      () =>
        apiRequest("/auth/register-admin", {
          method: "POST",
          body: JSON.stringify({
            name: adminForm.name,
            password: adminForm.password,
            address: adminForm.address
          })
        }),
      `Added admin ${adminForm.name}. They can now log in with full admin access.`,
      () => setAdminForm(createInitialAdminForm())
    );
  };

  const toggleRiderAvailability = async (rider) => {
    await runAdminAction(
      () =>
        apiRequest(`/riders/${rider.id}/availability`, {
          method: "PATCH",
          body: JSON.stringify({ availability: !rider.availability })
        }),
      `${rider.name} is now marked ${rider.availability ? "busy" : "available"}.`
    );
  };

  const removeRider = async (rider) => {
    await runAdminAction(
      () => apiRequest(`/riders/${rider.id}`, { method: "DELETE" }),
      `Removed rider ${rider.name}.`
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (!matchesSelectedDate(getOrderDateValue(order), selectedDate)) {
      return false;
    }

    return matchesSearch(
      [
        order.id,
        order.customer_name,
        order.status,
        formatStatusLabel(order.status),
        order.hub_name,
        order.rider_name,
        order.delivery_address,
        order.pickup_address,
        getAssignmentState(order),
        order.eta
      ],
      normalizedSearch
    );
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!matchesSelectedDate(log.timestamp, selectedDate)) {
      return false;
    }

    return matchesSearch(
      [
        log.action,
        log.user_name,
        log.user_role,
        formatDateTime(log.timestamp)
      ],
      normalizedSearch
    );
  });

  const filteredRiders = riders.filter((rider) =>
    matchesSearch(
      [
        rider.name,
        rider.location,
        rider.latitude,
        rider.longitude,
        rider.active_assignments,
        rider.total_assignments,
        getRiderStatus(rider)
      ],
      normalizedSearch
    )
  );

  if (loading) {
    return (
      <section>
        <AdminHero
          eyebrow={currentView.eyebrow}
          title={currentView.title}
          description={currentView.description}
          selectedDate={selectedDate}
          onSelectedDateChange={onSelectedDateChange}
          showDateControl={currentView.showDateControl !== false}
        />
        <div className="card">
          <p className="muted">Loading admin workspace...</p>
        </div>
      </section>
    );
  }

  if (location.pathname === "/admin/orders") {
    return (
      <OrdersSection
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
        message={message}
        orders={orders}
        riders={riders}
        filteredOrders={filteredOrders}
        manualSelection={manualSelection}
        setManualSelection={setManualSelection}
        autoAssign={autoAssign}
        manualAssign={manualAssign}
        unassignOrder={unassignOrder}
      />
    );
  }

  if (location.pathname === "/admin/customers") {
    return (
      <CustomersSection
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
        message={message}
        orders={orders}
        filteredOrders={filteredOrders}
        customers={customers}
        hubs={hubs}
        normalizedSearch={normalizedSearch}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        createOrder={createOrder}
      />
    );
  }

  if (location.pathname === "/admin/admins") {
    return (
      <AdminsSection
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
        message={message}
        admins={admins.filter((admin) =>
          matchesSearch(
            [admin.name, admin.role, formatStatusLabel(admin.role), admin.address, formatDateTime(admin.created_at)],
            normalizedSearch
          )
        )}
        adminForm={adminForm}
        setAdminForm={setAdminForm}
        createAdmin={createAdmin}
      />
    );
  }

  if (location.pathname === "/admin/delivery-agents") {
    return (
      <DeliveryAgentsSection
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
        message={message}
        riders={filteredRiders}
        filteredOrders={filteredOrders}
        riderForm={riderForm}
        setRiderForm={setRiderForm}
        createRider={createRider}
        toggleRiderAvailability={toggleRiderAvailability}
        removeRider={removeRider}
        unassignOrder={unassignOrder}
      />
    );
  }

  if (location.pathname === "/admin/hubs") {
    return (
      <HubsSection
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
        message={message}
        orders={filteredOrders}
        hubs={hubs.filter((hub) => matchesSearch([hub.name, hub.latitude, hub.longitude], normalizedSearch))}
        hubForm={hubForm}
        setHubForm={setHubForm}
        createHub={createHub}
      />
    );
  }

  if (location.pathname === "/admin/audit-logs") {
    return (
      <AuditLogsSection
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
        message={message}
        auditLogs={auditLogs}
        filteredAuditLogs={filteredAuditLogs}
      />
    );
  }

  return (
    <OverviewSection
      selectedDate={selectedDate}
      onSelectedDateChange={onSelectedDateChange}
      message={message}
      riders={filteredRiders}
      hubs={hubs}
      customers={customers}
      filteredOrders={filteredOrders}
      filteredAuditLogs={filteredAuditLogs}
    />
  );
}
