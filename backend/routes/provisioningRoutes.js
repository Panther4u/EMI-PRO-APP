const express = require('express');
const router = express.Router();
const path = require('path');
const { getApkChecksum } = require('../utils/checksum');

// GET /api/provisioning/payload/:customerId
router.get('/payload/:customerId', (req, res) => {
    try {
        const { customerId } = req.params;

        // 🎯 TEMPORARY: Using Render hosting until GitHub Release is created
        // TODO: Switch back to GitHub Releases after uploading APK
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = 'https://emi-pro-app.onrender.com';

        // For now, serve from Render (need to restore APK file)
        const apkFileName = 'securefinance-user-v2.0.1.apk';
        const downloadUrl = `${baseUrl}/downloads/${apkFileName}`;

        // Calculate checksum from local file
        const apkPath = path.join(__dirname, `../public/downloads/${apkFileName}`);
        const fs = require('fs');

        let checksum;
        if (fs.existsSync(apkPath)) {
            checksum = getApkChecksum(apkPath);
        } else {
            // Fallback checksum if file doesn't exist
            checksum = 'zbj4PFFs7A6IZDB6ZJ+G6SZ+5Z/YpGV9enA7W944QX8=';
        }

        console.log(`📦 APK Download URL: ${downloadUrl}`);
        console.log(`🔐 APK Checksum: ${checksum}`);

        // Construct Android Enterprise Provisioning Payload (Industry Standard)
        const payload = {
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
                "com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver",

            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
                downloadUrl,

            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM":
                checksum,

            "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
            "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,

            "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
                "customerId": customerId,
                "serverUrl": baseUrl
            }
        };

        res.json(payload);

    } catch (err) {
        console.error("❌ Provisioning Error:", err);
        console.error("   APK Path attempted:", path.join(__dirname, '../public', 'app-admin-release.apk'));
        console.error("   __dirname:", __dirname);

        // Check if it's a file not found error
        const isFileNotFound = err.code === 'ENOENT' || err.message.includes('no such file');

        res.status(500).json({
            error: "Failed to generate provisioning payload",
            details: err.message,
            hint: isFileNotFound ? "APK file not found on server. Check deployment." : "Checksum calculation failed.",
            apkPath: path.join(__dirname, '../public', 'app-admin-release.apk')
        });
    }
});

module.exports = router;
