// src/routes/attendance.routes.js
const express = require('express');
const AttendanceController = require('../controllers/attendance.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Get all attendance records with filtering
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Records per page
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: jabatan
 *         schema:
 *           type: string
 *           enum: [DOSEN, KARYAWAN]
 *         description: Filter by position
 *       - in: query
 *         name: tanggal_mulai
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: tanggal_akhir
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 */
router.get('/', AttendanceController.getAttendance);

/**
 * @swagger
 * /api/attendance/dosen:
 *   get:
 *     summary: Get attendance records for lecturers only
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: tanggal_mulai
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: tanggal_akhir
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lecturer attendance records retrieved successfully
 */
router.get('/dosen', AttendanceController.getLecturerAttendance);

/**
 * @swagger
 * /api/attendance/karyawan:
 *   get:
 *     summary: Get attendance records for employees only
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: tanggal_mulai
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: tanggal_akhir
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Employee attendance records retrieved successfully
 */
router.get('/karyawan', AttendanceController.getEmployeeAttendance);

/**
 * @swagger
 * /api/attendance/rekap:
 *   get:
 *     summary: Get attendance summary report
 *     tags: [Attendance]
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
 *     responses:
 *       200:
 *         description: Attendance summary retrieved successfully
 */
router.get('/rekap', AttendanceController.getAttendanceSummary);

/**
 * @swagger
 * /api/attendance/rekap/bulanan:
 *   get:
 *     summary: Get detailed monthly attendance report
 *     tags: [Attendance]
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
 *     responses:
 *       200:
 *         description: Monthly report retrieved successfully
 */
router.get('/rekap/bulanan', AttendanceController.getMonthlyReport);

/**
 * @swagger
 * /api/attendance/{id}:
 *   delete:
 *     summary: Soft delete attendance record
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attendance record ID
 *     responses:
 *       200:
 *         description: Attendance record deleted successfully
 *       404:
 *         description: Attendance record not found
 */
router.delete('/:id', AttendanceController.deleteAttendance);

module.exports = router;