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

/**
 * CRITICAL: Device Info Collection for Admin DPC
 * This class collects REAL device information and sends it to backend
 * This is the ONLY source of truth for device details
 */
public class DeviceInfoCollector {
    private static final String TAG = "DeviceInfoCollector";

    /**
     * Collect all device information
     * 
     * @param context Application context
     * @return JSONObject with device details
     */
    public static JSONObject collectDeviceInfo(Context context) {
        JSONObject deviceInfo = new JSONObject();

        try {
            // Basic Device Info
            deviceInfo.put("brand", Build.BRAND);
            deviceInfo.put("model", Build.MODEL);
            deviceInfo.put("manufacturer", Build.MANUFACTURER);
            deviceInfo.put("androidVersion", Build.VERSION.RELEASE);
            deviceInfo.put("sdkInt", Build.VERSION.SDK_INT);

            // Android ID (Always Available)
            String androidId = Settings.Secure.getString(
                    context.getContentResolver(),
                    Settings.Secure.ANDROID_ID);
            deviceInfo.put("androidId", androidId);

            // Serial Number (if available)
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    deviceInfo.put("serial", Build.getSerial());
                } else {
                    deviceInfo.put("serial", Build.SERIAL);
                }
            } catch (SecurityException e) {
                Log.w(TAG, "Serial not accessible: " + e.getMessage());
                deviceInfo.put("serial", "UNAVAILABLE");
            }

            // IMEI / MEID (Device Owner has permission)
            try {
                TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
                if (tm != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        // Android 8.0+
                        String imei = tm.getImei(); // Slot 0
                        deviceInfo.put("imei", imei != null ? imei : "UNAVAILABLE");

                        // Try to get IMEI for second SIM slot
                        try {
                            String imei2 = tm.getImei(1);
                            deviceInfo.put("imei2", imei2 != null ? imei2 : "");
                        } catch (Exception e) {
                            deviceInfo.put("imei2", "");
                        }

                        // MEID for CDMA devices
                        String meid = tm.getMeid();
                        deviceInfo.put("meid", meid != null ? meid : "");
                    } else {
                        // Android 7.x and below
                        String deviceId = tm.getDeviceId();
                        deviceInfo.put("imei", deviceId != null ? deviceId : "UNAVAILABLE");
                    }
                }
            } catch (SecurityException e) {
                Log.e(TAG, "IMEI not accessible: " + e.getMessage());
                deviceInfo.put("imei", "PERMISSION_DENIED");
            }

            // Timestamp
            deviceInfo.put("enrolledAt", System.currentTimeMillis());
            deviceInfo.put("status", "ENROLLED");

            Log.d(TAG, "Device info collected: " + deviceInfo.toString());

        } catch (Exception e) {
            Log.e(TAG, "Error collecting device info", e);
        }

        return deviceInfo;
    }

    /**
     * Send device info to backend server (Auto-Claim Mode)
     * 
     * @param context Application context
     */
    public static void sendDeviceInfoToBackend(final Context context) {
        // Run in background thread
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    // Collect device info
                    JSONObject deviceInfo = collectDeviceInfo(context);

                    // Use Production URL
                    String serverUrl = "https://emi-pro-app.onrender.com";
                    String apiUrl = serverUrl + "/api/devices/register";

                    Log.d(TAG, "Sending device registration to: " + apiUrl);
                    Log.d(TAG, "Payload: " + deviceInfo.toString());

                    // Create HTTP connection
                    URL url = new URL(apiUrl);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setDoOutput(true);
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(15000);

                    // Send JSON payload
                    OutputStream os = conn.getOutputStream();
                    os.write(deviceInfo.toString().getBytes("UTF-8"));
                    os.flush();
                    os.close();

                    // Get response
                    int responseCode = conn.getResponseCode();
                    Log.d(TAG, "Backend response code: " + responseCode);

                    if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
                        Log.i(TAG, "✅ Device successfully registered/claimed!");

                        // Save provisioned state
                        SharedPreferences prefs = context.getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
                        prefs.edit().putBoolean("IS_PROVISIONED", true).apply();

                    } else {
                        Log.e(TAG, "❌ Backend registration failed: " + responseCode);
                    }

                    conn.disconnect();

                } catch (Exception e) {
                    Log.e(TAG, "❌ CRITICAL: Failed to register device", e);
                }
            }
        }).start();
    }

    // Legacy method - can be removed or kept for compatibility
    public static void sendDeviceInfoToBackend(final String serverUrl, final String customerId, final Context context) {
        sendDeviceInfoToBackend(context);
    }
}
