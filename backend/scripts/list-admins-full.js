require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');

const listAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const admins = await AdminUser.find({});
        console.log('\n📊 ALL Admin Users in DB:');
        console.log(JSON.stringify(admins, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

listAdmins();
