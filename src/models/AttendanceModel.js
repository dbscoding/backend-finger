// src/models/attendanceModel.js

const { getDb } = require('../config/db');

class Attendance {
    constructor(data) {
        this.cloud_id = data.cloud_id;
        this.device_id = data.device_id;
        this.user_id = data.user_id;
        this.nama = data.nama;
        this.tanggal_absensi = data.tanggal_absensi;
        this.waktu_absensi = data.waktu_absensi;
        this.verifikasi = data.verifikasi;
        this.tipe_absensi = data.tipe_absensi;
        this.tanggal_upload = data.tanggal_upload;
        this.kategori_user = data.kategori_user;
        this.created_at = new Date();
        this.updated_at = new Date();
        this.is_deleted = false;
    }

    static async create(attendanceData) {
        const attendance = new Attendance(attendanceData);
        const db = getDb();
        const query = 'INSERT INTO attendance SET ?';
        const [result] = await db.query(query, attendance);
        return result.insertId;
    }

    static async findAll() {
        const db = getDb();
        const query = 'SELECT * FROM attendance WHERE is_deleted = false';
        const [rows] = await db.query(query);
        return rows;
    }

    static async findById(id) {
        const db = getDb();
        const query = 'SELECT * FROM attendance WHERE id = ? AND is_deleted = false';
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    static async getByUserId(userId) {
        const db = getDb();
        const query = 'SELECT * FROM attendance WHERE user_id = ? AND is_deleted = false';
        const [rows] = await db.query(query, [userId]);
        return rows;
    }

    static async update(id, attendanceData) {
        const db = getDb();
        const query = 'UPDATE attendance SET ? WHERE id = ?';
        const [result] = await db.query(query, [attendanceData, id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const db = getDb();
        const query = 'UPDATE attendance SET is_deleted = true WHERE id = ?';
        const [result] = await db.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async processData(userId) {
        // Implement processing logic, e.g., calculate attendance summary
        const db = getDb();
        const query = `
            SELECT 
                user_id,
                COUNT(*) as total_records,
                SUM(CASE WHEN tipe_absensi = 'check_in' THEN 1 ELSE 0 END) as check_ins,
                SUM(CASE WHEN tipe_absensi = 'check_out' THEN 1 ELSE 0 END) as check_outs
            FROM attendance 
            WHERE user_id = ? AND is_deleted = false 
            GROUP BY user_id
        `;
        const [rows] = await db.query(query, [userId]);
        return rows[0] || { user_id: userId, total_records: 0, check_ins: 0, check_outs: 0 };
    }
}

module.exports = Attendance;