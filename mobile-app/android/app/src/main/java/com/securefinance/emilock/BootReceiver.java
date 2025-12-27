package com.securefinance.emilock;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "EMILock_BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Device booted - starting lock service");

            // Start lock service on boot
            Intent serviceIntent = new Intent(context, LockScreenService.class);
            context.startForegroundService(serviceIntent);
        }
    }
}
