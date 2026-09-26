const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Simulate a payment for a booking
 *     tags: [Payments]
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
 *     responses:
 *       200:
 *         description: Payment simulated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Booking not found
 */
router.post('/', paymentController.simulatePayment);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Payment webhook (idempotent)
 *     tags: [Payments]
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
 *               booking_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [SUCCESS, FAILED]
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Booking not found
 */
router.post('/webhook', paymentController.paymentWebhook);

module.exports = router;
