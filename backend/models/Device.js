const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
    customerId: { type: String, required: true },
    name: String,
    phone: String,
    address: String,
    actualBrand: String,
    model: String,
    androidVersion: Number,
    imei: String,
    serial: String,
    androidId: String,
    status: { type: String, default: "PENDING" },
    enrolledAt: Date,
    lastSeen: Date
});

module.exports = mongoose.model("Device", DeviceSchema);
