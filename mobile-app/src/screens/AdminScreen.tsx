import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

const CURRENT_VERSION = '1.0.0';
const VERSION_CHECK_URL = 'https://emi-pro-app.onrender.com/api/admin-version';

export default function AdminScreen() {
    const [loading, setLoading] = useState(true);
    // Exact same URL as the mobile dashboard the user likes
    const uri = 'https://emi-pro-app.onrender.com/mobile';

    useEffect(() => {
        checkForUpdates();
    }, []);

    const checkForUpdates = async () => {
        try {
            const response = await fetch(VERSION_CHECK_URL);
            if (response.ok) {
                const data = await response.json();
                if (data.version && data.version !== CURRENT_VERSION) {
                    // Update check only
                }
            }
        } catch (error) {
            console.log('Version check failed:', error);
        }
    };

    // Minimal injection just to ensure the keyboard doesn't push the layout in weird ways
    const injectedJavaScript = `
        (function() {
            if (!document.querySelector('meta[name="viewport"]')) {
                var meta = document.createElement('meta');
                meta.name = 'viewport';
                meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
                document.head.appendChild(meta);
            }
            // Ensure background covers everything
            document.body.style.backgroundColor = '#ffffff';
            true;
        })();
    `;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <WebView
                source={{ uri }}
                style={styles.webview}
                onLoadEnd={() => setLoading(false)}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                cacheEnabled={false}
                cacheMode="LOAD_NO_CACHE"
                userAgent="MobileApp"
                injectedJavaScript={injectedJavaScript}
                allowsBackForwardNavigationGestures={true}
                pullToRefreshEnabled={true}
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
