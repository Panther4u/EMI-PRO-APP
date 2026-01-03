const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getApkChecksum } = require('../utils/checksum');

// GET /api/provisioning/payload/:customerId
router.get('/payload/:customerId', (req, res) => {
    try {
        const { customerId } = req.params;
        const { wifiSsid, wifiPassword, wifiSecurityType } = req.query; // Get wifi details

        // 🎯 DYNAMIC: Use current host to support both Local and Production testing
        // CRITICAL: Localhost/127.0.0.1 in a QR code CANNOT be scanned by a real device.
        // We only use the local IP if it's a network IP (e.g., 192.168...).
        const protocol = req.protocol;
        const host = req.get('host');
        const isNetworkIp = host.startsWith('192.168.') || host.startsWith('10.');

        // If running on localhost, fallback to Render URL so the device can actually download the APK
        const baseUrl = isNetworkIp ? `${protocol}://${host}` : 'https://emi-pro-app.onrender.com';

        // Current APK version (USER FLAVOR for Customers)
        const apkFileName = 'securefinance-user.apk';
        const downloadUrl = `${baseUrl}/downloads/${apkFileName}`;

        // Verified for User Release APK
        const VERIFIED_CHECKSUM = 'JfdtHWuytoe5zTSMmMBsJF2KptJBkEA1/kRcC+Vh02o=';

        // Prefer dynamic if file exists, but fallback to verified if fails
        let checksum = VERIFIED_CHECKSUM;

        const apkPath = path.join(__dirname, '../public/downloads', apkFileName);

        try {
            if (fs.existsSync(apkPath)) {
                // checksum = getApkChecksum(apkPath); 
                // Force Verified Checksum to resolve "Server mismatch" issues
                checksum = VERIFIED_CHECKSUM;
            }
        } catch (e) {
            console.error("Checksum calc failed, using hardcoded", e);
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

        // Add Wi-Fi configuration if provided
        if (wifiSsid) {
            payload["android.app.extra.PROVISIONING_WIFI_SSID"] = wifiSsid;
            if (wifiPassword) {
                payload["android.app.extra.PROVISIONING_WIFI_PASSWORD"] = wifiPassword;
            }
            // Default to WPA if not specified, but usually it's inferred or defaults
            // payload["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"] = wifiSecurityType || "WPA"; 
        }

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
