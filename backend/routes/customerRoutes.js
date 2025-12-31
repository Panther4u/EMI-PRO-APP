const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Get all customers
router.get('/', async (req, res) => {
    try {
        // Return newest customers first
        const customers = await Customer.find().sort({ createdAt: -1 }).lean();
        res.json(customers);
    } catch (err) {
        console.error('Error fetching customers:', err);
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

        // Check if IMEI already exists - UPDATE instead of rejecting
        const existing = await Customer.findOne({ imei1: customerData.imei1 });
        if (existing) {
            // Update existing customer
            const updatedCustomer = await Customer.findOneAndUpdate(
                { imei1: customerData.imei1 },
                { $set: customerData },
                { new: true }
            );
            console.log(`✅ Updated existing customer: ${updatedCustomer.name}`);
            return res.status(200).json(updatedCustomer);
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
        const { status, installProgress, errorMessage, step, actualBrand, model, androidVersion, androidId } = req.body;

        const updateData = {
            'deviceStatus.status': status || 'installing',
            'deviceStatus.lastStatusUpdate': new Date(),
            'deviceStatus.lastSeen': new Date()
        };

        if (actualBrand) updateData['deviceStatus.technical.brand'] = actualBrand;
        if (model) updateData['deviceStatus.technical.model'] = model;
        if (androidVersion) updateData['deviceStatus.technical.osVersion'] = androidVersion;
        if (androidId) updateData['deviceStatus.technical.androidId'] = androidId;

        if (installProgress !== undefined) {
            updateData['deviceStatus.installProgress'] = installProgress;
        }

        if (errorMessage) {
            updateData['deviceStatus.errorMessage'] = errorMessage;
        }

        // Handle specific onboarding step updates
        if (step || status === 'ADMIN_INSTALLED') {
            const steps = updateData['deviceStatus.steps'] || {};

            if (step === 'qr_scanned' || status === 'ADMIN_INSTALLED') updateData['deviceStatus.steps.qrScanned'] = true;
            if (step === 'installed' || status === 'ADMIN_INSTALLED') updateData['deviceStatus.steps.appInstalled'] = true;
            if (step === 'launched' || status === 'ADMIN_INSTALLED') updateData['deviceStatus.steps.appLaunched'] = true;
            if (step === 'permissions' || status === 'ADMIN_INSTALLED') updateData['deviceStatus.steps.permissionsGranted'] = true;
            if (step === 'details' || status === 'ADMIN_INSTALLED') updateData['deviceStatus.steps.detailsFetched'] = true;
            if (step === 'deviceBound' || status === 'ADMIN_INSTALLED') {
                updateData['deviceStatus.steps.qrScanned'] = true;
                updateData['deviceStatus.steps.appInstalled'] = true;
                updateData['deviceStatus.steps.appLaunched'] = true;
                updateData['deviceStatus.steps.permissionsGranted'] = true;
                updateData['deviceStatus.steps.detailsFetched'] = true;
                updateData['deviceStatus.steps.imeiVerified'] = true;
                updateData['deviceStatus.steps.deviceBound'] = true;
            }
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
        if (simDetails) {
            // SIM Change Detection Logic
            if (customer.simDetails && customer.simDetails.serialNumber) {
                // Check if SIM changed (compare ICCID/Serial)
                if (simDetails.serialNumber && simDetails.serialNumber !== customer.simDetails.serialNumber) {
                    console.warn(`SIM Change Detected for ${customer.name}: ${customer.simDetails.serialNumber} -> ${simDetails.serialNumber}`);

                    // Log to History
                    customer.simChangeHistory.push({
                        serialNumber: simDetails.serialNumber,
                        operator: simDetails.operator,
                        detectedAt: new Date(),
                        ipAddress: req.ip
                    });

                    // Flag Status
                    status = 'SIM_MISMATCH';
                    message = 'Unauthorized SIM Card Detected';
                    customer.deviceStatus.errorMessage = message;
                    customer.deviceStatus.status = 'error';

                    // OPTIONAL: Auto-Lock on SIM Change
                    // customer.isLocked = true; 
                    // customer.lockHistory.push({
                    //    id: Date.now().toString(),
                    //    action: 'locked',
                    //    reason: 'SIM Change Detected',
                    //    timestamp: new Date().toISOString()
                    // });
                }
            }
            customer.simDetails = simDetails; // Update to latest
        }

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

// Heartbeat endpoint - User App sends status every few seconds
router.post('/heartbeat', async (req, res) => {
    try {
        const { deviceId, customerId, status, appInstalled, lastSeen, location } = req.body;

        const updateData = {
            'deviceStatus.status': status || 'active',
            'deviceStatus.lastSeen': new Date(lastSeen || Date.now()),
            isEnrolled: appInstalled !== false
        };

        if (location) {
            updateData['location.lat'] = location.lat;
            updateData['location.lng'] = location.lng;
            updateData['location.lastUpdated'] = new Date();
        }

        // Mark all steps as complete if app is installed and running
        if (appInstalled) {
            updateData['deviceStatus.steps.appInstalled'] = true;
            updateData['deviceStatus.steps.appLaunched'] = true;
            updateData['deviceStatus.steps.permissionsGranted'] = true;
            updateData['deviceStatus.steps.detailsFetched'] = true;
            updateData['deviceStatus.steps.imeiVerified'] = true;
            updateData['deviceStatus.steps.deviceBound'] = true;
        }

        const customer = await Customer.findOneAndUpdate(
            { $or: [{ id: customerId }, { imei1: deviceId }] },
            updateData,
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Device not found' });
        }

        // Check for pending commands
        let pendingCommand = null;
        if (customer.remoteCommand && customer.remoteCommand.command) {
            pendingCommand = customer.remoteCommand.command;
            // Clear once sent to device
            await Customer.updateOne({ _id: customer._id }, { $unset: { remoteCommand: "" } });
        }

        res.json({
            ok: true,
            status: customer.deviceStatus.status,
            command: pendingCommand
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Set remote command for a device
router.post('/:id/command', async (req, res) => {
    try {
        const { command } = req.body;
        if (!['lock', 'unlock', 'wipe', 'reset'].includes(command)) {
            return res.status(400).json({ message: 'Invalid command' });
        }

        const updateData = {
            remoteCommand: {
                command,
                timestamp: new Date()
            }
        };

        // If the command is lock or unlock, also update the high-level state
        if (command === 'lock') updateData.isLocked = true;
        if (command === 'unlock') updateData.isLocked = false;

        const customer = await Customer.findOneAndUpdate(
            { id: req.params.id },
            { $set: updateData },
            { new: true }
        );

        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json({ success: true, message: `Command ${command} queued for device`, customer });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
