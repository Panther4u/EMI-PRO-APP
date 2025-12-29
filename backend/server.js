require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const customerRoutes = require('./routes/customerRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Define MIME types (handled in setHeaders below)
// express.static.mime.define({ 'application/vnd.android.package-archive': ['apk'] });

// Serve APK downloads from public folder
app.use('/downloads', (req, res, next) => {
    console.log(`Download request: ${req.url}`);
    next();
}, express.static(path.join(__dirname, 'public'), {
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

// API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/provisioning', require('./routes/provisioningRoutes'));

// Serve frontend build (production)
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback - serve index.html for all other routes (not starting with /api or /downloads)
app.get(/^(?!\/api|\/downloads).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Could not connect to MongoDB Atlas', err);
    });
