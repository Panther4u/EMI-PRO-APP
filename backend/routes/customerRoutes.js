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

// Update device status (called by mobile device during provisioning)
// Update device status (called by mobile device during provisioning)
router.post('/:id/status', async (req, res) => {
    try {
        const { status, installProgress, errorMessage, step } = req.body;

        const updateData = {
            'deviceStatus.status': status,
            'deviceStatus.lastStatusUpdate': new Date(),
            'deviceStatus.lastSeen': new Date()
        };

        if (installProgress !== undefined) {
            updateData['deviceStatus.installProgress'] = installProgress;
        }

        if (errorMessage) {
            updateData['deviceStatus.errorMessage'] = errorMessage;
        }

        // Handle specific onboarding step updates
        if (step) {
            if (step === 'qr_scanned') updateData['deviceStatus.steps.qrScanned'] = true; // New Step
            if (step === 'installed') updateData['deviceStatus.steps.appInstalled'] = true;
            if (step === 'launched') updateData['deviceStatus.steps.appLaunched'] = true; // New Step
            if (step === 'permissions') updateData['deviceStatus.steps.permissionsGranted'] = true;
            if (step === 'details') updateData['deviceStatus.steps.detailsFetched'] = true;
            // Note: 'imeiVerified' and 'deviceBound' are set by the /verify endpoint
        }

        const customer = await Customer.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true }
        );

        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify device details (IMEI, SIM) and sync offline tokens
router.post('/:id/verify', async (req, res) => {
    try {
        const { actualIMEI, simDetails, modelDetails } = req.body;
        const customer = await Customer.findOne({ id: req.params.id });

        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // Update technical details
        if (modelDetails) customer.mobileModel = modelDetails;
        if (simDetails) customer.simDetails = simDetails;

        // Generate Token if missing (for Offline Lock)
        if (!customer.offlineLockToken) {
            customer.offlineLockToken = Math.floor(100000 + Math.random() * 900000).toString();
        }

        // Verification Logic
        // We compare the REPORTED 'actualIMEI' with the RECORDED 'imei1' (which admin entered)
        let status = 'VERIFIED';
        let message = 'Device Verified';

        // Mark details step as done
        customer.deviceStatus.steps.detailsFetched = true;

        // If Admin provided an expected IMEI (or we just use imei1), check it
        // We assume 'imei1' is the source of truth from Admin
        if (actualIMEI && customer.imei1 && actualIMEI.trim() !== customer.imei1.trim()) {
            status = 'MISMATCH';
            message = `IMEI Mismatch! Admin Expects: ${customer.imei1}, Device Reports: ${actualIMEI}`;

            // Log the mismatch but don't overwrite the Admin's "Correct" IMEI yet
            // potentially store actualIMEI in a separate field or log it
            customer.deviceStatus.errorMessage = message;
            customer.deviceStatus.status = 'error';
            customer.deviceStatus.steps.imeiVerified = false;
        } else {
            customer.deviceStatus.status = 'connected';
            customer.deviceStatus.errorMessage = null;
            customer.deviceStatus.steps.imeiVerified = true;

            // If verified, we consider it bound (for now)
            customer.deviceStatus.steps.deviceBound = true;
        }

        customer.deviceStatus.lastSeen = new Date();
        // Force update of nested object if it wasn't modified directly by mongoose
        customer.markModified('deviceStatus.steps');

        await customer.save();

        res.json({
            status,
            message,
            offlineLockToken: customer.offlineLockToken
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
