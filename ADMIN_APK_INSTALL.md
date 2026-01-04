# 📱 Admin APK ("SecurePro") - ADB Installation Guide

## 🎯 Quick Install Commands

### Step 1: Connect Device via USB

```bash
# Enable USB debugging on the device first:
# Settings → About Phone → Tap "Build Number" 7 times
# Settings → Developer Options → Enable "USB Debugging"

# Connect device and verify
adb devices

# Should show:
# List of devices attached
# ABC123XYZ    device
```

### Step 2: Install Admin APK

```bash
# Navigate to project root
cd /Volumes/Kavi/Emi\ Pro/EMI-PRO

# Install the Admin APK
adb install mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk

# Expected output:
# Performing Streamed Install
# Success
```

### Step 3: Launch the App

```bash
# Launch SecurePro app
adb shell am start -n com.securefinance.emilock.admin/.MainActivity

# Or just tap the "SecurePro" icon on the device
```

---

## 🔧 Alternative: Install Specific APK File

If the APK is in a different location:

```bash
# Install from specific path
adb install /path/to/app-admin-release.apk

# Install with -r flag to replace existing app
adb install -r /path/to/app-admin-release.apk

# Install with -g flag to grant all permissions
adb install -r -g /path/to/app-admin-release.apk
```

---

## 🐛 Troubleshooting

### Error: "adb: command not found"

**Fix:**
```bash
# Install Android SDK Platform Tools
# Download from: https://developer.android.com/studio/releases/platform-tools

# Or use Homebrew (macOS)
brew install android-platform-tools
```

### Error: "no devices/emulators found"

**Fix:**
1. Enable USB debugging on device
2. Connect via USB cable
3. Accept "Allow USB debugging" prompt on device
4. Run `adb devices` again

### Error: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"

**Fix:**
```bash
# Uninstall old version first
adb uninstall com.securefinance.emilock.admin

# Then install new version
adb install mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk
```

### Error: "INSTALL_FAILED_INSUFFICIENT_STORAGE"

**Fix:**
- Free up space on device
- Or install on SD card: `adb install -s /path/to/apk`

---

## 📦 APK Details

**App Name:** SecurePro  
**Package:** com.securefinance.emilock.admin  
**Version:** 2.0.4  
**Size:** ~37MB  
**Installation Type:** Normal (not Device Owner)  

---

## ✅ Verify Installation

```bash
# Check if app is installed
adb shell pm list packages | grep securefinance

# Should show:
# package:com.securefinance.emilock.admin

# Get app info
adb shell dumpsys package com.securefinance.emilock.admin | grep version

# Launch the app
adb shell am start -n com.securefinance.emilock.admin/.MainActivity
```

---

## 🔄 Update/Reinstall

```bash
# Uninstall old version
adb uninstall com.securefinance.emilock.admin

# Install new version
adb install mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk

# Or use -r flag to replace without uninstalling
adb install -r mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk
```

---

## 📱 Install on Multiple Devices

```bash
# List all connected devices
adb devices

# Install on specific device
adb -s DEVICE_SERIAL install /path/to/apk

# Install on all connected devices
for device in $(adb devices | grep -v "List" | awk '{print $1}'); do
    echo "Installing on $device..."
    adb -s $device install -r mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk
done
```

---

## 🎯 Quick Reference

```bash
# Build Admin APK
cd mobile-app/android && ./gradlew assembleAdminRelease

# Install
adb install mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk

# Launch
adb shell am start -n com.securefinance.emilock.admin/.MainActivity

# Uninstall
adb uninstall com.securefinance.emilock.admin

# Check logs
adb logcat | grep SecurePro
```

---

**Once the build completes, use the commands above to install SecurePro on your staff devices!** 📲
