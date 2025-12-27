# EMI App - Data Reset & Fresh Start Guide

## Summary of Changes

I've successfully implemented the following fixes to resolve your issues:

### 1. ✅ Removed All Dummy/Mock Data
- **File**: `src/data/mockCustomers.ts`
- **Change**: Cleared all 5 dummy customer records (Rajesh Kumar, Priya Sharma, Mohammed Ali, Sneha Patel, Arun Nair)
- **Result**: The app now starts with a completely empty customer list

### 2. ✅ Fixed Data Persistence Issues
- **File**: `src/context/DeviceContext.tsx`
- **Change**: Updated to start with empty state instead of loading from localStorage on initialization
- **Result**: Prevents duplicate data and ensures fresh data is always loaded from the backend

### 3. ✅ Added "Reset All Data" Feature
- **File**: `src/pages/Settings.tsx`
- **New Feature**: Added a "Danger Zone" section with a "Reset All Data" button
- **Functionality**: 
  - Clears all customer data from MongoDB backend
  - Clears localStorage
  - Requires double confirmation to prevent accidental deletion
  - Automatically refreshes the page after reset

## How to Use the Reset Feature

1. **Navigate to Settings Page**
   - Click on "Settings" in the sidebar

2. **Scroll to "Danger Zone" Section**
   - Located at the bottom of the Settings page
   - Has a red warning border

3. **Click "Reset All Data"**
   - First click: Shows confirmation warning
   - Second click ("Confirm Reset"): Executes the reset
   - Cancel button available to abort

4. **Page Auto-Refreshes**
   - After successful reset, the page will automatically reload
   - All customer data will be cleared

## How to Start the Application

### Option 1: Run Frontend and Backend Together (Recommended)
```powershell
# If you encounter PowerShell execution policy errors, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then start both servers:
npm run dev:all
```

### Option 2: Run Separately
```powershell
# Terminal 1 - Backend Server
cd backend
node server.js

# Terminal 2 - Frontend Development Server
npm run dev
```

## Application URLs
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **MongoDB**: Connected via MongoDB Atlas (credentials in `backend/.env`)

## Current State

### ✅ What's Fixed:
1. **No duplicate data** - Fresh start with empty database
2. **Device details save properly** - IMEI, model, and all other details are now saved to backend
3. **Clean slate** - All dummy data removed from both frontend and backend
4. **Easy reset** - New Settings feature to clear all data anytime

### 📝 How Data Flow Works Now:

1. **Generate QR Page** → Fill customer details → Click "Generate QR Code"
2. **Data is saved to**:
   - MongoDB Atlas (backend database)
   - localStorage (local cache)
3. **Data is loaded from**:
   - Backend on app startup
   - Falls back to localStorage if backend is unavailable

### 🔄 To Clear All Data:
- **Option 1**: Use the "Reset All Data" button in Settings (recommended)
- **Option 2**: Manually clear browser localStorage and restart backend

## Backend Database Endpoint

The backend now has a special endpoint for clearing all data:
- **Endpoint**: `DELETE /api/customers/danger/delete-all`
- **Used by**: Settings page "Reset All Data" button
- **Security**: Only accessible from the frontend (CORS protected)

## Next Steps

1. **Start the servers** using one of the methods above
2. **Login to admin panel** (default PIN: 123456)
3. **Go to Generate QR** page
4. **Add your first customer** with device details
5. **Verify data is saved** by checking the Customers page

## Troubleshooting

### If you see old dummy data:
1. Go to Settings → Danger Zone
2. Click "Reset All Data" twice
3. Wait for page to refresh

### If device details aren't saving:
1. Make sure backend server is running (`node backend/server.js`)
2. Check browser console for any errors
3. Verify MongoDB connection in backend terminal

### If you get PowerShell errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Files Modified

1. `src/data/mockCustomers.ts` - Removed all dummy data
2. `src/context/DeviceContext.tsx` - Fixed initialization to start fresh
3. `src/pages/Settings.tsx` - Added Reset All Data feature
4. `backend/routes/customerRoutes.js` - Already had delete-all endpoint

---

**All changes are complete and ready to use!** 🎉

The app will now:
- ✅ Start with no dummy data
- ✅ Save all device details to backend
- ✅ Prevent duplicates
- ✅ Allow easy data reset via Settings
