// src/models/Device.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  device_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  serial_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  ip_address: {
    type: DataTypes.STRING(45), // IPv6 compatible
    allowNull: false
  },
  api_key: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  faculty: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_seen: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'devices',
  indexes: [
    { fields: ['device_id'] },
    { fields: ['serial_number'] },
    { fields: ['ip_address'] },
    { fields: ['is_active'] }
  ]
});

module.exports = Device;