package com.securefinance.emilock;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;
import android.util.Log;

import java.util.List;

/**
 * SimChangeReceiver - Detects SIM card changes and triggers instant lock
 * 
 * This receiver:
 * - Monitors SIM_STATE_CHANGED broadcasts
 * - Compares current SIM ICCID with stored original
 * - Instantly locks device if SIM changed
 * - Reports SIM change to backend
 */
public class SimChangeReceiver extends BroadcastReceiver {

    private static final String TAG = "EMI_SimChange";
    private static final String PREFS_NAME = "PhoneLockPrefs";
    private static final String KEY_ORIGINAL_ICCID = "ORIGINAL_SIM_ICCID";
    private static final String KEY_ORIGINAL_OPERATOR = "ORIGINAL_SIM_OPERATOR";
    private static final String KEY_SIM_LOCK_ENABLED = "SIM_LOCK_ENABLED";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if ("android.intent.action.SIM_STATE_CHANGED".equals(action) ||
                TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(action)) {

            Log.i(TAG, "📱 SIM state changed detected");

            // Get current SIM details
            SimInfo currentSim = getCurrentSimInfo(context);

            if (currentSim == null || currentSim.iccid == null) {
                Log.w(TAG, "Cannot read SIM - no SIM or no permission");
                return;
            }

            // Get stored original SIM
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String originalIccid = prefs.getString(KEY_ORIGINAL_ICCID, null);
            boolean simLockEnabled = prefs.getBoolean(KEY_SIM_LOCK_ENABLED, true);

            // First time - store original SIM
            if (originalIccid == null) {
                Log.i(TAG, "📱 Storing original SIM: " + maskIccid(currentSim.iccid));
                prefs.edit()
                        .putString(KEY_ORIGINAL_ICCID, currentSim.iccid)
                        .putString(KEY_ORIGINAL_OPERATOR, currentSim.operator)
                        .apply();
                return;
            }

            // Compare SIM
            if (!simLockEnabled) {
                Log.i(TAG, "SIM lock disabled by admin");
                return;
            }

            if (!currentSim.iccid.equals(originalIccid)) {
                Log.w(TAG, "🚨 SIM CHANGE DETECTED!");
                Log.w(TAG, "   Original: " + maskIccid(originalIccid));
                Log.w(TAG, "   Current:  " + maskIccid(currentSim.iccid));

                // INSTANT LOCK!
                handleSimChange(context, originalIccid, currentSim);
            } else {
                Log.i(TAG, "✅ SIM verified - matches original");
            }
        }
    }

    /**
     * Handle SIM change - lock device and report
     */
    private void handleSimChange(Context context, String originalIccid, SimInfo newSim) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // 1. Mark device as locked due to SIM change
        prefs.edit()
                .putBoolean("DEVICE_LOCKED", true)
                .putString("LOCK_REASON", "SIM_CHANGE")
                .putString("NEW_SIM_ICCID", newSim.iccid)
                .putString("NEW_SIM_OPERATOR", newSim.operator)
                .putLong("SIM_CHANGE_TIME", System.currentTimeMillis())
                .apply();

        // 2. Lock device immediately
        FullDeviceLockManager lockManager = new FullDeviceLockManager(context);
        lockManager.lockDeviceImmediately();

        // 3. Start alarm (optional - configurable)
        boolean alarmOnSimChange = prefs.getBoolean("ALARM_ON_SIM_CHANGE", false);
        if (alarmOnSimChange) {
            lockManager.startPowerButtonAlarm();
        }

        // 4. Report to backend
        reportSimChange(context, originalIccid, newSim);

        // 5. Launch lock screen
        lockManager.launchLockScreen();

        Log.i(TAG, "🔒 Device locked due to SIM change");
    }

    /**
     * Report SIM change to backend
     */
    private void reportSimChange(Context context, String originalIccid, SimInfo newSim) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String serverUrl = prefs.getString("SERVER_URL", "https://emi-pro-app.onrender.com");
        String customerId = prefs.getString("CUSTOMER_ID", null);

        if (customerId == null) {
            Log.w(TAG, "No customer ID - cannot report SIM change");
            return;
        }

        // Send report in background
        new Thread(() -> {
            try {
                String reportUrl = serverUrl + "/api/customers/" + customerId + "/sim-change";

                String jsonBody = String.format(
                        "{\"originalIccid\":\"%s\",\"newIccid\":\"%s\",\"newOperator\":\"%s\",\"timestamp\":%d}",
                        originalIccid,
                        newSim.iccid,
                        newSim.operator != null ? newSim.operator : "",
                        System.currentTimeMillis());

                java.net.URL url = new java.net.URL(reportUrl);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.getOutputStream().write(jsonBody.getBytes());

                int responseCode = conn.getResponseCode();
                Log.i(TAG, "SIM change reported to backend: " + responseCode);

                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Failed to report SIM change", e);

                // Queue for retry
                prefs.edit()
                        .putBoolean("PENDING_SIM_REPORT", true)
                        .apply();
            }
        }).start();
    }

    /**
     * Get current SIM information
     */
    private SimInfo getCurrentSimInfo(Context context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                SubscriptionManager subManager = (SubscriptionManager) context
                        .getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);

                if (subManager == null)
                    return null;

                // Check permission
                if (androidx.core.app.ActivityCompat.checkSelfPermission(context,
                        android.Manifest.permission.READ_PHONE_STATE) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    Log.w(TAG, "No READ_PHONE_STATE permission");
                    return null;
                }

                List<SubscriptionInfo> subs = subManager.getActiveSubscriptionInfoList();
                if (subs != null && !subs.isEmpty()) {
                    SubscriptionInfo info = subs.get(0);
                    SimInfo simInfo = new SimInfo();
                    simInfo.iccid = info.getIccId();
                    simInfo.operator = info.getCarrierName() != null ? info.getCarrierName().toString() : null;
                    simInfo.subscriptionId = info.getSubscriptionId();

                    // Try to get phone number
                    try {
                        simInfo.phoneNumber = info.getNumber();
                    } catch (Exception e) {
                        // Ignore
                    }

                    return simInfo;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting SIM info", e);
        }
        return null;
    }

    /**
     * Mask ICCID for logging (privacy)
     */
    private String maskIccid(String iccid) {
        if (iccid == null || iccid.length() < 8)
            return "****";
        return iccid.substring(0, 4) + "****" + iccid.substring(iccid.length() - 4);
    }

    /**
     * Store original SIM on first provisioning
     */
    public static void storeOriginalSim(Context context) {
        SimChangeReceiver receiver = new SimChangeReceiver();
        SimInfo simInfo = receiver.getCurrentSimInfo(context);

        if (simInfo != null && simInfo.iccid != null) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                    .putString(KEY_ORIGINAL_ICCID, simInfo.iccid)
                    .putString(KEY_ORIGINAL_OPERATOR, simInfo.operator)
                    .putBoolean(KEY_SIM_LOCK_ENABLED, true)
                    .apply();
            Log.i(TAG, "📱 Original SIM stored: " + receiver.maskIccid(simInfo.iccid));
        }
    }

    /**
     * Check if current SIM matches original
     */
    public static boolean isOriginalSim(Context context) {
        SimChangeReceiver receiver = new SimChangeReceiver();
        SimInfo currentSim = receiver.getCurrentSimInfo(context);

        if (currentSim == null || currentSim.iccid == null)
            return true; // No SIM = allow

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String originalIccid = prefs.getString(KEY_ORIGINAL_ICCID, null);

        if (originalIccid == null)
            return true; // No original = allow

        return currentSim.iccid.equals(originalIccid);
    }

    /**
     * Simple class to hold SIM info
     */
    private static class SimInfo {
        String iccid;
        String operator;
        String phoneNumber;
        int subscriptionId;
    }
}
