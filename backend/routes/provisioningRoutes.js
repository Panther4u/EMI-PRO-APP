const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getApkChecksum } = require('../utils/checksum');

// GET /api/provisioning/payload/:customerId
router.get('/payload/:customerId', (req, res) => {
    try {
        const { customerId } = req.params;

        // 🎯 DYNAMIC: Use current host to support both Local and Production testing
        const protocol = req.protocol;
        const host = req.get('host');
        const isNetworkIp = host.startsWith('192.168.') || host.startsWith('10.');

        // If running on localhost, fallback to Render URL so the device can actually download the APK
        const baseUrl = isNetworkIp ? `${protocol}://${host}` : 'https://emi-pro-app.onrender.com';

        // Current APK version (USER FLAVOR for Customers)
        const apkFileName = 'securefinance-user.apk';
        const downloadUrl = `${baseUrl}/downloads/${apkFileName}`;

        const apkPath = path.join(__dirname, '../public/downloads', apkFileName);
        let checksum = '';

        try {
            if (fs.existsSync(apkPath)) {
                // Use the utility to get the URL-safe checksum
                checksum = getApkChecksum(apkPath);
                console.log(`✅ Dynamic URL-Safe Checksum: ${checksum}`);
            } else {
                // Fallback to a known verified URL-safe checksum if file is missing (should not happen)
                checksum = 'yeWPX99VD07dtdpGrWl_tOLdr2dBMEVGfNZf-RUeqII';
                console.warn(`⚠️ APK missing on disk, using fallback checksum`);
            }
        } catch (e) {
            console.error("Checksum calc failed", e);
            checksum = 'yeWPX99VD07dtdpGrWl_tOLdr2dBMEVGfNZf-RUeqII';
        }

        console.log(`📦 APK Download URL: ${downloadUrl}`);

        // Construct Android Enterprise Provisioning Payload (Strict URL-Safe Base64)
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

        res.status(500).json({
            error: "Failed to generate provisioning payload",
            details: err.message,
            hint: "Checksum calculation failed."
        });
    }
});

module.exports = router;
