import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const CURRENT_VERSION = '1.0.0'; // Update this when releasing new APK
const VERSION_CHECK_URL = 'https://emi-pro-app.onrender.com/api/admin-version';

export default function AdminScreen() {
    const [showWebView, setShowWebView] = useState(true);
    const uri = 'https://emi-pro-app.onrender.com/';

    useEffect(() => {
        checkForUpdates();
    }, []);

    const checkForUpdates = async () => {
        try {
            const response = await fetch(VERSION_CHECK_URL);
            if (response.ok) {
                const data = await response.json();
                const latestVersion = data.version;
                const downloadUrl = data.downloadUrl;

                if (latestVersion && latestVersion !== CURRENT_VERSION) {
                    Alert.alert(
                        'Update Available',
                        `A new version (${latestVersion}) of the Admin app is available. Current version: ${CURRENT_VERSION}`,
                        [
                            {
                                text: 'Later',
                                style: 'cancel'
                            },
                            {
                                text: 'Update Now',
                                onPress: () => {
                                    if (downloadUrl) {
                                        Linking.openURL(downloadUrl);
                                    }
                                }
                            }
                        ]
                    );
                }
            }
        } catch (error) {
            console.log('Version check failed:', error);
            // Silently fail - don't block the app
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {showWebView && (
                <WebView
                    source={{ uri }}
                    style={{ flex: 1 }}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                        </View>
                    )}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    cacheEnabled={false}
                    cacheMode="LOAD_NO_CACHE"
                    onLoadStart={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.log('WebView loading:', nativeEvent.url);
                    }}
                    onLoadEnd={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.log('WebView loaded:', nativeEvent.url);
                    }}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error: ', nativeEvent);
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    }
});
