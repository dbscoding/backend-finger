// src/controllers/export.controller.js
const { Attendance } = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../../exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

class ExportController {
  /**
   * GET /api/export/excel
   * Export attendance data to Excel format
   * Security: Admin access required
   */
  static exportToExcel = async (req, res) => {
    try {
      const { bulan, tahun, jabatan } = req.query;

      if (!bulan || !tahun) {
        return res.status(400).json({
          success: false,
          message: 'Bulan dan tahun diperlukan'
        });
      }

      const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
      const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];

      const whereClause = {
        tanggal_absensi: { [Op.between]: [startDate, endDate] },
        is_deleted: false
      };

      if (jabatan) whereClause.jabatan = jabatan;

      const records = await Attendance.findAll({
        where: whereClause,
        order: [['tanggal_absensi', 'ASC'], ['waktu_absensi', 'ASC']]
      });

      // Transform data for Excel
      const excelData = records.map(record => ({
        'Tanggal': record.tanggal_absensi,
        'Waktu': record.waktu_absensi,
        'User ID': record.user_id,
        'NIP': record.nip,
        'Nama': record.nama,
        'Jabatan': record.jabatan,
        'Tipe Absensi': record.tipe_absensi,
        'Device ID': record.device_id,
        'Verifikasi': record.verifikasi,
        'Cloud ID': record.cloud_id,
        'Tanggal Upload': record.tanggal_upload
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Absensi');

      const filename = `absensi_${tahun}_${bulan}${jabatan ? `_${jabatan.toLowerCase()}` : ''}.xlsx`;
      const filePath = path.join(exportsDir, filename);

      XLSX.writeFile(wb, filePath);

      // Audit log
      logger.audit('EXPORT_EXCEL', req.user.id, {
        bulan,
        tahun,
        jabatan,
        totalRecords: records.length,
        filename
      });

      res.download(filePath, filename, (err) => {
        if (err) {
          logger.error('Excel download error', { error: err.message });
        }
        // Clean up file after download
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            logger.error('File cleanup error', { error: error.message });
          }
        }, 5000);
      });
    } catch (error) {
      logger.error('Export to Excel error', {
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
   * GET /api/export/pdf
   * Export attendance data to PDF format
   */
  static exportToPDF = async (req, res) => {
    try {
      const { bulan, tahun, jabatan } = req.query;

      if (!bulan || !tahun) {
        return res.status(400).json({
          success: false,
          message: 'Bulan dan tahun diperlukan'
        });
      }

      const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
      const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];

      const whereClause = {
        tanggal_absensi: { [Op.between]: [startDate, endDate] },
        is_deleted: false
      };

      if (jabatan) whereClause.jabatan = jabatan;

      const records = await Attendance.findAll({
        where: whereClause,
        order: [['tanggal_absensi', 'ASC'], ['nama', 'ASC']]
      });

      const filename = `absensi_${tahun}_${bulan}${jabatan ? `_${jabatan.toLowerCase()}` : ''}.pdf`;
      const filePath = path.join(exportsDir, filename);

      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(filePath));

      // Header
      doc.fontSize(16).text('LAPORAN ABSENSI KAMPUS', { align: 'center' });
      doc.fontSize(12).text(`Bulan: ${bulan} Tahun: ${tahun}`, { align: 'center' });
      if (jabatan) {
        doc.text(`Jabatan: ${jabatan}`, { align: 'center' });
      }
      doc.moveDown();

      // Table header
      const headers = ['No', 'Tanggal', 'Nama', 'NIP', 'Jabatan', 'Check In', 'Check Out'];
      let y = doc.y;

      headers.forEach((header, index) => {
        doc.fontSize(10).text(header, 50 + index * 80, y, { width: 70, align: 'center' });
      });

      doc.moveDown();

      // Table data
      records.forEach((record, index) => {
        y = doc.y;
        const checkIn = record.tipe_absensi === 'MASUK' ? record.waktu_absensi : '';
        const checkOut = record.tipe_absensi === 'PULANG' ? record.waktu_absensi : '';

        const rowData = [
          (index + 1).toString(),
          record.tanggal_absensi,
          record.nama,
          record.nip,
          record.jabatan,
          checkIn,
          checkOut
        ];

        rowData.forEach((data, colIndex) => {
          doc.fontSize(8).text(data, 50 + colIndex * 80, y, { width: 70, align: 'center' });
        });

        doc.moveDown(0.5);
      });

      doc.end();

      // Wait for PDF to finish writing
      await new Promise((resolve) => {
        doc.on('end', resolve);
      });

      // Audit log
      logger.audit('EXPORT_PDF', req.user.id, {
        bulan,
        tahun,
        jabatan,
        totalRecords: records.length,
        filename
      });

      res.download(filePath, filename, (err) => {
        if (err) {
          logger.error('PDF download error', { error: err.message });
        }
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            logger.error('File cleanup error', { error: error.message });
          }
        }, 5000);
      });
    } catch (error) {
      logger.error('Export to PDF error', {
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
   * GET /api/export/csv
   * Export attendance data to CSV format
   */
  static exportToCSV = async (req, res) => {
    try {
      const { bulan, tahun, jabatan } = req.query;

      if (!bulan || !tahun) {
        return res.status(400).json({
          success: false,
          message: 'Bulan dan tahun diperlukan'
        });
      }

      const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
      const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];

      const whereClause = {
        tanggal_absensi: { [Op.between]: [startDate, endDate] },
        is_deleted: false
      };

      if (jabatan) whereClause.jabatan = jabatan;

      const records = await Attendance.findAll({
        where: whereClause,
        order: [['tanggal_absensi', 'ASC'], ['waktu_absensi', 'ASC']]
      });

      const filename = `absensi_${tahun}_${bulan}${jabatan ? `_${jabatan.toLowerCase()}` : ''}.csv`;
      const filePath = path.join(exportsDir, filename);

      const csvWriter = createCsvWriter({
        path: filePath,
        header: [
          { id: 'tanggal_absensi', title: 'Tanggal' },
          { id: 'waktu_absensi', title: 'Waktu' },
          { id: 'user_id', title: 'User ID' },
          { id: 'nip', title: 'NIP' },
          { id: 'nama', title: 'Nama' },
          { id: 'jabatan', title: 'Jabatan' },
          { id: 'tipe_absensi', title: 'Tipe Absensi' },
          { id: 'device_id', title: 'Device ID' },
          { id: 'verifikasi', title: 'Verifikasi' },
          { id: 'cloud_id', title: 'Cloud ID' },
          { id: 'tanggal_upload', title: 'Tanggal Upload' }
        ]
      });

      await csvWriter.writeRecords(records.map(record => record.toJSON()));

      // Audit log
      logger.audit('EXPORT_CSV', req.user.id, {
        bulan,
        tahun,
        jabatan,
        totalRecords: records.length,
        filename
      });

      res.download(filePath, filename, (err) => {
        if (err) {
          logger.error('CSV download error', { error: err.message });
        }
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            logger.error('File cleanup error', { error: error.message });
          }
        }, 5000);
      });
    } catch (error) {
      logger.error('Export to CSV error', {
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
}

module.exports = ExportController;