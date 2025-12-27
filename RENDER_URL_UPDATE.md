# ✅ Render Server URL Updated

## 🎯 New Configuration

Your EMI Pro application has been updated to connect to:

**`https://emi-pro.onrender.com`**

---

## 📝 What Was Updated

### **1. Environment Files** ✅
- **`.env.production`** → `VITE_API_URL=https://emi-pro.onrender.com`
- **`src/config/api.ts`** → Fallback URL updated

### **2. Production Build** ✅
- Frontend rebuilt with new Render URL
- Output: `dist/` folder (ready to deploy)

### **3. Documentation** ✅
All documentation files updated with new URL:
- `DEPLOYMENT_SUMMARY.md`
- `PRODUCTION_DEPLOYMENT_GUIDE.md`
- `QUICK_START.md`
- `backend/public/README.md`

---

## 🌐 Your Application URLs

### **Production (Render)**
- **Web Admin Panel**: `https://emi-pro.onrender.com`
- **API Endpoint**: `https://emi-pro.onrender.com/api/customers`
- **User APK Download**: `https://emi-pro.onrender.com/downloads/app-user.apk`
- **Admin APK Download**: `https://emi-pro.onrender.com/downloads/app-admin.apk`

### **Development (Local)**
- **Web Admin Panel**: `http://localhost:8080`
- **API Endpoint**: `http://localhost:5000/api/customers`
- **Backend Server**: `http://localhost:5000`

---

## 🚀 Deploy to Render

### **Step 1: Verify Render Service**

Make sure your Render service is configured with:
- **Service Name**: `emi-pro`
- **URL**: `https://emi-pro.onrender.com`

### **Step 2: Update Render Build Settings**

In your Render dashboard (`https://dashboard.render.com`):

#### **Build Command:**
```bash
npm install && npm run build && cd backend && npm install
```

#### **Start Command:**
```bash
cd backend && node server.js
```

#### **Environment Variables:**
```env
MONGODB_URI=mongodb://teampanther4:dt9dRQvDp6qS08Vc@ac-2cg26ym-shard-00-00.gevdelx.mongodb.net:27017,ac-2cg26ym-shard-00-01.gevdelx.mongodb.net:27017,ac-2cg26ym-shard-00-02.gevdelx.mongodb.net:27017/EMI_LOCK_PRO?replicaSet=atlas-322bib-shard-0&ssl=true&authSource=admin
PORT=5000
NODE_ENV=production
```

### **Step 3: Deploy**

```bash
# Stage all changes
git add .

# Commit with message
git commit -m "Update Render URL to emi-pro.onrender.com"

# Push to GitHub (triggers auto-deploy on Render)
git push origin main
```

Render will automatically:
1. Pull latest code from GitHub
2. Run `npm install && npm run build`
3. Install backend dependencies
4. Start the server with `node server.js`
5. Serve your app at `https://emi-pro.onrender.com`

---

## 🧪 Test the Deployment

### **1. Test Web Admin Panel**
```bash
# Open in browser
open https://emi-pro.onrender.com

# Or test with curl
curl -I https://emi-pro.onrender.com
```

### **2. Test API Endpoint**
```bash
curl https://emi-pro.onrender.com/api/customers
```

Expected response: JSON array of customers

### **3. Test APK Download**
```bash
curl -I https://emi-pro.onrender.com/downloads/app-user.apk
```

Expected: `200 OK` or `404 Not Found` (if APK not uploaded yet)

---

## 📱 Mobile App Configuration

### **QR Code Provisioning**

When you generate QR codes in the admin panel, they will now contain:

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

### **Device Registration Flow**

1. Customer scans QR code
2. Device downloads APK from `https://emi-pro.onrender.com/downloads/app-user.apk`
3. App installs and connects to `https://emi-pro.onrender.com`
4. Device registers with backend
5. App polls for lock status

---

## 📊 Current Status

✅ **Completed:**
- [x] Updated `.env.production` with new URL
- [x] Updated `src/config/api.ts` fallback URL
- [x] Rebuilt production frontend
- [x] Updated all documentation files
- [x] Backend configured to serve frontend and APKs

⏳ **Next Steps:**
- [ ] Build mobile APKs (User and Admin)
- [ ] Upload APKs to `backend/public/` folder
- [ ] Commit all changes to Git
- [ ] Push to GitHub
- [ ] Verify deployment on Render
- [ ] Test web admin panel at `https://emi-pro.onrender.com`
- [ ] Test APK downloads
- [ ] Test QR code provisioning

---

## 🔧 Quick Commands

### **Build APKs**
```bash
cd mobile-app/android

# User APK
./gradlew assembleUserRelease

# Admin APK
./gradlew assembleAdminRelease

# Copy to backend
cp app/build/outputs/apk/user/release/app-user-release.apk \
   ../../backend/public/app-user.apk

cp app/build/outputs/apk/admin/release/app-admin-release.apk \
   ../../backend/public/app-admin.apk
```

### **Deploy to Render**
```bash
git add .
git commit -m "Update to emi-pro.onrender.com"
git push origin main
```

### **Monitor Deployment**
```bash
# Watch Render logs
# Go to: https://dashboard.render.com/web/[your-service-id]/logs

# Or test API
curl https://emi-pro.onrender.com/api/customers
```

---

## 🎉 You're All Set!

Your application is now configured to use:

**`https://emi-pro.onrender.com`**

All API calls from the frontend and mobile apps will automatically connect to this URL in production mode.

---

## 📞 Need Help?

Refer to:
- **`DEPLOYMENT_SUMMARY.md`** - Complete overview
- **`PRODUCTION_DEPLOYMENT_GUIDE.md`** - Detailed deployment steps
- **`QUICK_START.md`** - Quick reference

Happy Deploying! 🚀
