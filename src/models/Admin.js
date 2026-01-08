// src/models/Admin.js - Model untuk autentikasi admin
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Username untuk login'
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Hash password bcrypt'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Email admin'
  },
  role: {
    type: DataTypes.ENUM('admin'),
    allowNull: false,
    defaultValue: 'admin',
    comment: 'Role pengguna (hanya admin)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Status aktif admin'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp login terakhir'
  }
}, {
  tableName: 'admins',
  indexes: [
    { fields: ['username'], unique: true },
    { fields: ['role'] },
    { fields: ['is_active'] }
  ],
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods - Metode instance
Admin.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// Hash password sebelum menyimpan
Admin.beforeCreate(async (admin) => {
  if (admin.password_hash) {
    const saltRounds = 12;
    admin.password_hash = await bcrypt.hash(admin.password_hash, saltRounds);
  }
});

Admin.beforeUpdate(async (admin) => {
  if (admin.changed('password_hash')) {
    const saltRounds = 12;
    admin.password_hash = await bcrypt.hash(admin.password_hash, saltRounds);
  }
});

module.exports = Admin;