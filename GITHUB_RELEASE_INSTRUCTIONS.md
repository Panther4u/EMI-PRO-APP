# GitHub Release Creation Instructions

## Step 1: Create the Release

1. **Go to GitHub Releases page**:
   https://github.com/Panther4u/EMI-PRO-APP/releases/new

2. **Fill in the form**:
   - **Choose a tag**: Select `v1.1.1` (already created)
   - **Release title**: `User APK v1.1.1`
   - **Description**:
     ```markdown
     ## User APK v1.1.1 - Critical Fixes
     
     ### What's Fixed
     - ✅ QR Scanner now appears on first launch
     - ✅ Fixed stale AsyncStorage enrollment data issue
     - ✅ Removed unused HomeScreen component
     - ✅ Added enrollment validation with backend
     
     ### Installation
     1. Factory reset your device
     2. Scan QR code from admin dashboard
     3. App will download and install automatically
     
     ### Technical Details
     - Package: `com.securefinance.emilock.user`
     - Version Code: 9
     - Min Android: 8.0
     - Size: ~37MB
     ```

3. **Upload APK**:
   - Click "Attach binaries by dropping them here or selecting them"
   - Upload: `/Volumes/Kavi/Emi Pro/EMI-PRO/backend/public/downloads/app-user-release.apk`

4. **Publish**:
   - Click "Publish release"

## Step 2: Get Download URL

After publishing, the download URL will be:
```
https://github.com/Panther4u/EMI-PRO-APP/releases/download/v1.1.1/app-user-release.apk
```

## Step 3: Verify

Test the URL in browser:
```bash
curl -I https://github.com/Panther4u/EMI-PRO-APP/releases/download/v1.1.1/app-user-release.apk
```

Should return `HTTP/2 302` (redirect) then `HTTP/2 200`

---

**After completing these steps, let me know and I'll update the backend code!**
