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
                    console.log('Found Native Provisioning!', provisioningData);
                    // Automatically enroll
                    await AsyncStorage.setItem('enrollment_data', JSON.stringify({
                        customerId: provisioningData.customerId,
                        serverUrl: provisioningData.serverUrl,
                        enrolledAt: new Date().toISOString()
                    }));
                }
            }

            const enrollmentData = await AsyncStorage.getItem('enrollment_data');
            const lockStatus = await AsyncStorage.getItem('lock_status');

            setIsEnrolled(!!enrollmentData);
            setIsLocked(lockStatus === 'locked');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

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
