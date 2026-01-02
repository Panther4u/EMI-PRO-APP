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

    // RESTORED: syncStatus function (Locally defined to ensure no import errors)
    const syncStatus = async (customerId: string, serverUrl: string) => {
        try {
            console.log(`💓 Syncing status for ${customerId} with ${serverUrl}`);
            const response = await fetch(`${serverUrl}/api/customers/${customerId}/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'online',
                    version: '2.0.0',
                    battery: 100
                })
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn("Sync failed:", e);
        }
        return null;
    };

    const checkAdminStatus = async () => {
        if (DeviceLockModule?.isAdmin) {
            return await DeviceLockModule.isAdmin();
        }
        return false;
    };

    useEffect(() => {
        const boot = async () => {
            try {
                // 1. Check if Admin App
                const adminStatus = await checkAdminStatus();
                setIsAdminState(adminStatus);
                if (adminStatus) {
                    setIsLoading(false);
                    return;
                }

                // 2. Check Enrollment (Customer ID)
                const enrollmentDataStr = await AsyncStorage.getItem('enrollment_data');

                if (!enrollmentDataStr) {
                    console.log("🟦 Device UNLINKED");
                    setState('UNLINKED');
                    setIsLoading(false);
                    return;
                }

                // 3. Device is LINKED - Check Lock Status
                const enrollmentData = JSON.parse(enrollmentDataStr);
                const { customerId, serverUrl } = enrollmentData;

                console.log("🟨 Device LINKED to:", customerId);

                // Get latest status from backend
                const status = await syncStatus(customerId, serverUrl);

                if (status && status.isLocked) {
                    console.log("🟥 Device LOCKED by Backend");
                    setState('LOCKED');
                    if (DeviceLockModule?.startKioskMode) DeviceLockModule.startKioskMode();
                } else {
                    console.log("🟩 Device UNLOCKED (Normal Use)");
                    setState('LINKED');
                    if (DeviceLockModule?.stopKioskMode) DeviceLockModule.stopKioskMode();
                }

            } catch (e) {
                console.error("Boot Error:", e);
                // Default to LINKED if data exists but sync failed (Offline mode)
                setState('LINKED');
            } finally {
                setIsLoading(false);
            }
        };

        boot();
    }, []);

    // Heartbeat Effect - ONLY runs when LINKED or LOCKED
    useEffect(() => {
        if (state === 'UNLINKED' || isAdminState) return;

        console.log("💓 Starting Heartbeat");
        const interval = setInterval(async () => {
            const enrollmentDataStr = await AsyncStorage.getItem('enrollment_data');
            if (enrollmentDataStr) {
                const { customerId, serverUrl } = JSON.parse(enrollmentDataStr);
                const status = await syncStatus(customerId, serverUrl);

                if (status) {
                    if (status.isLocked && state !== 'LOCKED') {
                        setState('LOCKED');
                        DeviceLockModule.startKioskMode?.();
                    } else if (!status.isLocked && state === 'LOCKED') {
                        setState('LINKED');
                        DeviceLockModule.stopKioskMode?.();
                    }
                }
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [state, isAdminState]);


    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Booting SecureFinance v2.0...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
                {isAdminState ? (
                    <Stack.Screen name="AdminDashboard" component={AdminScreen} />
                ) : state === 'UNLINKED' ? (
                    <>
                        <Stack.Screen name="Setup" component={SetupScreen} />
                        <Stack.Screen name="Permissions" component={PermissionsScreen} />
                    </>
                ) : state === 'LOCKED' ? (
                    <Stack.Screen name="Locked" component={LockedScreen} />
                ) : (
                    <Stack.Screen name="Background" component={BackgroundScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
