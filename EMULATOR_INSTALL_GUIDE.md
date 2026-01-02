# Install User APK on Android Emulator

## Prerequisites
- Android Studio installed
- Android SDK and emulator configured
- ADB in PATH

## Step 1: Start Android Emulator

```bash
# List available emulators
emulator -list-avds

# Start an emulator (replace 'Pixel_5_API_30' with your emulator name)
emulator -avd Pixel_5_API_30 &

# Or start from Android Studio:
# Tools > Device Manager > Click Play button on any emulator
```

## Step 2: Verify Device Connection

```bash
# Check if emulator is connected
adb devices

# Should show something like:
# List of devices attached
# emulator-5554   device
```

## Step 3: Install User APK

```bash
cd "/Volumes/Kavi/Emi Pro/EMI-PRO"

# Install the APK
adb install -r backend/public/downloads/app-user-release.apk

# Or if already installed, use -r to replace:
adb install -r backend/public/downloads/app-user-release.apk
```

## Step 4: Set as Device Owner (REQUIRED for testing)

**⚠️ IMPORTANT**: The emulator must be **factory reset** (no Google account) for this to work.

```bash
# Set the app as Device Owner
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver

# Expected output:
# Success: Device owner set to package com.securefinance.emilock.user
```

If you get an error like "Not allowed to set the device owner because there are already some accounts on the device":

```bash
# Factory reset the emulator
adb shell am broadcast -a android.intent.action.FACTORY_RESET

# Or wipe data from command line:
adb -e emu kill
emulator -avd Pixel_5_API_30 -wipe-data &

# Then try setting device owner again
```

## Step 5: Launch the App

```bash
# Launch the app
adb shell am start -n com.securefinance.emilock.user/com.securefinance.emilock.MainActivity

# Or just tap the app icon on the emulator
```

## Step 6: Test QR Scanner

The app should now open to the **QR Scanner** screen (not the HomeScreen).

To test:
1. Open Admin Dashboard: http://localhost:5173
2. Go to a customer's detail page
3. Click "Show QR Code"
4. Use the emulator's camera to scan (or use a screenshot)

## Troubleshooting

### "Installation failed: INSTALL_FAILED_UPDATE_INCOMPATIBLE"
```bash
# Uninstall first
adb uninstall com.securefinance.emilock.user

# Then install again
adb install backend/public/downloads/app-user-release.apk
```

### "Device owner cannot be set"
```bash
# Remove all accounts
adb shell pm list users
adb shell pm remove-user 10  # Replace 10 with actual user ID

# Or factory reset
adb shell am broadcast -a android.intent.action.FACTORY_RESET
```

### Check if Device Owner is set
```bash
adb shell dumpsys device_policy | grep "Device Owner"

# Should show:
# Device Owner: 
#   admin=ComponentInfo{com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver}
```

### View App Logs
```bash
# View real-time logs
adb logcat | grep "SecureFinance"

# Or filter by package
adb logcat | grep "com.securefinance.emilock"
```

## Quick Install Script

Save this as `install-emulator.sh`:

```bash
#!/bin/bash
cd "/Volumes/Kavi/Emi Pro/EMI-PRO"

echo "📱 Installing User APK on emulator..."
adb install -r backend/public/downloads/app-user-release.apk

echo "🔐 Setting as Device Owner..."
adb shell dpm set-device-owner com.securefinance.emilock.user/com.securefinance.emilock.DeviceAdminReceiver

echo "🚀 Launching app..."
adb shell am start -n com.securefinance.emilock.user/com.securefinance.emilock.MainActivity

echo "✅ Done! Check the emulator."
```

Make it executable:
```bash
chmod +x install-emulator.sh
./install-emulator.sh
```
