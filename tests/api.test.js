const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Centre, Test, Booking, Payment } = require('../src/models');

beforeAll(async () => {
  // Use force: true to recreate tables for testing
  await sequelize.sync({ force: true });

  // Seed basic data
  const centre = await Centre.create({ name: 'Test Centre', location: 'Test Location' });
  await Test.create({ centre_id: centre.id, name: 'Blood Test', price: 50.00 });
});

afterAll(async () => {
  await sequelize.close();
});

describe('API Tests', () => {
  let userToken;
  let testId = 1;
  let bookingId;

  it('should sign up a user', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
  });

  it('should login a user and return a token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'john@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    userToken = res.body.token;
  });

  it('should create a booking', async () => {
    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        test_id: testId,
        appointment_time: new Date().toISOString()
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toEqual('PENDING');
    bookingId = res.body.id;
  });

  it('should process webhook payment successfully', async () => {
    const providerEventId = 'event_12345';
    const res = await request(app)
      .post('/payments/webhook')
      .send({
        provider_event_id: providerEventId,
        booking_id: bookingId,
        status: 'SUCCESS'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Webhook processed successfully');

    // Check if booking status updated
    const booking = await Booking.findByPk(bookingId);
    expect(booking.status).toEqual('CONFIRMED');
  });

  it('should handle webhook idempotency', async () => {
    const providerEventId = 'event_12345';
    // Send exact same webhook again
    const res = await request(app)
      .post('/payments/webhook')
      .send({
        provider_event_id: providerEventId,
        booking_id: bookingId,
        status: 'SUCCESS'
      });
    
    // Should return 200 without error
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toMatch(/Webhook received/);

    // Verify only one payment record exists
    const payments = await Payment.findAll({ where: { provider_event_id: providerEventId } });
    expect(payments.length).toEqual(1);
  });
});
