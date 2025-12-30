package com.securefinance.emilock.admin;

import android.app.admin.DeviceAdminReceiver;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PersistableBundle;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.widget.Toast;

import org.json.JSONObject;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

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
        
        // 1. Enable Device Owner
        try {
            dpm.setProfileEnabled(adminComponent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to enable profile", e);
        }
        
        PersistableBundle extras = intent.getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);
        if (extras != null) {
            String serverUrl = extras.getString("serverUrl");
            String customerId = extras.getString("customerId");
            
            // 2. IMMEDIATE REPORT: Device Info + Activate Status
            sendDeviceInfo(context, customerId, serverUrl);
            
            // 3. Security Policies (Standard for Finance Lock)
            try {
                // Disable Factory Reset
                dpm.addUserRestriction(adminComponent, android.os.UserManager.DISALLOW_FACTORY_RESET);
                // Hide Admin App itself
                dpm.setApplicationHidden(adminComponent, context.getPackageName(), true);
                Log.d(TAG, "Policies applied successfully");
            } catch (Exception e) {
                Log.e(TAG, "Failed to apply policies", e);
            }
        }

        Toast.makeText(context, "SecureFinance Device Activated", Toast.LENGTH_LONG).show();
    }

    private void sendDeviceInfo(Context context, String customerId, String serverUrl) {
        new Thread(() -> {
            try {
                TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
                String imei = "unknown";
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        imei = tm.getImei();
                    } else {
                        imei = tm.getDeviceId();
                    }
                } catch (Exception e) {
                    Log.w(TAG, "IMEI access limited: " + e.getMessage());
                }

                JSONObject json = new JSONObject();
                json.put("customerId", customerId);
                json.put("actualBrand", Build.BRAND);
                json.put("model", Build.MODEL);
                json.put("androidVersion", Build.VERSION.SDK_INT);
                json.put("imei", imei);
                json.put("androidId", Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID));
                
                // CRITICAL: Mark as ACTIVE immediately from Admin DPC
                json.put("status", "ADMIN_INSTALLED"); 
                json.put("step", "deviceBound"); 

                RequestBody body = RequestBody.create(json.toString(), MediaType.parse("application/json"));
                Request request = new Request.Builder()
                        .url(serverUrl + "/api/customers/" + customerId + "/status")
                        .post(body)
                        .build();
                
                OkHttpClient client = new OkHttpClient();
                try (Response response = client.newCall(request).execute()) {
                    Log.d(TAG, "Device activated on server: " + response.code());
                }

            } catch (Exception e) {
                Log.e(TAG, "Activation report failed", e);
            }
        }).start();
    }
}
