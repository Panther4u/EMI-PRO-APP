import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
    const handleLogout = () => {
        Alert.alert(
            "Unenroll Device",
            "Are you sure you want to unenroll this device? This will remove all management policies.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Unenroll",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.clear();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Setup' }],
                        });
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Device Information</Text>
                <View style={styles.item}>
                    <Text style={styles.itemLabel}>Status</Text>
                    <Text style={styles.itemValue}>Enrolled</Text>
                </View>
                <View style={styles.item}>
                    <Text style={styles.itemLabel}>Management</Text>
                    <Text style={styles.itemValue}>SecureFinance EMI</Text>
                </View>
                <View style={styles.item}>
                    <Text style={styles.itemLabel}>Version</Text>
                    <Text style={styles.itemValue}>1.0.0 (Build 1)</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security Policies</Text>
                <View style={styles.item}>
                    <Text style={styles.itemLabel}>Device Admin</Text>
                    <Text style={[styles.itemValue, { color: '#4CAF50' }]}>Active</Text>
                </View>
                <View style={styles.item}>
                    <Text style={styles.itemLabel}>Camera Policy</Text>
                    <Text style={styles.itemValue}>Enforced</Text>
                </View>
                <View style={styles.item}>
                    <Text style={styles.itemLabel}>Locking Policy</Text>
                    <Text style={styles.itemValue}>Enforced</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.unenrollButton} onPress={handleLogout}>
                <Text style={styles.unenrollText}>Unenroll This Device</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
                © 2025 SecureFinance Ltd. All rights reserved.
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    section: {
        marginTop: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: '#eee',
        borderBottomColor: '#eee',
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#888',
        textTransform: 'uppercase',
        marginTop: 15,
        marginBottom: 5,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    itemLabel: {
        fontSize: 16,
        color: '#333',
    },
    itemValue: {
        fontSize: 16,
        color: '#666',
    },
    unenrollButton: {
        marginTop: 30,
        marginHorizontal: 20,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ff4444',
        alignItems: 'center',
    },
    unenrollText: {
        color: '#ff4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 20,
        color: '#999',
        fontSize: 12,
    },
});
