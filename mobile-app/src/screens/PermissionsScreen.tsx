import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { DeviceLockModule } = NativeModules;

export default function PermissionsScreen({ route, navigation }) {
    const { enrollmentData } = route.params;

    const requestAdmin = async () => {
        try {
            // In a real app, this launches the system dialog
            // For this sample code, assuming DeviceLockModule exists
            if (DeviceLockModule) {
                await DeviceLockModule.requestAdminPermission();
            }

            // Save enrollment
            await AsyncStorage.setItem('enrollment_data', JSON.stringify(enrollmentData));

            Alert.alert('Success', 'Device Enrolled Successfully', [
                {
                    text: 'OK', onPress: () => {
                        // In App.tsx this state change triggers navigation to Home
                        // For now we assume the app reloads or we reload state
                        // In real app, use Context or Redux
                        // Here we just navigate or reload
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
                    }
                }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to enable admin: ' + error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Grant Permissions</Text>
            <Text style={styles.desc}>
                This app requires Device Admin permission to function securely.
            </Text>

            <View style={styles.permList}>
                <Text style={styles.permItem}>• Camera Access</Text>
                <Text style={styles.permItem}>• Location Tracking</Text>
                <Text style={styles.permItem}>• Device Admin Control</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={requestAdmin}>
                <Text style={styles.buttonText}>Enable Device Admin</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    desc: {
        fontSize: 16,
        marginBottom: 40,
        textAlign: 'center',
        color: '#555',
    },
    permList: {
        marginBottom: 40,
    },
    permItem: {
        fontSize: 16,
        marginBottom: 10,
        marginLeft: 20,
    },
    button: {
        backgroundColor: '#007bff',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
