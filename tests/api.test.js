/**
 * Comprehensive API test suite.
 *
 * Uses Jest + Supertest with an in-memory SQLite database (NODE_ENV=test).
 * Tests cover: Auth, Bookings, Payments (simulate + webhook).
 *
 * Timezone note: appointment_time is always submitted as an ISO 8601 UTC string.
 * The server treats it as UTC.
 */

process.env.JWT_SECRET = 'test-secret-key';

const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Centre, Test, Booking, Payment } = require('../src/models');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns an ISO 8601 string N hours from now (UTC) */
const futureDate = (hoursFromNow = 48) => {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow);
  return d.toISOString();
};

/** Returns an ISO 8601 string N hours ago */
const pastDate = (hoursAgo = 48) => {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
};

// ─── Setup / Teardown ───────────────────────────────────────────────────────

let testId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const centre = await Centre.create({ name: 'Test Centre', location: 'Test City' });
  const test = await Test.create({ centre_id: centre.id, name: 'Blood Test', price: 50.00 });
  testId = test.id;
});

afterAll(async () => {
  await sequelize.close();
});

// ─── Auth Tests ──────────────────────────────────────────────────────────────

describe('Auth', () => {
  describe('POST /auth/signup', () => {
    it('should sign up a new user successfully', async () => {
      const res = await request(app).post('/auth/signup').send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123'
      });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('alice@example.com');
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: 'missing@example.com',
        password: 'password123'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app).post('/auth/signup').send({
        name: 'Bob',
        password: 'password123'
      });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app).post('/auth/signup').send({
        name: 'Bob',
        email: 'bob2@example.com'
      });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for duplicate email', async () => {
      const res = await request(app).post('/auth/signup').send({
        name: 'Alice Again',
        email: 'alice@example.com', // already registered above
        password: 'password123'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });
  });

  describe('POST /auth/login', () => {
    it('should login and return a JWT', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'alice@example.com',
        password: 'password123'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'alice@example.com',
        password: 'wrongpassword'
      });
      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123'
      });
      expect(res.statusCode).toBe(401);
    });
  });
});

// ─── Booking Tests ───────────────────────────────────────────────────────────

describe('Bookings', () => {
  let tokenA; // owner
  let tokenB; // other user
  let bookingId;

  beforeAll(async () => {
    // Register user A (owner)
    await request(app).post('/auth/signup').send({
      name: 'Owner User',
      email: 'owner@example.com',
      password: 'password123'
    });
    const loginA = await request(app).post('/auth/login').send({
      email: 'owner@example.com',
      password: 'password123'
    });
    tokenA = loginA.body.token;

    // Register user B (other)
    await request(app).post('/auth/signup').send({
      name: 'Other User',
      email: 'other@example.com',
      password: 'password123'
    });
    const loginB = await request(app).post('/auth/login').send({
      email: 'other@example.com',
      password: 'password123'
    });
    tokenB = loginB.body.token;
  });

  describe('POST /bookings', () => {
    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app).post('/bookings').send({
        test_id: testId,
        appointment_time: futureDate()
      });
      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for invalid JWT', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', 'Bearer invalid.token.here')
        .send({ test_id: testId, appointment_time: futureDate() });
      expect(res.statusCode).toBe(401);
    });

    it('should return 400 when test_id is missing', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ appointment_time: futureDate() });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 when appointment_time is missing', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ test_id: testId });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 when test_id is not a positive integer', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ test_id: -1, appointment_time: futureDate() });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 when test_id is zero', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ test_id: 0, appointment_time: futureDate() });
      expect(res.statusCode).toBe(400);
    });

    it('should return 404 when test_id does not exist', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ test_id: 99999, appointment_time: futureDate() });
      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for invalid appointment_time string', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ test_id: testId, appointment_time: 'hello' });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for empty appointment_time string', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ test_id: testId, appointment_time: '' });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for null appointment_time', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ test_id: testId, appointment_time: null });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for a past appointment_time', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ test_id: testId, appointment_time: pastDate() });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/future/i);
    });

    it('should create a booking successfully', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ test_id: testId, appointment_time: futureDate() });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('PENDING');
      bookingId = res.body.id;
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app).get(`/bookings/${bookingId}`);
      expect(res.statusCode).toBe(401);
    });

    it('should return 404 for a non-existent booking', async () => {
      const res = await request(app)
        .get('/bookings/99999')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.statusCode).toBe(404);
    });

    it('should return 403 when user B tries to access user A\'s booking', async () => {
      const res = await request(app)
        .get(`/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.statusCode).toBe(403);
    });

    it('should return 200 for the booking owner', async () => {
      const res = await request(app)
        .get(`/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(bookingId);
    });
  });
});

// ─── Payment Tests ───────────────────────────────────────────────────────────

describe('Payments (simulate)', () => {
  let tokenOwner;
  let tokenOther;
  let ownerBookingId;
  let cancelledBookingId;

  beforeAll(async () => {
    // Create owner
    await request(app).post('/auth/signup').send({
      name: 'Pay Owner',
      email: 'payowner@example.com',
      password: 'password123'
    });
    const loginOwner = await request(app).post('/auth/login').send({
      email: 'payowner@example.com',
      password: 'password123'
    });
    tokenOwner = loginOwner.body.token;

    // Create other user
    await request(app).post('/auth/signup').send({
      name: 'Pay Other',
      email: 'payother@example.com',
      password: 'password123'
    });
    const loginOther = await request(app).post('/auth/login').send({
      email: 'payother@example.com',
      password: 'password123'
    });
    tokenOther = loginOther.body.token;

    // Create a PENDING booking for owner
    const bookingRes = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ test_id: testId, appointment_time: futureDate() });
    ownerBookingId = bookingRes.body.id;

    // Create a CANCELLED booking directly in DB
    const cancelledBooking = await Booking.create({
      user_id: (await User.findOne({ where: { email: 'payowner@example.com' } })).id,
      test_id: testId,
      appointment_time: futureDate(100),
      amount: 50.00,
      status: 'CANCELLED'
    });
    cancelledBookingId = cancelledBooking.id;
  });

  it('should return 401 for unauthenticated payment', async () => {
    const res = await request(app).post('/payments').send({ booking_id: ownerBookingId });
    expect(res.statusCode).toBe(401);
  });

  it('should return 400 when booking_id is missing', async () => {
    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('should return 404 for a non-existent booking', async () => {
    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ booking_id: 99999 });
    expect(res.statusCode).toBe(404);
  });

  it('should return 403 when user tries to pay another user\'s booking', async () => {
    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${tokenOther}`)
      .send({ booking_id: ownerBookingId });
    expect(res.statusCode).toBe(403);
  });

  it('should return 409 when booking is CANCELLED', async () => {
    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ booking_id: cancelledBookingId });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/CANCELLED/);
  });

  it('should process payment and update booking status', async () => {
    // Force the booking to PENDING so we can pay it
    await Booking.update({ status: 'PENDING' }, { where: { id: ownerBookingId } });

    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ booking_id: ownerBookingId });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('payment');
    expect(['SUCCESS', 'FAILED']).toContain(res.body.payment.status);

    const updatedBooking = await Booking.findByPk(ownerBookingId);
    if (res.body.payment.status === 'SUCCESS') {
      expect(updatedBooking.status).toBe('CONFIRMED');
    } else {
      expect(updatedBooking.status).toBe('FAILED');
    }
  });

  it('should return 409 when booking is already CONFIRMED', async () => {
    // Manually set booking to CONFIRMED
    await Booking.update({ status: 'CONFIRMED' }, { where: { id: ownerBookingId } });

    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ booking_id: ownerBookingId });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/CONFIRMED/);
  });

  it('should allow a retry payment on a FAILED booking', async () => {
    // Create a fresh FAILED booking
    const failedBooking = await Booking.create({
      user_id: (await User.findOne({ where: { email: 'payowner@example.com' } })).id,
      test_id: testId,
      appointment_time: futureDate(200),
      amount: 50.00,
      status: 'FAILED'
    });

    const res = await request(app)
      .post('/payments')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ booking_id: failedBooking.id });

    // FAILED→CONFIRMED or FAILED→FAILED are both allowed
    expect([200]).toContain(res.statusCode);
  });
});

// ─── Webhook Tests ───────────────────────────────────────────────────────────

describe('Payments (webhook)', () => {
  let webhookBookingId;

  beforeAll(async () => {
    // Create a fresh PENDING booking directly via DB
    const user = await User.findOne({ where: { email: 'payowner@example.com' } });
    const booking = await Booking.create({
      user_id: user.id,
      test_id: testId,
      appointment_time: futureDate(300),
      amount: 50.00,
      status: 'PENDING'
    });
    webhookBookingId = booking.id;
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app).post('/payments/webhook').send({
      provider_event_id: 'evt_missing',
      booking_id: webhookBookingId
      // status missing
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for invalid status', async () => {
    const res = await request(app).post('/payments/webhook').send({
      provider_event_id: 'evt_bad_status',
      booking_id: webhookBookingId,
      status: 'PENDING'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/status/i);
  });

  it('should return 404 for a non-existent booking', async () => {
    const res = await request(app).post('/payments/webhook').send({
      provider_event_id: 'evt_no_booking',
      booking_id: 99999,
      status: 'SUCCESS'
    });
    expect(res.statusCode).toBe(404);
  });

  it('should process a FAILED webhook and set booking to FAILED', async () => {
    // Create a fresh booking for this test
    const user = await User.findOne({ where: { email: 'payowner@example.com' } });
    const booking = await Booking.create({
      user_id: user.id,
      test_id: testId,
      appointment_time: futureDate(400),
      amount: 50.00,
      status: 'PENDING'
    });

    const res = await request(app).post('/payments/webhook').send({
      provider_event_id: `evt_failed_${booking.id}`,
      booking_id: booking.id,
      status: 'FAILED'
    });

    expect(res.statusCode).toBe(200);

    const updated = await Booking.findByPk(booking.id);
    expect(updated.status).toBe('FAILED');

    const payments = await Payment.findAll({ where: { booking_id: booking.id } });
    expect(payments.length).toBe(1);
    expect(payments[0].status).toBe('FAILED');
  });

  it('should process a SUCCESS webhook and confirm booking', async () => {
    const res = await request(app).post('/payments/webhook').send({
      provider_event_id: 'evt_success_001',
      booking_id: webhookBookingId,
      status: 'SUCCESS'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Webhook processed successfully');

    const booking = await Booking.findByPk(webhookBookingId);
    expect(booking.status).toBe('CONFIRMED');

    const payments = await Payment.findAll({ where: { provider_event_id: 'evt_success_001' } });
    expect(payments.length).toBe(1);
    expect(payments[0].status).toBe('SUCCESS');
  });

  it('should return 200 idempotently for duplicate webhook with same payload', async () => {
    // Same event again
    const res = await request(app).post('/payments/webhook').send({
      provider_event_id: 'evt_success_001',
      booking_id: webhookBookingId,
      status: 'SUCCESS'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/already processed/i);

    // Must not create a second payment record
    const payments = await Payment.findAll({ where: { provider_event_id: 'evt_success_001' } });
    expect(payments.length).toBe(1);
  });

  it('should not change booking status on duplicate webhook', async () => {
    const booking = await Booking.findByPk(webhookBookingId);
    // Still CONFIRMED from the first event; idempotent re-send should not change it
    expect(booking.status).toBe('CONFIRMED');
  });

  it('should return 409 for conflicting duplicate provider_event_id', async () => {
    // evt_success_001 was booking_id=webhookBookingId, status=SUCCESS
    // Now send same provider_event_id with a different booking_id or status
    const res = await request(app).post('/payments/webhook').send({
      provider_event_id: 'evt_success_001',
      booking_id: 9999, // different booking
      status: 'FAILED'  // different status
    });

    expect(res.statusCode).toBe(409);
  });
});
