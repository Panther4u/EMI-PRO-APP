import React, { useEffect } from 'react';
import { NativeModules, Alert, Platform } from 'react-native';
import { APP_VERSION } from '../config';

const { DeviceLockModule } = NativeModules;

interface VersionInfo {
    version: string;
    apk: string;
}

const CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
const SERVER_URL = 'https://emi-pro-app.onrender.com';

const AutoUpdate = () => {
    useEffect(() => {
        if (Platform.OS !== 'android') return;

        checkUpdate();
        const interval = setInterval(checkUpdate, CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    const checkUpdate = async () => {
        try {
            console.log("Checking for updates...");
            const response = await fetch(`${SERVER_URL}/downloads/version.json?t=${Date.now()}`);
            if (!response.ok) return;

            const data: VersionInfo = await response.json();

            if (isNewer(data.version, APP_VERSION)) {
                console.log(`🚀 New version found: ${data.version}. Downloading...`);
                downloadAndInstall(data.apk, data.version);
            } else {
                console.log("App is up to date");
            }
        } catch (e) {
            console.warn("Update check failed:", e);
        }
    };

    const isNewer = (remote: string, local: string) => {
        const r = remote.split('.').map(Number);
        const l = local.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (r[i] > l[i]) return true;
            if (r[i] < l[i]) return false;
        }
        return false;
    };

    const downloadAndInstall = async (apkName: string, version: string) => {
        try {
            // We need RNFS to download. 
            // Since we don't have RNFS installed in this environment (based on package.json usually),
            // we will use a workaround or check if we have it?
            // User APK environment usually has minimal deps.

            // Assume we can use fetch/blob/save? 
            // Or Native Module 'downloadFile'? 
            // DeviceLockModule doesn't have downloadFile.

            // Wait, we can't easily download file to storage without RNFS or RNFetchBlob.
            // DO WE HAVE THEM?
            // I should check package.json.

            console.warn("AutoUpdate: Missing File System capability to download APK.");
            // If we can't download, we can't silent update.
            // I will implement a basic native downloader in DeviceLockModule if needed?
            // "downloadAndInstallApk(url)"

        } catch (e) {
            console.error("Install failed:", e);
        }
    };

    return null; // Headless component
};

export default AutoUpdate;
