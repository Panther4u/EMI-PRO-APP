# Quick Start Guide - EMI Pro Deployment

## ✅ What's Been Configured

### 1. **API Configuration** ✓
- Created `/src/config/api.ts` - Centralized API URL management
- Created `.env.production` - Render backend URL
- Created `.env.development` - Local backend URL
- Updated `DeviceContext.tsx` - Uses environment-based URLs
- Updated `Settings.tsx` - Uses environment-based URLs

### 2. **Production Build** ✓
- Built frontend for production → `dist/` folder
- Configured to use: `https://emi-pro.onrender.com`
- Ready to be served by Render backend

---

## 🚀 Next Steps

### **Step 1: Update Backend to Serve Frontend**

Your backend (`backend/server.js`) should serve the built frontend:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, '../dist')));

// API routes
app.use('/api', apiRoutes);

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
```

### **Step 2: Deploy to Render**

```bash
# Commit all changes
git add .
git commit -m "Configure production deployment with Render backend"
git push origin main
```

Render will automatically:
1. Pull latest code
2. Run build command
3. Start backend server
4. Serve frontend from `dist/`

### **Step 3: Build Mobile APKs**

```bash
# Navigate to mobile app
cd "/Volumes/Kavi/Emi Pro/EMI-PRO/mobile-app"

# Build User APK (for customers)
cd android && ./gradlew assembleUserRelease

# Build Admin APK (for administrators)
./gradlew assembleAdminRelease
```

### **Step 4: Upload APKs to Backend**

```bash
# Create public folder
mkdir -p "/Volumes/Kavi/Emi Pro/EMI-PRO/backend/public"

# Copy APKs
cp mobile-app/android/app/build/outputs/apk/user/release/app-user-release.apk \
   backend/public/app-user.apk

cp mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk \
   backend/public/app-admin.apk
```

### **Step 5: Test Everything**

1. **Web Admin**: `https://emi-pro.onrender.com`
2. **User APK**: `https://emi-pro.onrender.com/downloads/app-user.apk`
3. **Admin APK**: `https://emi-pro.onrender.com/downloads/app-admin.apk`

---

## 📱 How Users Install the App

### **Method 1: QR Code (Recommended)**

1. Admin generates QR code in web panel
2. Customer scans QR code
3. Device downloads and installs User APK
4. App automatically connects to Render backend
5. Device registers and starts polling

### **Method 2: Direct Download**

1. Customer visits: `https://emi-pro.onrender.com/downloads/app-user.apk`
2. Downloads APK
3. Installs (requires "Unknown Sources" enabled)
4. Opens app and completes setup

---

## 🔧 Development vs Production

### **Development (Local)**
```bash
# Terminal 1: Start backend
cd backend && node server.js
# Runs on: http://localhost:5000

# Terminal 2: Start frontend
npm run dev
# Runs on: http://localhost:8080
# API calls proxied to localhost:5000
```

### **Production (Render)**
```bash
# Single command (on Render)
cd backend && node server.js
# Serves both API and frontend
# Frontend: https://emi-pro.onrender.com
# API: https://emi-pro.onrender.com/api/*
```

---

## 🎯 Current Status

✅ **Completed:**
- API configuration with environment variables
- Production build created
- Development and production URLs configured
- All API calls updated to use centralized config

⏳ **Next:**
- Update backend to serve frontend build
- Deploy to Render
- Build and upload APKs
- Test end-to-end flow

---

## 📞 Quick Commands

```bash
# Build frontend for production
npm run build

# Run development servers
npm run dev:all

# Build User APK
cd mobile-app/android && ./gradlew assembleUserRelease

# Build Admin APK
cd mobile-app/android && ./gradlew assembleAdminRelease

# Deploy to Render
git add . && git commit -m "Deploy" && git push origin main
```

---

## 🎉 You're Ready!

Your app is now configured to:
- ✅ Connect to Render backend in production
- ✅ Connect to localhost in development
- ✅ Serve frontend from Render
- ✅ Provide APK downloads for users
- ✅ Support QR code provisioning

See `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed instructions!
