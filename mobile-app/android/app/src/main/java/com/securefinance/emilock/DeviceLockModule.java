package com.securefinance.emilock;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import java.util.Map;
import java.util.HashMap;

/**
 * DeviceLockModule - React Native Bridge for Device Control
 * 
 * Exposes all device management functions to JavaScript:
 * - Lock/Unlock device
 * - Kiosk mode
 * - Set wallpaper
 * - Set PIN
 * - Grant permissions
 * - Security hardening
 * - Power button protection
 */
public class DeviceLockModule extends ReactContextBaseJavaModule {

    private DevicePolicyManager devicePolicyManager;
    private ComponentName adminComponent;
    private ReactApplicationContext reactContext;
    private FullDeviceLockManager lockManager;

    public DeviceLockModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        try {
            this.devicePolicyManager = (DevicePolicyManager) reactContext
                    .getSystemService(Context.DEVICE_POLICY_SERVICE);
            this.adminComponent = new ComponentName(reactContext, DeviceAdminReceiver.class);
            this.lockManager = new FullDeviceLockManager(reactContext);
        } catch (Exception e) {
            android.util.Log.w("DeviceLockModule", "Device Admin not available: " + e.getMessage());
            this.devicePolicyManager = null;
            this.adminComponent = null;
            this.lockManager = null;
        }
    }

    @Override
    public String getName() {
        return "DeviceLockModule";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        try {
            String packageName = reactContext.getPackageName();
            constants.put("PACKAGE_NAME", packageName);
            constants.put("IS_ADMIN",
                    packageName != null && (packageName.endsWith(".admin") || packageName.contains(".admin")));
        } catch (Exception e) {
            constants.put("IS_ADMIN", false);
        }
        return constants;
    }

    private boolean isDeviceOwner() {
        return devicePolicyManager != null && devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName());
    }

    @ReactMethod
    public void isDeviceOwner(Promise promise) {
        promise.resolve(isDeviceOwner());
    }

    @ReactMethod
    public void isDeviceLocked(Promise promise) {
        if (lockManager != null) {
            promise.resolve(lockManager.isDeviceLocked());
        } else {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void requestAdminPermission(Promise promise) {
        try {
            if (isDeviceOwner()) {
                promise.resolve(true);
                return;
            }
            Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent);
            intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                    "SecureFinance requires device admin permission to secure your device.");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isAdminActive(Promise promise) {
        if (devicePolicyManager == null) {
            promise.resolve(false);
        } else {
            boolean isActive = devicePolicyManager.isAdminActive(adminComponent);
            promise.resolve(isActive);
        }
    }

    /**
     * Lock device immediately with full lockdown
     */
    @ReactMethod
    public void lockDeviceImmediately(Promise promise) {
        try {
            if (lockManager != null && isDeviceOwner()) {
                lockManager.lockDeviceImmediately();
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Not device owner or lock manager unavailable");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Unlock device (admin only)
     */
    @ReactMethod
    public void unlockDevice(Promise promise) {
        try {
            if (lockManager != null && isDeviceOwner()) {
                lockManager.unlockDevice();
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Not device owner or lock manager unavailable");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void lockDevice(Promise promise) {
        try {
            if (isDeviceOwner() && devicePolicyManager.isAdminActive(adminComponent)) {
                devicePolicyManager.lockNow();
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Not device owner or admin inactive");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void disableCamera(boolean disable, Promise promise) {
        try {
            if (isDeviceOwner() && devicePolicyManager.isAdminActive(adminComponent)) {
                devicePolicyManager.setCameraDisabled(adminComponent, disable);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Not device owner or admin inactive");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void wipeData(Promise promise) {
        try {
            if (isDeviceOwner() && devicePolicyManager.isAdminActive(adminComponent)) {
                devicePolicyManager.wipeData(0);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Not device owner or admin inactive");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Set device wallpaper from URL
     */
    @ReactMethod
    public void setWallpaper(String imageUrl, Promise promise) {
        try {
            if (lockManager != null && isDeviceOwner()) {
                // Run on background thread to avoid blocking UI
                new Thread(() -> {
                    boolean result = lockManager.setWallpaper(imageUrl);
                    if (result) {
                        promise.resolve(true);
                    } else {
                        promise.reject("ERROR", "Failed to set wallpaper");
                    }
                }).start();
            } else {
                promise.reject("ERROR", "Not device owner");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Set device PIN code
     */
    @ReactMethod
    public void setDevicePin(String pin, Promise promise) {
        try {
            if (lockManager != null && isDeviceOwner()) {
                boolean result = lockManager.setDevicePin(pin);
                promise.resolve(result);
            } else {
                promise.reject("ERROR", "Not device owner");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Grant all permissions automatically
     */
    @ReactMethod
    public void grantAllPermissions(Promise promise) {
        try {
            if (lockManager != null && isDeviceOwner()) {
                lockManager.grantAllPermissions();
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Not device owner");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Apply full security restrictions
     */
    @ReactMethod
    public void applySecurityRestrictions(Promise promise) {
        try {
            if (lockManager != null && isDeviceOwner()) {
                lockManager.applyLockedRestrictions();
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Not device owner");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Start power button alarm
     */
    @ReactMethod
    public void startPowerAlarm(Promise promise) {
        try {
            if (lockManager != null) {
                lockManager.startPowerButtonAlarm();
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Lock manager unavailable");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Stop power button alarm
     */
    @ReactMethod
    public void stopPowerAlarm(Promise promise) {
        try {
            if (lockManager != null) {
                lockManager.stopPowerButtonAlarm();
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Lock manager unavailable");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Set lock screen message and support phone
     */
    @ReactMethod
    public void setLockInfo(String message, String phone, Promise promise) {
        try {
            if (lockManager != null) {
                lockManager.setLockInfo(message, phone);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Lock manager unavailable");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Get lock screen info (message and phone)
     */
    @ReactMethod
    public void getLockInfo(Promise promise) {
        try {
            if (lockManager != null) {
                WritableMap map = Arguments.createMap();
                map.putString("message", lockManager.getLockMessage());
                map.putString("phone", lockManager.getSupportPhone());
                map.putBoolean("isLocked", lockManager.isDeviceLocked());
                promise.resolve(map);
            } else {
                promise.reject("ERROR", "Lock manager unavailable");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getIMEI(Promise promise) {
        try {
            String deviceId = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    android.telephony.TelephonyManager tm = (android.telephony.TelephonyManager) reactContext
                            .getSystemService(Context.TELEPHONY_SERVICE);
                    if (androidx.core.app.ActivityCompat.checkSelfPermission(reactContext,
                            android.Manifest.permission.READ_PHONE_STATE) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                        deviceId = tm.getImei();
                    }
                } catch (Exception e) {
                    // Ignore, fallback
                }
            }

            if (deviceId == null) {
                deviceId = Settings.Secure.getString(reactContext.getContentResolver(), Settings.Secure.ANDROID_ID);
            }
            promise.resolve(deviceId);
        } catch (Exception e) {
            promise.resolve("UNKNOWN");
        }
    }

    @ReactMethod
    public void getSimDetails(Promise promise) {
        try {
            android.telephony.SubscriptionManager subscriptionManager = (android.telephony.SubscriptionManager) reactContext
                    .getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);

            if (androidx.core.app.ActivityCompat.checkSelfPermission(reactContext,
                    android.Manifest.permission.READ_PHONE_STATE) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                promise.resolve(null);
                return;
            }

            java.util.List<android.telephony.SubscriptionInfo> subscriptionInfoList = subscriptionManager
                    .getActiveSubscriptionInfoList();

            if (subscriptionInfoList != null && !subscriptionInfoList.isEmpty()) {
                android.telephony.SubscriptionInfo info = subscriptionInfoList.get(0);
                WritableMap map = Arguments.createMap();
                map.putString("operator", info.getCarrierName().toString());
                map.putString("subscriptionId", String.valueOf(info.getSubscriptionId()));

                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        try {
                            String iccId = info.getIccId();
                            if (iccId != null)
                                map.putString("serialNumber", iccId);
                        } catch (SecurityException se) {
                            // Fallback
                        }
                    } else {
                        map.putString("serialNumber", info.getIccId());
                    }
                } catch (Exception e) {
                }

                try {
                    String number = info.getNumber();
                    if (number != null && !number.isEmpty())
                        map.putString("phoneNumber", number);
                } catch (Exception e) {
                }

                promise.resolve(map);
            } else {
                promise.resolve(null);
            }
        } catch (Exception e) {
            promise.resolve(null);
        }
    }

    @ReactMethod
    public void setOfflineToken(String token, Promise promise) {
        try {
            android.content.SharedPreferences prefs = reactContext.getSharedPreferences("PhoneLockPrefs",
                    Context.MODE_PRIVATE);
            prefs.edit().putString("OFFLINE_LOCK_TOKEN", token).apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getProvisioningData(Promise promise) {
        try {
            android.content.SharedPreferences prefs = reactContext.getSharedPreferences("PhoneLockPrefs",
                    Context.MODE_PRIVATE);
            String serverUrl = prefs.getString("SERVER_URL", null);
            String customerId = prefs.getString("CUSTOMER_ID", null);
            boolean isProvisioned = prefs.getBoolean("IS_PROVISIONED", false);

            if (isProvisioned) {
                WritableMap map = Arguments.createMap();
                map.putString("serverUrl", serverUrl);
                map.putString("customerId", customerId);
                map.putBoolean("isProvisioned", true);
                promise.resolve(map);
            } else {
                promise.resolve(null);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getAppInfo(Promise promise) {
        try {
            WritableMap map = Arguments.createMap();
            map.putString("packageName", reactContext.getPackageName());
            map.putBoolean("isDeviceOwner", isDeviceOwner());
            map.putBoolean("isLocked", lockManager != null ? lockManager.isDeviceLocked() : false);
            promise.resolve(map);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startKioskMode(Promise promise) {
        try {
            if (isDeviceOwner()) {
                String[] packages = { reactContext.getPackageName() };
                devicePolicyManager.setLockTaskPackages(adminComponent, packages);

                // Configure lock task features (block everything)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    devicePolicyManager.setLockTaskFeatures(adminComponent,
                            DevicePolicyManager.LOCK_TASK_FEATURE_NONE);
                }

                if (getCurrentActivity() != null) {
                    getCurrentActivity().startLockTask();
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Not device owner");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopKioskMode(Promise promise) {
        try {
            if (isDeviceOwner() && getCurrentActivity() != null) {
                getCurrentActivity().stopLockTask();
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void setSecurityHardening(boolean enabled, Promise promise) {
        try {
            if (isDeviceOwner()) {
                if (enabled) {
                    devicePolicyManager.addUserRestriction(adminComponent,
                            android.os.UserManager.DISALLOW_FACTORY_RESET);
                    devicePolicyManager.addUserRestriction(adminComponent,
                            android.os.UserManager.DISALLOW_SAFE_BOOT);
                    devicePolicyManager.setGlobalSetting(adminComponent,
                            android.provider.Settings.Global.ADB_ENABLED, "0");
                    devicePolicyManager.addUserRestriction(adminComponent,
                            android.os.UserManager.DISALLOW_USB_FILE_TRANSFER);
                } else {
                    devicePolicyManager.clearUserRestriction(adminComponent,
                            android.os.UserManager.DISALLOW_FACTORY_RESET);
                    devicePolicyManager.clearUserRestriction(adminComponent,
                            android.os.UserManager.DISALLOW_SAFE_BOOT);
                    devicePolicyManager.clearUserRestriction(adminComponent,
                            android.os.UserManager.DISALLOW_USB_FILE_TRANSFER);
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Not device owner");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Start the lock screen service
     */
    @ReactMethod
    public void startLockService(Promise promise) {
        try {
            Intent serviceIntent = new Intent(reactContext, LockScreenService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent);
            } else {
                reactContext.startService(serviceIntent);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Disable status bar
     */
    @ReactMethod
    public void setStatusBarDisabled(boolean disabled, Promise promise) {
        try {
            if (isDeviceOwner()) {
                devicePolicyManager.setStatusBarDisabled(adminComponent, disabled);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Not device owner");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Get comprehensive device feature status
     * Returns all device capabilities, restrictions, and current states
     */
    @ReactMethod
    public void getDeviceFeatureStatus(Promise promise) {
        try {
            WritableMap status = Arguments.createMap();

            // Device Owner Status
            boolean isOwner = isDeviceOwner();
            status.putBoolean("isDeviceOwner", isOwner);

            // Lock Status
            if (lockManager != null) {
                status.putBoolean("screenLocked", lockManager.isDeviceLocked());
                status.putBoolean("kioskModeActive", lockManager.isKioskModeActive());
            } else {
                status.putBoolean("screenLocked", false);
                status.putBoolean("kioskModeActive", false);
            }

            if (isOwner && devicePolicyManager != null) {
                // Camera Status
                boolean cameraDisabled = devicePolicyManager.getCameraDisabled(adminComponent);
                status.putBoolean("cameraDisabled", cameraDisabled);

                // Screen Capture Status
                boolean screenCaptureDisabled = false;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    screenCaptureDisabled = devicePolicyManager.getScreenCaptureDisabled(adminComponent);
                }
                status.putBoolean("screenCaptureDisabled", screenCaptureDisabled);

                // Factory Reset Protection
                boolean factoryResetBlocked = devicePolicyManager.getUserRestrictions(adminComponent)
                        .getBoolean(android.os.UserManager.DISALLOW_FACTORY_RESET, false);
                status.putBoolean("factoryResetBlocked", factoryResetBlocked);

                // Safe Mode Protection
                boolean safeModeBlocked = devicePolicyManager.getUserRestrictions(adminComponent)
                        .getBoolean(android.os.UserManager.DISALLOW_SAFE_BOOT, false);
                status.putBoolean("safeModeBlocked", safeModeBlocked);

                // USB File Transfer
                boolean usbBlocked = devicePolicyManager.getUserRestrictions(adminComponent)
                        .getBoolean(android.os.UserManager.DISALLOW_USB_FILE_TRANSFER, false);
                status.putBoolean("usbFileTransferBlocked", usbBlocked);

                // Status Bar
                boolean statusBarDisabled = false;
                // getStatusBarDisabled() is not available in all Android versions
                // We track this via our own state instead
                status.putBoolean("statusBarDisabled", statusBarDisabled);
            } else {
                // Not device owner - report limited info
                status.putBoolean("cameraDisabled", false);
                status.putBoolean("screenCaptureDisabled", false);
                status.putBoolean("factoryResetBlocked", false);
                status.putBoolean("safeModeBlocked", false);
                status.putBoolean("usbFileTransferBlocked", false);
                status.putBoolean("statusBarDisabled", false);
            }

            // Location Status
            try {
                android.location.LocationManager locationManager = (android.location.LocationManager) reactContext
                        .getSystemService(Context.LOCATION_SERVICE);
                boolean locationEnabled = locationManager
                        .isProviderEnabled(android.location.LocationManager.GPS_PROVIDER) ||
                        locationManager.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER);
                status.putBoolean("locationEnabled", locationEnabled);
            } catch (Exception e) {
                status.putBoolean("locationEnabled", false);
            }

            // Battery Status
            try {
                android.content.IntentFilter ifilter = new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED);
                Intent batteryStatus = reactContext.registerReceiver(null, ifilter);
                if (batteryStatus != null) {
                    int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
                    int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1);
                    int batteryPct = (int) ((level / (float) scale) * 100);
                    status.putInt("batteryLevel", batteryPct);

                    int chargingStatus = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_STATUS, -1);
                    boolean isCharging = chargingStatus == android.os.BatteryManager.BATTERY_STATUS_CHARGING ||
                            chargingStatus == android.os.BatteryManager.BATTERY_STATUS_FULL;
                    status.putBoolean("isCharging", isCharging);
                }
            } catch (Exception e) {
                status.putInt("batteryLevel", -1);
                status.putBoolean("isCharging", false);
            }

            // Network Status
            try {
                android.net.ConnectivityManager cm = (android.net.ConnectivityManager) reactContext
                        .getSystemService(Context.CONNECTIVITY_SERVICE);
                android.net.NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
                boolean isConnected = activeNetwork != null && activeNetwork.isConnectedOrConnecting();
                status.putBoolean("networkConnected", isConnected);

                if (isConnected) {
                    String networkType = "Unknown";
                    if (activeNetwork.getType() == android.net.ConnectivityManager.TYPE_WIFI) {
                        networkType = "WiFi";
                    } else if (activeNetwork.getType() == android.net.ConnectivityManager.TYPE_MOBILE) {
                        networkType = "Mobile";
                    }
                    status.putString("networkType", networkType);
                } else {
                    status.putString("networkType", "None");
                }
            } catch (Exception e) {
                status.putBoolean("networkConnected", false);
                status.putString("networkType", "Unknown");
            }

            // USB Debugging Status
            try {
                int adbEnabled = Settings.Global.getInt(
                        reactContext.getContentResolver(),
                        Settings.Global.ADB_ENABLED,
                        0);
                status.putBoolean("usbDebuggingEnabled", adbEnabled == 1);
            } catch (Exception e) {
                status.putBoolean("usbDebuggingEnabled", false);
            }

            promise.resolve(status);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Get SIM card information and status
     */
    @ReactMethod
    public void getSimStatus(Promise promise) {
        try {
            WritableMap simInfo = Arguments.createMap();

            android.telephony.TelephonyManager telephonyManager = (android.telephony.TelephonyManager) reactContext
                    .getSystemService(Context.TELEPHONY_SERVICE);

            if (telephonyManager != null) {
                // SIM State
                int simState = telephonyManager.getSimState();
                String simStateStr = "UNKNOWN";
                boolean simReady = false;

                switch (simState) {
                    case android.telephony.TelephonyManager.SIM_STATE_ABSENT:
                        simStateStr = "ABSENT";
                        break;
                    case android.telephony.TelephonyManager.SIM_STATE_READY:
                        simStateStr = "READY";
                        simReady = true;
                        break;
                    case android.telephony.TelephonyManager.SIM_STATE_PIN_REQUIRED:
                    case android.telephony.TelephonyManager.SIM_STATE_PUK_REQUIRED:
                        simStateStr = "LOCKED";
                        break;
                    case android.telephony.TelephonyManager.SIM_STATE_UNKNOWN:
                        simStateStr = "UNKNOWN";
                        break;
                }

                simInfo.putString("simState", simStateStr);
                simInfo.putBoolean("simReady", simReady);

                if (simReady) {
                    // Operator Info
                    String operator = telephonyManager.getNetworkOperatorName();
                    simInfo.putString("operator", operator != null ? operator : "Unknown");

                    // SIM Serial (ICCID)
                    try {
                        String simSerial = telephonyManager.getSimSerialNumber();
                        simInfo.putString("iccid", simSerial != null ? simSerial : "");
                    } catch (SecurityException e) {
                        simInfo.putString("iccid", "");
                    }

                    // Phone Number
                    try {
                        String phoneNumber = telephonyManager.getLine1Number();
                        simInfo.putString("phoneNumber", phoneNumber != null ? phoneNumber : "");
                    } catch (SecurityException e) {
                        simInfo.putString("phoneNumber", "");
                    }

                    // Dual SIM Check
                    int phoneCount = 1;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        phoneCount = telephonyManager.getPhoneCount();
                    }
                    simInfo.putBoolean("isDualSim", phoneCount > 1);
                    simInfo.putInt("simCount", phoneCount);
                } else {
                    simInfo.putString("operator", "");
                    simInfo.putString("iccid", "");
                    simInfo.putString("phoneNumber", "");
                    simInfo.putBoolean("isDualSim", false);
                    simInfo.putInt("simCount", 0);
                }
            }

            promise.resolve(simInfo);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Remove Device Admin and Owner status if possible
     */
    @ReactMethod
    public void removeAdmin(Promise promise) {
        try {
            if (isDeviceOwner()) {
                try {
                    // This creates a window where the app can be uninstalled
                    devicePolicyManager.clearDeviceOwnerApp(reactContext.getPackageName());
                } catch (SecurityException e) {
                    // Expected on Android 10+ if not a test user
                    // We cannot self-destruct as DO on Android 10+ without Factory Reset
                } catch (Exception e) {
                    // Ignore
                }
            }

            if (devicePolicyManager != null && adminComponent != null) {
                if (devicePolicyManager.isAdminActive(adminComponent)) {
                    devicePolicyManager.removeActiveAdmin(adminComponent);
                }
            }

            // Clear preferences
            android.content.SharedPreferences prefs = reactContext.getSharedPreferences("PhoneLockPrefs",
                    Context.MODE_PRIVATE);
            prefs.edit().clear().apply();

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Get Technical Details (Brand, Model, Storage, RAM)
     */
    @ReactMethod
    public void getTechnicalDetails(Promise promise) {
        try {
            WritableMap map = Arguments.createMap();
            map.putString("brand", Build.BRAND);
            map.putString("model", Build.MODEL);
            map.putString("manufacturer", Build.MANUFACTURER);
            map.putString("device", Build.DEVICE);
            map.putString("androidVersion", Build.VERSION.RELEASE);
            map.putInt("sdkVersion", Build.VERSION.SDK_INT);

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (reactContext.checkSelfPermission(
                            android.Manifest.permission.READ_PHONE_STATE) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                        map.putString("serial", Build.getSerial());
                    } else {
                        map.putString("serial", Build.SERIAL);
                    }
                } else {
                    map.putString("serial", Build.SERIAL);
                }
            } catch (Exception e) {
                map.putString("serial", "unknown");
            }

            // Storage
            java.io.File path = android.os.Environment.getDataDirectory();
            android.os.StatFs stat = new android.os.StatFs(path.getPath());
            long blockSize = stat.getBlockSizeLong();
            long totalBlocks = stat.getBlockCountLong();
            long availableBlocks = stat.getAvailableBlocksLong();
            map.putDouble("totalStorage", (double) totalBlocks * blockSize);
            map.putDouble("freeStorage", (double) availableBlocks * blockSize);

            // RAM
            android.app.ActivityManager.MemoryInfo mi = new android.app.ActivityManager.MemoryInfo();
            android.app.ActivityManager activityManager = (android.app.ActivityManager) reactContext
                    .getSystemService(Context.ACTIVITY_SERVICE);
            activityManager.getMemoryInfo(mi);
            map.putDouble("totalMemory", (double) mi.totalMem);
            map.putDouble("freeMemory", (double) mi.availMem);

            // Android ID
            String androidId = android.provider.Settings.Secure.getString(reactContext.getContentResolver(),
                    android.provider.Settings.Secure.ANDROID_ID);
            map.putString("androidId", androidId);

            promise.resolve(map);

        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Download and Install APK (Device Owner Only)
     */
    @ReactMethod
    public void downloadAndInstallApk(String urlString, Promise promise) {
        try {
            if (!isDeviceOwner()) {
                promise.reject("ERROR", "Not Device Owner");
                return;
            }

            new Thread(() -> {
                try {
                    java.net.URL url = new java.net.URL(urlString);
                    java.io.File file = new java.io.File(reactContext.getExternalCacheDir(), "update.apk");
                    if (file.exists())
                        file.delete();

                    java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                    connection.connect();
                    java.io.InputStream input = new java.io.BufferedInputStream(url.openStream());
                    java.io.FileOutputStream output = new java.io.FileOutputStream(file);

                    byte[] dlBuffer = new byte[65536];
                    int dlC;
                    while ((dlC = input.read(dlBuffer)) != -1) {
                        output.write(dlBuffer, 0, dlC);
                    }
                    output.close();
                    input.close();

                    android.content.pm.PackageInstaller packageInstaller = reactContext.getPackageManager()
                            .getPackageInstaller();
                    android.content.pm.PackageInstaller.SessionParams params = new android.content.pm.PackageInstaller.SessionParams(
                            android.content.pm.PackageInstaller.SessionParams.MODE_FULL_INSTALL);

                    // Allow replacing existing app
                    params.setAppPackageName(reactContext.getPackageName());

                    int sessionId = packageInstaller.createSession(params);
                    android.content.pm.PackageInstaller.Session session = packageInstaller.openSession(sessionId);

                    try {
                        java.io.OutputStream out = session.openWrite("COSU", 0, -1);
                        java.io.FileInputStream in = new java.io.FileInputStream(file);
                        byte[] buffer = new byte[65536];
                        int c;
                        while ((c = in.read(buffer)) != -1) {
                            out.write(buffer, 0, c);
                        }
                        session.fsync(out);
                        in.close();
                        out.close();

                        // Create intent for result status
                        Intent intent = new Intent(reactContext, DeviceAdminReceiver.class);
                        intent.setAction("PACKAGE_INSTALLED");
                        android.app.PendingIntent pendingIntent = android.app.PendingIntent.getBroadcast(
                                reactContext,
                                sessionId,
                                intent,
                                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? android.app.PendingIntent.FLAG_MUTABLE
                                        : 0);

                        session.commit(pendingIntent.getIntentSender());
                        session.close();

                        promise.resolve(true);
                    } catch (Exception e) {
                        session.abandon();
                        promise.reject("ERROR", e.getMessage());
                    }
                } catch (Exception e) {
                    promise.reject("ERROR", "Update failed: " + e.getMessage());
                }
            }).start();
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getLastLocation(Promise promise) {
        try {
            android.location.LocationManager locationManager = (android.location.LocationManager) reactContext
                    .getSystemService(Context.LOCATION_SERVICE);

            if (androidx.core.app.ActivityCompat.checkSelfPermission(reactContext,
                    android.Manifest.permission.ACCESS_FINE_LOCATION) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "Location permission not granted");
                return;
            }

            android.location.Location location = locationManager
                    .getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER);
            if (location == null) {
                location = locationManager.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER);
            }

            if (location != null) {
                WritableMap map = Arguments.createMap();
                map.putDouble("latitude", location.getLatitude());
                map.putDouble("longitude", location.getLongitude());
                map.putDouble("accuracy", location.getAccuracy());
                map.putDouble("timestamp", location.getTime());
                promise.resolve(map);
            } else {
                promise.resolve(null);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
