import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, NativeModules } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SetupScreen from './src/screens/SetupScreen';
import LockedScreen from './src/screens/LockedScreen';
import BackgroundScreen from './src/screens/BackgroundScreen';
import AdminScreen from './src/screens/AdminScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';

const Stack = createStackNavigator();
const { DeviceLockModule } = NativeModules;

// 🟦 PHASE 1: UNLINKED (Welcome / QR)
// 🟨 PHASE 2: LINKED (Home / Background)
// 🟥 PHASE 3: LOCKED (Lock Screen)
type AppState = 'UNLINKED' | 'LINKED' | 'LOCKED';

export default function App() {
    const [state, setState] = useState<AppState>('UNLINKED');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdminState, setIsAdminState] = useState(false);

    // Sync status with backend
    const syncStatus = async (customerId: string, serverUrl: string) => {
        try {
            // Fetch Native Details
            let technical: any = {};
            let features: any = {};
            let sim: any = {};
            let location: any = null;

            if (DeviceLockModule) {
                try { if (DeviceLockModule.getTechnicalDetails) technical = await DeviceLockModule.getTechnicalDetails(); } catch (e) { }
                try { if (DeviceLockModule.getDeviceFeatureStatus) features = await DeviceLockModule.getDeviceFeatureStatus(); } catch (e) { }
                try { if (DeviceLockModule.getSimStatus) sim = await DeviceLockModule.getSimStatus(); } catch (e) { }
                try { if (DeviceLockModule.getLastLocation) location = await DeviceLockModule.getLastLocation(); } catch (e) { }
            }

            const batteryLevel = features?.batteryLevel || 100;
            const networkType = features?.networkType || 'Unknown';

            // Format Storage
            const totalStorageGB = technical?.totalStorage ? (technical.totalStorage / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : 'N/A';
            const freeStorageGB = technical?.freeStorage ? (technical.freeStorage / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : 'N/A';

            const payload = {
                status: 'online',
                version: '2.0.4', // Updated Version
                battery: batteryLevel,

                // Enhanced Data
                technical: {
                    brand: technical?.brand,
                    model: technical?.model,
                    androidId: technical?.androidId,
                    osVersion: technical?.androidVersion,
                    sdkLevel: technical?.sdkVersion,
                    serial: technical?.serial,
                    totalStorage: totalStorageGB,
                    availableStorage: freeStorageGB,
                    totalMemory: technical?.totalMemory,
                    freeMemory: technical?.freeMemory,
                    networkType: networkType
                },
                sim: sim,
                location: location,
                security: {
                    factoryResetBlocked: features?.factoryResetBlocked || false,
                    adbBlocked: !features?.usbDebuggingEnabled, // If usbDebuggingEnabled is false, then blocked is true
                    isSecured: (features?.factoryResetBlocked && !features?.usbDebuggingEnabled) || false
                }
            };

            const response = await fetch(`${serverUrl}/api/customers/${customerId}/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();

                // Handle Remote Commands
                if (data.command) {
                    console.log("⚡ Received Command:", data.command);
                    try {
                        switch (data.command) {
                            case 'wipe':
                                if (DeviceLockModule?.wipeData) DeviceLockModule.wipeData();
                                break;
                            case 'alarm':
                                if (DeviceLockModule?.startPowerAlarm) DeviceLockModule.startPowerAlarm();
                                break;
                            case 'stopAlarm':
                                if (DeviceLockModule?.stopPowerAlarm) DeviceLockModule.stopPowerAlarm();
                                break;
                            case 'setWallpaper':
                                if (DeviceLockModule?.setWallpaper && data.wallpaperUrl) {
                                    DeviceLockModule.setWallpaper(data.wallpaperUrl);
                                }
                                break;
                            case 'setPin':
                                if (DeviceLockModule?.setDevicePin && data.pin) {
                                    DeviceLockModule.setDevicePin(data.pin);
                                }
                                break;
                            case 'setLockInfo':
                                if (DeviceLockModule?.setLockInfo && data.lockMessage) {
                                    DeviceLockModule.setLockInfo(data.lockMessage, data.supportPhone || "");
                                }
                                break;
                        }
                    } catch (cmdErr) {
                        console.error("Command Execution Failed:", cmdErr);
                    }
                }

                return data;
            } else if (response.status === 404) {
                return { unenroll: true };
            }
        } catch (e) {
            // console.warn("Sync failed:", e);
        }
        return null;
    };

    const checkAdminStatus = async () => {
        if (DeviceLockModule?.isAdmin) {
            return await DeviceLockModule.isAdmin();
        }
        return false;
    };

    // Main Boot Logic
    const checkState = async () => {
        try {
            // 1. Check Admin
            const adminStatus = await checkAdminStatus();
            if (adminStatus) {
                setIsAdminState(true);
                setIsLoading(false);
                return;
            }

            // 2. Check Enrollment
            const enrollmentDataStr = await AsyncStorage.getItem('enrollment_data');

            if (!enrollmentDataStr) {
                setState('UNLINKED');
                setIsLoading(false);
                return;
            }

            // 3. Check Lock Status
            const enrollmentData = JSON.parse(enrollmentDataStr);
            const { customerId, serverUrl } = enrollmentData;

            // Optimistic Linked State
            let nextState: AppState = 'LINKED';

            const status = await syncStatus(customerId, serverUrl);

            // Handle Unenrollment (Customer Deleted)
            if (status && status.unenroll) {
                console.log("⚠️ Device unenrolled by admin. Removing controls...");
                if (DeviceLockModule?.stopKioskMode) await DeviceLockModule.stopKioskMode();
                if (DeviceLockModule?.removeAdmin) await DeviceLockModule.removeAdmin();

                await AsyncStorage.clear();
                setState('UNLINKED');
                return;
            }

            if (status && status.isLocked) {
                nextState = 'LOCKED';
                if (DeviceLockModule?.startKioskMode) DeviceLockModule.startKioskMode();
                if (DeviceLockModule?.setSecurityHardening) DeviceLockModule.setSecurityHardening(true); // Enforce Strict
            } else {
                if (DeviceLockModule?.stopKioskMode) DeviceLockModule.stopKioskMode();
                // Enforce Base Security (Factory Reset Block + Anti-Uninstall)
                if (DeviceLockModule?.setSecurityHardening) DeviceLockModule.setSecurityHardening(true);
            }

            setState(nextState);

        } catch (e) {
            console.error("State Check Error", e);
            // Default safe state if data exists but something failed
            setState('LINKED');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkState();
    }, []);

    // Polling for UNLINKED state (To detect successful QR scan)
    useEffect(() => {
        if (state !== 'UNLINKED') return;

        const interval = setInterval(async () => {
            const enrollmentDataStr = await AsyncStorage.getItem('enrollment_data');
            if (enrollmentDataStr) {
                console.log("💳 Enrollment detected! Switching to LINKED.");
                checkState(); // Trigger full check
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [state]);

    // Heartbeat for LINKED/LOCKED
    useEffect(() => {
        if (state === 'UNLINKED' || isAdminState) return;

        const interval = setInterval(() => {
            checkState(); // Re-verify lock status
        }, 15000);

        return () => clearInterval(interval);
    }, [state, isAdminState]);


    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>SecureFinance v2.0</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
                {isAdminState ? (
                    <Stack.Screen name="AdminDashboard" component={AdminScreen} />
                ) : state === 'UNLINKED' ? (
                    // 🟦 PHASE 1
                    <>
                        <Stack.Screen name="Setup" component={SetupScreen} />
                        <Stack.Screen name="Permissions" component={PermissionsScreen} />
                    </>
                ) : state === 'LOCKED' ? (
                    // 🟥 PHASE 3
                    <Stack.Screen name="Locked" component={LockedScreen} />
                ) : (
                    // 🟨 PHASE 2
                    <Stack.Screen name="Background" component={BackgroundScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
