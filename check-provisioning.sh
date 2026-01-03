#!/bin/bash

# 🔍 EMI-PRO Provisioning Diagnostic Script
# This script checks if your provisioning setup is correct

echo "🔍 EMI-PRO Provisioning Diagnostic"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: APK exists
echo "📦 Check 1: APK File Exists"
if [ -f "backend/public/downloads/securefinance-user.apk" ]; then
    SIZE=$(ls -lh backend/public/downloads/securefinance-user.apk | awk '{print $5}')
    echo -e "${GREEN}✅ APK found (Size: $SIZE)${NC}"
else
    echo -e "${RED}❌ APK NOT FOUND at backend/public/downloads/securefinance-user.apk${NC}"
    echo "   Run: cd mobile-app/android && ./gradlew assembleUserRelease"
    exit 1
fi
echo ""

# Check 2: Checksum
echo "🔐 Check 2: APK Checksum"
EXPECTED_CHECKSUM="JfdtHWuytoe5zTSMmMBsJF2KptJBkEA1/kRcC+Vh02o="
ACTUAL_CHECKSUM=$(shasum -a 256 backend/public/downloads/securefinance-user.apk | awk '{print $1}' | xxd -r -p | base64)

if [ "$ACTUAL_CHECKSUM" == "$EXPECTED_CHECKSUM" ]; then
    echo -e "${GREEN}✅ Checksum matches${NC}"
    echo "   Expected: $EXPECTED_CHECKSUM"
    echo "   Actual:   $ACTUAL_CHECKSUM"
else
    echo -e "${YELLOW}⚠️  Checksum MISMATCH${NC}"
    echo "   Expected: $EXPECTED_CHECKSUM"
    echo "   Actual:   $ACTUAL_CHECKSUM"
    echo ""
    echo "   This means the APK has changed. You need to:"
    echo "   1. Update backend/routes/provisioningRoutes.js with new checksum"
    echo "   2. OR rebuild the APK to match the expected checksum"
fi
echo ""

# Check 3: DeviceAdminReceiver in source
echo "📝 Check 3: DeviceAdminReceiver Source File"
if [ -f "mobile-app/android/app/src/main/java/com/securefinance/emilock/DeviceAdminReceiver.java" ]; then
    echo -e "${GREEN}✅ DeviceAdminReceiver.java exists${NC}"
else
    echo -e "${RED}❌ DeviceAdminReceiver.java NOT FOUND${NC}"
    exit 1
fi
echo ""

# Check 4: AndroidManifest has receiver declaration
echo "📋 Check 4: AndroidManifest Receiver Declaration"
if grep -q "DeviceAdminReceiver" mobile-app/android/app/src/main/AndroidManifest.xml; then
    echo -e "${GREEN}✅ DeviceAdminReceiver declared in AndroidManifest.xml${NC}"
    grep -A 5 "DeviceAdminReceiver" mobile-app/android/app/src/main/AndroidManifest.xml | head -6
else
    echo -e "${RED}❌ DeviceAdminReceiver NOT declared in AndroidManifest.xml${NC}"
    exit 1
fi
echo ""

# Check 5: Backend server health
echo "🌐 Check 5: Backend Server Health"
if curl -s "https://emi-pro-app.onrender.com/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is accessible${NC}"
    echo "   URL: https://emi-pro-app.onrender.com/health"
else
    echo -e "${RED}❌ Backend server is NOT accessible${NC}"
    echo "   URL: https://emi-pro-app.onrender.com/health"
    echo "   This will prevent QR provisioning from working!"
fi
echo ""

# Check 6: APK download URL
echo "📥 Check 6: APK Download URL"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk")
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ APK is downloadable from server${NC}"
    echo "   URL: https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"
    echo "   HTTP Status: $HTTP_CODE"
else
    echo -e "${RED}❌ APK is NOT downloadable from server${NC}"
    echo "   URL: https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"
    echo "   HTTP Status: $HTTP_CODE"
    echo "   You need to deploy the APK to Render!"
fi
echo ""

# Check 7: Provisioning payload endpoint
echo "🔧 Check 7: Provisioning Payload Endpoint"
if curl -s "https://emi-pro-app.onrender.com/api/provisioning/payload/TEST" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Provisioning endpoint is working${NC}"
    echo "   Test URL: https://emi-pro-app.onrender.com/api/provisioning/payload/TEST"
else
    echo -e "${RED}❌ Provisioning endpoint is NOT working${NC}"
    echo "   Test URL: https://emi-pro-app.onrender.com/api/provisioning/payload/TEST"
fi
echo ""

# Summary
echo "=================================="
echo "📊 Summary"
echo "=================================="
echo ""
echo "If all checks passed, your provisioning setup is correct."
echo "If QR scanning still fails, the issue is likely:"
echo ""
echo "1. ⚠️  Device not properly factory reset"
echo "   - Must be completely reset"
echo "   - NO Google account added"
echo "   - On welcome screen"
echo ""
echo "2. ⚠️  WiFi credentials in QR are incorrect"
echo "   - Device can't connect to internet"
echo "   - Can't download APK"
echo ""
echo "3. ⚠️  QR code too dense to scan"
echo "   - Try increasing phone brightness"
echo "   - Hold phone steady"
echo "   - Ensure good lighting"
echo ""
echo "4. ⚠️  Android version incompatibility"
echo "   - Device must be Android 7.0+"
echo "   - Some manufacturers block Device Owner"
echo ""
echo "For detailed troubleshooting, see:"
echo "  📖 PROVISIONING_TROUBLESHOOTING.md"
echo ""
