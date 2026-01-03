# 🔍 "Can't Setup Device" Error - Troubleshooting Guide

## ✅ Current Status (As of now)

- ✅ **APK is deployed to Render** - HTTP 200, accessible
- ✅ **Checksum is correct** - Matches the APK
- ✅ **Provisioning endpoint works** - Returns valid payload
- ✅ **Backend is running** - Server is accessible
- ⚠️ **WiFi config missing from QR** - This might be the issue

## 🎯 Most Likely Causes (In Order)

### 1. ⚠️ **WiFi Configuration Not in QR Code** (MOST LIKELY)

The device needs WiFi to download the APK. If WiFi credentials aren't in the QR code, the device can't connect to the internet.

**Check:**
- Did you enter WiFi SSID and Password when generating the QR?
- Are the WiFi credentials correct?

**Solution:**
1. Go to Admin Panel → Add Customer
2. **IMPORTANT:** Fill in the WiFi section:
   - WiFi SSID: `Your_Network_Name`
   - WiFi Password: `Your_Password`
3. Generate QR code
4. Try provisioning again

**Alternative:** Manually connect device to WiFi before scanning QR:
1. On welcome screen, connect to WiFi manually
2. Then tap 6 times and scan QR
3. Device will already have internet

---

### 2. 🔄 **Device Not Properly Factory Reset**

The device must be completely reset with NO accounts added.

**Requirements:**
- ✅ Full factory reset completed
- ✅ NO Google account added
- ✅ NO other apps installed
- ✅ Device on welcome screen (not setup complete)
- ✅ NO SIM card (optional, but recommended for testing)

**How to Properly Reset:**
```
1. Settings → System → Reset options
2. Erase all data (factory reset)
3. Confirm and wait for reset
4. Device restarts to welcome screen
5. DO NOT tap "Start" or "Next"
6. DO NOT add Google account
7. DO NOT skip setup
8. Stay on welcome screen
9. Tap 6 times anywhere
10. Scan QR code
```

---

### 3. 📱 **Device Manufacturer Restrictions**

Some manufacturers block Device Owner provisioning.

**Known Issues:**
- **Xiaomi/Redmi:** Often blocks Device Owner
- **Oppo/Realme:** May require developer mode disabled
- **Vivo:** Sometimes blocks provisioning
- **Samsung:** Usually works fine
- **Google Pixel:** Always works

**Solution:**
- Try a different device (Samsung or Pixel recommended)
- OR use ADB manual provisioning instead of QR

---

### 4. 🌐 **Network/Firewall Issues**

The device might not be able to reach Render servers.

**Check:**
- Is the WiFi network blocking downloads?
- Is there a firewall blocking APK downloads?
- Can you access https://emi-pro-app.onrender.com from the device's network?

**Test:**
```bash
# From a computer on the same WiFi network:
curl -I "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"

# Should return HTTP 200
```

---

### 5. 🔐 **Checksum Verification Failure**

Android verifies the APK checksum. If it doesn't match, provisioning fails.

**Current Checksum:** `JfdtHWuytoe5zTSMmMBsJF2KptJBkEA1/kRcC+Vh02o=`

**Verify:**
```bash
# Download APK from server
curl -o /tmp/test.apk "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"

# Calculate checksum
shasum -a 256 /tmp/test.apk | awk '{print $1}' | xxd -r -p | base64

# Should output: JfdtHWuytoe5zTSMmMBsJF2KptJBkEA1/kRcC+Vh02o=
```

If checksum doesn't match, regenerate QR code.

---

### 6. 📋 **Android Version Too Old**

Device Owner provisioning requires Android 7.0+.

**Check:**
- Device must be Android 7.0 (API 24) or higher
- Preferably Android 9.0+ for best compatibility

---

### 7. 🔧 **Developer Options Enabled**

Some devices reject Device Owner if developer mode is on.

**Solution:**
- Factory reset will disable developer options
- Don't enable developer options before provisioning

---

## 🧪 Diagnostic Steps

### Step 1: Verify APK is Accessible

```bash
curl -I "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"
```

**Expected:** `HTTP/2 200` ✅ (This is working now)

---

### Step 2: Test QR Payload

```bash
curl "https://emi-pro-app.onrender.com/api/provisioning/payload/TEST?wifiSsid=YourWiFi&wifiPassword=YourPass"
```

**Check:**
- ✅ Contains `PROVISIONING_WIFI_SSID`
- ✅ Contains `PROVISIONING_WIFI_PASSWORD`
- ✅ APK URL is correct
- ✅ Checksum is present

---

### Step 3: Manual ADB Provisioning (Bypass QR)

If QR provisioning keeps failing, try manual ADB provisioning:

```bash
# 1. Factory reset device
adb shell am broadcast -a android.intent.action.FACTORY_RESET

# 2. Wait for welcome screen

# 3. Download APK
curl -o /tmp/user.apk "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"

# 4. Install APK
adb install /tmp/user.apk

# 5. Set as Device Owner
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver

# Expected output:
# Success: Device owner set to package com.securefinance.emilock.user

# If this works, the APK is fine - issue is with QR provisioning
```

---

### Step 4: Check Device Logs

```bash
# Connect device via USB
adb devices

# Clear logs
adb logcat -c

# Start watching logs
adb logcat | grep -i "provision\|device.owner\|emilock\|error"

# Scan QR code on device
# Watch for errors in logs
```

**Common Errors:**
- `Download failed` → Network/WiFi issue
- `Checksum mismatch` → APK changed, regenerate QR
- `Not allowed to set device owner` → Device not properly reset
- `Package not found` → Wrong package name

---

## 🎯 Quick Fix Checklist

Try these in order:

1. ✅ **Add WiFi credentials to QR code**
   - This is the most likely fix
   - Regenerate QR with WiFi SSID and Password

2. ✅ **Factory reset device properly**
   - Complete reset
   - NO Google account
   - Stay on welcome screen

3. ✅ **Try different WiFi network**
   - Use mobile hotspot
   - Ensure no firewall blocking

4. ✅ **Try manual WiFi connection first**
   - Connect to WiFi on welcome screen
   - Then scan QR

5. ✅ **Try different device**
   - Samsung or Google Pixel recommended
   - Avoid Xiaomi/Oppo for testing

6. ✅ **Use ADB provisioning**
   - If QR keeps failing
   - Manual ADB method always works

---

## 📊 Current System Status

| Component | Status | Details |
|-----------|--------|---------|
| APK on Server | ✅ | HTTP 200, 37MB |
| Checksum | ✅ | Matches |
| Backend | ✅ | Running |
| Provisioning Endpoint | ✅ | Working |
| WiFi in QR | ⚠️ | **Check this!** |

---

## 🔍 Next Steps

1. **Generate NEW QR code with WiFi credentials**
   ```
   - WiFi SSID: Your_Network_Name
   - WiFi Password: Your_Password
   ```

2. **Factory reset device completely**

3. **Scan new QR code**

4. **If still fails, try ADB provisioning**

5. **Check device logs for specific error**

---

## 📞 Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Share the device logs:**
   ```bash
   adb logcat > provisioning-error.log
   # Scan QR, wait for error
   # Ctrl+C to stop
   # Share the log file
   ```

2. **Try ADB provisioning** to confirm APK works

3. **Test on a different device** (Samsung/Pixel)

4. **Check if manufacturer blocks Device Owner**

---

## 💡 Most Common Solution

**90% of the time, the issue is:**
1. WiFi credentials not in QR code
2. Device not properly factory reset
3. Google account already added

**Fix:** Generate new QR with WiFi, factory reset device, scan immediately.
