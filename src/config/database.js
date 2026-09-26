const { Sequelize } = require('sequelize');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

const sequelize = isTest
  ? new Sequelize({
      dialect: 'sqlite',
      storage: './dev.sqlite', // File-based so seed and server share the same DB
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME || 'diagnostic_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASS || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
      }
    );

module.exports = sequelize;
