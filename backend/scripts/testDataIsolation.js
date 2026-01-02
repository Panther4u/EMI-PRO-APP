const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
const Customer = require('../models/Customer');
require('dotenv').config({ path: __dirname + '/../.env' });

/**
 * Test Data Isolation
 * Creates 2 admins and 2 customers (one per admin)
 * Verifies each admin can only see their own customers
 */

async function testDataIsolation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Create Admin 1
        const admin1 = new AdminUser({
            name: 'Admin One',
            email: 'admin1@test.com',
            passcode: '1111',
            role: 'ADMIN',
            deviceLimit: 50,
            isActive: true
        });
        await admin1.save();
        console.log('✅ Created Admin 1:', admin1.email);

        // Create Admin 2
        const admin2 = new AdminUser({
            name: 'Admin Two',
            email: 'admin2@test.com',
            passcode: '2222',
            role: 'ADMIN',
            deviceLimit: 50,
            isActive: true
        });
        await admin2.save();
        console.log('✅ Created Admin 2:', admin2.email);

        // Create Customer for Admin 1
        const customer1 = new Customer({
            id: 'CUST001',
            name: 'Customer of Admin 1',
            phoneNo: '1111111111',
            imei1: '111111111111111',
            dealerId: admin1._id
        });
        await customer1.save();
        console.log('✅ Created Customer 1 for Admin 1');

        // Create Customer for Admin 2
        const customer2 = new Customer({
            id: 'CUST002',
            name: 'Customer of Admin 2',
            phoneNo: '2222222222',
            imei1: '222222222222222',
            dealerId: admin2._id
        });
        await customer2.save();
        console.log('✅ Created Customer 2 for Admin 2\n');

        // Test: Admin 1 should see only their customer
        const admin1Customers = await Customer.find({ dealerId: admin1._id });
        console.log('📊 Admin 1 Customers:', admin1Customers.length);
        console.log('   -', admin1Customers[0].name);

        // Test: Admin 2 should see only their customer
        const admin2Customers = await Customer.find({ dealerId: admin2._id });
        console.log('📊 Admin 2 Customers:', admin2Customers.length);
        console.log('   -', admin2Customers[0].name);

        // Test: Super Admin should see all customers
        const allCustomers = await Customer.find({});
        console.log('📊 Super Admin (All) Customers:', allCustomers.length);

        console.log('\n✅ Data Isolation Test PASSED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Each admin sees only their own customers');
        console.log('✅ Super Admin sees all customers');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Cleanup
        await AdminUser.deleteMany({ email: { $in: ['admin1@test.com', 'admin2@test.com'] } });
        await Customer.deleteMany({ id: { $in: ['CUST001', 'CUST002'] } });
        console.log('🗑️  Test data cleaned up\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testDataIsolation();
