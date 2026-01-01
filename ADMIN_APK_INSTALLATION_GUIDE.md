# HOW TO INSTALL ADMIN APK ON DEVICE

## 🎯 TWO INSTALLATION METHODS

There are **two ways** to install the Admin APK, depending on your use case:

---

## METHOD 1: QR CODE PROVISIONING (RECOMMENDED)
### **For Device Owner Setup - Full Control**

This is the **proper way** to set up the Admin APK with full Device Owner privileges.

### **Requirements:**
- ✅ Factory-reset Android device
- ✅ Android 7.0+ (API 24+)
- ✅ Device NOT already set up
- ✅ QR code from admin dashboard

### **Steps:**

#### **1. Prepare the Device**
```bash
# Factory reset the device
Settings → System → Reset → Factory data reset
```

#### **2. Generate QR Code**
- Go to admin dashboard: `https://emi-pro-app.onrender.com`
- Create a customer with IMEI
- Click "Generate QR Code"
- QR code will contain provisioning config

#### **3. Start Device Setup**
- Turn on factory-reset device
- Follow setup wizard
- **On the welcome screen, tap 6 times quickly**
- You'll see: "Scan QR code to set up device"

#### **4. Scan QR Code**
- Point camera at QR code
- Device will:
  - ✅ Download Admin APK from server
  - ✅ Install as Device Owner
  - ✅ Grant full privileges
  - ✅ Launch app automatically

#### **5. Verify Installation**
```bash
# Check if device owner is set (via ADB)
adb shell dpm list-owners

# Expected output:
# Device Owner:
# admin=com.securefinance.emilock.admin/com.securefinance.emilock.DeviceAdminReceiver
```

### **What You Get:**
- ✅ Full Device Owner privileges
- ✅ Can lock/unlock device remotely
- ✅ Can wipe device
- ✅ Can disable factory reset
- ✅ Can track location
- ✅ Can detect SIM changes
- ✅ IMEI-based auto-matching works

---

## METHOD 2: MANUAL APK INSTALLATION
### **For Testing/Development - Limited Privileges**

This is for **testing only**. The app will work but won't have Device Owner privileges.

### **Requirements:**
- ✅ Any Android device (doesn't need factory reset)
- ✅ USB cable + ADB installed
- ✅ OR file transfer method

### **Option A: Install via ADB**

#### **1. Enable Developer Options**
```
Settings → About Phone → Tap "Build Number" 7 times
Settings → Developer Options → Enable "USB Debugging"
```

#### **2. Connect Device**
```bash
# Connect via USB
adb devices

# Expected output:
# List of devices attached
# ABC123XYZ    device
```

#### **3. Install APK**
```bash
# Navigate to APK location
cd /Volumes/Kavi/Emi\ Pro/EMI-PRO/backend/public

# Install Admin APK
adb install securefinance-admin.apk

# Or force reinstall if already installed
adb install -r securefinance-admin.apk
```

#### **4. Launch App**
```bash
# Launch the app
adb shell am start -n com.securefinance.emilock.admin/.MainActivity
```

### **Option B: Install via File Transfer**

#### **1. Transfer APK to Device**
```bash
# Via ADB
adb push /Volumes/Kavi/Emi\ Pro/EMI-PRO/backend/public/securefinance-admin.apk /sdcard/Download/

# Or use Google Drive, email, etc.
```

#### **2. Install on Device**
- Open "Files" or "Downloads" app
- Tap `securefinance-admin.apk`
- Allow "Install from Unknown Sources" if prompted
- Tap "Install"

### **Option C: Install via URL**

#### **1. Open Browser on Device**
- Go to: `https://emi-pro-app.onrender.com/downloads/securefinance-admin.apk`
- APK will download
- Tap notification to install

### **Limitations (Manual Install):**
- ❌ NOT Device Owner (limited privileges)
- ❌ Cannot lock device remotely
- ❌ Cannot wipe device
- ❌ Cannot disable factory reset
- ✅ Can still track location (with permission)
- ✅ Can still show lock screen UI
- ⚠️ User can uninstall the app

---

## METHOD COMPARISON

| Feature | QR Provisioning | Manual Install |
|---------|----------------|----------------|
| **Device Owner** | ✅ Yes | ❌ No |
| **Remote Lock** | ✅ Yes | ❌ No |
| **Remote Wipe** | ✅ Yes | ❌ No |
| **Factory Reset Block** | ✅ Yes | ❌ No |
| **Location Tracking** | ✅ Yes | ✅ Yes (with permission) |
| **SIM Detection** | ✅ Yes | ✅ Yes |
| **User Can Uninstall** | ❌ No | ✅ Yes |
| **Requires Factory Reset** | ✅ Yes | ❌ No |
| **Best For** | Production | Testing/Development |

---

## 🚀 RECOMMENDED WORKFLOW

### **For Production Devices:**
1. Use **QR Code Provisioning** (Method 1)
2. Factory reset device
3. Scan QR during setup
4. Device becomes fully managed

### **For Testing/Development:**
1. Use **Manual Installation** (Method 2)
2. Install via ADB or file transfer
3. Test app functionality
4. No Device Owner privileges (limited features)

### **For Admin/Office Devices:**
1. Use **Manual Installation** (Method 2)
2. Install from browser URL
3. Use for dashboard access only

---

## 🔧 TROUBLESHOOTING

### **QR Provisioning Issues:**

**Problem: "Can't set up device"**
- ✅ Ensure device is factory reset
- ✅ Check APK is accessible: `https://emi-pro-app.onrender.com/downloads/securefinance-admin.apk`
- ✅ Verify checksum in QR payload
- ✅ Check backend logs for errors

**Problem: "Invalid QR"**
- ✅ This should be FIXED in v0.0.8
- ✅ Ensure backend is deployed with latest version
- ✅ Check QR contains provisioning config (not just customerId)

**Problem: Device stuck on "Getting ready for work"**
- ✅ Wait 2-3 minutes
- ✅ Check internet connection
- ✅ Verify APK download URL is correct
- ✅ Check `adb logcat` for errors

### **Manual Install Issues:**

**Problem: "App not installed"**
- ✅ Enable "Install from Unknown Sources"
- ✅ Check APK is not corrupted
- ✅ Verify device has enough storage

**Problem: "Parse error"**
- ✅ APK might be corrupted during download
- ✅ Re-download or transfer again
- ✅ Verify APK size is ~37MB

**Problem: App crashes on launch**
- ✅ Check Android version (needs 7.0+)
- ✅ Clear app data and cache
- ✅ Reinstall APK
- ✅ Check `adb logcat` for errors

---

## 📱 QUICK REFERENCE

### **QR Provisioning (Production):**
```bash
1. Factory reset device
2. Tap welcome screen 6 times
3. Scan QR code
4. Wait for installation
5. App launches automatically
```

### **ADB Install (Testing):**
```bash
adb install /path/to/securefinance-admin.apk
adb shell am start -n com.securefinance.emilock.admin/.MainActivity
```

### **Browser Install (Quick):**
```
https://emi-pro-app.onrender.com/downloads/securefinance-admin.apk
```

---

## 🎯 WHICH METHOD SHOULD YOU USE?

### **Use QR Provisioning if:**
- ✅ Setting up customer devices
- ✅ Need full Device Owner control
- ✅ Need remote lock/wipe
- ✅ Device can be factory reset

### **Use Manual Install if:**
- ✅ Testing the app
- ✅ Development/debugging
- ✅ Admin's personal device
- ✅ Cannot factory reset device

---

## 📊 INSTALLATION STATUS CHECK

### **After QR Provisioning:**
```bash
# Check Device Owner status
adb shell dpm list-owners

# Check app is installed
adb shell pm list packages | grep securefinance

# Check app version
adb shell dumpsys package com.securefinance.emilock.admin | grep versionName
```

### **After Manual Install:**
```bash
# Check app is installed
adb shell pm list packages | grep securefinance

# Launch app
adb shell monkey -p com.securefinance.emilock.admin 1
```

---

## 🔐 SECURITY NOTES

### **QR Provisioning:**
- ✅ Most secure method
- ✅ Device is fully managed
- ✅ User cannot uninstall
- ✅ Admin has full control

### **Manual Install:**
- ⚠️ Less secure
- ⚠️ User can uninstall
- ⚠️ Limited privileges
- ⚠️ Only for testing

---

**For production use, ALWAYS use QR Code Provisioning!** 🎯
