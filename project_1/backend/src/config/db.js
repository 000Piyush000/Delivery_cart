import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const query = async (text, params = []) => {
  const result = await pool.query(text, params);
  return result;
};
