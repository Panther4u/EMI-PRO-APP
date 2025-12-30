const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('./models/Customer');
const Device = require('./models/Device');

async function clearAllData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Count records before deletion
        const customerCount = await Customer.countDocuments();
        const deviceCount = await Device.countDocuments();

        console.log('📊 Current Data:');
        console.log(`   Customers: ${customerCount}`);
        console.log(`   Devices: ${deviceCount}\n`);

        if (customerCount === 0 && deviceCount === 0) {
            console.log('✅ Database is already empty!');
            process.exit(0);
        }

        console.log('🗑️  Deleting all data...\n');

        // Delete all customers
        const customerResult = await Customer.deleteMany({});
        console.log(`✅ Deleted ${customerResult.deletedCount} customers`);

        // Delete all devices
        const deviceResult = await Device.deleteMany({});
        console.log(`✅ Deleted ${deviceResult.deletedCount} devices`);

        console.log('\n🎉 All data cleared successfully!');
        console.log('📊 Database is now empty and ready for fresh data\n');

    } catch (error) {
        console.error('❌ Error clearing data:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the script
console.log('⚠️  WARNING: This will delete ALL customer and device data!');
console.log('⚠️  This action cannot be undone!\n');

clearAllData();
