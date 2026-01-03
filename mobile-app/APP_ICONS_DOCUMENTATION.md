# App Icons Documentation

## Overview

The EMI Lock System uses **distinct app icons** for Admin and User APKs to make them easily distinguishable on devices.

## Icon Designs

### 🔵 Admin APK Icon
**Visual Design:**
- **Background:** Deep blue gradient (#1e3a8a to #3b82f6)
- **Main Symbol:** White shield with gold crown on top
- **Badge:** Red "ADMIN" badge in top-right corner
- **Meaning:** Represents authority, control, and administrative power

**Package:** `com.securefinance.emilock.admin`  
**App Name:** "EMI Admin"

### 🔴 User APK Icon
**Visual Design:**
- **Background:** Red/orange gradient (#dc2626 to #f97316)
- **Main Symbol:** White padlock (locked state) with shield background
- **Meaning:** Represents security, protection, and device lock

**Package:** `com.securefinance.emilock.user`  
**App Name:** "EMI Lock"

## Icon Sizes (Android Densities)

Both APKs include icons in all standard Android densities:

| Density | Size | Location |
|---------|------|----------|
| mdpi | 48x48 | `mipmap-mdpi/ic_launcher.png` |
| hdpi | 72x72 | `mipmap-hdpi/ic_launcher.png` |
| xhdpi | 96x96 | `mipmap-xhdpi/ic_launcher.png` |
| xxhdpi | 144x144 | `mipmap-xxhdpi/ic_launcher.png` |
| xxxhdpi | 192x192 | `mipmap-xxxhdpi/ic_launcher.png` |

Each density also includes a `ic_launcher_round.png` variant for devices that support circular icons.

## File Structure

```
mobile-app/android/app/src/
├── admin/
│   └── res/
│       ├── mipmap-mdpi/
│       ├── mipmap-hdpi/
│       ├── mipmap-xhdpi/
│       ├── mipmap-xxhdpi/
│       └── mipmap-xxxhdpi/
│           ├── ic_launcher.png
│           └── ic_launcher_round.png
│
├── user/
│   └── res/
│       ├── mipmap-mdpi/
│       ├── mipmap-hdpi/
│       ├── mipmap-xhdpi/
│       ├── mipmap-xxhdpi/
│       └── mipmap-xxxhdpi/
│           ├── ic_launcher.png
│           └── ic_launcher_round.png
│
└── main/
    └── res/
        └── mipmap-*/ (fallback icons)
```

## How It Works

Android's **product flavors** system automatically selects the correct icon:

1. When building **Admin APK** (`assembleAdminRelease`):
   - Uses icons from `src/admin/res/mipmap-*/`
   - Falls back to `src/main/res/mipmap-*/` if admin-specific icons don't exist

2. When building **User APK** (`assembleUserRelease`):
   - Uses icons from `src/user/res/mipmap-*/`
   - Falls back to `src/main/res/mipmap-*/` if user-specific icons don't exist

## Updating Icons

### Method 1: Using Generated Images

1. Generate new icon designs (512x512 PNG)
2. Run the resize script:

```bash
# For Admin icons
ADMIN_ICON="path/to/admin_icon.png"
BASE_DIR="mobile-app/android/app/src/admin/res"

sips -s format png -z 48 48 "$ADMIN_ICON" --out "$BASE_DIR/mipmap-mdpi/ic_launcher.png"
sips -s format png -z 72 72 "$ADMIN_ICON" --out "$BASE_DIR/mipmap-hdpi/ic_launcher.png"
sips -s format png -z 96 96 "$ADMIN_ICON" --out "$BASE_DIR/mipmap-xhdpi/ic_launcher.png"
sips -s format png -z 144 144 "$ADMIN_ICON" --out "$BASE_DIR/mipmap-xxhdpi/ic_launcher.png"
sips -s format png -z 192 192 "$ADMIN_ICON" --out "$BASE_DIR/mipmap-xxxhdpi/ic_launcher.png"

# Repeat for ic_launcher_round.png and user icons
```

3. Rebuild the APK:
```bash
cd mobile-app/android
./gradlew clean assembleAdminRelease
```

### Method 2: Using Android Studio

1. Right-click on `app` module → New → Image Asset
2. Select "Launcher Icons (Adaptive and Legacy)"
3. Configure icon (foreground, background)
4. Choose output directory:
   - For Admin: `src/admin/res`
   - For User: `src/user/res`
5. Generate icons

## Testing Icons

### Test on Device:
```bash
# Install and check icon
adb install backend/public/downloads/securefinance-admin-v2.1.2.apk

# Icon should appear in app drawer
# Look for blue shield with crown and "ADMIN" badge
```

### Test Both APKs:
```bash
# Install both to see the difference
adb install mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk
adb install mobile-app/android/app/build/outputs/apk/user/release/app-user-release.apk

# Both should appear with different icons:
# - "EMI Admin" (blue, crown, shield)
# - "EMI Lock" (red, padlock)
```

## Design Guidelines

### Admin Icon Should:
- ✅ Look professional and trustworthy
- ✅ Convey authority and control
- ✅ Be easily distinguishable from User icon
- ✅ Use blue color scheme (associated with business/trust)
- ✅ Include visual indicators of "admin" or "owner" status

### User Icon Should:
- ✅ Look secure and protective
- ✅ Convey lock/security functionality
- ✅ Be easily distinguishable from Admin icon
- ✅ Use red/orange color scheme (associated with security/alerts)
- ✅ Include visual indicators of "lock" or "protection"

## Version History

### v2.1.2 (Current)
- ✅ Added distinct Admin icon (blue shield with crown)
- ✅ Added distinct User icon (red padlock with shield)
- ✅ Created flavor-specific icon directories
- ✅ All densities supported (mdpi to xxxhdpi)

### Previous Versions
- Used default React Native icon for both flavors

## Troubleshooting

### Icons not showing after build:
```bash
# Clean and rebuild
cd mobile-app/android
./gradlew clean
./gradlew assembleAdminRelease
```

### Wrong icon appears:
- Check that flavor-specific icons exist in correct directory
- Verify PNG format (not JPEG)
- Ensure all densities are present

### Icon looks pixelated:
- Generate from higher resolution source (512x512 minimum)
- Use proper PNG format with transparency
- Ensure correct sizes for each density

## References

- [Android Icon Design Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_launcher)
- [Android Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Product Flavors Documentation](https://developer.android.com/build/build-variants#product-flavors)
