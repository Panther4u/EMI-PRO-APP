# 📱 APK DEPLOYMENT STRUCTURE - FINAL

**Date:** January 2, 2026  
**Status:** ✅ Complete - Dual APK System

---

## 🎯 **TWO SEPARATE APKs**

### **1. User APK** (Customer Devices)
- **Location:** `backend/public/app-user-release.apk`
- **Package:** `com.securefinance.emilock.user`
- **Purpose:** Installed on customer devices via QR code
- **Deployment:** Render (public backend)
- **Size:** 37 MB
- **Installation:** QR code provisioning (factory reset)
- **Behavior:** Runs in background, shows lock screen when locked
- **Users:** Customers (EMI devices)

### **2. Admin APK** (Dashboard Access)
- **Location:** `admin-apk/app-admin-release.apk`
- **Package:** `com.securefinance.emilock.admin`
- **Purpose:** Dashboard access for admin users
- **Deployment:** GitHub releases (separate)
- **Size:** 37 MB
- **Installation:** Manual download
- **Behavior:** Shows dashboard WebView
- **Users:** Admin only

---

## 📁 **FOLDER STRUCTURE**

```
EMI-PRO/
├── backend/
│   └── public/
│       ├── app-user-release.apk      ← Customer devices (QR)
│       └── version.json               ← User APK version
│
├── admin-apk/                         ← NEW! Separate folder
│   ├── app-admin-release.apk         ← Admin dashboard
│   ├── version.json                   ← Auto-update info
│   └── README.md                      ← Installation guide
│
└── mobile-app/
    └── android/
        └── app/build/outputs/apk/
            ├── user/release/          ← Build output
            └── admin/release/         ← Build output
```

---

## 🚀 **DEPLOYMENT LOCATIONS**

### **User APK:**
```
✅ Deployed to: Render (public backend)
✅ URL: https://emi-pro-app.onrender.com/downloads/app-user-release.apk
✅ QR Code: Points to this URL
✅ Auto-deploy: Yes (via git push)
```

### **Admin APK:**
```
✅ Deployed to: GitHub (admin-apk folder)
✅ URL: https://github.com/Panther4u/EMI-PRO-APP/raw/main/admin-apk/app-admin-release.apk
✅ Distribution: Manual download / GitHub releases
✅ Auto-update: Yes (checks version.json)
```

---

## 📥 **INSTALLATION METHODS**

### **User APK (Customers):**
1. Factory reset device
2. Tap welcome screen 6 times
3. Scan QR code from dashboard
4. APK downloads and installs automatically
5. Device becomes Device Owner
6. App runs in background

### **Admin APK (Admins):**
1. Download from GitHub:
   ```
   https://github.com/Panther4u/EMI-PRO-APP/raw/main/admin-apk/app-admin-release.apk
   ```
2. Install manually on Android device
3. Open app and login
4. Access full dashboard

---

## 🔄 **AUTO-UPDATE SYSTEM**

### **User APK:**
- Checks `backend/public/version.json`
- Updates via backend deployment
- Automatic via Render

### **Admin APK:**
- Checks `admin-apk/version.json` on GitHub
- Shows update prompt when new version available
- Downloads from GitHub releases
- Installs automatically

---

## 🔧 **BUILD COMMANDS**

### **Build User APK:**
```bash
cd mobile-app/android
./gradlew assembleUserRelease

# Copy to backend
cp app/build/outputs/apk/user/release/app-user-release.apk \
   ../../backend/public/

# Deploy
git add backend/public/app-user-release.apk
git commit -m "update: User APK v1.0.x"
git push origin main
# Render auto-deploys
```

### **Build Admin APK:**
```bash
cd mobile-app/android
./gradlew assembleAdminRelease

# Copy to admin-apk
cp app/build/outputs/apk/admin/release/app-admin-release.apk \
   ../../admin-apk/

# Update version
# Edit admin-apk/version.json

# Deploy
git add admin-apk/
git commit -m "release: Admin APK v1.0.x"
git push origin main
# Available on GitHub immediately
```

---

## 📊 **COMPARISON TABLE**

| Feature | User APK | Admin APK |
|---------|----------|-----------|
| **Package** | `.user` | `.admin` |
| **Purpose** | EMI lock | Dashboard |
| **Location** | `backend/public/` | `admin-apk/` |
| **Deployment** | Render | GitHub |
| **Installation** | QR code | Manual |
| **Users** | Customers | Admins |
| **Lock Screen** | Yes | No |
| **Background Mode** | Yes | No |
| **WebView** | No | Yes |
| **Device Owner** | Yes | No |
| **Auto-Update** | Via backend | Via GitHub |

---

## ✅ **WHAT'S DEPLOYED**

### **GitHub (Main Branch):**
```
✅ admin-apk/app-admin-release.apk (37 MB)
✅ admin-apk/version.json
✅ admin-apk/README.md
✅ backend/public/app-user-release.apk (37 MB)
✅ backend/public/version.json
```

### **Render (Production):**
```
✅ app-user-release.apk (deployed automatically)
✅ Available at: /downloads/app-user-release.apk
```

---

## 📝 **IMPORTANT NOTES**

### **Security:**
- ✅ User APK is public (for QR provisioning)
- ✅ Admin APK is on GitHub (requires login to use)
- ✅ Both APKs are signed
- ✅ Separate packages prevent conflicts

### **Updates:**
- ✅ User APK updates via Render deployment
- ✅ Admin APK updates via GitHub releases
- ✅ Both support auto-update
- ✅ Version tracking in version.json

### **Distribution:**
- ✅ User APK: QR code only (automatic)
- ✅ Admin APK: Manual download (GitHub)
- ✅ No confusion between APKs
- ✅ Clear separation of concerns

---

## 🎯 **RESULT**

✅ **User APK:**
- Deployed to Render
- Available for QR provisioning
- Runs in background when unlocked
- Shows lock screen when locked

✅ **Admin APK:**
- Deployed to GitHub
- Available for manual download
- Shows dashboard WebView
- Auto-update support

✅ **Clean Separation:**
- No APK files in wrong locations
- Clear deployment strategy
- Easy to maintain
- Professional structure

**Both APKs are now properly deployed!** 🚀

