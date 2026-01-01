import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import AutoUpdateChecker from '../components/AutoUpdateChecker';

const CURRENT_VERSION = '1.0.0';
const VERSION_CHECK_URL = 'https://emi-pro-app.onrender.com/api/admin-version';

export default function AdminScreen() {
    const [loading, setLoading] = useState(true);
    const uri = `https://emi-pro-app.onrender.com/mobile?t=${Date.now()}`;

    // Injected script - ensure it fills screen and handles safe areas
    const injectedJavaScript = `
        (function() {
            if (!document.querySelector('meta[name="viewport"]')) {
                var meta = document.createElement('meta');
                meta.name = 'viewport';
                meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
                document.head.appendChild(meta);
            }
            // Sync background to avoid flicker
            document.body.style.backgroundColor = '#f8fafc';
            true;
        })();
    `;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Auto-update checker */}
            <AutoUpdateChecker />

            <WebView
                source={{ uri }}
                style={styles.webview}
                onLoadEnd={() => setLoading(false)}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                cacheEnabled={false}
                cacheMode="LOAD_NO_CACHE"
                userAgent="MobileApp"
                allowsBackForwardNavigationGestures={true}
                injectedJavaScript={injectedJavaScript}
                scalesPageToFit={false}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#000" />
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    webview: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    center: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    }
});
