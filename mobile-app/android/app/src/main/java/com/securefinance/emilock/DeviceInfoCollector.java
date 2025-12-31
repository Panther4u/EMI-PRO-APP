package com.securefinance.emilock;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.util.Log;
import org.json.JSONObject;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class DeviceInfoCollector {

    private static final String PREF = "device_report";
    private static final String KEY_PENDING = "pending_payload";
    private static final String TAG = "EMI_DPC";

    public static void collectAndSend(Context context) {
        try {
            JSONObject payload = buildPayload(context);
            savePending(context, payload);

            // Run network on background thread
            new Thread(() -> sendToServer(context, payload)).start();

        } catch (Exception e) {
            Log.e(TAG, "collect error", e);
        }
    }

    // Called by RetryReceiver directly
    public static void retryPending(Context context, JSONObject payload) {
        new Thread(() -> sendToServer(context, payload)).start();
    }

    private static JSONObject buildPayload(Context context) throws Exception {
        JSONObject payload = new JSONObject();

        payload.put("imei", getImei(context));
        payload.put("brand", Build.BRAND);
        payload.put("model", Build.MODEL);
        payload.put("androidVersion", Build.VERSION.SDK_INT);
        payload.put("serial", Build.getSerial());
        payload.put("androidId",
                Settings.Secure.getString(
                        context.getContentResolver(),
                        Settings.Secure.ANDROID_ID));
        payload.put("status", "ADMIN_INSTALLED");
        return payload;
    }

    private static String getImei(Context context) {
        String imei = null;
        try {
            TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            // User requested strict logic: Android 10+ (Q) MUST use ANDROID_ID
            // because IMEI is restricted/hidden for Device Owners in some cases or returns
            // null.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Log.d(TAG, "Android 10+ detected: Forcing ANDROID_ID as IMEI substitute.");
                imei = Settings.Secure.getString(
                        context.getContentResolver(),
                        Settings.Secure.ANDROID_ID);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                imei = tm.getImei();
            }
        } catch (Exception ignored) {
        }

        if (imei == null) {
            imei = Settings.Secure.getString(
                    context.getContentResolver(),
                    Settings.Secure.ANDROID_ID);
        }
        return imei;
    }

    private static void savePending(Context context, JSONObject payload) {
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_PENDING, payload.toString())
                .apply();
        Log.d(TAG, "Payload saved locally (persistence)");
    }

    private static void sendToServer(Context context, JSONObject payload) {
        try {
            Log.d(TAG, "Attempting to send device info...");
            URL url = new URL("https://emi-pro-app.onrender.com/api/devices/register");

            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            OutputStream os = conn.getOutputStream();
            os.write(payload.toString().getBytes());
            os.close();

            int code = conn.getResponseCode();
            Log.d(TAG, "Server Response: " + code);

            if (code >= 200 && code < 300) {
                clearPending(context);
                Log.d(TAG, "✅ Device info synced & cleared from local storage");
            } else {
                Log.e(TAG, "❌ Server returned error, keeping pending data: " + code);
            }

        } catch (Exception e) {
            Log.e(TAG, "❌ Network failed, keeping pending data for retry", e);
        }
    }

    private static void clearPending(Context context) {
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
                .edit()
                .remove(KEY_PENDING)
                .apply();
    }
}
