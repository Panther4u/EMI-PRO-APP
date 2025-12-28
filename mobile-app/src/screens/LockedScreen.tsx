import React, { useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, NativeModules } from 'react-native';

const { DeviceLockModule } = NativeModules;

export default function LockedScreen() {

    // Disable back button and Start Kiosk Mode
    useEffect(() => {
        const onBackPress = () => true;
        BackHandler.addEventListener('hardwareBackPress', onBackPress);

        if (DeviceLockModule && DeviceLockModule.startKioskMode) {
            DeviceLockModule.startKioskMode().catch(console.error);
        }

        return () => {
            BackHandler.removeEventListener('hardwareBackPress', onBackPress);
            if (DeviceLockModule && DeviceLockModule.stopKioskMode) {
                DeviceLockModule.stopKioskMode().catch(console.error);
            }
        };
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.iconBox}>
                <Text style={styles.icon}>🔒</Text>
            </View>
            <Text style={styles.title}>DEVICE LOCKED</Text>
            <Text style={styles.message}>
                This device has been locked due to payment overdue.
                Please contact support.
            </Text>
            <View style={styles.contactBox}>
                <Text style={styles.label}>Support</Text>
                <Text style={styles.phone}>8876655444</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 30
    },
    iconBox: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#330000', justifyContent: 'center', alignItems: 'center',
        marginBottom: 30
    },
    icon: { fontSize: 40 },
    title: {
        fontSize: 28, fontWeight: '900', color: '#ff4444',
        marginBottom: 20, letterSpacing: 2
    },
    message: {
        color: '#ccc', textAlign: 'center', fontSize: 16,
        lineHeight: 24, marginBottom: 40
    },
    contactBox: {
        backgroundColor: '#1a1a1a', padding: 20, borderRadius: 12,
        width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#333'
    },
    label: { color: '#666', fontSize: 12, textTransform: 'uppercase' },
    phone: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 5 }
});
