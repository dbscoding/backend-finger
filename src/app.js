// src/app.js - Aplikasi Express utama untuk Sistem Rekap Absensi Kampus
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const exportRoutes = require('./routes/export.routes');
const admsRoutes = require('./routes/adms.routes');

// Import middleware
const { requestLogger } = require('./middlewares/auth.middleware');

// Import Swagger
const { swaggerUi, specs } = require('./config/swagger');

// Import database
const { testSequelizeConnection } = require('./config/database');

// Import logger
const logger = require('./utils/logger');

const app = express();

// Trust proxy untuk deteksi IP
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // batas setiap IP hingga 100 permintaan per windowMs
  message: {
    success: false,
    message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting yang lebih ketat untuk endpoint auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // batas setiap IP hingga 5 percobaan auth per windowMs
  message: {
    success: false,
    message: 'Terlalu banyak percobaan autentikasi, silakan coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware keamanan
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Konfigurasi CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Kompresi
app.use(compression());

// Body parsing dengan batas ukuran
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Terapkan rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server sehat',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Dokumentasi Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    syntaxHighlight: {
      activate: true,
      theme: 'arta'
    }
  }
}));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);

// Routes ADMS (terpisah dari API utama)
app.use('/adms', admsRoutes);

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route tidak ditemukan', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Error tidak tertangani', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  // Jangan bocorkan detail error di production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(error.status || 500).json({
    success: false,
    message: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  });
});

module.exports = app;