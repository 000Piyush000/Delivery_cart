CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS pod CASCADE;
DROP TABLE IF EXISTS delivery_status CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS riders CASCADE;
DROP TABLE IF EXISTS hubs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'rider', 'customer', 'support_agent', 'auditor')),
  password_hash TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE hubs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE riders (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  location VARCHAR(255),
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  availability BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hub_id INT NOT NULL REFERENCES hubs(id),
  status VARCHAR(40) NOT NULL CHECK (status IN ('picked', 'out_for_delivery', 'delivered')),
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  promised_at TIMESTAMP,
  customer_feedback_rating INT CHECK (customer_feedback_rating BETWEEN 1 AND 5),
  customer_feedback_comment TEXT,
  customer_feedback_created_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE assignments (
  order_id INT PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  rider_id INT NOT NULL REFERENCES riders(id),
  eta VARCHAR(60),
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE delivery_status (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(40) NOT NULL CHECK (status IN ('picked', 'out_for_delivery', 'delivered')),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE pod (
  order_id INT PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE disputes (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  support_agent_id INT REFERENCES users(id),
  reason TEXT NOT NULL,
  resolution TEXT,
  status VARCHAR(40) NOT NULL CHECK (status IN ('open', 'investigate', 'resolve', 'close')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_hub_id ON orders(hub_id);
CREATE INDEX idx_assignments_rider_id ON assignments(rider_id);
CREATE INDEX idx_delivery_status_order_id ON delivery_status(order_id);
CREATE INDEX idx_disputes_order_id ON disputes(order_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
