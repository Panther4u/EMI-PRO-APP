import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // Check once per day

interface VersionInfo {
    version: string;
    versionCode: number;
    downloadUrl: string;
    changelog: string[];
    minAndroidVersion: string;
}

interface Props {
    checkUrl: string;
    currentVersionCode: number;
}

export default function AutoUpdateChecker({ checkUrl, currentVersionCode }: Props) {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [newVersion, setNewVersion] = useState<VersionInfo | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkForUpdates();

        // Check for updates periodically
        const interval = setInterval(checkForUpdates, CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    const checkForUpdates = async () => {
        try {
            // Check if we've checked recently
            const lastCheck = await AsyncStorage.getItem(`last_update_check_${checkUrl}`);
            const now = Date.now();

            if (lastCheck && (now - parseInt(lastCheck)) < CHECK_INTERVAL) {
                return; // Don't check too frequently
            }

            setLoading(true);
            const response = await fetch(checkUrl);

            if (!response.ok) {
                console.log('Failed to check for updates');
                return;
            }

            const versionInfo: VersionInfo = await response.json();

            // Compare version codes
            if (versionInfo.versionCode > currentVersionCode) {
                setNewVersion(versionInfo);
                setUpdateAvailable(true);

                // Show alert
                Alert.alert(
                    '🎉 Update Available',
                    `Version ${versionInfo.version} is now available!\n\nWhat's new:\n${versionInfo.changelog.slice(0, 3).join('\n')}`,
                    [
                        { text: 'Later', style: 'cancel' },
                        { text: 'Update Now', onPress: downloadUpdate }
                    ]
                );
            }

            // Save last check time
            await AsyncStorage.setItem(`last_update_check_${checkUrl}`, now.toString());

        } catch (error) {
            console.error('Update check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadUpdate = async () => {
        if (!newVersion) return;

        try {
            // Open download URL
            const canOpen = await Linking.canOpenURL(newVersion.downloadUrl);

            if (canOpen) {
                await Linking.openURL(newVersion.downloadUrl);

                Alert.alert(
                    'Download Started',
                    'The update is downloading. Please install it when the download completes.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Cannot Open Link',
                    'Please download the update manually from GitHub.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Failed to download update:', error);
            Alert.alert(
                'Download Failed',
                'Please try again or download manually from GitHub.',
                [{ text: 'OK' }]
            );
        }
    };

    const dismissUpdate = () => {
        setUpdateAvailable(false);
    };

    if (!updateAvailable || !newVersion) {
        return null; // No update banner
    }

    return (
        <View style={styles.container}>
            <View style={styles.banner}>
                <View style={styles.content}>
                    <Text style={styles.title}>🎉 Update Available</Text>
                    <Text style={styles.version}>Version {newVersion.version}</Text>
                    <Text style={styles.changelog} numberOfLines={2}>
                        {newVersion.changelog[0]}
                    </Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.updateButton}
                        onPress={downloadUpdate}
                    >
                        <Text style={styles.updateButtonText}>Update</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.dismissButton}
                        onPress={dismissUpdate}
                    >
                        <Text style={styles.dismissButtonText}>Later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    banner: {
        backgroundColor: '#3b82f6',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    version: {
        fontSize: 14,
        color: '#e0f2fe',
        marginBottom: 4,
    },
    changelog: {
        fontSize: 12,
        color: '#bfdbfe',
    },
    actions: {
        flexDirection: 'column',
        gap: 8,
    },
    updateButton: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    updateButtonText: {
        color: '#3b82f6',
        fontWeight: 'bold',
        fontSize: 14,
    },
    dismissButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    dismissButtonText: {
        color: '#ffffff',
        fontSize: 12,
    },
});
