# Admin APK Auto-Update System

## Overview
The Admin APK now has **automatic update functionality** with two types of updates:

### 1. ✅ Web Content Updates (Automatic - No APK Rebuild Needed)
Since the Admin APK uses a WebView loading `https://emi-pro-app.onrender.com`:
- **Any changes to the web dashboard automatically appear in the APK**
- Users just need to restart the app or pull to refresh
- No APK rebuild or reinstall required
- Updates are instant

### 2. ✅ APK Version Updates (Manual - Requires New APK)
For native app updates (bug fixes, new features, performance improvements):
- App checks for updates on startup
- Shows update dialog if new version available
- Users can download and install the new APK

---

## How It Works

### Web Content Auto-Update
```
You update web code → Deploy to Render → Users restart app → See new content
```

**Example:**
1. You modify `src/pages/Dashboard.tsx`
2. Run `npm run build` and deploy to Render
3. Users open the Admin APK
4. WebView loads the latest version from `emi-pro-app.onrender.com`
5. ✅ Users see the updated dashboard

**Note:** WebView cache is disabled (`cacheMode: "LOAD_NO_CACHE"`) to ensure fresh content.

---

### APK Version Update Process

#### When to Release a New APK Version
- Bug fixes in native code
- Performance improvements
- New native features
- Security updates
- WebView configuration changes

#### Steps to Release New APK Version

**1. Update Version Number**
Edit `mobile-app/src/screens/AdminScreen.tsx`:
```javascript
const CURRENT_VERSION = '1.0.1'; // Change from 1.0.0 to 1.0.1
```

**2. Rebuild APK**
```bash
cd mobile-app
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
cd android
./gradlew assembleAdminRelease
```

**3. Copy APK to Backend**
```bash
cp mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk backend/public/app-admin-release.apk
```

**4. Update Backend Version Info**
Edit `backend/routes/versionRoutes.js`:
```javascript
router.get('/admin-version', (req, res) => {
    res.json({
        version: '1.0.1', // Update this
        downloadUrl: 'https://emi-pro-app.onrender.com/app-admin-release.apk',
        releaseNotes: 'Bug fixes and performance improvements',
        minSupportedVersion: '1.0.0',
        forceUpdate: false // Set to true to force users to update
    });
});
```

**5. Deploy Backend**
```bash
git add .
git commit -m "Release Admin APK v1.0.1"
git push
```

**6. Users Get Update Notification**
- Next time users open the app, they see an update dialog
- They can choose "Update Now" or "Later"
- "Update Now" downloads the new APK from the server

---

## API Endpoint

### `GET /api/admin-version`

**Response:**
```json
{
  "version": "1.0.0",
  "downloadUrl": "https://emi-pro-app.onrender.com/app-admin-release.apk",
  "releaseNotes": "Initial release with full web dashboard",
  "minSupportedVersion": "1.0.0",
  "forceUpdate": false
}
```

**Fields:**
- `version`: Latest APK version available
- `downloadUrl`: Direct download link for the APK
- `releaseNotes`: What's new in this version
- `minSupportedVersion`: Minimum version that can still be used
- `forceUpdate`: If true, users must update to continue

---

## Version Numbering

Use **Semantic Versioning**: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.x.x): Breaking changes
- **MINOR** (x.1.x): New features (backward compatible)
- **PATCH** (x.x.1): Bug fixes

**Examples:**
- `1.0.0` → Initial release
- `1.0.1` → Bug fix
- `1.1.0` → New feature added
- `2.0.0` → Major redesign

---

## Testing Auto-Update

### Test Web Content Update
1. Make a change to `src/pages/Dashboard.tsx`
2. Build and deploy: `npm run build && git push`
3. Open Admin APK on emulator
4. ✅ You should see the change immediately

### Test APK Version Update
1. Change version in `AdminScreen.tsx` to `1.0.1`
2. Rebuild APK
3. Update `versionRoutes.js` to return `1.0.2`
4. Open Admin APK
5. ✅ You should see "Update Available" dialog

---

## Deployment Checklist

### For Web Content Updates (Daily/Frequent)
- [ ] Make changes to web code
- [ ] Test locally
- [ ] Build: `npm run build`
- [ ] Deploy: `git push`
- [ ] ✅ Done! Users get updates automatically

### For APK Updates (Monthly/As Needed)
- [ ] Update `CURRENT_VERSION` in `AdminScreen.tsx`
- [ ] Rebuild APK
- [ ] Copy APK to `backend/public/`
- [ ] Update version in `versionRoutes.js`
- [ ] Test on emulator
- [ ] Deploy backend
- [ ] ✅ Users get update notification

---

## Current Configuration

**APK Version:** `1.0.0`
**Web Dashboard URL:** `https://emi-pro-app.onrender.com`
**APK Download URL:** `https://emi-pro-app.onrender.com/app-admin-release.apk`
**Version Check URL:** `https://emi-pro-app.onrender.com/api/admin-version`

---

## Benefits

✅ **Web updates are instant** - No APK rebuild needed
✅ **APK updates are notified** - Users know when to update
✅ **Seamless experience** - Users always have the latest features
✅ **Flexible deployment** - Update web or APK independently
✅ **Version control** - Track what version users are on

---

## Troubleshooting

### Users Don't See Web Updates
- Check if Render deployment succeeded
- Verify WebView cache is disabled
- Ask users to force-close and reopen the app

### Update Dialog Doesn't Appear
- Check `/api/admin-version` endpoint is working
- Verify version numbers are different
- Check network connectivity on device

### APK Download Fails
- Verify APK exists in `backend/public/`
- Check file permissions
- Ensure correct MIME type (`application/vnd.android.package-archive`)

---

## Future Enhancements

- [ ] In-app update (without leaving the app)
- [ ] Update progress indicator
- [ ] Automatic background updates
- [ ] Rollback to previous version
- [ ] A/B testing for updates
