# 🚀 Deploy APK to Render - Quick Guide

## ❌ Current Problem

The QR code provisioning fails because the APK is **NOT on the Render server**.

**Error:**
```
❌ APK is NOT downloadable from server
   URL: https://emi-pro-app.onrender.com/downloads/securefinance-user.apk
   HTTP Status: 404
```

## ✅ Solution: Deploy APK to Render

### Option 1: Git Push (Recommended)

The APK is already in your local `backend/public/downloads/` folder. You just need to commit and push it to Render.

```bash
# 1. Check if APK is in git
git status

# 2. If APK is ignored, temporarily allow it
# Check .gitignore and remove any line that ignores *.apk in backend/public/downloads

# 3. Add the APK to git
git add backend/public/downloads/securefinance-user.apk
git add backend/public/downloads/version.json

# 4. Commit
git commit -m "Deploy User APK v2.0.4 for provisioning"

# 5. Push to Render
git push origin main

# 6. Wait for Render to deploy (check Render dashboard)
# Usually takes 2-3 minutes

# 7. Verify deployment
curl -I "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"
# Should return: HTTP/2 200
```

### Option 2: Manual Upload via Render Dashboard

If git push doesn't work (APK too large or ignored):

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your service: `emi-pro-app`
3. Go to "Shell" tab
4. Upload APK manually:
   ```bash
   # In Render shell
   cd /opt/render/project/src/backend/public/downloads
   
   # Download from your local machine (you'll need to host it temporarily)
   # OR use Render's file upload feature
   ```

### Option 3: Use External CDN (Quick Fix)

If you can't deploy via git, temporarily host the APK elsewhere:

```bash
# 1. Upload APK to Google Drive / Dropbox / GitHub Releases
# 2. Get direct download link
# 3. Update backend/routes/provisioningRoutes.js:

# Change line 24-25 from:
const apkFileName = 'securefinance-user.apk';
const downloadUrl = `${baseUrl}/downloads/${apkFileName}`;

# To:
const downloadUrl = 'https://your-cdn-url.com/securefinance-user.apk';
```

## 🔍 Verify Deployment

After deploying, run:

```bash
# Check if APK is accessible
curl -I "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"

# Should return:
# HTTP/2 200
# content-type: application/vnd.android.package-archive
# content-length: 39012576

# If you get 404, deployment failed
# If you get 200, you're good to go!
```

## 🎯 After Deployment

Once the APK is deployed:

1. ✅ Generate a new QR code from the admin panel
2. ✅ Factory reset the device
3. ✅ Scan the QR code
4. ✅ Device should successfully download and install the APK
5. ✅ Provisioning should complete

## ⚠️ Important Notes

### Git Large File Storage (LFS)

If your APK is too large for regular git (>100MB), you might need Git LFS:

```bash
# Install Git LFS
brew install git-lfs  # macOS
# or
sudo apt-get install git-lfs  # Linux

# Initialize Git LFS
git lfs install

# Track APK files
git lfs track "*.apk"

# Add .gitattributes
git add .gitattributes

# Now add and commit APK
git add backend/public/downloads/securefinance-user.apk
git commit -m "Add User APK via Git LFS"
git push origin main
```

### Check .gitignore

Make sure your `.gitignore` doesn't exclude the APK:

```bash
# Check if APK is ignored
git check-ignore backend/public/downloads/securefinance-user.apk

# If it returns a path, the file is ignored
# Edit .gitignore and remove the line that ignores it
```

### Render Build Settings

Ensure Render is configured to serve static files:

1. Go to Render Dashboard
2. Select your service
3. Check "Environment" → "Build Command"
4. Should include: `npm install` or similar
5. Check "Start Command"
6. Should be: `npm start` or `node backend/server.js`

## 🐛 Troubleshooting

### APK still 404 after deployment

```bash
# 1. Check Render logs
# Go to Render Dashboard → Logs

# 2. Check if file exists on Render
# Go to Render Dashboard → Shell
cd backend/public/downloads
ls -lh
# Should show securefinance-user.apk

# 3. Check server.js static file serving
# Ensure this line exists in backend/server.js:
app.use('/downloads', express.static(path.join(__dirname, 'public/downloads')));
```

### Git push rejected (file too large)

```bash
# Use Git LFS (see above)
# OR use external CDN
# OR compress APK (not recommended - breaks checksum)
```

### Render deployment fails

```bash
# Check Render logs for errors
# Common issues:
# - Out of memory (APK too large)
# - Build timeout
# - Missing dependencies

# Solution: Use external CDN for APK
```

## 📊 Current Status

- ✅ APK exists locally: `backend/public/downloads/securefinance-user.apk` (37MB)
- ✅ Checksum matches: `JfdtHWuytoe5zTSMmMBsJF2KptJBkEA1/kRcC+Vh02o=`
- ✅ Backend server is running
- ✅ Provisioning endpoint works
- ❌ **APK NOT deployed to Render** ← **THIS IS THE ISSUE**

## 🎯 Next Steps

1. **Deploy APK to Render** (use Option 1 above)
2. **Verify deployment** (curl command)
3. **Test QR provisioning** (factory reset device, scan QR)
4. **Success!** 🎉
