package com.securefinance.emilock;

import android.app.admin.DevicePolicyManager;
import android.app.WallpaperManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.UserManager;
import android.os.Vibrator;
import android.provider.Settings;
import android.util.Log;
import android.view.WindowManager;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * FullDeviceLockManager - Complete Device Control System
 * 
 * This class provides comprehensive device lockdown capabilities:
 * - Immediate lock on provisioning
 * - Power button protection with alarm
 * - Admin-only unlock
 * - Wallpaper control
 * - PIN management
 * - Permission auto-grant
 * - Full kiosk mode
 */
public class FullDeviceLockManager {

    private static final String TAG = "FullDeviceLock";
    private static final String PREFS_NAME = "PhoneLockPrefs";
    private static final String KEY_DEVICE_LOCKED = "DEVICE_LOCKED";
    private static final String KEY_LOCK_MESSAGE = "LOCK_MESSAGE";
    private static final String KEY_SUPPORT_PHONE = "SUPPORT_PHONE";

    private Context context;
    private DevicePolicyManager dpm;
    private ComponentName adminComponent;
    private SharedPreferences prefs;
    private MediaPlayer alarmPlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;

    public FullDeviceLockManager(Context context) {
        this.context = context;
        this.dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        this.adminComponent = new ComponentName(context, DeviceAdminReceiver.class);
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        this.vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
    }

    /**
     * Check if this app is Device Owner
     */
    public boolean isDeviceOwner() {
        return dpm != null && dpm.isDeviceOwnerApp(context.getPackageName());
    }

    /**
     * Lock device immediately after provisioning
     * Called automatically on ProfileProvisioningComplete
     */
    public void lockDeviceImmediately() {
        Log.i(TAG, "🔒 LOCKING DEVICE IMMEDIATELY");

        if (!isDeviceOwner()) {
            Log.w(TAG, "Cannot lock - not device owner");
            return;
        }

        try {
            // 1. Enable Kiosk Mode (Lock Task)
            enableKioskMode();

            // 2. Apply STRICT security restrictions
            applyLockedRestrictions();

            // 3. Disable all user interaction
            disableUserInteraction();

            // 4. Hide all other apps
            setOtherAppsHidden(true);

            // 5. Set lock status
            prefs.edit().putBoolean(KEY_DEVICE_LOCKED, true).apply();

            // 6. Launch lock screen
            launchLockScreen();

            Log.i(TAG, "✅ Device locked successfully");

        } catch (Exception e) {
            Log.e(TAG, "Failed to lock device", e);
        }
    }

    /**
     * Enable Kiosk Mode - Lock device to this app only
     */
    public void enableKioskMode() {
        if (!isDeviceOwner())
            return;

        try {
            // WHIELITONLY THIS APP - User cannot launch any other app
            String[] packages = { context.getPackageName() };
            dpm.setLockTaskPackages(adminComponent, packages);

            // Configure lock task features (block navigation, status bar, power menu, etc.)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                // LOCK_TASK_FEATURE_NONE blocks: Home, Overview, Notifications, Status Bar, and
                // KEYGUARD
                // We specifically want to ensure GLOBAL_ACTIONS (Power Menu) is NOT included in
                // features
                // to prevent the user from accessing the power menu/restart/safe mode options
                // easily.
                int features = DevicePolicyManager.LOCK_TASK_FEATURE_NONE;

                // For extra security, we explicitly set features to NONE.
                dpm.setLockTaskFeatures(adminComponent, features);
            }

            Log.i(TAG, "Kiosk mode packages and features configured");
        } catch (Exception e) {
            Log.e(TAG, "Failed to enable kiosk mode", e);
        }
    }

    /**
     * Apply BASE security restrictions (For Normal Usage)
     * blocks Factory Reset, Uninstall, Safe Boot only.
     */
    public void applyBaseRestrictions() {
        if (!isDeviceOwner())
            return;

        try {
            // Block Factory Reset
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET);

            // Block Safe Mode
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT);

            // Block uninstalling apps (Admin app)
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS);

            // Block removing users
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_REMOVE_USER);

            Log.i(TAG, "Base security restrictions applied (Device Unlocked)");

        } catch (Exception e) {
            Log.e(TAG, "Failed to apply base restrictions", e);
        }
    }

    /**
     * Apply STRICT security restrictions (For Locked State)
     * Blocks Camera, USB, Apps, etc.
     */
    public void applyLockedRestrictions() {
        if (!isDeviceOwner())
            return;

        try {
            // Re-apply base just in case
            applyBaseRestrictions();

            // Block USB file transfer
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_USB_FILE_TRANSFER);

            // Block USB debugging
            dpm.setGlobalSetting(adminComponent, Settings.Global.ADB_ENABLED, "0");

            // Block adding users
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_ADD_USER);

            // Block config changes
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_WIFI);
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_BLUETOOTH);
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_MOBILE_NETWORKS);

            // Block installing apps
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_INSTALL_APPS);

            // Disable camera
            dpm.setCameraDisabled(adminComponent, true);

            // Block screen capture
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_SHARE_INTO_MANAGED_PROFILE);

            Log.i(TAG, "Strict/Locked security restrictions applied");

        } catch (Exception e) {
            Log.e(TAG, "Failed to apply strict restrictions", e);
        }
    }

    /**
     * Disable user interaction with system features
     */
    public void disableUserInteraction() {
        if (!isDeviceOwner())
            return;

        try {
            // Disable status bar (notifications, quick settings)
            dpm.setStatusBarDisabled(adminComponent, true);

            // Disable keyguard (system lock screen)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                dpm.setKeyguardDisabled(adminComponent, true);
            }

            // Disable all keyguard features just in case keyguard is enabled
            dpm.setKeyguardDisabledFeatures(adminComponent,
                    DevicePolicyManager.KEYGUARD_DISABLE_FEATURES_ALL);

            Log.i(TAG, "User interaction disabled (Status bar & Keyguard)");

        } catch (Exception e) {
            Log.e(TAG, "Failed to disable user interaction", e);
        }
    }

    /**
     * Launch the lock screen activity
     */
    public void launchLockScreen() {
        try {
            Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TOP |
                        Intent.FLAG_ACTIVITY_SINGLE_TOP);
                intent.putExtra("FORCE_LOCK", true);
                context.startActivity(intent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch lock screen", e);
        }
    }

    /**
     * Start alarm when power button is pressed (anti-shutdown protection)
     */
    public void startPowerButtonAlarm() {
        Log.i(TAG, "🚨 POWER BUTTON PRESSED - STARTING ALARM");

        try {
            // 1. Maximum volume
            AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM,
                        audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM), 0);
                audioManager.setStreamVolume(AudioManager.STREAM_RING,
                        audioManager.getStreamMaxVolume(AudioManager.STREAM_RING), 0);
            }

            // 2. Play alarm sound
            if (alarmPlayer != null) {
                alarmPlayer.release();
            }

            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }

            alarmPlayer = new MediaPlayer();
            alarmPlayer.setDataSource(context, alarmUri);
            alarmPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
            alarmPlayer.setLooping(true);
            alarmPlayer.prepare();
            alarmPlayer.start();

            // 3. Vibrate continuously
            if (vibrator != null) {
                long[] pattern = { 0, 1000, 500, 1000, 500 }; // vibrate pattern
                vibrator.vibrate(pattern, 0); // repeat from index 0
            }

            Log.i(TAG, "Alarm started - device protected");

        } catch (Exception e) {
            Log.e(TAG, "Failed to start alarm", e);
        }
    }

    /**
     * Stop the power button alarm
     */
    public void stopPowerButtonAlarm() {
        try {
            if (alarmPlayer != null) {
                alarmPlayer.stop();
                alarmPlayer.release();
                alarmPlayer = null;
            }

            if (vibrator != null) {
                vibrator.cancel();
            }

            Log.i(TAG, "Alarm stopped");

        } catch (Exception e) {
            Log.e(TAG, "Failed to stop alarm", e);
        }
    }

    /**
     * Set device wallpaper from URL
     */
    public boolean setWallpaper(String imageUrl) {
        if (!isDeviceOwner()) {
            Log.w(TAG, "Cannot set wallpaper - not device owner");
            return false;
        }

        try {
            // Download image
            URL url = new URL(imageUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoInput(true);
            connection.connect();
            InputStream input = connection.getInputStream();
            Bitmap bitmap = BitmapFactory.decodeStream(input);

            // Set wallpaper
            WallpaperManager wallpaperManager = WallpaperManager.getInstance(context);
            wallpaperManager.setBitmap(bitmap);

            // Also set lock screen wallpaper
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                wallpaperManager.setBitmap(bitmap, null, true,
                        WallpaperManager.FLAG_LOCK);
            }

            Log.i(TAG, "Wallpaper set successfully");
            return true;

        } catch (Exception e) {
            Log.e(TAG, "Failed to set wallpaper", e);
            return false;
        }
    }

    /**
     * Set device PIN code
     */
    public boolean setDevicePin(String pin) {
        if (!isDeviceOwner()) {
            Log.w(TAG, "Cannot set PIN - not device owner");
            return false;
        }

        try {
            // Reset password (set new PIN)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                boolean result = dpm.resetPasswordWithToken(adminComponent,
                        pin,
                        getOrCreatePasswordToken(),
                        0);
                Log.i(TAG, "PIN set result: " + result);
                return result;
            } else {
                // Legacy method for older Android versions
                boolean result = dpm.resetPassword(pin, 0);
                Log.i(TAG, "PIN set result (legacy): " + result);
                return result;
            }

        } catch (Exception e) {
            Log.e(TAG, "Failed to set PIN", e);
            return false;
        }
    }

    /**
     * Get or create password reset token
     */
    private byte[] getOrCreatePasswordToken() {
        byte[] token = prefs.getString("PASSWORD_TOKEN", "").getBytes();
        if (token.length == 0) {
            // Generate new token
            token = new byte[32];
            new java.security.SecureRandom().nextBytes(token);
            prefs.edit().putString("PASSWORD_TOKEN", new String(token)).apply();

            // Activate the token
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                dpm.setResetPasswordToken(adminComponent, token);
            }
        }
        return token;
    }

    /**
     * Grant all runtime permissions automatically
     */
    public void grantAllPermissions() {
        if (!isDeviceOwner())
            return;

        String[] permissions = {
                "android.permission.READ_PHONE_STATE",
                "android.permission.READ_SMS",
                "android.permission.RECEIVE_SMS",
                "android.permission.CAMERA",
                "android.permission.ACCESS_FINE_LOCATION",
                "android.permission.ACCESS_COARSE_LOCATION",
                "android.permission.READ_CONTACTS",
                "android.permission.WRITE_CONTACTS",
                "android.permission.CALL_PHONE",
                "android.permission.READ_CALL_LOG",
                "android.permission.WRITE_CALL_LOG",
                "android.permission.READ_EXTERNAL_STORAGE",
                "android.permission.WRITE_EXTERNAL_STORAGE"
        };

        try {
            for (String permission : permissions) {
                boolean granted = dpm.setPermissionGrantState(adminComponent,
                        context.getPackageName(),
                        permission,
                        DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED);
                Log.d(TAG, "Permission " + permission + " granted: " + granted);
            }

            Log.i(TAG, "All permissions granted automatically");

        } catch (Exception e) {
            Log.e(TAG, "Failed to grant permissions", e);
        }
    }

    /**
     * Set lock message and support phone
     */
    public void setLockInfo(String message, String phone) {
        prefs.edit()
                .putString(KEY_LOCK_MESSAGE, message)
                .putString(KEY_SUPPORT_PHONE, phone)
                .apply();
    }

    /**
     * Unlock device (admin only)
     */
    public void unlockDevice() {
        Log.i(TAG, "🔓 UNLOCKING DEVICE");

        if (!isDeviceOwner()) {
            Log.w(TAG, "Cannot unlock - not device owner");
            return;
        }

        try {
            // 1. Disable kiosk mode
            dpm.setLockTaskPackages(adminComponent, new String[] {});

            // 2. Enable status bar
            dpm.setStatusBarDisabled(adminComponent, false);

            // 3. Show other apps again
            setOtherAppsHidden(false);

            // 4. Revert to Base Restrictions (Clear strict ones)
            clearStrictRestrictions();
            applyBaseRestrictions();

            // 5. Set lock status
            prefs.edit().putBoolean(KEY_DEVICE_LOCKED, false).apply();

            // 6. Stop any alarms
            stopPowerButtonAlarm();

            Log.i(TAG, "✅ Device unlocked successfully");

        } catch (Exception e) {
            Log.e(TAG, "Failed to unlock device", e);
        }
    }

    /**
     * Clear strict restrictions (called during unlock)
     */

    private void clearStrictRestrictions() {
        if (!isDeviceOwner())
            return;

        try {
            dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_USB_FILE_TRANSFER);
            dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_ADD_USER);
            dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_WIFI);
            dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_BLUETOOTH);
            dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_MOBILE_NETWORKS);
            dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_INSTALL_APPS);
            dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_SHARE_INTO_MANAGED_PROFILE);
            dpm.setCameraDisabled(adminComponent, false);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_OUTGOING_CALLS);
            }
            dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_SMS);

            Log.i(TAG, "Strict restrictions cleared");
        } catch (Exception e) {
            Log.e(TAG, "Failed to clear strict restrictions", e);
        }
    }

    /**
     * Check if device is currently locked
     */
    public boolean isDeviceLocked() {
        return prefs.getBoolean(KEY_DEVICE_LOCKED, true); // Default to locked
    }

    /**
     * Get lock message
     */
    public String getLockMessage() {
        return prefs.getString(KEY_LOCK_MESSAGE,
                "This device has been locked due to payment overdue.");
    }

    /**
     * Get support phone
     */
    public String getSupportPhone() {
        return prefs.getString(KEY_SUPPORT_PHONE, "8876655444");
    }

    /**
     * Check if kiosk mode is active
     */
    public boolean isKioskModeActive() {
        if (!isDeviceOwner())
            return false;
        try {
            String[] packages = dpm.getLockTaskPackages(adminComponent);
            return packages != null && packages.length > 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Acquire wake lock to keep device awake
     */
    public void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            wakeLock = pm.newWakeLock(
                    PowerManager.FULL_WAKE_LOCK |
                            PowerManager.ACQUIRE_CAUSES_WAKEUP |
                            PowerManager.ON_AFTER_RELEASE,
                    "EMILock:WakeLock");
            wakeLock.acquire(10 * 60 * 1000L); // 10 minutes
        } catch (Exception e) {
            Log.e(TAG, "Failed to acquire wake lock", e);
        }
    }

    /**
     * Hide or show other apps (Settings, Play Store, etc.)
     */
    public void setOtherAppsHidden(boolean hidden) {
        if (!isDeviceOwner())
            return;
        try {
            // Block critical escape paths
            String[] packagesToBlock = {
                    "com.android.settings",
                    "com.android.vending",
                    "com.google.android.youtube",
                    "com.android.chrome",
                    "com.google.android.apps.messaging",
                    "com.android.dialer"
            };
            for (String pkg : packagesToBlock) {
                try {
                    dpm.setApplicationHidden(adminComponent, pkg, hidden);
                } catch (Exception e) {
                    // App might not exist
                }
            }
            Log.i(TAG, "Other apps " + (hidden ? "HIDDEN" : "VISIBLE"));
        } catch (Exception e) {
            Log.e(TAG, "Failed to toggle app visibility", e);
        }
    }

    /**
     * Release wake lock
     */
    public void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to release wake lock", e);
        }
    }
}
