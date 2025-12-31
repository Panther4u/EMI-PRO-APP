# IMEI-BASED PROVISIONING FIX - "Invalid QR" Resolution

## 🎯 ROOT CAUSE IDENTIFIED

The error **"Invalid QR - QR code missing customerId"** was caused by a **logic mismatch**:

- ✅ **QR Payload**: Updated to IMEI-based provisioning (no customerId required)
- ❌ **Admin APK Code**: Still expected customerId and rejected QR without it
- ❌ **SetupScreen.tsx**: Had strict validation requiring customerId

This was **NOT an Android provisioning issue** - the QR was scanned successfully, the APK was installed, but the **app code rejected the payload**.

---

## 🛠️ FIXES IMPLEMENTED

### 1. **DeviceAdminReceiver.java** - Made customerId Optional

**Before:**
```java
// Required customerId from QR
String customerId = intent.getStringExtra("customerId");
if (customerId == null) {
    // FAILED - showed error
}
```

**After:**
```java
// 🎯 IMEI-FIRST: customerId is OPTIONAL
String customerId = null;
String serverUrl = null;

try {
    Bundle extras = intent.getParcelableExtra(...);
    if (extras != null) {
        customerId = extras.getString("customerId");
        serverUrl = extras.getString("serverUrl");
    }
} catch (Exception e) {
    Log.w(TAG, "No QR extras - proceeding with IMEI-only registration");
}

// Default to production server if not specified
if (serverUrl == null || serverUrl.isEmpty()) {
    serverUrl = "https://emi-pro-app.onrender.com";
}

// ✅ Works with or without customerId
DeviceInfoCollector.collectAndSend(context, customerId, serverUrl);
```

**Key Changes:**
- customerId is now **optional** (may be null)
- serverUrl defaults to production if not provided
- No validation errors - proceeds with IMEI-only registration

---

### 2. **DeviceInfoCollector.java** - deviceId as Primary Identifier

**Before:**
```java
payload.put("imei", getImei(context));
if (customerId != null) {
    payload.put("customerId", customerId);
}
```

**After:**
```java
// 🎯 PRIMARY IDENTIFIER: IMEI or Android ID (NOT customerId)
String deviceId = getImei(context);
payload.put("deviceId", deviceId);
payload.put("imei", deviceId); // Backward compatibility

// Device Info
payload.put("brand", Build.BRAND);
payload.put("model", Build.MODEL);
payload.put("androidVersion", Build.VERSION.SDK_INT);
payload.put("status", "ADMIN_INSTALLED");

// OPTIONAL: customerId (may be null for IMEI-only provisioning)
if (customerId != null && !customerId.isEmpty()) {
    payload.put("customerId", customerId);
    Log.d(TAG, "Including customerId in payload: " + customerId);
} else {
    Log.i(TAG, "No customerId - using IMEI-only registration");
}
```

**Payload Sent to Backend:**
```json
{
  "deviceId": "abc123def456",
  "imei": "abc123def456",
  "brand": "Samsung",
  "model": "Galaxy A12",
  "androidVersion": 12,
  "androidId": "xyz789",
  "status": "ADMIN_INSTALLED",
  "location": { "lat": 12.34, "lng": 56.78 }
}
```

**Note:** No `customerId` field if not provided in QR!

---

### 3. **SetupScreen.tsx** - Removed Strict Validation

**Before:**
```typescript
if (!customerId) {
    Alert.alert("Invalid QR", "QR code missing customerId");
    return; // ❌ BLOCKED HERE
}
```

**After:**
```typescript
// 🎯 IMEI-BASED PROVISIONING: customerId is OPTIONAL
if (!customerId) {
    console.log("⚠️ No customerId in QR - using IMEI-based provisioning");
    customerId = "IMEI_BASED"; // Placeholder
}

// Default to production server if not specified
if (!serverUrl) {
    serverUrl = 'https://emi-pro-app.onrender.com';
}

// ✅ Continues without error
```

**Key Changes:**
- No error alert for missing customerId
- Sets placeholder "IMEI_BASED" for internal tracking
- Defaults to production server

---

### 4. **Backend `/api/devices/register`** - IMEI Auto-Matching

**Before:**
```javascript
const device = await Device.findOneAndUpdate(
    { androidId },
    { customerId: req.body.customerId || "UNCLAIMED" }
);
```

**After:**
```javascript
// Primary identifier: deviceId (IMEI or Android ID)
const primaryId = deviceId || imei || androidId;

// 🎯 IMEI-BASED AUTO-MATCHING
let matchedCustomerId = req.body.customerId;

if (!matchedCustomerId || matchedCustomerId === "IMEI_BASED") {
    console.log(`🔍 Attempting IMEI-based matching...`);
    
    const matchedCustomer = await Customer.findOne({
        $or: [
            { imei1: primaryId },
            { imei2: primaryId },
            { "deviceStatus.technical.androidId": primaryId }
        ]
    });

    if (matchedCustomer) {
        matchedCustomerId = matchedCustomer.id;
        console.log(`✅ IMEI MATCH FOUND! Linked to: ${matchedCustomerId}`);
    } else {
        matchedCustomerId = "UNCLAIMED";
    }
}

// Upsert device with matched or unclaimed status
const device = await Device.findOneAndUpdate(
    { androidId: primaryId },
    {
        androidId: primaryId,
        imei: primaryId,
        status: matchedCustomerId === "UNCLAIMED" ? "UNCLAIMED" : "ADMIN_INSTALLED",
        customerId: matchedCustomerId
    },
    { upsert: true, new: true }
);

// Auto-link to customer if matched
if (matchedCustomerId && matchedCustomerId !== "UNCLAIMED") {
    await Customer.findOneAndUpdate(
        { id: matchedCustomerId },
        { $set: { /* device info */ } }
    );
}
```

**Backend Logic:**
1. Receives device registration with `deviceId` (IMEI/Android ID)
2. If no `customerId` provided, searches for customer by IMEI
3. If match found → auto-links device to customer
4. If no match → creates "UNCLAIMED" device (visible in dashboard)
5. Admin can manually claim unclaimed devices later

---

## 🔄 COMPLETE FLOW (IMEI-BASED)

### **Provisioning Flow:**

1. **Admin Dashboard** → Generate QR for customer (stores IMEI in customer record)
2. **Factory Reset Device** → Tap 6 times on welcome screen
3. **Scan QR Code** → Contains ONLY provisioning config (no customerId)
   ```json
   {
     "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "...",
     "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "...",
     "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "..."
   }
   ```
4. **APK Downloads** → `securefinance-admin.apk` from backend
5. **Device Owner Setup** → Android grants privileges
6. **`onProfileProvisioningComplete()` Fires:**
   - ✅ No customerId validation
   - ✅ Collects IMEI/Android ID
   - ✅ Sends to backend: `POST /api/devices/register`
   - ✅ Persists serverUrl to SharedPreferences
   - ✅ Launches app
7. **Backend Auto-Matching:**
   - Receives `deviceId: "abc123def456"`
   - Searches: `Customer.findOne({ imei1: "abc123def456" })`
   - **Match Found!** → Links device to customer
   - Updates customer status to "ADMIN_INSTALLED"
8. **Dashboard Updates** → Device appears with full info
9. **App Operates** → Device is enrolled and locked/unlocked remotely

---

## ✅ EXPECTED BEHAVIOR AFTER FIX

| Step | Before Fix | After Fix |
|------|-----------|-----------|
| QR Scanned | ✅ | ✅ |
| APK Installed | ✅ | ✅ |
| App Launches | ❌ "Invalid QR" error | ✅ No error |
| Device Registered | ❌ Blocked | ✅ Sent to backend |
| IMEI Matching | ❌ N/A | ✅ Auto-matched |
| Dashboard Update | ❌ No device shown | ✅ Device appears |
| Lock/Unlock Works | ❌ N/A | ✅ Fully functional |

---

## 📦 FILES MODIFIED

1. **`DeviceAdminReceiver.java`**
   - Made customerId optional
   - Added default serverUrl fallback
   - Improved logging

2. **`DeviceInfoCollector.java`**
   - Changed primary identifier to `deviceId`
   - Made customerId optional in payload
   - Added detailed logging

3. **`SetupScreen.tsx`**
   - Removed strict customerId validation
   - Added IMEI-based provisioning support
   - Defaults to production server

4. **`deviceRoutes.js`** (`/api/devices/register`)
   - Added IMEI-based auto-matching
   - Searches customers by IMEI if no customerId
   - Creates unclaimed devices if no match

5. **`backend/public/securefinance-admin.apk`**
   - Rebuilt with all fixes (37MB, Jan 1 02:26)

---

## 🚀 DEPLOYMENT STEPS

1. **Deploy Backend:**
   ```bash
   git add backend/routes/deviceRoutes.js
   git commit -m "Add IMEI-based auto-matching to device registration"
   git push
   ```

2. **APK is Already Updated:**
   - `backend/public/securefinance-admin.apk` (37MB)
   - Backend will serve this during provisioning

3. **Test on Real Device:**
   - Factory reset device
   - Generate QR from dashboard (with customer IMEI)
   - Scan QR during setup
   - **Expected:** No "Invalid QR" error
   - **Expected:** Device appears in dashboard automatically

---

## 🧪 TESTING CHECKLIST

- [ ] Factory reset test device
- [ ] Create customer in dashboard with IMEI
- [ ] Generate QR code
- [ ] Tap 6 times on welcome screen
- [ ] Scan QR code
- [ ] Verify APK downloads and installs
- [ ] **Verify NO "Invalid QR" error**
- [ ] Verify app launches successfully
- [ ] Check backend logs for IMEI match
- [ ] Verify device appears in dashboard
- [ ] Test remote lock/unlock
- [ ] Test payment collection

---

## 🔍 DEBUGGING

If issues persist, check backend logs for:

```
🔥 DEVICE REGISTER HIT 🔥
📱 Device registration - ID: abc123def456, Brand: Samsung, Model: Galaxy A12
🔍 No customerId provided - attempting IMEI-based matching...
✅ IMEI MATCH FOUND! Linked to customer: CUST123456 (John Doe)
🔗 Auto-linking device abc123def456 to customer CUST123456
✅ Customer CUST123456 updated with device info
✅ Device registered/updated: abc123def456
```

If you see `⚠️ No customer found with IMEI abc123def456`, verify:
- Customer record exists in database
- IMEI in customer record matches device IMEI
- IMEI is stored in `imei1` or `imei2` field

---

## 📝 ARCHITECTURE NOTES

### **Why IMEI-Based?**

1. **Simplicity**: QR code only contains provisioning config
2. **Security**: No sensitive customer data in QR
3. **Flexibility**: Works even if QR is generic
4. **Auto-Matching**: Backend intelligently links devices
5. **Unclaimed Devices**: Admin can claim orphaned devices manually

### **Backward Compatibility:**

- Still supports customerId in QR if provided
- Falls back to IMEI matching if customerId missing
- Works with both old and new QR formats

---

**Date:** January 1, 2026, 02:26 AM IST  
**Build Time:** 1m 40s  
**APK Size:** 37MB  
**Status:** ✅ READY FOR TESTING
