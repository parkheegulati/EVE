const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Centre = require('./Centre');

const Test = sequelize.define('Test', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  centre_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Centre,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Test;
