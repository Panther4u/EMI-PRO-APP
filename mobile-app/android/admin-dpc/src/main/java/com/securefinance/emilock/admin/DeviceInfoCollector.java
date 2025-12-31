package com.securefinance.emilock.admin;

import android.content.Context;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class DeviceInfoCollector {
    private static final String TAG = "ADMIN_COLLECTOR";

    public static void send(Context context) {
        new Thread(() -> {
            try {
                JSONObject data = new JSONObject();

                data.put("androidId",
                    Settings.Secure.getString(
                        context.getContentResolver(),
                        Settings.Secure.ANDROID_ID
                    )
                );

                data.put("brand", Build.BRAND);
                data.put("model", Build.MODEL);
                data.put("androidVersion", Build.VERSION.SDK_INT);
                data.put("status", "ADMIN_INSTALLED");

                // Use the production URL as requested
                URL url = new URL("https://emi-pro-app.onrender.com/api/devices/register");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);

                OutputStream os = conn.getOutputStream();
                os.write(data.toString().getBytes());
                os.close();

                Log.d(TAG, "Server response: " + conn.getResponseCode());
                
                // Also try local backend if in debug/dev environment (optional but helpful)
                // tryLocalBackend(data);

            } catch (Exception e) {
                Log.e(TAG, "Send failed", e);
            }
        }).start();
    }
}
