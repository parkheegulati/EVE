const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Book a diagnostic test
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - test_id
 *               - appointment_time
 *             properties:
 *               test_id:
 *                 type: integer
 *                 description: Must be a valid positive integer referencing an existing test
 *               appointment_time:
 *                 type: string
 *                 format: date-time
 *                 description: |
 *                   ISO 8601 date-time string. Must be a valid date and must be in the future (UTC).
 *                   Example: "2026-12-01T10:00:00Z"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: |
 *           Invalid input. Possible reasons:
 *           - test_id or appointment_time missing
 *           - test_id is not a positive integer
 *           - appointment_time is not a valid date
 *           - appointment_time is in the past
 *       401:
 *         description: Unauthenticated — JWT missing or invalid
 *       404:
 *         description: Test not found
 */
router.post('/', bookingController.createBooking);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: List logged-in user's own bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *       401:
 *         description: Unauthenticated — JWT missing or invalid
 */
router.get('/', bookingController.getUserBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a single booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking details
 *       401:
 *         description: Unauthenticated — JWT missing or invalid
 *       403:
 *         description: Forbidden — booking belongs to another user
 *       404:
 *         description: Booking not found
 */
router.get('/:id', bookingController.getBookingById);

module.exports = router;
