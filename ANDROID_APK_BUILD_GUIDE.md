# Building Real Android APK - EMI Lock App

## 🎯 Overview

This guide will help you create a **real Android APK** that can be installed on physical devices with full device admin capabilities for EMI lock management.

---

## 📋 Prerequisites

### **Required Software:**
1. **Node.js** (v18 or higher) - Already installed ✅
2. **Java Development Kit (JDK)** - Version 17 or 11
3. **Android Studio** - Latest version
4. **Android SDK** - API Level 33 (Android 13) or higher
5. **React Native CLI** - For building native apps

### **Installation Steps:**

#### **1. Install Java JDK 17**
```powershell
# Download from: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
# Or use Chocolatey:
choco install openjdk17

# Verify installation:
java -version
```

#### **2. Install Android Studio**
```powershell
# Download from: https://developer.android.com/studio
# Install with default settings
# During installation, ensure these are checked:
# - Android SDK
# - Android SDK Platform
# - Android Virtual Device
```

#### **3. Set Environment Variables**
```powershell
# Add to System Environment Variables:
ANDROID_HOME = C:\Users\<YourUsername>\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Java\jdk-17

# Add to PATH:
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%JAVA_HOME%\bin
```

#### **4. Install React Native CLI**
```powershell
npm install -g react-native-cli
```

---

## 🚀 Project Setup

### **Option 1: Create New React Native Project**

```powershell
# Navigate to your workspace
cd "C:\Users\pnive\OneDrive\Desktop"

# Create new React Native project
npx react-native@latest init EMILockApp --template react-native-template-typescript

# Navigate to project
cd EMILockApp

# Install required dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-device-info
npm install react-native-permissions
npm install @react-native-async-storage/async-storage
npm install axios
npm install react-native-qrcode-scanner
npm install react-native-camera
```

### **Option 2: Use Expo (Easier but Limited)**

```powershell
# Install Expo CLI
npm install -g expo-cli

# Create Expo project
npx create-expo-app EMILockApp --template blank-typescript

# Navigate to project
cd EMILockApp

# Install dependencies
npx expo install expo-device expo-location expo-camera
npx expo install expo-barcode-scanner
npx expo install @react-navigation/native @react-navigation/stack
```

---

## 📱 Android App Structure

### **Key Files to Create:**

```
EMILockApp/
├── android/
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── AndroidManifest.xml
│   │   │       ├── java/
│   │   │       │   └── com/
│   │   │       │       └── emilockapp/
│   │   │       │           ├── MainActivity.java
│   │   │       │           ├── DeviceAdminReceiver.java
│   │   │       │           └── DeviceLockModule.java
│   │   │       └── res/
│   │   │           └── xml/
│   │   │               └── device_admin.xml
│   │   └── build.gradle
│   └── build.gradle
├── src/
│   ├── screens/
│   │   ├── SetupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── LockedScreen.tsx
│   │   └── PermissionsScreen.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── deviceAdmin.ts
│   │   └── enrollment.ts
│   └── App.tsx
└── package.json
```

---

## 🔧 Android Configuration Files

### **1. AndroidManifest.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.securefinance.emilock">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.RECEIVE_SMS" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    
    <!-- Device Admin Permission -->
    <uses-permission android:name="android.permission.BIND_DEVICE_ADMIN" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        
        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Device Admin Receiver -->
        <receiver
            android:name=".DeviceAdminReceiver"
            android:permission="android.permission.BIND_DEVICE_ADMIN"
            android:exported="true">
            <meta-data
                android:name="android.app.device_admin"
                android:resource="@xml/device_admin" />
            <intent-filter>
                <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
            </intent-filter>
        </receiver>

    </application>

</manifest>
```

### **2. device_admin.xml**

Create: `android/app/src/main/res/xml/device_admin.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-policies>
        <limit-password />
        <watch-login />
        <reset-password />
        <force-lock />
        <wipe-data />
        <expire-password />
        <encrypted-storage />
        <disable-camera />
    </uses-policies>
</device-admin>
```

### **3. DeviceAdminReceiver.java**

Create: `android/app/src/main/java/com/securefinance/emilock/DeviceAdminReceiver.java`

```java
package com.securefinance.emilock;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

public class EMIDeviceAdminReceiver extends DeviceAdminReceiver {
    
    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Toast.makeText(context, "Device Admin Enabled", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Toast.makeText(context, "Device Admin Disabled", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onPasswordChanged(Context context, Intent intent) {
        super.onPasswordChanged(context, intent);
    }

    @Override
    public void onPasswordFailed(Context context, Intent intent) {
        super.onPasswordFailed(context, intent);
    }

    @Override
    public void onPasswordSucceeded(Context context, Intent intent) {
        super.onPasswordSucceeded(context, intent);
    }
}
```

### **4. DeviceLockModule.java**

Create: `android/app/src/main/java/com/securefinance/emilock/DeviceLockModule.java`

```java
package com.securefinance.emilock;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class DeviceLockModule extends ReactContextBaseJavaModule {
    
    private DevicePolicyManager devicePolicyManager;
    private ComponentName adminComponent;
    private ReactApplicationContext reactContext;

    public DeviceLockModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.devicePolicyManager = (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
        this.adminComponent = new ComponentName(reactContext, EMIDeviceAdminReceiver.class);
    }

    @Override
    public String getName() {
        return "DeviceLockModule";
    }

    @ReactMethod
    public void requestAdminPermission(Promise promise) {
        try {
            Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent);
            intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, 
                "This app requires device admin permission to manage EMI lock features.");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isAdminActive(Promise promise) {
        boolean isActive = devicePolicyManager.isAdminActive(adminComponent);
        promise.resolve(isActive);
    }

    @ReactMethod
    public void lockDevice(Promise promise) {
        try {
            if (devicePolicyManager.isAdminActive(adminComponent)) {
                devicePolicyManager.lockNow();
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Device admin not active");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void disableCamera(boolean disable, Promise promise) {
        try {
            if (devicePolicyManager.isAdminActive(adminComponent)) {
                devicePolicyManager.setCameraDisabled(adminComponent, disable);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Device admin not active");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void resetPassword(String password, Promise promise) {
        try {
            if (devicePolicyManager.isAdminActive(adminComponent)) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    devicePolicyManager.resetPassword(password, 0);
                }
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Device admin not active");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void wipeData(Promise promise) {
        try {
            if (devicePolicyManager.isAdminActive(adminComponent)) {
                devicePolicyManager.wipeData(0);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "Device admin not active");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
```

### **5. Register Native Module**

Update: `android/app/src/main/java/com/securefinance/emilock/MainApplication.java`

```java
@Override
protected List<ReactPackage> getPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    // Add custom package
    packages.add(new ReactPackage() {
        @Override
        public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
            List<NativeModule> modules = new ArrayList<>();
            modules.add(new DeviceLockModule(reactContext));
            return modules;
        }

        @Override
        public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
            return Collections.emptyList();
        }
    });
    return packages;
}
```

---

## 📱 React Native App Code

### **App.tsx**

```typescript
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NativeModules, Platform } from 'react-native';

import SetupScreen from './src/screens/SetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import LockedScreen from './src/screens/LockedScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';

const Stack = createStackNavigator();
const { DeviceLockModule } = NativeModules;

export default function App() {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    checkEnrollmentStatus();
  }, []);

  const checkEnrollmentStatus = async () => {
    // Check if device is enrolled
    // Load from AsyncStorage or API
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isEnrolled ? (
          <>
            <Stack.Screen name="Setup" component={SetupScreen} />
            <Stack.Screen name="Permissions" component={PermissionsScreen} />
          </>
        ) : isLocked ? (
          <Stack.Screen name="Locked" component={LockedScreen} />
        ) : (
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 🔨 Building the APK

### **Debug APK (For Testing)**

```powershell
# Navigate to project
cd EMILockApp

# Build debug APK
cd android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### **Release APK (For Production)**

#### **1. Generate Signing Key**

```powershell
# Generate keystore
keytool -genkeypair -v -storetype PKCS12 -keystore emi-lock-key.keystore -alias emi-lock -keyalg RSA -keysize 2048 -validity 10000

# Enter password and details when prompted
```

#### **2. Configure Gradle**

Edit: `android/gradle.properties`

```properties
MYAPP_UPLOAD_STORE_FILE=emi-lock-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=emi-lock
MYAPP_UPLOAD_STORE_PASSWORD=your_keystore_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

Edit: `android/app/build.gradle`

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### **3. Build Release APK**

```powershell
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📦 Install APK on Device

### **Via USB (ADB)**

```powershell
# Enable USB debugging on device
# Connect device via USB

# Install APK
adb install android/app/build/outputs/apk/release/app-release.apk

# Or for debug:
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### **Via QR Code**

1. Upload APK to your server
2. Generate QR code with download URL
3. Scan QR on device
4. Download and install

---

## 🔐 Device Admin Features

### **What the APK Can Do:**

✅ **Lock Device** - Remotely lock the screen  
✅ **Disable Camera** - Block camera access  
✅ **Reset Password** - Change device password  
✅ **Wipe Data** - Factory reset device  
✅ **Track Location** - Get GPS coordinates  
✅ **Read IMEI** - Get device identifier  
✅ **Disable Apps** - Block specific apps  
✅ **Network Control** - Manage WiFi/Data  

---

## 🚀 Next Steps

1. **Create React Native project** using commands above
2. **Add all configuration files** (AndroidManifest, device_admin.xml, etc.)
3. **Implement native modules** (DeviceLockModule.java)
4. **Build React Native screens** (Setup, Home, Locked)
5. **Test on emulator** first
6. **Build debug APK** and test on real device
7. **Build release APK** for production
8. **Integrate with your backend** API

---

## 📝 Important Notes

⚠️ **Device Admin Limitations:**
- User can still uninstall the app
- User can disable device admin in settings
- For true MDM, need Android Enterprise enrollment
- Some features require system-level access

✅ **For Production EMI Lock:**
- Consider using **Android Enterprise** (Work Profile)
- Use **Google Play EMM API**
- Implement **Knox SDK** for Samsung devices
- Add **anti-tamper** mechanisms

---

Would you like me to create the complete React Native project structure with all these files ready to build?
