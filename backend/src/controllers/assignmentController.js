import { getAvailableRiders, getRiderById } from "../models/riderModel.js";
import { getOrderById } from "../models/orderModel.js";
import { deleteAssignmentByOrderId, getAssignmentByOrderId, getAssignments, upsertAssignment } from "../models/assignmentModel.js";
import { createAuditLog } from "../models/auditModel.js";
import { calculateDistance } from "../utils/distance.js";
import { addDeliveryStatus } from "../models/statusModel.js";
import { updateOrderStatus } from "../models/orderModel.js";

const getAssignableOrder = async (orderId) => {
  const orderResult = await getOrderById(orderId);

  if (!orderResult.rows.length) {
    return { error: { status: 404, message: "Order not found" } };
  }

  if (orderResult.rows[0].status === "delivered") {
    return { error: { status: 400, message: "Delivered orders cannot be reassigned" } };
  }

  return { order: orderResult.rows[0] };
};

export const listAssignments = async (req, res) => {
  const result = await getAssignments();
  return res.json(result.rows);
};

export const assignRiderManually = async (req, res) => {
  const orderId = Number(req.params.orderId);
  const { riderId, eta } = req.body;
  const { error } = await getAssignableOrder(orderId);

  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  const riderResult = await getRiderById(Number(riderId));
  if (!riderResult.rows.length) {
    return res.status(404).json({ message: "Rider not found" });
  }

  const rider = riderResult.rows[0];
  const currentAssignment = await getAssignmentByOrderId(orderId);
  const isSameRider = currentAssignment.rows[0]?.rider_id === rider.id;

  if (!rider.can_take_orders && !isSameRider) {
    return res.status(400).json({ message: `${rider.name} is currently busy or unavailable` });
  }

  const assignment = await upsertAssignment({ orderId, riderId: rider.id, eta });
  await createAuditLog({
    userId: req.user.id,
    action: "RIDER_ASSIGNED_MANUAL",
    metadata: { orderId, riderId: rider.id }
  });

  return res.json(assignment.rows[0]);
};

export const assignNearestRider = async (req, res) => {
  const orderId = Number(req.params.orderId);
  const { order, error } = await getAssignableOrder(orderId);

  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

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

export const unassignOrder = async (req, res) => {
  const orderId = Number(req.params.orderId);
  const { order, error } = await getAssignableOrder(orderId);

  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  const assignmentResult = await getAssignmentByOrderId(orderId);

  if (!assignmentResult.rows.length) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  const deletedAssignment = await deleteAssignmentByOrderId(orderId);

  if (order.status !== "picked") {
    await updateOrderStatus(orderId, "picked");
    await addDeliveryStatus(orderId, "picked");
  }

  await createAuditLog({
    userId: req.user.id,
    action: "ORDER_UNASSIGNED",
    metadata: { orderId, riderId: assignmentResult.rows[0].rider_id }
  });

  return res.json({
    message: "Order removed from rider queue",
    assignment: deletedAssignment.rows[0]
  });
};

export const rejectAssignment = async (req, res) => {
  const orderId = Number(req.params.orderId);
  const riderId = Number(req.params.riderId);
  const assignmentResult = await getAssignmentByOrderId(orderId);

  if (!assignmentResult.rows.length) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  const assignment = assignmentResult.rows[0];
  if (assignment.rider_id !== riderId) {
    return res.status(403).json({ message: "You can only reject your own assigned orders" });
  }

  const deletedAssignment = await deleteAssignmentByOrderId(orderId);
  await updateOrderStatus(orderId, "picked");
  await addDeliveryStatus(orderId, "picked");
  await createAuditLog({
    userId: req.user.id,
    action: "RIDER_REJECTED_ORDER",
    metadata: { orderId, riderId }
  });

  return res.json({
    message: "Order rejected and returned for reassignment",
    assignment: deletedAssignment.rows[0]
  });
};
