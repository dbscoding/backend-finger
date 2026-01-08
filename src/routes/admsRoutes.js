// src/routes/admsRoutes.js
const express = require('express');
const AdmsController = require('../controllers/admsController');
const {
  ipWhitelist,
  validateApiKey,
  validateTimestamp,
  logAdmsRequest,
  validateSerialNumber
} = require('../middleware/admsSecurity');

const router = express.Router();

// Apply ADMS security middleware (order matters)
// 1. IP whitelist
router.use(ipWhitelist);

// 2. API key validation
router.use(validateApiKey);

// 3. Timestamp validation (anti-replay)
router.use(validateTimestamp);

// 4. Request logging
router.use(logAdmsRequest);

// ADMS endpoints (no JWT required)
router.post('/attendance', validateSerialNumber, AdmsController.receiveAttendance);
router.get('/status', AdmsController.getDeviceStatus);

module.exports = router;