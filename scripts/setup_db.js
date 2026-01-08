// Database setup script using Node.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  let connection;

  try {
    // Connect as root (you may need to change credentials)
    console.log('Connecting to MySQL as root...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: 'root', // Change this if your root user is different
      password: '', // Add root password if needed
      multipleStatements: true
    });

    console.log('Creating database and user...');

    // Create database and user
    await connection.execute(`
      CREATE DATABASE IF NOT EXISTS finger_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // Create user (handle if already exists)
    try {
      await connection.execute(`CREATE USER 'finger_user'@'localhost' IDENTIFIED BY 'finger'`);
    } catch (error) {
      if (error.code === 'ER_CANNOT_USER') {
        console.log('User already exists, updating password...');
        await connection.execute(`ALTER USER 'finger_user'@'localhost' IDENTIFIED BY 'finger'`);
      } else {
        throw error;
      }
    }

    await connection.execute(`GRANT ALL PRIVILEGES ON finger_db.* TO 'finger_user'@'localhost'`);
    await connection.execute(`GRANT PROCESS, REPLICATION CLIENT ON *.* TO 'finger_user'@'localhost'`); // Allow connection without specifying database
    await connection.execute(`FLUSH PRIVILEGES`);

    console.log('Database and user created successfully!');
    console.log('Database: finger_db');
    console.log('User: finger_user');
    console.log('Password: finger');

    // Test connection with new user
    console.log('\nTesting connection with new user...');
    const testConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: 'finger_user',
      password: 'finger',
      database: 'finger_db'
    });

    await testConnection.execute('SELECT 1 as test');
    console.log('✅ Connection test successful!');

    // Run database schema
    console.log('\nRunning database schema...');
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'finger_db_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL commands and execute them
    const commands = schemaSQL.split(';').filter(cmd => cmd.trim().length > 0);

    for (const command of commands) {
      if (command.trim()) {
        try {
          await testConnection.execute(command);
        } catch (error) {
          // Ignore errors for existing tables/indexes
          if (!error.message.includes('already exists') && !error.message.includes('Duplicate entry')) {
            console.log(`Warning: ${error.message}`);
          }
        }
      }
    }

    console.log('✅ Database schema executed successfully!');
    await testConnection.end();

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MySQL server is running');
    console.log('2. Check root user credentials in this script');
    console.log('3. Make sure you have privileges to create databases and users');
    console.log('4. Try running MySQL Workbench and execute scripts/setup_database.sql manually');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();