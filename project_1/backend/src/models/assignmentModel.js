import { query } from "../config/db.js";

export const upsertAssignment = async ({ orderId, riderId, eta }) =>
  query(
    `INSERT INTO assignments (order_id, rider_id, eta)
     VALUES ($1, $2, $3)
     ON CONFLICT (order_id)
     DO UPDATE SET rider_id = EXCLUDED.rider_id, eta = EXCLUDED.eta, assigned_at = NOW()
     RETURNING *`,
    [orderId, riderId, eta]
  );

export const getAssignments = async () =>
  query(
    `SELECT assignments.*, riders.name AS rider_name, orders.status AS order_status
     FROM assignments
     JOIN riders ON riders.id = assignments.rider_id
     JOIN orders ON orders.id = assignments.order_id
     ORDER BY assignments.assigned_at DESC`
  );
