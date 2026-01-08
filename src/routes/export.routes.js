// src/routes/export.routes.js
const express = require('express');
const ExportController = require('../controllers/export.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/export/excel:
 *   get:
 *     summary: Export attendance data to Excel
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bulan
 *         required: true
 *         schema:
 *           type: string
 *         description: Month (01-12)
 *       - in: query
 *         name: tahun
 *         required: true
 *         schema:
 *           type: string
 *         description: Year (YYYY)
 *       - in: query
 *         name: jabatan
 *         schema:
 *           type: string
 *           enum: [DOSEN, KARYAWAN]
 *         description: Filter by position (optional)
 *     responses:
 *       200:
 *         description: Excel file downloaded successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/excel', ExportController.exportToExcel);

/**
 * @swagger
 * /api/export/pdf:
 *   get:
 *     summary: Export attendance data to PDF
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bulan
 *         required: true
 *         schema:
 *           type: string
 *         description: Month (01-12)
 *       - in: query
 *         name: tahun
 *         required: true
 *         schema:
 *           type: string
 *         description: Year (YYYY)
 *       - in: query
 *         name: jabatan
 *         schema:
 *           type: string
 *           enum: [DOSEN, KARYAWAN]
 *         description: Filter by position (optional)
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/pdf', ExportController.exportToPDF);

/**
 * @swagger
 * /api/export/csv:
 *   get:
 *     summary: Export attendance data to CSV
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bulan
 *         required: true
 *         schema:
 *           type: string
 *         description: Month (01-12)
 *       - in: query
 *         name: tahun
 *         required: true
 *         schema:
 *           type: string
 *         description: Year (YYYY)
 *       - in: query
 *         name: jabatan
 *         schema:
 *           type: string
 *           enum: [DOSEN, KARYAWAN]
 *         description: Filter by position (optional)
 *     responses:
 *       200:
 *         description: CSV file downloaded successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/csv', ExportController.exportToCSV);

module.exports = router;