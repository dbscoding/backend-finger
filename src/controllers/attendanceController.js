// src/controllers/attendanceController.js
const { Attendance, User, Device } = require('../models');
const exportService = require('../services/exportService');
const { Op } = require('sequelize');

class AttendanceController {
  // Get attendance records with filtering and pagination
  static getAttendanceRecords = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        user_id,
        device_id,
        tanggal_mulai,
        tanggal_akhir,
        kategori_user,
        tipe_absensi
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { is_deleted: false };

      // Apply filters
      if (user_id) whereClause.user_id = user_id;
      if (device_id) whereClause.device_id = device_id;
      if (kategori_user) whereClause.kategori_user = kategori_user;
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
            attributes: ['location', 'faculty'],
            required: false
          }
        ],
        order: [['tanggal_absensi', 'DESC'], ['waktu_absensi', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
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
      console.error('Get attendance records error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Get attendance summary for reporting
  static getAttendanceSummary = async (req, res) => {
    try {
      const { bulan, tahun, user_id } = req.query;

      if (!bulan || !tahun) {
        return res.status(400).json({
          success: false,
          message: 'Bulan dan tahun diperlukan'
        });
      }

      const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
      const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0]; // Last day of month

      let whereClause = {
        tanggal_absensi: { [Op.between]: [startDate, endDate] },
        is_deleted: false
      };

      if (user_id) whereClause.user_id = user_id;

      const records = await Attendance.findAll({
        where: whereClause,
        attributes: [
          'user_id',
          'nama',
          'kategori_user',
          [Attendance.sequelize.fn('COUNT', Attendance.sequelize.col('id')), 'total_records'],
          [Attendance.sequelize.fn('SUM',
            Attendance.sequelize.literal('CASE WHEN tipe_absensi = "MASUK" THEN 1 ELSE 0 END')
          ), 'total_masuk'],
          [Attendance.sequelize.fn('SUM',
            Attendance.sequelize.literal('CASE WHEN tipe_absensi = "PULANG" THEN 1 ELSE 0 END')
          ), 'total_pulang']
        ],
        group: ['user_id', 'nama', 'kategori_user'],
        order: [['nama', 'ASC']]
      });

      // Calculate working days in month
      const workingDays = AttendanceController.calculateWorkingDays(parseInt(bulan), parseInt(tahun));

      // Process summary data
      const summary = records.map(record => {
        const data = record.dataValues;
        const totalHadir = Math.min(data.total_masuk, data.total_pulang); // For karyawan
        const persentaseKehadiran = data.kategori_user === 'KARYAWAN' ?
          ((totalHadir / workingDays) * 100).toFixed(2) : null;

        return {
          user_id: data.user_id,
          nama: data.nama,
          kategori_user: data.kategori_user,
          total_records: data.total_records,
          total_masuk: data.total_masuk,
          total_pulang: data.total_pulang,
          hadir: totalHadir,
          total_hari_kerja: workingDays,
          persentase_kehadiran: persentaseKehadiran
        };
      });

      res.json({
        success: true,
        data: {
          bulan,
          tahun,
          working_days: workingDays,
          summary
        }
      });
    } catch (error) {
      console.error('Get attendance summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Get employee summary (Rekap Karyawan)
  static getEmployeeSummary = async (req, res) => {
    try {
      const { bulan, tahun } = req.query;

      if (!bulan || !tahun) {
        return res.status(400).json({
          success: false,
          message: 'Bulan dan tahun diperlukan'
        });
      }

      const summary = await AttendanceController.getSummaryByCategory('KARYAWAN', bulan, tahun);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Get employee summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Get lecturer summary (Rekap Dosen)
  static getLecturerSummary = async (req, res) => {
    try {
      const { bulan, tahun } = req.query;

      if (!bulan || !tahun) {
        return res.status(400).json({
          success: false,
          message: 'Bulan dan tahun diperlukan'
        });
      }

      const summary = await AttendanceController.getSummaryByCategory('DOSEN', bulan, tahun);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Get lecturer summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Helper function to get summary by category
  static getSummaryByCategory = async (kategori, bulan, tahun) => {
    const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
    const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];

    const whereClause = {
      tanggal_absensi: { [Op.between]: [startDate, endDate] },
      kategori_user: kategori,
      is_deleted: false
    };

    // Get aggregated data
    const records = await Attendance.findAll({
      where: whereClause,
      attributes: [
        'user_id',
        'nama',
        'kategori_user',
        [Attendance.sequelize.fn('COUNT', Attendance.sequelize.col('id')), 'total_records'],
        [Attendance.sequelize.fn('SUM',
          Attendance.sequelize.literal('CASE WHEN tipe_absensi = "MASUK" THEN 1 ELSE 0 END')
        ), 'total_masuk'],
        [Attendance.sequelize.fn('SUM',
          Attendance.sequelize.literal('CASE WHEN tipe_absensi = "PULANG" THEN 1 ELSE 0 END')
        ), 'total_pulang']
      ],
      group: ['user_id', 'nama', 'kategori_user'],
      order: [['nama', 'ASC']]
    });

    // Get late count separately
    const lateRecords = await Attendance.findAll({
      where: {
        ...whereClause,
        tipe_absensi: 'MASUK',
        waktu_absensi: { [Op.gt]: '08:00:00' }
      },
      attributes: [
        'user_id',
        [Attendance.sequelize.fn('COUNT', Attendance.sequelize.col('id')), 'total_terlambat']
      ],
      group: ['user_id']
    });

    const lateMap = {};
    lateRecords.forEach(record => {
      lateMap[record.user_id] = record.dataValues.total_terlambat;
    });

    // Get last check in and check out for each user
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

    // Group last check ins and outs
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

    // Calculate working days
    const workingDays = AttendanceController.calculateWorkingDays(parseInt(bulan), parseInt(tahun));

    // Process data
    const summary = records.map((record, index) => {
      const data = record.dataValues;
      const hadir = Math.min(data.total_masuk, data.total_pulang);
      const persentase = ((hadir / workingDays) * 100).toFixed(2);

      return {
        no: index + 1,
        nama: data.nama,
        nip: data.user_id,
        jabatan: data.kategori_user,
        hadir: hadir,
        total_hari_kerja: workingDays,
        terlambat: lateMap[data.user_id] || 0,
        persentase: persentase,
        check_in_terakhir: lastCheckInMap[data.user_id] || null,
        check_out_terakhir: lastCheckOutMap[data.user_id] || null
      };
    });

    return {
      bulan,
      tahun,
      kategori,
      total_hari_kerja: workingDays,
      data: summary
    };
  };

  // Export attendance data
  static exportAttendanceData = async (req, res) => {
    try {
      const { format = 'excel', bulan, tahun } = req.query;

      if (!['excel', 'pdf', 'csv'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Format harus excel, pdf, atau csv'
        });
      }

      let whereClause = { is_deleted: false };
      let filename = `attendance_data_${Date.now()}`;

      if (bulan && tahun) {
        const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
        const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];
        whereClause.tanggal_absensi = { [Op.between]: [startDate, endDate] };
        filename = `attendance_${tahun}_${bulan}`;
      }

      const records = await Attendance.findAll({
        where: whereClause,
        order: [['tanggal_absensi', 'DESC'], ['waktu_absensi', 'DESC']]
      });

      const filePath = await exportService.exportData(records, format, filename);

      res.download(filePath, `${filename}.${format === 'excel' ? 'xlsx' : format}`, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Clean up file after download
        setTimeout(() => {
          require('fs').unlinkSync(filePath);
        }, 5000);
      });
    } catch (error) {
      console.error('Export attendance data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Export employee summary
  static exportEmployeeSummary = async (req, res) => {
    try {
      const { format = 'excel', bulan, tahun } = req.query;

      if (!['excel', 'pdf', 'csv'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Format harus excel, pdf, atau csv'
        });
      }

      if (!bulan || !tahun) {
        return res.status(400).json({
          success: false,
          message: 'Bulan dan tahun diperlukan'
        });
      }

      const summary = await AttendanceController.getSummaryByCategory('KARYAWAN', bulan, tahun);
      const filename = `rekap_karyawan_${tahun}_${bulan}`;

      const filePath = await exportService.exportSummaryData(summary.data, format, filename);

      res.download(filePath, `${filename}.${format === 'excel' ? 'xlsx' : format}`, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        setTimeout(() => {
          require('fs').unlinkSync(filePath);
        }, 5000);
      });
    } catch (error) {
      console.error('Export employee summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Export lecturer summary
  static exportLecturerSummary = async (req, res) => {
    try {
      const { format = 'excel', bulan, tahun } = req.query;

      if (!['excel', 'pdf', 'csv'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Format harus excel, pdf, atau csv'
        });
      }

      if (!bulan || !tahun) {
        return res.status(400).json({
          success: false,
          message: 'Bulan dan tahun diperlukan'
        });
      }

      const summary = await AttendanceController.getSummaryByCategory('DOSEN', bulan, tahun);
      const filename = `rekap_dosen_${tahun}_${bulan}`;

      const filePath = await exportService.exportSummaryData(summary.data, format, filename);

      res.download(filePath, `${filename}.${format === 'excel' ? 'xlsx' : format}`, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        setTimeout(() => {
          require('fs').unlinkSync(filePath);
        }, 5000);
      });
    } catch (error) {
      console.error('Export lecturer summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Helper function to calculate working days
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