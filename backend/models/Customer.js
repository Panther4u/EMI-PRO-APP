const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phoneNo: { type: String, required: true },
    aadharNo: { type: String },
    address: { type: String },
    imei1: { type: String, required: true, unique: true },
    imei2: { type: String },
    mobileModel: { type: String },
    deviceName: { type: String },
    financeName: { type: String },
    totalAmount: { type: Number },
    emiAmount: { type: Number },
    emiDate: { type: Number },
    totalEmis: { type: Number },
    paidEmis: { type: Number },
    isLocked: { type: Boolean, default: false },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        lastUpdated: { type: String },
        address: { type: String }
    },
    createdAt: { type: String },
    lockHistory: [{
        id: { type: String },
        action: { type: String, enum: ['locked', 'unlocked'] },
        timestamp: { type: String },
        reason: { type: String }
    }],
    photoUrl: { type: String },
    documents: [String],
    isEnrolled: { type: Boolean, default: false },
    enrollmentToken: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
