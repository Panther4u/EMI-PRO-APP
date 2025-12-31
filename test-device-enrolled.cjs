const https = require('https');

// Configuration
const SERVER_URL = 'https://emi-pro-app.onrender.com';
const API_ENDPOINT = '/api/devices/enrolled';
const CUSTOMER_ID = 'CUST_TEST_001'; // Replace with a valid customer ID if needed

const payload = {
    brand: "TestBrand",
    model: "TestModel",
    manufacturer: "TestManufacturer",
    androidVersion: "12",
    sdkInt: 31,
    androidId: "test_android_id_12345",
    serial: "test_serial_12345",
    imei: "123456789012345",
    imei2: "123456789012346",
    meid: "990000862471854",
    enrolledAt: Date.now(),
    status: "ENROLLED",
    customerId: CUSTOMER_ID
};

console.log(`Sending enrollment request to ${SERVER_URL}${API_ENDPOINT}...`);
console.log('Payload:', JSON.stringify(payload, null, 2));

const data = JSON.stringify(payload);

const options = {
    hostname: 'emi-pro-app.onrender.com',
    port: 443,
    path: API_ENDPOINT,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();
