import { query } from "../config/db.js";

export const createOrder = async ({
  customerId,
  hubId,
  status,
  deliveryAddress,
  latitude,
  longitude,
  promisedAt
}) =>
  query(
    `INSERT INTO orders
      (customer_id, hub_id, status, delivery_address, latitude, longitude, promised_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [customerId, hubId, status, deliveryAddress, latitude, longitude, promisedAt]
  );

export const getOrders = async () =>
  query(
    `SELECT orders.*, users.name AS customer_name, hubs.name AS hub_name,
            assignments.rider_id, riders.name AS rider_name, assignments.eta
     FROM orders
     LEFT JOIN users ON users.id = orders.customer_id
     LEFT JOIN hubs ON hubs.id = orders.hub_id
     LEFT JOIN assignments ON assignments.order_id = orders.id
     LEFT JOIN riders ON riders.id = assignments.rider_id
     ORDER BY orders.created_at DESC`
  );

export const getOrderById = async (id) =>
  query(
    `SELECT orders.*, users.name AS customer_name, hubs.name AS hub_name
     FROM orders
     LEFT JOIN users ON users.id = orders.customer_id
     LEFT JOIN hubs ON hubs.id = orders.hub_id
     WHERE orders.id = $1`,
    [id]
  );

export const updateOrderStatus = async (orderId, status) =>
  query(
    `UPDATE orders
     SET status = $2,
         delivered_at = CASE WHEN $2 = 'delivered' THEN NOW() ELSE delivered_at END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [orderId, status]
  );

export const getOrdersForCustomer = async (customerId) =>
  query(
    `SELECT orders.*, assignments.rider_id, riders.name AS rider_name, assignments.eta
     FROM orders
     LEFT JOIN assignments ON assignments.order_id = orders.id
     LEFT JOIN riders ON riders.id = assignments.rider_id
     WHERE orders.customer_id = $1
     ORDER BY orders.created_at DESC`,
    [customerId]
  );

export const getDailyReportData = async () =>
  query(
    `SELECT
        COUNT(*) AS total_orders,
        COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_orders,
        COUNT(*) FILTER (WHERE delivered_at <= promised_at) AS on_time_orders,
        COUNT(*) FILTER (WHERE status != 'delivered') AS open_orders
     FROM orders`
  );
