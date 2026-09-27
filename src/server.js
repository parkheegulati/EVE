const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

// Fail fast if critical env vars are missing
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync models (in production, use migrations instead of sync)
    await sequelize.sync();
    console.log('Models synchronized with database.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
