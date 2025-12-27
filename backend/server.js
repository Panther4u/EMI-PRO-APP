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

// Serve APK downloads from public folder
app.use('/downloads', express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/customers', customerRoutes);

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
