import { query } from "../config/db.js";

export const createAuditLog = async ({ userId, action, metadata = null }) => {
  return query(
    `INSERT INTO audit_logs (user_id, action, metadata)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, action, metadata]
  );
};

export const getAuditLogs = async () =>
  query(
    `SELECT audit_logs.*, users.name AS user_name, users.role AS user_role
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.user_id
     ORDER BY audit_logs.timestamp DESC`
  );
