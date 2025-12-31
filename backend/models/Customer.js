const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phoneNo: { type: String, required: true },
    aadharNo: { type: String },
    address: { type: String },
    imei1: { type: String, required: true, unique: true }, // The ACTUAL IMEI from device
    expectedIMEI: { type: String }, // The IMEI admin expects (for verification)
    imei2: { type: String },
    mobileModel: { type: String },

    // SIM Tracking
    simDetails: {
        operator: { type: String },
        serialNumber: { type: String }, // ICCID
        phoneNumber: { type: String },
        imsi: { type: String },
        isAuthorized: { type: Boolean, default: true },
        lastUpdated: { type: Date }
    },
    simChangeHistory: [{
        serialNumber: { type: String },
        operator: { type: String },
        detectedAt: { type: Date },
        ipAddress: { type: String }
    }],

    // Offline Lock Tokens
    offlineLockToken: { type: String }, // 6-digit PIN for locking via SMS
    offlineUnlockToken: { type: String }, // Token to unlock via SMS

    // Device Binding (QR)
    deviceBindToken: { type: String },
    bindTokenExpiresAt: { type: Date },

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
        lastUpdated: { type: Date },
        address: { type: String }
    },
    emiSchedule: [{
        dueDate: { type: Date },
        amount: { type: Number },
        status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE'], default: 'PENDING' },
        paidAt: { type: Date }
    }],
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
    enrollmentToken: { type: String },
    deviceStatus: {
        status: {
            type: String,
            enum: ['pending', 'installing', 'connected', 'online', 'offline', 'error', 'ADMIN_INSTALLED'],
            default: 'pending'
        },
        lastSeen: { type: Date },
        lastStatusUpdate: { type: Date },
        installProgress: { type: Number, default: 0 }, // 0-100
        errorMessage: { type: String },
        // Technical Details from Admin DPC
        technical: {
            brand: { type: String },
            model: { type: String },
            osVersion: { type: String },
            androidId: { type: String },
            serial: { type: String }
        },
        // Detailed Onboarding Steps
        steps: {
            qrScanned: { type: Boolean, default: false }, // Inferred or Manual
            appInstalled: { type: Boolean, default: false },
            appLaunched: { type: Boolean, default: false },
            permissionsGranted: { type: Boolean, default: false },
            detailsFetched: { type: Boolean, default: false },
            imeiVerified: { type: Boolean, default: false },
            deviceBound: { type: Boolean, default: false }
        }
    },
    remoteCommand: {
        command: { type: String }, // e.g. "lock", "unlock", "wipe"
        timestamp: { type: Date }
    }
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
