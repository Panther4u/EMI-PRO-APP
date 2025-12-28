# EMI Lock System - APK Usage Guide

## 📱 Two APK System Architecture

This system uses **two separate APKs** with different purposes:

### 1️⃣ **User APK** (`app-user-release.apk`)
- **Installed on**: Customer/EMI devices (the phones being financed)
- **Installation method**: QR Code provisioning as **Device Owner**
- **Purpose**: Enforce lock/unlock, kiosk mode, restrictions
- **Requires**: Device Owner privileges
- **Package ID**: `com.securefinance.emilock.user`

### 2️⃣ **Admin APK** (`app-admin-release.apk`)
- **Installed on**: Staff/admin phones (your control devices)
- **Installation method**: Normal APK install (no special setup)
- **Purpose**: Remote control interface, view device list, send lock/unlock commands
- **Requires**: NO special privileges (works like any normal app)
- **Package ID**: `com.securefinance.emilock.admin`

---

## ✅ Admin APK - Correct Usage

### What Admin APK CAN do:
- ✅ Install on ANY Android phone normally
- ✅ Open and display the Admin Control Panel
- ✅ Login and authenticate
- ✅ Fetch customer/device list from backend
- ✅ Send lock/unlock commands to User devices **via backend API**
- ✅ View real-time device status (online/offline)
- ✅ Monitor EMI payments

### What Admin APK CANNOT do:
- ❌ Lock the phone it's installed on
- ❌ Enter kiosk mode locally
- ❌ Apply device restrictions to itself
- ❌ Act as Device Owner

### Installation:
```bash
# Simple normal installation
adb install app-admin-release.apk

# Or just download and install from browser
# https://emi-pro-app.onrender.com/downloads/app-admin-release.apk
```

---

## 🔒 User APK - Device Owner Provisioning

### Prerequisites:
1. **Factory reset device** (required for Device Owner setup)
2. **Skip Google account** during setup
3. **Connect to WiFi**

### Method 1: QR Code Provisioning (Recommended)

1. **Generate QR Code** from Admin Panel
2. On factory-reset device, tap **6 times** on welcome screen
3. Scan the QR code
4. Device will:
   - Download User APK
   - Install as Device Owner
   - Apply all restrictions
   - Launch the app

### Method 2: ADB Provisioning (Manual)

```bash
# 1. Factory reset device
adb shell am broadcast -a android.intent.action.FACTORY_RESET

# 2. Install APK
adb install app-user-release.apk

# 3. Set as Device Owner
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver

# 4. Launch app
adb shell am start -n com.securefinance.emilock.user/com.securefinance.emilock.MainActivity
```

---

## 🔧 Troubleshooting

### Admin APK opens then closes immediately

**Cause**: The app is trying to execute Device Owner commands on a non-owner device.

**Solution**: This should NOT happen with v0.0.5+. If it does:
1. Uninstall the app completely
2. Download the latest version
3. Reinstall

**Debug**:
```bash
adb logcat | grep -i "SecurityException\|DeviceLockModule"
```

### User APK won't enter Device Owner mode

**Error**: "Not allowed to set the device owner because..."

**Causes**:
- Device not factory reset
- Google account already added
- Another Device Owner exists
- Developer options enabled

**Solution**:
1. Full factory reset
2. Do NOT add Google account
3. Skip all setup steps
4. Try provisioning immediately

---

## 📊 System Flow

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Admin APK     │────────▶│   Backend    │◀────────│   User APK      │
│  (Staff Phone)  │  API    │   Server     │  Poll   │ (Customer Phone)│
└─────────────────┘         └──────────────┘         └─────────────────┘
        │                           │                          │
        │ 1. Click "Lock"           │                          │
        ├──────────────────────────▶│                          │
        │                           │ 2. Update DB             │
        │                           │    isLocked=true         │
        │                           │                          │
        │                           │ 3. Heartbeat poll        │
        │                           │◀─────────────────────────┤
        │                           │                          │
        │                           │ 4. Return lock=true      │
        │                           ├─────────────────────────▶│
        │                           │                          │
        │                           │                  5. Enter Kiosk Mode
        │                           │                     Block navigation
```

---

## 🛡️ Security Features (v0.0.5)

### User APK Enforcements:
- ✅ Kiosk Mode (Lock Task) - prevents app switching
- ✅ Factory Reset blocked
- ✅ Safe Mode blocked
- ✅ USB Debugging disabled
- ✅ USB File Transfer blocked
- ✅ Back button disabled on lock screen

### Admin APK Safety:
- ✅ Never attempts local device control
- ✅ All commands sent via backend API
- ✅ Gracefully handles missing Device Owner privileges
- ✅ Works on any Android phone (no special setup)

---

## 📋 Version History

### v0.0.5 (Current)
- ✅ 16 KB page alignment (Android 15+ ready)
- ✅ Admin APK crash fix (Device Owner guards)
- ✅ Security hardening (factory reset block, etc.)
- ✅ Real-time online/offline status
- ✅ Kiosk mode implementation

### v0.0.4
- Initial kiosk mode
- Online status indicators

### v0.0.3
- Auto-update feature
- Connectivity fixes

---

## 🚀 Deployment

### Backend (Render):
```bash
git push origin main
# Auto-deploys to https://emi-pro-app.onrender.com
```

### APK Distribution:
- **Admin APK**: https://emi-pro-app.onrender.com/downloads/app-admin-release.apk
- **User APK**: https://emi-pro-app.onrender.com/downloads/app-user-release.apk

### QR Code Generation:
- Automatically includes WiFi credentials
- Embeds server URL and customer ID
- Downloads and provisions User APK automatically

---

## ⚠️ Important Notes

1. **Admin APK is NOT a Device Owner** - It's a remote control interface only
2. **User APK MUST be Device Owner** - Otherwise restrictions won't work
3. **One Device Owner per device** - Cannot have multiple
4. **Factory reset required** - To remove Device Owner status
5. **Test on real devices** - Emulators may not support all Device Owner features

---

## 📞 Support

For issues or questions:
1. Check `adb logcat` for errors
2. Verify backend is running
3. Confirm device has internet connection
4. Ensure correct APK is installed on correct device type
