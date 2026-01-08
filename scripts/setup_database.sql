-- Database Setup Script for Sistem Rekap Absensi Kampus
-- Run this script as MySQL root user

-- Create database
CREATE DATABASE IF NOT EXISTS finger_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user with limited privileges
CREATE USER IF NOT EXISTS 'finger_user'@'localhost' IDENTIFIED BY 'finger';

-- Grant specific permissions for the application
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX ON finger_db.* TO 'finger_user'@'localhost';

-- For ADMS operations (raw SQL)
GRANT EXECUTE ON finger_db.* TO 'finger_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Verify user creation
SELECT User, Host FROM mysql.user WHERE User = 'finger_user';