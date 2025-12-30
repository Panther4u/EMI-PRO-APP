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
    private static final String ACTION_INSTALL_COMPLETE = "INSTALL_COMPLETE";

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        
        if (ACTION_INSTALL_COMPLETE.equals(intent.getAction())) {
            Log.d(TAG, "User APK installation completed");
            // Launch the User App
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
            installUserApp(context, dpm, adminComponent, userApkUrl, serverUrl, customerId);
        } else {
            Log.w(TAG, "No User APK URL provided in extras");
        }

        // 4. Hide Admin App from launcher and app list
        hideAdminApp(context, dpm, adminComponent);

        Toast.makeText(context, "SecureFinance Device Configured", Toast.LENGTH_LONG).show();
    }

    private void hideAdminApp(Context context, DevicePolicyManager dpm, ComponentName adminComponent) {
        try {
            // Hide this admin app from the user
            dpm.setApplicationHidden(adminComponent, "com.securefinance.emilock.admin", true);
            Log.d(TAG, "Admin app hidden successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to hide admin app", e);
        }
    }

    private void grantUserAppPermissions(DevicePolicyManager dpm, ComponentName adminComponent) {
        String userAppPackage = "com.securefinance.emilock.user";
        
        String[] permissions = {
            android.Manifest.permission.READ_PHONE_STATE,
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            android.Manifest.permission.ACCESS_COARSE_LOCATION,
            android.Manifest.permission.CAMERA,
            android.Manifest.permission.READ_SMS,
            android.Manifest.permission.RECEIVE_SMS,
            android.Manifest.permission.POST_NOTIFICATIONS
        };

        for (String permission : permissions) {
            try {
                dpm.setPermissionGrantState(
                    adminComponent,
                    userAppPackage,
                    permission,
                    DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                );
                Log.d(TAG, "Granted permission: " + permission);
            } catch (Exception e) {
                Log.e(TAG, "Failed to grant permission: " + permission, e);
            }
        }
    }

    private void installUserApp(final Context context, final DevicePolicyManager dpm, 
                                final ComponentName adminComponent, final String apkUrl,
                                final String serverUrl, final String customerId) {
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
                
                // Grant all permissions to User App
                grantUserAppPermissions(dpm, adminComponent);
                
                // Save provisioning data for User App to read
                saveProvisioningData(context, serverUrl, customerId);
                
                Log.d(TAG, "User APK installation initiated");
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to install User APK", e);
            }
        }).start();
    }

    private void launchUserApp(Context context) {
        try {
            Intent launchIntent = context.getPackageManager()
                .getLaunchIntentForPackage("com.securefinance.emilock.user");
            
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                context.startActivity(launchIntent);
                Log.d(TAG, "User App launched successfully");
            } else {
                Log.e(TAG, "User App launch intent not found");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch User App", e);
        }
    }

    private void saveProvisioningData(Context context, String serverUrl, String customerId) {
        try {
            // Save to SharedPreferences with MODE_WORLD_READABLE (deprecated but works for Device Owner)
            // User App will read this on first launch
            android.content.SharedPreferences prefs = context.getSharedPreferences(
                "emi_provisioning", 
                Context.MODE_PRIVATE
            );
            prefs.edit()
                .putString("serverUrl", serverUrl)
                .putString("customerId", customerId)
                .putLong("provisionedAt", System.currentTimeMillis())
                .apply();
            
            Log.d(TAG, "Provisioning data saved for User App");
        } catch (Exception e) {
            Log.e(TAG, "Failed to save provisioning data", e);
        }
    }
}
