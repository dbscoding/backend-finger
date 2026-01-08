// src/controllers/admsController.js
const { getRawPool } = require('../config/database');
const winston = require('winston');

// Configure ADMS specific logger
const admsLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/adms_data.log' })
  ]
});

class AdmsController {
  // Receive fingerprint attendance data
  static receiveAttendance = async (req, res) => {
    const pool = getRawPool();
    let connection;

    try {
      const {
        cloud_id,
        pin, // user_id from fingerprint machine
        nama,
        tanggal_absensi,
        waktu_absensi,
        verifikasi,
        tipe_absensi,
        sn // serial number
      } = req.body;

      // Validate required fields
      if (!cloud_id || !pin || !nama || !tanggal_absensi || !waktu_absensi || !tipe_absensi) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Validate tipe_absensi
      if (!['MASUK', 'PULANG'].includes(tipe_absensi.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tipe_absensi. Must be MASUK or PULANG'
        });
      }

      connection = await pool.getConnection();

      // Insert attendance data using raw SQL for performance
      const query = `
        INSERT INTO attendance
        (cloud_id, device_id, user_id, nama, tanggal_absensi, waktu_absensi, verifikasi, tipe_absensi, tanggal_upload, kategori_user, created_at, updated_at, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'DOSEN', NOW(), NOW(), FALSE)
      `;

      const values = [
        cloud_id,
        req.device.device_id,
        pin,
        nama,
        tanggal_absensi,
        waktu_absensi,
        verifikasi || 'Sidik Jari',
        tipe_absensi.toUpperCase(),
      ];

      const [result] = await connection.execute(query, values);

      // Log successful data insertion
      admsLogger.info('Attendance data received and stored', {
        attendanceId: result.insertId,
        deviceId: req.device.device_id,
        userId: pin,
        tipeAbsensi: tipe_absensi,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Attendance data received successfully',
        data: {
          id: result.insertId,
          device_id: req.device.device_id,
          user_id: pin,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('ADMS receive attendance error:', error);

      admsLogger.error('Failed to store attendance data', {
        error: error.message,
        deviceId: req.device?.device_id,
        body: req.body,
        timestamp: new Date().toISOString()
      });

      // Check for duplicate entry
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Duplicate attendance record'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to process attendance data'
      });
    } finally {
      if (connection) connection.release();
    }
  };

  // Get device status
  static getDeviceStatus = async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Device is active',
        data: {
          device_id: req.device.device_id,
          serial_number: req.device.serial_number,
          location: req.device.location,
          faculty: req.device.faculty,
          last_seen: new Date().toISOString(),
          status: 'active'
        }
      });
    } catch (error) {
      console.error('Get device status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

module.exports = AdmsController;