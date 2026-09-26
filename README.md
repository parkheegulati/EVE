# Diagnostic Test Booking API

This is a backend service for a diagnostic test booking and payments system built with Node.js, Express, PostgreSQL, and Sequelize.

## Requirements Handled

- **Authentication**: JWT-based signup and login with bcrypt password hashing.
- **Centres & Tests**: View all centres and tests for a specific centre.
- **Booking System**: Users can book tests; prices are snapshotted at booking time.
- **Simulated Payment**: Endpoint to simulate payment success/failure.
- **Payment Webhook**: Idempotent webhook to process payment statuses.

## Folder Structure

```
├── Dockerfile
├── docker-compose.yml
├── package.json
├── src
│   ├── app.js               # Express app setup and routes
│   ├── server.js            # Server entry point
│   ├── config
│   │   └── database.js      # Sequelize database configuration
│   ├── controllers          # Route logic
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── centreController.js
│   │   └── paymentController.js
│   ├── middleware           # Custom middlewares (auth, errors)
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models               # Sequelize models
│   │   ├── Booking.js
│   │   ├── Centre.js
│   │   ├── Payment.js
│   │   ├── Test.js
│   │   ├── User.js
│   │   └── index.js
│   └── routes               # Express routes and Swagger annotations
│       ├── authRoutes.js
│       ├── bookingRoutes.js
│       ├── centreRoutes.js
│       └── paymentRoutes.js
└── tests
    └── api.test.js          # Integration tests with Jest and Supertest
```

## How to Run Locally

### Using Docker (Recommended)

1. Ensure Docker and Docker Compose are installed.
2. Run the following command to build and start the containers:
   ```bash
   docker-compose up --build
   ```
3. The API will be available at `http://localhost:3000`.
4. The Swagger API documentation is available at `http://localhost:3000/api-docs`.

### Running manually without Docker

1. Ensure you have Node.js and PostgreSQL installed.
2. Create a database named `diagnostic_db` in PostgreSQL.
3. Set the environment variables (or rely on defaults in `.env` if created).
4. Run `npm install` to install dependencies.
5. Run `npm start` to start the server.

## Running Tests

To run the automated tests, ensure you have a test database running or use the in-memory/local SQLite option (if configured for tests, though this uses Postgres by default).
The tests use Jest and Supertest.

```bash
npm test
```

*(Note: The tests in `api.test.js` connect to the database configured in your env vars, so make sure a local Postgres instance is running or adjust the test config accordingly.)*

## Assumptions Made

- No frontend is required.
- SQLite can be used for testing, or we just rely on Postgres and clear tables. (For simplicity, the tests sync the database and use transactions or clear it).
- `amount` in bookings and payments is treated as a DECIMAL(10, 2).
- The webhook idempotency relies on `provider_event_id` being unique. If another request attempts to insert the same ID, a unique constraint error is thrown and gracefully handled by returning a 200 OK.

## What I'd Improve with More Time

- **Database Migrations**: Use Sequelize CLI to create and manage migrations instead of `sequelize.sync()`.
- **Validation**: Integrate a validation library like Joi or express-validator for robust request body validation.
- **Pagination**: Add pagination to endpoints returning lists (like `/centres` and `/bookings`).
- **Test Coverage**: Write more extensive unit and integration tests, perhaps using an in-memory database like SQLite for faster execution and isolation.
- **Logging**: Implement a logger like Winston or Pino instead of `console.log`.
- **Environment Management**: Use a `.env` file explicitly managed via `dotenv-safe`.
