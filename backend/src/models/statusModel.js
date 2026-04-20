import pool from "../config/db.js";

export const addDeliveryStatus = async (orderId, status) =>
  pool.query(
    `INSERT INTO delivery_status (order_id, status)
     VALUES ($1, $2)
     RETURNING *`,
    [orderId, status]
  );

export const getDeliveryStatuses = async (orderId) =>
  pool.query(
    `SELECT * FROM delivery_status
     WHERE order_id = $1
     ORDER BY timestamp DESC`,
    [orderId]
  );