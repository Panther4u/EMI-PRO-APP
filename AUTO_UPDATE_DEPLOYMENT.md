# AUTO-UPDATE DEPLOYMENT GUIDE

## ✅ AUTO-UPDATE SYSTEM CONFIGURED

The auto-update system is **already implemented** and will work automatically once deployed.

---

## 📦 VERSION UPDATED

### **Current Version: 0.0.8**

**Files Updated:**
1. ✅ `/mobile-app/src/config.ts` → `APP_VERSION = "0.0.8"`
2. ✅ `/backend/public/version.json` → `version: "0.0.8"`
3. ✅ `/backend/public/securefinance-admin.apk` → Rebuilt (37MB, Jan 1 02:30)

**Release Notes:**
```
Version 0.0.8: CRITICAL FIX - IMEI-based provisioning, removed customerId 
requirement, auto-matching by device ID. Fixes 'Invalid QR' error.
```

---

## 🔄 HOW AUTO-UPDATE WORKS

### **1. Update Check Logic (Already in App.tsx)**

```typescript
const checkForUpdates = async (serverUrl: string) => {
    try {
        const response = await fetch(`${serverUrl}/downloads/version.json`);
        if (response.ok) {
            const data = await response.json();
            if (data.version !== APP_VERSION) {
                Alert.alert(
                    "Update Available",
                    `A new version (${data.version}) is available. Would you like to update?`,
                    [
                        { text: "Later", style: "cancel" },
                        {
                            text: "Update Now",
                            onPress: () => Linking.openURL(data.admin_apk)
                        }
                    ]
                );
            }
        }
    } catch (e) {
        console.log("Update check failed", e);
    }
};
```

### **2. When It Triggers**

The app checks for updates:
- ✅ **On app startup** (in `checkStatus()`)
- ✅ **Every time the app launches**
- ✅ Compares local `APP_VERSION` with server `version.json`

### **3. User Experience**

**Scenario 1: User has v0.0.7, server has v0.0.8**
1. App launches
2. Fetches `https://emi-pro-app.onrender.com/downloads/version.json`
3. Sees `"version": "0.0.8"` (different from local `"0.0.7"`)
4. Shows alert:
   ```
   Update Available
   A new version (0.0.8) is available. Would you like to update?
   
   [Later]  [Update Now]
   ```
5. If user taps **"Update Now"**:
   - Opens browser to download APK
   - User installs manually

**Scenario 2: User has v0.0.8, server has v0.0.8**
- No alert shown
- App continues normally

---

## 🚀 DEPLOYMENT STEPS

### **Option 1: Deploy to Render (Recommended)**

1. **Commit and Push:**
   ```bash
   cd /Volumes/Kavi/Emi\ Pro/EMI-PRO
   
   git add mobile-app/src/config.ts
   git add backend/public/version.json
   git add backend/public/securefinance-admin.apk
   git add backend/routes/deviceRoutes.js
   git add mobile-app/android/app/src/main/java/com/securefinance/emilock/DeviceAdminReceiver.java
   git add mobile-app/android/app/src/main/java/com/securefinance/emilock/DeviceInfoCollector.java
   git add mobile-app/src/screens/SetupScreen.tsx
   
   git commit -m "v0.0.8: IMEI-based provisioning fix + auto-update"
   git push origin main
   ```

2. **Render Auto-Deploys:**
   - Render detects the push
   - Rebuilds and deploys automatically
   - New APK is served at: `https://emi-pro-app.onrender.com/downloads/securefinance-admin.apk`
   - Version endpoint: `https://emi-pro-app.onrender.com/downloads/version.json`

3. **Verify Deployment:**
   ```bash
   curl https://emi-pro-app.onrender.com/downloads/version.json
   ```
   
   Expected output:
   ```json
   {
     "version": "0.0.8",
     "apk_url": "https://emi-pro-app.onrender.com/downloads/securefinance-admin.apk",
     "admin_apk": "https://emi-pro-app.onrender.com/downloads/securefinance-admin.apk",
     "releaseNotes": "Version 0.0.8: CRITICAL FIX - IMEI-based provisioning..."
   }
   ```

---

### **Option 2: Test Locally First**

1. **Start Backend:**
   ```bash
   cd /Volumes/Kavi/Emi\ Pro/EMI-PRO/backend
   node server.js
   ```

2. **Test Version Endpoint:**
   ```bash
   curl http://localhost:5000/downloads/version.json
   ```

3. **Test APK Download:**
   ```bash
   curl -I http://localhost:5000/downloads/securefinance-admin.apk
   ```

4. **Install Old Version on Test Device:**
   - Install v0.0.7 APK on a test device
   - Launch the app
   - Should see update prompt

---

## 🧪 TESTING AUTO-UPDATE

### **Test Scenario:**

1. **Install Old Version (v0.0.7) on Device:**
   - Get the old APK from git history or build it
   - Install on test device

2. **Deploy New Version (v0.0.8) to Server:**
   - Push to Render (as above)
   - Wait for deployment to complete

3. **Launch App on Device:**
   - Open the app
   - **Expected:** Alert appears:
     ```
     Update Available
     A new version (0.0.8) is available. Would you like to update?
     ```

4. **Tap "Update Now":**
   - Browser opens
   - Downloads new APK
   - User installs manually

5. **Verify:**
   - Check app version in settings
   - Should show v0.0.8

---

## 📱 CURRENT STATUS

### **Files Ready for Deployment:**

✅ **Mobile App:**
- `config.ts` → Version 0.0.8
- `DeviceAdminReceiver.java` → IMEI-based provisioning
- `DeviceInfoCollector.java` → deviceId as primary identifier
- `SetupScreen.tsx` → No customerId validation
- APK rebuilt with all fixes

✅ **Backend:**
- `version.json` → Version 0.0.8
- `securefinance-admin.apk` → 37MB, Jan 1 02:30
- `deviceRoutes.js` → IMEI auto-matching

---

## 🔍 VERIFICATION CHECKLIST

After deployment, verify:

- [ ] `https://emi-pro-app.onrender.com/downloads/version.json` returns v0.0.8
- [ ] `https://emi-pro-app.onrender.com/downloads/securefinance-admin.apk` is accessible
- [ ] APK size is ~37MB
- [ ] Old app (v0.0.7) shows update prompt when launched
- [ ] New app (v0.0.8) does NOT show update prompt
- [ ] "Update Now" button downloads the correct APK

---

## 🎯 EXPECTED BEHAVIOR

### **For Users with Old App (v0.0.7 or earlier):**
1. Launch app
2. See update notification
3. Can choose to update now or later
4. If "Update Now" → downloads v0.0.8 APK
5. Manual installation required

### **For Users with Current App (v0.0.8):**
1. Launch app
2. No update notification
3. App works normally

### **For New Installations:**
1. Scan QR code during factory reset
2. Downloads v0.0.8 APK automatically
3. Installs as Device Owner
4. No "Invalid QR" error
5. IMEI-based auto-matching works

---

## 📝 NOTES

- **Manual Installation Required:** Android doesn't allow silent APK updates for security reasons. Users must manually install the downloaded APK.
- **Device Owner Exception:** If the app is Device Owner, it CAN silently install updates, but we haven't implemented that yet.
- **Update Frequency:** The app checks for updates on every launch, not in the background.

---

## 🚀 NEXT STEPS

1. **Deploy to Render** (push to git)
2. **Wait for deployment** (~5 minutes)
3. **Test with old APK** on a device
4. **Verify update prompt appears**
5. **Test IMEI-based provisioning** on factory-reset device

---

**Status:** ✅ READY TO DEPLOY  
**Version:** 0.0.8  
**Date:** January 1, 2026, 02:30 AM IST
