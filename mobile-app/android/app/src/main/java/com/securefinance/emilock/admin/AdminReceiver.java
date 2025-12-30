package com.securefinance.emilock.admin;

import android.app.admin.DeviceAdminReceiver;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.Toast;

import com.securefinance.emilock.DeviceInfoCollector;

public class AdminReceiver extends DeviceAdminReceiver {

    private static final String TAG = "AdminReceiver";

    @Override
    public void onProfileProvisioningComplete(Context context, Intent intent) {
        super.onProfileProvisioningComplete(context, intent);
        Log.d(TAG, "onProfileProvisioningComplete: Device Owner Provisioning Complete");

        // 1. Enable Component
        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComponent = getWho(context);
        dpm.setProfileName(adminComponent, "SecureFinance Admin");

        // 2. Collect Device Info and Send to Backend (Auto-Claim by IMEI)
        Log.i(TAG, "Starting Device Info Collection for Auto-Claim...");
        // passing null for serverUrl and customerId, DeviceInfoCollector will use
        // defaults/IMEI
        DeviceInfoCollector.sendDeviceInfoToBackend(context);

        // 3. Launch App
        launchApp(context);

        Toast.makeText(context, "Device Provisioned Successfully", Toast.LENGTH_LONG).show();
    }

    private void launchApp(Context context) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(launchIntent);
        } else {
            Log.e(TAG, "Launch Intent is null. App might not be installed?");
        }
    }

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.d(TAG, "Device Admin Enabled");
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Log.d(TAG, "Device Admin Disabled");
    }
}
