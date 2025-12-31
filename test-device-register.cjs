// Test script for IMEI-based Device Registration (Step 1)
// const fetch = require('node-fetch'); // Native fetch in Node 18+

async function testDeviceRegistration() {
    const API_URL = 'http://localhost:5000/api/devices/register'; // Change to https://emi-pro-app.onrender.com for remote

    // Payload strictly matching the Android DeviceInfoCollector
    const devicePayload = {
        imei: "1234567890123456", // Ensure this matches an existing customer's imei1 in DB
        brand: "Samsung_Mock",
        model: "S23_Ultra_Mock",
        androidVersion: "13",
        serial: "R5CXXXXXXX",
        androidId: "abcdef123456",
        status: "ADMIN_INSTALLED"
    };

    console.log(`🚀 Sending Device Registration Request to ${API_URL}...`);
    console.log(`   Payload:`, devicePayload);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(devicePayload),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        const statusIcon = response.ok ? '✅' : '❌';
        console.log(`\n${statusIcon} Response Status: ${response.status}`);
        console.log(`   Body:`, JSON.stringify(data, null, 2));

        if (response.status === 404) {
            console.log("\n⚠️ NOTE: 404 is EXPECTED if you haven't created a customer with IMEI '1234567890123456' yet.");
        }

    } catch (error) {
        console.error('\n❌ Request Failed:', error.message);
    }
}

testDeviceRegistration();
