package com.securefinance.emilock;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * LockScreenService - Persistent background service for device lockdown
 * 
 * This service:
 * - Runs continuously in background
 * - Monitors power button presses
 * - Triggers alarm when shutdown attempted
 * - Keeps the lock screen active
 * - Auto-starts on boot
 */
public class LockScreenService extends Service {

    private static final String TAG = "LockScreenService";
    private static final String CHANNEL_ID = "emi_lock_channel";
    private static final int NOTIFICATION_ID = 1001;

    private FullDeviceLockManager lockManager;
    private PowerManager.WakeLock wakeLock;
    private BroadcastReceiver screenReceiver;
    private BroadcastReceiver shutdownReceiver;
    private boolean isMonitoring = false;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "🔒 LockScreenService created");

        lockManager = new FullDeviceLockManager(this);

        // Create notification channel
        createNotificationChannel();

        // Start as foreground service
        startForeground(NOTIFICATION_ID, createNotification());

        // Acquire wake lock
        acquireWakeLock();

        // Register receivers
        registerReceivers();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "🔒 LockScreenService started");

        // Check if device should be locked
        if (lockManager.isDeviceLocked()) {
            Log.i(TAG, "Device is locked - enforcing lock screen");
            lockManager.launchLockScreen();
        }

        // Keep service running
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        Log.w(TAG, "⚠️ LockScreenService being destroyed - restarting!");

        // Release resources
        releaseWakeLock();
        unregisterReceivers();

        // If device is locked, restart service immediately
        if (lockManager != null && lockManager.isDeviceLocked()) {
            Intent restartIntent = new Intent(this, LockScreenService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(restartIntent);
            } else {
                startService(restartIntent);
            }
        }

        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.w(TAG, "⚠️ Task removed - restarting service!");

        // Restart service if force stopped
        Intent restartIntent = new Intent(this, LockScreenService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(restartIntent);
        } else {
            startService(restartIntent);
        }

        super.onTaskRemoved(rootIntent);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "EMI Lock Service",
                    NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Keeps device secured");
            channel.setShowBadge(false);
            channel.setSound(null, null);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Device Protected")
                .setContentText("EMI Security Active")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(
                        PowerManager.PARTIAL_WAKE_LOCK,
                        "EMILock::LockService");
                wakeLock.acquire();
                Log.i(TAG, "Wake lock acquired");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to acquire wake lock", e);
        }
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                Log.i(TAG, "Wake lock released");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to release wake lock", e);
        }
    }

    private void registerReceivers() {
        if (isMonitoring)
            return;

        // Screen on/off receiver
        screenReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();

                if (Intent.ACTION_SCREEN_OFF.equals(action)) {
                    Log.i(TAG, "📱 Screen turned OFF");

                    // If device is locked, immediately turn screen back on
                    if (lockManager.isDeviceLocked()) {
                        Log.i(TAG, "🔒 Device is locked - forcing screen ON");
                        lockManager.acquireWakeLock();
                        lockManager.launchLockScreen();
                    }

                } else if (Intent.ACTION_SCREEN_ON.equals(action)) {
                    Log.i(TAG, "📱 Screen turned ON");

                    // If device is locked, ensure lock screen is showing
                    if (lockManager.isDeviceLocked()) {
                        lockManager.launchLockScreen();
                    }
                }
            }
        };

        IntentFilter screenFilter = new IntentFilter();
        screenFilter.addAction(Intent.ACTION_SCREEN_ON);
        screenFilter.addAction(Intent.ACTION_SCREEN_OFF);
        registerReceiver(screenReceiver, screenFilter);

        // Shutdown receiver - CRITICAL for anti-shutdown protection
        shutdownReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();

                if (Intent.ACTION_SHUTDOWN.equals(action) ||
                        Intent.ACTION_REBOOT.equals(action) ||
                        "android.intent.action.QUICKBOOT_POWEROFF".equals(action)) {

                    Log.w(TAG, "🚨 SHUTDOWN/REBOOT ATTEMPTED!");

                    // If device is locked, trigger alarm
                    if (lockManager.isDeviceLocked()) {
                        Log.i(TAG, "🔊 Starting anti-shutdown alarm!");
                        lockManager.startPowerButtonAlarm();

                        // Try to abort shutdown (may not work on all devices)
                        abortBroadcast();
                    }
                }
            }
        };

        IntentFilter shutdownFilter = new IntentFilter();
        shutdownFilter.addAction(Intent.ACTION_SHUTDOWN);
        shutdownFilter.addAction(Intent.ACTION_REBOOT);
        shutdownFilter.addAction("android.intent.action.QUICKBOOT_POWEROFF");
        shutdownFilter.setPriority(IntentFilter.SYSTEM_HIGH_PRIORITY);
        registerReceiver(shutdownReceiver, shutdownFilter);

        isMonitoring = true;
        Log.i(TAG, "Receivers registered - monitoring active");
    }

    private void unregisterReceivers() {
        try {
            if (screenReceiver != null) {
                unregisterReceiver(screenReceiver);
                screenReceiver = null;
            }
            if (shutdownReceiver != null) {
                unregisterReceiver(shutdownReceiver);
                shutdownReceiver = null;
            }
            isMonitoring = false;
            Log.i(TAG, "Receivers unregistered");
        } catch (Exception e) {
            Log.e(TAG, "Error unregistering receivers", e);
        }
    }
}
