import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { DeviceLockModule } = NativeModules;

export default function HomeScreen({ setIsLocked }) {
    const [customerId, setCustomerId] = useState('');
    const [serverUrl, setServerUrl] = useState('');
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [isConnecting, setIsConnecting] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await AsyncStorage.getItem('enrollment_data');
            if (data) {
                const parsed = JSON.parse(data);
                setCustomerId(parsed.customerId);
                setServerUrl(parsed.serverUrl);
                // Initial sync
                syncWithBackend(parsed.customerId, parsed.serverUrl);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsConnecting(false);
        }
    };

    const syncWithBackend = useCallback(async (cid: string, url: string) => {
        if (!cid || !url) return;

        try {
            console.log(`Syncing with ${url}/api/customers/${cid}/status`);
            const response = await fetch(`${url}/api/customers/${cid}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'online',
                    lastSeen: new Date().toISOString()
                })
            });

            if (response.ok) {
                const deviceData = await response.json();
                setLastSync(new Date());

                // Handle Remote Lock/Unlock command
                if (deviceData.isLocked) {
                    setIsLocked(true);
                    await AsyncStorage.setItem('lock_status', 'locked');
                    // Actually lock the screen natively
                    if (DeviceLockModule) {
                        try {
                            await DeviceLockModule.lockDevice();
                        } catch (err) {
                            console.error("Lock failed:", err);
                        }
                    }
                } else {
                    setIsLocked(false);
                    await AsyncStorage.setItem('lock_status', 'unlocked');
                }
            }
        } catch (error) {
            console.warn('Sync failed:', error);
        }
    }, [setIsLocked]);

    // Polling every 30 seconds
    useEffect(() => {
        if (!customerId || !serverUrl) return;

        const interval = setInterval(() => {
            syncWithBackend(customerId, serverUrl);
        }, 30000);

        return () => clearInterval(interval);
    }, [customerId, serverUrl, syncWithBackend]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>SecureFinance EMI</Text>

            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.label}>Device ID</Text>
                    <Text style={styles.value}>{customerId || 'Not Linked'}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Connection</Text>
                    <Text style={[styles.status, lastSync ? styles.online : styles.offline]}>
                        {lastSync ? 'Connected' : 'Connecting...'}
                    </Text>
                </View>

                {lastSync && (
                    <Text style={styles.syncTime}>
                        Last synced: {lastSync.toLocaleTimeString()}
                    </Text>
                )}
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Payment Information</Text>
                <Text style={styles.infoText}>Your device is managed by SecureFinance. Please ensure timely payments to avoid device locking.</Text>
            </View>

            {/* Dev Manual Sync */}
            <TouchableOpacity
                style={styles.syncBtn}
                onPress={() => syncWithBackend(customerId, serverUrl)}
            >
                <Text style={styles.btnText}>Check for Updates</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        paddingTop: 80,
        backgroundColor: '#F8FAFC'
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 32,
        color: '#1E293B',
        letterSpacing: -0.5
    },
    card: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 24
    },
    row: {
        marginBottom: 16
    },
    label: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4
    },
    value: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A'
    },
    status: {
        fontSize: 14,
        fontWeight: '800'
    },
    online: { color: '#10B981' },
    offline: { color: '#EF4444' },
    syncTime: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 8,
        textAlign: 'right'
    },
    infoBox: {
        backgroundColor: '#E0F2FE',
        padding: 20,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#0EA5E9'
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0369A1',
        marginBottom: 4
    },
    infoText: {
        fontSize: 14,
        color: '#0C4A6E',
        lineHeight: 20
    },
    syncBtn: {
        marginTop: 'auto',
        backgroundColor: '#0F172A',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    btnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16
    }
});
