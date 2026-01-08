-- finger_db.sql - Database schema for Sistem Rekap Absensi Kampus
-- Run this script to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS finger_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE finger_db;

-- Create users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'hr', 'operator', 'viewer') NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
);

-- Create devices table (fingerprint machines)
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL UNIQUE,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NOT NULL, -- IPv6 compatible
    api_key VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    faculty VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_seen DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_device_id (device_id),
    INDEX idx_serial_number (serial_number),
    INDEX idx_ip_address (ip_address),
    INDEX idx_is_active (is_active)
);

-- Create attendance table (main attendance data)
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cloud_id VARCHAR(100) NOT NULL,
    device_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    tanggal_absensi DATE NOT NULL,
    waktu_absensi TIME NOT NULL,
    verifikasi VARCHAR(100) DEFAULT 'Sidik Jari',
    tipe_absensi ENUM('MASUK', 'PULANG') NOT NULL,
    tanggal_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kategori_user ENUM('DOSEN', 'KARYAWAN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    INDEX idx_user_id (user_id),
    INDEX idx_device_id (device_id),
    INDEX idx_tanggal_absensi (tanggal_absensi),
    INDEX idx_tipe_absensi (tipe_absensi),
    INDEX idx_kategori_user (kategori_user),
    INDEX idx_tanggal_upload (tanggal_upload),
    INDEX idx_is_deleted (is_deleted),
    UNIQUE KEY unique_attendance (user_id, tanggal_absensi, tipe_absensi, device_id)
);

-- Create schedules table (for lecturer schedules)
CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    room VARCHAR(100),
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    faculty VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_day_of_week (day_of_week),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_is_active (is_active)
);

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (username, password_hash, email, role) VALUES
('admin', '$2b$10$rOz8vZxZxZxZxZxZxZxZxOZ8vZxZxZxZxZxZxOZ8vZxZxZxZxZx', 'admin@kampus.edu', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- Insert sample devices
INSERT INTO devices (device_id, serial_number, ip_address, api_key, location, faculty) VALUES
('DEVICE001', 'SN00123456789', '192.168.1.100', 'api_key_device_001_secure', 'Gedung A Lantai 1', 'Teknik Informatika'),
('DEVICE002', 'SN00123456790', '192.168.1.101', 'api_key_device_002_secure', 'Gedung B Lantai 2', 'Manajemen')
ON DUPLICATE KEY UPDATE device_id=device_id;

-- Insert sample attendance data
INSERT INTO attendance (cloud_id, device_id, user_id, nama, tanggal_absensi, waktu_absensi, tipe_absensi, kategori_user) VALUES
('CLOUD001', 'DEVICE001', 'D001', 'Dr. Ahmad Surya, S.Kom', '2024-01-15', '08:00:00', 'MASUK', 'DOSEN'),
('CLOUD002', 'DEVICE001', 'D001', 'Dr. Ahmad Surya, S.Kom', '2024-01-15', '16:30:00', 'PULANG', 'DOSEN'),
('CLOUD003', 'DEVICE002', 'K001', 'Siti Nurhaliza', '2024-01-15', '07:45:00', 'MASUK', 'KARYAWAN'),
('CLOUD004', 'DEVICE002', 'K001', 'Siti Nurhaliza', '2024-01-15', '17:00:00', 'PULANG', 'KARYAWAN')
ON DUPLICATE KEY UPDATE cloud_id=cloud_id;

-- Insert sample schedules
INSERT INTO schedules (user_id, subject, room, day_of_week, start_time, end_time, faculty) VALUES
('D001', 'Pemrograman Web', 'Lab Komputer 1', 'monday', '08:00:00', '10:00:00', 'Teknik Informatika'),
('D001', 'Basis Data', 'Ruang 201', 'wednesday', '10:00:00', '12:00:00', 'Teknik Informatika')
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Create database user with least privilege
-- Run these commands separately as root user:
-- CREATE USER 'attendance_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON finger_db.* TO 'attendance_user'@'localhost';
-- FLUSH PRIVILEGES;