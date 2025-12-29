package com.securefinance.emilock;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.SharedPreferences;
import android.util.Log;

public class SmsLockReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction() != null && intent.getAction().equals("android.provider.Telephony.SMS_RECEIVED")) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                // Retrieve the SMS message received
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        try {
                            SmsMessage smsMessage;
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                                String format = bundle.getString("format");
                                smsMessage = SmsMessage.createFromPdu((byte[]) pdu, format);
                            } else {
                                smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                            }

                            String messageBody = smsMessage.getMessageBody();
                            processMessage(context, messageBody);
                        } catch (Exception e) {
                            Log.e("SmsLockReceiver", "Error processing SMS", e);
                        }
                    }
                }
            }
        }
    }

    private void processMessage(Context context, String messageBody) {
        if (messageBody == null)
            return;

        SharedPreferences prefs = context.getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
        String offlineToken = prefs.getString("OFFLINE_LOCK_TOKEN", null);

        if (offlineToken == null)
            return;

        // Command format: "LOCK <TOKEN>"
        String lockCommand = "LOCK " + offlineToken;

        if (messageBody.trim().equalsIgnoreCase(lockCommand)) {
            DevicePolicyManager devicePolicyManager = (DevicePolicyManager) context
                    .getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName adminComponent = new ComponentName(context, DeviceAdminReceiver.class);

            if (devicePolicyManager != null && devicePolicyManager.isAdminActive(adminComponent)) {
                // 1. System Lock
                devicePolicyManager.lockNow();

                // 2. Launch our Custom Lock Service (Overlay)
                Intent serviceIntent = new Intent(context, LockScreenService.class);
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            }
        }
    }
}
