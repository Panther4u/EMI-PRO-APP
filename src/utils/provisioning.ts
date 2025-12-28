
export const getProvisioningQRData = (
    customer: {
        id: string;
        // Other fields are optional now for the linking step
        [key: string]: any;
    },
    serverUrl: string = window.location.origin
): string => {
    // Dynamic User QR (Step 2 of Two-Step Flow)
    // Scanned by the EMI Pro app's internal scanner to link the device.
    const linkingData = {
        customerId: customer.id,
        serverUrl: serverUrl
    };

    return JSON.stringify(linkingData);
};
