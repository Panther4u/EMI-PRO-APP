package com.securefinance.admin;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import androidx.core.content.FileProvider;

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
 * AutoUpdateManager for SecurePro Admin
 * 
 * Handles update checks and triggers the Android installer.
 */
public class AutoUpdateManager {

    private static final String TAG = "AdminUpdateManager";
    private Context context;
    private String serverUrl;
    private ExecutorService executor;

    public AutoUpdateManager(Context context, String serverUrl) {
        this.context = context;
        this.serverUrl = serverUrl;
        this.executor = Executors.newSingleThreadExecutor();
    }

    public void checkForUpdates() {
        if (serverUrl == null)
            return;

        executor.execute(() -> {
            try {
                Log.d(TAG, "Checking for Admin updates...");
                String baseUrl = serverUrl.endsWith("/") ? serverUrl : serverUrl + "/";
                URL url = new URL(baseUrl + "version");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();

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
                    if (json.has("admin")) {
                        JSONObject appInfo = json.getJSONObject("admin");
                        int remoteVersionCode = appInfo.optInt("versionCode", 0);
                        String downloadPath = appInfo.optString("apk");

                        PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
                        int currentVersionCode = (int) (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                                ? pInfo.getLongVersionCode()
                                : pInfo.versionCode);

                        if (remoteVersionCode > currentVersionCode) {
                            Log.i(TAG, "New Admin version found: " + remoteVersionCode);
                            downloadAndInstall(baseUrl
                                    + (downloadPath.startsWith("/") ? downloadPath.substring(1) : downloadPath));
                        }
                    }
                }
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Admin update check failed: " + e.getMessage());
            }
        });
    }

    private void downloadAndInstall(String apkUrl) {
        executor.execute(() -> {
            try {
                Log.i(TAG, "Downloading Admin update: " + apkUrl);
                URL url = new URL(apkUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();

                File tempApk = new File(context.getExternalFilesDir(null), "update_admin.apk");
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

                installApk(tempApk);
            } catch (Exception e) {
                Log.e(TAG, "Admin download failed: " + e.getMessage());
            }
        });
    }

    private void installApk(File file) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            Uri data = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);

            intent.setDataAndType(data, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            context.startActivity(intent);
            Log.i(TAG, "Installer launched for Admin update");
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch Admin installer: " + e.getMessage());
        }
    }
}
