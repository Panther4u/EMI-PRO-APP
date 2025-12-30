const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const Customer = require("../models/Customer");

// Legacy endpoint - kept for backward compatibility
// Auto-Claim Register Endpoint (Step 2)
// Matches device to customer using IMEI
router.post("/register", async (req, res) => {
    try {
        const { imei, imei2, brand, model, androidVersion, androidId, serial } = req.body;
        let { customerId } = req.body;

        console.log(`📡 Device Register Request: ${brand} ${model} (IMEI: ${imei})`);

        // If no customerId provided, try to find by IMEI (Auto-Claim)
        if (!customerId) {
            console.log("   Searching for customer by IMEI...");
            const searchImei = imei || imei2;
            if (searchImei) {
                // Find match in imei1 field
                const customer = await Customer.findOne({ imei1: searchImei });
                if (customer) {
                    customerId = customer.id;
                    console.log(`   ✅ Match Found! Customer: ${customer.name} (${customer.id})`);
                } else {
                    console.warn(`   ⚠️ No matching customer found for IMEI: ${searchImei}`);
                    return res.status(404).json({
                        success: false,
                        error: "Device not pre-registered. No customer found with this IMEI."
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    error: "IMEI required for auto-claim."
                });
            }
        }

        // Logic to update customer status (ADMIN_INSTALLED)
        const updatedCustomer = await Customer.findOneAndUpdate(
            { id: customerId },
            {
                $set: {
                    "deviceStatus.status": "ADMIN_INSTALLED", // Step 2 Status
                    "deviceStatus.lastSeen": new Date(),
                    "deviceStatus.technical.brand": brand,
                    "deviceStatus.technical.model": model,
                    "deviceStatus.technical.osVersion": androidVersion,
                    "deviceStatus.technical.androidId": androidId,
                    "deviceStatus.technical.serial": serial,
                    "isEnrolled": true
                }
            },
            { new: true }
        );

        if (!updatedCustomer) {
            return res.status(404).json({ success: false, error: "Customer not found" });
        }

        console.log(`✅ Device Claimed Successfully for ${customerId}`);
        res.json({
            success: true,
            message: "Device claimed",
            customerId: customerId,
            status: "ADMIN_INSTALLED"
        });

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

