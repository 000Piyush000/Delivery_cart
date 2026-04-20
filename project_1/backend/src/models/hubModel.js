import { query } from "../config/db.js";

export const getHubs = async () =>
  query(`SELECT * FROM hubs ORDER BY name`);

export const createHub = async ({ name, latitude, longitude }) =>
  query(
    `INSERT INTO hubs (name, latitude, longitude)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, latitude, longitude]
  );
