# Diagnostic Test Booking - EVE Healthcare Intern Assignment

A backend service for a diagnostic test booking and payments system built with Node.js, Express, PostgreSQL, and Sequelize.

## Quick Start

### Using Docker (Recommended)

1. Ensure Docker and Docker Compose are installed.
2. From the project root:
   ```bash
   docker-compose up --build
   ```
3. The API is available at `http://localhost:3000`.
4. Swagger UI is at `http://localhost:3000/api-docs`.

### Running manually without Docker

1. Ensure Node.js (v18+) and PostgreSQL are installed.
2. Create a database named `diagnostic_db` in PostgreSQL.
3. Copy the example environment file and fill in your values:
   ```bash
   cp .env.example .env
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the server:
   ```bash
   npm start
   ```
   Or with auto-restart on file changes:
   ```bash
   npm run dev
   ```

> **Required environment variables** — see `.env.example` for the full list.  
> The application will **refuse to start** if `JWT_SECRET` is not set.

### Running Tests

Tests use Jest and Supertest with an **in-memory SQLite database** and run without requiring a live PostgreSQL connection.

```bash
npm test
```

---

## Environment Variables

| Variable    | Description                                 | Default (Docker)   |
|-------------|---------------------------------------------|--------------------|
| `PORT`      | HTTP port the server listens on             | `3000`             |
| `DB_NAME`   | PostgreSQL database name                    | `diagnostic_db`    |
| `DB_USER`   | PostgreSQL user                             | `postgres`         |
| `DB_PASS`   | PostgreSQL password                         | `postgres`         |
| `DB_HOST`   | PostgreSQL host                             | `db` (Docker)      |
| `DB_PORT`   | PostgreSQL port                             | `5432`             |
| `JWT_SECRET`| **Required.** Secret used to sign JWTs.     | *(must be set)*    |

See `.env.example` for a complete template.

---

## API Endpoints

> All endpoints can be explored interactively via Swagger UI at `/api-docs`.

### Authentication

**POST `/auth/signup`** — Register a new user

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

**POST `/auth/login`** — Login and receive a JWT

```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

Response: `{ "token": "<jwt>" }` — include as `Authorization: Bearer <token>` on protected routes.

---

### Centres & Tests

**GET `/centres`** — List all diagnostic centres.

**GET `/centres/:id/tests`** — List tests offered by a centre.

---

### Bookings *(requires JWT)*

**POST `/bookings`** — Create a booking.

```json
{
  "test_id": 1,
  "appointment_time": "2026-12-15T10:00:00Z"
}
```

- `test_id` must be a valid positive integer.
- `appointment_time` must be a valid ISO 8601 date-time **in the future** (UTC).
- Returns `400` for invalid or past dates.

**GET `/bookings`** — List the authenticated user's own bookings.

**GET `/bookings/:id`** — Get a single booking. Returns `403` if the booking belongs to another user.

---

### Payments

**POST `/payments`** *(requires JWT)* — Simulate a payment for a booking.

```json
{ "booking_id": 1 }
```

- The requester must own the booking → `403` otherwise.
- Booking must be in `PENDING` or `FAILED` status → `409` for `CONFIRMED` or `CANCELLED`.
- Simulates an 80% success / 20% failure rate.
- On success: booking status → `CONFIRMED`.
- On failure: booking status → `FAILED` (retry is allowed).

**POST `/payments/webhook`** — External payment provider callback. Idempotent on `provider_event_id`.

```json
{
  "provider_event_id": "evt_987654321",
  "booking_id": 1,
  "status": "SUCCESS"
}
```

- Same `provider_event_id` with identical payload → `200` (no-op).
- Same `provider_event_id` with a different `booking_id` or `status` → `409 Conflict`.

---

## Database Schema

Built on PostgreSQL via Sequelize ORM.

| Table      | Key columns                                                                   |
|------------|-------------------------------------------------------------------------------|
| `users`    | `id`, `name`, `email` (unique), `password_hash`, `created_at`                |
| `centres`  | `id`, `name`, `location`, `created_at`                                        |
| `tests`    | `id`, `centre_id` (FK), `name`, `price`, `created_at`                        |
| `bookings` | `id`, `user_id` (FK), `test_id` (FK), `appointment_time`, `amount`, `status`, `created_at` |
| `payments` | `id`, `booking_id` (FK), `provider_event_id` (UNIQUE), `status`, `amount`, `processed_at` |

**Booking statuses:** `PENDING` → `CONFIRMED` / `FAILED` → `CONFIRMED` (retry). `CANCELLED` is terminal.

**Relationships:**
- A `Centre` has many `Tests`.
- A `User` has many `Bookings`.
- A `Test` has many `Bookings`.
- A `Booking` has many `Payments` (supporting retries on failure).

---

## Important Assumptions

1. **No Frontend:** API-only backend.
2. **Pricing Snapshot:** The test price is copied into `Booking.amount` at booking time, so historical records are unaffected by future price changes.
3. **Idempotency:** The webhook relies on a `UNIQUE` constraint on `Payment.provider_event_id`. Concurrent duplicate requests are handled gracefully.
4. **Timezone handling:** All date-times are accepted and stored as UTC. Clients should submit ISO 8601 strings with explicit UTC offset (e.g. `2026-12-15T10:00:00Z`).
5. **Test isolation:** The test suite uses an in-memory SQLite database so it runs instantly without a live PostgreSQL instance.

---

## What I would improve with more time

1. **Database Migrations:** Replace `sequelize.sync()` with Sequelize CLI migration files for version-controlled schema changes.
2. **Request Validation Middleware:** Integrate `Joi` or `Zod` for structured schema validation at the middleware layer.
3. **Pagination:** Add offset or cursor-based pagination to list endpoints (`GET /centres`, `GET /bookings`).
4. **Structured Logging:** Replace `console.log/error` with `Winston` or `Pino` for JSON-structured logs.
5. **Webhook Signature Verification:** In a real system, webhook requests from payment providers include an HMAC signature that should be verified before processing.
