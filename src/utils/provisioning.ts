import { API_BASE_URL } from '@/config/api';

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
    serverUrl: string = API_BASE_URL
): string => {
    // Android Device Owner Provisioning Payload
    // This is what Android expects during factory reset QR provisioning
    const provisioningPayload = {
        // Required: Device Admin Component
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
            "com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver",

        // Required: APK Download URL (MUST be publicly accessible)
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
            `${serverUrl}/downloads/app-user-release.apk`,

        // Required: APK SHA-256 Checksum (base64 encoded)
        // Generate with: openssl dgst -binary -sha256 app-user-release.apk | openssl base64
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM":
            "qi30+5INyXnWafQjD4bXl9qZjGD/isyDGWgfBdLN6og=",

        // Optional but recommended: Skip encryption for faster setup
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,

        // Optional: Leave system apps enabled
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,

        // Custom data passed to the Device Admin Receiver
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            serverUrl: serverUrl,
            customerId: customer.id,
            customerName: customer.name || "",
            phoneNo: customer.phoneNo || "",
            deviceBrand: customer.mobileModel || "",
            deviceModel: customer.mobileModel || "",
            imei1: customer.imei1 || "",
            imei2: customer.imei2 || "",
            financeName: customer.financeName || "",
            totalAmount: String(customer.totalAmount || "0"),
            emiAmount: String(customer.emiAmount || "0"),
            totalEmis: String(customer.totalEmis || "0"),
            enrollmentDate: customer.createdAt || new Date().toISOString()
        }
    };

    return JSON.stringify(provisioningPayload);
};

/**
 * Generate App Linking QR Code
 * This is used INSIDE the app to link a device to a customer
 * (Step 2 of Two-Step Flow - scanned by the EMI Pro app's internal scanner)
 * 
 * CRITICAL: serverUrl MUST be a public URL (https://emi-pro.onrender.com)
 * NOT localhost - factory-reset devices cannot reach localhost!
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
