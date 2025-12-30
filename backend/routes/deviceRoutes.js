const express = require("express");
const router = express.Router();
const Device = require("../models/Device");

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

module.exports = router;
