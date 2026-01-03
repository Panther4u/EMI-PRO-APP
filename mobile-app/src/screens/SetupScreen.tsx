import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, PermissionsAndroid } from 'react-native';
import { CameraScreen } from 'react-native-camera-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_VERSION } from '../config';

export default function SetupScreen({ navigation }) {
    const [step, setStep] = useState('welcome'); // welcome, scanning, downloading
    const [tapCount, setTapCount] = useState(0);

    const handleTap = () => {
        const newCount = tapCount + 1;
        // ... (skip lines)
        <TouchableOpacity style={{ marginTop: 20, padding: 20 }} onPress={handleTap}>
            <Text style={{ color: '#ccc' }}>Version {APP_VERSION}</Text>
        </TouchableOpacity>
        setTapCount(newCount);
        if (newCount >= 1) { // Changed to 1 tap for easier access during dev, revert to 3 later?
            // Or keep user's 3-6 taps preference? User said "tap 5-7 times" for welcome screen.
            // This setup screen is INSIDE the app.
        }
        if (newCount >= 6) {
            Alert.alert("Debug Mode", "Proceeding to scan...");
            setStep('scanning');
            setTapCount(0);
        }
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'App needs camera permission to scan QR code.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    setStep('scanning');
                } else {
                    Alert.alert('Permission Denied', 'Camera permission is required to scan QR code.');
                }
            } catch (err) {
                console.warn(err);
            }
        } else {
            setStep('scanning');
        }
    };

    const onQRCodeRead = async (event) => {
        const qrDataString = event.nativeEvent.codeStringValue;

        // Prevent multiple reads
        if (step === 'downloading') return;

        try {
            console.log("Scanned QR:", qrDataString);

            // Try to parse JSON
            let parsedData;
            try {
                parsedData = JSON.parse(qrDataString);
            } catch (e) {
                Alert.alert("Invalid QR", "QR code is not a valid JSON");
                return;
            }

            // Handle both Simple JSON and Android Enterprise Provisioning JSON
            let customerId = parsedData.customerId;
            let serverUrl = parsedData.serverUrl;

            // Check if inside Admin Extras Bundle (Standard Provisioning Format)
            if (!customerId && parsedData["android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"]) {
                let extras = parsedData["android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"];
                // Handle double-encoded JSON case
                if (typeof extras === 'string') {
                    try {
                        extras = JSON.parse(extras);
                    } catch (e) {
                        console.warn("Failed to parse nested extras", e);
                    }
                }
                customerId = extras?.customerId;
                serverUrl = extras?.serverUrl;
            }

            // 🎯 IMEI-BASED PROVISIONING: customerId is OPTIONAL
            // If missing, backend will match by IMEI/deviceId
            if (!customerId) {
                console.log("⚠️ No customerId in QR - using IMEI-based provisioning");
                // Set a placeholder that backend will ignore
                customerId = "IMEI_BASED";
            }

            // Default to production server if not specified
            if (!serverUrl) {
                serverUrl = 'https://emi-pro-app.onrender.com';
                console.log("Using default server:", serverUrl);
            }

            // Normalize data for consistent usage
            parsedData.customerId = customerId;
            parsedData.serverUrl = serverUrl;

            setStep('downloading'); // Show loading/processing state

            // REPORT STATUS: QR Scanned (only if we have a real customerId)
            if (customerId && customerId !== "IMEI_BASED") {
                try {
                    await fetch(`${parsedData.serverUrl}/api/customers/${parsedData.customerId}/status`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            status: 'pending',
                            step: 'qr_scanned'
                        })
                    });
                } catch (e) {
                    console.warn("Failed to report QR scan status", e);
                    // Continue anyway, it's not blocking functionality
                }
            }

            // Store enrollment data used by App.tsx / PermissionsScreen / Home
            await AsyncStorage.setItem('enrollment_data', JSON.stringify(parsedData));


            // Navigate to permissions or home
            navigation.navigate('Permissions', { enrollmentData: parsedData });

        } catch (error) {
            Alert.alert("Error", "Failed to process QR code");
            setStep('scanning'); // Retry
        }
    };

    if (step === 'welcome') {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Welcome</Text>
                <Text style={styles.subtitle}>SecureFinance EMI Lock</Text>
                <Text style={styles.hint}>Please scan the QR code provided by your admin.</Text>

                <TouchableOpacity
                    style={[styles.button, { marginTop: 50, backgroundColor: '#007AFF' }]}
                    onPress={requestCameraPermission}
                >
                    <Text style={[styles.buttonText, { color: '#fff' }]}>Scan QR to Link Device</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20, padding: 20 }} onPress={handleTap}>
                    <Text style={{ color: '#ccc' }}>Version 2.0.4 (Admin Fix)</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (step === 'scanning') {
        return (
            <View style={{ flex: 1, backgroundColor: 'black' }}>
                <CameraScreen
                    scanBarcode={true}
                    onReadCode={onQRCodeRead}
                    showFrame={true}
                    laserColor='red'
                    frameColor='white'
                />
                <TouchableOpacity
                    style={[styles.button, { position: 'absolute', bottom: 50, alignSelf: 'center' }]}
                    onPress={() => setStep('welcome')}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Linking Device...</Text>
            <Text style={styles.subtitle}>Please wait</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
    },
    hint: {
        marginTop: 10,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 40
    },
    button: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        width: 200,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc'
    },
    buttonText: {
        fontWeight: 'bold',
    },
});
