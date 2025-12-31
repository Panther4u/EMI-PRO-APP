package com.securefinance.emilock;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;
import org.json.JSONObject;

public class RetryReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("EMI_DPC", "RetryReceiver triggered: " + intent.getAction());

        SharedPreferences pref = context.getSharedPreferences("device_report", Context.MODE_PRIVATE);

        String payloadStr = pref.getString("pending_payload", null);

        if (payloadStr != null) {
            Log.d("EMI_DPC", "Found pending payload, retrying...");
            try {
                JSONObject payload = new JSONObject(payloadStr);
                DeviceInfoCollector.retryPending(context, payload);
            } catch (Exception e) {
                Log.e("EMI_DPC", "Error parsing pending payload", e);
            }
        } else {
            Log.d("EMI_DPC", "No pending payload to sync.");
        }
    }
}
