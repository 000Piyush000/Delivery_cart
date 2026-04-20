# Logistics Delivery Management System

Full-stack demo for logistics operations with role-based dashboards, rider assignment, POD hashing and verification, disputes, audit logs, and analytics.

## Stack

- Backend: Node.js, Express, PostgreSQL
- Frontend: React with Vite
- Storage: local file storage mock for development (`backend/uploads`)
- Auth: JWT

## Project Structure

```text
project_1/
  backend/
  frontend/
  database/
```

## Backend Features

- Role-aware JWT authentication for admin, rider, customer, support agent, and auditor
- Order creation with hub assignment
- Manual rider assignment and auto-assignment using nearest rider coordinates
- Delivery status timeline: `picked -> out_for_delivery -> delivered`
- POD upload with SHA-256 hash persistence
- POD verification by recomputing the file hash during access
- Dispute workflow: `open -> investigate -> resolve -> close`
- Audit logs for POD access and dispute actions
- Analytics for on-time delivery, rider performance, and dispute rate
- Daily report job that writes JSON reports into `backend/reports`

## Frontend Pages

- Admin dashboard
- Rider dashboard
- Customer tracking page
- Support dashboard
- Analytics dashboard

## Environment Setup

### 1. Install prerequisites

- Node.js 18+
- PostgreSQL 14+

### 2. Create the database

```sql
CREATE DATABASE logistics_db;
```

Run the schema and seed scripts:

```bash
psql -U postgres -d logistics_db -f database/schema.sql
psql -U postgres -d logistics_db -f database/seed.sql
```

### 3. Configure backend

```bash
cd backend
copy .env.example .env
```

Update `.env` if your PostgreSQL connection differs.

### 4. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 5. Run locally

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Frontend URL: `http://localhost:5173`
Backend URL: `http://localhost:5000`

## Sample Users

All sample users use password `password123`.

- `Priya Mehta`
- `Rohan Yadav`
- `Ananya Verma`
- `Neha Singh`
- `Vikram Iyer`

## Sample API Endpoints

### Authentication

- `POST /api/auth/login`

```json
{
  "name": "Alice Admin",
  "password": "password123"
}
```

### Orders

- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/:id/track`
- `POST /api/orders/:id/feedback`
- `PATCH /api/orders/:id/status`

Example create order body:

```json
{
  "customerId": 3,
  "hubId": 1,
  "pickupAddress": "Delhi Central Hub, New Delhi",
  "deliveryAddress": "14 Lodhi Estate, New Delhi",
  "latitude": 28.6139,
  "longitude": 77.209,
  "promisedAt": "2026-03-28T18:00:00.000Z"
}
```

### Assignments

- `GET /api/assignments`
- `POST /api/assignments/:orderId/manual`
- `POST /api/assignments/:orderId/auto`

### Riders

- `GET /api/riders`
- `GET /api/riders/me/tasks`
- `PATCH /api/riders/:riderId/availability`

### POD

- `POST /api/pod/:orderId`
- `GET /api/pod/:orderId`

Upload field name: `pod`

### Disputes

- `GET /api/disputes`
- `POST /api/disputes/:orderId`
- `PATCH /api/disputes/:id`

### Analytics and Audit

- `GET /api/analytics`
- `GET /api/analytics/audit`

## Notes

- The backend currently uses local disk storage for POD uploads in development.
- To move to AWS S3 later, replace the upload handler and keep the stored `file_url` and `file_hash` contract unchanged.
- This environment did not have `node` or `npm` installed, so the code was prepared but not executed here.
