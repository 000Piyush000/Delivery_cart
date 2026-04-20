import pool from "../config/db.js";

export const createOrder = async ({
  customerId,
  hubId,
  status,
  pickupAddress,
  deliveryAddress,
  latitude,
  longitude,
  promisedAt
}) =>
  pool.query(
    `INSERT INTO orders
      (customer_id, hub_id, status, pickup_address, delivery_address, latitude, longitude, promised_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [customerId, hubId, status, pickupAddress, deliveryAddress, latitude, longitude, promisedAt]
  );

export const getOrders = async () =>
  pool.query(
    `SELECT orders.*, users.name AS customer_name, hubs.name AS hub_name,
            assignments.rider_id, riders.name AS rider_name, assignments.eta,
            rider_feedback.average_feedback_rating,
            rider_feedback.feedback_count
     FROM orders
     LEFT JOIN users ON users.id = orders.customer_id
     LEFT JOIN hubs ON hubs.id = orders.hub_id
     LEFT JOIN assignments ON assignments.order_id = orders.id
     LEFT JOIN riders ON riders.id = assignments.rider_id
     LEFT JOIN (
       SELECT assignments.rider_id,
              ROUND(AVG(orders.customer_feedback_rating)::numeric, 1) AS average_feedback_rating,
              COUNT(orders.customer_feedback_rating)::INT AS feedback_count
       FROM assignments
       JOIN orders ON orders.id = assignments.order_id
       WHERE orders.customer_feedback_rating IS NOT NULL
       GROUP BY assignments.rider_id
     ) AS rider_feedback ON rider_feedback.rider_id = assignments.rider_id
     ORDER BY orders.created_at DESC`
  );

export const getOrderById = async (id) =>
  pool.query(
    `SELECT orders.*, users.name AS customer_name, hubs.name AS hub_name
     FROM orders
     LEFT JOIN users ON users.id = orders.customer_id
     LEFT JOIN hubs ON hubs.id = orders.hub_id
     WHERE orders.id = $1`,
    [id]
  );

export const updateOrderStatus = async (orderId, status) =>
  pool.query(
    `UPDATE orders
     SET status = $2,
         delivered_at = CASE WHEN $3 = 'delivered' THEN NOW() ELSE delivered_at END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [orderId, status, status]
  );

export const saveOrderFeedback = async ({ orderId, customerId, rating, comment }) =>
  pool.query(
    `UPDATE orders
     SET customer_feedback_rating = $3,
         customer_feedback_comment = $4,
         customer_feedback_created_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
       AND customer_id = $2
     RETURNING *`,
    [orderId, customerId, rating, comment]
  );

export const getOrdersForCustomer = async (customerId) =>
  pool.query(
    `SELECT orders.*, assignments.rider_id, riders.name AS rider_name, assignments.eta,
            rider_feedback.average_feedback_rating,
            rider_feedback.feedback_count
     FROM orders
     LEFT JOIN assignments ON assignments.order_id = orders.id
     LEFT JOIN riders ON riders.id = assignments.rider_id
     LEFT JOIN (
       SELECT assignments.rider_id,
              ROUND(AVG(orders.customer_feedback_rating)::numeric, 1) AS average_feedback_rating,
              COUNT(orders.customer_feedback_rating)::INT AS feedback_count
       FROM assignments
       JOIN orders ON orders.id = assignments.order_id
       WHERE orders.customer_feedback_rating IS NOT NULL
       GROUP BY assignments.rider_id
     ) AS rider_feedback ON rider_feedback.rider_id = assignments.rider_id
     WHERE orders.customer_id = $1
     ORDER BY orders.created_at DESC`,
    [customerId]
  );

export const getDailyReportData = async () =>
  pool.query(
    `SELECT
        COUNT(*) AS total_orders,
        COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_orders,
        COUNT(*) FILTER (WHERE delivered_at <= promised_at) AS on_time_orders,
        COUNT(*) FILTER (WHERE status != 'delivered') AS open_orders
     FROM orders`
  );
