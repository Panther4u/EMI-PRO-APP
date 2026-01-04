#!/bin/bash

# 🔄 AUTO-UPDATE TEST SCRIPT
# Tests if User APK and Admin APK can detect and install updates

set -e

echo "🔄 AUTO-UPDATE SYSTEM - TEST SCRIPT"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_pass() { echo -e "${GREEN}✅ PASS${NC}: $1"; }
check_fail() { echo -e "${RED}❌ FAIL${NC}: $1"; }
check_warn() { echo -e "${YELLOW}⚠️  WARN${NC}: $1"; }
check_info() { echo -e "${BLUE}ℹ️  INFO${NC}: $1"; }

echo "📋 PHASE 1: VERSION CHECK"
echo "========================="
echo ""

# Check User APK version
echo "1️⃣  Checking User APK version..."
if adb shell pm list packages | grep -q "com.securefinance.emilock.user"; then
    USER_VERSION=$(adb shell dumpsys package com.securefinance.emilock.user | grep versionName | head -1 | awk '{print $1}')
    USER_CODE=$(adb shell dumpsys package com.securefinance.emilock.user | grep versionCode | head -1 | awk '{print $1}')
    check_pass "User APK installed"
    check_info "Installed: $USER_VERSION $USER_CODE"
else
    check_fail "User APK not installed"
    USER_INSTALLED=false
fi

# Check Admin APK version
echo "2️⃣  Checking Admin APK version..."
if adb shell pm list packages | grep -q "com.securefinance.admin"; then
    ADMIN_VERSION=$(adb shell dumpsys package com.securefinance.admin | grep versionName | head -1 | awk '{print $1}')
    ADMIN_CODE=$(adb shell dumpsys package com.securefinance.admin | grep versionCode | head -1 | awk '{print $1}')
    check_pass "Admin APK installed"
    check_info "Installed: $ADMIN_VERSION $ADMIN_CODE"
else
    check_warn "Admin APK not installed"
fi

echo ""
echo "📋 PHASE 2: SERVER VERSION CHECK"
echo "================================="
echo ""

# Check server versions
echo "3️⃣  Checking server versions..."
SERVER_VERSIONS=$(curl -s https://emi-pro-app.onrender.com/downloads/version.json)

if [ $? -eq 0 ]; then
    check_pass "Server is accessible"
    
    # Parse User version
    SERVER_USER_VERSION=$(echo "$SERVER_VERSIONS" | grep -A 4 '"user"' | grep '"version"' | cut -d'"' -f4)
    SERVER_USER_CODE=$(echo "$SERVER_VERSIONS" | grep -A 4 '"user"' | grep '"versionCode"' | awk '{print $2}' | tr -d ',')
    
    # Parse Admin version
    SERVER_ADMIN_VERSION=$(echo "$SERVER_VERSIONS" | grep -A 4 '"admin"' | grep '"version"' | cut -d'"' -f4)
    SERVER_ADMIN_CODE=$(echo "$SERVER_VERSIONS" | grep -A 4 '"admin"' | grep '"versionCode"' | awk '{print $2}' | tr -d ',')
    
    check_info "Server User APK: v$SERVER_USER_VERSION (code: $SERVER_USER_CODE)"
    check_info "Server Admin APK: v$SERVER_ADMIN_VERSION (code: $SERVER_ADMIN_CODE)"
else
    check_fail "Cannot reach server"
    exit 1
fi

echo ""
echo "📋 PHASE 3: UPDATE AVAILABILITY"
echo "================================"
echo ""

# Compare versions
echo "4️⃣  Checking for updates..."

# Extract version codes
INSTALLED_USER_CODE=$(echo "$USER_CODE" | grep -o '[0-9]*')
INSTALLED_ADMIN_CODE=$(echo "$ADMIN_CODE" | grep -o '[0-9]*' || echo "0")

if [ "$INSTALLED_USER_CODE" -lt "$SERVER_USER_CODE" ]; then
    check_info "🆕 User APK update available!"
    check_info "   Installed: $INSTALLED_USER_CODE → Server: $SERVER_USER_CODE"
    USER_UPDATE_AVAILABLE=true
else
    check_pass "User APK is up to date"
    USER_UPDATE_AVAILABLE=false
fi

if [ "$INSTALLED_ADMIN_CODE" != "0" ] && [ "$INSTALLED_ADMIN_CODE" -lt "$SERVER_ADMIN_CODE" ]; then
    check_info "🆕 Admin APK update available!"
    check_info "   Installed: $INSTALLED_ADMIN_CODE → Server: $SERVER_ADMIN_CODE"
    ADMIN_UPDATE_AVAILABLE=true
else
    check_pass "Admin APK is up to date (or not installed)"
    ADMIN_UPDATE_AVAILABLE=false
fi

echo ""
echo "📋 PHASE 4: AUTO-UPDATE STATUS"
echo "==============================="
echo ""

# Check if User APK is provisioned
echo "5️⃣  Checking User APK provisioning..."
if adb shell dumpsys activity services | grep -q "LockScreenService"; then
    check_pass "LockScreenService is running"
    check_info "Auto-update checks happen every 1 hour"
else
    check_warn "LockScreenService is NOT running"
    check_info "User APK is not provisioned (no SERVER_URL/CUSTOMER_ID)"
    check_info "Auto-update will NOT work until provisioned"
fi

echo ""
echo "📋 PHASE 5: MANUAL UPDATE TEST"
echo "==============================="
echo ""

if [ "$USER_UPDATE_AVAILABLE" = true ]; then
    echo "6️⃣  Testing manual update trigger..."
    echo ""
    echo "To trigger update check manually:"
    echo ""
    echo "Option 1: Via App (if provisioned)"
    echo "  1. Open User APK on device"
    echo "  2. Tap 'Check for Updates' button"
    echo "  3. Watch logs: adb logcat | grep AutoUpdateManager"
    echo ""
    echo "Option 2: Via ADB (force trigger)"
    echo "  adb shell am broadcast -a com.securefinance.emilock.CHECK_UPDATE"
    echo ""
    echo "Option 3: Wait for automatic check (1 hour interval)"
    echo "  LockScreenService checks every 1 hour automatically"
    echo ""
    
    read -p "Do you want to watch logs for update activity? (yes/no): " WATCH_LOGS
    if [ "$WATCH_LOGS" = "yes" ]; then
        echo ""
        echo "📊 Watching logs (Ctrl+C to stop)..."
        echo "===================================="
        adb logcat -c
        adb logcat | grep -E "AutoUpdateManager|LockScreenService|Update"
    fi
else
    check_info "No updates available to test"
fi

echo ""
echo "📋 SUMMARY"
echo "=========="
echo ""

echo "Installed Versions:"
echo "  User APK:  $USER_VERSION ($USER_CODE)"
echo "  Admin APK: ${ADMIN_VERSION:-Not installed}"
echo ""
echo "Server Versions:"
echo "  User APK:  v$SERVER_USER_VERSION (code: $SERVER_USER_CODE)"
echo "  Admin APK: v$SERVER_ADMIN_VERSION (code: $SERVER_ADMIN_CODE)"
echo ""
echo "Update Status:"
if [ "$USER_UPDATE_AVAILABLE" = true ]; then
    echo "  User APK:  🆕 Update available"
else
    echo "  User APK:  ✅ Up to date"
fi
if [ "$ADMIN_UPDATE_AVAILABLE" = true ]; then
    echo "  Admin APK: 🆕 Update available"
else
    echo "  Admin APK: ✅ Up to date"
fi
echo ""
echo "Auto-Update Status:"
if adb shell dumpsys activity services | grep -q "LockScreenService"; then
    echo "  ✅ Enabled (LockScreenService running)"
    echo "  ℹ️  Checks every 1 hour automatically"
else
    echo "  ❌ Disabled (User APK not provisioned)"
    echo "  ℹ️  Provision via QR to enable auto-update"
fi
echo ""

echo "🔥 NEXT STEPS"
echo "============="
echo ""

if [ "$USER_UPDATE_AVAILABLE" = true ]; then
    echo "User APK update is available!"
    echo ""
    if adb shell dumpsys activity services | grep -q "LockScreenService"; then
        echo "✅ Auto-update is enabled. Update will install automatically within 1 hour."
        echo ""
        echo "To trigger update immediately:"
        echo "  1. Open User APK on device"
        echo "  2. Tap 'Apply Security Update' button"
        echo "  3. Or wait for automatic check"
    else
        echo "⚠️  Auto-update is disabled (not provisioned)"
        echo ""
        echo "To enable auto-update:"
        echo "  1. Provision device via QR code"
        echo "  2. Or manually install new APK:"
        echo "     adb install -r backend/public/downloads/securefinance-user.apk"
    fi
else
    echo "✅ All APKs are up to date!"
    echo ""
    echo "To test auto-update:"
    echo "  1. Increment version in version.json"
    echo "  2. Run this script again"
    echo "  3. Watch for update detection"
fi

echo ""
