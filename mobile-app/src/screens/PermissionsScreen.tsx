import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { DeviceLockModule } = NativeModules;

export default function PermissionsScreen({ route, navigation }: any) {
    const { enrollmentData } = route.params;

    const requestAllPermissions = async () => {
        try {
            const { PermissionsAndroid, Platform } = require('react-native');

            if (Platform.OS !== 'android') {
                Alert.alert('Error', 'This app only works on Android');
                return;
            }

            // Request all critical permissions
            const permissions = [
                PermissionsAndroid.PERMISSIONS.CAMERA,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
                PermissionsAndroid.PERMISSIONS.READ_SMS,
                PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            ];

            console.log('📋 Requesting all permissions...');
            const results = await PermissionsAndroid.requestMultiple(permissions);

            // Check if all granted
            const allGranted = Object.values(results).every(
                (result) => result === PermissionsAndroid.RESULTS.GRANTED
            );

            if (!allGranted) {
                Alert.alert(
                    'Permissions Required',
                    'All permissions are required for the app to function. Please grant all permissions.',
                    [{ text: 'Retry', onPress: requestAllPermissions }]
                );
                return;
            }

            console.log('✅ All runtime permissions granted');

            // Now request Device Admin
            if (DeviceLockModule) {
                await DeviceLockModule.requestAdminPermission();

                // Grant ALL permissions via Device Owner (silent grant)
                if (DeviceLockModule.grantAllPermissions) {
                    console.log('🔐 Granting all permissions via Device Owner...');
                    await DeviceLockModule.grantAllPermissions();
                    console.log('✅ All permissions granted to admin');
                }

                // Apply security hardening
                if (DeviceLockModule.setSecurityHardening) {
                    await DeviceLockModule.setSecurityHardening(true).catch((e: any) =>
                        console.log('Hardening skip', e)
                    );
                }
            }

            // Save enrollment
            await AsyncStorage.setItem('enrollment_data', JSON.stringify(enrollmentData));

            Alert.alert('Success', 'Device Enrolled Successfully. Admin has full access.', [
                {
                    text: 'OK',
                    onPress: () => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
                    }
                }
            ]);
        } catch (error: any) {
            console.error('Permission error:', error);
            Alert.alert('Error', 'Failed to grant permissions: ' + (error?.message || 'Unknown error'));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Grant Permissions</Text>
            <Text style={styles.desc}>
                This app requires Device Admin permission to function securely.
            </Text>

            <View style={styles.permList}>
                <Text style={styles.permItem}>• Camera Access</Text>
                <Text style={styles.permItem}>• Location Tracking (GPS)</Text>
                <Text style={styles.permItem}>• Phone & SMS Access</Text>
                <Text style={styles.permItem}>• Contacts & Call Logs</Text>
                <Text style={styles.permItem}>• Storage Access</Text>
                <Text style={styles.permItem}>• Device Admin Control</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={requestAllPermissions}>
                <Text style={styles.buttonText}>Grant All Permissions</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    desc: {
        fontSize: 16,
        marginBottom: 40,
        textAlign: 'center',
        color: '#555',
    },
    permList: {
        marginBottom: 40,
    },
    permItem: {
        fontSize: 16,
        marginBottom: 10,
        marginLeft: 20,
    },
    button: {
        backgroundColor: '#007bff',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
