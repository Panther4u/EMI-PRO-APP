const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
require('dotenv').config({ path: __dirname + '/../.env' });

async function fixAdmin1Passcode() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const admin = await AdminUser.findOne({ email: 'admin1@emilock.com' });

        if (admin) {
            console.log('Found admin1:', admin.email, 'Role:', admin.role);

            // Update passcode (will be hashed by pre-save hook)
            admin.passcode = '9999';
            await admin.save();

            console.log('✅ Passcode updated successfully!');
            console.log('   Email: admin1@emilock.com');
            console.log('   Passcode: 9999');
        } else {
            console.log('❌ admin1 not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixAdmin1Passcode();
