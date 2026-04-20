# Logistics Delivery Management System

## Project Summary

The Logistics Delivery Management System is a full-stack web application for managing delivery operations across multiple user roles. It supports order creation, rider assignment, proof-of-delivery upload and verification, dispute handling, audit logging, and analytics.

The project is organized into three major parts:

- `backend/`: Node.js + Express REST API
- `frontend/`: React + Vite single-page application
- `database/`: PostgreSQL schema and seed scripts

## Core Objectives

- Provide role-based access for admin, rider, customer, support agent, and auditor users
- Manage the order lifecycle from creation to delivery
- Support manual and automatic rider assignment
- Capture and verify proof of delivery using file hashing
- Record operational actions in audit logs
- Track disputes and support workflow
- Present operational analytics and dashboard views

## Technology Stack

### Backend

- Node.js
- Express
- PostgreSQL using `pg`
- JWT authentication using `jsonwebtoken`
- Password hashing using `bcryptjs`
- File upload handling using `multer`
- Scheduled reporting using `node-cron`

### Frontend

- React 18
- React Router DOM
- Vite
- Custom CSS in `frontend/src/styles/global.css`

### Database

- PostgreSQL
- `pgcrypto` extension used in seed/setup flow

## Repository Structure

```text
project_1/
  backend/
    src/
      app.js
      server.js
      config/
      controllers/
      jobs/
      middlewares/
      models/
      routes/
      utils/
    uploads/
    reports/
    package.json
  frontend/
    src/
      api/
      components/
      context/
      pages/
      styles/
      utils/
    package.json
  database/
    schema.sql
    seed.sql
  README.md
```

## Backend Documentation

### Backend Architecture

The backend follows a layered structure:

- `routes/` defines HTTP endpoints
- `controllers/` contains request-handling logic
- `models/` contains SQL queries and database access
- `middlewares/` handles authentication, authorization, uploads, and error wrapping
- `utils/` provides helper utilities such as hashing and distance calculation
- `jobs/` contains scheduled reporting logic

### Main Backend Entry Files

- `backend/src/server.js`: Starts the server and initializes compatibility checks
- `backend/src/app.js`: Configures Express middleware, static uploads, route mounting, and error handling
- `backend/src/config/db.js`: Creates the PostgreSQL connection pool and applies backward-compatible schema adjustments

### Mounted API Modules

The backend exposes the following base route groups:

- `/api/auth`
- `/api/orders`
- `/api/riders`
- `/api/assignments`
- `/api/hubs`
- `/api/users`
- `/api/pod`
- `/api/disputes`
- `/api/analytics`

It also serves uploaded POD files from:

- `/uploads`

### Authentication and Authorization

Authentication is JWT-based. After login or registration, the frontend stores the JWT and sends it in the `Authorization` header for API requests.

Roles used in the system:

- `admin`
- `rider`
- `customer`
- `support_agent`
- `auditor`

Access is controlled in `backend/src/middlewares/authMiddleware.js` using `authenticate` and `authorize(...)`.

### Backend Routes and Responsibilities

#### Authentication

- `POST /api/auth/login`
- `POST /api/auth/register`

Responsibilities:

- User login
- Customer registration
- JWT response generation

#### Orders

- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/:id/track`
- `POST /api/orders/:id/feedback`
- `PATCH /api/orders/:id/status`

Responsibilities:

- Admin/customer order creation
- Order listing
- Customer-specific order history
- Delivery timeline retrieval
- Rider/admin status updates
- Customer feedback capture

#### Riders

- `GET /api/riders`
- `POST /api/riders`
- `DELETE /api/riders/:riderId`
- `GET /api/riders/me/tasks`
- `PATCH /api/riders/:riderId/availability`

Responsibilities:

- Rider roster management
- Rider task list retrieval
- Availability management
- Rider removal

#### Assignments

- `GET /api/assignments`
- `POST /api/assignments/:orderId/manual`
- `POST /api/assignments/:orderId/auto`
- `DELETE /api/assignments/:orderId`
- `POST /api/assignments/:orderId/reject/:riderId`

Responsibilities:

- Manual rider assignment
- Auto assignment to nearest available rider
- Unassignment
- Rider rejection and reassignment flow

#### POD

- `POST /api/pod/:orderId`
- `GET /api/pod/:orderId`

Responsibilities:

- POD image upload
- Hash generation and persistence
- Verification by recomputing file hash during retrieval

#### Disputes

- `GET /api/disputes`
- `POST /api/disputes/:orderId`
- `PATCH /api/disputes/:id`

Responsibilities:

- Customer dispute creation
- Support-agent resolution updates
- Dispute review for support, auditor, and admin roles

#### Hubs

- `GET /api/hubs`
- `POST /api/hubs`

Responsibilities:

- Hub listing
- New hub creation

#### Users

- `GET /api/users/role/:role`

Responsibilities:

- User listing by role for admin workflows

#### Analytics

- `GET /api/analytics`
- `GET /api/analytics/audit`
- `GET /api/analytics/database`

Responsibilities:

- Analytics summary
- Rider performance data
- Audit trail retrieval
- Database overview endpoint for diagnostics/inspection

### Backend Business Logic Highlights

#### Order Lifecycle

The order status flow is:

- `picked`
- `out_for_delivery`
- `delivered`

Each important state update is also recorded in the `delivery_status` table to preserve the trackable order timeline.

#### Rider Assignment Logic

Two assignment modes are supported:

- Manual assignment by admin
- Automatic assignment to the nearest available rider

The automatic assignment uses rider coordinates and distance calculations from `backend/src/utils/distance.js`.

#### POD Verification

When a rider uploads a POD image:

- The backend stores the image in `backend/uploads`
- A SHA-256 hash is calculated and saved in the database
- On retrieval, the file hash is recalculated
- The backend compares the recomputed hash with the stored hash to mark the file as verified or mismatched

#### Audit Logging

Audit records are stored in the `audit_logs` table with:

- `user_id`
- `action`
- `metadata`
- `timestamp`

Examples include assignment updates, dispute actions, rider changes, POD upload, and POD access.

#### Scheduled Reporting

The system contains a daily report job in `backend/src/jobs/dailyReportJob.js`. It generates operational report data and writes JSON output to `backend/reports`.

## Frontend Documentation

### Frontend Architecture

The frontend is a React single-page application using route-based role dashboards.

Main frontend entry files:

- `frontend/src/main.jsx`: React bootstrap
- `frontend/src/App.jsx`: Route definitions and route protection
- `frontend/src/components/Layout.jsx`: Shared dashboard shell, navigation, search, and header
- `frontend/src/context/AuthContext.jsx`: Authentication state handling

### Frontend Pages

#### Login Page

- File: `frontend/src/pages/LoginPage.jsx`
- Purpose: User login and initial access entry

#### Register Customer Page

- File: `frontend/src/pages/RegisterCustomerPage.jsx`
- Purpose: New customer registration

#### Admin Dashboard

- File: `frontend/src/pages/AdminDashboard.jsx`
- Purpose: Admin control center for:
  - Orders
  - Customers
  - Delivery agents
  - Hubs
  - Audit logs

Note: The database section has been removed from the admin dashboard UI.

#### Rider Dashboard

- File: `frontend/src/pages/RiderDashboard.jsx`
- Purpose:
  - View assigned tasks
  - Update order status
  - Upload POD
  - Request route support
  - View POD preview

#### Customer Page

- File: `frontend/src/pages/CustomerPage.jsx`
- Purpose:
  - Create orders
  - Track timelines
  - Raise disputes
  - Submit feedback after delivery

#### Support Dashboard

- File: `frontend/src/pages/SupportDashboard.jsx`
- Purpose:
  - View disputes
  - Investigate, resolve, and close support cases

#### Analytics Dashboard

- File: `frontend/src/pages/AnalyticsDashboard.jsx`
- Purpose:
  - Show performance metrics
  - Rider performance
  - Audit activity
  - Operational summary

### Frontend Shared Components

- `StatusBadge.jsx`: Visual status chips
- `StatCard.jsx`: Metric summary cards
- `DateFilterSummary.jsx`: Date-driven count summary
- `DashboardDateControl.jsx`: Date picker controls
- `PodViewer.jsx`: POD image rendering and zoom/open behavior
- `RouteVisualization.jsx`: Route-related visual support component

### Frontend API Layer

The frontend calls the backend using:

- `apiRequest(...)`
- `apiRequestOrFallback(...)`

These helpers live in `frontend/src/api/client.js` and attach the JWT token from local storage automatically.

### Frontend Routing and Role Isolation

Protected frontend routes:

- Admin:
  - `/admin`
  - `/admin/orders`
  - `/admin/customers`
  - `/admin/delivery-agents`
  - `/admin/hubs`
  - `/admin/audit-logs`
- Rider:
  - `/rider`
- Customer:
  - `/customer`
- Support agent:
  - `/support_agent`
- Auditor/Admin analytics:
  - `/auditor`

## Database Documentation

### Database Overview

The project uses PostgreSQL as the primary data store. The schema is defined in `database/schema.sql` and sample data is inserted through `database/seed.sql`.

### Tables

#### `users`

Stores all system users.

Important fields:

- `id`
- `name`
- `role`
- `password_hash`
- `address`
- `created_at`

#### `hubs`

Stores operational hubs.

Important fields:

- `id`
- `name`
- `latitude`
- `longitude`
- `created_at`

#### `riders`

Stores rider-specific data.

Important fields:

- `id`
- `user_id`
- `name`
- `location`
- `latitude`
- `longitude`
- `availability`
- `updated_at`

#### `orders`

Stores delivery orders and feedback details.

Important fields:

- `id`
- `customer_id`
- `hub_id`
- `status`
- `pickup_address`
- `delivery_address`
- `latitude`
- `longitude`
- `promised_at`
- `customer_feedback_rating`
- `customer_feedback_comment`
- `customer_feedback_created_at`
- `delivered_at`
- `created_at`
- `updated_at`

#### `assignments`

Maps orders to riders.

Important fields:

- `order_id`
- `rider_id`
- `eta`
- `assigned_at`

#### `delivery_status`

Stores timeline events for each order.

Important fields:

- `id`
- `order_id`
- `status`
- `timestamp`

#### `pod`

Stores proof-of-delivery file metadata.

Important fields:

- `order_id`
- `file_url`
- `file_hash`
- `uploaded_at`

#### `disputes`

Stores dispute and resolution data.

Important fields:

- `id`
- `order_id`
- `customer_id`
- `support_agent_id`
- `reason`
- `resolution`
- `status`
- `created_at`
- `updated_at`

#### `audit_logs`

Stores audit entries for operational events.

Important fields:

- `id`
- `user_id`
- `action`
- `metadata`
- `timestamp`

### Key Relationships

- `riders.user_id -> users.id`
- `orders.customer_id -> users.id`
- `orders.hub_id -> hubs.id`
- `assignments.order_id -> orders.id`
- `assignments.rider_id -> riders.id`
- `delivery_status.order_id -> orders.id`
- `pod.order_id -> orders.id`
- `disputes.order_id -> orders.id`
- `disputes.customer_id -> users.id`
- `disputes.support_agent_id -> users.id`
- `audit_logs.user_id -> users.id`

### Indexes

The schema includes useful indexes for:

- `orders.customer_id`
- `orders.hub_id`
- `assignments.rider_id`
- `delivery_status.order_id`
- `disputes.order_id`
- `audit_logs.user_id`

## Seed Data and Sample Accounts

The seed file creates example records for:

- Admin
- Riders
- Customers
- Support agent
- Auditor
- Hubs
- Orders
- Assignments
- Delivery timeline data
- Disputes
- Audit logs

Sample seeded user names include:

- Priya Mehta
- Rohan Yadav
- Ananya Verma
- Neha Singh
- Vikram Iyer
- Kavya Nair
- Arjun Rao

Default sample password:

- `password123`

## Main Workflows

### 1. Admin Order Management

- Admin creates or reviews orders
- Admin manually assigns a rider or uses automatic assignment
- Admin can unassign orders when necessary

### 2. Rider Delivery Execution

- Rider views assigned route/tasks
- Rider updates order status
- Rider marks delivery complete
- Rider uploads proof of delivery

### 3. Customer Flow

- Customer logs in or registers
- Customer creates orders
- Customer tracks order timeline
- Customer raises disputes
- Customer submits feedback after delivery

### 4. Support Flow

- Support agent views disputes
- Support agent updates status from `open` toward resolution
- Resolution notes can be recorded

### 5. Audit and Analytics Flow

- Audit logs capture major actions
- Analytics page summarizes performance and recent audit events
- Auditor and admin users can access analytics endpoints

## Environment Setup and Execution

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Database Setup

Create the database:

```sql
CREATE DATABASE logistics_db;
```

Run schema and seed:

```bash
psql -U postgres -d logistics_db -f database/schema.sql
psql -U postgres -d logistics_db -f database/seed.sql
```

### Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Default Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Important Files by Area

### Backend

- `backend/src/app.js`
- `backend/src/server.js`
- `backend/src/controllers/orderController.js`
- `backend/src/controllers/assignmentController.js`
- `backend/src/controllers/podController.js`
- `backend/src/controllers/disputeController.js`
- `backend/src/controllers/analyticsController.js`

### Frontend

- `frontend/src/App.jsx`
- `frontend/src/components/Layout.jsx`
- `frontend/src/pages/AdminDashboard.jsx`
- `frontend/src/pages/RiderDashboard.jsx`
- `frontend/src/pages/CustomerPage.jsx`
- `frontend/src/pages/SupportDashboard.jsx`
- `frontend/src/pages/AnalyticsDashboard.jsx`

### Database

- `database/schema.sql`
- `database/seed.sql`

## Current Functional Notes

- POD files are stored locally in development mode
- Uploaded POD files are served from the backend `/uploads` path
- The admin dashboard no longer includes the database section in the UI
- The analytics API still includes a database overview endpoint for admin/auditor access
- Daily reports are generated by a backend scheduled job

## Suggested Future Enhancements

- Replace local file storage with cloud object storage such as AWS S3
- Add automated tests for critical workflows
- Add pagination and filtering at API level for larger datasets
- Introduce refresh tokens or stronger session management
- Add CI/CD pipeline and deployment documentation
- Add API documentation using Swagger or OpenAPI

## Conclusion

This project demonstrates a role-aware logistics management platform with practical operational workflows, strong separation between backend and frontend concerns, PostgreSQL-backed persistence, and specialized modules for delivery proof, disputes, and analytics.

It is suitable as a demo, academic project, portfolio project, or base system for expanding into a larger delivery operations product.
