// src/middleware/admsSecurity.js
const crypto = require('crypto');
const { Device } = require('../models');
const winston = require('winston');

// Configure logging for ADMS requests
const admsLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/adms.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// IP Whitelisting middleware
const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  // Allow localhost for development
  if (process.env.NODE_ENV === 'development' && (clientIP === '127.0.0.1' || clientIP === '::1')) {
    return next();
  }

  // In production, check against allowed IPs
  const allowedIPs = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [];

  if (!allowedIPs.includes(clientIP)) {
    admsLogger.warn('Blocked request from unauthorized IP', {
      ip: clientIP,
      endpoint: req.originalUrl,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      success: false,
      message: 'IP address not authorized'
    });
  }

  next();
};

// API Key validation middleware
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
      admsLogger.warn('Missing API key', {
        ip: req.ip,
        endpoint: req.originalUrl
      });

      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }

    // Find device by API key
    const device = await Device.findOne({
      where: {
        api_key: apiKey,
        is_active: true
      }
    });

    if (!device) {
      admsLogger.warn('Invalid API key', {
        ip: req.ip,
        apiKey: apiKey.substring(0, 8) + '...', // Log partial key for security
        endpoint: req.originalUrl
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Attach device info to request
    req.device = {
      id: device.id,
      device_id: device.device_id,
      serial_number: device.serial_number,
      location: device.location,
      faculty: device.faculty
    };

    next();
  } catch (error) {
    console.error('API key validation error:', error);
    admsLogger.error('API key validation error', {
      error: error.message,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Timestamp validation to prevent replay attacks
const validateTimestamp = (req, res, next) => {
  const timestamp = req.headers['x-timestamp'] || req.body.timestamp;
  const currentTime = Date.now();
  const tolerance = 5 * 60 * 1000; // 5 minutes tolerance

  if (!timestamp) {
    admsLogger.warn('Missing timestamp', {
      ip: req.ip,
      endpoint: req.originalUrl
    });

    return res.status(400).json({
      success: false,
      message: 'Timestamp is required'
    });
  }

  const requestTime = parseInt(timestamp);
  const timeDiff = Math.abs(currentTime - requestTime);

  if (timeDiff > tolerance) {
    admsLogger.warn('Timestamp validation failed', {
      ip: req.ip,
      requestTime,
      currentTime,
      timeDiff,
      endpoint: req.originalUrl
    });

    return res.status(400).json({
      success: false,
      message: 'Request timestamp is invalid or expired'
    });
  }

  next();
};

// Request logging middleware
const logAdmsRequest = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  admsLogger.info('ADMS request received', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    deviceId: req.device?.device_id || 'unknown',
    timestamp: new Date().toISOString()
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    admsLogger.info('ADMS request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      deviceId: req.device?.device_id || 'unknown'
    });
  });

  next();
};

// Serial number validation
const validateSerialNumber = async (req, res, next) => {
  try {
    const { sn } = req.body; // Serial number from fingerprint machine

    if (!sn) {
      return res.status(400).json({
        success: false,
        message: 'Serial number is required'
      });
    }

    // Verify serial number matches the device
    if (req.device.serial_number !== sn) {
      admsLogger.warn('Serial number mismatch', {
        expected: req.device.serial_number,
        received: sn,
        deviceId: req.device.device_id,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        message: 'Serial number validation failed'
      });
    }

    next();
  } catch (error) {
    console.error('Serial number validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  ipWhitelist,
  validateApiKey,
  validateTimestamp,
  logAdmsRequest,
  validateSerialNumber
};