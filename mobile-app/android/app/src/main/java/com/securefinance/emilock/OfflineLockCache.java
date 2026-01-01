package com.securefinance.emilock;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * OfflineLockCache - Manages lock commands when device is offline
 * 
 * Features:
 * - Queue lock commands when offline
 * - Process commands when connectivity restored
 * - Support for SMS-based lock commands
 * - Persistent storage across reboots
 */
public class OfflineLockCache {

    private static final String TAG = "EMI_OfflineLock";
    private static final String PREFS_NAME = "OfflineLockCache";
    private static final String KEY_COMMAND_QUEUE = "COMMAND_QUEUE";
    private static final String KEY_OFFLINE_TOKEN = "OFFLINE_LOCK_TOKEN";
    private static final String KEY_OFFLINE_UNLOCK_TOKEN = "OFFLINE_UNLOCK_TOKEN";
    private static final String KEY_LAST_SYNC = "LAST_SYNC_TIME";
    private static final String KEY_PENDING_REPORTS = "PENDING_REPORTS";

    private Context context;
    private SharedPreferences prefs;

    public OfflineLockCache(Context context) {
        this.context = context;
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    /**
     * Queue a command for offline processing
     */
    public void queueCommand(String command, String params, String source) {
        try {
            JSONArray queue = getCommandQueue();

            JSONObject cmd = new JSONObject();
            cmd.put("command", command);
            cmd.put("params", params);
            cmd.put("source", source); // "sms", "backend", "local"
            cmd.put("timestamp", System.currentTimeMillis());
            cmd.put("processed", false);

            queue.put(cmd);

            prefs.edit()
                    .putString(KEY_COMMAND_QUEUE, queue.toString())
                    .apply();

            Log.i(TAG, "Command queued: " + command + " from " + source);

        } catch (Exception e) {
            Log.e(TAG, "Failed to queue command", e);
        }
    }

    /**
     * Process all pending commands
     */
    public void processQueue(FullDeviceLockManager lockManager) {
        try {
            JSONArray queue = getCommandQueue();
            boolean hasProcessed = false;

            for (int i = 0; i < queue.length(); i++) {
                JSONObject cmd = queue.getJSONObject(i);

                if (!cmd.optBoolean("processed", false)) {
                    String command = cmd.getString("command");

                    Log.i(TAG, "Processing queued command: " + command);

                    switch (command) {
                        case "lock":
                            lockManager.lockDeviceImmediately();
                            break;
                        case "unlock":
                            lockManager.unlockDevice();
                            break;
                        case "alarm":
                            lockManager.startPowerButtonAlarm();
                            break;
                        case "stopAlarm":
                            lockManager.stopPowerButtonAlarm();
                            break;
                    }

                    cmd.put("processed", true);
                    cmd.put("processedAt", System.currentTimeMillis());
                    hasProcessed = true;
                }
            }

            if (hasProcessed) {
                prefs.edit()
                        .putString(KEY_COMMAND_QUEUE, queue.toString())
                        .apply();
            }

            // Clean up old processed commands (older than 24 hours)
            cleanupOldCommands();

        } catch (Exception e) {
            Log.e(TAG, "Failed to process queue", e);
        }
    }

    /**
     * Validate SMS lock token
     */
    public boolean validateLockToken(String token) {
        String storedToken = prefs.getString(KEY_OFFLINE_TOKEN, null);
        if (storedToken == null) {
            Log.w(TAG, "No offline lock token configured");
            return false;
        }
        return storedToken.equals(token);
    }

    /**
     * Validate SMS unlock token
     */
    public boolean validateUnlockToken(String token) {
        String storedToken = prefs.getString(KEY_OFFLINE_UNLOCK_TOKEN, null);
        if (storedToken == null) {
            Log.w(TAG, "No offline unlock token configured");
            return false;
        }
        return storedToken.equals(token);
    }

    /**
     * Set offline lock token (from backend)
     */
    public void setLockToken(String token) {
        prefs.edit().putString(KEY_OFFLINE_TOKEN, token).apply();
        Log.i(TAG, "Offline lock token set");
    }

    /**
     * Set offline unlock token (from backend)
     */
    public void setUnlockToken(String token) {
        prefs.edit().putString(KEY_OFFLINE_UNLOCK_TOKEN, token).apply();
        Log.i(TAG, "Offline unlock token set");
    }

    /**
     * Parse and execute SMS command
     * Format: LOCK:TOKEN or UNLOCK:TOKEN or ALARM:TOKEN
     */
    public boolean executeSmsCommand(String smsBody, FullDeviceLockManager lockManager) {
        try {
            String[] parts = smsBody.trim().toUpperCase().split(":");
            if (parts.length != 2) {
                Log.w(TAG, "Invalid SMS command format");
                return false;
            }

            String command = parts[0];
            String token = parts[1];

            switch (command) {
                case "LOCK":
                case "EMI_LOCK":
                    if (validateLockToken(token)) {
                        Log.i(TAG, "🔒 SMS LOCK command validated");
                        queueCommand("lock", null, "sms");
                        lockManager.lockDeviceImmediately();
                        return true;
                    }
                    break;

                case "UNLOCK":
                case "EMI_UNLOCK":
                    if (validateUnlockToken(token)) {
                        Log.i(TAG, "🔓 SMS UNLOCK command validated");
                        queueCommand("unlock", null, "sms");
                        lockManager.unlockDevice();
                        return true;
                    }
                    break;

                case "ALARM":
                case "EMI_ALARM":
                    if (validateLockToken(token)) {
                        Log.i(TAG, "🚨 SMS ALARM command validated");
                        lockManager.startPowerButtonAlarm();
                        return true;
                    }
                    break;

                case "WIPE":
                case "EMI_WIPE":
                    if (validateLockToken(token) && validateUnlockToken(token)) {
                        // Extra security: require both tokens for wipe
                        Log.w(TAG, "⚠️ SMS WIPE command - NOT IMPLEMENTED via SMS");
                        // Do NOT allow wipe via SMS for safety
                        return false;
                    }
                    break;
            }

            Log.w(TAG, "SMS command failed validation: " + command);
            return false;

        } catch (Exception e) {
            Log.e(TAG, "Failed to parse SMS command", e);
            return false;
        }
    }

    /**
     * Add a pending report for when connectivity is restored
     */
    public void addPendingReport(String type, JSONObject data) {
        try {
            JSONArray reports = getPendingReports();

            JSONObject report = new JSONObject();
            report.put("type", type);
            report.put("data", data);
            report.put("timestamp", System.currentTimeMillis());

            reports.put(report);

            prefs.edit()
                    .putString(KEY_PENDING_REPORTS, reports.toString())
                    .apply();

            Log.i(TAG, "Pending report added: " + type);

        } catch (Exception e) {
            Log.e(TAG, "Failed to add pending report", e);
        }
    }

    /**
     * Get all pending reports for sync
     */
    public List<JSONObject> getPendingReportsForSync() {
        List<JSONObject> reports = new ArrayList<>();
        try {
            JSONArray arr = getPendingReports();
            for (int i = 0; i < arr.length(); i++) {
                reports.add(arr.getJSONObject(i));
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to get pending reports", e);
        }
        return reports;
    }

    /**
     * Clear pending reports after successful sync
     */
    public void clearPendingReports() {
        prefs.edit().putString(KEY_PENDING_REPORTS, "[]").apply();
        Log.i(TAG, "Pending reports cleared");
    }

    /**
     * Mark last successful sync time
     */
    public void markSynced() {
        prefs.edit()
                .putLong(KEY_LAST_SYNC, System.currentTimeMillis())
                .apply();
    }

    /**
     * Get time since last sync in minutes
     */
    public long getMinutesSinceLastSync() {
        long lastSync = prefs.getLong(KEY_LAST_SYNC, 0);
        if (lastSync == 0)
            return Long.MAX_VALUE;
        return (System.currentTimeMillis() - lastSync) / 60000;
    }

    /**
     * Check if device has been offline too long (configurable threshold)
     */
    public boolean isOfflineTooLong(int thresholdMinutes) {
        return getMinutesSinceLastSync() > thresholdMinutes;
    }

    // Private helpers

    private JSONArray getCommandQueue() {
        try {
            String json = prefs.getString(KEY_COMMAND_QUEUE, "[]");
            return new JSONArray(json);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private JSONArray getPendingReports() {
        try {
            String json = prefs.getString(KEY_PENDING_REPORTS, "[]");
            return new JSONArray(json);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private void cleanupOldCommands() {
        try {
            JSONArray queue = getCommandQueue();
            JSONArray newQueue = new JSONArray();

            long cutoff = System.currentTimeMillis() - (24 * 60 * 60 * 1000); // 24 hours

            for (int i = 0; i < queue.length(); i++) {
                JSONObject cmd = queue.getJSONObject(i);
                if (cmd.optLong("timestamp", 0) > cutoff) {
                    newQueue.put(cmd);
                }
            }

            prefs.edit()
                    .putString(KEY_COMMAND_QUEUE, newQueue.toString())
                    .apply();

        } catch (Exception e) {
            Log.e(TAG, "Failed to cleanup old commands", e);
        }
    }
}
