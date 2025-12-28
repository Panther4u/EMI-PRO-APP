package com.securefinance.emilock;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.PersistableBundle;
import android.util.Log;
import android.widget.Toast;

public class DeviceAdminReceiver extends DeviceAdminReceiver {

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
        super.onProfileProvisioningComplete(context, intent);
        Log.d(TAG, "onProfileProvisioningComplete called");

        // This is the CRITICAL method for QR Code provisioning.
        // The extras we put in the QR code (serverUrl, customerId) are delivered here.

        PersistableBundle extras = intent
                .getParcelableExtra(android.app.admin.DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);

        if (extras != null) {
            String serverUrl = extras.getString("serverUrl");
            String customerId = extras.getString("customerId");

            Log.d(TAG, "Provisioning Extras - URL: " + serverUrl + ", CID: " + customerId);

            if (serverUrl != null || customerId != null) {
                saveProvisioningData(context, serverUrl, customerId);
                Toast.makeText(context, "Device Provisioned: " + customerId, Toast.LENGTH_LONG).show();
            }
        }

        // Launch the App Main Activity immediately
        launchApp(context);
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
