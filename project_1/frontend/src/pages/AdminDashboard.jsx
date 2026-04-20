import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [manualSelection, setManualSelection] = useState({});
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    customerId: "",
    hubId: "",
    deliveryAddress: "221B Fleet Street, Delhi",
    latitude: "28.6139",
    longitude: "77.2090",
    promisedAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });
  const [hubForm, setHubForm] = useState({
    name: "Gurugram West Hub",
    latitude: "28.4595",
    longitude: "77.0266"
  });

  const loadData = async () => {
    const [ordersData, ridersData, assignmentsData, hubsData, customersData] = await Promise.all([
      apiRequest("/orders"),
      apiRequest("/riders"),
      apiRequest("/assignments"),
      apiRequest("/hubs"),
      apiRequest("/users/role/customer")
    ]);
    setOrders(ordersData);
    setRiders(ridersData);
    setAssignments(assignmentsData);
    setHubs(hubsData);
    setCustomers(customersData);
  };

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, []);

  const autoAssign = async (orderId) => {
    await apiRequest(`/assignments/${orderId}/auto`, { method: "POST" });
    setMessage(`Auto-assigned nearest rider for order #${orderId}`);
    loadData();
  };

  const manualAssign = async (orderId) => {
    const riderId = manualSelection[orderId];
    if (!riderId) {
      setMessage("Select a rider before using manual assignment.");
      return;
    }

    await apiRequest(`/assignments/${orderId}/manual`, {
      method: "POST",
      body: JSON.stringify({ riderId: Number(riderId), eta: "30 mins" })
    });
    setMessage(`Manually assigned rider for order #${orderId}`);
    loadData();
  };

  const createOrder = async (event) => {
    event.preventDefault();
    await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify({
        customerId: Number(form.customerId),
        hubId: Number(form.hubId),
        deliveryAddress: form.deliveryAddress,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        promisedAt: new Date(form.promisedAt).toISOString()
      })
    });
    setMessage("Order created successfully.");
    loadData();
  };

  const createHub = async (event) => {
    event.preventDefault();
    await apiRequest("/hubs", {
      method: "POST",
      body: JSON.stringify({
        name: hubForm.name,
        latitude: Number(hubForm.latitude),
        longitude: Number(hubForm.longitude)
      })
    });
    setMessage("Hub created successfully.");
    loadData();
  };

  return (
    <section>
      <div className="hero">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Operations dashboard</h2>
        </div>
        <p className="muted">Create, assign, and monitor deliveries across hubs.</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Orders" value={orders.length} />
        <StatCard label="Riders" value={riders.length} />
        <StatCard label="Assignments" value={assignments.length} />
      </div>

      {message ? <p className="banner">{message}</p> : null}

      <div className="two-column">
        <div className="card">
          <h3>Create order</h3>
          <form className="form-grid" onSubmit={createOrder}>
            <label>
              Customer
              <select
                value={form.customerId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, customerId: event.target.value }))
                }
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
              Delivery address
              <input
                value={form.deliveryAddress}
                onChange={(event) =>
                  setForm((current) => ({ ...current, deliveryAddress: event.target.value }))
                }
              />
            </label>
            <label>
              Latitude
              <input
                value={form.latitude}
                onChange={(event) =>
                  setForm((current) => ({ ...current, latitude: event.target.value }))
                }
              />
            </label>
            <label>
              Longitude
              <input
                value={form.longitude}
                onChange={(event) =>
                  setForm((current) => ({ ...current, longitude: event.target.value }))
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

        <div className="card">
          <h3>Create hub</h3>
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
      </div>

      <div className="two-column">
        <div className="card">
          <h3>Orders</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Hub</th>
                <th>Rider</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.status}</td>
                  <td>{order.hub_name}</td>
                  <td>{order.rider_name || "Unassigned"}</td>
                  <td>
                    <div className="action-stack">
                      <button onClick={() => autoAssign(order.id)}>Auto assign</button>
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
                            {rider.name}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => manualAssign(order.id)}>Manual assign</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Riders</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Availability</th>
                <th>Coordinates</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((rider) => (
                <tr key={rider.id}>
                  <td>{rider.name}</td>
                  <td>{rider.availability ? "Available" : "Busy"}</td>
                  <td>
                    {rider.latitude}, {rider.longitude}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
