# 📱 EMI Lock System - APK Installation Guide

## 🎯 Quick Answer

| APK Type | Install Where | Installation Method | Purpose |
|----------|---------------|---------------------|---------|
| **Admin APK** | Staff/Admin phones | Normal install (like any app) | Remote control & monitoring |
| **User APK** | Customer devices (EMI phones) | QR Code provisioning as Device Owner | Lock/unlock enforcement |

---

## 📦 Current APK Locations

### Production APK (Latest):
```
backend/public/downloads/securefinance-admin-v2.1.2.apk
```
- **Version:** 2.1.2 (versionCode: 24)
- **Size:** ~37MB
- **Download URL:** https://emi-pro-app.onrender.com/downloads/securefinance-admin-v2.1.2.apk

### Build Outputs (After Building):
```
mobile-app/android/app/build/outputs/apk/
├── admin/release/app-admin-release.apk    (Admin APK)
└── user/release/app-user-release.apk      (User APK)
```

---

## 1️⃣ Admin APK Installation (Staff Phones)

### 🎯 **Who Uses This:**
- Shop owners
- Finance managers
- Staff members who need to monitor/control customer devices

### 📱 **Install On:**
- Your personal Android phone
- Staff Android phones
- Any Android device (no special requirements)

### ✅ **Installation Steps:**

#### Method A: Direct Download (Easiest)
1. Open browser on staff phone
2. Go to: `https://emi-pro-app.onrender.com/downloads/securefinance-admin-v2.1.2.apk`
3. Download the APK
4. Tap to install (allow "Install from unknown sources" if prompted)
5. Open the app and login

#### Method B: ADB Install
```bash
# Connect staff phone via USB
adb devices

# Install the APK
adb install backend/public/downloads/securefinance-admin-v2.1.2.apk

# Or build and install fresh
cd mobile-app/android
./gradlew assembleAdminRelease
adb install app/build/outputs/apk/admin/release/app-admin-release.apk
```

#### Method C: Share via File Transfer
1. Copy APK to Google Drive/Dropbox/WhatsApp
2. Download on staff phone
3. Install normally

### 🔑 **Package Details:**
- **Package ID:** `com.securefinance.emilock.admin`
- **App Name:** "EMI Admin"
- **Permissions:** Normal (no Device Owner needed)
- **Can be uninstalled:** Yes (like any normal app)

### ✅ **What Admin APK Can Do:**
- ✅ Login with admin credentials
- ✅ View all customer devices
- ✅ Send lock/unlock commands (via backend API)
- ✅ Monitor device status (online/offline)
- ✅ View payment history
- ✅ Manage customer information

### ❌ **What Admin APK CANNOT Do:**
- ❌ Lock the phone it's installed on
- ❌ Control the staff phone itself
- ❌ Require Device Owner privileges
- ❌ Restrict the staff phone

---

## 2️⃣ User APK Installation (Customer Devices - Device Owner)

### 🎯 **Who Uses This:**
- Customers buying phones on EMI
- Devices being financed
- Phones that need lock/unlock enforcement

### 📱 **Install On:**
- Customer's EMI device (the phone being sold/financed)
- Must be factory reset
- Must become Device Owner

### ⚠️ **CRITICAL Requirements:**
1. ✅ Device must be **factory reset**
2. ✅ **NO Google account** added during setup
3. ✅ **WiFi connected**
4. ✅ Device must be on **welcome/setup screen**

### ✅ **Installation Steps:**

#### Method A: QR Code Provisioning (Recommended - Production)

**Step 1: Generate QR Code from Admin Panel**
1. Login to Admin Panel (web or Admin APK)
2. Go to "Add Customer" or "Provision Device"
3. Enter customer details:
   - Name
   - Phone number
   - IMEI (optional - will auto-fetch)
   - Address
4. Click "Generate QR Code"
5. QR code will include:
   - WiFi credentials
   - Server URL
   - Customer ID
   - APK download link

**Step 2: Provision Customer Device**
1. Factory reset the customer device
2. On the welcome screen, tap **6 times** anywhere
3. Device will prompt "Scan QR code"
4. Scan the QR code from Admin Panel
5. Device will automatically:
   - Connect to WiFi
   - Download User APK from server
   - Install as Device Owner
   - Apply all restrictions
   - Launch the app
   - Report to backend

**Step 3: Verify**
- Device should show "EMI Lock" app
- Admin panel should show device as "ACTIVE"
- Try locking/unlocking from admin panel

#### Method B: ADB Provisioning (Manual - Testing/Development)

```bash
# Step 1: Factory reset device
adb shell am broadcast -a android.intent.action.FACTORY_RESET
# Wait for device to restart and show welcome screen

# Step 2: Build User APK (if not already built)
cd mobile-app/android
./gradlew assembleUserRelease

# Step 3: Install User APK
adb install app/build/outputs/apk/user/release/app-user-release.apk

# Step 4: Set as Device Owner (CRITICAL!)
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver

# Expected output: "Success: Device owner set to package com.securefinance.emilock.user"

# Step 5: Launch the app
adb shell am start -n com.securefinance.emilock.user/com.securefinance.emilock.MainActivity

# Step 6: Verify Device Owner status
adb shell dumpsys device_policy | grep -A 20 "Device Owner"
```

### 🔑 **Package Details:**
- **Package ID:** `com.securefinance.emilock.user`
- **App Name:** "EMI Lock"
- **Permissions:** Device Owner (full device control)
- **Can be uninstalled:** NO (requires factory reset)

### ✅ **What User APK Can Do:**
- ✅ Lock device into kiosk mode
- ✅ Block factory reset
- ✅ Disable USB debugging
- ✅ Block safe mode
- ✅ Prevent app switching when locked
- ✅ Show payment screen
- ✅ Communicate with backend (heartbeat)

---

## 🔧 Building APKs from Source

### Build Admin APK:
```bash
cd mobile-app/android
./gradlew assembleAdminRelease

# Output: app/build/outputs/apk/admin/release/app-admin-release.apk
```

### Build User APK:
```bash
cd mobile-app/android
./gradlew assembleUserRelease

# Output: app/build/outputs/apk/user/release/app-user-release.apk
```

### Build Both:
```bash
cd mobile-app/android
./gradlew assembleRelease

# Outputs both APKs
```

### Deploy to Server:
```bash
# Copy Admin APK to backend public folder
cp mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk \
   backend/public/downloads/securefinance-admin-v2.1.2.apk

# Update version.json
echo '{"version":"2.1.2","versionCode":24,"downloadUrl":"/downloads/securefinance-admin-v2.1.2.apk"}' > \
   backend/public/downloads/version.json

# Push to Render
git add .
git commit -m "Update APK to v2.1.2"
git push origin main
```

---

## 🛠️ Troubleshooting

### Admin APK Issues:

**Problem:** "App keeps closing"
```bash
# Check logs
adb logcat | grep -i "emilock\|crash"

# Solution: Reinstall latest version
adb uninstall com.securefinance.emilock.admin
adb install backend/public/downloads/securefinance-admin-v2.1.2.apk
```

**Problem:** "Cannot login"
- Check internet connection
- Verify backend is running: https://emi-pro-app.onrender.com/health
- Check credentials in database

### User APK Issues:

**Problem:** "Not allowed to set the device owner"
```
Causes:
- Device not factory reset
- Google account already added
- Another app is Device Owner
- Developer options enabled

Solution:
1. Full factory reset
2. Do NOT add Google account
3. Skip all setup steps
4. Try provisioning immediately
```

**Problem:** "Device Owner set successfully but app crashes"
```bash
# Check logs
adb logcat | grep -i "emilock\|deviceadmin\|crash"

# Verify Device Owner
adb shell dumpsys device_policy | grep "Device Owner"

# Check if app has necessary permissions
adb shell dumpsys package com.securefinance.emilock.user | grep permission
```

**Problem:** "QR code provisioning fails"
```
Checklist:
✅ Device is factory reset
✅ WiFi credentials in QR are correct
✅ Backend server is accessible
✅ APK exists at: backend/public/downloads/securefinance-admin-v2.1.2.apk
✅ APK checksum is correct in QR payload

Debug:
- Check backend logs: backend/logs/combined-*.log
- Verify QR payload includes all required fields
- Test APK download URL manually in browser
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EMI Lock System                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────┐         ┌──────────────────┐
│   Admin APK      │         │   Backend    │         │   User APK       │
│ (Staff Phone)    │────────▶│   Server     │◀────────│ (Customer Phone) │
│                  │  HTTPS  │  (Render)    │  HTTPS  │                  │
└──────────────────┘         └──────────────┘         └──────────────────┘
                                     │
Package:                             │                 Package:
com.securefinance                    │                 com.securefinance
  .emilock.admin                     │                   .emilock.user
                                     │
Normal Install              MongoDB Atlas              Device Owner
No privileges               (Database)                  Full Control
                                     │
                            ┌────────┴────────┐
                            │                 │
                     Customer Data      Device Status
                     EMI Records        Lock/Unlock
                     Payment Info       Heartbeat
```

---

## 📋 Quick Reference

### Admin APK:
- **Install:** Normal (like any app)
- **Where:** Staff phones
- **Purpose:** Remote control
- **Uninstall:** Yes (anytime)

### User APK:
- **Install:** QR Code or ADB (as Device Owner)
- **Where:** Customer EMI devices
- **Purpose:** Enforcement & restriction
- **Uninstall:** No (factory reset required)

### URLs:
- **Backend:** https://emi-pro-app.onrender.com
- **Admin APK:** https://emi-pro-app.onrender.com/downloads/securefinance-admin-v2.1.2.apk
- **Health Check:** https://emi-pro-app.onrender.com/health

---

## 🚀 Production Deployment Checklist

### Before Deploying New APK:

1. ✅ Test both Admin and User APKs
2. ✅ Verify Device Owner provisioning works
3. ✅ Test lock/unlock functionality
4. ✅ Check heartbeat communication
5. ✅ Update version number in `build.gradle`
6. ✅ Build release APKs
7. ✅ Copy to `backend/public/downloads/`
8. ✅ Update `version.json`
9. ✅ Test download URL
10. ✅ Push to Render
11. ✅ Verify deployment
12. ✅ Test QR code provisioning with new APK

---

## 📞 Support

For issues:
1. Check logs: `adb logcat`
2. Verify backend: https://emi-pro-app.onrender.com/health
3. Check device internet connection
4. Confirm correct APK on correct device type
5. Review this guide for troubleshooting steps
