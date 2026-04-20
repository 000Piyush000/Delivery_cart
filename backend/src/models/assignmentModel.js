import pool from "../config/db.js";

export const upsertAssignment = async ({ orderId, riderId, eta }) =>
  pool.query(
    `INSERT INTO assignments (order_id, rider_id, eta)
     VALUES ($1, $2, $3)
     ON CONFLICT (order_id)
     DO UPDATE SET rider_id = EXCLUDED.rider_id, eta = EXCLUDED.eta, assigned_at = NOW()
     RETURNING *`,
    [orderId, riderId, eta]
  );

export const getAssignments = async () =>
  pool.query(
    `SELECT assignments.*, riders.name AS rider_name, orders.status AS order_status,
            orders.delivery_address, orders.created_at AS order_created_at,
            orders.promised_at, users.name AS customer_name, hubs.name AS hub_name
     FROM assignments
     JOIN riders ON riders.id = assignments.rider_id
     JOIN orders ON orders.id = assignments.order_id
     LEFT JOIN users ON users.id = orders.customer_id
     LEFT JOIN hubs ON hubs.id = orders.hub_id
     ORDER BY assignments.assigned_at DESC`
  );

export const getAssignmentByOrderId = async (orderId) =>
  pool.query(`SELECT * FROM assignments WHERE order_id = $1`, [orderId]);

export const deleteAssignmentByOrderId = async (orderId) =>
  pool.query(`DELETE FROM assignments WHERE order_id = $1 RETURNING *`, [orderId]);
