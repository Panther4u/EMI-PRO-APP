const express = require('express');
const router = express.Router();
const path = require('path');
const { getApkChecksum } = require('../utils/checksum');

// GET /api/provisioning/payload/:customerId
router.get('/payload/:customerId', (req, res) => {
    try {
        const { customerId } = req.params;

        // 🎯 USER APK: The APK installed by QR is the USER app (for customer devices)
        // Admin APK is separate and only for admin dashboard access
        const apkFileName = 'app-user-release.apk';
        const apkPath = path.join(__dirname, '../public/downloads', apkFileName);

        // Determine Base URL dynamically or from ENV
        const protocol = req.protocol;
        const host = req.get('host');
        // Prefer PROVISIONING_BASE_URL env var if set (for production behind proxies), otherwise request host
        // FORCE HTTPS: Android 12+ provisioning BLOCKS http downloads.
        const baseUrl = process.env.PROVISIONING_BASE_URL || `https://${host}`;
        const downloadUrl = `${baseUrl}/downloads/${apkFileName}`;

        // Check if APK exists before calculating checksum
        const fs = require('fs');
        if (!fs.existsSync(apkPath)) {
            console.error(`❌ APK NOT FOUND: ${apkPath}`);
            const publicFiles = fs.readdirSync(path.join(__dirname, '../public'));
            console.error(`   Files in public/:`, publicFiles);
            throw new Error(`APK file not found: ${apkFileName}. Build it first!`);
        }

        // Calculate Checksum
        const checksum = getApkChecksum(apkPath);

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
