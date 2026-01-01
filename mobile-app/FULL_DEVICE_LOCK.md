# EMI Lock - Full Device Control System

## Overview

This document describes the comprehensive device lockdown features implemented in the EMI Lock application. The app provides full admin control over customer devices including:

- **Immediate Lock on Provisioning** - Device locks automatically after QR scan
- **Power Button Protection** - Alarm triggers when shutdown is attempted
- **Kiosk Mode** - Device is locked to the app only
- **Remote Admin Control** - Lock, unlock, wipe from dashboard
- **Wallpaper Control** - Admin can set device wallpaper
- **PIN Management** - Admin can set device PIN code
- **Auto Permission Grant** - All permissions granted automatically
- **Complete Lockdown** - Disables all escape methods

---

## How It Works

### 1. Device Provisioning Flow

```
[Customer Device Factory Reset]
        ↓
[Scan QR Code with EMI Lock Provisioning]
        ↓
[Admin APK Installs as Device Owner]
        ↓
[onProfileProvisioningComplete triggers]
        ↓
[AUTOMATIC ACTIONS:]
  ├── Grant all permissions
  ├── Apply security restrictions
  ├── Lock device immediately
  ├── Start lock screen service
  ├── Send device info to backend
  └── Launch lock screen UI
        ↓
[DEVICE IS LOCKED - Admin Control Only]
```

### 2. Lock State Management

The device maintains lock state in:
- **Native SharedPreferences** - `DEVICE_LOCKED` boolean
- **Backend Database** - `customer.isLocked` field
- **React Native AsyncStorage** - `lock_status` key

All three sources are synchronized via heartbeat.

---

## Key Features

### Immediate Lock on Provisioning

When a device is provisioned via QR code:

1. `DeviceAdminReceiver.onProfileProvisioningComplete()` triggers
2. `FullDeviceLockManager.lockDeviceImmediately()` is called
3. All security restrictions are applied
4. Kiosk mode is enabled (Lock Task)
5. Lock screen is launched

**User sees lock screen immediately after setup - no interaction possible!**

### Power Button Protection

When the device is locked:

- Power button press triggers an **ALARM**
- Device vibrates continuously
- Alarm sound plays at max volume
- Cannot be silenced without admin unlock

This prevents:
- Power off attempts
- Restart attempts
- Force shutdown

### Kiosk Mode (Lock Task)

When locked, the device is pinned to the EMI Lock app:

- No home button access
- No app switcher
- No status bar
- No notifications
- No navigation buttons

**User cannot escape the lock screen!**

### Remote Admin Commands

Admin dashboard can send these commands:

| Command | Description |
|---------|-------------|
| `lock` | Lock device immediately |
| `unlock` | Unlock device, restore access |
| `wipe` | Factory reset the device |
| `setWallpaper` | Set device wallpaper from URL |
| `setPin` | Set device PIN code |
| `alarm` | Start the alarm sound |
| `stopAlarm` | Stop the alarm |
| `setLockInfo` | Set lock message and support phone |
| `grantPermissions` | Grant all runtime permissions |
| `applyRestrictions` | Apply all security restrictions |

### Security Restrictions Applied

When device is locked, these are enforced:

- ❌ Factory Reset Blocked
- ❌ Safe Mode Blocked
- ❌ USB Debugging Disabled
- ❌ USB File Transfer Blocked
- ❌ Adding Users Blocked
- ❌ WiFi Config Blocked (optional)
- ❌ Bluetooth Blocked
- ❌ Installing Apps Blocked
- ❌ Uninstalling Apps Blocked
- ❌ Camera Disabled
- ❌ Outgoing Calls Blocked (except emergency)
- ❌ SMS Blocked
- ❌ Screen Capture Blocked

---

## API Endpoints

### Heartbeat (Device → Backend)

```
POST /api/customers/heartbeat
```

Request:
```json
{
    "customerId": "CUST123",
    "deviceId": "android_id",
    "status": "online",
    "appInstalled": true,
    "location": { "lat": 12.34, "lng": 56.78 }
}
```

Response:
```json
{
    "ok": true,
    "isLocked": true,
    "command": "lock",
    "wallpaperUrl": null,
    "pin": null,
    "lockInfo": {
        "message": "Device locked due to payment overdue",
        "phone": "8876655444"
    }
}
```

### Send Command (Admin → Device)

```
POST /api/customers/:id/command
```

Request:
```json
{
    "command": "setWallpaper",
    "params": {
        "wallpaperUrl": "https://example.com/locked.jpg"
    }
}
```

---

## Native Module Methods

The `DeviceLockModule` exposes these methods to React Native:

```javascript
// Check status
DeviceLockModule.isDeviceOwner()
DeviceLockModule.isDeviceLocked()
DeviceLockModule.getAppInfo()
DeviceLockModule.getProvisioningData()

// Lock control
DeviceLockModule.lockDeviceImmediately()
DeviceLockModule.unlockDevice()
DeviceLockModule.startKioskMode()
DeviceLockModule.stopKioskMode()

// Admin features
DeviceLockModule.setWallpaper(imageUrl)
DeviceLockModule.setDevicePin(pin)
DeviceLockModule.grantAllPermissions()
DeviceLockModule.applySecurityRestrictions()

// Alarm control
DeviceLockModule.startPowerAlarm()
DeviceLockModule.stopPowerAlarm()

// Info management
DeviceLockModule.setLockInfo(message, phone)
DeviceLockModule.getLockInfo()

// Other
DeviceLockModule.wipeData()
DeviceLockModule.setSecurityHardening(enabled)
DeviceLockModule.setStatusBarDisabled(disabled)
DeviceLockModule.startLockService()
```

---

## Files Modified

### Android (Java)

| File | Purpose |
|------|---------|
| `FullDeviceLockManager.java` | **NEW** - Core lock manager with all features |
| `DeviceLockModule.java` | React Native bridge, all methods exposed |
| `DeviceAdminReceiver.java` | Immediate lock on provisioning |
| `LockScreenService.java` | Persistent service, power button monitoring |
| `BootReceiver.java` | Restore lock state on boot |
| `MainActivity.java` | Lock screen window flags, button blocking |
| `AndroidManifest.xml` | All required permissions |
| `device_admin.xml` | Admin policies |

### React Native

| File | Purpose |
|------|---------|
| `App.tsx` | Main app with lock state management |
| `LockedScreen.tsx` | Premium lock screen UI |

### Backend

| File | Purpose |
|------|---------|
| `customerRoutes.js` | Enhanced heartbeat with command params |
| `Customer.js` | New fields: lockMessage, supportPhone, wallpaperUrl |

---

## Building the APK

```bash
cd mobile-app/android

# Clean previous builds
./gradlew clean

# Build admin release APK
./gradlew assembleAdminRelease

# Output: app/build/outputs/apk/admin/release/app-admin-release.apk
```

---

## Testing Lock Features

### Test Immediate Lock

1. Factory reset a test device
2. Scan the provisioning QR code
3. Device should lock immediately after setup
4. Verify: Lock screen shows, cannot exit

### Test Power Button

1. With device locked, press power button
2. Alarm should sound
3. Vibration should start
4. Cannot turn off device

### Test Admin Commands

1. From dashboard, send `unlock` command
2. Device should unlock within 30 seconds (heartbeat)
3. User gets access back

### Test Wallpaper Change

```bash
curl -X POST https://emi-pro-app.onrender.com/api/customers/CUST123/command \
  -H "Content-Type: application/json" \
  -d '{"command": "setWallpaper", "params": {"wallpaperUrl": "https://example.com/lock.jpg"}}'
```

---

## Emergency Recovery

If you need to remove Device Owner status for testing:

```bash
adb shell dpm remove-active-admin com.securefinance.emilock/.DeviceAdminReceiver
```

Or perform factory reset (if not blocked).

---

## Support

For issues or questions, contact support at the configured phone number displayed on the lock screen.
