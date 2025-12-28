import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminScreen() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [serverUrl, setServerUrl] = useState('https://emi-pro-app.onrender.com');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${serverUrl}/api/customers`);
            if (response.ok) {
                const data = await response.json();
                setCustomers(data);
            } else {
                Alert.alert("Error", "Failed to fetch customers");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Network error");
        } finally {
            setLoading(false);
        }
    };

    const toggleDeviceLock = async (customerId: string, currentStatus: boolean) => {
        try {
            const nextStatus = !currentStatus;
            const response = await fetch(`${serverUrl}/api/customers/${customerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isLocked: nextStatus })
            });

            if (response.ok) {
                Alert.alert("Success", `Device ${nextStatus ? 'Locked' : 'Unlocked'}`);
                fetchCustomers();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update status");
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.customerCard}>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.customerName}>{item.name || item.customerName || 'No Name'}</Text>
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: item.deviceStatus?.status === 'online' ? '#5cb85c' : '#ccc' }
                        ]}
                    />
                </View>
                <Text style={styles.customerId}>ID: {item.id}</Text>
                <Text style={styles.customerModel}>{item.mobileModel || 'Unknown Device'}</Text>
            </View>
            <TouchableOpacity
                style={[styles.lockBtn, item.isLocked ? styles.unlockBtn : styles.lockBtnColor]}
                onPress={() => toggleDeviceLock(item.id, item.isLocked)}
            >
                <Text style={styles.btnText}>{item.isLocked ? "Unlock" : "Lock"}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Admin Control Panel</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchCustomers}>
                <Text style={styles.refreshText}>Refresh List</Text>
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={customers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={<Text style={styles.empty}>No registered devices found.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20, paddingTop: 60 },
    header: { fontSize: 28, fontWeight: 'bold', color: '#1c1e21', marginBottom: 20 },
    refreshBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
    refreshText: { color: '#007AFF', fontWeight: 'bold' },
    customerCard: {
        backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
    },
    customerName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 },
    customerId: { fontSize: 12, color: '#777', marginTop: 2 },
    customerModel: { fontSize: 14, color: '#555', marginTop: 4 },
    lockBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, minWidth: 100, alignItems: 'center' },
    lockBtnColor: { backgroundColor: '#d9534f' },
    unlockBtn: { backgroundColor: '#5cb85c' },
    btnText: { color: '#fff', fontWeight: 'bold' },
    empty: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 }
});
