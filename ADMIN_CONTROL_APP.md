# Admin Control Panel APK Guide

This project is now configured to build a **Standalone Admin Android App** that mirrors the full functionality of the web dashboard. This app provides complete control over your customer's devices.

## 📱 Admin App vs Customer App

| Feature | Admin Control Panel APK | Customer Device Owner APK |
| :--- | :--- | :--- |
| **Purpose** | Controller for Admins/Dealers | Locked Kiosk for Customers |
| **Install Method** | Normal Install (APK) | QR Code Provisioning |
| **Permissions** | Internet, Location (for Admin tracking) | Device Owner, System Alert |
| **Source Code** | `src/` (Same as Web Dashboard) | `mobile-app/` (React Native) |

## 🚀 How to Build the Admin APK

We have automated the build process. You can generate the APK with a single command.

### Prerequisites
- **Java/JDK 17** must be installed.
- **Android SDK** must be available (setup via Android Studio or command line).

### Build Command
Run this in the project root:

```bash
npm run build:admin
```

This command will:
1.  Compile the React/Vite Frontend (`src/`).
2.  Sync the code to the Android Project (`android/`).
3.  Compile the Android APK using Gradle.

### 📂 APK Location
Once the build finishes, you can find the APK here:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Transfer this file to your phone and install it.

## 🛠️ Features (Synced with Web)

Since this Admin APK wraps your existing Web Dashboard, it automatically includes all recent features:
*   **Authentication**: Login with Passcode/Admin ID.
*   **Customer Management**: Add Customer, Photo Upload, Finance Details.
*   **Device Provisioning**: Generate QR Codes (Fresh/Used/iOS).
*   **Remote Control**: Lock, Unlock, Wipe, Alarm.
*   **Live Tracking**: View device GPS location map.
*   **Sim Alerts**: Receive real-time SIM change notifications.

## 🔄 Updates
To update the Admin App with new features:
1.  Modify the React code in `src/`.
2.  Run `npm run build:admin` again.
3.  Re-install the new APK.
