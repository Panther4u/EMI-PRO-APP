const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const Customer = require("../models/Customer");

// Legacy endpoint - kept for backward compatibility
// Auto-Claim Register Endpoint (Step 2)
// Matches device to customer using IMEI
// IMEI-based Device Registration Endpoint (Admin DPC)
// Matches device to customer using IMEI provided by Admin APK
router.post("/register", async (req, res) => {
    try {
        console.log("🔥 DEVICE REGISTER HIT 🔥", req.body);
        const { imei, brand, model, androidVersion, serial, androidId, status } = req.body;

        if (!imei) {
            return res.status(400).json({ error: "IMEI missing" });
        }

        // Adapted: Match against 'imei1' which is the unique index in our Customer schema
        // User provided logic: Customer.findOne({ expectedImei: imei });
        // Our schema: imei1
        const customer = await Customer.findOne({ imei1: imei });

        if (!customer) {
            return res.status(404).json({ error: "No customer for this IMEI" });
        }

        // Adapted: Update 'deviceStatus' and 'technical' fields based on our schema
        // User provided logic: customer.device = { ... }
        // Our schema: customer.deviceStatus.technical = { ... }

        customer.deviceStatus.status = "ADMIN_INSTALLED";
        customer.deviceStatus.lastSeen = new Date();
        customer.deviceStatus.lastStatusUpdate = new Date();

        customer.deviceStatus.technical = {
            brand,
            model,
            osVersion: androidVersion, // Schema uses osVersion
            androidId,
            serial
        };

        // Mark steps as complete
        customer.deviceStatus.steps.qrScanned = true;
        customer.deviceStatus.steps.appInstalled = true;
        customer.deviceStatus.steps.detailsFetched = true;
        customer.deviceStatus.steps.imeiVerified = true;

        customer.isEnrolled = true;

        await customer.save();

        res.json({ success: true });

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

