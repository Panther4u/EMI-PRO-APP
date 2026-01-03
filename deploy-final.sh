#!/bin/bash

echo "🚀 Final Deployment - USER APK with WiFi Support"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Verify APK exists
echo "1️⃣ Verifying APK..."
if [ -f "backend/public/downloads/securefinance-user.apk" ]; then
    SIZE=$(ls -lh backend/public/downloads/securefinance-user.apk | awk '{print $5}')
    echo -e "${GREEN}✅ APK found (Size: $SIZE)${NC}"
else
    echo "❌ APK not found!"
    exit 1
fi
echo ""

# Step 2: Calculate checksum
echo "2️⃣ Calculating checksum..."
CHECKSUM=$(shasum -a 256 backend/public/downloads/securefinance-user.apk | awk '{print $1}' | xxd -r -p | base64)
echo -e "${GREEN}✅ Checksum: $CHECKSUM${NC}"
echo ""

# Step 3: Deploy to Render
echo "3️⃣ Deploying to Render..."
git add backend/public/downloads/securefinance-user.apk
git add backend/routes/provisioningRoutes.js
git add mobile-app/android/app/build.gradle
git add src/

git commit -m "Deploy rebuilt USER APK with WiFi support and updated checksum

- Rebuilt USER APK with latest DeviceAdminReceiver
- Updated checksum: $CHECKSUM
- WiFi configuration support enabled
- Admin app renamed to 'SecurePro'
- All UI improvements included"

echo ""
echo "4️⃣ Pushing to GitHub/Render..."
git push origin main

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "=================================================="
echo "📊 Next Steps"
echo "=================================================="
echo ""
echo "1. ⏳ Wait for Render to deploy (2-3 minutes)"
echo "   Check: https://dashboard.render.com"
echo ""
echo "2. ✅ Verify APK is accessible:"
echo "   curl -I https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"
echo ""
echo "3. 🔄 Generate NEW QR code with WiFi credentials"
echo "   - WiFi SSID: Your_Network_Name"
echo "   - WiFi Password: Your_Password"
echo ""
echo "4. 📱 Factory reset device"
echo "   - NO Google account"
echo "   - Stay on welcome screen"
echo ""
echo "5. 📷 Scan QR code"
echo "   - Tap 6 times on welcome screen"
echo "   - Scan QR"
echo "   - Device will connect to WiFi and provision"
echo ""
echo "6. 🎉 Success!"
echo ""
