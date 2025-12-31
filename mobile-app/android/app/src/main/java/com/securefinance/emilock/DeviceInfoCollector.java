package com.securefinance.emilock;

import android.content.Context;
import android.os.Build;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.util.Log;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class DeviceInfoCollector {

    public static void collectAndSend(Context context) {
        try {
            TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);

            String imei = tm.getImei();
            String androidId = Settings.Secure.getString(
                    context.getContentResolver(),
                    Settings.Secure.ANDROID_ID);

            JSONObject payload = new JSONObject();
            payload.put("imei", imei);
            payload.put("brand", Build.BRAND);
            payload.put("model", Build.MODEL);
            payload.put("androidVersion", Build.VERSION.SDK_INT);
            payload.put("serial", Build.getSerial());
            payload.put("androidId", androidId);
            payload.put("status", "ADMIN_INSTALLED");

            URL url = new URL(
                    "https://emi-pro-app.onrender.com/api/devices/register");

            HttpURLConnection conn = (HttpURLConnection) url.openConnection();

            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            OutputStream os = conn.getOutputStream();
            os.write(payload.toString().getBytes());
            os.close();

            conn.getResponseCode();

            Log.d("EMI_ADMIN", "Device info sent successfully");

        } catch (Exception e) {
            Log.e("EMI_ADMIN", "Failed to send device info", e);
        }
    }
}
