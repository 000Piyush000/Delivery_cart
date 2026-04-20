import pool from "../config/db.js";

export const findUserByName = async (name) =>
  pool.query(`SELECT * FROM users WHERE LOWER(name) = LOWER($1) LIMIT 1`, [name]);

export const createUser = async ({ name, role, passwordHash, address = null }, client = pool) =>
  client.query(
    `INSERT INTO users (name, role, password_hash, address)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, role, address, created_at`,
    [name, role, passwordHash, address]
  );

export const createCustomer = async ({ name, passwordHash, address }) =>
  createUser({ name, role: "customer", passwordHash, address });

export const findUserById = async (id) =>
  pool.query(`SELECT id, name, role, address FROM users WHERE id = $1`, [id]);

export const getUsersByRole = async (role) =>
  pool.query(
    `SELECT id, name, role, address, created_at
     FROM users
     WHERE role = $1
     ORDER BY created_at DESC, name`,
    [role]
  );
