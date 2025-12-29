const crypto = require('crypto');
const fs = require('fs');

/**
 * Calculates the URL-safe Base64 SHA-256 checksum of a file.
 * This format is REQUIRED by Android Device Owner provisioning.
 * 
 * @param {string} filePath - Absolute path to the file
 * @returns {string} - URL-safe Base64 encoded SHA-256 hash
 */
function getApkChecksum(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const hashBuffer = crypto.createHash('sha256').update(fileBuffer).digest();

    // Convert to Base64
    const base64Hash = hashBuffer.toString('base64');

    // Convert to URL-safe Base64 (RFC 4648)
    // Replace + with -, / with _, and remove padding =
    return base64Hash
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

module.exports = { getApkChecksum };
