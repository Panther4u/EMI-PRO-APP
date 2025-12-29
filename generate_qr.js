const fs = require('fs');
const crypto = require('crypto');
const QRCode = require('qrcode');

// Configuration
const APK_PATH = './backend/public/app-user-release.apk';
const APK_URL = 'https://emi-pro-app.onrender.com/downloads/app-user-release.apk';
const PACKAGE_NAME = 'com.securefinance.emilock.user';
const COMPONENT_NAME = 'com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver';

async function generateQR() {
    console.log('Generating Provisioning QR...');

    // 1. Calculate Checksum
    if (!fs.existsSync(APK_PATH)) {
        console.error(`Error: APK not found at ${APK_PATH}`);
        return;
    }

    const fileBuffer = fs.readFileSync(APK_PATH);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);

    // URL-safe Base64 encoding (no padding)
    const checksum = hashSum.digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    console.log(`APK Checksum: ${checksum}`);

    // 2. Create Payload
    const payload = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": COMPONENT_NAME,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME": PACKAGE_NAME,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": APK_URL,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": checksum,
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": false,
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            "serverUrl": "https://emi-pro-app.onrender.com",
            "customerId": "MANUAL_TEST"
        }
    };

    // 3. Generate QR Image
    QRCode.toFile('provisioning_qr.png', JSON.stringify(payload), {
        errorCorrectionLevel: 'H'
    }, function (err) {
        if (err) throw err;
        console.log('Success! QR code saved to provisioning_qr.png');
        console.log('Payload:', JSON.stringify(payload, null, 2));
    });
}

generateQR();
