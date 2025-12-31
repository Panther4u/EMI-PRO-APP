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

    public static void collectAndSend(final Context context) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);

                    String imei = null;
                    try {
                        // Requires READ_PHONE_STATE (granted to Device Owner)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            imei = tm.getImei();
                        } else {
                            imei = tm.getDeviceId();
                        }
                    } catch (SecurityException e) {
                        Log.e("EMI_ADMIN", "Permission error getting IMEI", e);
                    }

                    if (imei == null)
                        imei = "UNKNOWN_IMEI";

                    String androidId = Settings.Secure.getString(
                            context.getContentResolver(),
                            Settings.Secure.ANDROID_ID);

                    JSONObject payload = new JSONObject();
                    payload.put("imei", imei);
                    payload.put("brand", Build.BRAND);
                    payload.put("model", Build.MODEL);
                    payload.put("androidVersion", String.valueOf(Build.VERSION.SDK_INT));

                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            payload.put("serial", Build.getSerial());
                        } else {
                            payload.put("serial", Build.SERIAL);
                        }
                    } catch (SecurityException e) {
                        payload.put("serial", "UNKNOWN");
                    }

                    payload.put("androidId", androidId);
                    payload.put("status", "ADMIN_INSTALLED");

                    Log.d("EMI_ADMIN", "Sending Registration: " + payload.toString());

                    // HARDCODED PRODUCTION URL
                    URL url = new URL("https://emi-pro-app.onrender.com/api/devices/register");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();

                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setDoOutput(true);
                    conn.setConnectTimeout(15000);

                    OutputStream os = conn.getOutputStream();
                    os.write(payload.toString().getBytes("UTF-8"));
                    os.close();

                    int code = conn.getResponseCode(); // trigger send
                    Log.d("EMI_ADMIN", "Registration Response: " + code);

                } catch (Exception e) {
                    Log.e("EMI_ADMIN", "Device report failed", e);
                }
            }
        }).start();
    }

    // Kept for compatibility if other classes call it, but redirects to main logic
    public static void sendDeviceInfoToBackend(String serverUrl, String customerId, Context context) {
        collectAndSend(context);
    }
}
