import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NativeModules, Alert, Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_VERSION } from './src/config';

import SetupScreen from './src/screens/SetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import LockedScreen from './src/screens/LockedScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AdminScreen from './src/screens/AdminScreen';

const Stack = createStackNavigator();
const { DeviceLockModule } = NativeModules;

export default function App() {
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isLocked, setIsLocked] = useState(false); // Default to UNLOCKED to prevent startup lock issues
    const [isAdmin, setIsAdmin] = useState(false);

    // Handle app state changes (foreground/background)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                // Re-check lock status when app comes to foreground
                checkLockStatus();
            }
        });

        return () => subscription?.remove();
    }, []);

    // Check lock status from native module
    // Check lock status from native module
    const checkLockStatus = useCallback(async () => {
        if (isAdmin) return; // Skip if admin

        if (DeviceLockModule && DeviceLockModule.isDeviceLocked) {
            try {
                const locked = await DeviceLockModule.isDeviceLocked();
                console.log("📱 Device lock status:", locked ? "LOCKED" : "UNLOCKED");
                setIsLocked(locked);

                // Persist to AsyncStorage
                await AsyncStorage.setItem('lock_status', locked ? 'locked' : 'unlocked');

                // If locked, ensure kiosk mode is active
                if (locked && DeviceLockModule.startKioskMode) {
                    try {
                        await DeviceLockModule.startKioskMode();
                        console.log("✅ Kiosk mode enforced");
                    } catch (e) {
                        console.warn("Kiosk mode failed:", e);
                    }
                }
            } catch (e) {
                console.warn("Failed to check lock status:", e);
            }
        }
    }, [isAdmin]);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkForUpdates = async (serverUrl: string) => {
        try {
            const response = await fetch(`${serverUrl}/downloads/version.json`);
            if (response.ok) {
                const data = await response.json();
                if (data.version !== APP_VERSION) {
                    Alert.alert(
                        "Update Available",
                        `A new version (${data.version}) is available. Would you like to update?`,
                        [
                            { text: "Later", style: "cancel" },
                            {
                                text: "Update Now",
                                onPress: () => Linking.openURL(data.admin_apk)
                            }
                        ]
                    );
                }
            }
        } catch (e) {
            console.log("Update check failed", e);
        }
    };

    const checkStatus = async () => {
        let currentServerUrl = 'https://emi-pro-app.onrender.com';

        try {
            console.log("🔍 Checking device status...");

            const dlm = NativeModules.DeviceLockModule;
            let currentPackage = '';
            let deviceIsOwner = false;
            let deviceIsLocked = true; // Default to locked for safety

            // 1. Get app info and device owner status
            let isAdminLocal = false; // Local variable for immediate logic usage

            if (dlm && dlm.getAppInfo) {
                try {
                    const appInfo = await dlm.getAppInfo();
                    currentPackage = appInfo?.packageName || '';
                    deviceIsOwner = appInfo?.isDeviceOwner || false;
                    deviceIsLocked = appInfo?.isLocked ?? false; // Default to false to avoid accidental lock

                    console.log("📱 Package:", currentPackage);
                    console.log("👑 Device Owner:", deviceIsOwner);
                    console.log("🔒 Locked:", deviceIsLocked);

                    // Detect Admin App
                    if (currentPackage.endsWith('.admin') || currentPackage.includes('.admin')) {
                        console.log("✅ Admin ID Detected");
                        isAdminLocal = true;
                        setIsAdmin(true);
                        setIsLocked(false);
                    }
                } catch (appInfoError) {
                    console.warn("getAppInfo failed:", appInfoError);
                }
            }

            // 2. Check provisioning data
            console.log("📋 Checking provisioning data...");
            if (dlm && dlm.getProvisioningData) {
                try {
                    const provisioningData = await dlm.getProvisioningData();
                    if (provisioningData?.isProvisioned) {
                        console.log("✅ Device is provisioned");

                        if (provisioningData.customerId) {
                            await AsyncStorage.setItem('enrollment_data', JSON.stringify({
                                customerId: provisioningData.customerId,
                                serverUrl: provisioningData.serverUrl || currentServerUrl,
                                enrolledAt: new Date().toISOString()
                            }));
                        }

                        setIsEnrolled(true);

                        // Only set locked if NOT admin
                        if (!isAdminLocal) {
                            setIsLocked(deviceIsLocked);
                        }

                        // Start lock service
                        if (dlm.startLockService) {
                            try {
                                await dlm.startLockService();
                                console.log("🔐 Lock service started");
                            } catch (e) {
                                console.warn("Failed to start lock service:", e);
                            }
                        }

                        // Apply security restrictions if device owner
                        if (deviceIsOwner && dlm.applySecurityRestrictions) {
                            try {
                                await dlm.applySecurityRestrictions();
                                console.log("🛡️ Security restrictions applied");
                            } catch (e) {
                                console.warn("Failed to apply security:", e);
                            }
                        }
                    }
                } catch (provError) {
                    console.warn("getProvisioningData failed:", provError);
                }
            }

            // 3. Check stored enrollment data
            const enrollmentDataStr = await AsyncStorage.getItem('enrollment_data');
            const lockStatus = await AsyncStorage.getItem('lock_status');

            if (enrollmentDataStr) {
                setIsEnrolled(true);
                const enrollmentData = JSON.parse(enrollmentDataStr);
                currentServerUrl = enrollmentData.serverUrl || currentServerUrl;

                // Sync with backend
                await syncStatus(enrollmentData.customerId, currentServerUrl);

                // Verify device
                verifyDevice(enrollmentData.customerId, currentServerUrl);
            }

            // Get lock status - prioritize native module over AsyncStorage
            const storedLockStatus = lockStatus === 'locked';

            // FINAL LOCK STATE DECISION
            if (!isAdminLocal) {
                const shouldBeLocked = deviceIsLocked || storedLockStatus;
                console.log(`🔒 Final Lock Decision: ${shouldBeLocked} (Admin: ${isAdminLocal})`);
                setIsLocked(shouldBeLocked);

                // 4. ENABLE KIOSK MODE IF DEVICE IS LOCKED (Skip for Admin App)
                if (shouldBeLocked && DeviceLockModule && DeviceLockModule.startKioskMode) {
                    try {
                        console.log("🔒 Device is locked - Enabling Kiosk Mode");
                        await DeviceLockModule.startKioskMode();
                        console.log("✅ Kiosk Mode ENABLED");
                    } catch (e) {
                        console.error("❌ Failed to enable Kiosk Mode:", e);
                    }
                }
            } else {
                console.log("🛡️ Admin App - Forcing Unlock State");
                setIsLocked(false);
            }

            checkForUpdates(currentServerUrl);

        } catch (e) {
            console.error("Critical Startup Error:", e);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };

    const syncStatus = async (cid: string, url: string, step?: string) => {
        if (!cid || !url || isAdmin) return;
        try {
            let location = null;
            try {
                const getCoords = () => new Promise((resolve, reject) => {
                    (navigator as any).geolocation.getCurrentPosition(
                        (pos: any) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        (err: any) => reject(err),
                        { enableHighAccuracy: false, timeout: 5000 }
                    );
                });
                location = await getCoords();
            } catch (locErr) {
                // Ignore location errors
            }

            const body: any = {
                customerId: cid,
                deviceId: cid,
                status: 'online',
                appInstalled: true,
                location
            };
            if (step) body.step = step;

            const response = await fetch(`${url}/api/customers/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const data = await response.json();

                // Handle Remote Commands
                if (data.command) {
                    console.log("🚀 Remote Command:", data.command);

                    if (data.command === 'lock') {
                        console.log("🔒 LOCKING DEVICE");
                        setIsLocked(true);
                        await AsyncStorage.setItem('lock_status', 'locked');

                        if (DeviceLockModule) {
                            // Lock immediately
                            if (DeviceLockModule.lockDeviceImmediately) {
                                await DeviceLockModule.lockDeviceImmediately();
                            }
                            // Enable kiosk mode
                            if (DeviceLockModule.startKioskMode) {
                                await DeviceLockModule.startKioskMode();
                            }
                        }

                    } else if (data.command === 'unlock') {
                        console.log("🔓 UNLOCKING DEVICE");
                        setIsLocked(false);
                        await AsyncStorage.setItem('lock_status', 'unlocked');

                        if (DeviceLockModule) {
                            // Unlock device
                            if (DeviceLockModule.unlockDevice) {
                                await DeviceLockModule.unlockDevice();
                            }
                            // Disable kiosk mode
                            if (DeviceLockModule.stopKioskMode) {
                                await DeviceLockModule.stopKioskMode();
                            }
                        }

                    } else if (data.command === 'wipe') {
                        console.log("⚠️ WIPING DEVICE");
                        if (DeviceLockModule?.wipeData) {
                            DeviceLockModule.wipeData();
                        }

                    } else if (data.command === 'setWallpaper' && data.wallpaperUrl) {
                        console.log("🖼️ Setting wallpaper:", data.wallpaperUrl);
                        if (DeviceLockModule?.setWallpaper) {
                            DeviceLockModule.setWallpaper(data.wallpaperUrl);
                        }

                    } else if (data.command === 'setPin' && data.pin) {
                        console.log("🔢 Setting PIN");
                        if (DeviceLockModule?.setDevicePin) {
                            DeviceLockModule.setDevicePin(data.pin);
                        }

                    } else if (data.command === 'alarm') {
                        console.log("🚨 Starting alarm");
                        if (DeviceLockModule?.startPowerAlarm) {
                            DeviceLockModule.startPowerAlarm();
                        }
                    }
                }

                // Legacy isLocked support
                if (data.isLocked !== undefined) {
                    const newLockState = !!data.isLocked;
                    if (newLockState !== isLocked) {
                        console.log(`🔄 Lock state: ${newLockState ? 'LOCKED' : 'UNLOCKED'}`);
                        setIsLocked(newLockState);
                        await AsyncStorage.setItem('lock_status', newLockState ? 'locked' : 'unlocked');

                        if (DeviceLockModule) {
                            if (newLockState) {
                                DeviceLockModule.lockDeviceImmediately?.();
                                DeviceLockModule.startKioskMode?.();
                            } else {
                                DeviceLockModule.unlockDevice?.();
                                DeviceLockModule.stopKioskMode?.();
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Sync failed:', err);
        }
    };

    const verifyDevice = async (cid: string, url: string) => {
        if (!DeviceLockModule || isAdmin) return;
        try {
            console.log("🔍 Verifying Device...");
            const actualIMEI = await DeviceLockModule.getIMEI();
            const simDetails = await DeviceLockModule.getSimDetails();
            const modelDetails = "Android Device";

            const response = await fetch(`${url}/api/customers/${cid}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actualIMEI,
                    simDetails,
                    modelDetails
                })
            });

            syncStatus(cid, url, 'details');

            if (response.ok) {
                const data = await response.json();
                console.log("✅ Verification:", data);

                if (data.offlineLockToken && DeviceLockModule.setOfflineToken) {
                    await DeviceLockModule.setOfflineToken(data.offlineLockToken);
                }

                if (data.status === 'MISMATCH') {
                    console.warn('⚠️ Device Mismatch Detected');
                }
            }
        } catch (e) {
            console.error('Verification failed', e);
        }
    };

    // Heartbeat - sync every 30 seconds
    useEffect(() => {
        let interval: any;

        const startHeartbeat = async () => {
            const data = await AsyncStorage.getItem('enrollment_data');
            if (data) {
                const { customerId, serverUrl } = JSON.parse(data);

                // Initial syncs
                syncStatus(customerId, serverUrl, 'launched');
                syncStatus(customerId, serverUrl, 'installed');

                interval = setInterval(() => {
                    syncStatus(customerId, serverUrl);
                    verifyDevice(customerId, serverUrl);
                }, 30000); // 30 second heartbeat
            }
        };

        if (isEnrolled && !loading) {
            startHeartbeat();
        }

        return () => clearInterval(interval);
    }, [isEnrolled, loading]);

    if (loading) return null;

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isAdmin ? (
                    <Stack.Screen name="AdminDashboard" component={AdminScreen} />
                ) : !isEnrolled ? (
                    <>
                        <Stack.Screen name="Setup" component={SetupScreen} />
                        <Stack.Screen name="Permissions" component={PermissionsScreen} />
                    </>
                ) : isLocked ? (
                    <Stack.Screen name="Locked" component={LockedScreen} />
                ) : (
                    <Stack.Screen name="Home">
                        {props => <HomeScreen {...props} setIsLocked={setIsLocked} />}
                    </Stack.Screen>
                )}
                <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
