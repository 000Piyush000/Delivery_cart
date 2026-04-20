import { useState } from "react";

const toRadians = (value) => (value * Math.PI) / 180;
const INITIAL_VISIBLE_STOPS = 4;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const parseEtaMinutes = (eta) => {
  if (!eta) {
    return 0;
  }

  const match = String(eta).match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

export default function RouteVisualization({ orders, riders, hubs }) {
  const [showAllAssigned, setShowAllAssigned] = useState(false);
  const [showAllUnassigned, setShowAllUnassigned] = useState(false);

  const riderMap = riders.reduce((accumulator, rider) => {
    accumulator[rider.id] = rider;
    return accumulator;
  }, {});

  const hubMap = hubs.reduce((accumulator, hub) => {
    accumulator[hub.id] = hub;
    return accumulator;
  }, {});

  const orderedStops = [...orders].sort((first, second) => {
    const firstTime = new Date(first.promised_at || first.created_at).getTime();
    const secondTime = new Date(second.promised_at || second.created_at).getTime();
    return firstTime - secondTime;
  });

  const buildRouteSummary = (routeOrders) => {
    const totalDistanceKm = routeOrders.reduce((sum, order) => {
      const routeStart = hubMap[order.hub_id] || riderMap[order.rider_id];
      return (
        sum +
        calculateDistance(
          Number(routeStart?.latitude || 0),
          Number(routeStart?.longitude || 0),
          Number(order.latitude || 0),
          Number(order.longitude || 0)
        )
      );
    }, 0);

    const totalEtaMinutes = routeOrders.reduce((sum, order) => sum + parseEtaMinutes(order.eta), 0);

    return {
      totalDistanceKm,
      totalEtaMinutes
    };
  };

  const unassignedStops = orderedStops.filter((order) => !order.rider_id);
  const assignedStops = orderedStops.filter((order) => order.rider_id);
  const unassignedSummary = buildRouteSummary(unassignedStops);
  const assignedSummary = buildRouteSummary(assignedStops);
  const visibleUnassignedStops = showAllUnassigned ? unassignedStops : unassignedStops.slice(0, INITIAL_VISIBLE_STOPS);
  const visibleAssignedStops = showAllAssigned ? assignedStops : assignedStops.slice(0, INITIAL_VISIBLE_STOPS);
  const canToggleUnassigned = unassignedStops.length > INITIAL_VISIBLE_STOPS;
  const canToggleAssigned = assignedStops.length > INITIAL_VISIBLE_STOPS;

  return (
    <div className="route-board">
      <div className="route-card">
        <div className="route-card-header">
          <div>
            <p className="section-kicker">Needs assignment</p>
            <h3>Unassigned deliveries</h3>
          </div>
          <div className="route-metrics">
            <div>
              <strong>{unassignedStops.length}</strong>
              <span>stops</span>
            </div>
            <div>
              <strong>{unassignedSummary.totalDistanceKm.toFixed(1)} km</strong>
              <span>distance</span>
            </div>
            <div>
              <strong>{unassignedSummary.totalEtaMinutes || "--"} min</strong>
              <span>eta</span>
            </div>
          </div>
        </div>
        <div className="route-sequence">
          {visibleUnassignedStops.map((stop, index) => (
            <div className="route-stop" key={`unassigned-${stop.id}`}>
              <div className="route-index">{index + 1}</div>
              <div className="route-stop-body">
                <div className="route-stop-topline">
                  <strong>Order #{stop.id}</strong>
                  <span>{stop.customer_name}</span>
                </div>
                <p>{stop.delivery_address}</p>
                <div className="route-meta">
                  <span>{stop.hub_name}</span>
                  <span>{stop.eta || "ETA pending"}</span>
                  <span>{stop.status.replaceAll("_", " ")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!unassignedStops.length ? <p className="muted empty-state-text">No unassigned deliveries right now.</p> : null}
        {canToggleUnassigned ? (
          <button className="ghost-button audit-toggle-button" type="button" onClick={() => setShowAllUnassigned((current) => !current)}>
            {showAllUnassigned ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>

      <div className="route-card">
        <div className="route-card-header">
          <div>
            <p className="section-kicker">Assigned route</p>
            <h3>Assigned deliveries</h3>
          </div>
          <div className="route-metrics">
            <div>
              <strong>{assignedStops.length}</strong>
              <span>stops</span>
            </div>
            <div>
              <strong>{assignedSummary.totalDistanceKm.toFixed(1)} km</strong>
              <span>distance</span>
            </div>
            <div>
              <strong>{assignedSummary.totalEtaMinutes || "--"} min</strong>
              <span>eta</span>
            </div>
          </div>
        </div>
        <div className="route-sequence">
          {visibleAssignedStops.map((stop, index) => (
            <div className="route-stop" key={`assigned-${stop.id}`}>
              <div className="route-index">{index + 1}</div>
              <div className="route-stop-body">
                <div className="route-stop-topline">
                  <strong>Order #{stop.id}</strong>
                  <span>{stop.rider_name || stop.customer_name}</span>
                </div>
                <p>{stop.delivery_address}</p>
                <div className="route-meta">
                  <span>{stop.hub_name}</span>
                  <span>{stop.eta || "ETA pending"}</span>
                  <span>{stop.status.replaceAll("_", " ")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!assignedStops.length ? <p className="muted empty-state-text">No assigned deliveries right now.</p> : null}
        {canToggleAssigned ? (
          <button className="ghost-button audit-toggle-button" type="button" onClick={() => setShowAllAssigned((current) => !current)}>
            {showAllAssigned ? "Show less" : "Show more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
