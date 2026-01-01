package com.securefinance.emilock;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * BootReceiver - Handles device boot and restores lock state
 * 
 * This receiver:
 * - Triggers on BOOT_COMPLETED
 * - Restores device lock state after reboot
 * - Starts the lock screen service
 * - Ensures device remains locked if it was locked before boot
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "EMILock_BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
                "android.intent.action.QUICKBOOT_POWERON".equals(action) ||
                "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)) {

            Log.i(TAG, "📱 Device booted - checking security status");

            // 1. 🆕 Check for Safe Mode FIRST
            Log.i(TAG, "🔍 Checking Safe Mode status...");
            if (SafeModeDetector.isInSafeMode(context)) {
                Log.w(TAG, "🚨 SAFE MODE DETECTED ON BOOT!");
                handleSafeModeBoot(context);
                return; // Safe mode handler takes over
            }
            Log.i(TAG, "✅ Normal boot - not in Safe Mode");

            // Check provisioning status
            android.content.SharedPreferences prefs = context.getSharedPreferences("PhoneLockPrefs",
                    Context.MODE_PRIVATE);
            boolean isLocked = prefs.getBoolean("DEVICE_LOCKED", false);
            boolean isProvisioned = prefs.getBoolean("IS_PROVISIONED", false);

            if (isProvisioned) {
                Log.i(TAG, "Device is provisioned. Lock state: " + (isLocked ? "LOCKED" : "UNLOCKED"));

                // 2. 🆕 Check SIM card
                Log.i(TAG, "📱 Verifying SIM card...");
                if (!SimChangeReceiver.isOriginalSim(context)) {
                    Log.w(TAG, "🚨 SIM CHANGE DETECTED ON BOOT!");
                    handleSimChangeBoot(context);
                    return; // SIM change handler takes over
                }
                Log.i(TAG, "✅ SIM verified - matches original");

                // 3. Start lock service ONLY if locked
                if (isLocked) {
                    startLockService(context);
                }

                // 4. 🆕 Process any queued offline commands
                Log.i(TAG, "💾 Processing offline command queue...");
                FullDeviceLockManager lockManager = new FullDeviceLockManager(context);
                OfflineLockCache offlineCache = new OfflineLockCache(context);
                offlineCache.processQueue(lockManager);

                // 5. Apply lock if needed
                if (isLocked) {
                    Log.i(TAG, "🔒 Restoring lock state...");
                    lockManager.lockDeviceImmediately();
                    launchLockScreen(context);
                }

                // 6. Send device status to backend
                DeviceInfoCollector.collectAndSend(context, null, null);

            } else {
                Log.i(TAG, "Device not provisioned - starting setup");
                launchApp(context);
            }
        }
    }

    /**
     * Handle Safe Mode boot - lock device with alarm
     */
    private void handleSafeModeBoot(Context context) {
        Log.w(TAG, "🚨 Handling Safe Mode boot...");

        FullDeviceLockManager lockManager = new FullDeviceLockManager(context);

        // Lock immediately
        lockManager.lockDeviceImmediately();

        // Start alarm
        lockManager.startPowerButtonAlarm();

        // Start service
        startLockService(context);

        // Launch lock screen
        launchLockScreen(context);

        // Report to backend (will be queued if offline)
        // The SafeModeDetector handles reporting
    }

    /**
     * Handle SIM change boot - lock device
     */
    private void handleSimChangeBoot(Context context) {
        Log.w(TAG, "🚨 Handling SIM change boot...");

        FullDeviceLockManager lockManager = new FullDeviceLockManager(context);

        // Lock immediately
        lockManager.lockDeviceImmediately();

        // Start service
        startLockService(context);

        // Launch lock screen
        launchLockScreen(context);
    }

    /**
     * Start the persistent lock service
     */
    private void startLockService(Context context) {
        try {
            Intent serviceIntent = new Intent(context, LockScreenService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            Log.i(TAG, "Lock service started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start lock service", e);
        }
    }

    /**
     * Launch the lock screen
     */
    private void launchLockScreen(Context context) {
        try {
            Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TOP);
                intent.putExtra("FORCE_LOCK", true);
                context.startActivity(intent);
                Log.i(TAG, "Lock screen launched on boot");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch lock screen", e);
        }
    }

    /**
     * Launch the app normally
     */
    private void launchApp(Context context) {
        try {
            Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch app", e);
        }
    }
}
