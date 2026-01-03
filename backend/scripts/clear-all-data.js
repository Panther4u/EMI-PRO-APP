require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Device = require('../models/Device');
const AuditLog = require('../models/AuditLog');

const clearAllData = async () => {
    try {
        console.log('🚀 Starting Database Cleanup...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Delete Customers
        const customerResult = await Customer.deleteMany({});
        console.log(`🗑️  Deleted ${customerResult.deletedCount} Customers`);

        // Delete Devices
        const deviceResult = await Device.deleteMany({});
        console.log(`🗑️  Deleted ${deviceResult.deletedCount} Devices`);

        // Delete Audit Logs
        const logResult = await AuditLog.deleteMany({});
        console.log(`🗑️  Deleted ${logResult.deletedCount} Audit Logs`);

        console.log('\n✨ Database Cleanup Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup Failed:', error.message);
        process.exit(1);
    }
};

clearAllData();
