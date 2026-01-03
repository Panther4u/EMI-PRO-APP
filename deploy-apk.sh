#!/bin/bash

# 🚀 Deploy APK to Render
# This script commits and pushes the User APK to Render

set -e  # Exit on error

echo "🚀 Deploying User APK to Render"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if APK exists
if [ ! -f "backend/public/downloads/securefinance-user.apk" ]; then
    echo -e "${RED}❌ APK not found at backend/public/downloads/securefinance-user.apk${NC}"
    echo "   Build it first: cd mobile-app/android && ./gradlew assembleUserRelease"
    exit 1
fi

echo -e "${GREEN}✅ APK found${NC}"
APK_SIZE=$(ls -lh backend/public/downloads/securefinance-user.apk | awk '{print $5}')
echo "   Size: $APK_SIZE"
echo ""

# Calculate checksum
echo "🔐 Calculating checksum..."
CHECKSUM=$(shasum -a 256 backend/public/downloads/securefinance-user.apk | awk '{print $1}' | xxd -r -p | base64)
echo -e "${GREEN}✅ Checksum: $CHECKSUM${NC}"
echo ""

# Check if git is clean
echo "🔍 Checking git status..."
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    git status -s
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Add files
echo "📦 Adding files to git..."
git add backend/public/downloads/securefinance-user.apk
git add backend/public/downloads/version.json
git add .gitignore
echo -e "${GREEN}✅ Files staged${NC}"
echo ""

# Show what will be committed
echo "📋 Files to be committed:"
git status -s
echo ""

# Commit
echo "💾 Committing..."
COMMIT_MSG="Deploy User APK v2.0.4 for device provisioning

- Added securefinance-user.apk (${APK_SIZE})
- Checksum: ${CHECKSUM}
- Updated .gitignore to allow production APKs
- Ready for QR code provisioning"

git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✅ Committed${NC}"
echo ""

# Push
echo "🚀 Pushing to Render..."
echo -e "${YELLOW}⚠️  This may take a while (APK is ${APK_SIZE})${NC}"
echo ""

if git push origin main; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to Render!${NC}"
    echo ""
    echo "================================"
    echo "📊 Next Steps"
    echo "================================"
    echo ""
    echo "1. ⏳ Wait for Render to deploy (2-3 minutes)"
    echo "   Check: https://dashboard.render.com"
    echo ""
    echo "2. ✅ Verify APK is accessible:"
    echo "   curl -I https://emi-pro-app.onrender.com/downloads/securefinance-user.apk"
    echo ""
    echo "3. 🎯 Test provisioning:"
    echo "   - Factory reset device"
    echo "   - Generate QR code from admin panel"
    echo "   - Scan QR code"
    echo "   - Device should download and install APK"
    echo ""
    echo "4. 🎉 Success!"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Push failed!${NC}"
    echo ""
    echo "Possible reasons:"
    echo "1. File too large for git (>100MB)"
    echo "   Solution: Use Git LFS"
    echo ""
    echo "2. Network issue"
    echo "   Solution: Try again"
    echo ""
    echo "3. Authentication issue"
    echo "   Solution: Check git credentials"
    echo ""
    echo "See DEPLOY_APK_TO_RENDER.md for alternative deployment methods"
    exit 1
fi
