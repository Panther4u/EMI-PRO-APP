package com.securefinance.emilock;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.view.WindowManager;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

/**
 * MainActivity - Main entry point for the EMI Lock application
 * 
 * This activity:
 * - Shows on lock screen
 * - Blocks power button (except long press for emergency)
 * - Starts kiosk mode when device is locked
 * - Prevents app switching
 */
public class MainActivity extends ReactActivity {

    private static final String TAG = "EMI_MainActivity";
    private FullDeviceLockManager lockManager;
    private boolean isLocked = true;

    @Override
    protected String getMainComponentName() {
        return "emilockapp";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
                this,
                getMainComponentName(),
                DefaultNewArchitectureEntryPoint.getFabricEnabled());
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "MainActivity created");

        lockManager = new FullDeviceLockManager(this);

        // Check lock status
        SharedPreferences prefs = getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
        boolean isAdmin = getPackageName().endsWith(".admin");

        if (isAdmin) {
            isLocked = false;
        } else {
            isLocked = prefs.getBoolean("DEVICE_LOCKED", true);
        }

        if (isLocked) {
            setupLockScreen();
            startKioskMode(); // 🔒 Enforce Kiosk Mode IMMEDIATELY on creation
        }

        // Handle FORCE_LOCK intent
        Intent intent = getIntent();
        if (intent != null && intent.getBooleanExtra("FORCE_LOCK", false)) {
            Log.i(TAG, "FORCE_LOCK intent received - locking device");
            isLocked = true;
            setupLockScreen();
            startKioskMode();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        // Re-check lock status
        SharedPreferences prefs = getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
        isLocked = prefs.getBoolean("DEVICE_LOCKED", true);

        if (isLocked) {
            // Ensure lock is still active
            startKioskMode();
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        if (intent != null && intent.getBooleanExtra("FORCE_LOCK", false)) {
            Log.i(TAG, "New FORCE_LOCK intent - locking device");
            isLocked = true;
            setupLockScreen();
            startKioskMode();
        }
    }

    /**
     * Setup window flags for lock screen behavior
     */
    private void setupLockScreen() {
        Log.i(TAG, "Setting up lock screen flags");

        // Show on lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);

            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }

        // Keep screen on
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Full screen
        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN |
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN);
    }

    /**
     * Start kiosk mode (lock task)
     */
    private void startKioskMode() {
        if (lockManager != null && lockManager.isDeviceOwner()) {
            try {
                lockManager.enableKioskMode();
                startLockTask();
                Log.i(TAG, "Kiosk mode started");
            } catch (Exception e) {
                Log.e(TAG, "Failed to start kiosk mode", e);
            }
        }
    }

    /**
     * Intercept power button and volume keys when locked
     */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (isLocked) {
            int keyCode = event.getKeyCode();

            switch (keyCode) {
                case KeyEvent.KEYCODE_POWER:
                    Log.w(TAG, "🔒 Power button blocked");
                    if (event.getAction() == KeyEvent.ACTION_DOWN) {
                        // Trigger alarm
                        if (lockManager != null) {
                            lockManager.startPowerButtonAlarm();
                        }
                        return true; // Block the event
                    }
                    return true;

                case KeyEvent.KEYCODE_HOME:
                case KeyEvent.KEYCODE_APP_SWITCH:
                case KeyEvent.KEYCODE_MENU:
                    Log.w(TAG, "🔒 Navigation button blocked: " + keyCode);
                    return true; // Block these keys

                case KeyEvent.KEYCODE_VOLUME_DOWN:
                case KeyEvent.KEYCODE_VOLUME_UP:
                    // Allow volume keys but can be blocked if needed
                    return false;

                default:
                    break;
            }
        }

        return super.dispatchKeyEvent(event);
    }

    /**
     * Block back button when locked
     */
    @Override
    public void onBackPressed() {
        if (isLocked) {
            Log.w(TAG, "🔒 Back button blocked");
            // Do nothing - block back button
            return;
        }
        super.onBackPressed();
    }

    /**
     * Prevent screen from turning off when locked
     */
    @Override
    public void onUserInteraction() {
        super.onUserInteraction();

        if (isLocked) {
            // Keep screen on
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
    }

    /**
     * Prevent task from being removed
     */
    @Override
    protected void onDestroy() {
        Log.w(TAG, "MainActivity being destroyed");

        // If locked, try to restart
        if (isLocked && lockManager != null) {
            Log.i(TAG, "Device is locked - scheduling restart");
            lockManager.launchLockScreen();
        }

        super.onDestroy();
    }

    /**
     * Prevent pause when locked (keep in foreground)
     */
    @Override
    protected void onPause() {
        super.onPause();

        if (isLocked) {
            // Bring back to foreground
            Log.i(TAG, "Locked device paused - bringing back");
            if (lockManager != null) {
                lockManager.launchLockScreen();
            }
        }
    }
}
