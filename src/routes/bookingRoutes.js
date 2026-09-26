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
 *               appointment_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
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
 *         description: Unauthorized
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
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (belongs to another user)
 *       404:
 *         description: Booking not found
 */
router.get('/:id', bookingController.getBookingById);

module.exports = router;
