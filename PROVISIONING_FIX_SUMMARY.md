# QR Provisioning Fix - "Invalid QR" Issue Resolution

## Problem Identified
After installing the app via QR code provisioning, the device was showing:
```
Invalid QR
QR code missing customerId
```

This happened because the provisioning credentials (customerId and serverUrl) were not being persisted properly for the React Native app to access after installation.

## Root Cause
The Android Device Owner provisioning flow works in two stages:
1. **QR Scan During Factory Reset** → Downloads and installs the Admin APK
2. **App First Launch** → App needs to know which customer it belongs to

The problem was that the `DeviceAdminReceiver.onProfileProvisioningComplete()` method was collecting and sending device info to the backend, but **NOT persisting** the provisioning data locally for the React Native app to read.

## Solution Implemented

### 1. **DeviceAdminReceiver.java** - Added Persistence Logic
```java
// PERSIST for React Native (DeviceLockModule) to pick up
android.content.SharedPreferences prefs = context.getSharedPreferences("PhoneLockPrefs", Context.MODE_PRIVATE);
prefs.edit()
    .putString("SERVER_URL", serverUrl)
    .putString("CUSTOMER_ID", customerId)
    .putBoolean("IS_PROVISIONED", true)
    .apply();
```

**What this does:**
- Saves the `customerId` and `serverUrl` from the QR code to SharedPreferences
- Marks the device as provisioned with `IS_PROVISIONED = true`
- This data is then accessible to the React Native app via `DeviceLockModule.getProvisioningData()`

### 2. **SetupScreen.tsx** - Improved QR Parsing
Added robust parsing for the admin extras bundle to handle edge cases:
```typescript
// Handle double-encoded JSON case
if (typeof extras === 'string') {
    try {
        extras = JSON.parse(extras);
    } catch (e) {
         console.warn("Failed to parse nested extras", e);
    }
}
customerId = extras?.customerId;
serverUrl = extras?.serverUrl;
```

**What this does:**
- Handles cases where the admin extras bundle might be stringified
- Uses optional chaining to safely access nested properties
- Prevents crashes from malformed QR data

## How It Works Now

### Provisioning Flow:
1. **Factory Reset Device** → Tap 6 times on welcome screen
2. **Scan QR Code** → Contains provisioning payload with customerId
3. **APK Downloads** → `securefinance-admin.apk` from backend
4. **Device Owner Setup** → Android grants Device Owner privileges
5. **`onProfileProvisioningComplete()` Fires:**
   - Collects device info (brand, model, IMEI/Android ID)
   - Sends to backend via `DeviceInfoCollector`
   - **NEW:** Persists customerId + serverUrl to SharedPreferences
   - Launches the app
6. **App First Launch:**
   - `App.tsx` calls `DeviceLockModule.getProvisioningData()`
   - Reads customerId and serverUrl from SharedPreferences
   - Saves to AsyncStorage as `enrollment_data`
   - **No manual QR scan needed!**
7. **App Operates Normally** → Device is enrolled and ready

## Files Modified

1. **`/mobile-app/android/app/src/main/java/com/securefinance/emilock/DeviceAdminReceiver.java`**
   - Added SharedPreferences persistence in `onProfileProvisioningComplete()`

2. **`/mobile-app/src/screens/SetupScreen.tsx`**
   - Improved QR parsing to handle stringified admin extras

3. **`/backend/public/securefinance-admin.apk`**
   - Rebuilt with the fixes (37MB, built Jan 1 02:19)

## Testing Instructions

1. **Factory reset a test device**
2. **Generate a QR code** from the admin dashboard for a customer
3. **During setup, tap 6 times** on the welcome screen
4. **Scan the QR code**
5. **Wait for provisioning** to complete
6. **App should launch automatically** and be fully enrolled
7. **Verify:** No "Invalid QR" error, device appears in dashboard

## Expected Behavior

✅ **Before Fix:**
- App installs via QR
- App launches but shows "Invalid QR" error
- User stuck at setup screen

✅ **After Fix:**
- App installs via QR
- App launches and automatically enrolls
- Device appears in dashboard immediately
- Lock screen shows customer info

## Technical Notes

- The `DeviceLockModule.getProvisioningData()` bridge method was already implemented
- The `App.tsx` already had logic to read provisioning data
- The missing piece was **persisting** the data during provisioning
- This fix completes the end-to-end provisioning flow

## Deployment

The updated APK has been copied to:
```
/backend/public/securefinance-admin.apk
```

**Next Steps:**
1. Deploy the backend with the new APK
2. Test on a real device with factory reset
3. Verify the entire provisioning flow works end-to-end

---
**Date:** January 1, 2026, 02:19 AM IST
**Build Time:** 8m 19s
**APK Size:** 37MB
