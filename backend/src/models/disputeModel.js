import pool from "../config/db.js";

export const createDispute = async ({ orderId, reason, customerId }) =>
  pool.query(
    `INSERT INTO disputes (order_id, reason, status, customer_id)
     VALUES ($1, $2, 'open', $3)
     RETURNING *`,
    [orderId, reason, customerId]
  );

export const getDisputes = async () =>
  pool.query(
    `SELECT disputes.*, orders.status AS order_status, users.name AS customer_name
     FROM disputes
     LEFT JOIN orders ON orders.id = disputes.order_id
     LEFT JOIN users ON users.id = disputes.customer_id
     ORDER BY disputes.updated_at DESC`
  );

export const updateDispute = async ({ id, status, resolution, supportAgentId }) =>
  pool.query(
    `UPDATE disputes
     SET status = $2, resolution = $3, support_agent_id = $4, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status, resolution, supportAgentId]
  );
