// src/controllers/dashboard.controller.js
const { Attendance } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class DashboardController {
  /**
   * GET /api/dashboard/summary
   * Get dashboard summary statistics
   * Security: Admin access required
   */
  static getSummary = async (req, res) => {
    try {
      const { bulan, tahun } = req.query;

      // Default to current month if not specified
      const now = new Date();
      const currentMonth = bulan || (now.getMonth() + 1).toString();
      const currentYear = tahun || now.getFullYear().toString();

      const startDate = `${currentYear}-${currentMonth.padStart(2, '0')}-01`;
      const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

      // Get total attendance records
      const totalRecords = await Attendance.count({
        where: {
          tanggal_absensi: { [Op.between]: [startDate, endDate] },
          is_deleted: false
        }
      });

      // Get total unique users
      const totalUsers = await Attendance.findAll({
        where: {
          tanggal_absensi: { [Op.between]: [startDate, endDate] },
          is_deleted: false
        },
        attributes: [
          [Attendance.sequelize.fn('COUNT', Attendance.sequelize.fn('DISTINCT', Attendance.sequelize.col('user_id'))), 'unique_users']
        ],
        raw: true
      });

      // Get attendance by type
      const attendanceByType = await Attendance.findAll({
        where: {
          tanggal_absensi: { [Op.between]: [startDate, endDate] },
          is_deleted: false
        },
        attributes: [
          'tipe_absensi',
          [Attendance.sequelize.fn('COUNT', Attendance.sequelize.col('id')), 'count']
        ],
        group: ['tipe_absensi'],
        raw: true
      });

      // Get late arrivals
      const lateArrivals = await Attendance.count({
        where: {
          tanggal_absensi: { [Op.between]: [startDate, endDate] },
          tipe_absensi: 'MASUK',
          waktu_absensi: { [Op.gt]: '08:00:00' },
          is_deleted: false
        }
      });

      // Get attendance by position
      const attendanceByPosition = await Attendance.findAll({
        where: {
          tanggal_absensi: { [Op.between]: [startDate, endDate] },
          is_deleted: false
        },
        attributes: [
          'jabatan',
          [Attendance.sequelize.fn('COUNT', Attendance.sequelize.col('id')), 'count']
        ],
        group: ['jabatan'],
        raw: true
      });

      // Get last check-in and check-out
      const lastCheckIn = await Attendance.findOne({
        where: {
          tanggal_absensi: { [Op.between]: [startDate, endDate] },
          tipe_absensi: 'MASUK',
          is_deleted: false
        },
        order: [['tanggal_absensi', 'DESC'], ['waktu_absensi', 'DESC']],
        attributes: ['nama', 'tanggal_absensi', 'waktu_absensi']
      });

      const lastCheckOut = await Attendance.findOne({
        where: {
          tanggal_absensi: { [Op.between]: [startDate, endDate] },
          tipe_absensi: 'PULANG',
          is_deleted: false
        },
        order: [['tanggal_absensi', 'DESC'], ['waktu_absensi', 'DESC']],
        attributes: ['nama', 'tanggal_absensi', 'waktu_absensi']
      });

      // Calculate working days
      const workingDays = DashboardController.calculateWorkingDays(
        parseInt(currentMonth),
        parseInt(currentYear)
      );

      // Process data
      const checkInCount = attendanceByType.find(item => item.tipe_absensi === 'MASUK')?.count || 0;
      const checkOutCount = attendanceByType.find(item => item.tipe_absensi === 'PULANG')?.count || 0;

      const dosenCount = attendanceByPosition.find(item => item.jabatan === 'DOSEN')?.count || 0;
      const karyawanCount = attendanceByPosition.find(item => item.jabatan === 'KARYAWAN')?.count || 0;

      // Calculate attendance percentage
      const totalHadir = Math.min(checkInCount, checkOutCount);
      const persentaseKehadiran = totalUsers[0]?.unique_users
        ? ((totalHadir / (totalUsers[0].unique_users * workingDays)) * 100).toFixed(2)
        : '0.00';

      const summary = {
        bulan: parseInt(currentMonth),
        tahun: parseInt(currentYear),
        total_records: totalRecords,
        total_users: totalUsers[0]?.unique_users || 0,
        total_hadir: totalHadir,
        total_hari_kerja: workingDays,
        total_keterlambatan: lateArrivals,
        persentase_kehadiran: persentaseKehadiran,
        check_in: {
          total: checkInCount,
          terakhir: lastCheckIn ? {
            nama: lastCheckIn.nama,
            waktu: `${lastCheckIn.tanggal_absensi} ${lastCheckIn.waktu_absensi}`
          } : null
        },
        check_out: {
          total: checkOutCount,
          terakhir: lastCheckOut ? {
            nama: lastCheckOut.nama,
            waktu: `${lastCheckOut.tanggal_absensi} ${lastCheckOut.waktu_absensi}`
          } : null
        },
        breakdown_jabatan: {
          dosen: dosenCount,
          karyawan: karyawanCount
        }
      };

      // Audit log
      logger.audit('VIEW_DASHBOARD', req.user.id, {
        bulan: currentMonth,
        tahun: currentYear
      });

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Get dashboard summary error', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Helper: Calculate working days in month
   */
  static calculateWorkingDays(month, year) {
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      // Exclude Sunday (0) and Saturday (6)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }

    return workingDays;
  }
}

module.exports = DashboardController;