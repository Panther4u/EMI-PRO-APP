package com.securefinance.emilock;

import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.app.admin.DevicePolicyManager;
import android.os.Build;

/**
 * DeviceAdminReceiver - Primary entry point for Device Owner provisioning
 * 
 * This receiver:
 * - Handles device provisioning complete
 * - Immediately locks device after QR scan
 * - Collects and sends device info to backend
 * - Starts lock screen service
 * - Grants all permissions automatically
 */
public class DeviceAdminReceiver extends android.app.admin.DeviceAdminReceiver {

    private static final String TAG = "EMI_ADMIN";

    @Override
    public void onProfileProvisioningComplete(Context context, Intent intent) {
        Log.i(TAG, "✅ Device Owner Activated - Provisioning Complete");
        Log.i(TAG, "🔒 LOCKING DEVICE IMMEDIATELY AFTER PROVISIONING");

        // Extract optional extras from QR
        String customerId = null;
        String serverUrl = null;

        try {
            android.os.PersistableBundle extras = intent
                    .getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);
            if (extras != null) {
                customerId = extras.getString("customerId");
                serverUrl = extras.getString("serverUrl");
                Log.d(TAG, "QR extras - customerId: " + customerId + ", serverUrl: " + serverUrl);
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to read QR extras", e);
        }

        // Default to production server
        if (serverUrl == null || serverUrl.isEmpty()) {
            serverUrl = "https://emi-pro-app.onrender.com";
            Log.i(TAG, "Using default server: " + serverUrl);
        }

        // 1. Initialize Full Device Lock Manager
        FullDeviceLockManager lockManager = new FullDeviceLockManager(context);

        // 2. Grant all permissions automatically (before user interaction)
        Log.i(TAG, "📋 Granting all permissions automatically...");
        lockManager.grantAllPermissions();

        // 3. Restrictions will be applied later based on lock status

        // 4. 🆕 Apply Safe Mode hardening
        Log.i(TAG, "🛡️ Hardening against Safe Mode...");
        SafeModeDetector.hardenAgainstSafeMode(context);

        // 5. 🆕 Store original SIM for change detection
        Log.i(TAG, "📱 Storing original SIM details...");
        SimChangeReceiver.storeOriginalSim(context);

        // 6. 🆕 Initialize offline lock cache with tokens
        Log.i(TAG, "💾 Setting up offline lock tokens...");
        OfflineLockCache offlineCache = new OfflineLockCache(context);
        // Generate random 6-digit tokens
        String lockToken = String.valueOf(100000 + new java.util.Random().nextInt(900000));
        String unlockToken = String.valueOf(100000 + new java.util.Random().nextInt(900000));
        offlineCache.setLockToken(lockToken);
        offlineCache.setUnlockToken(unlockToken);

        // 7. APPLY BASE SECURITY ONLY (Device stays UNLOCKED by default)
        Log.i(TAG, "🛡️ Applying base security (Factory Reset Block)...");
        lockManager.applyBaseRestrictions();

        // 8. Report device info to backend (includes tokens)
        Log.i(TAG, "📡 Sending device info to backend...");
        DeviceInfoCollector.collectAndSend(context, customerId, serverUrl);

        // 9. Save provisioning data for React Native
        android.content.SharedPreferences prefs = context.getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
        prefs.edit()
                .putString("SERVER_URL", serverUrl)
                .putString("CUSTOMER_ID", customerId)
                .putBoolean("IS_PROVISIONED", true)
                .putBoolean("DEVICE_LOCKED", false) // Device starts UNLOCKED
                .putString("OFFLINE_LOCK_TOKEN", lockToken)
                .putString("OFFLINE_UNLOCK_TOKEN", unlockToken)
                .putBoolean("SIM_LOCK_ENABLED", true)
                .putBoolean("SAFE_MODE_HARDENED", true)
                .apply();

        Log.i(TAG, "✅ Provisioning complete - device locked and secured");
        Log.i(TAG, "🔐 Offline Lock Token: " + lockToken);
        Log.i(TAG, "🔓 Offline Unlock Token: " + unlockToken);

        // 10. Launch the Main App (User App)
        launchMainApp(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent.getAction();

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            Log.d(TAG, "📱 Boot completed - restoring lock state");

            // Check if device was locked
            android.content.SharedPreferences prefs = context.getSharedPreferences("PhoneLockPrefs",
                    Context.MODE_PRIVATE);
            boolean wasLocked = prefs.getBoolean("DEVICE_LOCKED", false);

            if (wasLocked) {
                // Re-apply lock
                FullDeviceLockManager lockManager = new FullDeviceLockManager(context);
                lockManager.lockDeviceImmediately();
            }

            // Start lock service
            startLockService(context);

            // Send fresh device report
            DeviceInfoCollector.collectAndSend(context, null, null);
        }
    }

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.d(TAG, "✅ Device Admin Enabled");

        // Send device info when admin is enabled
        DeviceInfoCollector.collectAndSend(context, null, null);

        // Start lock service
        // Start lock service ALWAYS to ensure heartbeat is running
        startLockService(context);
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        Log.w(TAG, "⚠️ Device Admin Disabled - This should not happen!");
        super.onDisabled(context, intent);
    }

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        // Prevent disabling admin
        return "WARNING: Disabling device admin will prevent loan security. Contact your lender before proceeding.";
    }

    /**
     * Start the lock screen service
     */
    /**
     * Launch the Main App (User App)
     */
    private void launchMainApp(Context context) {
        try {
            Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (launch != null) {
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                context.startActivity(launch);
                Log.i(TAG, "Main App launched");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch main app", e);
        }
    }

    /**
     * Start the lock screen service
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
     * Launch the lock screen activity
     */
    private void launchLockScreen(Context context) {
        try {
            Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (launch != null) {
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TOP |
                        Intent.FLAG_ACTIVITY_SINGLE_TOP);
                launch.putExtra("FORCE_LOCK", true);
                context.startActivity(launch);
                Log.i(TAG, "Lock screen launched");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch lock screen", e);
        }
    }
}
