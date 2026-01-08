// src/middleware/auth.js
const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = verifyAccessToken(token);

    // Fetch user from database to ensure they still exist and are active
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware for role-based authorization
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Combined middleware for different roles
const requireAdmin = authorizeRoles('admin');
const requireHR = authorizeRoles('admin', 'hr');
const requireOperator = authorizeRoles('admin', 'hr', 'operator');
const requireViewer = authorizeRoles('admin', 'hr', 'operator', 'viewer');

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireAdmin,
  requireHR,
  requireOperator,
  requireViewer
};