package com.securefinance.emilock;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.PersistableBundle;
import android.app.admin.DevicePolicyManager;
import android.util.Log;
import android.widget.Toast;

// Fix: Use fully qualified name to avoid shadowing/cyclic inheritance error
public class DeviceAdminReceiver extends android.app.admin.DeviceAdminReceiver {

    private static final String TAG = "DeviceAdminReceiver";

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.d(TAG, "Device Admin Enabled");
        Toast.makeText(context, "SecureFinance Admin Enabled", Toast.LENGTH_SHORT).show();

        // Attempt to extract extras if passed directly to onEnabled
        // (This happens in some provisioning flows)
        if (intent != null) {
            // Note: In QR provisioning, extras might be in
            // EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE
            // but often they are passed to onProfileProvisioningComplete instead.
            // We'll try to persist any data we find here just in case.
        }
    }

    @Override
    public void onProfileProvisioningComplete(Context context, Intent intent) {
        try {
            super.onProfileProvisioningComplete(context, intent);
            Log.d(TAG, "onProfileProvisioningComplete called - Device Owner setup complete");

            String serverUrl = null;
            String customerId = null;

            // SAFE EXTRACTION OF EXTRAS
            try {
                PersistableBundle extras = intent
                        .getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);
                if (extras != null) {
                    serverUrl = extras.getString("serverUrl");
                    customerId = extras.getString("customerId");
                    Log.d(TAG, "Extras found: CustomerID=" + customerId);
                    saveProvisioningData(context, serverUrl, customerId);
                } else {
                    Log.w(TAG, "No Admin Extras Bundle found in intent");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error reading admin extras: " + e.getMessage());
            }

            // 🔥 CRITICAL: Send device info to backend IMMEDIATELY
            // This is the ONLY source of truth for device details
            if (serverUrl != null && customerId != null) {
                Log.i(TAG, "🚀 Sending device info to backend...");
                DeviceInfoCollector.sendDeviceInfoToBackend(serverUrl, customerId, context);
            } else {
                Log.e(TAG, "❌ Cannot send device info - missing serverUrl or customerId");
            }

            Toast.makeText(context, "Device Setup Complete", Toast.LENGTH_LONG).show();

            // Launch the App Main Activity immediately
            launchApp(context);
        } catch (Exception e) {
            Log.e(TAG, "CRITICAL: Provisioning Crash", e);
            // Even if it crashes, try to launch app so user isn't stuck "Setting up..."
            launchApp(context);
        }
    }

    private void saveProvisioningData(Context context, String serverUrl, String customerId) {
        // We use the default shared preferences so React Native (or Capacitor) can
        // potentially read them
        // Or we use a specific name. Let's use a common one.
        SharedPreferences prefs = context.getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        if (serverUrl != null) {
            editor.putString("SERVER_URL", serverUrl);
        }
        if (customerId != null) {
            editor.putString("CUSTOMER_ID", customerId);
            editor.putBoolean("IS_PROVISIONED", true);
        }

        editor.apply();
        Log.d(TAG, "Provisioning data saved to SharedPreferences");
    }

    private void launchApp(Context context) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(launchIntent);
        }
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Toast.makeText(context, "SecureFinance Admin Disabled", Toast.LENGTH_SHORT).show();
    }
}
