const logger = require('../config/logger');
const Device = require('../models/Device');

/**
 * Device Limit Enforcement Middleware
 * Checks if admin has reached their device limit
 */
const checkDeviceLimit = async (req, res, next) => {
    try {
        // Super Admin bypasses limit check
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        // Get admin's device limit
        const deviceLimit = req.user.deviceLimit || 0;

        // Count current devices
        const currentDeviceCount = await Device.countDocuments({
            dealerId: req.user._id
        });

        // Check if limit reached
        if (currentDeviceCount >= deviceLimit) {
            logger.logSecurityEvent('DEVICE_LIMIT_REACHED', {
                adminId: req.user._id,
                adminEmail: req.user.email,
                currentCount: currentDeviceCount,
                limit: deviceLimit
            });

            return res.status(403).json({
                success: false,
                error: 'Device limit reached',
                message: `You have reached your device limit of ${deviceLimit}. Contact support to increase your limit.`,
                currentCount: currentDeviceCount,
                limit: deviceLimit
            });
        }

        // Attach device stats to request for logging
        req.deviceStats = {
            current: currentDeviceCount,
            limit: deviceLimit,
            remaining: deviceLimit - currentDeviceCount
        };

        next();
    } catch (error) {
        logger.error('Device limit check error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to check device limit'
        });
    }
};

module.exports = checkDeviceLimit;
