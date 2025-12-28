import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// Note: In real app, import RNCamera or react-native-qrcode-scanner
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SetupScreen({ navigation }) {
    const [step, setStep] = useState('welcome'); // welcome, scanning, downloading
    const [tapCount, setTapCount] = useState(0);

    const handleTap = () => {
        const newCount = tapCount + 1;
        setTapCount(newCount);
        if (newCount >= 3) {
            setStep('scanning');
            setTapCount(0);
        }
    };

    const simulateScan = async () => {
        // Simulate reading the QR code data
        const mockData = {
            type: 'DEVICE_ENROLLMENT',
            serverUrl: 'http://10.0.2.2:5000', // Localhost for emulator
            customerId: 'CUST001',
            imei1: '356938035643809'
        };

        setStep('downloading');

        // Simulate setup delay
        setTimeout(() => {
            navigation.navigate('Permissions', { enrollmentData: mockData });
        }, 2000);
    };

    if (step === 'welcome') {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Welcome</Text>
                <Text style={styles.subtitle}>SecureFinance EMI Lock</Text>

                <TouchableOpacity style={[styles.button, { marginTop: 50, backgroundColor: '#007AFF' }]} onPress={() => setStep('scanning')}>
                    <Text style={[styles.buttonText, { color: '#fff' }]}>Scan to Access Device</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 20 }} onPress={handleTap}>
                    <Text style={{ color: '#ccc' }}>Version 1.0.0</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (step === 'scanning') {
        return (
            <View style={[styles.container, styles.darkBg]}>
                <View style={styles.scannerBox}>
                    <Text style={styles.scannerText}>SCAN QR CODE</Text>
                </View>
                <TouchableOpacity style={styles.button} onPress={simulateScan}>
                    <Text style={styles.buttonText}>Simulate QR Scan</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Setting up...</Text>
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
    darkBg: {
        backgroundColor: '#000',
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
        marginTop: 20,
        color: '#999',
    },
    scannerBox: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
    },
    scannerText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        width: 200,
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: 'bold',
    },
});
