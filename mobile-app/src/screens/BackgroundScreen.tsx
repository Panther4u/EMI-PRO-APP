import React, { useEffect } from 'react';
import { View, Text, StyleSheet, NativeModules, BackHandler } from 'react-native';

const { DeviceLockModule } = NativeModules;

/**
 * BackgroundScreen - Shown when device is unlocked
 * This screen automatically minimizes the app to background
 * allowing the user to use their device normally.
 * 
 * The app runs in background and only shows lock screen when locked.
 */
export default function BackgroundScreen() {
    useEffect(() => {
        // Minimize app to background immediately
        const minimizeApp = async () => {
            try {
                // Move app to background
                BackHandler.exitApp();
            } catch (error) {
                console.log('Could not minimize app:', error);
            }
        };

        // Minimize after a short delay to ensure everything is set up
        const timer = setTimeout(() => {
            minimizeApp();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>✅ Device Ready</Text>
                <Text style={styles.subtitle}>
                    Your device is set up and ready to use.
                </Text>
                <Text style={styles.info}>
                    This app runs in the background to protect your device.
                </Text>
                <Text style={styles.note}>
                    Minimizing to home screen...
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 300,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#94a3b8',
        marginBottom: 24,
        textAlign: 'center',
    },
    info: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
        textAlign: 'center',
    },
    note: {
        fontSize: 12,
        color: '#475569',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
