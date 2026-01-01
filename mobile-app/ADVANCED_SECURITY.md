# EMI Lock - Advanced Security Features

## Overview

This document covers the advanced security features implemented to prevent device bypass attempts:

1. **SIM Change Instant Lock** - Locks device when SIM is changed
2. **Offline Lock Cache** - SMS-based lock commands when device is offline
3. **Safe Mode Hardening** - Detects and blocks Safe Mode boot attempts

---

## 1️⃣ SIM Change Instant Lock

### How It Works

```
User removes SIM
        ↓
SimChangeReceiver detects SIM_STATE_CHANGED
        ↓
Compares current SIM ICCID with stored original
        ↓
SIM MISMATCH DETECTED!
        ↓
[ACTIONS:]
  ├── Lock device immediately
  ├── Store event in SharedPreferences
  ├── Report to backend
  └── Launch lock screen
        ↓
[DEVICE IS LOCKED]
```

### Key Files

| File | Purpose |
|------|---------|
| `SimChangeReceiver.java` | Detects SIM changes via broadcast |
| `DeviceAdminReceiver.java` | Stores original SIM on provisioning |
| `BootReceiver.java` | Verifies SIM on every boot |

### API Endpoint

When a SIM change is detected, the device reports to:

```
POST /api/customers/:id/sim-change
```

Request:
```json
{
    "originalIccid": "89914901234567890123",
    "newIccid": "89910001111222333444",
    "newOperator": "Jio",
    "timestamp": 1704067200000
}
```

Response:
```json
{
    "success": true,
    "message": "SIM change recorded and device locked",
    "isLocked": true
}
```

### Admin Actions

On SIM change, the backend automatically:
- Sets `isLocked = true`
- Updates `deviceStatus.status = 'warning'`
- Logs to `simChangeHistory` array
- Adds entry to `lockHistory`

### Disable SIM Lock (Optional)

If you need to allow SIM changes for a specific customer:

```javascript
// Admin dashboard can disable SIM lock
await Customer.updateOne(
    { id: customerId },
    { $set: { 'simDetails.isAuthorized': true } }
);
```

---

## 2️⃣ Offline Lock Cache

### How It Works

When device is offline, admins can send lock commands via SMS:

```
Admin sends SMS to device number
        ↓
Format: "LOCK:123456" or "UNLOCK:654321"
        ↓
SmsLockReceiver intercepts SMS
        ↓
Validates token from SharedPreferences
        ↓
[IF VALID:]
  ├── Execute command immediately
  ├── Queue for backend sync
  └── Log the event
        ↓
[IF INVALID:]
  └── Log failed attempt
```

### SMS Command Formats

| Command | Format | Example |
|---------|--------|---------|
| Lock | `LOCK:<token>` | `LOCK:123456` |
| Unlock | `UNLOCK:<token>` | `UNLOCK:654321` |
| Alarm | `ALARM:<token>` | `ALARM:123456` |
| (Alternative) | `EMI_LOCK:<token>` | `EMI_LOCK:123456` |

### Token Generation

Tokens are generated on provisioning:

```java
// In DeviceAdminReceiver.onProfileProvisioningComplete()
String lockToken = String.valueOf(100000 + new Random().nextInt(900000));
String unlockToken = String.valueOf(100000 + new Random().nextInt(900000));
```

### Getting Tokens from Backend

Admin can retrieve tokens:

```
GET /api/customers/:id/tokens
```

Response:
```json
{
    "lockToken": "123456",
    "unlockToken": "654321"
}
```

### Updating Tokens

Admin can set new tokens:

```
POST /api/customers/:id/tokens
```

Request:
```json
{
    "lockToken": "999888",
    "unlockToken": "777666"
}
```

### Key Files

| File | Purpose |
|------|---------|
| `OfflineLockCache.java` | Token validation, command queue |
| `SmsLockReceiver.java` | SMS interception and processing |

### Offline Queue Processing

When device comes back online, `BootReceiver` processes queued commands:

```java
OfflineLockCache offlineCache = new OfflineLockCache(context);
offlineCache.processQueue(lockManager);
```

---

## 3️⃣ Safe Mode Hardening

### What is Safe Mode?

Safe Mode boots Android with only system apps running. Users may try to bypass your app by booting into Safe Mode.

### Protection Layers

#### Layer 1: Block Safe Mode Boot (DPC Level)

```java
// Applied during provisioning
dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT);
```

#### Layer 2: Detect Safe Mode on Boot

```java
// In SafeModeDetector.java
public static boolean isInSafeMode(Context context) {
    // Method 1: Check system property
    String safeMode = System.getProperty("ro.sys.safemode", "0");
    if ("1".equals(safeMode)) return true;
    
    // Method 2: Check Settings.Global
    int safeModeInt = Settings.Global.getInt(
        context.getContentResolver(), "safe_boot", 0);
    if (safeModeInt == 1) return true;
    
    return false;
}
```

#### Layer 3: Respond to Safe Mode

If Safe Mode is detected despite DPC restriction:

```java
// Lock device
lockManager.lockDeviceImmediately();

// Start alarm
lockManager.startPowerButtonAlarm();

// Report to backend
reportSafeModeAttempt(context);
```

### Security Event Reporting

```
POST /api/customers/:id/security-event
```

Request:
```json
{
    "event": "SAFE_MODE_ATTEMPT",
    "timestamp": 1704067200000,
    "action": "LOCKED"
}
```

### Key Files

| File | Purpose |
|------|---------|
| `SafeModeDetector.java` | Detection and response logic |
| `BootReceiver.java` | Checks Safe Mode on every boot |
| `DeviceAdminReceiver.java` | Applies DISALLOW_SAFE_BOOT |

---

## Database Schema Updates

### New Fields in Customer Model

```javascript
// Security Events array
securityEvents: [{
    event: String,     // "SAFE_MODE_ATTEMPT", "SIM_CHANGE", etc.
    timestamp: Date,
    action: String,    // "LOCKED", "ALARMED"
    details: Mixed,
    ipAddress: String
}]

// Updated deviceStatus enum
deviceStatus.status: ['pending', 'installing', 'connected', 
                      'online', 'offline', 'error', 
                      'warning', 'ADMIN_INSTALLED']
```

---

## Testing

### Test SIM Change Lock

1. Provision device with QR code
2. Power off device
3. Remove SIM and insert different SIM
4. Power on device
5. **Expected**: Device locks immediately on boot

### Test SMS Lock (Offline)

1. Enable airplane mode on device
2. Note the device phone number and lock token
3. From another phone, send SMS: `LOCK:123456`
4. **Expected**: Device locks despite no internet

### Test Safe Mode Block

1. Attempt to boot into Safe Mode (power + volume down)
2. **Expected**: Device should NOT boot into Safe Mode
3. If it does boot (OEM variation), device should lock with alarm

---

## Troubleshooting

### SIM Change Not Detected

- Check if `READ_PHONE_STATE` permission is granted
- Verify `SimChangeReceiver` is registered in manifest
- Check if original SIM was stored (first provisioning)

### SMS Lock Not Working

- Check if `RECEIVE_SMS` permission is granted
- Verify token matches (`OFFLINE_LOCK_TOKEN` in SharedPreferences)
- Ensure correct SMS format (e.g., `LOCK:123456`)

### Safe Mode Still Accessible

- Some OEMs may not respect `DISALLOW_SAFE_BOOT`
- Layer 2 (detection) will still lock device
- Layer 3 (alarm) will alert and lock

---

## Security Considerations

1. **Tokens are sensitive** - Store securely on backend
2. **SMS can be intercepted** - Consider encryption for high-security needs
3. **ICCID is permanent** - More reliable than phone number for SIM tracking
4. **Safe Mode detection is OEM-dependent** - Test on target devices

---

## Emergency Recovery

If admin loses access to tokens:

1. Factory reset (if not blocked by DPC)
2. Use ADB to clear app data (if USB debugging was enabled)
3. Re-provision device with new QR code

---

## API Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/customers/:id/sim-change` | POST | Report SIM change |
| `/api/customers/:id/security-event` | POST | Report security events |
| `/api/customers/:id/tokens` | GET | Get offline tokens |
| `/api/customers/:id/tokens` | POST | Update offline tokens |
| `/api/customers/:id/command` | POST | Send remote commands |
