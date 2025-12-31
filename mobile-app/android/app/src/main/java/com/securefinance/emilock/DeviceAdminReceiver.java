package com.securefinance.emilock;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class DeviceAdminReceiver extends android.app.admin.DeviceAdminReceiver {

    @Override
    public void onProfileProvisioningComplete(Context context, Intent intent) {
        Log.d("EMI_ADMIN", "Provisioning complete");

        // 🔥 IMMEDIATELY report device info
        DeviceInfoCollector.collectAndSend(context);
    }
}
