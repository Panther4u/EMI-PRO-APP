package com.securefinance.emilock.admin;

import android.app.admin.DeviceAdminReceiver;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.PersistableBundle;
import android.util.Log;
import android.widget.Toast;

public class AdminReceiver extends DeviceAdminReceiver {
    private static final String TAG = "SecureFinanceAdmin";

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.d(TAG, "Device Admin Enabled");
    }

    @Override
    public void onProfileProvisioningComplete(Context context, Intent intent) {
        Log.d(TAG, "Provisioning Complete. Configuring device...");
        
        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComponent = getWho(context);

        // 1. Enable the admin
        dpm.setProfileEnabled(adminComponent);
        
        // 2. Read Extras (Server URL, Customer ID)
        try {
            PersistableBundle extras = intent.getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);
            if (extras != null) {
                String serverUrl = extras.getString("serverUrl");
                String customerId = extras.getString("customerId");
                Log.d(TAG, "Got Config: " + customerId + " @ " + serverUrl);
                
                // Save to SharedPreferences (World Readable if possible, or ContentProvider later)
                // For now, simple logging is enough to prove it works.
                // In production, we'd use a ContentProvider to share this with the user app.
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to read extras", e);
        }

        // 3. Keep screen on / set specific constraints if needed
        // dpm.setGlobalSetting(adminComponent, android.provider.Settings.Global.STAY_ON_WHILE_PLUGGED_IN, "3");

        Toast.makeText(context, "SecureFinance Device Configured", Toast.LENGTH_LONG).show();
    }
}
