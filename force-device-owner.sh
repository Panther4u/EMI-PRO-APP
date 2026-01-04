#!/bin/bash

# 🔥 FORCE DEVICE OWNER SETUP
# This script removes accounts and sets Device Owner via ADB

set -e

echo "🔥 FORCE DEVICE OWNER SETUP"
echo "============================"
echo ""
echo "⚠️  WARNING: This will remove ALL accounts from the device!"
echo ""
echo "Accounts found:"
adb shell dumpsys account | grep "Account {" | head -10
echo ""

read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "📋 Step 1: Removing accounts..."
echo "================================"

# Remove Google account
echo "Removing Google account..."
adb shell am broadcast -a com.google.android.gms.auth.REMOVE_ACCOUNT \
    --es account_name "srikandhanmobilesofficial@gmail.com" \
    --es account_type "com.google" 2>&1 || true

# Alternative method: Use settings
echo "Attempting alternative removal method..."
adb shell pm clear com.google.android.gms 2>&1 || true

echo ""
echo "📋 Step 2: Checking remaining accounts..."
ACCOUNT_COUNT=$(adb shell dumpsys account | grep -c "Account {" || echo "0")
echo "Remaining accounts: $ACCOUNT_COUNT"

if [ "$ACCOUNT_COUNT" -gt 0 ]; then
    echo ""
    echo "⚠️  MANUAL STEP REQUIRED:"
    echo "=========================="
    echo ""
    echo "Accounts still present. Please remove them manually:"
    echo ""
    echo "1. On the device, go to:"
    echo "   Settings → Accounts → Remove all accounts"
    echo ""
    echo "2. After removing all accounts, run:"
    echo "   ./force-device-owner.sh"
    echo ""
    exit 1
fi

echo ""
echo "✅ All accounts removed!"
echo ""
echo "📋 Step 3: Setting Device Owner..."
echo "==================================="

# Set Device Owner
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Device Owner is set!"
    echo ""
    echo "📋 Step 4: Verification..."
    echo "=========================="
    adb shell dpm list-owners
    echo ""
    echo "🎉 Device is now ready for hard lock!"
    echo ""
    echo "Next steps:"
    echo "1. Run: ./test-emi-lock.sh"
    echo "2. Test lock from admin dashboard"
    echo "3. Device should lock HARD within 3 seconds"
    echo ""
else
    echo ""
    echo "❌ Failed to set Device Owner"
    echo ""
    echo "Possible reasons:"
    echo "1. Accounts still present (check Settings → Accounts)"
    echo "2. Device has encryption enabled"
    echo "3. User APK is not installed"
    echo ""
    echo "Try factory reset method instead:"
    echo "Settings → System → Reset → Factory data reset"
    echo ""
fi
