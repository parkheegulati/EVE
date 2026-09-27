const { Payment, Booking, sequelize } = require('../models');

// Valid booking statuses that allow a new payment attempt
const PAYABLE_STATUSES = ['PENDING', 'FAILED'];

exports.simulatePayment = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const user_id = req.user.userId;

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Authorization: requester must own the booking
    if (booking.user_id !== user_id) {
      return res.status(403).json({ error: 'Forbidden: you do not own this booking' });
    }

    // State machine: only allow payment on PENDING or FAILED bookings
    if (!PAYABLE_STATUSES.includes(booking.status)) {
      return res.status(409).json({
        error: `Cannot process payment: booking is already ${booking.status}`
      });
    }

    // Simulate success or failure (80% success rate)
    const isSuccess = Math.random() < 0.8;
    const status = isSuccess ? 'SUCCESS' : 'FAILED';
    const bookingStatus = isSuccess ? 'CONFIRMED' : 'FAILED';

    // Use a unique provider_event_id for each simulation attempt
    const provider_event_id = `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Atomic: create payment and update booking in a single transaction
    const payment = await sequelize.transaction(async (t) => {
      const newPayment = await Payment.create({
        booking_id,
        provider_event_id,
        status,
        amount: booking.amount
      }, { transaction: t });

      await booking.update({ status: bookingStatus }, { transaction: t });

      return newPayment;
    });

    res.json({
      message: `Payment simulated: ${status}`,
      payment: {
        id: payment.id,
        booking_id: payment.booking_id,
        status: payment.status,
        amount: payment.amount
      },
      booking: {
        id: booking.id,
        status: booking.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.paymentWebhook = async (req, res) => {
  try {
    const { provider_event_id, booking_id, status } = req.body;

    if (!provider_event_id || !booking_id || !status) {
      return res.status(400).json({ error: 'provider_event_id, booking_id, and status are required' });
    }

    if (status !== 'SUCCESS' && status !== 'FAILED') {
      return res.status(400).json({ error: 'Invalid status: must be SUCCESS or FAILED' });
    }

    // Idempotency check: look for an already-processed event
    const existingPayment = await Payment.findOne({ where: { provider_event_id } });
    if (existingPayment) {
      // Same payload → idempotent success
      if (
        existingPayment.booking_id === Number(booking_id) &&
        existingPayment.status === status
      ) {
        return res.status(200).json({ message: 'Webhook received (already processed)' });
      }

      // Conflicting payload → 409
      return res.status(409).json({
        error: 'Conflict: provider_event_id already processed with different booking_id or status'
      });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Atomic: create payment and update booking in a single transaction
    await sequelize.transaction(async (t) => {
      await Payment.create({
        booking_id,
        provider_event_id,
        status,
        amount: booking.amount
      }, { transaction: t });

      const bookingStatus = status === 'SUCCESS' ? 'CONFIRMED' : 'FAILED';
      await booking.update({ status: bookingStatus }, { transaction: t });
    });

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    // Race-condition guard: if a concurrent request already inserted this event
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(200).json({ message: 'Webhook received (concurrently processed)' });
    }

    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
