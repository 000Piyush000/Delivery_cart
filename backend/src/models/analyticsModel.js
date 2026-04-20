import pool from "../config/db.js";

export const getAnalyticsSummary = async () =>
  pool.query(
    `SELECT
        ROUND(
          COALESCE(
            100.0 * COUNT(*) FILTER (WHERE status = 'delivered' AND delivered_at <= promised_at)
            / NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0),
            0
          ),
          2
        ) AS on_time_delivery_rate,
        ROUND(
          COALESCE(
            100.0 * (SELECT COUNT(*) FROM disputes) / NULLIF(COUNT(*), 0),
            0
          ),
          2
        ) AS dispute_rate
     FROM orders`
  );

export const getRiderPerformance = async () =>
  pool.query(
    `SELECT riders.id, riders.name,
            COUNT(assignments.order_id) AS total_assignments,
            COUNT(assignments.order_id) FILTER (WHERE orders.status = 'delivered') AS delivered_orders,
            ROUND(
              COALESCE(
                100.0 * COUNT(assignments.order_id) FILTER (
                  WHERE orders.status = 'delivered' AND orders.delivered_at <= orders.promised_at
                ) / NULLIF(COUNT(assignments.order_id) FILTER (WHERE orders.status = 'delivered'), 0),
                0
              ),
              2
            ) AS on_time_rate
     FROM riders
     LEFT JOIN assignments ON assignments.rider_id = riders.id
     LEFT JOIN orders ON orders.id = assignments.order_id
     GROUP BY riders.id, riders.name
     ORDER BY delivered_orders DESC, riders.name`
  );

export const getDatabaseEntityCounts = async () =>
  pool.query(
    `SELECT 'orders' AS entity_key, COUNT(*)::INT AS record_count FROM orders
     UNION ALL
     SELECT 'customers' AS entity_key, COUNT(*)::INT AS record_count FROM users WHERE role = 'customer'
     UNION ALL
     SELECT 'riders' AS entity_key, COUNT(*)::INT AS record_count FROM riders
     UNION ALL
     SELECT 'hubs' AS entity_key, COUNT(*)::INT AS record_count FROM hubs
     UNION ALL
     SELECT 'assignments' AS entity_key, COUNT(*)::INT AS record_count FROM assignments
     UNION ALL
     SELECT 'audit_logs' AS entity_key, COUNT(*)::INT AS record_count FROM audit_logs`
  );

export const getDatabaseColumns = async (tableNames) =>
  pool.query(
    `SELECT table_name, column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])
     ORDER BY table_name, ordinal_position`,
    [tableNames]
  );

const databasePreviewQueries = {
  orders: `
    SELECT id, customer_id, hub_id, status, created_at
    FROM orders
    ORDER BY created_at DESC NULLS LAST, id DESC
    LIMIT $1
  `,
  customers: `
    SELECT id, name, role, address, created_at
    FROM users
    WHERE role = 'customer'
    ORDER BY created_at DESC NULLS LAST, id DESC
    LIMIT $1
  `,
  riders: `
    SELECT id, name, location, availability, latitude, longitude
    FROM riders
    ORDER BY id DESC
    LIMIT $1
  `,
  hubs: `
    SELECT id, name, latitude, longitude
    FROM hubs
    ORDER BY id DESC
    LIMIT $1
  `,
  assignments: `
    SELECT order_id, rider_id, eta, assigned_at
    FROM assignments
    ORDER BY assigned_at DESC NULLS LAST, order_id DESC
    LIMIT $1
  `,
  audit_logs: `
    SELECT id, user_id, action, timestamp
    FROM audit_logs
    ORDER BY timestamp DESC NULLS LAST, id DESC
    LIMIT $1
  `
};

export const getDatabaseEntityPreviewRows = async (previewLimit = 3) => {
  const entries = await Promise.all(
    Object.entries(databasePreviewQueries).map(async ([entityKey, query]) => {
      try {
        const result = await pool.query(query, [previewLimit]);
        return [entityKey, result.rows];
      } catch (error) {
        console.error(`Unable to load preview rows for ${entityKey}`, error.message);
        return [entityKey, []];
      }
    })
  );

  return Object.fromEntries(entries);
};
