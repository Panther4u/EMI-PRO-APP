# "Can't Set Up Device" Error - Troubleshooting Guide

## 🔴 Error Description
When scanning the QR code during factory reset setup, the device shows:
**"Can't set up device"**

## 🎯 Root Causes

### 1. **APK Not Accessible (Most Common)**
The device cannot download the Admin APK from the server.

**Check:**
```bash
# Test if APK is accessible
curl -I https://emi-pro-app.onrender.com/downloads/app-admin-release.apk

# Expected: HTTP 200 OK
# File size: ~37MB
```

**Fix:**
- Ensure backend is deployed and running
- Verify APK exists in `backend/public/app-admin-release.apk`
- Check Render deployment logs

### 2. **Wrong Checksum**
The APK checksum in the QR code doesn't match the actual APK file.

**Check:**
```bash
# Get current checksum
curl https://emi-pro-app.onrender.com/api/provisioning/checksum

# Should return: 9MBtfICaLx0RVCoQ4oNB1DNh-FCGkLPc3dRNCLnVHJc
```

**Fix:**
- Rebuild and redeploy the Admin APK
- Update `PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM` in Render environment variables
- Regenerate QR code

### 3. **Device Not Factory Reset**
The device must be completely factory reset to accept QR provisioning.

**Fix:**
```
Settings → System → Reset → Factory data reset
```

### 4. **Wrong APK Filename**
The provisioning endpoint expects `app-admin-release.apk` but file might be named differently.

**Check:**
```bash
ls -lh backend/public/*.apk
```

**Fix:**
- Ensure APK is named exactly: `app-admin-release.apk`
- Or update the provisioning route to match your filename

## ✅ Quick Fix Checklist

1. **Verify APK is deployed:**
   ```bash
   curl -I https://emi-pro-app.onrender.com/downloads/app-admin-release.apk
   ```

2. **Check backend is running:**
   ```bash
   curl https://emi-pro-app.onrender.com/health
   ```

3. **Verify provisioning endpoint:**
   ```bash
   curl https://emi-pro-app.onrender.com/api/provisioning/payload/TEST123
   ```

4. **Factory reset device:**
   - Settings → System → Reset → Factory data reset

5. **Regenerate QR code:**
   - Delete old customer
   - Create new customer
   - Generate fresh QR code

## 🔧 For Development (Local Testing)

If testing locally, you **cannot** use QR provisioning because:
- ❌ `localhost` is not accessible from a factory-reset device
- ❌ Device needs public internet access to download APK

**Solution:**
Use manual APK installation for testing:
```bash
adb install EMI-PRO-Admin.apk
adb shell am start -n com.securefinance.emilock.admin/.MainActivity
```

## 📊 Current Setup Status

### Production APK Location:
- **URL:** `https://emi-pro-app.onrender.com/downloads/app-admin-release.apk`
- **Local:** `/Volumes/Kavi/Emi Pro/EMI-PRO/backend/public/app-admin-release.apk`
- **Size:** ~37 MB

### Provisioning Endpoint:
- **URL:** `https://emi-pro-app.onrender.com/api/provisioning/payload/:customerId`
- **Returns:** JSON with QR provisioning config

### Expected Checksum:
```
9MBtfICaLx0RVCoQ4oNB1DNh-FCGkLPc3dRNCLnVHJc
```

## 🚀 Recommended Workflow

### For Production Devices:
1. Deploy latest code to Render
2. Wait for deployment to complete (~2-3 minutes)
3. Verify APK is accessible (curl test above)
4. Factory reset device
5. Generate QR code from dashboard
6. Scan QR during setup (tap welcome screen 6 times)

### For Testing:
1. Use emulator or test device
2. Install APK manually via ADB
3. Test app functionality
4. Skip QR provisioning

## 📝 Notes

- QR provisioning **only works** with factory-reset devices
- APK **must be** publicly accessible (no localhost)
- Checksum **must match** exactly
- Device needs **internet connection** during setup

---

**Last Updated:** January 1, 2026  
**Status:** ✅ APK deployed, ready for provisioning
