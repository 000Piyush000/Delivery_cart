import dotenv from "dotenv";
dotenv.config();

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

export const ensureBackwardCompatibleSchema = async () => {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    ) AS has_users_table
  `);

  if (!result.rows[0]?.has_users_table) {
    return;
  }

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_address TEXT`);
  await pool.query(`
    UPDATE orders
    SET pickup_address = COALESCE(pickup_address, delivery_address, 'Unknown pickup address')
    WHERE pickup_address IS NULL
  `);
  await pool.query(`ALTER TABLE orders ALTER COLUMN pickup_address SET NOT NULL`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_feedback_rating INT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_feedback_comment TEXT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_feedback_created_at TIMESTAMP`);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'orders_customer_feedback_rating_check'
      ) THEN
        ALTER TABLE orders
        ADD CONSTRAINT orders_customer_feedback_rating_check
        CHECK (customer_feedback_rating BETWEEN 1 AND 5);
      END IF;
    END $$;
  `);
};

export default pool;
