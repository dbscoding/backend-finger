// src/controllers/authController.js
const bcrypt = require('bcrypt');
const { User } = require('../models');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { body, validationResult } = require('express-validator');

class AuthController {
  // Login user
  static login = [
    // Validation
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),

    async (req, res) => {
      try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
          });
        }

        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({
          where: { username, is_active: true }
        });

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Update last login
        await user.update({ last_login: new Date() });

        res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              email: user.email
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
        console.error('Login error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  ];

  // Refresh access token
  static refreshToken = async (req, res) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refresh_token);

      // Find user
      const user = await User.findByPk(decoded.id);
      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const { accessToken } = generateTokens(user);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 15 * 60
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  };

  // Logout (client-side token removal)
  static logout = (req, res) => {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  };

  // Get current user profile
  static getProfile = async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

module.exports = AuthController;