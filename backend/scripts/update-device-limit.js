const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
require('dotenv').config({ path: __dirname + '/../.env' });

const [, , email, limitStr] = process.argv;

if (!email || !limitStr) {
    console.log('Usage: node scripts/update-device-limit.js <email> <new_limit>');
    process.exit(1);
}

const newLimit = parseInt(limitStr, 10);
if (isNaN(newLimit)) {
    console.log('Error: <new_limit> must be a number');
    process.exit(1);
}

async function updateLimit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const admin = await AdminUser.findOne({ email: email.toLowerCase() });

        if (!admin) {
            console.log(`❌ Admin with email ${email} not found`);
            process.exit(1);
        }

        const oldLimit = admin.deviceLimit;
        admin.deviceLimit = newLimit;
        await admin.save();

        console.log(`✅ Successfully updated device limit for ${email}`);
        console.log(`   Old Limit: ${oldLimit}`);
        console.log(`   New Limit: ${newLimit}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateLimit();
