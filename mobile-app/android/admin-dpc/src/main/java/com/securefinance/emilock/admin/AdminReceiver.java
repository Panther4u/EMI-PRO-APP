package com.securefinance.emilock.admin;

import android.app.PendingIntent;
import android.app.admin.DeviceAdminReceiver;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
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
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class AdminReceiver extends DeviceAdminReceiver {
    private static final String TAG = "SecureFinanceAdmin";
    private static final String ACTION_INSTALL_COMPLETE = "com.securefinance.emilock.admin.INSTALL_COMPLETE";

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        Log.d(TAG, "onReceive: " + action);

        if (PackageInstaller.ACTION_SESSION_COMMITTED.equals(action) || ACTION_INSTALL_COMPLETE.equals(action)) {
            int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
            if (status == PackageInstaller.STATUS_SUCCESS || status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                Log.d(TAG, "Installation success or pending. Attempting launch...");
                launchUserApp(context);
            } else {
                String msg = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
                Log.e(TAG, "Installation failed: " + msg + " (Status: " + status + ")");
            }
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
        
        // 1. Enable Profile
        try {
            dpm.setProfileEnabled(adminComponent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to enable profile", e);
        }
        
        PersistableBundle extras = intent.getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);
        if (extras != null) {
            String serverUrl = extras.getString("serverUrl");
            String customerId = extras.getString("customerId");
            String userApkUrl = extras.getString("userApkUrl");
            
            Log.d(TAG, "Config: server=" + serverUrl + ", customer=" + customerId);

            // 2. IMMEDIATE REPORT: Device Info
            sendDeviceInfo(context, customerId, serverUrl);
            
            // 3. Hide Admin App (Optional but keeps it clean)
            try {
                dpm.setApplicationHidden(adminComponent, context.getPackageName(), true);
            } catch (Exception e) {}

            // 4. Auto-install User APK
            if (userApkUrl != null && !userApkUrl.isEmpty()) {
                installUserApp(context, dpm, adminComponent, userApkUrl, serverUrl, customerId);
            } else {
                Log.e(TAG, "No User APK URL found in provisioning extras!");
            }
        }

        Toast.makeText(context, "Configuring SecureFinance...", Toast.LENGTH_SHORT).show();
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
                    Log.w(TAG, "Could not get IMEI: " + e.getMessage());
                }

                JSONObject json = new JSONObject();
                json.put("customerId", customerId);
                json.put("actualBrand", Build.BRAND);
                json.put("model", Build.MODEL);
                json.put("androidVersion", Build.VERSION.SDK_INT);
                json.put("imei", imei);
                json.put("androidId", Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID));
                json.put("status", "ADMIN_INSTALLED");

                RequestBody body = RequestBody.create(json.toString(), MediaType.parse("application/json"));
                Request request = new Request.Builder().url(serverUrl + "/api/devices/register").post(body).build();
                
                new OkHttpClient().newCall(request).execute();
                Log.d(TAG, "Immediate device report sent");
            } catch (Exception e) {
                Log.e(TAG, "DeviceInfo report failed", e);
            }
        }).start();
    }

    private void installUserApp(final Context context, final DevicePolicyManager dpm, 
                                final ComponentName adminComponent, final String apkUrl,
                                final String serverUrl, final String customerId) {
        new Thread(() -> {
            try {
                Log.d(TAG, "Downloading User APK: " + apkUrl);
                URL url = new URL(apkUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                conn.connect();

                if (conn.getResponseCode() != 200) {
                    Log.e(TAG, "Download failed code: " + conn.getResponseCode());
                    return;
                }

                File apkFile = new File(context.getCacheDir(), "user-app.apk");
                try (InputStream in = conn.getInputStream(); OutputStream out = new FileOutputStream(apkFile)) {
                    byte[] buf = new byte[8192];
                    int len;
                    while ((len = in.read(buf)) > 0) out.write(buf, 0, len);
                }

                Log.d(TAG, "Download complete. Starting silent install...");

                PackageInstaller installer = context.getPackageManager().getPackageInstaller();
                PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(
                        PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                params.setAppPackageName("com.securefinance.emilock.user");

                int sessionId = installer.createSession(params);
                PackageInstaller.Session session = installer.openSession(sessionId);

                try (OutputStream out = session.openWrite("user_app_install", 0, -1);
                     InputStream in = new java.io.FileInputStream(apkFile)) {
                    byte[] buf = new byte[65536];
                    int len;
                    while ((len = in.read(buf)) > 0) out.write(buf, 0, len);
                    session.fsync(out);
                }

                Intent intent = new Intent(context, AdminReceiver.class);
                intent.setAction(ACTION_INSTALL_COMPLETE);
                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                        context, sessionId, intent, 
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);

                session.commit(pendingIntent.getIntentSender());
                session.close();
                
                Log.d(TAG, "Install session committed");

                // Pre-grant permissions
                String pkg = "com.securefinance.emilock.user";
                dpm.setPermissionGrantState(adminComponent, pkg, android.Manifest.permission.READ_PHONE_STATE, DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED);
                dpm.setPermissionGrantState(adminComponent, pkg, android.Manifest.permission.ACCESS_FINE_LOCATION, DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED);

            } catch (Exception e) {
                Log.e(TAG, "Technical install error", e);
            }
        }).start();
    }

    private void launchUserApp(Context context) {
        try {
            Intent i = context.getPackageManager().getLaunchIntentForPackage("com.securefinance.emilock.user");
            if (i != null) {
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(i);
                Log.d(TAG, "User app launched successfully");
            } else {
                Log.e(TAG, "User app launch intent NULL. Is it installed?");
            }
        } catch (Exception e) {
            Log.e(TAG, "Launch error", e);
        }
    }
}
