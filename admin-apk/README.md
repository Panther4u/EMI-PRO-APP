# 📱 Admin APK - Dashboard Access

This folder contains the **Admin APK** for accessing the EMI Pro dashboard on mobile devices.

---

## 📦 **What's Inside**

- `app-admin-release.apk` - Admin dashboard app (37 MB)
- `version.json` - Version information for auto-update
- `README.md` - This file

---

## 🎯 **Purpose**

The Admin APK is designed for **admin users** who want to access the EMI Pro dashboard on their mobile devices.

### **Features:**
- ✅ Full dashboard access
- ✅ Customer management
- ✅ Device lock/unlock controls
- ✅ Payment tracking
- ✅ Real-time device status
- ✅ Auto-update support

---

## 📥 **Installation**

### **Method 1: Direct Download**
```bash
# Download from GitHub
wget https://github.com/Panther4u/EMI-PRO-APP/raw/main/admin-apk/app-admin-release.apk

# Install on device
adb install app-admin-release.apk
```

### **Method 2: From Device**
1. Open this link on your Android device:
   ```
   https://github.com/Panther4u/EMI-PRO-APP/raw/main/admin-apk/app-admin-release.apk
   ```
2. Download the APK
3. Enable "Install from Unknown Sources"
4. Install the APK

---

## 🔐 **Login**

After installation:
1. Open the **EMI Pro Admin** app
2. Login with your admin credentials
3. Access the full dashboard

---

## 🔄 **Auto-Update**

The Admin APK includes auto-update functionality:

1. App checks `version.json` on startup
2. If new version available, shows update prompt
3. Downloads and installs new version automatically

### **Version Information:**
- Current Version: `1.0.0`
- Version Code: `1`
- Release Date: `2026-01-02`

---

## ⚠️ **Important Notes**

### **Admin APK vs User APK:**

| Feature | Admin APK | User APK |
|---------|-----------|----------|
| **Purpose** | Dashboard access | Customer devices |
| **Package** | `.admin` | `.user` |
| **Installation** | Manual | QR provisioning |
| **Location** | `admin-apk/` | `backend/public/` |
| **Users** | Admin only | Customers |
| **Lock Screen** | Never | Yes, when locked |

### **Security:**
- Admin APK requires login credentials
- Not deployed to public backend
- Separate from customer devices
- GitHub releases only

---

## 🚀 **Deployment**

### **GitHub Release:**
```bash
# Commit and push
git add admin-apk/
git commit -m "release: Admin APK v1.0.0"
git push origin main

# Create GitHub release
# Upload app-admin-release.apk as release asset
```

### **Update Version:**
1. Edit `admin-apk/version.json`
2. Update version number
3. Rebuild APK
4. Push to GitHub
5. App auto-updates on next launch

---

## 📱 **Package Information**

- **Package Name:** `com.securefinance.emilock.admin`
- **Version:** `1.0.0`
- **Version Code:** `1`
- **Min Android:** `8.0` (API 26)
- **Target Android:** `13` (API 33)
- **Size:** ~37 MB

---

## 🔧 **Build Commands**

```bash
# Build Admin Release APK
cd mobile-app/android
./gradlew assembleAdminRelease

# Copy to admin-apk folder
cp app/build/outputs/apk/admin/release/app-admin-release.apk \
   ../../admin-apk/

# Update version
# Edit admin-apk/version.json

# Deploy
git add admin-apk/
git commit -m "release: Admin APK v1.0.1"
git push origin main
```

---

## 📝 **Changelog**

### **v1.0.0** (2026-01-02)
- Initial release
- Admin dashboard access
- Device management
- Customer management
- Lock/unlock controls
- Auto-update support

---

**For admin use only. Do not distribute to customers.**

