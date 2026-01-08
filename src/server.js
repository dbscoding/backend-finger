// src/server.js - Entry point aplikasi backend Sistem Rekap Absensi Kampus
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

// Inisialisasi aplikasi sebelum memulai server
const { testSequelizeConnection } = require('./config/database');
const { sequelize } = require('./models');

const initializeApp = async () => {
  try {
    await testSequelizeConnection();
    logger.info('Koneksi database berhasil dibuat');

    // Sinkronisasi database (buat tabel jika belum ada)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database berhasil disinkronisasi');

  } catch (error) {
    logger.error('Gagal menginisialisasi aplikasi', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Memulai server
const startServer = async () => {
  try {
    await initializeApp();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server berjalan di port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔒 Keamanan: ${process.env.NODE_ENV === 'production' ? 'Mode Produksi' : 'Mode Development'}`);
      logger.info(`📚 Dokumentasi Swagger tersedia di: http://localhost:${PORT}/api/docs`);
    });

    // Graceful shutdown - Menutup server dengan aman
    process.on('SIGTERM', () => {
      logger.info('SIGTERM diterima, menutup server dengan aman');
      server.close(() => {
        logger.info('Proses dihentikan');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT diterima, menutup server dengan aman');
      server.close(() => {
        logger.info('Proses dihentikan');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Gagal memulai server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

startServer();

module.exports = app;