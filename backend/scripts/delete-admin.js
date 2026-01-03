require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');

/**
 * Delete a specific admin by email
 * Usage: node delete-admin.js <email>
 * Example: node delete-admin.js dealer@emilock.com
 */

const deleteAdmin = async () => {
    try {
        const email = process.argv[2];

        if (!email) {
            console.error('❌ Usage: node delete-admin.js <email>');
            console.error('   Example: node delete-admin.js dealer@emilock.com');
            process.exit(1);
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find the admin
        const admin = await AdminUser.findOne({ email: email.toLowerCase() });

        if (!admin) {
            console.error(`❌ Admin not found with email: ${email}`);
            process.exit(1);
        }

        // Prevent deleting super admin
        if (admin.role === 'SUPER_ADMIN') {
            console.error('❌ Cannot delete SUPER_ADMIN account!');
            console.error('   This is a protected account.');
            process.exit(1);
        }

        console.log('📋 Admin to be deleted:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Name:         ${admin.name}`);
        console.log(`   Email:        ${admin.email}`);
        console.log(`   Role:         ${admin.role}`);
        console.log(`   Device Limit: ${admin.deviceLimit}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Delete the admin
        await AdminUser.deleteOne({ _id: admin._id });

        console.log('✅ Admin deleted successfully!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

deleteAdmin();
