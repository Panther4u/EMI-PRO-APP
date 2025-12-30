# Database Auto-Deletion Issue - Investigation Report
**Generated**: 2025-12-30 16:16 IST

---

## ✅ **INVESTIGATION COMPLETE - NO AUTO-DELETION FOUND**

I've thoroughly checked the codebase for automatic customer deletion issues.

---

## 🔍 **Findings**

### **Potential Deletion Points Found**:

1. **`backend/seed.js`** (Line 146):
   ```javascript
   await Customer.deleteMany({});
   ```
   **Status**: ✅ **SAFE** - Only runs when manually executed (`node backend/seed.js`)
   **Not called automatically** by the server

2. **`backend/routes/customerRoutes.js`** (Line 18):
   ```javascript
   router.delete('/danger/delete-all', async (req, res) => {
       await Customer.deleteMany({});
   });
   ```
   **Status**: ✅ **SAFE** - Requires explicit API call to `/api/customers/danger/delete-all`
   **Not called from frontend**

3. **`backend/routes/customerRoutes.js`** (Line 73):
   ```javascript
   router.post('/bulk', async (req, res) => {
       await Customer.deleteMany({});
       const customers = await Customer.insertMany(req.body);
   });
   ```
   **Status**: ✅ **SAFE** - Requires explicit API call to `/api/customers/bulk`
   **Not called from frontend**

4. **`backend/routes/customerRoutes.js`** (Line 62):
   ```javascript
   router.delete('/:id', async (req, res) => {
       const customer = await Customer.findOneAndDelete({ id: req.params.id });
   });
   ```
   **Status**: ✅ **SAFE** - Only deletes single customer when explicitly requested
   **Used by delete button in UI**

---

## 📊 **Customer Lifecycle Flow**

### **Adding a Customer**:
```
Frontend (QRCodeGenerator.tsx)
  ↓
  calls addCustomer()
  ↓
DeviceContext.tsx
  ↓
  Optimistic update (adds to local state immediately)
  ↓
  POST /api/customers
  ↓
Backend (customerRoutes.js)
  ↓
  Checks for duplicate IMEI
  ↓
  Saves to MongoDB
  ✅ Customer persisted
```

### **No Auto-Deletion Occurs**:
- ✅ No `useEffect` hooks that delete customers
- ✅ No background jobs that clean up customers
- ✅ No time-based deletion logic
- ✅ No cascade deletes

---

## 🛡️ **Protection Mechanisms Already in Place**

1. **Duplicate Check** (Line 31-34):
   ```javascript
   const existing = await Customer.findOne({ imei1: customerData.imei1 });
   if (existing) {
       return res.status(409).json({ message: 'Device with this IMEI already exists' });
   }
   ```

2. **Error Handling**:
   - All database operations wrapped in try-catch
   - Proper error responses returned
   - No silent failures

3. **Optimistic Updates**:
   - Frontend shows customer immediately
   - Backend persistence happens asynchronously
   - Rollback on error (for delete operations)

---

## 🔍 **Possible Causes of "Auto-Deletion"**

If customers are disappearing, it's likely due to:

### **1. Manual API Calls**
Someone might be calling:
- `DELETE /api/customers/danger/delete-all`
- `POST /api/customers/bulk` with empty array
- `DELETE /api/customers/:id` for each customer

### **2. Database Connection Issues**
- MongoDB Atlas connection drops
- Data not persisting due to network issues
- Check Render logs for MongoDB errors

### **3. Render Deployment Resets**
- If using in-memory storage (NOT the case here)
- Render restarts don't affect MongoDB data

### **4. Browser Cache/LocalStorage**
- Frontend shows cached data
- Backend has different data
- Solution: Hard refresh (Ctrl+Shift+R)

---

## ✅ **RECOMMENDATIONS**

### **1. Add Request Logging**

Add to `backend/server.js`:
```javascript
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
```

This will show if delete endpoints are being called.

### **2. Protect Dangerous Endpoints**

Update `backend/routes/customerRoutes.js`:
```javascript
router.delete('/danger/delete-all', async (req, res) => {
    // Require confirmation token
    if (req.headers['x-confirm-delete'] !== 'YES_DELETE_ALL') {
        return res.status(403).json({ message: 'Confirmation required' });
    }
    await Customer.deleteMany({});
    res.json({ message: 'All customer data cleared successfully' });
});
```

### **3. Monitor MongoDB**

Check MongoDB Atlas dashboard:
- Recent operations
- Connection logs
- Data size over time

---

## 🎯 **CONCLUSION**

**No automatic deletion mechanism found in the codebase.**

If customers are being deleted:
1. Check Render logs for DELETE requests
2. Check MongoDB Atlas activity logs
3. Verify no external scripts are running
4. Ensure no one has direct MongoDB access

The system is **working as designed** - customers should persist indefinitely unless explicitly deleted.

---

## 📝 **Next Steps**

If issue persists:
1. Enable request logging (see recommendation #1)
2. Monitor for 24 hours
3. Check logs for unexpected DELETE calls
4. Share logs for further investigation

---

**Report End**
