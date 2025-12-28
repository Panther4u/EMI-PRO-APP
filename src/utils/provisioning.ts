import { API_BASE_URL } from '@/config/api';

// CRITICAL: The provisioning flow downloads the APK from a URL. 
// This URL MUST be accessible from the public internet (or the device's network).
// Localhost will NOT work for a factory reset device.
const PROVISIONING_BASE_URL = 'https://emi-pro-app.onrender.com';

/**
 * Generate Android Device Owner Provisioning QR Code
 * This is used during factory reset setup (tap 6 times on welcome screen)
 * 
 * CRITICAL: This MUST follow Android's official provisioning format
 * Reference: https://developers.google.com/android/work/play/emm-api/prov-devices#create_a_qr_code
 */
export const getDeviceOwnerProvisioningQR = (
    customer: {
        id: string;
        name?: string;
        phoneNo?: string;
        mobileModel?: string;
        imei1?: string;
        imei2?: string;
        financeName?: string;
        totalAmount?: number | string;
        emiAmount?: number | string;
        totalEmis?: number | string;
        createdAt?: string;
        [key: string]: any;
    },
    // We ignore the passed serverUrl for the critical download/checksum parts 
    // to ensure we always use the public production assets which match the checksum.
    serverUrl: string = API_BASE_URL,
    wifiConfig?: {
        ssid: string;
        password: string;
        securityType?: 'WPA' | 'WEP' | 'NONE';
    }
): string => {
    // Android Device Owner Provisioning Payload
    // This is what Android expects during factory reset QR provisioning
    const provisioningPayload: any = {
        // Required: Device Admin Component
        // Format: packageName/receiverClass
        // The package name MUST match the applicationId in build.gradle (com.securefinance.emilock.user)
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
            "com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver",

        // Required: APK Download URL (MUST be publicly accessible)
        // We FORCE the production URL here because the APK checksum below corresponds 
        // to the signed Release APK, which is hosted on production.
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
            `${PROVISIONING_BASE_URL}/downloads/app-user-release.apk`,

        // Required: APK SHA-256 Checksum (URL-Safe Base64 encoded)
        // CRITICAL: Must use URL-safe alphabet (-_) and NO padding
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM":
            "X6ukzI6QCFQe5sN8gBFhx1kVJ2uwK54mkN27lJ4UzE8",

        // Optional but recommended: Skip encryption for faster setup
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,

        // Optional: Leave system apps enabled
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,

        // Custom data passed to the Device Admin Receiver
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            // We pass the production URL so the app connects to the right server immediately
            serverUrl: PROVISIONING_BASE_URL,
            customerId: customer.id
        }
    };

    // Add Wi-Fi configuration if provided
    if (wifiConfig) {
        provisioningPayload["android.app.extra.PROVISIONING_WIFI_SSID"] = wifiConfig.ssid;
        provisioningPayload["android.app.extra.PROVISIONING_WIFI_PASSWORD"] = wifiConfig.password;
        provisioningPayload["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"] = wifiConfig.securityType || "WPA";
    }

    return JSON.stringify(provisioningPayload);
};


/**
 * Generate App Linking QR Code
 * This is used INSIDE the app to link a device to a customer
 * (Step 2 of Two-Step Flow - scanned by the EMI Pro app's internal scanner)
 */
export const getAppLinkingQR = (
    customer: {
        id: string;
        [key: string]: any;
    },
    serverUrl: string = API_BASE_URL
): string => {
    const linkingData = {
        customerId: customer.id,
        serverUrl: serverUrl
    };

    return JSON.stringify(linkingData);
};

/**
 * Legacy function for backward compatibility
 * Defaults to App Linking QR
 */
export const getProvisioningQRData = getAppLinkingQR;
