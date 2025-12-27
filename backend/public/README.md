# APK Downloads Folder

This folder contains the APK files that users can download to install the EMI Pro app on their devices.

## Files

- `app-user.apk` - User APK (Present ✅)
- `app-admin.apk` - Admin APK (Present ✅)

## Download URLs

When deployed to Render:
- User APK: `https://emi-pro.onrender.com/downloads/app-user.apk`
- Admin APK: `https://emi-pro.onrender.com/downloads/app-admin.apk`

## How to Update APKs

1. Build the APKs from the mobile-app directory:
   ```bash
   cd mobile-app/android
   ./gradlew assembleUserRelease
   ./gradlew assembleAdminRelease
   ```

2. Copy the built APKs to this folder:
   ```bash
   cp mobile-app/android/app/build/outputs/apk/user/release/app-user-release.apk \
      backend/public/app-user.apk
   
   cp mobile-app/android/app/build/outputs/apk/admin/release/app-admin-release.apk \
      backend/public/app-admin.apk
   ```

3. Commit and push to deploy:
   ```bash
   git add backend/public/
   git commit -m "Update APK files"
   git push origin main
   ```

## Note

APK files are typically large (10-50 MB) and should be added to `.gitignore` if you don't want to commit them to the repository. Instead, you can:

1. Upload them directly to Render via SFTP/SSH
2. Store them in cloud storage (S3, Google Cloud Storage) and serve from there
3. Build them as part of the CI/CD pipeline

For now, you can commit them to the repository for simplicity.
