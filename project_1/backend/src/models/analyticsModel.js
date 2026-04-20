import { query } from "../config/db.js";

export const getAnalyticsSummary = async () =>
  query(
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
  query(
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
