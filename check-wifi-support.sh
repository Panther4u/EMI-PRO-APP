#!/bin/bash

echo "🔍 Checking if Render deployed WiFi support..."
echo ""

# Test WiFi configuration
RESULT=$(curl -s "https://emi-pro-app.onrender.com/api/provisioning/payload/TEST?wifiSsid=TestWiFi&wifiPassword=TestPass123" | grep -o "PROVISIONING_WIFI_SSID" | head -1)

if [ "$RESULT" == "PROVISIONING_WIFI_SSID" ]; then
    echo "✅ SUCCESS! WiFi support is now live on Render!"
    echo ""
    echo "You can now:"
    echo "1. Generate a NEW QR code with WiFi credentials"
    echo "2. Factory reset your device"
    echo "3. Scan the QR code"
    echo "4. Provisioning should work!"
    echo ""
else
    echo "⏳ Render is still deploying..."
    echo ""
    echo "Wait a bit longer (usually 2-5 minutes total)"
    echo "Then run this script again: ./check-wifi-support.sh"
    echo ""
    echo "Or check Render dashboard: https://dashboard.render.com"
fi
