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
                <View style={styles.iconContainer}>
                    <View style={styles.pulseContainer}>
                        <View style={styles.innerPulse} />
                    </View>
                    <Text style={styles.iconText}>🔑</Text>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>Activate Device</Text>
                    <Text style={styles.subtitle}>SecurePro Finance</Text>
                    <Text style={styles.hint}>
                        Scan the "User Details QR" from your administrator to activate this device and link your profile.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.premiumButton}
                    onPress={requestCameraPermission}
                    activeOpacity={0.8}
                >
                    <Text style={styles.premiumButtonText}>Scan Activation QR</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.versionContainer} onPress={handleTap}>
                    <Text style={styles.versionText}>SecurePro Enterprise v{APP_VERSION}</Text>
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
        paddingHorizontal: 30,
    },
    iconContainer: {
        marginBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerPulse: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#DBEAFE',
    },
    iconText: {
        fontSize: 40,
        position: 'absolute',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 16,
        textAlign: 'center',
    },
    hint: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    premiumButton: {
        backgroundColor: '#2563EB',
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    premiumButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    versionContainer: {
        marginTop: 30,
        padding: 10,
    },
    versionText: {
        fontSize: 12,
        color: '#CBD5E1',
        fontWeight: '600',
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
