import {
  createOrder,
  getOrderById,
  getOrders,
  getOrdersForCustomer,
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
    deliveryAddress,
    latitude,
    longitude,
    promisedAt
  } = req.body;

  const orderResult = await createOrder({
    customerId,
    hubId,
    status: "picked",
    deliveryAddress,
    latitude,
    longitude,
    promisedAt
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
