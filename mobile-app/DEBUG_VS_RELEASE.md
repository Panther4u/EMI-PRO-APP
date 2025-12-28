# Debug vs Release Builds - Quick Reference

## 🔴 DEBUG Builds (Development Only)

### Characteristics:
- ✅ Hot reload enabled
- ✅ Developer menu accessible
- ✅ Detailed error messages
- ❌ **REQUIRES Metro bundler running**
- ❌ **CANNOT be distributed**
- ❌ Larger file size
- ❌ Slower performance

### How to run:
```bash
# Terminal 1: Start Metro
cd /Volumes/Kavi/Emi\ Pro/EMI-PRO/mobile-app
npm start

# Terminal 2: Setup port forwarding
adb reverse tcp:8081 tcp:8081

# Terminal 3: Run the app
cd android
./gradlew installAdminDebug
adb shell am start -n com.securefinance.emilock.admin/com.securefinance.emilock.MainActivity
```

### Or use Android Studio:
1. Start Metro: `npm start`
2. Run `adb reverse tcp:8081 tcp:8081`
3. Click Run (▶️) in Android Studio

### Common Error:
```
Unable to load script. Make sure you're either running Metro...
```
**Solution**: Run `adb reverse tcp:8081 tcp:8081`

---

## 🟢 RELEASE Builds (Production Ready)

### Characteristics:
- ✅ Standalone (no Metro needed)
- ✅ Can be distributed
- ✅ Optimized performance
- ✅ Smaller file size
- ✅ 16 KB page alignment
- ❌ No hot reload
- ❌ No developer menu
- ❌ Minified error messages

### How to build:
```bash
cd /Volumes/Kavi/Emi\ Pro/EMI-PRO/mobile-app/android

# Build both APKs
./gradlew assembleRelease

# Or build specific variant
./gradlew assembleAdminRelease
./gradlew assembleUserRelease
```

### Output locations:
- **Admin APK**: `app/build/outputs/apk/admin/release/app-admin-release.apk`
- **User APK**: `app/build/outputs/apk/user/release/app-user-release.apk`

### How to install:
```bash
# Via ADB
adb install app/build/outputs/apk/admin/release/app-admin-release.apk

# Or transfer to device and install manually
# No Metro required!
```

---

## 📊 Comparison Table

| Feature | Debug | Release |
|---------|-------|---------|
| Metro Required | ✅ YES | ❌ NO |
| Hot Reload | ✅ | ❌ |
| Developer Menu | ✅ | ❌ |
| File Size | ~50 MB | ~25 MB |
| Performance | Slower | Faster |
| Can Distribute | ❌ | ✅ |
| 16 KB Aligned | ❌ | ✅ |
| Google Play Ready | ❌ | ✅ |

---

## 🎯 When to Use Each

### Use DEBUG when:
- ✅ Actively developing features
- ✅ Testing UI changes with hot reload
- ✅ Debugging JavaScript errors
- ✅ Working in Android Studio

### Use RELEASE when:
- ✅ Testing final APK before deployment
- ✅ Sharing with testers
- ✅ Installing on staff phones
- ✅ QR code provisioning
- ✅ Production deployment
- ✅ Google Play submission

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T:
- Install debug APK without Metro running
- Share debug APK with non-developers
- Test production features in debug mode
- Upload debug APK to Play Store

### ✅ DO:
- Always use release builds for distribution
- Keep Metro running when using debug builds
- Run `adb reverse tcp:8081 tcp:8081` for debug
- Test final features in release mode

---

## 🔧 Quick Commands Reference

### Start Metro (for debug):
```bash
cd /Volumes/Kavi/Emi\ Pro/EMI-PRO/mobile-app
npm start
```

### Setup port forwarding (for debug):
```bash
adb reverse tcp:8081 tcp:8081
```

### Build release APKs:
```bash
cd /Volumes/Kavi/Emi\ Pro/EMI-PRO/mobile-app/android
./gradlew clean
./gradlew assembleRelease
```

### Copy to backend (for deployment):
```bash
cp app/build/outputs/apk/admin/release/app-admin-release.apk ../../backend/public/
cp app/build/outputs/apk/user/release/app-user-release.apk ../../backend/public/
```

### Update checksums:
```bash
cd /Volumes/Kavi/Emi\ Pro/EMI-PRO
openssl dgst -binary -sha256 "backend/public/app-user-release.apk" | base64 | tr '+/' '-_' | tr -d '='
```

---

## 🎓 Pro Tips

1. **Always build release before sharing**: Even for internal testing
2. **Use Android Studio for debug**: It handles Metro automatically
3. **Use terminal for release**: Faster and more reliable
4. **Test release builds**: Don't assume debug behavior = release behavior
5. **Keep Metro logs visible**: Helps catch JavaScript errors early

---

## 📱 Current Setup

### Admin APK (Staff Phones)
- **Package**: `com.securefinance.emilock.admin`
- **Purpose**: Remote control interface
- **Installation**: Normal install (no Device Owner)
- **Use**: Release build only

### User APK (Customer Phones)
- **Package**: `com.securefinance.emilock.user`
- **Purpose**: Device enforcement
- **Installation**: QR provisioning as Device Owner
- **Use**: Release build only

---

## ✅ Success Checklist

Before distributing an APK:
- [ ] Built with `assembleRelease`
- [ ] Tested without Metro running
- [ ] Verified version number
- [ ] Updated checksums (if using QR provisioning)
- [ ] Tested on real device
- [ ] No debug logs visible
- [ ] Performance is acceptable
- [ ] 16 KB alignment warning resolved

---

## 🆘 Troubleshooting

### "Unable to load script" error
- **Cause**: Debug build without Metro
- **Fix**: Run `npm start` and `adb reverse tcp:8081 tcp:8081`

### "No apps connected" in Metro
- **Cause**: Port forwarding not set up
- **Fix**: Run `adb reverse tcp:8081 tcp:8081`

### App opens then closes immediately
- **Possible causes**:
  1. Debug build without Metro (most common)
  2. Device Owner API called on non-owner device
  3. JavaScript error in initialization
- **Fix**: Check logcat and ensure using release build

### 16 KB alignment warning
- **Cause**: Debug build (expected)
- **Fix**: Use release build or ignore for development
