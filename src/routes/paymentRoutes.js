const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Simulate a payment for a booking (authenticated)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *             properties:
 *               booking_id:
 *                 type: integer
 *                 description: ID of the booking to pay for (must be owned by the authenticated user)
 *     responses:
 *       200:
 *         description: Payment simulated (SUCCESS or FAILED)
 *       400:
 *         description: Invalid input (missing booking_id)
 *       401:
 *         description: Unauthenticated — JWT missing or invalid
 *       403:
 *         description: Forbidden — booking belongs to another user
 *       404:
 *         description: Booking not found
 *       409:
 *         description: Conflict — booking is already CONFIRMED or CANCELLED and cannot be paid again
 */
router.post('/', authMiddleware, paymentController.simulatePayment);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Payment webhook (idempotent)
 *     tags: [Payments]
 *     description: |
 *       Processes an external payment event. Idempotent on `provider_event_id`.
 *       - Same `provider_event_id` with the same `booking_id` and `status` → 200 (no-op).
 *       - Same `provider_event_id` with a different `booking_id` or `status` → 409 Conflict.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider_event_id
 *               - booking_id
 *               - status
 *             properties:
 *               provider_event_id:
 *                 type: string
 *                 description: Unique identifier for the payment event from the payment provider
 *               booking_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [SUCCESS, FAILED]
 *     responses:
 *       200:
 *         description: Webhook processed (or already processed — idempotent)
 *       400:
 *         description: Invalid input (missing fields or invalid status)
 *       404:
 *         description: Booking not found
 *       409:
 *         description: Conflict — same provider_event_id already processed with different data
 */
router.post('/webhook', paymentController.paymentWebhook);

module.exports = router;
