# Delivery Cart App: Complete Working Explanation

## 1. Purpose of the Application

Delivery Cart is a role-based logistics delivery management system. It is built to simulate how a real delivery company coordinates customers, admin staff, delivery riders, support agents, and auditors inside one platform.

The main business goal of the app is to manage the full delivery lifecycle from order creation to delivery proof, customer feedback, dispute handling, and analytics.

In simple words, this app answers these operational questions:

- How does a customer place and track an order?
- How does an admin assign a rider and manage live operations?
- How does a rider update delivery progress and upload proof of delivery?
- How does support handle complaints and disputes?
- How does management or an auditor review performance and audit logs?

## 2. Technology Stack

- Frontend: React with Vite
- Backend: Node.js with Express
- Database: PostgreSQL
- Authentication: JWT token based login
- File storage: Local upload folder for POD images
- Reporting: JSON daily report job in backend

## 3. High-Level Architecture

The app is divided into three major layers:

- Frontend layer
  - Handles dashboards, forms, filters, tables, and user interactions
  - Uses role-based routing so each user sees the correct workspace

- Backend layer
  - Exposes REST APIs for authentication, orders, riders, assignments, POD, disputes, analytics, hubs, and users
  - Applies authentication and authorization before protected operations
  - Contains the core business logic

- Database layer
  - Stores users, hubs, riders, orders, assignments, delivery status history, POD metadata, disputes, and audit logs

The frontend calls backend APIs. The backend validates the request, applies business rules, saves or reads data from PostgreSQL, and returns structured JSON back to the frontend.

## 4. Roles in the System

The application supports five roles:

- Admin
  - Controls operations
  - Creates and reviews orders
  - Assigns or unassigns riders
  - Manages riders and hubs
  - Reviews audit logs

- Rider
  - Sees assigned delivery tasks
  - Updates order status
  - Uploads proof of delivery
  - Reviews customer feedback linked to completed work

- Customer
  - Registers or logs in
  - Creates orders
  - Tracks order timeline
  - Raises disputes
  - Submits rider feedback after delivery

- Support Agent
  - Reviews disputes
  - Moves a dispute through investigate, resolve, and close

- Auditor
  - Reviews analytics
  - Checks audit logs
  - Monitors operational trends

## 5. Application Startup Flow

When the app starts, the following happens:

1. The backend starts on port 5000.
2. During startup, the backend checks backward-compatible schema updates.
3. The frontend starts on port 5173.
4. The React app loads route definitions.
5. If the user is not logged in, the app redirects to the login page.
6. After login, the JWT token is stored in local storage.
7. The app reads the logged-in user and routes that person to the correct dashboard.

This gives the app a clean role-based entry point.

## 6. Authentication and Authorization

Authentication is handled using JWT.

### Login flow

1. The user enters name and password.
2. The frontend sends a login request to `/api/auth/login`.
3. The backend finds the user by name.
4. The password is compared using bcrypt.
5. If valid, the backend returns:
   - JWT token
   - user id
   - user name
   - role
   - address if available
6. The frontend stores the token in local storage.
7. Future API requests include `Authorization: Bearer <token>`.

### Route protection

- Protected routes in React prevent the wrong user from opening another role's dashboard.
- Backend middleware also validates token and role before processing the request.

This means both frontend and backend protect access.

## 7. Database Design

The main tables and their jobs are:

- `users`
  - Stores login identity for admin, rider, customer, support agent, auditor

- `hubs`
  - Stores delivery hub names and coordinates

- `riders`
  - Stores rider profile, availability, and live location

- `orders`
  - Stores the order, customer, hub, destination, promised time, delivery state, and customer feedback

- `assignments`
  - Links one order to one rider and stores ETA

- `delivery_status`
  - Stores timeline history like picked, out_for_delivery, delivered

- `pod`
  - Stores file URL, uploaded time, and file hash for proof of delivery

- `disputes`
  - Stores customer issue records and support resolution status

- `audit_logs`
  - Stores who did what and when

This design keeps operational events separate from login identity and supports auditability.

## 8. Main Order Lifecycle

This is the most important end-to-end flow in the app.

### Step 1: Customer creates an order

1. Customer opens the customer dashboard.
2. Customer selects a hub and enters pickup and delivery details.
3. Frontend sends `POST /api/orders`.
4. Backend validates:
   - customer identity
   - hub selection
   - addresses
   - location coordinates
   - promised time
5. Backend inserts the order with initial status `picked`.
6. Backend writes a first entry to `delivery_status`.
7. Backend writes an audit log `ORDER_CREATED`.

### Step 2: Admin reviews orders

1. Admin opens order management.
2. Admin sees assigned and unassigned orders.
3. Admin can search, filter by date, and review status.

### Step 3: Rider assignment

The app supports two assignment methods:

- Manual assignment
  - Admin selects a rider from the list
  - Backend checks if the rider exists
  - Backend checks whether the rider can still take orders
  - Backend stores or updates the assignment
  - Backend logs `RIDER_ASSIGNED_MANUAL`

- Auto assignment
  - Admin clicks auto assign
  - Backend loads available riders
  - Backend calculates distance from rider coordinates to order coordinates
  - Nearest rider is selected
  - ETA is estimated from distance
  - Assignment is stored
  - Backend logs `RIDER_ASSIGNED_AUTO`

### Step 4: Rider executes delivery

1. Rider opens the rider dashboard.
2. Rider sees assigned tasks.
3. Rider changes order status:
   - `picked`
   - `out_for_delivery`
   - `delivered`
4. Each update is written back to the order and also added to `delivery_status`.
5. This creates a visible timeline for customer and operations.

### Step 5: POD upload

1. After delivery, the rider uploads POD if it is pending.
2. Backend accepts the uploaded image.
3. Backend computes a SHA-256 hash of the file.
4. The file path and hash are stored in the `pod` table.
5. Audit log `POD_UPLOADED` is created.

### Step 6: Customer feedback

1. After order is delivered, customer can submit rating and comment.
2. Backend verifies:
   - the order belongs to the logged-in customer
   - the order is delivered
   - rating is from 1 to 5
   - feedback is not already submitted
3. Feedback is saved inside the order record.
4. Audit log `ORDER_FEEDBACK_SUBMITTED` is created.
5. Rider average feedback rating is updated dynamically through queries.

## 9. Admin Dashboard Working

The admin dashboard is the operations command center.

### Main functions

- Overview of live system numbers
- Order management
- Customer overview
- Rider management
- Hub management
- Audit log review

### Orders section

Admin can:

- view all orders
- see assigned or unassigned state
- auto assign
- manually assign
- unassign active orders

Important business rule:

- delivered orders cannot be reassigned

### Customers section

Admin can:

- view registered customers
- inspect customer order activity
- place an order on behalf of a customer

### Delivery agents section

Admin can:

- add riders
- mark riders busy or available
- remove riders
- review rider workload
- see rider average feedback rating displayed under the rider name as `rated="..."`

### Hub section

Admin can:

- create hubs
- review order activity by hub
- inspect geographic coverage

### Audit logs section

Admin can:

- review recent audit records
- see only the latest 10 entries in the streamlined audit view
- focus on operational actions without noisy repeated POD read events

## 10. Rider Dashboard Working

The rider dashboard is designed around assigned delivery tasks.

### What rider sees

- ordered delivery task cards
- destination details
- ETA and coordinates
- delivery status
- customer feedback after completion
- POD preview once uploaded

### Rider task execution flow

1. Rider opens assigned order.
2. Rider marks order in transit.
3. Rider marks order delivered.
4. If POD is still pending, rider gets the upload option even after delivery.
5. Once POD exists, the preview is visible.
6. Customer feedback appears when submitted.

### Important rider rules

- Delivered orders no longer show unnecessary action buttons like reject or in-transit updates.
- If POD is still missing, upload is still allowed.
- Rider can reject an assignment only if it belongs to that rider.

### Help feature

Customer and rider dashboards include a `How to use app` help action above logout. That opens a modal with step-by-step instructions so the user can understand the role workflow inside the app itself.

## 11. Customer Dashboard Working

The customer dashboard is focused on placing orders and monitoring them.

### Customer features

- create order
- track order timeline
- raise dispute
- submit rider feedback
- view rider rating under rider name
- open help guide for app usage

### Tracking flow

1. Customer clicks `View timeline`.
2. Frontend calls `GET /api/orders/:id/track`.
3. Backend returns order details plus the delivery status history.
4. Frontend displays the timeline in order.

### Feedback flow

1. Customer selects rating.
2. Customer may write a comment.
3. Frontend calls `POST /api/orders/:id/feedback`.
4. Backend validates all business rules.
5. If successful, feedback is saved and reflected in rider-related views.

## 12. Support Dashboard Working

Support agents handle post-delivery issues.

### Dispute flow

1. Customer raises a dispute for an order.
2. Backend inserts a row into `disputes`.
3. Support opens the support dashboard.
4. Support can move the dispute through:
   - investigate
   - resolve
   - close
5. Each change updates dispute state and creates an audit log.

This models a basic service recovery workflow.

## 13. POD Verification and Auditability

POD is one of the most important control features in the app.

### Why hash is stored

When the rider uploads an image, the system computes a file hash. That hash works like a fingerprint for the uploaded file.

### Why verification matters

When an authorized user reads POD, the backend recomputes the file hash from disk and compares it with the stored hash.

If both values match:

- the file is verified
- the app can show that the proof was not tampered with

This is useful when someone wants to confirm delivery evidence.

## 14. Analytics Dashboard Working

The analytics dashboard helps auditors and management understand system performance.

### It shows

- on-time delivery rate
- dispute rate
- audit event count
- progress status mix
- rider performance table
- recent audit feed

### Data sources

- orders
- disputes
- audit logs

### How values are derived

- on-time rate compares `delivered_at` against `promised_at`
- dispute rate compares dispute count against order count
- rider performance aggregates delivered orders and on-time completion

This makes the app useful beyond daily operations.

## 15. Background Job

The backend includes a daily report job that writes JSON report files into `backend/reports`.

This demonstrates that the system can support scheduled reporting, not only screen-based usage.

## 16. Frontend Interaction Pattern

Most dashboard pages follow the same UI pattern:

1. Page loads
2. React component requests data from the backend
3. State is stored in component state
4. Search and date filters are applied on the frontend
5. User actions trigger API calls
6. On success, data reloads and UI refreshes
7. A banner message gives feedback to the user

This pattern keeps the app consistent across roles.

## 17. Security and Control Logic

The app enforces several important rules:

- only logged-in users can access protected APIs
- each role is limited to its own features
- only customers can submit feedback for their own orders
- only riders can update their own working tasks
- delivered orders cannot be reassigned
- rider workload and availability are checked before assignment
- support can move disputes through approved states

These controls make the app feel like a true workflow system, not just a set of forms.

## 18. What Makes This App Strong for Demonstration

This project is strong for explanation because it combines:

- role-based access control
- operational workflow
- geo-based auto assignment
- proof of delivery
- audit logs
- analytics
- customer feedback
- support dispute resolution

It covers both transaction processing and management visibility.

## 19. Suggested 20-Minute Explanation Plan

### Minute 1 to 2: Introduction

Explain that this is a role-based logistics management app for delivery operations.

### Minute 3 to 5: Architecture

Explain frontend, backend, database, JWT auth, and local POD storage.

### Minute 6 to 9: Order lifecycle

Explain customer order creation, admin assignment, rider execution, status updates, and timeline creation.

### Minute 10 to 12: POD and feedback

Explain proof of delivery upload, hashing, verification, and customer feedback.

### Minute 13 to 15: Role dashboards

Explain admin dashboard, rider dashboard, customer dashboard, support dashboard, and analytics dashboard.

### Minute 16 to 18: Disputes, audit, analytics

Explain support resolution flow, audit logs, and on-time performance reporting.

### Minute 19 to 20: Conclusion

Explain why the app is realistic, what business problem it solves, and what could be improved next.

## 20. Good Closing Summary for Presentation

You can explain the app like this:

Delivery Cart is a full-stack logistics workflow application where each role gets a focused dashboard. Customers create and track orders, admins manage operations and assignments, riders execute deliveries and upload proof, support resolves disputes, and auditors review performance and audit trails. The system also protects important actions through JWT authentication, role checks, POD hashing, business rules, and structured database design. So this is not only a CRUD app. It is an operational process app that models a real delivery lifecycle from booking to proof and feedback.

## 21. Possible Future Improvements

- move POD storage from local disk to cloud storage like S3
- add live notifications instead of periodic polling
- use maps for real route visualization
- add OTP or stronger identity verification
- add SLA breach alerts
- add downloadable analytics exports
- add richer dispute notes and attachments

## 22. Final One-Line Summary

This app is a complete logistics operations demo that connects customer booking, rider assignment, delivery execution, proof of delivery, feedback, disputes, auditability, and analytics in one integrated system.
