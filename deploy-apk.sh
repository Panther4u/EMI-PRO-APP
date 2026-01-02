#!/bin/bash
# Usage: ./deploy-apk.sh <version>
# Example: ./deploy-apk.sh 2.0.5

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 2.0.5"
  exit 1
fi

PROJECT_ROOT=$(pwd)
TARGET_DIR="$PROJECT_ROOT/backend/public/downloads"
SOURCE_APK="$PROJECT_ROOT/mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk"
NEW_FILENAME="securefinance-admin-v${VERSION}.apk"

# Ensure target directory exists
mkdir -p "$TARGET_DIR"

if [ ! -f "$SOURCE_APK" ]; then
  echo "❌ Error: Source APK not found at $SOURCE_APK"
  echo "👉 Please run: cd mobile-app/android && ./gradlew assembleAdminRelease"
  exit 1
fi

echo "🚀 Deploying Admin APK v$VERSION..."

# 1. Clean old APKs
echo "🧹 Cleaning old APKs in $TARGET_DIR..."
rm -f "$TARGET_DIR"/*.apk

# 2. Copy new APK
echo "📦 Copying new APK to $NEW_FILENAME..."
cp "$SOURCE_APK" "$TARGET_DIR/$NEW_FILENAME"

# 3. Update version.json
echo "📝 Updating version.json..."
cat > "$TARGET_DIR/version.json" <<EOF
{
    "version": "$VERSION",
    "apk": "$NEW_FILENAME",
    "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "type": "admin"
}
EOF

echo "✅ Deployment Complete!"
echo "📂 Contents of downloads folder:"
ls -lh "$TARGET_DIR"
