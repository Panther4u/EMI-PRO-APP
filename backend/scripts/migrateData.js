const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Device = require('../models/Device');
const AdminUser = require('../models/AdminUser');
require('dotenv').config({ path: __dirname + '/../.env' });

/**
 * Data Migration Script - Updated for 2-Tier System
 * Assigns existing customers and devices to a default admin
 * Removes old SUB_ADMIN users
 * 
 * Usage: node backend/scripts/migrateData.js
 */

async function migrateData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Remove old SUB_ADMIN users
        const subAdminCount = await AdminUser.countDocuments({ role: 'SUB_ADMIN' });
        if (subAdminCount > 0) {
            await AdminUser.deleteMany({ role: 'SUB_ADMIN' });
            console.log(`🗑️  Removed ${subAdminCount} SUB_ADMIN users (deprecated)`);
        }

        // Update DEALER role to ADMIN
        const dealerCount = await AdminUser.countDocuments({ role: 'DEALER' });
        if (dealerCount > 0) {
            await AdminUser.updateMany(
                { role: 'DEALER' },
                { $set: { role: 'ADMIN', deviceLimit: 100 } }
            );
            console.log(`✅ Updated ${dealerCount} DEALER users to ADMIN with 100 device limit`);
        }

        // Find or create default admin
        let defaultAdmin = await AdminUser.findOne({ role: 'ADMIN' });

        if (!defaultAdmin) {
            console.log('⚠️  No admin found. Creating default admin...');
            defaultAdmin = new AdminUser({
                name: 'Default Admin',
                email: 'admin1@emilock.com',
                passcode: '9999',
                role: 'ADMIN',
                deviceLimit: 100,
                isActive: true
            });
            await defaultAdmin.save();
            console.log('✅ Default admin created');
            console.log('   Email: admin1@emilock.com');
            console.log('   Passcode: 9999');
            console.log('   Device Limit: 100');
        }

        const adminId = defaultAdmin._id;

        // Migrate customers without dealerId
        const customersWithoutDealer = await Customer.countDocuments({
            $or: [
                { dealerId: { $exists: false } },
                { dealerId: null }
            ]
        });

        if (customersWithoutDealer > 0) {
            console.log(`\n📊 Found ${customersWithoutDealer} customers without admin`);

            const customerResult = await Customer.updateMany(
                {
                    $or: [
                        { dealerId: { $exists: false } },
                        { dealerId: null }
                    ]
                },
                { $set: { dealerId: adminId } }
            );

            console.log(`✅ Updated ${customerResult.modifiedCount} customers`);
        } else {
            console.log('\n✅ All customers already have an admin assigned');
        }

        // Migrate devices without dealerId
        const devicesWithoutDealer = await Device.countDocuments({
            $or: [
                { dealerId: { $exists: false } },
                { dealerId: null }
            ]
        });

        if (devicesWithoutDealer > 0) {
            console.log(`\n📊 Found ${devicesWithoutDealer} devices without admin`);

            const deviceResult = await Device.updateMany(
                {
                    $or: [
                        { dealerId: { $exists: false } },
                        { dealerId: null }
                    ]
                },
                { $set: { dealerId: adminId } }
            );

            console.log(`✅ Updated ${deviceResult.modifiedCount} devices`);
        } else {
            console.log('\n✅ All devices already have an admin assigned');
        }

        // Summary
        const totalCustomers = await Customer.countDocuments();
        const totalDevices = await Device.countDocuments();
        const totalAdmins = await AdminUser.countDocuments({ role: 'ADMIN' });
        const totalSuperAdmins = await AdminUser.countDocuments({ role: 'SUPER_ADMIN' });

        console.log('\n📊 Migration Summary:');
        console.log(`   Total Customers: ${totalCustomers}`);
        console.log(`   Total Devices: ${totalDevices}`);
        console.log(`   Total Admins: ${totalAdmins}`);
        console.log(`   Total Super Admins: ${totalSuperAdmins}`);
        console.log('\n✅ Migration completed successfully!\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Migration error:', error.message);
        process.exit(1);
    }
}

migrateData();
