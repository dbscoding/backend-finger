// scripts/seed-admin.js
const { Admin } = require('../src/models');
const { sequelize } = require('../src/models');
const logger = require('../src/utils/logger');

async function seedAdmin() {
  try {
    // Sync database
    await sequelize.sync();
    logger.info('Database synchronized');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      logger.info('Admin user already exists');
      return;
    }

    // Create default admin
    const admin = await Admin.create({
      username: 'admin',
      password_hash: 'admin123', // Will be hashed by model hook
      email: 'admin@kampus.edu',
      role: 'admin',
      is_active: true
    });

    logger.info('Default admin user created successfully', {
      id: admin.id,
      username: admin.username
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please change the password after first login.\n');

  } catch (error) {
    logger.error('Failed to seed admin', {
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Failed to create admin user:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;