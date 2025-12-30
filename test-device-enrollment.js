#!/usr/bin/env node

/**
 * Test Device Enrollment API
 * This simulates what the Admin DPC sends to the backend
 */

import https from 'https';

// Test data - replace with your actual customer ID
const testData = {
    customerId: "CUST531054", // Replace with your test customer ID
    brand: "Samsung",
    model: "Galaxy A12",
    manufacturer: "Samsung",
    androidVersion: "10",
    sdkInt: 29,
    androidId: "test123456",
    serial: "R58TEST123",
    imei: "356912345678901",
    imei2: "",
    meid: "",
    enrolledAt: Date.now(),
    status: "ENROLLED"
};

const postData = JSON.stringify(testData);

const options = {
    hostname: 'emi-pro-app.onrender.com',
    port: 443,
    path: '/api/devices/enrolled',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('📤 Sending test enrollment data...');
console.log('Customer ID:', testData.customerId);
console.log('Device:', testData.brand, testData.model);
console.log('');

const req = https.request(options, (res) => {
    console.log('📥 Response Status:', res.statusCode);
    console.log('');

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('Response:', JSON.stringify(response, null, 2));

            if (response.success) {
                console.log('\n✅ SUCCESS! Device enrolled successfully');
                console.log('👉 Check your dashboard - device details should now be visible');
            } else {
                console.log('\n❌ FAILED:', response.error);
                console.log('💡 Make sure the customer ID exists in your database');
            }
        } catch (e) {
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
});

req.write(postData);
req.end();
