#!/bin/bash

# 🧪 EMI LOCK SYSTEM - COMPLETE TEST SCRIPT
# This script tests the entire Device Owner lock flow

set -e

echo "🔥 EMI LOCK SYSTEM - TESTING GUIDE"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

check_info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

echo ""
echo "📋 PHASE 1: PRE-FLIGHT CHECKS"
echo "=============================="
echo ""

# 1. Check backend
echo "1️⃣  Checking backend API..."
if curl -s https://emi-pro-app.onrender.com/api/provisioning/payload/TEST123 | grep -q "PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME"; then
    check_pass "Backend API is responding"
else
    check_fail "Backend API is not responding"
    exit 1
fi

# 2. Check APK accessibility
echo "2️⃣  Checking APK accessibility..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://emi-pro-app.onrender.com/downloads/securefinance-user.apk)
if [ "$HTTP_CODE" = "200" ]; then
    check_pass "APK is accessible (HTTP $HTTP_CODE)"
else
    check_fail "APK is not accessible (HTTP $HTTP_CODE)"
    exit 1
fi

# 3. Check ADB connection
echo "3️⃣  Checking ADB connection..."
DEVICE_COUNT=$(adb devices | grep -c "device$" || true)
if [ "$DEVICE_COUNT" -gt 0 ]; then
    check_pass "Device connected via ADB"
    DEVICE_MODEL=$(adb shell getprop ro.product.model)
    check_info "Device: $DEVICE_MODEL"
else
    check_fail "No device connected via ADB"
    exit 1
fi

echo ""
echo "📋 PHASE 2: CURRENT DEVICE STATUS"
echo "=================================="
echo ""

# 4. Check if User APK is installed
echo "4️⃣  Checking User APK installation..."
if adb shell pm list packages | grep -q "com.securefinance.emilock.user"; then
    check_pass "User APK is installed"
    VERSION=$(adb shell dumpsys package com.securefinance.emilock.user | grep versionName | head -1 | awk '{print $1}')
    check_info "$VERSION"
else
    check_warn "User APK is NOT installed"
fi

# 5. Check Device Owner status
echo "5️⃣  Checking Device Owner status..."
DEVICE_OWNER=$(adb shell dpm list-owners 2>&1)
if echo "$DEVICE_OWNER" | grep -q "com.securefinance.emilock.user"; then
    check_pass "Device Owner is set correctly"
    check_info "$DEVICE_OWNER"
else
    check_warn "Device Owner is NOT set"
    check_info "Current: $DEVICE_OWNER"
    check_info "This is expected if device has not been provisioned via QR"
fi

# 6. Check for existing accounts
echo "6️⃣  Checking for existing accounts..."
ACCOUNT_COUNT=$(adb shell dumpsys account | grep -c "Account {" || true)
if [ "$ACCOUNT_COUNT" -eq 0 ]; then
    check_pass "No accounts on device (ready for Device Owner setup)"
else
    check_warn "Device has $ACCOUNT_COUNT account(s)"
    check_info "Cannot set Device Owner with existing accounts"
    check_info "Factory reset required for QR provisioning"
fi

# 7. Check if LockScreenService is running
echo "7️⃣  Checking LockScreenService..."
if adb shell dumpsys activity services | grep -q "LockScreenService"; then
    check_pass "LockScreenService is running"
else
    check_warn "LockScreenService is NOT running"
    check_info "Service will start after QR provisioning"
fi

echo ""
echo "📋 PHASE 3: TESTING INSTRUCTIONS"
echo "================================="
echo ""

if echo "$DEVICE_OWNER" | grep -q "com.securefinance.emilock.user"; then
    echo -e "${GREEN}🎉 DEVICE IS PROVISIONED!${NC}"
    echo ""
    echo "You can now test the lock/unlock flow:"
    echo ""
    echo "1️⃣  Open Admin Dashboard"
    echo "2️⃣  Find this device in Customers list"
    echo "3️⃣  Click 'Lock Device'"
    echo "4️⃣  Watch device - should lock within 3 seconds"
    echo "5️⃣  Click 'Unlock Device'"
    echo "6️⃣  Device should unlock within 3 seconds"
    echo ""
    echo "📊 Live monitoring:"
    echo "   adb logcat | grep 'EMI_ADMIN\\|FullDeviceLock\\|LockScreenService'"
    echo ""
else
    echo -e "${YELLOW}⚠️  DEVICE IS NOT PROVISIONED${NC}"
    echo ""
    echo "To provision the device and enable full lock functionality:"
    echo ""
    echo "OPTION 1: QR Code Provisioning (RECOMMENDED)"
    echo "--------------------------------------------"
    echo "1️⃣  Factory reset the device:"
    echo "   Settings → System → Reset → Factory data reset"
    echo ""
    echo "2️⃣  At Welcome screen, tap 6 times on white space"
    echo "   A QR scanner will appear"
    echo ""
    echo "3️⃣  Generate QR code:"
    echo "   - Open Admin Dashboard (web or app)"
    echo "   - Go to 'Provision Device' or 'Add Customer'"
    echo "   - Fill in customer details (Name, Phone, IMEI)"
    echo "   - Click 'Generate QR Code'"
    echo ""
    echo "4️⃣  Scan the QR code with the device"
    echo "   Device will automatically:"
    echo "   - Download User APK"
    echo "   - Install as Device Owner"
    echo "   - Configure SERVER_URL and CUSTOMER_ID"
    echo "   - Start LockScreenService"
    echo ""
    echo "5️⃣  Verify provisioning:"
    echo "   ./test-emi-lock.sh"
    echo ""
    echo ""
    echo "OPTION 2: Manual Testing (LIMITED - No Device Owner)"
    echo "-----------------------------------------------------"
    echo "If you want to test WITHOUT factory reset:"
    echo ""
    echo "1️⃣  Install User APK:"
    echo "   adb install -r backend/public/downloads/securefinance-user.apk"
    echo ""
    echo "2️⃣  Open the app and check what it shows"
    echo "   - If it shows a QR scanner, scan QR from admin dashboard"
    echo "   - If it shows 'Not Linked', you need to provision it"
    echo ""
    echo "⚠️  NOTE: Without Device Owner, lock will be LIMITED:"
    echo "   - Visual lock screen only"
    echo "   - Can be bypassed by power button/home"
    echo "   - NOT suitable for production"
    echo ""
fi

echo ""
echo "📋 PHASE 4: VERIFICATION COMMANDS"
echo "=================================="
echo ""

echo "After provisioning, run these commands to verify:"
echo ""
echo "# Check Device Owner"
echo "adb shell dpm list-owners"
echo ""
echo "# Check Lock Service"
echo "adb shell dumpsys activity services | grep LockScreenService"
echo ""
echo "# Watch logs (real-time)"
echo "adb logcat -c && adb logcat | grep 'EMI_ADMIN\\|FullDeviceLock\\|LockScreenService'"
echo ""
echo "# Check provisioning data"
echo "adb shell run-as com.securefinance.emilock.user cat shared_prefs/PhoneLockPrefs.xml"
echo "(Only works on debug builds)"
echo ""

echo ""
echo "🔥 QUICK TEST FLOW"
echo "=================="
echo ""
echo "1. Provision device via QR (factory reset required)"
echo "2. Verify Device Owner: adb shell dpm list-owners"
echo "3. Open Admin Dashboard"
echo "4. Lock device from dashboard"
echo "5. Watch device lock within 3 seconds"
echo "6. Try to bypass (should be impossible)"
echo "7. Unlock from dashboard"
echo "8. Device should unlock within 3 seconds"
echo ""
echo "✅ If all steps work → System is PRODUCTION READY"
echo ""

