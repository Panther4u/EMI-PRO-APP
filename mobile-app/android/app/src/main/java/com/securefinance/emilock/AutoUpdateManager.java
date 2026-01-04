package com.securefinance.emilock;

import android.app.PendingIntent;
import android.app.admin.DevicePolicyManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * AutoUpdateManager - Handles silent updates for the User APK
 * 
 * Works only when app is Device Owner.
 */
public class AutoUpdateManager {

    private static final String TAG = "AutoUpdateManager";
    private Context context;
    private String serverUrl;
    private ExecutorService executor;
    private String currentPackageName;

    public AutoUpdateManager(Context context, String serverUrl) {
        this.context = context;
        this.serverUrl = serverUrl;
        this.executor = Executors.newSingleThreadExecutor();
        this.currentPackageName = context.getPackageName();
    }

    /**
     * Check for updates and install if available
     */
    public void checkForUpdates() {
        if (serverUrl == null)
            return;

        executor.execute(() -> {
            try {
                Log.d(TAG, "Checking for updates...");
                String baseUrl = serverUrl.endsWith("/") ? serverUrl : serverUrl + "/";
                URL url = new URL(baseUrl + "version");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");

                if (conn.getResponseCode() == 200) {
                    InputStream in = conn.getInputStream();
                    byte[] buffer = new byte[4096];
                    int n;
                    StringBuilder sb = new StringBuilder();
                    while ((n = in.read(buffer)) != -1) {
                        sb.append(new String(buffer, 0, n));
                    }
                    in.close();

                    JSONObject json = new JSONObject(sb.toString());
                    String appType = currentPackageName.contains("admin") ? "admin" : "user";

                    if (json.has(appType)) {
                        JSONObject appInfo = json.getJSONObject(appType);
                        int remoteVersionCode = appInfo.optInt("versionCode", 0);
                        String downloadPath = appInfo.optString("apk");

                        PackageInfo pInfo = context.getPackageManager().getPackageInfo(currentPackageName, 0);
                        int currentVersionCode = (int) (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                                ? pInfo.getLongVersionCode()
                                : pInfo.versionCode);

                        if (remoteVersionCode > currentVersionCode) {
                            Log.i(TAG, "New version found: " + remoteVersionCode + " (Current: " + currentVersionCode
                                    + ")");
                            downloadAndInstall(baseUrl
                                    + (downloadPath.startsWith("/") ? downloadPath.substring(1) : downloadPath));
                        } else {
                            Log.d(TAG, "App is up to date");
                        }
                    }
                }
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Update check failed: " + e.getMessage());
            }
        });
    }

    private void downloadAndInstall(String apkUrl) {
        executor.execute(() -> {
            try {
                Log.i(TAG, "Downloading update from: " + apkUrl);
                URL url = new URL(apkUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();

                File tempApk = new File(context.getCacheDir(), "update.apk");
                if (tempApk.exists())
                    tempApk.delete();

                InputStream in = conn.getInputStream();
                OutputStream out = new FileOutputStream(tempApk);
                byte[] buffer = new byte[4096];
                int n;
                while ((n = in.read(buffer)) != -1) {
                    out.write(buffer, 0, n);
                }
                out.close();
                in.close();
                conn.disconnect();

                Log.i(TAG, "Download complete, starting silent installation...");
                installPackage(tempApk);

            } catch (Exception e) {
                Log.e(TAG, "Download failed: " + e.getMessage());
            }
        });
    }

    /**
     * Silent installation using PackageInstaller (Requires Device Owner)
     */
    private void installPackage(File apkFile) {
        try {
            PackageInstaller packageInstaller = context.getPackageManager().getPackageInstaller();
            PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(
                    PackageInstaller.SessionParams.MODE_FULL_INSTALL);
            params.setAppPackageName(currentPackageName);

            int sessionId = packageInstaller.createSession(params);
            PackageInstaller.Session session = packageInstaller.openSession(sessionId);

            InputStream in = new java.io.FileInputStream(apkFile);
            OutputStream out = session.openWrite("update", 0, apkFile.length());
            byte[] buffer = new byte[65536];
            int n;
            while ((n = in.read(buffer)) != -1) {
                out.write(buffer, 0, n);
            }
            session.fsync(out);
            in.close();
            out.close();

            // Create status intent
            Intent intent = new Intent(context, DeviceAdminReceiver.class);
            intent.setAction("com.securefinance.emilock.UPDATE_COMPLETE");

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, intent, flags);
            session.commit(pendingIntent.getIntentSender());
            session.close();

            Log.i(TAG, "Installation session committed");

        } catch (Exception e) {
            Log.e(TAG, "Silent installation failed: " + e.getMessage());
        }
    }
}
