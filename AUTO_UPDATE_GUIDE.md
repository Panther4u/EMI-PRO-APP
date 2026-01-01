# 🔄 Auto-Update System Guide

This guide explains how the auto-update system works for both the Admin APK and User APK, and how to release new updates.

---

## 🚀 **How It Works**

### **1. Admin APK**
- **Checks:** `admin-apk/version.json` on GitHub.
- **Frequency:** Once every 24 hours (or on clean install).
- **Behavior:**
  - If a new version is detected, a blue banner appears at the top of the dashboard.
  - Tapping "Update" opens the browser to download the new APK from GitHub.
  - User manually installs the update (it replaces the existing app).

### **2. User APK**
- **Checks:** `downloads/user-version.json` on Render (backend).
- **Frequency:** Once every 24 hours (checked on app launch).
- **Behavior:**
  - **Important:** Since the User APK usually runs in the background, updates are best checked when the app is manually launched or rebooted.
  - If an update is available, a banner/alert appears.
  - Tapping "Update" downloads the new APK from the server.
  - User/Admin confirms the install.

---

## 📦 **Deployment Structure**

| App | APK Location | Version File | Download URL |
|-----|--------------|--------------|--------------|
| **Admin** | `admin-apk/app-admin-release.apk` | `admin-apk/version.json` | GitHub Raw URL |
| **User** | `backend/public/app-user-release.apk` | `backend/public/user-version.json` | Render URL |

---

## 🛠 **How to Release an Update**

Follow these steps to release a new version (e.g., v2.0.0):

### **Step 1: Update Code Version**
You MUST update the `currentVersionCode` in the code, or the app won't know it's outdated.

1. **For User APK:** 
   - Edit `mobile-app/App.tsx`
   - Change `<AutoUpdateChecker currentVersionCode={1} />` to `{2}`.

2. **For Admin APK:**
   - Edit `mobile-app/src/screens/AdminScreen.tsx`
   - Change `<AutoUpdateChecker currentVersionCode={1} />` to `{2}`.

3. **(Optional) Update Android Manifest:**
   - Edit `mobile-app/android/app/build.gradle`
   - Increment `versionCode` and `versionName`.

### **Step 2: Build New APKs**
Rebuild both Release APKs to include the new code:
```bash
cd mobile-app/android
./gradlew clean assembleRelease
```

### **Step 3: Copy APKs to Deployment Folders**
```bash
# Copy User APK
cp app/build/outputs/apk/user/release/app-user-release.apk ../../backend/public/

# Copy Admin APK
cp app/build/outputs/apk/admin/release/app-admin-release.apk ../../admin-apk/
```

### **Step 4: Update Version Manifests**
Update the JSON files so existing apps detect the new version.

1. **Edit `admin-apk/version.json`:**
   ```json
   {
     "version": "2.0.0",
     "versionCode": 2,  <-- Must match code in Step 1
     "changelog": ["New awesome features..."]
   }
   ```

2. **Edit `backend/public/user-version.json`:**
   ```json
   {
     "version": "2.0.0",
     "versionCode": 2,  <-- Must match code in Step 1
     "changelog": ["Security fixes..."]
   }
   ```

### **Step 5: Deploy**
Commit and push to GitHub.
```bash
git add -A
git commit -m "release: v2.0.0 update"
git push origin main
```
- **Admin APK** update is live immediately on GitHub.
- **User APK** update is live after Render redeploys (approx. 2-3 mins).

---

## ⚠️ **Troubleshooting**

- **"Update Loop":** If the app keeps asking to update after installing, ensure you incremented `currentVersionCode` in the code (Step 1) before building the APK.
- **"No Update found":** Ensure `versionCode` in the JSON file is **greater than** the code in the installed app.
- **"App not installed":** When manually updating, ensure the new APK is signed with the same keystore as the old one (keep `debug.keystore` safe).

