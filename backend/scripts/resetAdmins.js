const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
require('dotenv').config({ path: __dirname + '/../.env' });

/**
 * Clean Database and Create Fresh Admin Accounts
 * This will delete ALL existing admin users and create:
 * - Super Admin: admin@emilock.com / 1234
 * - Admin: dealer@emilock.com / 9999
 */

async function resetAdminAccounts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Delete ALL existing admin users
        const deleteResult = await AdminUser.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing admin accounts`);

        // Create Super Admin
        const superAdmin = new AdminUser({
            name: 'Super Admin',
            email: 'admin@emilock.com',
            phone: '+91 9999999999',
            passcode: '1234',
            role: 'SUPER_ADMIN',
            deviceLimit: 0, // Unlimited
            isActive: true
        });
        await superAdmin.save();
        console.log('✅ Super Admin created');

        // Create Default Admin/Dealer
        const admin = new AdminUser({
            name: 'Default Dealer',
            email: 'dealer@emilock.com',
            phone: '+91 8888888888',
            passcode: '9999',
            role: 'ADMIN',
            deviceLimit: 100,
            isActive: true,
            createdBy: superAdmin._id
        });
        await admin.save();
        console.log('✅ Admin created');

        console.log('\n📊 Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('🔐 SUPER ADMIN');
        console.log('   Email:    admin@emilock.com');
        console.log('   Passcode: 1234');
        console.log('   Role:     SUPER_ADMIN');
        console.log('   Limit:    Unlimited devices');
        console.log('');
        console.log('👤 ADMIN (Dealer)');
        console.log('   Email:    dealer@emilock.com');
        console.log('   Passcode: 9999');
        console.log('   Role:     ADMIN');
        console.log('   Limit:    100 devices');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ Database reset complete!');
        console.log('🌐 Login at: http://localhost:8080/login\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetAdminAccounts();
