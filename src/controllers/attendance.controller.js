// src/controllers/attendance.controller.js
const { Attendance, Device } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class AttendanceController {
  /**
   * GET /api/attendance
   * Get all attendance records with filtering and pagination
   * Security: Admin access required
   */
  static getAttendance = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        user_id,
        device_id,
        jabatan,
        tanggal_mulai,
        tanggal_akhir,
        tipe_absensi
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { is_deleted: false };

      // Apply filters
      if (user_id) whereClause.user_id = user_id;
      if (device_id) whereClause.device_id = device_id;
      if (jabatan) whereClause.jabatan = jabatan;
      if (tipe_absensi) whereClause.tipe_absensi = tipe_absensi;

      if (tanggal_mulai && tanggal_akhir) {
        whereClause.tanggal_absensi = {
          [Op.between]: [tanggal_mulai, tanggal_akhir]
        };
      } else if (tanggal_mulai) {
        whereClause.tanggal_absensi = { [Op.gte]: tanggal_mulai };
      } else if (tanggal_akhir) {
        whereClause.tanggal_absensi = { [Op.lte]: tanggal_akhir };
      }

      const { count, rows } = await Attendance.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Device,
            as: 'device',
            attributes: ['location'],
            required: false
          }
        ],
        order: [['tanggal_absensi', 'DESC'], ['waktu_absensi', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Audit log
      logger.audit('VIEW_ATTENDANCE', req.user.id, {
        filters: req.query,
        totalRecords: count
      });

      res.json({
        success: true,
        data: {
          records: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_records: count,
            per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get attendance error', {
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
   * GET /api/attendance/dosen
   * Get attendance records for lecturers only
   */
  static getLecturerAttendance = async (req, res) => {
    try {
      req.query.jabatan = 'DOSEN';
      await AttendanceController.getAttendance(req, res);
    } catch (error) {
      logger.error('Get lecturer attendance error', {
        error: error.message,
        userId: req.user.id
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * GET /api/attendance/karyawan
   * Get attendance records for employees only
   */
  static getEmployeeAttendance = async (req, res) => {
    try {
      req.query.jabatan = 'KARYAWAN';
      await AttendanceController.getAttendance(req, res);
    } catch (error) {
      logger.error('Get employee attendance error', {
        error: error.message,
        userId: req.user.id
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * GET /api/attendance/rekap
   * Get attendance summary report
   */
  static getAttendanceSummary = async (req, res) => {
    try {
      const { bulan, tahun } = req.query;

      if (!bulan || !tahun) {
        return res.status(400).json({
          success: false,
          message: 'Bulan dan tahun diperlukan'
        });
      }

      const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
      const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];

      // Get summary data
      const summary = await AttendanceController.calculateAttendanceSummary(
        startDate,
        endDate,
        bulan,
        tahun
      );

      // Audit log
      logger.audit('VIEW_ATTENDANCE_SUMMARY', req.user.id, {
        bulan,
        tahun,
        totalUsers: summary.data.length
      });

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Get attendance summary error', {
        error: error.message,
        userId: req.user.id
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * GET /api/attendance/rekap/bulanan
   * Get monthly attendance report with detailed breakdown
   */
  static getMonthlyReport = async (req, res) => {
    try {
      const { bulan, tahun } = req.query;

      if (!bulan || !tahun) {
        return res.status(400).json({
          success: false,
          message: 'Bulan dan tahun diperlukan'
        });
      }

      const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
      const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];

      // Get detailed monthly report
      const report = await AttendanceController.generateMonthlyReport(
        startDate,
        endDate,
        bulan,
        tahun
      );

      // Audit log
      logger.audit('VIEW_MONTHLY_REPORT', req.user.id, {
        bulan,
        tahun
      });

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Get monthly report error', {
        error: error.message,
        userId: req.user.id
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * DELETE /api/attendance/{id}
   * Soft delete attendance record
   * Security: Admin only, audit logging
   */
  static deleteAttendance = async (req, res) => {
    try {
      const { id } = req.params;

      const attendance = await Attendance.findByPk(id);
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        });
      }

      // Soft delete
      await attendance.destroy();

      // Audit log
      logger.audit('DELETE_ATTENDANCE', req.user.id, {
        attendanceId: id,
        userId: attendance.user_id,
        nama: attendance.nama,
        tanggal: attendance.tanggal_absensi
      });

      res.json({
        success: true,
        message: 'Attendance record deleted successfully'
      });
    } catch (error) {
      logger.error('Delete attendance error', {
        error: error.message,
        attendanceId: req.params.id,
        userId: req.user.id
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Helper: Calculate attendance summary
   */
  static calculateAttendanceSummary = async (startDate, endDate, bulan, tahun) => {
    const workingDays = AttendanceController.calculateWorkingDays(parseInt(bulan), parseInt(tahun));

    const records = await Attendance.findAll({
      where: {
        tanggal_absensi: { [Op.between]: [startDate, endDate] },
        is_deleted: false
      },
      attributes: [
        'user_id',
        'nama',
        'nip',
        'jabatan',
        [Attendance.sequelize.fn('COUNT', Attendance.sequelize.col('id')), 'total_records'],
        [Attendance.sequelize.fn('SUM',
          Attendance.sequelize.literal('CASE WHEN tipe_absensi = "MASUK" THEN 1 ELSE 0 END')
        ), 'total_masuk'],
        [Attendance.sequelize.fn('SUM',
          Attendance.sequelize.literal('CASE WHEN tipe_absensi = "PULANG" THEN 1 ELSE 0 END')
        ), 'total_pulang'],
        [Attendance.sequelize.fn('SUM',
          Attendance.sequelize.literal('CASE WHEN tipe_absensi = "MASUK" AND TIME(waktu_absensi) > "08:00:00" THEN 1 ELSE 0 END')
        ), 'total_terlambat']
      ],
      group: ['user_id', 'nama', 'nip', 'jabatan'],
      order: [['nama', 'ASC']]
    });

    // Get last check-in and check-out
    const userIds = records.map(r => r.user_id);
    const lastCheckIns = await Attendance.findAll({
      where: {
        user_id: { [Op.in]: userIds },
        tanggal_absensi: { [Op.between]: [startDate, endDate] },
        tipe_absensi: 'MASUK',
        is_deleted: false
      },
      attributes: ['user_id', 'tanggal_absensi', 'waktu_absensi'],
      order: [['user_id'], ['tanggal_absensi', 'DESC'], ['waktu_absensi', 'DESC']]
    });

    const lastCheckOuts = await Attendance.findAll({
      where: {
        user_id: { [Op.in]: userIds },
        tanggal_absensi: { [Op.between]: [startDate, endDate] },
        tipe_absensi: 'PULANG',
        is_deleted: false
      },
      attributes: ['user_id', 'tanggal_absensi', 'waktu_absensi'],
      order: [['user_id'], ['tanggal_absensi', 'DESC'], ['waktu_absensi', 'DESC']]
    });

    // Process last check times
    const lastCheckInMap = {};
    const lastCheckOutMap = {};

    lastCheckIns.forEach(record => {
      if (!lastCheckInMap[record.user_id]) {
        lastCheckInMap[record.user_id] = `${record.tanggal_absensi} ${record.waktu_absensi}`;
      }
    });

    lastCheckOuts.forEach(record => {
      if (!lastCheckOutMap[record.user_id]) {
        lastCheckOutMap[record.user_id] = `${record.tanggal_absensi} ${record.waktu_absensi}`;
      }
    });

    // Process summary
    const summary = records.map((record, index) => {
      const data = record.dataValues;
      const hadir = Math.min(data.total_masuk, data.total_pulang);
      const persentase = ((hadir / workingDays) * 100).toFixed(2);

      return {
        no: index + 1,
        user_id: data.user_id,
        nama: data.nama,
        nip: data.nip,
        jabatan: data.jabatan,
        hadir: hadir,
        total_hari_kerja: workingDays,
        terlambat: data.total_terlambat || 0,
        persentase: persentase,
        check_in_terakhir: lastCheckInMap[data.user_id] || null,
        check_out_terakhir: lastCheckOutMap[data.user_id] || null
      };
    });

    return {
      bulan: parseInt(bulan),
      tahun: parseInt(tahun),
      total_hari_kerja: workingDays,
      data: summary
    };
  };

  /**
   * Helper: Generate detailed monthly report
   */
  static generateMonthlyReport = async (startDate, endDate, bulan, tahun) => {
    const workingDays = AttendanceController.calculateWorkingDays(parseInt(bulan), parseInt(tahun));

    // Get all attendance records for the month
    const records = await Attendance.findAll({
      where: {
        tanggal_absensi: { [Op.between]: [startDate, endDate] },
        is_deleted: false
      },
      order: [['tanggal_absensi', 'ASC'], ['waktu_absensi', 'ASC']]
    });

    // Group by user and date
    const report = {};
    records.forEach(record => {
      const key = `${record.user_id}_${record.tanggal_absensi}`;
      if (!report[key]) {
        report[key] = {
          user_id: record.user_id,
          nama: record.nama,
          nip: record.nip,
          jabatan: record.jabatan,
          tanggal: record.tanggal_absensi,
          check_in: null,
          check_out: null,
          terlambat: false
        };
      }

      if (record.tipe_absensi === 'MASUK') {
        report[key].check_in = record.waktu_absensi;
        report[key].terlambat = record.waktu_absensi > '08:00:00';
      } else if (record.tipe_absensi === 'PULANG') {
        report[key].check_out = record.waktu_absensi;
      }
    });

    return {
      bulan: parseInt(bulan),
      tahun: parseInt(tahun),
      total_hari_kerja: workingDays,
      records: Object.values(report)
    };
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

module.exports = AttendanceController;