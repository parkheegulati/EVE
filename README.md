# Diagnostic Test Booking - EVE Healthcare Intern Assignment

This is a backend service for a diagnostic test booking and payments system built with Node.js, Express, PostgreSQL, and Sequelize.

## How to Run Locally

### Using Docker (Recommended)

1. Ensure Docker and Docker Compose are installed on your machine.
2. Run the following command from the root of the project to build and start the containers:
   ```bash
   docker-compose up --build
   ```
3. The API will be available at `http://localhost:3000`.
4. The Swagger API documentation is available at `http://localhost:3000/api-docs`.

### Running manually without Docker

1. Ensure you have Node.js (v18+) and PostgreSQL installed.
2. Create a database named `diagnostic_db` in PostgreSQL.
3. Run `npm install` to install all dependencies.
4. Run `npm start` to start the server (or `npm run dev` for nodemon).

### Running Tests
Tests are written using Jest and Supertest. They use an in-memory SQLite database to run instantly without requiring a live Postgres connection.
```bash
npm test
```

---

## API Endpoints and Example Requests

*Note: You can view and interact with all endpoints via the Swagger UI at `http://localhost:3000/api-docs`.*

### Authentication
**1. Signup**
- **POST** `/auth/signup`
- **Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```

**2. Login**
- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Response:** Returns a JWT `token`. Put this token in the `Authorization: Bearer <token>` header for protected routes.

### Centres & Tests
**3. List Centres**
- **GET** `/centres`
- **Response:** Array of diagnostic centres.

**4. List Tests by Centre**
- **GET** `/centres/1/tests` (where `1` is the centre ID)
- **Response:** Array of diagnostic tests available at that centre.

### Bookings (Protected - Requires JWT)
**5. Create a Booking**
- **POST** `/bookings`
- **Headers:** `Authorization: Bearer <your_jwt_token>`
- **Body:**
  ```json
  {
    "test_id": 1,
    "appointment_time": "2026-10-15T10:00:00Z"
  }
  ```

**6. Get User Bookings**
- **GET** `/bookings`
- **Headers:** `Authorization: Bearer <your_jwt_token>`

**7. Get Booking by ID**
- **GET** `/bookings/1`
- **Headers:** `Authorization: Bearer <your_jwt_token>`

### Payments
**8. Simulate a Payment**
- **POST** `/payments`
- **Body:**
  ```json
  {
    "booking_id": 1
  }
  ```
- *Simulates a 80% success / 20% failure rate and updates the booking status.*

**9. Payment Webhook (Idempotent)**
- **POST** `/payments/webhook`
- **Body:**
  ```json
  {
    "provider_event_id": "evt_987654321",
    "booking_id": 1,
    "status": "SUCCESS"
  }
  ```

---

## Database / Schema Design

The database is built on PostgreSQL using Sequelize ORM. The relational design is as follows:

- **Users:** Stores patient details and hashed passwords. (`id`, `name`, `email`, `password_hash`, `created_at`)
- **Centres:** Stores physical clinic locations. (`id`, `name`, `location`, `created_at`)
- **Tests:** Stores diagnostic tests linked to a centre. (`id`, `centre_id` [FK], `name`, `price`, `created_at`)
- **Bookings:** Represents a user's appointment for a specific test. The price is snapshotted into the `amount` column at the time of booking so future price changes do not affect historical records. (`id`, `user_id` [FK], `test_id` [FK], `appointment_time`, `amount`, `status`, `created_at`)
- **Payments:** Tracks payment events mapped to bookings. It enforces an idempotent constraint on `provider_event_id` to prevent duplicate webhook processing. (`id`, `booking_id` [FK], `provider_event_id` [UNIQUE], `status`, `amount`, `processed_at`)

**Relationships:**
- A `Centre` has many `Tests`.
- A `User` has many `Bookings`.
- A `Test` has many `Bookings`.
- A `Booking` has many `Payments` (handling retries/failures).

---

## Important Assumptions Made

1. **No Frontend:** The system is an API-only backend designed to be consumed by clients.
2. **Pricing Snapshot:** Test prices might fluctuate. When a booking is made, the price of the test is copied into the `Booking.amount` field so historical booking records are immutable.
3. **Idempotency Strategy:** The webhook relies on the database's `UNIQUE` constraint on `Payment.provider_event_id`. If the webhook fires twice simultaneously, the DB rejects the duplicate insert, and the code catches it to return a graceful `200 OK` (acknowledging receipt without duplicating data).
4. **Test Environment:** SQLite is used conditionally for the test suite (`npm test`). This allows the integration tests to run instantly in isolated environments without needing a live, clean PostgreSQL instance.

---

## What I would improve if I had more time

1. **Database Migrations:** Currently, the models synchronize automatically via `sequelize.sync()`. In a production system, I would use the Sequelize CLI to manage explicit, version-controlled up/down migration files.
2. **Advanced Request Validation:** While basic validation is implemented in the controllers, I would integrate a library like `Joi` or `Zod` to enforce strict schemas for all incoming HTTP payloads at the middleware level.
3. **Pagination & Filtering:** Endpoints like `GET /centres` or `GET /bookings` should implement cursor-based or offset-based pagination to handle scale.
4. **Structured Logging:** I would replace `console.log/error` with a structured logging library like `Winston` or `Pino` to emit JSON logs for better observability in Datadog/ELK.
5. **Environment Variable Management:** Use a tool like `dotenv-safe` to enforce that all required environment variables are present at boot time.
