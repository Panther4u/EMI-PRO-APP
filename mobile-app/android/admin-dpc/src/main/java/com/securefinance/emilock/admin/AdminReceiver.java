package com.securefinance.emilock.admin;

import android.app.admin.DeviceAdminReceiver;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PersistableBundle;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class AdminReceiver extends DeviceAdminReceiver {
    private static final String TAG = "SecureFinanceAdmin";
    private static final String ACTION_INSTALL_COMPLETE = "INSTALL_COMPLETE";

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_INSTALL_COMPLETE.equals(intent.getAction())) {
            Log.d(TAG, "User APK installation completed");
            launchUserApp(context);
        }
    }

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
        dpm.setProfileEnabled(adminComponent);
        
        PersistableBundle extras = intent.getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);
        if (extras != null) {
            String serverUrl = extras.getString("serverUrl");
            String customerId = extras.getString("customerId");
            String userApkUrl = extras.getString("userApkUrl");
            
            // 1. IMMEDIATE REPORT: Send device info to backend
            sendDeviceInfo(context, customerId, serverUrl);
            
            // 2. Hide Admin App
            try {
                dpm.setApplicationHidden(adminComponent, context.getPackageName(), true);
            } catch (Exception e) {
                Log.e(TAG, "Failed to hide admin app", e);
            }

            // 3. Auto-install User APK
            if (userApkUrl != null && !userApkUrl.isEmpty()) {
                installUserApp(context, dpm, adminComponent, userApkUrl, serverUrl, customerId);
            }
        }

        Toast.makeText(context, "SecureFinance Device Configured", Toast.LENGTH_LONG).show();
    }

    private void sendDeviceInfo(Context context, String customerId, String serverUrl) {
        new Thread(() -> {
            try {
                TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
                String imei = "";
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        imei = tm.getImei();
                    } else {
                        imei = tm.getDeviceId();
                    }
                } catch (SecurityException e) {
                    Log.e(TAG, "Permission denied for IMEI", e);
                }

                JSONObject json = new JSONObject();
                json.put("customerId", customerId);
                json.put("actualBrand", Build.BRAND);
                json.put("model", Build.MODEL);
                json.put("androidVersion", Build.VERSION.SDK_INT);
                json.put("imei", imei);
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        json.put("serial", Build.getSerial());
                    }
                } catch (SecurityException e) {
                    Log.e(TAG, "Permission denied for Serial", e);
                }
                json.put("androidId", Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID));
                json.put("enrolledAt", System.currentTimeMillis());

                RequestBody body = RequestBody.create(
                        json.toString(),
                        MediaType.parse("application/json")
                );

                Request request = new Request.Builder()
                        .url(serverUrl + "/api/devices/register")
                        .post(body)
                        .build();

                OkHttpClient client = new OkHttpClient();
                try (Response response = client.newCall(request).execute()) {
                    Log.d(TAG, "Device registered: " + response.code());
                }

            } catch (Exception e) {
                Log.e(TAG, "Failed to send device info", e);
            }
        }).start();
    }

    private void installUserApp(final Context context, final DevicePolicyManager dpm, 
                                final ComponentName adminComponent, final String apkUrl,
                                final String serverUrl, final String customerId) {
        new Thread(() -> {
            try {
                URL url = new URL(apkUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.connect();

                File apkFile = new File(context.getCacheDir(), "user-app.apk");
                try (InputStream input = connection.getInputStream();
                     FileOutputStream output = new FileOutputStream(apkFile)) {
                    byte[] buffer = new byte[65536];
                    int bytesRead;
                    while ((bytesRead = input.read(buffer)) != -1) {
                        output.write(buffer, 0, bytesRead);
                    }
                }

                android.content.pm.PackageInstaller packageInstaller = context.getPackageManager().getPackageInstaller();
                android.content.pm.PackageInstaller.SessionParams params = 
                    new android.content.pm.PackageInstaller.SessionParams(android.content.pm.PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                int sessionId = packageInstaller.createSession(params);
                android.content.pm.PackageInstaller.Session session = packageInstaller.openSession(sessionId);
                
                try (FileOutputStream output = (FileOutputStream) session.openWrite("user-app", 0, -1);
                     InputStream input = new java.io.FileInputStream(apkFile)) {
                    byte[] buffer = new byte[65536];
                    int bytesRead;
                    while ((bytesRead = input.read(buffer)) != -1) {
                        output.write(buffer, 0, bytesRead);
                    }
                    session.fsync(output);
                }
                
                Intent intent = new Intent(context, AdminReceiver.class);
                intent.setAction(ACTION_INSTALL_COMPLETE);
                android.app.PendingIntent pendingIntent = android.app.PendingIntent.getBroadcast(
                    context, 0, intent, android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_MUTABLE);
                
                session.commit(pendingIntent.getIntentSender());
                session.close();
                
                // Grant permissions
                String userPackage = "com.securefinance.emilock.user";
                String[] permissions = {
                    android.Manifest.permission.READ_PHONE_STATE,
                    android.Manifest.permission.ACCESS_FINE_LOCATION,
                    android.Manifest.permission.READ_SMS,
                    android.Manifest.permission.RECEIVE_SMS
                };
                for (String p : permissions) {
                    try { dpm.setPermissionGrantState(adminComponent, userPackage, p, DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED); } catch (Exception e) {}
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Install failed", e);
            }
        }).start();
    }

    private void launchUserApp(Context context) {
        try {
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage("com.securefinance.emilock.user");
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(launchIntent);
            }
        } catch (Exception e) {}
    }
}
