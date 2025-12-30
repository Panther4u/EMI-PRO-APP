const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const Customer = require("../models/Customer");

// Legacy endpoint - kept for backward compatibility
router.post("/register", async (req, res) => {
    try {
        const { customerId } = req.body;
        const device = await Device.findOneAndUpdate(
            { customerId: customerId },
            {
                ...req.body,
                status: "ADMIN_INSTALLED",
                lastSeen: new Date(),
                enrolledAt: req.body.enrolledAt || new Date()
            },
            { upsert: true, new: true }
        );

        console.log(`Device registered: ${customerId} (${req.body.actualBrand} ${req.body.model})`);
        res.json({ success: true, device });
    } catch (e) {
        console.error("Device registration error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 🔥 NEW: Admin DPC enrollment endpoint
// This is called IMMEDIATELY after QR provisioning completes
// This is the ONLY source of truth for device details
router.post("/enrolled", async (req, res) => {
    try {
        const {
            customerId,
            brand,
            model,
            manufacturer,
            androidVersion,
            sdkInt,
            androidId,
            serial,
            imei,
            imei2,
            meid,
            enrolledAt,
            status
        } = req.body;

        console.log(`🚀 Device enrollment from Admin DPC: ${customerId}`);
        console.log(`   Device: ${brand} ${model} (Android ${androidVersion})`);
        console.log(`   IMEI: ${imei}`);

        // Update customer record with device details
        const customer = await Customer.findOneAndUpdate(
            { id: customerId },
            {
                $set: {
                    // Update device status to ENROLLED
                    "deviceStatus.status": "ADMIN_INSTALLED",
                    "deviceStatus.lastSeen": new Date(),
                    "deviceStatus.lastStatusUpdate": new Date(),

                    // Store technical details from Admin DPC
                    "deviceStatus.technical.brand": brand,
                    "deviceStatus.technical.model": model,
                    "deviceStatus.technical.osVersion": androidVersion,
                    "deviceStatus.technical.androidId": androidId,

                    // Update onboarding steps
                    "deviceStatus.steps.qrScanned": true,
                    "deviceStatus.steps.appInstalled": true,
                    "deviceStatus.steps.detailsFetched": true,

                    // Update IMEI if provided (verify against expected)
                    ...(imei && { imei1: imei }),

                    // Mark as enrolled
                    isEnrolled: true
                }
            },
            { new: true, upsert: false }
        );

        if (!customer) {
            console.error(`❌ Customer not found: ${customerId}`);
            return res.status(404).json({
                success: false,
                error: "Customer not found. Create customer record first."
            });
        }

        // Also create/update Device record for backward compatibility
        await Device.findOneAndUpdate(
            { customerId: customerId },
            {
                customerId,
                actualBrand: brand,
                model,
                androidVersion: parseInt(androidVersion) || 0,
                imei,
                serial,
                androidId,
                status: "ENROLLED",
                enrolledAt: enrolledAt ? new Date(enrolledAt) : new Date(),
                lastSeen: new Date()
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Device enrolled successfully: ${customerId}`);
        console.log(`   Dashboard will now show device details immediately`);

        res.json({
            success: true,
            message: "Device enrolled successfully",
            customer: {
                id: customer.id,
                name: customer.name,
                deviceStatus: customer.deviceStatus
            }
        });

    } catch (e) {
        console.error("❌ Device enrollment error:", e);
        res.status(500).json({
            success: false,
            error: e.message
        });
    }
});

module.exports = router;

