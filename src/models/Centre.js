const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Centre = sequelize.define('Centre', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'centres',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Centre;
