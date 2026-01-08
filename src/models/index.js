// src/models/index.js
const { sequelize } = require('../config/database');
const Admin = require('./Admin');
const Device = require('./Device');
const Attendance = require('./Attendance');

// Define associations
Device.hasMany(Attendance, { foreignKey: 'device_id', sourceKey: 'device_id' });
Attendance.belongsTo(Device, { foreignKey: 'device_id', targetKey: 'device_id' });

module.exports = {
  sequelize,
  Admin,
  Device,
  Attendance
};