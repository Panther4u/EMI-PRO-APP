const express = require('express');
const router = express.Router();
const path = require('path');
const { getApkChecksum } = require('../utils/checksum');

// GET /api/provisioning/payload/:customerId
router.get('/payload/:customerId', (req, res) => {
    try {
        const { customerId } = req.params;

        // Dynamic determination of APK Path (assuming standard deployment)
        const apkFileName = 'app-user-release.apk';
        const apkPath = path.join(__dirname, '../public', apkFileName);

        // Determine Base URL dynamically or from ENV
        const protocol = req.protocol;
        const host = req.get('host');
        // Prefer PROVISIONING_BASE_URL env var if set (for production behind proxies), otherwise request host
        const baseUrl = process.env.PROVISIONING_BASE_URL || `${protocol}://${host}`;
        const downloadUrl = `${baseUrl}/downloads/${apkFileName}`;

        // Calculate Checksum Check
        const checksum = getApkChecksum(apkPath);

        // Construct Android Enterprise Provisioning Payload
        const payload = {
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
                "com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver",

            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
                downloadUrl,

            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM":
                checksum,

            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME":
                "com.securefinance.emilock.user",

            // "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": false, // Removed for compatibility
            // "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true, // Removed for compatibility

            "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM":
                "9MBtfICaLx0RVCoQ4oNB1DNh-FCGkLPc3dRNCLnVHJc",

            "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
                "customerId": customerId,
                "serverUrl": baseUrl // Tell the app where to connect back to
            }
        };

        res.json(payload);

    } catch (err) {
        console.error("Provisioning Error:", err);
        res.status(500).json({
            error: "Failed to generate provisioning payload",
            details: err.message
        });
    }
});

module.exports = router;
