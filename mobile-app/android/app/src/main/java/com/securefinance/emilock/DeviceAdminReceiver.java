package com.securefinance.emilock;

import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.app.admin.DevicePolicyManager;

public class DeviceAdminReceiver extends android.app.admin.DeviceAdminReceiver {

    private static final String TAG = "EMI_ADMIN";

    @Override
    public void onProfileProvisioningComplete(Context context, Intent intent) {
        Log.d(TAG, "Device Owner Activated - Provisioning Complete");

        // Extract Customer ID and Server URL from extras
        String customerId = intent.getStringExtra("EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE_CUSTOMER_ID");
        String serverUrl = intent.getStringExtra("EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE_SERVER_URL");

        // if null, try to get from bundle
        if (customerId == null || serverUrl == null) {
            android.os.Bundle extras = intent
                    .getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);
            if (extras != null) {
                customerId = extras.getString("customerId");
                serverUrl = extras.getString("serverUrl");
            }
        }

        // 🔥 IMMEDIATELY report device info (Single APK Rule)
        DeviceInfoCollector.collectAndSend(context, customerId, serverUrl);

        // 🔥 LAUNCH the app immediately (MainActivity is our LockScreen)
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(launch);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Boot recovered - sending fresh report");
            DeviceInfoCollector.collectAndSend(context, null, null);
        }
    }

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.d(TAG, "Device Admin Enabled");
        DeviceInfoCollector.collectAndSend(context, null, null);
    }
}
