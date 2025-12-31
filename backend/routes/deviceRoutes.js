const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const Customer = require("../models/Customer");

// Legacy endpoint - kept for backward compatibility
// Auto-Claim Register Endpoint (Step 2)
// Matches device to customer using IMEI
// IMEI-based Device Registration Endpoint (Admin DPC)
// Matches device to customer using IMEI provided by Admin APK
// Device Registration Endpoint (Admin DPC)
// Upserts device info based on androidId
router.post("/register", async (req, res) => {
    try {
        console.log("🔥 DEVICE REGISTER HIT 🔥", req.body);
        const { androidId, brand, model, androidVersion } = req.body;

        if (!androidId) {
            return res.status(400).json({ error: "Android ID missing" });
        }

        const device = await Device.findOneAndUpdate(
            { androidId },
            {
                androidId,
                actualBrand: brand,
                model,
                androidVersion: parseInt(androidVersion) || 0,
                status: "ADMIN_INSTALLED",
                enrolledAt: new Date(),
                lastSeen: new Date(),
                customerId: req.body.customerId || "UNCLAIMED"
            },
            { upsert: true, new: true }
        );

        // 🔥 AUTO-LINK: If customerId is present, update the Customer record too
        if (req.body.customerId && req.body.customerId !== "UNCLAIMED") {
            console.log(`🔗 Auto-linking device ${androidId} to customer ${req.body.customerId}`);

            const customerUpdate = {
                "deviceStatus.status": "ADMIN_INSTALLED",
                "deviceStatus.lastSeen": new Date(),
                "deviceStatus.technical.brand": brand,
                "deviceStatus.technical.model": model,
                "deviceStatus.technical.osVersion": androidVersion,
                "deviceStatus.technical.androidId": androidId,
                "deviceStatus.steps.qrScanned": true,
                "deviceStatus.steps.appInstalled": true,
                "deviceStatus.steps.detailsFetched": true,
                isEnrolled: true
            };

            // Capture location if provided
            if (req.body.location) {
                customerUpdate["location.lat"] = req.body.location.lat;
                customerUpdate["location.lng"] = req.body.location.lng;
                customerUpdate["location.lastUpdated"] = new Date().toISOString();
            }

            await Customer.findOneAndUpdate(
                { id: req.body.customerId },
                { $set: customerUpdate }
            );
        }

        console.log("✅ Device registered/updated:", device.androidId);
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

// 🔥 FETCH UNCLAIMED DEVICES
// Returns all devices that haven't been linked to a real customer account
router.get("/unclaimed", async (req, res) => {
    try {
        const devices = await Device.find({
            $or: [
                { status: "UNCLAIMED" },
                { status: "ADMIN_INSTALLED", customerId: { $in: ["UNCLAIMED", "UNKNOWN_ORPHAN"] } }
            ]
        }).sort({ lastSeen: -1 });
        res.json(devices);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// 🔥 CLAIM DEVICE
// Links an unclaimed device to a specific customer
router.post("/claim", async (req, res) => {
    try {
        const { deviceId, customerId } = req.body;

        if (!deviceId || !customerId) {
            return res.status(400).json({ error: "deviceId and customerId required" });
        }

        const device = await Device.findById(deviceId);
        if (!device) {
            return res.status(404).json({ error: "Device not found" });
        }

        const customer = await Customer.findOne({ id: customerId });
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        // 1. Update Customer with Device Details
        // We use the device's reported ID (IMEI or Android ID) as the source of truth
        const reportedId = device.imei || device.androidId;

        // Ensure we don't accidentally overwrite strict IMEI if the device reported Android ID
        // But for claiming, we generally trust the device's report.
        if (device.imei) {
            customer.imei1 = device.imei;
        }

        customer.deviceStatus.status = "ADMIN_INSTALLED";
        customer.deviceStatus.technical = {
            brand: device.actualBrand,
            model: device.model,
            osVersion: device.androidVersion,
            androidId: device.androidId,
            serial: device.serial
        };
        customer.deviceStatus.lastSeen = new Date();
        customer.isEnrolled = true;
        customer.deviceStatus.steps.imeiVerified = true; // Manually verified by admin

        await customer.save();

        // 2. Update Device Record to be CLAIMED
        device.status = "ENROLLED";
        device.customerId = customerId;
        device.enrolledAt = new Date();
        await device.save();

        res.json({ success: true, message: "Device successfully claimed and linked to customer" });

    } catch (e) {
        console.error("Claim error:", e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;

