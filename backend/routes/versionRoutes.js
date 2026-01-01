const express = require('express');
const router = express.Router();

// Admin APK version endpoint
router.get('/admin-version', (req, res) => {
    res.json({
        version: '1.0.0', // Update this when you release a new APK
        downloadUrl: 'https://emi-pro-app.onrender.com/app-admin-release.apk',
        releaseNotes: 'Initial release with full web dashboard',
        minSupportedVersion: '1.0.0',
        forceUpdate: false
    });
});

module.exports = router;
