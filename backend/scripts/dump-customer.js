const mongoose = require('mongoose');
const Customer = require('../models/Customer');
require('dotenv').config({ path: './backend/.env' });

const dumpCustomer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const customer = await Customer.findOne({ name: /kavin/i });
        console.log(JSON.stringify(customer.toObject(), null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
};

dumpCustomer();
