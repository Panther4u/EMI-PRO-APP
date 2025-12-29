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

public class DeviceLockModule extends ReactContextBaseJavaModule {

    private DevicePolicyManager devicePolicyManager;
    private ComponentName adminComponent;
    private ReactApplicationContext reactContext;

    public DeviceLockModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        try {
            this.devicePolicyManager = (DevicePolicyManager) reactContext
                    .getSystemService(Context.DEVICE_POLICY_SERVICE);
            this.adminComponent = new ComponentName(reactContext, DeviceAdminReceiver.class);
        } catch (Exception e) {
            // Safely handle cases where Device Admin is not available
            // This allows Admin APK to work as remote control without local privileges
            android.util.Log.w("DeviceLockModule", "Device Admin not available: " + e.getMessage());
            this.devicePolicyManager = null;
            this.adminComponent = null;
        }
    }

    @Override
    public String getName() {
        return "DeviceLockModule";
    }

    private boolean isDeviceOwner() {
        return devicePolicyManager != null && devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName());
    }

    @ReactMethod
    public void isDeviceOwner(Promise promise) {
        promise.resolve(isDeviceOwner());
    }

    @ReactMethod
    public void requestAdminPermission(Promise promise) {
        try {
            if (isDeviceOwner()) {
                promise.resolve(true); // Already owner
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
    public void getIMEI(Promise promise) {
        try {
            String deviceId = null;
            // Try to get actual IMEI if we have permission/ownership
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

            // Fallback to Android ID
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
                com.facebook.react.bridge.WritableMap map = com.facebook.react.bridge.Arguments.createMap();
                map.putString("operator", info.getCarrierName().toString());

                // Try to get phone number safely
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

            if (isProvisioned && customerId != null) {
                com.facebook.react.bridge.WritableMap map = com.facebook.react.bridge.Arguments.createMap();
                map.putString("serverUrl", serverUrl);
                map.putString("customerId", customerId);
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
            com.facebook.react.bridge.WritableMap map = com.facebook.react.bridge.Arguments.createMap();
            map.putString("packageName", reactContext.getPackageName());
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
                getCurrentActivity().startLockTask();
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
            // Silently resolve if it fails on non-owner or inactive lock task
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void setSecurityHardening(boolean enabled, Promise promise) {
        try {
            if (isDeviceOwner()) {
                // Block Factory Reset
                devicePolicyManager.addUserRestriction(adminComponent,
                        android.os.UserManager.DISALLOW_FACTORY_RESET);

                // Block Safe Mode entry (on supported devices)
                devicePolicyManager.addUserRestriction(adminComponent,
                        android.os.UserManager.DISALLOW_SAFE_BOOT);

                // Block USB Debugging (Developer Options)
                devicePolicyManager.setGlobalSetting(adminComponent,
                        android.provider.Settings.Global.ADB_ENABLED, "0");

                // Block USB File Transfer
                devicePolicyManager.addUserRestriction(adminComponent,
                        android.os.UserManager.DISALLOW_USB_FILE_TRANSFER);

                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Not device owner");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
