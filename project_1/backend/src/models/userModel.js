import { query } from "../config/db.js";

export const findUserByName = async (name) =>
  query(`SELECT * FROM users WHERE LOWER(name) = LOWER($1) LIMIT 1`, [name]);

export const findUserById = async (id) =>
  query(`SELECT id, name, role FROM users WHERE id = $1`, [id]);

export const getUsersByRole = async (role) =>
  query(`SELECT id, name, role FROM users WHERE role = $1 ORDER BY name`, [role]);
