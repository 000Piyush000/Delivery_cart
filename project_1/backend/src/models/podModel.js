import { query } from "../config/db.js";

export const upsertPod = async ({ orderId, fileUrl, fileHash }) =>
  query(
    `INSERT INTO pod (order_id, file_url, file_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (order_id)
     DO UPDATE SET file_url = EXCLUDED.file_url, file_hash = EXCLUDED.file_hash, uploaded_at = NOW()
     RETURNING *`,
    [orderId, fileUrl, fileHash]
  );

export const getPodByOrderId = async (orderId) =>
  query(`SELECT * FROM pod WHERE order_id = $1`, [orderId]);
