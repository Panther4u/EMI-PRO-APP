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

    @ReactMethod
    public void requestAdminPermission(Promise promise) {
        try {
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
            if (devicePolicyManager.isAdminActive(adminComponent)) {
                devicePolicyManager.lockNow();
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Device admin not active");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void disableCamera(boolean disable, Promise promise) {
        try {
            if (devicePolicyManager.isAdminActive(adminComponent)) {
                devicePolicyManager.setCameraDisabled(adminComponent, disable);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Device admin not active");
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
}
