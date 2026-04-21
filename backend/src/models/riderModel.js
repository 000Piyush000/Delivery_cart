import pool from "../config/db.js";

const riderSummarySelect = `
  SELECT
    riders.*,
    users.id AS user_id,
    users.role,
    users.created_at,
    COUNT(assignments.order_id) FILTER (
      WHERE COALESCE(latest_delivery_status.status, orders.status) IS DISTINCT FROM 'delivered'
    )::INT AS active_assignments,
    COUNT(assignments.order_id)::INT AS total_assignments,
    CASE
      WHEN riders.availability = FALSE
        OR COUNT(assignments.order_id) FILTER (
          WHERE COALESCE(latest_delivery_status.status, orders.status) IS DISTINCT FROM 'delivered'
        ) >= 3
      THEN 'busy'
      ELSE 'available'
    END AS workload_status,
    (
      riders.availability = TRUE
      AND COUNT(assignments.order_id) FILTER (
        WHERE COALESCE(latest_delivery_status.status, orders.status) IS DISTINCT FROM 'delivered'
      ) < 3
    ) AS can_take_orders,
    ROUND(AVG(orders.customer_feedback_rating) FILTER (
      WHERE orders.customer_feedback_rating IS NOT NULL
    )::numeric, 1) AS average_feedback_rating,
    COUNT(orders.customer_feedback_rating)::INT AS feedback_count
  FROM riders
  LEFT JOIN users ON users.id = riders.user_id
  LEFT JOIN assignments ON assignments.rider_id = riders.id
  LEFT JOIN orders ON orders.id = assignments.order_id
  LEFT JOIN LATERAL (
    SELECT delivery_status.status
    FROM delivery_status
    WHERE delivery_status.order_id = orders.id
    ORDER BY delivery_status.timestamp DESC, delivery_status.id DESC
    LIMIT 1
  ) AS latest_delivery_status ON TRUE
`;

const riderSummaryGroupBy = `
  GROUP BY riders.id, users.id, users.role, users.created_at
`;

export const getRiders = async () =>
  pool.query(`${riderSummarySelect} ${riderSummaryGroupBy} ORDER BY riders.name`);

export const getRiderById = async (id) =>
  pool.query(`${riderSummarySelect} WHERE riders.id = $1 ${riderSummaryGroupBy}`, [id]);

export const getRiderByUserId = async (userId) =>
  pool.query(`SELECT * FROM riders WHERE user_id = $1`, [userId]);

export const getAvailableRiders = async () =>
  pool.query(
    `${riderSummarySelect}
     WHERE riders.availability = TRUE
     ${riderSummaryGroupBy}
     HAVING COUNT(assignments.order_id) FILTER (
       WHERE orders.status IS DISTINCT FROM 'delivered'
     ) < 3
     ORDER BY active_assignments ASC, riders.updated_at DESC`
  );

export const getRiderTasks = async (riderId) =>
  pool
    .query(
      `SELECT assignments.*,
              COALESCE(latest_delivery_status.status, orders.status) AS order_status,
              orders.delivery_address,
              orders.latitude, orders.longitude, orders.promised_at,
              pod.verification_status AS pod_verification_status,
              pod.verification_checked_at AS pod_verification_checked_at,
              orders.customer_feedback_rating, orders.customer_feedback_comment,
              orders.customer_feedback_created_at
       FROM assignments
       JOIN orders ON orders.id = assignments.order_id
       LEFT JOIN pod ON pod.order_id = orders.id
       LEFT JOIN LATERAL (
         SELECT delivery_status.status
         FROM delivery_status
         WHERE delivery_status.order_id = orders.id
         ORDER BY delivery_status.timestamp DESC, delivery_status.id DESC
         LIMIT 1
       ) AS latest_delivery_status ON TRUE
       WHERE assignments.rider_id = $1
       ORDER BY assignments.assigned_at DESC`,
      [riderId]
    )
    .catch((error) => {
      if (error.code !== "42703") {
        throw error;
      }

      return pool.query(
        `SELECT assignments.*,
                COALESCE(latest_delivery_status.status, orders.status) AS order_status,
                orders.delivery_address,
                orders.latitude, orders.longitude, orders.promised_at,
                NULL::VARCHAR AS pod_verification_status,
                NULL::TIMESTAMP AS pod_verification_checked_at,
                NULL::INT AS customer_feedback_rating,
                NULL::TEXT AS customer_feedback_comment,
                NULL::TIMESTAMP AS customer_feedback_created_at
         FROM assignments
         JOIN orders ON orders.id = assignments.order_id
         LEFT JOIN LATERAL (
           SELECT delivery_status.status
           FROM delivery_status
           WHERE delivery_status.order_id = orders.id
           ORDER BY delivery_status.timestamp DESC, delivery_status.id DESC
           LIMIT 1
         ) AS latest_delivery_status ON TRUE
         WHERE assignments.rider_id = $1
         ORDER BY assignments.assigned_at DESC`,
        [riderId]
      );
    });

export const updateRiderAvailability = async (riderId, availability) =>
  pool.query(`UPDATE riders SET availability = $2, updated_at = NOW() WHERE id = $1 RETURNING *`, [
    riderId,
    availability
  ]);

export const createRider = async ({
  name,
  passwordHash,
  location = null,
  latitude,
  longitude,
  availability = true
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users (name, role, password_hash)
       VALUES ($1, 'rider', $2)
       RETURNING id, role, created_at`,
      [name, passwordHash]
    );

    const riderResult = await client.query(
      `INSERT INTO riders (user_id, name, location, latitude, longitude, availability)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userResult.rows[0].id, name, location, latitude, longitude, availability]
    );

    await client.query("COMMIT");

    return {
      rows: [
        {
          ...riderResult.rows[0],
          user_id: userResult.rows[0].id,
          role: userResult.rows[0].role,
          created_at: userResult.rows[0].created_at,
          active_assignments: 0,
          total_assignments: 0,
          average_feedback_rating: null,
          feedback_count: 0,
          workload_status: availability ? "available" : "busy",
          can_take_orders: availability
        }
      ]
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteRider = async (riderId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const riderResult = await client.query(
      `SELECT riders.*, users.name AS user_name, users.role, users.created_at
       FROM riders
       LEFT JOIN users ON users.id = riders.user_id
       WHERE riders.id = $1
       FOR UPDATE`,
      [riderId]
    );

    if (!riderResult.rows.length) {
      await client.query("ROLLBACK");
      return { rows: [] };
    }

    const rider = riderResult.rows[0];

    if (rider.user_id) {
      await client.query(`DELETE FROM users WHERE id = $1`, [rider.user_id]);
    } else {
      await client.query(`DELETE FROM riders WHERE id = $1`, [riderId]);
    }

    await client.query("COMMIT");
    return { rows: [rider] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
