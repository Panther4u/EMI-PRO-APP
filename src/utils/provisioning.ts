
export const getProvisioningQRData = (
    customer: {
        id: string;
        name: string;
        phoneNo: string;
        mobileModel: string;
        imei1: string;
        imei2: string;
        financeName: string;
        totalAmount: number | string;
        emiAmount: number | string;
        totalEmis: number | string;
        createdAt?: string;
    },
    serverUrl: string = window.location.origin
): string => {
    // Android Enterprise Provisioning Data
    const provisioningData = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": `${serverUrl}/downloads/app-user-release.apk`,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "dgih6YUU0t0Fuh01CnnI18+UUf2SY384CbVHn5uLMO4=",
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            "serverUrl": serverUrl,
            "customerId": customer.id,
            "customerName": customer.name,
            "phoneNo": customer.phoneNo,
            "deviceBrand": customer.mobileModel,
            "deviceModel": customer.mobileModel,
            "imei1": customer.imei1,
            "imei2": customer.imei2,
            "financeName": customer.financeName,
            "totalAmount": String(customer.totalAmount),
            "emiAmount": String(customer.emiAmount),
            "totalEmis": String(customer.totalEmis),
            "enrollmentDate": customer.createdAt || new Date().toISOString()
        }
    };

    const jsonString = JSON.stringify(provisioningData);

    // Base64 Encode the JSON string as required by Android Enterprise
    return btoa(jsonString);
};
