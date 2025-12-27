const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Get all customers
router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete all customers (Reset Data)
router.delete('/danger/delete-all', async (req, res) => {
    try {
        await Customer.deleteMany({});
        res.json({ message: 'All customer data cleared successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new customer with duplicate check
router.post('/', async (req, res) => {
    try {
        const customerData = req.body;

        // Check if IMEI already exists
        const existing = await Customer.findOne({ imei1: customerData.imei1 });
        if (existing) {
            return res.status(409).json({ message: 'Device with this IMEI already exists. Duplicates are not allowed.' });
        }

        const customer = new Customer(customerData);
        const newCustomer = await customer.save();
        res.status(201).json(newCustomer);
    } catch (err) {
        if (err.code === 11000) {
            res.status(409).json({ message: 'Duplicate data: a device with this IMEI or ID already exists.' });
        } else {
            res.status(400).json({ message: err.message });
        }
    }
});

// Update a customer
router.patch('/:id', async (req, res) => {
    try {
        const customer = await Customer.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a customer
router.delete('/:id', async (req, res) => {
    try {
        const customer = await Customer.findOneAndDelete({ id: req.params.id });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json({ message: 'Customer deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Bulk update customers (optional, useful for resetting mock data to DB)
router.post('/bulk', async (req, res) => {
    try {
        await Customer.deleteMany({});
        const customers = await Customer.insertMany(req.body);
        res.status(201).json(customers);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
