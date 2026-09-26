const sequelize = require('../config/database');
const User = require('./User');
const Centre = require('./Centre');
const Test = require('./Test');
const Booking = require('./Booking');
const Payment = require('./Payment');

// Associations
Centre.hasMany(Test, { foreignKey: 'centre_id' });
Test.belongsTo(Centre, { foreignKey: 'centre_id' });

User.hasMany(Booking, { foreignKey: 'user_id' });
Booking.belongsTo(User, { foreignKey: 'user_id' });

Test.hasMany(Booking, { foreignKey: 'test_id' });
Booking.belongsTo(Test, { foreignKey: 'test_id' });

Booking.hasMany(Payment, { foreignKey: 'booking_id' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id' });

module.exports = {
  sequelize,
  User,
  Centre,
  Test,
  Booking,
  Payment
};
