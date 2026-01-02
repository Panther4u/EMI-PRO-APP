const express = require('express');
const router = express.Router();
const path = require('path');
const { getApkChecksum } = require('../utils/checksum');

// GET /api/provisioning/payload/:customerId
router.get('/payload/:customerId', (req, res) => {
    try {
        const { customerId } = req.params;

        // 🎯 USER APK: Now hosted on GitHub Releases for better reliability
        // GitHub CDN provides faster downloads than Render
        const GITHUB_RELEASE_VERSION = process.env.GITHUB_RELEASE_VERSION || 'v1.1.1';
        const GITHUB_APK_URL = process.env.GITHUB_APK_URL ||
            `https://github.com/Panther4u/EMI-PRO-APP/releases/download/${GITHUB_RELEASE_VERSION}/app-user-release.apk`;

        // APK Checksum (calculated from the release APK)
        // Update this when uploading a new release
        const APK_CHECKSUM = process.env.APK_CHECKSUM ||
            'zbj4PFFs7A6IZDB6ZJ+G6SZ+5Z/YpGV9enA7W944QX8=';

        // Use GitHub URL for download
        const downloadUrl = GITHUB_APK_URL;
        const checksum = APK_CHECKSUM;

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
