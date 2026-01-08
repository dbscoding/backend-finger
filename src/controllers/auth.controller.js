// src/controllers/auth.controller.js - Controller untuk autentikasi admin
const { Admin } = require('../models');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class AuthController {
  /**
   * POST /api/auth/login
   * Login admin dengan username dan password
   * Keamanan: Validasi kredensial, generate JWT tokens
   */
  static login = [
    // Validasi input
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username harus antara 3 dan 50 karakter'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password minimal 6 karakter'),

    async (req, res) => {
      try {
        // Periksa error validasi
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          logger.warn('Validasi login gagal', {
            ip: req.ip,
            errors: errors.array()
          });
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
          });
        }

        const { username, password } = req.body;

        // Find admin user
        const admin = await Admin.findOne({
          where: { username, is_active: true }
        });

        if (!admin) {
          logger.warn('Login failed: User not found', {
            username,
            ip: req.ip
          });
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        // Verify password
        const isValidPassword = await admin.checkPassword(password);
        if (!isValidPassword) {
          logger.warn('Login failed: Invalid password', {
            username,
            ip: req.ip
          });
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        // Generate JWT tokens
        const { accessToken, refreshToken } = generateTokens(admin);

        // Update last login
        await admin.update({ last_login: new Date() });

        // Audit log
        logger.audit('LOGIN_SUCCESS', admin.id, {
          username: admin.username,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: admin.id,
              username: admin.username,
              role: admin.role,
              email: admin.email
            },
            tokens: {
              access_token: accessToken,
              refresh_token: refreshToken,
              token_type: 'Bearer',
              expires_in: 15 * 60 // 15 minutes
            }
          }
        });
      } catch (error) {
        logger.error('Login error', {
          error: error.message,
          stack: error.stack,
          ip: req.ip
        });
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  ];

  /**
   * POST /api/auth/refresh
   * Refresh access token menggunakan refresh token
   * Keamanan: Validasi refresh token, keluarkan access token baru
   */
  static refreshToken = async (req, res) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token diperlukan'
        });
      }

      // Verifikasi refresh token
      const decoded = verifyRefreshToken(refresh_token);

      // Cari user admin
      const admin = await Admin.findByPk(decoded.id);
      if (!admin || !admin.is_active) {
        logger.warn('Refresh token gagal: User tidak ditemukan atau tidak aktif', {
          userId: decoded.id
        });
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(admin);

      // Audit log
      logger.audit('TOKEN_REFRESH', admin.id, {
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            access_token: accessToken,
            refresh_token: newRefreshToken,
            token_type: 'Bearer',
            expires_in: 15 * 60
          }
        }
      });
    } catch (error) {
      logger.error('Refresh token error', {
        error: error.message,
        ip: req.ip
      });
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  };

  /**
   * POST /api/auth/logout
   * Logout admin (invalidasi token sisi client)
   * Keamanan: Log event logout untuk audit
   */
  static logout = async (req, res) => {
    try {
      // Audit log
      logger.audit('LOGOUT', req.user.id, {
        username: req.user.username,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Logout berhasil'
      });
    } catch (error) {
      logger.error('Error logout', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

module.exports = AuthController;