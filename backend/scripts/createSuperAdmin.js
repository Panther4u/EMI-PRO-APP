const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
require('dotenv').config({ path: __dirname + '/../.env' });

/**
 * Create Default Super Admin
 * Run this script once to create the initial super admin account
 * 
 * Usage: node backend/scripts/createSuperAdmin.js
 */

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if super admin already exists
        const existing = await AdminUser.findOne({ role: 'SUPER_ADMIN' });

        if (existing) {
            console.log('⚠️  Super Admin already exists:');
            console.log('   Email:', existing.email);
            console.log('   Name:', existing.name);
            console.log('\nUse this account to login to the admin dashboard.');
            process.exit(0);
        }

        // Create super admin
        const superAdmin = new AdminUser({
            name: 'Super Admin',
            email: 'admin@emilock.com',
            phone: '+91 9999999999',
            passcode: '1234', // 4-digit passcode
            role: 'SUPER_ADMIN',
            deviceLimit: 0, // Unlimited for super admin
            isActive: true
        });

        await superAdmin.save();

        console.log('\n✅ Super Admin created successfully!');
        console.log('\n📧 Login Credentials:');
        console.log('   Email:', superAdmin.email);
        console.log('   Passcode: 1234');
        console.log('\n⚠️  IMPORTANT: Change the passcode immediately after first login!');
        console.log('\nYou can now login at: http://localhost:5000/admin/login\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating super admin:', error.message);
        process.exit(1);
    }
}

createSuperAdmin();
