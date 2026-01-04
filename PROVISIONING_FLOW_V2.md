# 📱 New Two-QR Provisioning Flow

## 🎯 Phase 1: Android System Setup (QR 1)

1.  **Factory Reset** the device.
2.  On the Welcome Screen, **tap anywhere 6 times**.
3.  **Scan the Provisioning QR** generated in the Admin Panel.
4.  **WiFi Selection**: Android will automatically open the WiFi selection screen.
    *   Select your WiFi network.
    *   Enter the password.
5.  **Download & Install**: The device will connect to the internet, download the User APK, and install it as **Device Owner**.
6.  The app will launch automatically.

---

## 🔑 Phase 2: App Activation (QR 2)

1.  The User APK will open to a **"Activate Device"** welcome screen.
2.  Tap **"Scan Activation QR"**.
3.  **Scan the SAME QR** (or the User Details QR) from the Admin Panel.
4.  **Grant Permissions**: The app will request necessary permissions (SMS, Phone, Location, etc.).
5.  **Device Registered**: The device will link to the customer profile and appear as **ACTIVE** in the Admin Dashboard.

---

## ✅ Benefits of this Flow

1.  **WiFi Flexibility**: No need to hardcode WiFi credentials into the QR code. Android handles the connection.
2.  **Higher Security**: No sensitive WiFi credentials stored in the QR payload.
3.  **Better User Guidance**: The second scan ensures the user is aware of the activation process and grants permissions explicitly.
4.  **Automatic Enrolment**: The backend matching ensures the device is correctly linked to the Customer ID.

---

## 🛠️ Technical Details

*   **Backend**: `PROVISIONING_WIFI_SSID` and `PROVISIONING_WIFI_PASSWORD` have been removed from the payload.
*   **Provisioning QR**: Points to `https://emi-pro-app.onrender.com/downloads/securefinance-user.apk`.
*   **Activation**: Managed via `mobile-app/src/screens/SetupScreen.tsx`.
*   **Auto-Link Disabled**: The `App.tsx` auto-sync from native provisioning has been disabled to force the second scan for a more professional setup experience.
