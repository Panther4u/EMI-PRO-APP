require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
const Device = require('../models/Device');
const Customer = require('../models/Customer');

/**
 * Check for Device/Customer count mismatches
 * This helps diagnose why "Device limit reached" error might be showing
 */

const checkMismatch = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all admins
        const admins = await AdminUser.find().select('-passcode');

        console.log('🔍 Device/Customer Mismatch Analysis');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        for (const admin of admins) {
            const deviceCount = await Device.countDocuments({ dealerId: admin._id });
            const customerCount = await Customer.countDocuments({ dealerId: admin._id });

            const mismatch = deviceCount !== customerCount;
            const status = mismatch ? '⚠️  MISMATCH' : '✅ OK';

            console.log(`${status} ${admin.name} (${admin.email})`);
            console.log(`   🔑 Role:           ${admin.role}`);
            console.log(`   📊 Device Limit:   ${admin.deviceLimit}`);
            console.log(`   📱 Device Records: ${deviceCount}`);
            console.log(`   👥 Customer Records: ${customerCount}`);
            console.log(`   📈 Difference:     ${Math.abs(deviceCount - customerCount)}`);

            if (admin.role === 'ADMIN') {
                const remaining = admin.deviceLimit - deviceCount;
                const wouldBlock = deviceCount >= admin.deviceLimit;
                console.log(`   ✨ Remaining Slots: ${remaining}`);
                console.log(`   🚫 Would Block:    ${wouldBlock ? 'YES - Device limit reached!' : 'No'}`);
            } else {
                console.log(`   ✨ Remaining Slots: Unlimited (SUPER_ADMIN)`);
                console.log(`   🚫 Would Block:    No (bypasses check)`);
            }

            console.log('   ─────────────────────────────────────────────────────────────────');
            console.log('');
        }

        // Check for orphaned records
        console.log('\n🔍 Orphaned Records Check');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const allDevices = await Device.find();
        const allCustomers = await Customer.find();

        let orphanedDevices = 0;
        let orphanedCustomers = 0;

        for (const device of allDevices) {
            if (device.assignedCustomerId) {
                const customer = await Customer.findOne({ id: device.assignedCustomerId });
                if (!customer) {
                    orphanedDevices++;
                    console.log(`⚠️  Orphaned Device: ${device.deviceId} (assigned to non-existent customer ${device.assignedCustomerId})`);
                }
            }
        }

        for (const customer of allCustomers) {
            const device = await Device.findOne({ assignedCustomerId: customer.id });
            if (!device) {
                orphanedCustomers++;
                console.log(`⚠️  Customer without Device: ${customer.name} (${customer.id})`);
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Total Devices: ${allDevices.length}`);
        console.log(`   Total Customers: ${allCustomers.length}`);
        console.log(`   Orphaned Devices: ${orphanedDevices}`);
        console.log(`   Customers without Devices: ${orphanedCustomers}`);

        if (orphanedCustomers > 0) {
            console.log('\n⚠️  WARNING: You have customers without Device records!');
            console.log('   This is likely why the device limit check is not working correctly.');
            console.log('   The middleware checks Device count, but customers are being created without Device records.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkMismatch();
