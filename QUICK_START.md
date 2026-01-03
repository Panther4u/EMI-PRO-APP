# 🚀 Quick Start Guide - EMI Lock System

## ⚡ TL;DR - Get Started in 5 Minutes

### 1️⃣ **Generate QR Code** (2 minutes)
```
1. Open Admin Panel: http://localhost:5173
2. Click "Add Customer"
3. Fill details + WiFi credentials
4. Click "Generate QR Code"
```

### 2️⃣ **Provision Device** (2 minutes)
```
1. Factory reset customer device
2. On welcome screen, tap 6 times
3. Scan QR code
4. Wait for provisioning to complete
```

### 3️⃣ **Test Lock/Unlock** (1 minute)
```
1. Find device in admin panel
2. Click "Lock" → Device locks
3. Click "Unlock" → Device unlocks
```

---

## 📋 Prerequisites Checklist

Before you start, ensure:
- [ ] Render deployment complete (check: `curl -I https://emi-pro-app.onrender.com/downloads/securefinance-user.apk`)
- [ ] Admin panel accessible (local or deployed)
- [ ] Test device factory reset and ready
- [ ] WiFi credentials ready

---

## 🎯 Step-by-Step Guide

### Step 1: Verify Deployment

```bash
# Check if APK is accessible
curl -I "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"

# Should return: HTTP/2 200

# Check WiFi support
curl -s "https://emi-pro-app.onrender.com/api/provisioning/payload/TEST?wifiSsid=Test&wifiPassword=Pass" | grep WIFI

# Should show WiFi credentials
```

---

### Step 2: Generate QR Code

**Via Admin Panel:**
1. Login to admin panel
2. Navigate to "Add Customer"
3. Fill in:
   - Name: `Test Customer`
   - Phone: `1234567890`
   - **WiFi SSID:** `Your_Network_Name` ⚠️ **CRITICAL**
   - **WiFi Password:** `Your_Password` ⚠️ **CRITICAL**
4. Click "Generate QR Code"
5. QR code appears - keep it ready

---

### Step 3: Factory Reset Device

```
Settings → System → Reset → Erase all data
```

**Important:**
- ❌ Do NOT add Google account
- ❌ Do NOT skip setup
- ✅ Stay on welcome screen

---

### Step 4: Provision Device

1. On welcome screen, **tap 6 times** anywhere
2. Device prompts: "Scan QR code"
3. Scan the QR code
4. Watch provisioning:
   - "Getting ready for work"
   - "Downloading..."
   - "Installing..."
   - "Your IT admin can see data"
   - App launches

---

### Step 5: Verify in Admin Panel

1. Open admin panel
2. Go to Dashboard or Customers
3. Find "Test Customer"
4. Verify:
   - ✅ Status: ACTIVE
   - ✅ Brand/Model populated
   - ✅ Last Seen: Just now

---

### Step 6: Test Lock/Unlock

**Lock:**
1. Click "Lock Device" in admin panel
2. Watch device lock screen appear
3. Verify home button disabled

**Unlock:**
1. Click "Unlock Device"
2. Watch lock screen disappear
3. Verify normal functionality restored

---

## 🐛 Troubleshooting

### "Can't setup device" Error

**Cause:** WiFi credentials missing or incorrect

**Fix:**
1. Generate NEW QR with correct WiFi
2. Factory reset device again
3. Scan new QR

---

### Device Not Appearing in Dashboard

**Cause:** Heartbeat not running or network issue

**Fix:**
```bash
# Check device logs
adb logcat | grep -i "heartbeat\|emi_admin"

# Verify Device Owner
adb shell dumpsys device_policy | grep "Device Owner"
```

---

### Lock Command Not Working

**Cause:** Heartbeat not running or Device Owner not active

**Fix:**
```bash
# Check if Device Owner is active
adb shell dumpsys device_policy | grep "Device Owner"

# Should show: Device Owner: ComponentInfo{com.securefinance.emilock.user/...}

# If not, re-provision device
```

---

## 📚 Full Documentation

For detailed information, see:

- **SYSTEM_OVERVIEW.md** - Complete system architecture
- **TESTING_GUIDE.md** - Comprehensive testing procedures
- **FINAL_DEPLOYMENT.md** - Deployment status
- **APK_INSTALLATION_GUIDE.md** - Installation instructions
- **CANT_SETUP_DEVICE_FIX.md** - Detailed troubleshooting

---

## ✅ Success Checklist

Your system is working if:

- [ ] QR code generated successfully
- [ ] Device provisioned without errors
- [ ] Device appears in admin panel
- [ ] Device info populated (Brand, Model, IMEI)
- [ ] Lock command locks device immediately
- [ ] Unlock command unlocks device immediately
- [ ] Heartbeat running (Last Seen updates)
- [ ] Lock history tracked

---

## 🎉 You're Ready!

If all checks pass, your EMI Lock System is **production-ready**!

Start provisioning real customer devices and managing them from the admin panel.

---

## 📞 Quick Commands

```bash
# Verify deployment
./check-wifi-support.sh

# Run diagnostics
./check-provisioning.sh

# Monitor deployment
./monitor-deployment.sh

# Check device logs
adb logcat | grep -i "emi_admin"

# Verify Device Owner
adb shell dumpsys device_policy | grep "Device Owner"
```

---

**Need help?** Check the full documentation in the project root.
