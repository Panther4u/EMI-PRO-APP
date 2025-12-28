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
        this.devicePolicyManager = (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
        this.adminComponent = new ComponentName(reactContext, DeviceAdminReceiver.class);
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
        boolean isActive = devicePolicyManager.isAdminActive(adminComponent);
        promise.resolve(isActive);
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
        // Note: READ_PHONE_STATE permission required
        // On Android 10+, getting IMEI is restricted. unique ID is preferred.
        String androidId = Settings.Secure.getString(reactContext.getContentResolver(), Settings.Secure.ANDROID_ID);
        promise.resolve(androidId);
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
            if (devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName())) {
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
            if (devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName())) {
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
