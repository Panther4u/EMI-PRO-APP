import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { NativeModules, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SetupScreen from './src/screens/SetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import LockedScreen from './src/screens/LockedScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();
const { DeviceLockModule } = NativeModules;

export default function App() {
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            // Check Native Provisioning Data first (from Factory Reset QR)
            if (DeviceLockModule && DeviceLockModule.getProvisioningData) {
                const provisioningData = await DeviceLockModule.getProvisioningData();
                if (provisioningData && provisioningData.customerId) {
                    // Automatically enroll
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
                // Initial sync
                await syncStatus(enrollmentData.customerId, enrollmentData.serverUrl);
            }

            setIsLocked(lockStatus === 'locked');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const syncStatus = async (cid: string, url: string) => {
        if (!cid || !url) return;
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

                    if (data.isLocked && DeviceLockModule) {
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
                {!isEnrolled ? (
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
