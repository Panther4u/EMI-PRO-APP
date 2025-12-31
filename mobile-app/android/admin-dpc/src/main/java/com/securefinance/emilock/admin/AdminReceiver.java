package com.securefinance.emilock.admin;

import android.app.admin.DeviceAdminReceiver;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class AdminReceiver extends DeviceAdminReceiver {
    private static final String TAG = "ADMIN";

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.d(TAG, "Device Admin Enabled");
    }

    @Override
    public void onProfileProvisioningComplete(Context context, Intent intent) {
        Log.d(TAG, "Provisioning complete");

        // 1. Mark profile as enabled
        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComponent = getWho(context);
        try {
            dpm.setProfileEnabled(adminComponent);
            
            // Apply standard restrictions
            dpm.addUserRestriction(adminComponent, android.os.UserManager.DISALLOW_FACTORY_RESET);
            Log.d(TAG, "Standard policies applied");
        } catch (Exception e) {
            Log.e(TAG, "Failed during post-provisioning setup", e);
        }

        // 2. IMMEDIATE DATA REPORT
        DeviceInfoCollector.send(context);
    }
}

