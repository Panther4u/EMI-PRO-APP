const mockCustomers = [
    {
        id: '1',
        name: 'Rajesh Kumar',
        phoneNo: '9876543210',
        aadharNo: '1234 5678 9012',
        address: '123, MG Road, Bengaluru, Karnataka - 560001',
        imei1: '356938035643809',
        imei2: '356938035643817',
        deviceName: 'Samsung',
        mobileModel: 'Galaxy S23',
        financeName: 'SecureFinance EMI',
        totalAmount: 75000,
        emiAmount: 6500,
        emiDate: 5,
        totalEmis: 12,
        paidEmis: 4,
        status: 'active'
    },
    {
        id: '2',
        name: 'Priya Sharma',
        phoneNo: '8765432109',
        aadharNo: '2345 6789 0123',
        address: '456, Anna Nagar, Chennai, Tamil Nadu - 600040',
        imei1: '867530012345678',
        imei2: '867530012345686',
        deviceName: 'Apple',
        mobileModel: 'iPhone 14 Pro',
        financeName: 'SecureFinance EMI',
        totalAmount: 120000,
        emiAmount: 10500,
        emiDate: 10,
        totalEmis: 12,
        paidEmis: 2,
        status: 'active'
    },
    {
        id: '3',
        name: 'Mohammed Ali',
        phoneNo: '7654321098',
        aadharNo: '3456 7890 1234',
        address: '789, Banjara Hills, Hyderabad, Telangana - 500034',
        imei1: '352099001761481',
        imei2: '352099001761499',
        deviceName: 'OnePlus',
        mobileModel: 'OnePlus 12',
        financeName: 'SecureFinance EMI',
        totalAmount: 65000,
        emiAmount: 5800,
        emiDate: 15,
        totalEmis: 12,
        paidEmis: 8,
        status: 'active'
    }
];

async function seedProduction() {
    const API_URL = 'https://emi-pro-app.onrender.com/api/customers';

    console.log('Seeding production database...\n');

    for (const customer of mockCustomers) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customer)
            });

            if (response.ok) {
                console.log(`✅ Added: ${customer.name} (ID: ${customer.id})`);
            } else {
                const error = await response.json();
                console.log(`❌ Failed: ${customer.name} - ${error.message}`);
            }
        } catch (err) {
            console.log(`❌ Error adding ${customer.name}:`, err.message);
        }
    }

    console.log('\n✅ Seeding complete!');
}

seedProduction();
