import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NativeModules, Alert, Linking } from 'react-native';
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
    const [isLocked, setIsLocked] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

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
            console.log("Checking Admin status...");
            // 1. FAST CHECK: Is this the Admin APK?
            const dlm = NativeModules.DeviceLockModule;
            if (dlm && dlm.getAppInfo) {
                const appInfo = await dlm.getAppInfo();
                if (appInfo?.packageName?.endsWith('.admin')) {
                    console.log("Admin APK detected");
                    setIsAdmin(true);
                    setLoading(false); // Open immediately for Admin
                    checkForUpdates(currentServerUrl);
                    return;
                }
            }

            // 2. USER DEVICE CHECK
            console.log("Checking User Provisioning...");
            if (dlm && dlm.getProvisioningData) {
                const provisioningData = await dlm.getProvisioningData();
                if (provisioningData?.customerId) {
                    await AsyncStorage.setItem('enrollment_data', JSON.stringify({
                        customerId: provisioningData.customerId,
                        serverUrl: provisioningData.serverUrl,
                        enrolledAt: new Date().toISOString()
                    }));
                }
            }

            const enrollmentDataStr = await AsyncStorage.getItem('enrollment_data');
            const lockStatus = await AsyncStorage.getItem('lock_status');

            if (enrollmentDataStr) {
                setIsEnrolled(true);
                const enrollmentData = JSON.parse(enrollmentDataStr);
                currentServerUrl = enrollmentData.serverUrl || currentServerUrl;
                await syncStatus(enrollmentData.customerId, currentServerUrl);
            }

            setIsLocked(lockStatus === 'locked');
            checkForUpdates(currentServerUrl);

        } catch (e) {
            console.error("Critical Startup Error:", e);
        } finally {
            // Guarantee loading is cleared
            setTimeout(() => setLoading(false), 500);
        }
    };

    const syncStatus = async (cid: string, url: string) => {
        if (!cid || !url || isAdmin) return;
        try {
            const response = await fetch(`${url}/api/customers/${cid}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'online' })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.isLocked !== undefined) {
                    setIsLocked(data.isLocked);
                    await AsyncStorage.setItem('lock_status', data.isLocked ? 'locked' : 'unlocked');

                    if (data.isLocked && DeviceLockModule && !isAdmin) {
                        DeviceLockModule.lockDevice().catch(console.error);
                    }
                }
            }
        } catch (err) {
            console.warn('Sync failed:', err);
        }
    };

    // Global Heartbeat
    useEffect(() => {
        let interval: any;
        const startHeartbeat = async () => {
            const data = await AsyncStorage.getItem('enrollment_data');
            if (data) {
                const { customerId, serverUrl } = JSON.parse(data);
                interval = setInterval(() => syncStatus(customerId, serverUrl), 30000);
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
