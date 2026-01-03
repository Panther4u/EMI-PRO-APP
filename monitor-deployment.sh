#!/bin/bash

# Monitor Render deployment status
# Run this to check when the APK is ready

echo "🔍 Monitoring Render Deployment"
echo "================================"
echo ""

URL="https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"
MAX_ATTEMPTS=20
WAIT_TIME=15

for i in $(seq 1 $MAX_ATTEMPTS); do
    echo "Attempt $i/$MAX_ATTEMPTS - Checking APK..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
    
    if [ "$HTTP_CODE" == "200" ]; then
        echo ""
        echo "✅ SUCCESS! APK is now accessible!"
        echo ""
        echo "Full response:"
        curl -I "$URL" 2>&1 | head -10
        echo ""
        echo "================================"
        echo "🎉 Deployment Complete!"
        echo "================================"
        echo ""
        echo "Next steps:"
        echo "1. Factory reset device"
        echo "2. Generate QR code from admin panel"
        echo "3. Scan QR code on device"
        echo "4. Provisioning should work!"
        echo ""
        exit 0
    else
        echo "   Status: $HTTP_CODE (waiting...)"
        if [ $i -lt $MAX_ATTEMPTS ]; then
            echo "   Waiting ${WAIT_TIME}s before next check..."
            sleep $WAIT_TIME
        fi
    fi
done

echo ""
echo "❌ APK still not accessible after $((MAX_ATTEMPTS * WAIT_TIME)) seconds"
echo ""
echo "Possible issues:"
echo "1. Render deployment failed - check dashboard"
echo "2. File too large - may need Git LFS"
echo "3. Network issue - try again later"
echo ""
echo "Check Render dashboard: https://dashboard.render.com"
