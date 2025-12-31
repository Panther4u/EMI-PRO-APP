package com.securefinance.emilock;

import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.app.admin.DevicePolicyManager;

public class DeviceAdminReceiver extends android.app.admin.DeviceAdminReceiver {

    private static final String TAG = "EMI_ADMIN";

    @Override
    public void onProfileProvisioningComplete(Context context, Intent intent) {
        Log.i(TAG, "✅ Device Owner Activated - Provisioning Complete");
        Log.i(TAG, "🎯 IMEI-BASED PROVISIONING - customerId NOT required from QR");

        // Try to extract optional extras from QR (may be null for IMEI-only flow)
        String customerId = null;
        String serverUrl = null;

        try {
            android.os.Bundle extras = intent
                    .getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);
            if (extras != null) {
                customerId = extras.getString("customerId");
                serverUrl = extras.getString("serverUrl");
                Log.d(TAG, "QR extras found - customerId: " + customerId + ", serverUrl: " + serverUrl);
            } else {
                Log.i(TAG, "No QR extras - proceeding with IMEI-only registration");
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to read QR extras, continuing anyway", e);
        }

        // Default to production server if not specified
        if (serverUrl == null || serverUrl.isEmpty()) {
            serverUrl = "https://emi-pro-app.onrender.com";
            Log.i(TAG, "Using default server: " + serverUrl);
        }

        // 🔥 IMMEDIATELY report device info (IMEI-FIRST - customerId is optional)
        DeviceInfoCollector.collectAndSend(context, customerId, serverUrl);

        // PERSIST for React Native (customerId may be null - that's OK!)
        android.content.SharedPreferences prefs = context.getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
        prefs.edit()
                .putString("SERVER_URL", serverUrl)
                .putString("CUSTOMER_ID", customerId) // May be null
                .putBoolean("IS_PROVISIONED", true)
                .apply();

        Log.i(TAG, "✅ Provisioning data saved. Launching app...");

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
