package com.securefinance.emilock.admin;

import android.app.admin.DeviceAdminReceiver;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.PersistableBundle;
import android.util.Log;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

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
        
        // 2. Read Extras (Server URL, Customer ID, User APK URL)
        String serverUrl = null;
        String customerId = null;
        String userApkUrl = null;
        
        try {
            PersistableBundle extras = intent.getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);
            if (extras != null) {
                serverUrl = extras.getString("serverUrl");
                customerId = extras.getString("customerId");
                userApkUrl = extras.getString("userApkUrl");
                
                Log.d(TAG, "Got Config: " + customerId + " @ " + serverUrl);
                Log.d(TAG, "User APK URL: " + userApkUrl);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to read extras", e);
        }

        // 3. Auto-install User APK
        if (userApkUrl != null && !userApkUrl.isEmpty()) {
            installUserApp(context, dpm, adminComponent, userApkUrl);
        } else {
            Log.w(TAG, "No User APK URL provided in extras");
        }

        Toast.makeText(context, "SecureFinance Device Configured", Toast.LENGTH_LONG).show();
    }

    private void installUserApp(final Context context, final DevicePolicyManager dpm, 
                                final ComponentName adminComponent, final String apkUrl) {
        new Thread(() -> {
            try {
                Log.d(TAG, "Downloading User APK from: " + apkUrl);
                
                // Download APK
                URL url = new URL(apkUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.connect();

                if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                    Log.e(TAG, "Failed to download User APK: HTTP " + connection.getResponseCode());
                    return;
                }

                // Save to cache directory
                File apkFile = new File(context.getCacheDir(), "user-app.apk");
                try (InputStream input = connection.getInputStream();
                     FileOutputStream output = new FileOutputStream(apkFile)) {
                    
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = input.read(buffer)) != -1) {
                        output.write(buffer, 0, bytesRead);
                    }
                }

                Log.d(TAG, "User APK downloaded to: " + apkFile.getAbsolutePath());

                // Silent install using PackageInstaller
                android.content.pm.PackageInstaller packageInstaller = context.getPackageManager().getPackageInstaller();
                android.content.pm.PackageInstaller.SessionParams params = 
                    new android.content.pm.PackageInstaller.SessionParams(
                        android.content.pm.PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                
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
                
                // Create install intent
                Intent intent = new Intent(context, AdminReceiver.class);
                intent.setAction("INSTALL_COMPLETE");
                android.app.PendingIntent pendingIntent = android.app.PendingIntent.getBroadcast(
                    context, 0, intent, 
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_MUTABLE);
                
                session.commit(pendingIntent.getIntentSender());
                session.close();
                
                Log.d(TAG, "User APK installation initiated");
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to install User APK", e);
            }
        }).start();
    }
}
