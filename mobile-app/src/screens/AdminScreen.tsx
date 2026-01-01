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

    // Auto-scale to fit screen - same UI, just scaled
    const injectedJavaScript = `
        (function() {
            // Add meta viewport
            if (!document.querySelector('meta[name="viewport"]')) {
                var meta = document.createElement('meta');
                meta.name = 'viewport';
                meta.content = 'width=device-width, initial-scale=1.0, user-scalable=yes';
                document.head.appendChild(meta);
            }

            // Add auto-scaling CSS
            var style = document.createElement('style');
            style.textContent = \`
                /* Make everything fit screen height */
                html, body {
                    height: 100% !important;
                    overflow: auto !important;
                    -webkit-text-size-adjust: none !important;
                    font-size: 13px !important; /* Reduced base font */
                }
                
                /* Scale content to fit on small screens */
                @media screen and (max-width: 768px) {
                    body {
                        zoom: 0.65;
                        -moz-transform: scale(0.65);
                        -moz-transform-origin: 0 0;
                        font-size: 12px !important;
                    }
                }
                
                @media screen and (max-width: 480px) {
                    body {
                        zoom: 0.5;
                        -moz-transform: scale(0.5);
                        -moz-transform-origin: 0 0;
                        font-size: 11px !important;
                    }
                }
                
                /* Remove fixed header heights */
                header, [role="banner"] {
                    height: auto !important;
                    min-height: auto !important;
                    padding-top: 8px !important;
                    padding-bottom: 8px !important;
                }

                /* Compact padding for all containers */
                .p-4, .p-6 {
                    padding: 8px !important;
                }

                /* Ensure components don't overflow after scaling */
                .container, .main-content {
                    max-width: 100vw !important;
                }

                /* Smaller headings */
                h1 { font-size: 1.1rem !important; margin-bottom: 4px !important; }
                h2 { font-size: 1rem !important; margin-bottom: 2px !important; }
                h3 { font-size: 0.9rem !important; }
            \`;
            document.head.appendChild(style);
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
