#!/bin/bash

# Provision User APK via ADB
# This script manually configures the User APK for testing

CUSTOMER_ID="$1"
SERVER_URL="${2:-https://emi-pro-app.onrender.com}"

if [ -z "$CUSTOMER_ID" ]; then
    echo "Usage: ./provision-device.sh <CUSTOMER_ID> [SERVER_URL]"
    echo "Example: ./provision-device.sh 677a1234567890abcdef1234"
    exit 1
fi

echo "📱 Provisioning User APK..."
echo "Customer ID: $CUSTOMER_ID"
echo "Server URL: $SERVER_URL"

# Create enrollment data JSON
ENROLLMENT_DATA="{\"customerId\":\"$CUSTOMER_ID\",\"serverUrl\":\"$SERVER_URL\"}"

# Set the data via ADB
# Note: This requires the app to be debuggable or rooted device
adb shell "am broadcast -a com.securefinance.emilock.user.SET_CONFIG --es enrollment_data '$ENROLLMENT_DATA'"

# Alternative: Use React Native Debugger or manual app interaction
echo ""
echo "⚠️  Manual Step Required:"
echo "Since the app is a release build, you need to:"
echo "1. Open the User APK on the device"
echo "2. The app should show a setup/enrollment screen"
echo "3. Scan a QR code from the admin dashboard to provision"
echo ""
echo "Or use QR Code Provisioning (Recommended):"
echo "1. Factory reset the device"
echo "2. At Welcome screen, tap 6 times"
echo "3. Scan QR code from admin dashboard"

