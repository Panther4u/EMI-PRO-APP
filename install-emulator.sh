#!/bin/bash
cd "/Volumes/Kavi/Emi Pro/EMI-PRO"

echo "📱 Checking for connected devices..."
adb devices

echo ""
echo "📦 Installing User APK on emulator..."
adb install -r backend/public/downloads/app-user-release.apk

if [ $? -eq 0 ]; then
    echo "✅ APK installed successfully"
    
    echo ""
    echo "🔐 Setting as Device Owner..."
    adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver
    
    echo ""
    echo "🚀 Launching app..."
    adb shell am start -n com.securefinance.emilock.user/com.securefinance.emilock.MainActivity
    
    echo ""
    echo "✅ Done! Check the emulator - QR Scanner should appear."
else
    echo "❌ Installation failed. Try:"
    echo "   adb uninstall com.securefinance.emilock.user"
    echo "   Then run this script again"
fi
