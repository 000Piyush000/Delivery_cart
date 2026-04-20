import { getAvailableRiders, getRiderById } from "../models/riderModel.js";
import { getOrderById } from "../models/orderModel.js";
import { getAssignments, upsertAssignment } from "../models/assignmentModel.js";
import { createAuditLog } from "../models/auditModel.js";
import { calculateDistance } from "../utils/distance.js";

export const listAssignments = async (req, res) => {
  const result = await getAssignments();
  return res.json(result.rows);
};

export const assignRiderManually = async (req, res) => {
  const orderId = Number(req.params.orderId);
  const { riderId, eta } = req.body;

  const riderResult = await getRiderById(riderId);
  if (!riderResult.rows.length) {
    return res.status(404).json({ message: "Rider not found" });
  }

  const assignment = await upsertAssignment({ orderId, riderId, eta });
  await createAuditLog({
    userId: req.user.id,
    action: "RIDER_ASSIGNED_MANUAL",
    metadata: { orderId, riderId }
  });

  return res.json(assignment.rows[0]);
};

export const assignNearestRider = async (req, res) => {
  const orderId = Number(req.params.orderId);
  const orderResult = await getOrderById(orderId);

  if (!orderResult.rows.length) {
    return res.status(404).json({ message: "Order not found" });
  }

  const order = orderResult.rows[0];
  const ridersResult = await getAvailableRiders();

  if (!ridersResult.rows.length) {
    return res.status(404).json({ message: "No available riders found" });
  }

  // Basic geodesic distance is enough here for a demo auto-assignment strategy.
  const nearestRider = ridersResult.rows
    .map((rider) => ({
      ...rider,
      distanceKm: calculateDistance(
        Number(order.latitude),
        Number(order.longitude),
        Number(rider.latitude),
        Number(rider.longitude)
      )
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];

  const eta = `${Math.max(15, Math.round(nearestRider.distanceKm * 7))} mins`;
  const assignment = await upsertAssignment({
    orderId,
    riderId: nearestRider.id,
    eta
  });

  await createAuditLog({
    userId: req.user.id,
    action: "RIDER_ASSIGNED_AUTO",
    metadata: {
      orderId,
      riderId: nearestRider.id,
      distanceKm: Number(nearestRider.distanceKm.toFixed(2))
    }
  });

  return res.json({
    assignment: assignment.rows[0],
    rider: nearestRider
  });
};
