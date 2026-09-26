const { Booking, Test, Centre } = require('../models');

exports.createBooking = async (req, res) => {
  try {
    const { test_id, appointment_time } = req.body;
    const user_id = req.user.userId;

    if (!test_id || !appointment_time) {
      return res.status(400).json({ error: 'test_id and appointment_time are required' });
    }

    const test = await Test.findByPk(test_id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const booking = await Booking.create({
      user_id,
      test_id,
      appointment_time,
      amount: test.price,
      status: 'PENDING'
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const bookings = await Booking.findAll({
      where: { user_id },
      include: [
        {
          model: Test,
          include: [Centre]
        }
      ]
    });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Test,
          include: [Centre]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized access to booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
