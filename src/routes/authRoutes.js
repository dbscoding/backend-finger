// src/routes/authRoutes.js
const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Protected routes
router.use(authenticateToken);
router.post('/logout', AuthController.logout);
router.get('/profile', AuthController.getProfile);

module.exports = router;