// src/routes/attendanceRoutes.js
const express = require('express');
const AttendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireViewer, requireOperator, requireHR, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All attendance routes require authentication
router.use(authenticateToken);

// Get attendance records (all roles)
router.get('/', requireViewer, AttendanceController.getAttendanceRecords);

// Get attendance summary (HR and above)
router.get('/summary', requireHR, AttendanceController.getAttendanceSummary);

// Get employee summary (Rekap Karyawan) (HR and above)
router.get('/employee-summary', requireHR, AttendanceController.getEmployeeSummary);

// Get lecturer summary (Rekap Dosen) (HR and above)
router.get('/lecturer-summary', requireHR, AttendanceController.getLecturerSummary);

// Export attendance data (Operator and above)
router.get('/export', requireOperator, AttendanceController.exportAttendanceData);

// Export employee summary (Operator and above)
router.get('/export-employee', requireOperator, AttendanceController.exportEmployeeSummary);

// Export lecturer summary (Operator and above)
router.get('/export-lecturer', requireOperator, AttendanceController.exportLecturerSummary);

module.exports = router;