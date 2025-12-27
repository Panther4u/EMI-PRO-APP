# EMI Pro - Production Deployment Guide

## 🎯 Overview

This guide explains how to deploy your EMI Pro application to production with the Render backend and build APKs that connect to the deployed server.

---

## 📋 Current Setup

### **Backend (Render)**
- **URL**: `https://emi-pro.onrender.com`
- **Database**: MongoDB Atlas
- **Port**: 5000 (internal)

### **Frontend (Web Admin Panel)**
- **Development**: `http://localhost:8080`
- **Production**: Deployed on Render (same service)

### **Mobile App (APK)**
- **User APK**: For customers with locked devices
- **Admin APK**: For administrators with full access

---

## 🚀 Step 1: Configure Environment Variables

The application now uses environment-based API URLs:

### **Development** (`.env.development`)
```env
VITE_API_URL=http://localhost:5000
```

### **Production** (`.env.production`)
```env
VITE_API_URL=https://emi-pro.onrender.com
```

✅ **These files have been created for you!**

---

## 🔧 Step 2: Build Frontend for Production

### **Build the Web Admin Panel**

```bash
# Navigate to project root
cd "/Volumes/Kavi/Emi Pro/EMI-PRO"

# Build for production (uses .env.production)
npm run build

# The build output will be in the 'dist' folder
```

This creates an optimized production build that:
- Uses the Render backend URL (`https://emi-pro.onrender.com`)
- Minifies and optimizes all assets
- Ready to be served by your Render backend

---

## 📱 Step 3: Build Mobile APK

### **Option A: User APK (Lockscreen Only)**

```bash
# Navigate to mobile app directory
cd "/Volumes/Kavi/Emi Pro/EMI-PRO/mobile-app"

# Install dependencies (if not already done)
npm install

# Build the User APK
cd android
./gradlew assembleUserRelease

# APK Location:
# mobile-app/android/app/build/outputs/apk/user/release/app-user-release.apk
```

### **Option B: Admin APK (Full Access)**

```bash
# Build the Admin APK
cd android
./gradlew assembleAdminRelease

# APK Location:
# mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk
```

### **Debug Builds (For Testing)**

```bash
# User Debug APK
./gradlew assembleUserDebug

# Admin Debug APK
./gradlew assembleAdminDebug
```

---

## 🌐 Step 4: Deploy to Render

### **Update Render Configuration**

Your Render service should be configured as follows:

#### **Build Settings**
- **Root Directory**: `.` (project root)
- **Build Command**: 
  ```bash
  npm install && npm run build && cd backend && npm install
  ```
- **Start Command**: 
  ```bash
  cd backend && node server.js
  ```

#### **Environment Variables on Render**
Add these in your Render dashboard:

```env
MONGODB_URI=mongodb://teampanther4:dt9dRQvDp6qS08Vc@ac-2cg26ym-shard-00-00.gevdelx.mongodb.net:27017,ac-2cg26ym-shard-00-01.gevdelx.mongodb.net:27017,ac-2cg26ym-shard-00-02.gevdelx.mongodb.net:27017/EMI_LOCK_PRO?replicaSet=atlas-322bib-shard-0&ssl=true&authSource=admin
PORT=5000
NODE_ENV=production
```

---

## 📦 Step 5: Serve APK from Backend

The backend serves the APK file so users can download it via QR code.

### **Upload APK to Server**

1. **Copy the APK to the backend public folder:**

```bash
# Create public folder if it doesn't exist
mkdir -p "/Volumes/Kavi/Emi Pro/EMI-PRO/backend/public"

# Copy the User APK
cp "/Volumes/Kavi/Emi Pro/EMI-PRO/mobile-app/android/app/build/outputs/apk/user/release/app-user-release.apk" \
   "/Volumes/Kavi/Emi Pro/EMI-PRO/backend/public/app-user.apk"

# Copy the Admin APK
cp "/Volumes/Kavi/Emi Pro/EMI-PRO/mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk" \
   "/Volumes/Kavi/Emi Pro/EMI-PRO/backend/public/app-admin.apk"
```

2. **Update backend to serve static files:**

The backend should already have this in `server.js`:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve static files (APK downloads)
app.use('/downloads', express.static(path.join(__dirname, 'public')));

// Serve frontend build
app.use(express.static(path.join(__dirname, '../dist')));
```

3. **APK Download URLs:**
- User APK: `https://emi-pro.onrender.com/downloads/app-user.apk`
- Admin APK: `https://emi-pro.onrender.com/downloads/app-admin.apk`

---

## 🔐 Step 6: QR Code Provisioning

### **How It Works**

1. **Admin generates QR code** in the web panel
2. **QR code contains**:
   - Customer details (name, phone, IMEI, etc.)
   - Backend server URL: `https://emi-pro.onrender.com`
   - APK download URL
3. **User scans QR code** on their device
4. **Device downloads and installs** the User APK
5. **App connects to backend** using the URL from QR code
6. **Device registers** and starts polling for lock status

### **QR Code Data Format**

```json
{
  "serverUrl": "https://emi-pro.onrender.com",
  "apkUrl": "https://emi-pro.onrender.com/downloads/app-user.apk",
  "customerId": "...",
  "customerName": "...",
  "phone": "...",
  "imei1": "...",
  "imei2": "..."
}
```

---

## 🧪 Step 7: Testing the Deployment

### **Test Web Admin Panel**

1. Open: `https://emi-pro.onrender.com`
2. Login with admin credentials
3. Verify dashboard loads correctly
4. Check if customer data is fetched from MongoDB

### **Test APK Installation**

1. **Download APK** from Render:
   ```
   https://emi-pro.onrender.com/downloads/app-user.apk
   ```

2. **Install on Android device**:
   - Enable "Install from Unknown Sources"
   - Install the APK
   - Grant required permissions

3. **Test QR Code Provisioning**:
   - Generate QR code in admin panel
   - Scan with device
   - Verify device registers successfully

4. **Test Lock/Unlock**:
   - Lock device from admin panel
   - Verify device receives lock command
   - Unlock and verify

---

## 🔄 Step 8: Continuous Deployment

### **Auto-Deploy on Git Push**

Render automatically deploys when you push to GitHub:

```bash
# Stage all changes
git add .

# Commit with message
git commit -m "Update production build with Render backend"

# Push to GitHub
git push origin main
```

Render will:
1. Detect the push
2. Run the build command
3. Install dependencies
4. Build the frontend
5. Start the backend server
6. Deploy to production

---

## 📊 Step 9: Monitor Deployment

### **Check Render Logs**

1. Go to: `https://dashboard.render.com/web/srv-d5741suuk2gs73cqf3u0`
2. Click on "Logs" tab
3. Monitor for:
   - ✅ "Connected to MongoDB Atlas"
   - ✅ "Server is running on port 5000"
   - ❌ Any error messages

### **Check Backend Health**

```bash
# Test API endpoint
curl https://emi-pro.onrender.com/api/customers

# Should return JSON array of customers
```

---

## 🛠️ Troubleshooting

### **Issue: APK Can't Connect to Backend**

**Solution**: Verify the APK has the correct server URL

1. Check `DeviceContext.tsx` uses `getApiUrl()`
2. Verify `.env.production` has correct Render URL
3. Rebuild APK after any URL changes

### **Issue: Render Build Fails**

**Solution**: Check build logs for errors

Common fixes:
- Ensure `package.json` has all dependencies
- Verify Node.js version compatibility
- Check MongoDB connection string

### **Issue: CORS Errors**

**Solution**: Update backend CORS configuration

In `backend/server.js`:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://emi-pro.onrender.com', 'http://localhost:8080'],
  credentials: true
}));
```

---

## 📝 Version Management

### **Update Version Numbers**

Before each release, update:

1. **Frontend** (`package.json`):
   ```json
   {
     "version": "1.0.5"
   }
   ```

2. **Backend** (`backend/package.json`):
   ```json
   {
     "version": "1.0.5"
   }
   ```

3. **Android** (`mobile-app/android/app/build.gradle`):
   ```gradle
   versionCode 5
   versionName "1.0.5"
   ```

---

## ✅ Deployment Checklist

- [ ] Environment files created (`.env.production`, `.env.development`)
- [ ] Frontend built for production (`npm run build`)
- [ ] Backend configured to serve frontend build
- [ ] APKs built (User and Admin variants)
- [ ] APKs uploaded to backend public folder
- [ ] Render environment variables configured
- [ ] MongoDB connection tested
- [ ] Web admin panel accessible at Render URL
- [ ] APK download URLs working
- [ ] QR code provisioning tested
- [ ] Device lock/unlock tested
- [ ] Changes committed and pushed to GitHub
- [ ] Render deployment successful
- [ ] Production logs checked for errors

---

## 🎉 You're All Set!

Your EMI Pro application is now deployed to production with:
- ✅ Web admin panel at `https://emi-pro.onrender.com`
- ✅ Backend API connected to MongoDB Atlas
- ✅ User APK for customer devices
- ✅ Admin APK for administrators
- ✅ QR code provisioning system
- ✅ Automatic deployment on Git push

---

## 📞 Support

If you encounter any issues:
1. Check Render logs for backend errors
2. Verify MongoDB connection
3. Test API endpoints with curl/Postman
4. Check browser console for frontend errors
5. Review APK logcat for mobile errors

Happy Deploying! 🚀
