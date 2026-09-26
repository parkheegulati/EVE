const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const errorMiddleware = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const centreRoutes = require('./routes/centreRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(express.json());

// Swagger setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Diagnostic Test Booking API',
      version: '1.0.0',
      description: 'API for booking diagnostic tests and simulating payments',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/auth', authRoutes);
app.use('/centres', centreRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentRoutes);

// Error Middleware
app.use(errorMiddleware);

module.exports = app;
