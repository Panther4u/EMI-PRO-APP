import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function AdminScreen() {
    const [loading, setLoading] = useState(true);
    const uri = 'https://emi-pro-app.onrender.com/mobile';

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
                allowsBackForwardNavigationGestures={true}
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
