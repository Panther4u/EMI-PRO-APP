package com.securefinance.emilock;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

/**
 * SmsLockReceiver - Handles SMS-based lock commands for offline scenarios
 * 
 * Supported SMS formats:
 * - LOCK:TOKEN123 → Lock device with token validation
 * - UNLOCK:TOKEN123 → Unlock device with token validation
 * - ALARM:TOKEN123 → Start alarm with token validation
 * - EMI_LOCK:TOKEN123 → Alternative format
 * 
 * Security:
 * - All commands require valid token from backend
 * - WIPE command is disabled via SMS for safety
 * - Commands are logged and queued for sync
 */
public class SmsLockReceiver extends BroadcastReceiver {

    private static final String TAG = "EMI_SmsLock";

    // Whitelisted sender numbers (optional - can be configured)
    private static final String[] TRUSTED_SENDERS = {
            // Add trusted numbers here if you want sender validation
            // "+911234567890"
    };

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction() == null ||
                !intent.getAction().equals("android.provider.Telephony.SMS_RECEIVED")) {
            return;
        }

        Bundle bundle = intent.getExtras();
        if (bundle == null)
            return;

        Object[] pdus = (Object[]) bundle.get("pdus");
        if (pdus == null)
            return;

        for (Object pdu : pdus) {
            try {
                SmsMessage smsMessage;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    String format = bundle.getString("format");
                    smsMessage = SmsMessage.createFromPdu((byte[]) pdu, format);
                } else {
                    smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                }

                String sender = smsMessage.getDisplayOriginatingAddress();
                String messageBody = smsMessage.getMessageBody();

                Log.d(TAG, "📩 SMS received from: " + sender);

                // Process the message
                processMessage(context, sender, messageBody);

            } catch (Exception e) {
                Log.e(TAG, "Error processing SMS", e);
            }
        }
    }

    private void processMessage(Context context, String sender, String messageBody) {
        if (messageBody == null || messageBody.trim().isEmpty())
            return;

        String message = messageBody.trim().toUpperCase();

        // Check if this looks like a lock command
        if (!isLockCommand(message)) {
            return; // Not a lock command, ignore
        }

        Log.i(TAG, "🔒 Processing potential lock command: " + message);

        // Optional: Validate sender (if TRUSTED_SENDERS is configured)
        if (TRUSTED_SENDERS.length > 0 && !isTrustedSender(sender)) {
            Log.w(TAG, "Sender not in trusted list: " + sender);
            // Still allow if token is valid
        }

        // Initialize lock manager and offline cache
        FullDeviceLockManager lockManager = new FullDeviceLockManager(context);
        OfflineLockCache offlineCache = new OfflineLockCache(context);

        // Try to execute the command
        boolean success = processCommand(context, message, lockManager, offlineCache);

        if (success) {
            Log.i(TAG, "✅ SMS command executed successfully");

            // Log this event
            logSmsCommand(context, sender, message, true);
        } else {
            Log.w(TAG, "❌ SMS command failed validation");
            logSmsCommand(context, sender, message, false);
        }
    }

    private boolean processCommand(Context context, String message,
            FullDeviceLockManager lockManager,
            OfflineLockCache offlineCache) {

        // Try new format first: COMMAND:TOKEN
        if (message.contains(":")) {
            return offlineCache.executeSmsCommand(message, lockManager);
        }

        // Legacy format: LOCK TOKEN (space separated)
        if (message.startsWith("LOCK ")) {
            String token = message.substring(5).trim();
            if (offlineCache.validateLockToken(token)) {
                lockManager.lockDeviceImmediately();
                offlineCache.queueCommand("lock", null, "sms");
                return true;
            }
        }

        if (message.startsWith("UNLOCK ")) {
            String token = message.substring(7).trim();
            if (offlineCache.validateUnlockToken(token)) {
                lockManager.unlockDevice();
                offlineCache.queueCommand("unlock", null, "sms");
                return true;
            }
        }

        if (message.startsWith("ALARM ")) {
            String token = message.substring(6).trim();
            if (offlineCache.validateLockToken(token)) {
                lockManager.startPowerButtonAlarm();
                return true;
            }
        }

        // Also check against legacy prefs token
        return processLegacyCommand(context, message, lockManager);
    }

    private boolean processLegacyCommand(Context context, String message,
            FullDeviceLockManager lockManager) {
        SharedPreferences prefs = context.getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
        String offlineToken = prefs.getString("OFFLINE_LOCK_TOKEN", null);

        if (offlineToken == null)
            return false;

        String lockCommand = "LOCK " + offlineToken.toUpperCase();

        if (message.equalsIgnoreCase(lockCommand)) {
            Log.i(TAG, "Legacy LOCK command matched");
            lockManager.lockDeviceImmediately();

            // Start lock service
            startLockService(context);
            return true;
        }

        return false;
    }

    private boolean isLockCommand(String message) {
        return message.startsWith("LOCK") ||
                message.startsWith("UNLOCK") ||
                message.startsWith("ALARM") ||
                message.startsWith("EMI_LOCK") ||
                message.startsWith("EMI_UNLOCK") ||
                message.startsWith("EMI_ALARM");
    }

    private boolean isTrustedSender(String sender) {
        if (sender == null)
            return false;

        // Normalize phone number (remove spaces, dashes)
        String normalized = sender.replaceAll("[\\s\\-()]", "");

        for (String trusted : TRUSTED_SENDERS) {
            if (normalized.endsWith(trusted) || trusted.endsWith(normalized)) {
                return true;
            }
        }
        return false;
    }

    private void startLockService(Context context) {
        try {
            Intent serviceIntent = new Intent(context, LockScreenService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start lock service", e);
        }
    }

    private void logSmsCommand(Context context, String sender, String message, boolean success) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("SmsLockLog", Context.MODE_PRIVATE);

            String logEntry = String.format(
                    "%d|%s|%s|%s",
                    System.currentTimeMillis(),
                    sender,
                    message.substring(0, Math.min(20, message.length())),
                    success ? "OK" : "FAIL");

            // Append to log (keep last 50 entries)
            String existingLog = prefs.getString("LOG", "");
            String[] entries = existingLog.split("\n");

            StringBuilder newLog = new StringBuilder(logEntry);
            int count = 1;
            for (String entry : entries) {
                if (!entry.isEmpty() && count < 50) {
                    newLog.append("\n").append(entry);
                    count++;
                }
            }

            prefs.edit().putString("LOG", newLog.toString()).apply();

        } catch (Exception e) {
            Log.e(TAG, "Failed to log SMS command", e);
        }
    }
}
