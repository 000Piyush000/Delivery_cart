import pool from "../config/db.js";

export const getHubs = async () =>
  pool.query(`SELECT * FROM hubs ORDER BY name`);

export const createHub = async ({ name, latitude, longitude }) =>
  pool.query(
    `INSERT INTO hubs (name, latitude, longitude)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, latitude, longitude]
  );
