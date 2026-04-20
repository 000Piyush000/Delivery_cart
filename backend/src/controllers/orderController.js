import {
  createOrder,
  getOrderById,
  getOrders,
  getOrdersForCustomer,
  saveOrderFeedback,
  updateOrderStatus
} from "../models/orderModel.js";
import { addDeliveryStatus, getDeliveryStatuses } from "../models/statusModel.js";
import { createAuditLog } from "../models/auditModel.js";

export const listOrders = async (req, res) => {
  const result = req.user.role === "customer" ? await getOrdersForCustomer(req.user.id) : await getOrders();
  return res.json(result.rows);
};

export const createNewOrder = async (req, res) => {
  const {
    customerId,
    hubId,
    pickupAddress,
    deliveryAddress,
    latitude,
    longitude,
    promisedAt
  } = req.body;
  const resolvedCustomerId = req.user.role === "customer" ? req.user.id : customerId;
  const numericHubId = Number(hubId);
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  const promisedDate = promisedAt ? new Date(promisedAt) : null;

  if (!Number.isInteger(Number(resolvedCustomerId))) {
    return res.status(400).json({ message: "A valid customer is required" });
  }

  if (!Number.isInteger(numericHubId) || numericHubId <= 0) {
    return res.status(400).json({ message: "Please select a hub before placing the order" });
  }

  if (!pickupAddress?.trim() || !deliveryAddress?.trim()) {
    return res.status(400).json({ message: "Pickup and delivery addresses are required" });
  }

  if (!Number.isFinite(numericLatitude) || !Number.isFinite(numericLongitude)) {
    return res.status(400).json({ message: "A valid delivery location is required" });
  }

  if (!(promisedDate instanceof Date) || Number.isNaN(promisedDate.getTime())) {
    return res.status(400).json({ message: "Please provide a valid promised delivery time" });
  }

  const orderResult = await createOrder({
    customerId: Number(resolvedCustomerId),
    hubId: numericHubId,
    status: "picked",
    pickupAddress: pickupAddress.trim(),
    deliveryAddress: deliveryAddress.trim(),
    latitude: numericLatitude,
    longitude: numericLongitude,
    promisedAt: promisedDate.toISOString()
  });

  await addDeliveryStatus(orderResult.rows[0].id, "picked");
  await createAuditLog({
    userId: req.user.id,
    action: "ORDER_CREATED",
    metadata: { orderId: orderResult.rows[0].id }
  });

  return res.status(201).json(orderResult.rows[0]);
};

export const trackOrder = async (req, res) => {
  const orderId = Number(req.params.id);
  const orderResult = await getOrderById(orderId);

  if (!orderResult.rows.length) {
    return res.status(404).json({ message: "Order not found" });
  }

  const statuses = await getDeliveryStatuses(orderId);

  return res.json({
    order: orderResult.rows[0],
    timeline: statuses.rows
  });
};

export const updateStatus = async (req, res) => {
  const orderId = Number(req.params.id);
  const { status } = req.body;

  const allowedStatuses = ["picked", "out_for_delivery", "delivered"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const result = await updateOrderStatus(orderId, status);
  if (!result.rows.length) {
    return res.status(404).json({ message: "Order not found" });
  }

  await addDeliveryStatus(orderId, status);
  await createAuditLog({
    userId: req.user.id,
    action: "ORDER_STATUS_UPDATED",
    metadata: { orderId, status }
  });

  return res.json(result.rows[0]);
};

export const submitOrderFeedback = async (req, res) => {
  const orderId = Number(req.params.id);
  const { rating, comment = "" } = req.body;
  const numericRating = Number(rating);
  const trimmedComment = String(comment).trim();
  const orderResult = await getOrderById(orderId);

  if (!orderResult.rows.length) {
    return res.status(404).json({ message: "Order not found" });
  }

  const order = orderResult.rows[0];
  if (req.user.role !== "customer" || order.customer_id !== req.user.id) {
    return res.status(403).json({ message: "You can only submit feedback for your own orders" });
  }

  if (order.status !== "delivered") {
    return res.status(400).json({ message: "Feedback can only be submitted after delivery" });
  }

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: "Rating must be a whole number between 1 and 5" });
  }

  if (order.customer_feedback_created_at) {
    return res.status(400).json({ message: "Feedback has already been submitted for this order" });
  }

  const result = await saveOrderFeedback({
    orderId,
    customerId: req.user.id,
    rating: numericRating,
    comment: trimmedComment
  });

  if (!result.rows.length) {
    return res.status(500).json({ message: "Unable to save feedback for this order" });
  }

  await createAuditLog({
    userId: req.user.id,
    action: "ORDER_FEEDBACK_SUBMITTED",
    metadata: { orderId, rating: numericRating }
  });

  return res.json(result.rows[0]);
};
