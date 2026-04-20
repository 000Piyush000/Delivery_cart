import pool from "../config/db.js";

export const createAuditLog = async ({ userId, action, metadata = null }) => {
  return pool.query(
    `INSERT INTO audit_logs (user_id, action, metadata)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, action, metadata]
  );
};

export const getAuditLogs = async ({ limit, excludeActions = [] } = {}) => {
  const params = [];
  const whereClauses = [];

  if (excludeActions.length) {
    params.push(excludeActions);
    whereClauses.push(`audit_logs.action <> ALL($${params.length})`);
  }

  if (typeof limit === "number") {
    params.push(limit);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const limitSql = typeof limit === "number" ? `LIMIT $${params.length}` : "";

  return pool.query(
    `SELECT audit_logs.*, users.name AS user_name, users.role AS user_role
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.user_id
     ${whereSql}
     ORDER BY audit_logs.timestamp DESC
     ${limitSql}`,
    params
  );
};

export const deleteAuditLogsByAction = async (action) =>
  pool.query(`DELETE FROM audit_logs WHERE action = $1`, [action]);
