require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger); // Log all requests

// Start EMI Scheduler
try {
    const emiScheduler = require('./scheduler/emiScheduler');
    emiScheduler.start();
    logger.logSystemEvent('EMI Scheduler Started');
} catch (err) {
    logger.error('Failed to start EMI Scheduler', { error: err.message, stack: err.stack });
}

// Define MIME types (handled in setHeaders below)
// express.static.mime.define({ 'application/vnd.android.package-archive': ['apk'] });

// Serve APK downloads from public/downloads folder
app.use('/downloads', (req, res, next) => {
    logger.info('APK Download Request', { file: req.url, ip: req.ip });
    next();
}, express.static(path.join(__dirname, 'public/downloads'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.apk')) {
            res.set('Content-Type', 'application/vnd.android.package-archive');
        }
    }
}));

// DEBUG ROUTE - Remove in production
app.get('/debug-files', (req, res) => {
    try {
        const fs = require('fs');
        const publicPath = path.join(__dirname, 'public');
        if (!fs.existsSync(publicPath)) {
            return res.status(404).json({ error: 'Public folder not found' });
        }
        const files = fs.readdirSync(publicPath);
        const fileStats = files.map(file => {
            const stat = fs.statSync(path.join(publicPath, file));
            return {
                name: file,
                size: stat.size,
                created: stat.birthtime
            };
        });
        res.json({
            path: publicPath,
            files: fileStats,
            dirname: __dirname
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Version Info - Dynamic (Reads from version.json)
app.get('/version', (req, res) => {
    try {
        const fs = require('fs');
        const versionPath = path.join(__dirname, 'public/downloads/version.json');
        if (fs.existsSync(versionPath)) {
            // Use fs.readFileSync to avoid require() cache
            const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
            res.json(versionData);
        } else {
            res.json({
                apk: 'securefinance-admin-v2.0.5.apk', // Fallback
                type: 'admin',
                version: '2.0.5'
            });
        }
    } catch (e) {
        res.status(500).json({ error: 'Failed to read version info' });
    }
});

// API Routes
app.use('/api/admin', require('./routes/adminUserRoutes')); // Admin user management
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/provisioning', require('./routes/provisioningRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api', require('./routes/versionRoutes'));

// Serve frontend build (production)
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback - serve index.html for all other routes (not starting with /api or /downloads)
app.get(/^(?!\/api|\/downloads).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Global error handler (must be last)
app.use(errorHandler);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        logger.logSystemEvent('MongoDB Connected', { uri: process.env.MONGODB_URI?.split('@')[1] });
        app.listen(PORT, '0.0.0.0', () => {
            logger.logSystemEvent('Server Started', { port: PORT, env: process.env.NODE_ENV || 'development' });
        });
    })
    .catch(err => {
        logger.error('MongoDB Connection Failed', { error: err.message, stack: err.stack });
        process.exit(1);
    });

// Re-connection event listeners
mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB Disconnected', { message: 'Attempting to reconnect...' });
});

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB Error', { error: err.message });
});

// Process Error Handlers to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', { reason, promise: promise.toString() });
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1); // Exit after logging
});
