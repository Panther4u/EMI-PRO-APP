const mongoose = require('mongoose');

/**
 * Device Model - Tracks device lifecycle separate from customer
 * 
 * States:
 * - PENDING: QR generated, waiting for enrollment
 * - ACTIVE: Device enrolled and working
 * - LOCKED: EMI overdue, device locked
 * - REMOVED: Device removed from customer, cannot be reused without new QR
 * - UNASSIGNED: Fresh device, no customer assigned yet
 */
const DeviceSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Platform
    platform: {
        type: String,
        enum: ['android', 'ios'],
        default: 'android'
    },

    // Lifecycle State
    state: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'LOCKED', 'REMOVED', 'UNASSIGNED'],
        default: 'PENDING'
    },

    // Customer Assignment
    assignedCustomerId: {
        type: String,
        default: null,
        index: true
    },

    // Device Info
    brand: { type: String },
    model: { type: String },
    osVersion: { type: String },
    imei1: { type: String },
    imei2: { type: String },
    androidId: { type: String },

    // SIM Info
    simOperator: { type: String },
    simIccid: { type: String },

    // Tracking
    lastSeenAt: { type: Date },
    lastLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },

    // QR Type used for enrollment
    enrollmentType: {
        type: String,
        enum: ['ANDROID_NEW', 'ANDROID_EXISTING', 'IOS'],
        default: 'ANDROID_NEW'
    },

    // Enrollment Token (for QR validation)
    enrollmentToken: { type: String },
    enrollmentTokenExpiresAt: { type: Date },

    // History
    stateHistory: [{
        state: { type: String },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String },
        changedBy: { type: String } // admin user who changed
    }],

    // Removal Info
    removedAt: { type: Date },
    removalReason: { type: String }

}, { timestamps: true });

// Index for faster queries
DeviceSchema.index({ state: 1 });
DeviceSchema.index({ platform: 1 });

module.exports = mongoose.model('Device', DeviceSchema);
