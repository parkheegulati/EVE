const { Payment, Booking } = require('../models');

exports.simulatePayment = async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Simulate success or failure randomly (e.g., 80% success rate)
    const isSuccess = Math.random() < 0.8;
    const status = isSuccess ? 'SUCCESS' : 'FAILED';
    const bookingStatus = isSuccess ? 'CONFIRMED' : 'FAILED';
    
    // Using a fake provider event id for simulation
    const provider_event_id = `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const payment = await Payment.create({
      booking_id,
      provider_event_id,
      status,
      amount: booking.amount
    });

    await booking.update({ status: bookingStatus });

    res.json({
      message: `Payment simulated: ${status}`,
      payment,
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
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Idempotency check: see if payment event already exists
    const existingPayment = await Payment.findOne({ where: { provider_event_id } });
    if (existingPayment) {
      // Just acknowledge and exit
      return res.status(200).json({ message: 'Webhook received (already processed)' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Create payment record
    await Payment.create({
      booking_id,
      provider_event_id,
      status,
      amount: booking.amount
    });

    // Update booking status
    const bookingStatus = status === 'SUCCESS' ? 'CONFIRMED' : 'FAILED';
    await booking.update({ status: bookingStatus });

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    // If the error is a unique constraint violation (another concurrent request created it), just acknowledge
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(200).json({ message: 'Webhook received (concurrently processed)' });
    }
    
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
