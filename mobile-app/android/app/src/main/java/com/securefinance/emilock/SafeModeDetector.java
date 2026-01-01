package com.securefinance.emilock;

import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

/**
 * SafeModeDetector - Detects and handles Safe Mode boot attempts
 * 
 * Features:
 * - Detects if device booted in Safe Mode
 * - Instantly locks device in Safe Mode
 * - Reports Safe Mode attempt to backend
 * - Prevents bypass of EMI Lock via Safe Mode
 */
public class SafeModeDetector extends BroadcastReceiver {

    private static final String TAG = "EMI_SafeMode";
    private static final String PREFS_NAME = "PhoneLockPrefs";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
                "android.intent.action.QUICKBOOT_POWERON".equals(action)) {

            Log.i(TAG, "🔍 Checking Safe Mode status on boot");

            if (isInSafeMode(context)) {
                handleSafeModeDetected(context);
            } else {
                Log.i(TAG, "✅ Normal boot - not in Safe Mode");
            }
        }
    }

    /**
     * Check if device is in Safe Mode
     */
    public static boolean isInSafeMode(Context context) {
        try {
            // Method 1: Check ActivityManager
            ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
            if (am != null) {
                ActivityManager.RunningAppProcessInfo info = new ActivityManager.RunningAppProcessInfo();
                ActivityManager.getMyMemoryState(info);
                // Safe mode doesn't directly report, but we can check other indicators
            }

            // Method 2: Check system property
            String safeMode = System.getProperty("ro.sys.safemode", "0");
            if ("1".equals(safeMode)) {
                Log.w(TAG, "SAFE MODE DETECTED via system property");
                return true;
            }

            // Method 3: Check via package manager flags
            // In safe mode, third-party apps should not be running normally
            // But as Device Owner, we still run

            // Method 4: Check internal Android API (reflection)
            try {
                @SuppressWarnings("JavaReflectionMemberAccess")
                java.lang.reflect.Method isSafeModeEnabled = ActivityManager.class.getMethod("isSystemSecure");
                // This doesn't directly tell safe mode but indicates security status
            } catch (NoSuchMethodException e) {
                // Method not available
            }

            // Method 5: Alternative - check if system reports safe boot
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                try {
                    java.lang.reflect.Method m = Class.forName("android.os.SystemProperties")
                            .getMethod("getBoolean", String.class, boolean.class);
                    boolean safeModeBool = (Boolean) m.invoke(null, "persist.sys.safemode", false);
                    if (safeModeBool) {
                        Log.w(TAG, "SAFE MODE DETECTED via SystemProperties");
                        return true;
                    }
                } catch (Exception e) {
                    // Reflection failed
                }
            }

            // Method 6: Check Global Settings
            try {
                int safeModeInt = android.provider.Settings.Global.getInt(
                        context.getContentResolver(), "safe_boot", 0);
                if (safeModeInt == 1) {
                    Log.w(TAG, "SAFE MODE DETECTED via Settings.Global");
                    return true;
                }
            } catch (Exception e) {
                // Setting not found
            }

        } catch (Exception e) {
            Log.e(TAG, "Error checking safe mode", e);
        }

        return false;
    }

    /**
     * Handle Safe Mode detection
     */
    private void handleSafeModeDetected(Context context) {
        Log.w(TAG, "🚨 SAFE MODE DETECTED - LOCKING DEVICE!");

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // 1. Mark this as a security event
        prefs.edit()
                .putBoolean("SAFE_MODE_DETECTED", true)
                .putLong("SAFE_MODE_TIME", System.currentTimeMillis())
                .putBoolean("DEVICE_LOCKED", true)
                .putString("LOCK_REASON", "SAFE_MODE")
                .apply();

        // 2. Lock device immediately
        FullDeviceLockManager lockManager = new FullDeviceLockManager(context);
        lockManager.lockDeviceImmediately();

        // 3. Start alarm (Safe Mode is a serious bypass attempt)
        lockManager.startPowerButtonAlarm();

        // 4. Launch lock screen (as Device Owner, we still run in Safe Mode)
        launchLockScreen(context);

        // 5. Report to backend
        reportSafeModeAttempt(context);

        Log.i(TAG, "🔒 Device locked due to Safe Mode attempt");
    }

    /**
     * Launch lock screen activity
     */
    private void launchLockScreen(Context context) {
        try {
            Intent intent = context.getPackageManager()
                    .getLaunchIntentForPackage(context.getPackageName());
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TOP);
                intent.putExtra("FORCE_LOCK", true);
                intent.putExtra("SAFE_MODE", true);
                context.startActivity(intent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch lock screen", e);
        }
    }

    /**
     * Report Safe Mode attempt to backend
     */
    private void reportSafeModeAttempt(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String serverUrl = prefs.getString("SERVER_URL", "https://emi-pro-app.onrender.com");
        String customerId = prefs.getString("CUSTOMER_ID", null);

        if (customerId == null) {
            Log.w(TAG, "No customer ID - cannot report");
            return;
        }

        new Thread(() -> {
            try {
                String reportUrl = serverUrl + "/api/customers/" + customerId + "/security-event";

                String jsonBody = String.format(
                        "{\"event\":\"SAFE_MODE_ATTEMPT\",\"timestamp\":%d,\"action\":\"LOCKED\"}",
                        System.currentTimeMillis());

                java.net.URL url = new java.net.URL(reportUrl);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.getOutputStream().write(jsonBody.getBytes());

                int responseCode = conn.getResponseCode();
                Log.i(TAG, "Safe Mode attempt reported: " + responseCode);

                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Failed to report Safe Mode attempt", e);

                // Queue for retry
                OfflineLockCache cache = new OfflineLockCache(context);
                try {
                    org.json.JSONObject data = new org.json.JSONObject();
                    data.put("event", "SAFE_MODE_ATTEMPT");
                    data.put("timestamp", System.currentTimeMillis());
                    cache.addPendingReport("security_event", data);
                } catch (Exception ex) {
                    // Ignore
                }
            }
        }).start();
    }

    /**
     * Apply Safe Mode restrictions using Device Policy Manager
     * Call this during provisioning
     */
    public static void hardenAgainstSafeMode(Context context) {
        FullDeviceLockManager lockManager = new FullDeviceLockManager(context);

        if (!lockManager.isDeviceOwner()) {
            Log.w(TAG, "Cannot harden - not device owner");
            return;
        }

        try {
            android.app.admin.DevicePolicyManager dpm = (android.app.admin.DevicePolicyManager) context
                    .getSystemService(Context.DEVICE_POLICY_SERVICE);
            android.content.ComponentName adminComponent = new android.content.ComponentName(context,
                    DeviceAdminReceiver.class);

            // Block Safe Boot
            dpm.addUserRestriction(adminComponent, android.os.UserManager.DISALLOW_SAFE_BOOT);

            Log.i(TAG, "✅ Safe Mode restriction applied");

        } catch (Exception e) {
            Log.e(TAG, "Failed to apply Safe Mode restriction", e);
        }
    }

    /**
     * Check on every app launch if we're in Safe Mode
     */
    public static void checkOnLaunch(Context context) {
        if (isInSafeMode(context)) {
            Log.w(TAG, "🚨 App launched in Safe Mode!");

            // Lock immediately
            FullDeviceLockManager lockManager = new FullDeviceLockManager(context);
            lockManager.lockDeviceImmediately();
            lockManager.startPowerButtonAlarm();
        }
    }
}
