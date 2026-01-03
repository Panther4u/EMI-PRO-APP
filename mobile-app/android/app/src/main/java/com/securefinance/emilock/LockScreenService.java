package com.securefinance.emilock;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.json.JSONObject;
import java.io.IOException;

public class LockScreenService extends Service {
    private static final String TAG = "LockScreenService";
    private static final String CHANNEL_ID = "LockServiceChannel";
    private Handler handler;
    private Runnable heartbeatRunnable;
    private OkHttpClient client;
    private String serverUrl;
    private String customerId;

    @Override
    public void onCreate() {
        super.onCreate();
        client = new OkHttpClient();
        handler = new Handler(Looper.getMainLooper());
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Build foreground notification
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Device Security Protected")
                .setContentText("EMI Lock monitoring active")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setPriority(NotificationCompat.PRIORITY_LOW) // Low priority to minimize intrusion
                .build();

        startForeground(1001, notification);

        // Load config
        SharedPreferences prefs = getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
        serverUrl = prefs.getString("SERVER_URL", null);
        customerId = prefs.getString("CUSTOMER_ID", null);

        if (serverUrl != null && customerId != null) {
            checkLockStatus(); // Immediate check
            startHeartbeatLoop();
        } else {
            Log.e(TAG, "Missing config (URL/ID), service waiting for provision data...");
            // Retry reading config in loop, in case app provisions while service is alive
            startHeartbeatLoop();
        }

        return START_STICKY;
    }

    private void startHeartbeatLoop() {
        heartbeatRunnable = new Runnable() {
            @Override
            public void run() {
                // Reload config if missing
                if (serverUrl == null || customerId == null) {
                    SharedPreferences prefs = getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
                    serverUrl = prefs.getString("SERVER_URL", null);
                    customerId = prefs.getString("CUSTOMER_ID", null);
                }

                checkLockStatus();
                handler.postDelayed(this, 3000); // Check every 3 seconds for immediate response
            }
        };
        handler.post(heartbeatRunnable);
    }

    private void checkLockStatus() {
        if (serverUrl == null || customerId == null)
            return;

        // Construct URL: serverUrl/api/customers/customerId
        String baseUrl = serverUrl.endsWith("/") ? serverUrl.substring(0, serverUrl.length() - 1) : serverUrl;
        String url = baseUrl + "/api/customers/" + customerId;

        // Fallback for emulator testing
        if (serverUrl.contains("localhost")) {
            url = url.replace("localhost", "10.0.2.2");
        }

        Request request = new Request.Builder()
                .url(url)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Heartbeat failed: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    try {
                        String jsonData = response.body().string();
                        JSONObject json = new JSONObject(jsonData);

                        // Check lock status
                        boolean isLocked = json.optBoolean("isLocked", false);

                        if (isLocked) {
                            Log.d(TAG, "Device is LOCKED. Enforcing OS lock.");
                            // User requested strict OS-level locking via dpm.lockNow()
                            DeviceLockModule.enforceLock(LockScreenService.this);
                        } else {
                            // Log.d(TAG, "Device is UNLOCKED.");
                        }

                    } catch (Exception e) {
                        Log.e(TAG, "Parse error", e);
                    }
                } else {
                    Log.w(TAG, "Heartbeat error: " + response.code());
                }
                response.close();
            }
        });
    }

    private void createNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "EMI Lock Service",
                    NotificationManager.IMPORTANCE_LOW);
            serviceChannel.setDescription("Keeps the EMI lock enforcement active");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null && heartbeatRunnable != null) {
            handler.removeCallbacks(heartbeatRunnable);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
