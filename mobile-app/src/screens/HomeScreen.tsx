import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ setIsLocked }) {
    // In a real app, this would check backend status regularly
    // For demo, we just have a button to toggle lock

    return (
        <View style={styles.container}>
            <Text style={styles.title}>SecureFinance EMI</Text>
            <View style={styles.card}>
                <Text style={styles.label}>Status</Text>
                <Text style={styles.value}>Active</Text>
                <Text style={styles.label}>Next EMI Due</Text>
                <Text style={styles.value}>Oct 5, 2025</Text>
            </View>

            {/* Dev only button */}
            <TouchableOpacity style={styles.lockBtn} onPress={() => setIsLocked(true)}>
                <Text style={styles.btnText}>Simulate Remote Lock</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#f5f5f5' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#333' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 2 },
    label: { fontSize: 14, color: '#888', marginTop: 10 },
    value: { fontSize: 18, fontWeight: '600', color: '#000' },
    lockBtn: { marginTop: 40, backgroundColor: '#d9534f', padding: 15, borderRadius: 8 },
    btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});
