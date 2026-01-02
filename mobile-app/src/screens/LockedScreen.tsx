import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    BackHandler,
    NativeModules,
    StatusBar,
    Dimensions,
    TouchableOpacity,
    Linking,
    Image
} from 'react-native';

const { DeviceLockModule } = NativeModules;
const { width, height } = Dimensions.get('window');

interface LockInfo {
    message: string;
    phone: string;
    isLocked: boolean;
}

export default function LockedScreen() {
    const [lockInfo, setLockInfo] = useState<LockInfo>({
        message: "This device has been locked due to payment overdue.",
        phone: "8876655444",
        isLocked: true
    });
    const [showWarning, setShowWarning] = useState(false);

    // Disable ALL back button presses
    useEffect(() => {
        const backHandler = () => {
            console.log("🚫 Back button blocked");
            // Play warning sound if attempt to exit
            showExitWarning();
            return true; // Block the back action
        };

        BackHandler.addEventListener('hardwareBackPress', backHandler);

        return () => {
            BackHandler.removeEventListener('hardwareBackPress', backHandler);
        };
    }, []);

    // Start kiosk mode immediately
    useEffect(() => {
        startKioskMode();
        getLockInfo();
    }, []);

    const startKioskMode = async () => {
        if (DeviceLockModule && DeviceLockModule.startKioskMode) {
            try {
                await DeviceLockModule.startKioskMode();
                console.log("✅ Kiosk mode started on LockedScreen");
            } catch (error) {
                console.error("Failed to start kiosk mode:", error);
            }
        }

        // 🔒 Apply Security Hardening (Disable Safe Mode, USB, etc.)
        if (DeviceLockModule && DeviceLockModule.setSecurityHardening) {
            try {
                await DeviceLockModule.setSecurityHardening(true);
                console.log("🛡️ Security hardening enabled");
            } catch (error) {
                console.error("Failed to apply hardening:", error);
            }
        }

        // Also disable status bar
        if (DeviceLockModule && DeviceLockModule.setStatusBarDisabled) {
            try {
                await DeviceLockModule.setStatusBarDisabled(true);
            } catch (e) {
                console.warn("Failed to disable status bar:", e);
            }
        }
    };

    const getLockInfo = async () => {
        if (DeviceLockModule && DeviceLockModule.getLockInfo) {
            try {
                const info = await DeviceLockModule.getLockInfo();
                if (info) {
                    setLockInfo({
                        message: info.message || lockInfo.message,
                        phone: info.phone || lockInfo.phone,
                        isLocked: info.isLocked ?? true
                    });
                }
            } catch (e) {
                console.warn("Failed to get lock info:", e);
            }
        }
    };

    const showExitWarning = useCallback(() => {
        setShowWarning(true);

        // Start alarm if user tries to exit
        if (DeviceLockModule && DeviceLockModule.startPowerAlarm) {
            DeviceLockModule.startPowerAlarm().catch(console.error);
        }

        // Hide warning after 3 seconds
        setTimeout(() => {
            setShowWarning(false);
            if (DeviceLockModule && DeviceLockModule.stopPowerAlarm) {
                DeviceLockModule.stopPowerAlarm().catch(console.error);
            }
        }, 3000);
    }, []);

    const callSupport = () => {
        Linking.openURL(`tel:${lockInfo.phone}`).catch(() => {
            console.log("Cannot make phone calls");
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden={true} />

            {/* Warning Overlay */}
            {showWarning && (
                <View style={styles.warningOverlay}>
                    <Text style={styles.warningText}>⚠️ UNAUTHORIZED ACCESS ATTEMPT</Text>
                    <Text style={styles.warningSubtext}>This incident has been logged</Text>
                </View>
            )}

            {/* Main Lock Screen Content */}
            <View style={styles.content}>
                {/* Lock Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconOuter}>
                        <View style={styles.iconInner}>
                            <Text style={styles.lockIcon}>🔒</Text>
                        </View>
                    </View>
                    <View style={styles.pulseRing} />
                </View>

                {/* Title */}
                <Text style={styles.title}>DEVICE LOCKED</Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Message */}
                <Text style={styles.message}>{lockInfo.message}</Text>

                {/* Warning Box */}
                <View style={styles.warningBox}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <Text style={styles.warningMessage}>
                        This device is secured by EMI Lock.{'\n'}
                        Unauthorized access is prohibited.
                    </Text>
                </View>

                {/* Contact Support */}
                <TouchableOpacity style={styles.contactButton} onPress={callSupport}>
                    <Text style={styles.contactIcon}>📞</Text>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>Contact Support</Text>
                        <Text style={styles.contactPhone}>{lockInfo.phone}</Text>
                    </View>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Protected by SecureFinance EMI
                    </Text>
                    <Text style={styles.footerSubtext}>
                        Admin control only • Power off disabled
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    warningOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    warningText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    warningSubtext: {
        fontSize: 14,
        color: '#fff',
        marginTop: 10,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    iconContainer: {
        position: 'relative',
        marginBottom: 30,
    },
    iconOuter: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 50, 50, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 50, 50, 0.3)',
    },
    iconInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 50, 50, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockIcon: {
        fontSize: 50,
    },
    pulseRing: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: 'rgba(255, 50, 50, 0.2)',
        top: -10,
        left: -10,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#ff4444',
        letterSpacing: 4,
        textAlign: 'center',
        marginBottom: 10,
    },
    divider: {
        width: 60,
        height: 3,
        backgroundColor: '#ff4444',
        borderRadius: 2,
        marginVertical: 20,
    },
    message: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 150, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 150, 0, 0.3)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 30,
        width: '100%',
    },
    warningIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    warningMessage: {
        flex: 1,
        fontSize: 12,
        color: '#ff9900',
        lineHeight: 18,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(50, 200, 100, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(50, 200, 100, 0.3)',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        marginBottom: 40,
    },
    contactIcon: {
        fontSize: 30,
        marginRight: 15,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 12,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    contactPhone: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#32c864',
        marginTop: 4,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#444',
        letterSpacing: 1,
    },
    footerSubtext: {
        fontSize: 10,
        color: '#333',
        marginTop: 5,
    },
});
