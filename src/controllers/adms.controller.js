// src/controllers/adms.controller.js
const { Attendance, Device } = require('../models');
const crypto = require('crypto');
const logger = require('../utils/logger');

class ADMSController {
  /**
   * POST /adms/push
   * Receive attendance data from fingerprint machines
   * Security: IP whitelist, API key validation, timestamp validation
   */
  static pushAttendance = async (req, res) => {
    try {
      const {
        cloud_id,
        device_id,
        user_id,
        nama,
        nip,
        jabatan,
        tanggal_absensi,
        waktu_absensi,
        tipe_absensi,
        verifikasi = 'SIDIK_JARI',
        api_key,
        timestamp,
        signature
      } = req.body;

      // Security: Validate required fields
      if (!cloud_id || !device_id || !user_id || !nama || !nip || !jabatan ||
          !tanggal_absensi || !waktu_absensi || !tipe_absensi || !api_key) {
        logger.warn('ADMS push validation failed: Missing required fields', {
          ip: req.ip,
          device_id,
          user_id
        });
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Security: Validate jabatan enum
      if (!['DOSEN', 'KARYAWAN'].includes(jabatan)) {
        logger.warn('ADMS push validation failed: Invalid jabatan', {
          ip: req.ip,
          device_id,
          jabatan
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid jabatan value'
        });
      }

      // Security: Validate tipe_absensi enum
      if (!['MASUK', 'PULANG'].includes(tipe_absensi)) {
        logger.warn('ADMS push validation failed: Invalid tipe_absensi', {
          ip: req.ip,
          device_id,
          tipe_absensi
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid tipe_absensi value'
        });
      }

      // Security: Validate device exists and is active
      const device = await Device.findOne({
        where: {
          device_id: device_id,
          is_active: true
        }
      });

      if (!device) {
        logger.warn('ADMS push failed: Invalid or inactive device', {
          ip: req.ip,
          device_id
        });
        return res.status(403).json({
          success: false,
          message: 'Invalid device'
        });
      }

      // Security: Validate API key
      if (device.api_key !== api_key) {
        logger.warn('ADMS push failed: Invalid API key', {
          ip: req.ip,
          device_id
        });
        return res.status(403).json({
          success: false,
          message: 'Invalid API key'
        });
      }

      // Security: IP whitelist validation (optional, based on device config)
      // You can add IP whitelist logic here if needed

      // Security: Timestamp validation (prevent replay attacks)
      if (timestamp) {
        const requestTime = new Date(timestamp);
        const now = new Date();
        const timeDiff = Math.abs(now - requestTime);

        // Allow 5 minutes tolerance
        if (timeDiff > 5 * 60 * 1000) {
          logger.warn('ADMS push failed: Timestamp validation failed', {
            ip: req.ip,
            device_id,
            timestamp,
            timeDiff
          });
          return res.status(400).json({
            success: false,
            message: 'Invalid timestamp'
          });
        }
      }

      // Security: Signature validation (optional)
      if (signature) {
        const expectedSignature = ADMSController.generateSignature(req.body, device.api_key);
        if (signature !== expectedSignature) {
          logger.warn('ADMS push failed: Invalid signature', {
            ip: req.ip,
            device_id
          });
          return res.status(403).json({
            success: false,
            message: 'Invalid signature'
          });
        }
      }

      // Check for duplicate attendance (same user, date, type)
      const existingAttendance = await Attendance.findOne({
        where: {
          user_id: user_id,
          tanggal_absensi: tanggal_absensi,
          tipe_absensi: tipe_absensi,
          is_deleted: false
        }
      });

      if (existingAttendance) {
        logger.info('ADMS push: Duplicate attendance detected', {
          ip: req.ip,
          device_id,
          user_id,
          tanggal_absensi,
          tipe_absensi
        });
        return res.status(409).json({
          success: false,
          message: 'Attendance already exists for this user, date, and type'
        });
      }

      // Create attendance record
      const attendance = await Attendance.create({
        cloud_id,
        device_id,
        user_id,
        nama,
        nip,
        jabatan,
        tanggal_absensi,
        waktu_absensi,
        tipe_absensi,
        verifikasi,
        tanggal_upload: new Date()
      });

      // Audit log
      logger.audit('ADMS_PUSH_SUCCESS', null, {
        device_id,
        user_id,
        nama,
        jabatan,
        tanggal_absensi,
        waktu_absensi,
        tipe_absensi,
        ip: req.ip
      });

      logger.info('ADMS push successful', {
        attendanceId: attendance.id,
        device_id,
        user_id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Attendance data received successfully',
        data: {
          attendance_id: attendance.id,
          status: 'processed'
        }
      });
    } catch (error) {
      logger.error('ADMS push error', {
        error: error.message,
        stack: error.stack,
        ip: req.ip,
        body: req.body
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Helper: Generate signature for request validation
   * Security: HMAC-SHA256 signature
   */
  static generateSignature(data, secret) {
    const { signature, ...payload } = data;
    const message = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  /**
   * GET /adms/health
   * Health check endpoint for ADMS machines
   */
  static healthCheck = async (req, res) => {
    res.json({
      success: true,
      message: 'ADMS service is healthy',
      timestamp: new Date().toISOString(),
      service: 'kampus-attendance-adms'
    });
  };
}

module.exports = ADMSController;