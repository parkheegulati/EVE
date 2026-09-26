const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Test = require('./Test');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  test_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Test,
      key: 'id'
    }
  },
  appointment_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'),
    defaultValue: 'PENDING',
    allowNull: false
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Booking;
