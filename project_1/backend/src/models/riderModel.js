import { query } from "../config/db.js";

export const getRiders = async () =>
  query(
    `SELECT riders.*, users.id AS user_id, users.role
     FROM riders
     LEFT JOIN users ON users.id = riders.user_id
     ORDER BY riders.name`
  );

export const getRiderById = async (id) =>
  query(`SELECT * FROM riders WHERE id = $1`, [id]);

export const getRiderByUserId = async (userId) =>
  query(`SELECT * FROM riders WHERE user_id = $1`, [userId]);

export const getAvailableRiders = async () =>
  query(`SELECT * FROM riders WHERE availability = TRUE ORDER BY updated_at DESC`);

export const getRiderTasks = async (riderId) =>
  query(
    `SELECT assignments.*, orders.status AS order_status, orders.delivery_address,
            orders.latitude, orders.longitude, orders.promised_at
     FROM assignments
     JOIN orders ON orders.id = assignments.order_id
     WHERE assignments.rider_id = $1
     ORDER BY assignments.assigned_at DESC`,
    [riderId]
  );

export const updateRiderAvailability = async (riderId, availability) =>
  query(`UPDATE riders SET availability = $2, updated_at = NOW() WHERE id = $1 RETURNING *`, [
    riderId,
    availability
  ]);
