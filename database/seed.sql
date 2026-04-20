INSERT INTO users (name, role, password_hash, address)
VALUES
  ('Priya Mehta', 'admin', crypt('password123', gen_salt('bf')), NULL),
  ('Rohan Yadav', 'rider', crypt('password123', gen_salt('bf')), NULL),
  ('Ananya Verma', 'customer', crypt('password123', gen_salt('bf')), '12 A , Ramnagar, near Railway Station'),
  ('Neha Singh', 'support_agent', crypt('password123', gen_salt('bf')), NULL),
  ('Vikram Iyer', 'auditor', crypt('password123', gen_salt('bf')), NULL),
  ('Kavya Nair', 'rider', crypt('password123', gen_salt('bf')), NULL),
  ('Arjun Rao', 'customer', crypt('password123', gen_salt('bf')), 'Sector 17, Greator Noida');

INSERT INTO hubs (name, latitude, longitude)
VALUES
  ('Delhi Central Hub', 28.613900, 77.209000),
  ('Noida East Hub', 28.535500, 77.391000);

INSERT INTO riders (user_id, name, location, latitude, longitude, availability)
VALUES
  ((SELECT id FROM users WHERE name = 'Rohan Yadav'), 'Rohan Yadav', 'Connaught Place', 28.631500, 77.216700, TRUE),
  ((SELECT id FROM users WHERE name = 'Kavya Nair'), 'Kavya Nair', 'Noida Sector 18', 28.570800, 77.327200, TRUE);

INSERT INTO orders (customer_id, hub_id, status, pickup_address, delivery_address, latitude, longitude, promised_at, delivered_at)
VALUES
  (
    (SELECT id FROM users WHERE name = 'Ananya Verma'),
    (SELECT id FROM hubs WHERE name = 'Delhi Central Hub'),
    'picked',
    '12 A , Ramnagar, near Railway Station',
    '14 Lodhi Estate, New Delhi',
    28.613900,
    77.209000,
    NOW() + INTERVAL '4 hours',
    NULL
  ),
  (
    (SELECT id FROM users WHERE name = 'Arjun Rao'),
    (SELECT id FROM hubs WHERE name = 'Noida East Hub'),
    'delivered',
    'Sector 17, Greator Noida',
    'Tower B, Sector 62, Noida',
    28.627000,
    77.364900,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '3 hours'
  );

INSERT INTO assignments (order_id, rider_id, eta)
VALUES
  (1, 1, '25 mins'),
  (2, 2, 'Completed');

INSERT INTO delivery_status (order_id, status, timestamp)
VALUES
  (1, 'picked', NOW() - INTERVAL '20 minutes'),
  (2, 'picked', NOW() - INTERVAL '4 hours'),
  (2, 'out_for_delivery', NOW() - INTERVAL '3 hours 30 minutes'),
  (2, 'delivered', NOW() - INTERVAL '3 hours');

INSERT INTO disputes (order_id, customer_id, support_agent_id, reason, resolution, status)
VALUES
  (
    2,
    (SELECT id FROM users WHERE name = 'Arjun Rao'),
    (SELECT id FROM users WHERE name = 'Neha Singh'),
    'Box arrived dented',
    'Replacement approved',
    'resolve'
  );

INSERT INTO audit_logs (user_id, action, metadata)
VALUES
  ((SELECT id FROM users WHERE name = 'Priya Mehta'), 'SEED_ORDER_CREATED', '{"orderId":1}'),
  ((SELECT id FROM users WHERE name = 'Neha Singh'), 'SEED_DISPUTE_UPDATED', '{"disputeId":1,"status":"resolve"}');
