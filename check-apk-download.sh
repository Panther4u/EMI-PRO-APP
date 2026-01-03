#!/bin/bash

echo "🔍 APK Download Diagnostic Script"
echo "=================================="
echo ""

# Check 1: Is APK accessible on Render?
echo "1️⃣ Checking if APK is accessible on Render..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk")
echo "   HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" == "200" ]; then
    echo "   ✅ APK is accessible"
    
    # Get file size
    SIZE=$(curl -sI "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk" | grep -i content-length | awk '{print $2}' | tr -d '\r')
    SIZE_MB=$((SIZE / 1024 / 1024))
    echo "   Size: ${SIZE_MB}MB"
else
    echo "   ❌ APK is NOT accessible (HTTP $HTTP_CODE)"
    echo "   This is why the device cannot download it!"
fi
echo ""

# Check 2: Content-Type
echo "2️⃣ Checking Content-Type..."
CONTENT_TYPE=$(curl -sI "https://emi-pro-app.onrender.com/downloads/securefinance-user.apk" | grep -i content-type | awk '{print $2}' | tr -d '\r')
echo "   Content-Type: $CONTENT_TYPE"

if [[ "$CONTENT_TYPE" == *"application/vnd.android.package-archive"* ]]; then
    echo "   ✅ Correct Content-Type"
else
    echo "   ⚠️  Unexpected Content-Type (should be application/vnd.android.package-archive)"
fi
echo ""

# Check 3: Provisioning payload
echo "3️⃣ Checking Provisioning Payload..."
PAYLOAD=$(curl -s "https://emi-pro-app.onrender.com/api/provisioning/payload/TEST")
echo "$PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "$PAYLOAD"
echo ""

# Check 4: Download URL in payload
echo "4️⃣ Extracting Download URL from payload..."
DOWNLOAD_URL=$(echo "$PAYLOAD" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION', 'NOT FOUND'))" 2>/dev/null)
echo "   Download URL: $DOWNLOAD_URL"
echo ""

# Check 5: Test download URL
echo "5️⃣ Testing Download URL..."
if [ "$DOWNLOAD_URL" != "NOT FOUND" ]; then
    TEST_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$DOWNLOAD_URL")
    echo "   HTTP Status: $TEST_HTTP"
    
    if [ "$TEST_HTTP" == "200" ]; then
        echo "   ✅ Download URL is accessible"
    else
        echo "   ❌ Download URL returns HTTP $TEST_HTTP"
    fi
else
    echo "   ❌ Download URL not found in payload"
fi
echo ""

# Check 6: Checksum
echo "6️⃣ Checking Checksum..."
PAYLOAD_CHECKSUM=$(echo "$PAYLOAD" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM', 'NOT FOUND'))" 2>/dev/null)
echo "   Checksum in payload: $PAYLOAD_CHECKSUM"

# Calculate actual checksum if APK is accessible locally
if [ -f "backend/public/downloads/securefinance-user.apk" ]; then
    ACTUAL_CHECKSUM=$(shasum -a 256 backend/public/downloads/securefinance-user.apk | awk '{print $1}' | xxd -r -p | base64)
    echo "   Actual APK checksum: $ACTUAL_CHECKSUM"
    
    if [ "$PAYLOAD_CHECKSUM" == "$ACTUAL_CHECKSUM" ]; then
        echo "   ✅ Checksums match"
    else
        echo "   ⚠️  Checksums DO NOT match"
        echo "   This could cause provisioning to fail!"
    fi
else
    echo "   ⚠️  Local APK not found, cannot verify checksum"
fi
echo ""

# Check 7: Network accessibility from device perspective
echo "7️⃣ Network Accessibility Test..."
echo "   Testing if Render server is reachable..."
PING_RESULT=$(curl -s -o /dev/null -w "%{time_total}" "https://emi-pro-app.onrender.com/health")
echo "   Response time: ${PING_RESULT}s"

if (( $(echo "$PING_RESULT < 5" | bc -l) )); then
    echo "   ✅ Server is responsive"
else
    echo "   ⚠️  Server is slow (may cause download timeout)"
fi
echo ""

# Summary
echo "=================================="
echo "📊 Summary"
echo "=================================="
echo ""

if [ "$HTTP_CODE" == "200" ] && [ "$TEST_HTTP" == "200" ]; then
    echo "✅ APK is accessible and downloadable"
    echo ""
    echo "If device still cannot download, check:"
    echo "1. Device has internet connection"
    echo "2. Device can reach https://emi-pro-app.onrender.com"
    echo "3. No firewall blocking APK downloads"
    echo "4. Check device logs: adb logcat | grep -i 'download\|provision'"
else
    echo "❌ APK is NOT accessible on Render"
    echo ""
    echo "Possible causes:"
    echo "1. Render deployment not complete (wait 2-3 minutes)"
    echo "2. APK not uploaded to Render"
    echo "3. File path incorrect"
    echo ""
    echo "Fix:"
    echo "1. Wait for Render deployment to complete"
    echo "2. Check Render logs: https://dashboard.render.com"
    echo "3. Verify APK exists in backend/public/downloads/"
fi
echo ""
