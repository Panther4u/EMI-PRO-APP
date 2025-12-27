const mongoose = require('mongoose');
const Customer = require('./models/Customer');
require('dotenv').config({ path: __dirname + '/.env' });

const mockCustomers = [
    {
        id: '1',
        name: 'Rajesh Kumar',
        phoneNo: '+91 98765 43210',
        aadharNo: '1234 5678 9012',
        address: '123, MG Road, Bengaluru, Karnataka - 560001',
        imei1: '356938035643809',
        imei2: '356938035643817',
        mobileModel: 'Samsung Galaxy S23',
        financeName: 'SecureFinance EMI',
        totalAmount: 75000,
        emiAmount: 6500,
        emiDate: 5,
        totalEmis: 12,
        paidEmis: 4,
        isLocked: false,
        location: {
            lat: 12.9716,
            lng: 77.5946,
            lastUpdated: '2024-01-15T10:30:00Z',
        },
        createdAt: '2023-09-15T08:00:00Z',
        lockHistory: [],
    },
    {
        id: '2',
        name: 'Priya Sharma',
        phoneNo: '+91 87654 32109',
        aadharNo: '2345 6789 0123',
        address: '456, Anna Nagar, Chennai, Tamil Nadu - 600040',
        imei1: '867530012345678',
        imei2: '867530012345686',
        mobileModel: 'iPhone 14 Pro',
        financeName: 'SecureFinance EMI',
        totalAmount: 120000,
        emiAmount: 10500,
        emiDate: 10,
        totalEmis: 12,
        paidEmis: 2,
        isLocked: true,
        location: {
            lat: 13.0827,
            lng: 80.2707,
            lastUpdated: '2024-01-15T09:15:00Z',
        },
        createdAt: '2023-11-01T10:00:00Z',
        lockHistory: [
            {
                id: 'l1',
                action: 'locked',
                timestamp: '2024-01-10T14:30:00Z',
                reason: 'EMI payment overdue by 15 days',
            },
        ],
    },
    {
        id: '3',
        name: 'Mohammed Ali',
        phoneNo: '+91 76543 21098',
        aadharNo: '3456 7890 1234',
        address: '789, Banjara Hills, Hyderabad, Telangana - 500034',
        imei1: '352099001761481',
        imei2: '352099001761499',
        mobileModel: 'OnePlus 12',
        financeName: 'SecureFinance EMI',
        totalAmount: 65000,
        emiAmount: 5800,
        emiDate: 15,
        totalEmis: 12,
        paidEmis: 8,
        isLocked: false,
        location: {
            lat: 17.385,
            lng: 78.4867,
            lastUpdated: '2024-01-15T11:45:00Z',
        },
        createdAt: '2023-05-20T12:00:00Z',
        lockHistory: [],
    },
    {
        id: '4',
        name: 'Sneha Patel',
        phoneNo: '+91 65432 10987',
        aadharNo: '4567 8901 2345',
        address: '321, Satellite, Ahmedabad, Gujarat - 380015',
        imei1: '490154203237518',
        imei2: '490154203237526',
        mobileModel: 'Xiaomi 14 Ultra',
        financeName: 'SecureFinance EMI',
        totalAmount: 55000,
        emiAmount: 4800,
        emiDate: 20,
        totalEmis: 12,
        paidEmis: 1,
        isLocked: true,
        location: {
            lat: 23.0225,
            lng: 72.5714,
            lastUpdated: '2024-01-14T16:20:00Z',
        },
        createdAt: '2023-12-10T09:00:00Z',
        lockHistory: [
            {
                id: 'l2',
                action: 'locked',
                timestamp: '2024-01-12T10:00:00Z',
                reason: 'First EMI payment missed',
            },
        ],
    },
    {
        id: '5',
        name: 'Arun Nair',
        phoneNo: '+91 54321 09876',
        aadharNo: '5678 9012 3456',
        address: '567, Marine Drive, Kochi, Kerala - 682031',
        imei1: '353456789012345',
        imei2: '353456789012352',
        mobileModel: 'Vivo X100 Pro',
        financeName: 'SecureFinance EMI',
        totalAmount: 70000,
        emiAmount: 6200,
        emiDate: 25,
        totalEmis: 12,
        paidEmis: 6,
        isLocked: false,
        location: {
            lat: 9.9312,
            lng: 76.2673,
            lastUpdated: '2024-01-15T08:00:00Z',
        },
        createdAt: '2023-07-05T14:00:00Z',
        lockHistory: [],
    },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        await Customer.deleteMany({});
        await Customer.insertMany(mockCustomers);
        console.log('Database seeded successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seed();
