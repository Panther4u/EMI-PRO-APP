import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const CURRENT_VERSION = '1.0.0';
const VERSION_CHECK_URL = 'https://emi-pro-app.onrender.com/api/admin-version';

export default function AdminScreen() {
    const [showWebView, setShowWebView] = useState(true);
    const uri = 'https://emi-pro-app.onrender.com/mobile'; // Mobile-optimized dashboard

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
                    // Update notification handled by app
                }
            }
        } catch (error) {
            console.log('Version check failed:', error);
        }
    };

    // Minimal JavaScript - just set viewport, no CSS changes
    const injectedJavaScript = `
        (function() {
            // Add meta viewport if not present
            if (!document.querySelector('meta[name="viewport"]')) {
                var meta = document.createElement('meta');
                meta.name = 'viewport';
                meta.content = 'width=device-width, initial-scale=1.0';
                document.head.appendChild(meta);
            }
        })();
        true;
    `;

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
                    injectedJavaScript={injectedJavaScript}
                    scalesPageToFit={true}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
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
