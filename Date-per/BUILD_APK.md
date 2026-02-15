# Build APK for Loopr

## Prerequisites
1. Install EAS CLI globally:
```bash
npm install -g eas-cli
```

2. Login to Expo account:
```bash
eas login
```

## Build APK

### Option 1: Build APK (Preview Build)
```bash
cd /Users/nikhil.patil/Documents/Date-per/Date-per
eas build --platform android --profile preview
```

This will:
- Build an APK file (not AAB)
- Can be installed directly on Android devices
- Download link will be provided after build completes

### Option 2: Local Build (if you have Android Studio)
```bash
npx expo run:android --variant release
```

## Download APK
After the build completes:
1. EAS will provide a download link
2. Download the APK file
3. Transfer to your Android device
4. Install the APK (enable "Install from Unknown Sources" if needed)

## Build Status
Check build status at: https://expo.dev/accounts/[your-account]/projects/loopr/builds

## Notes
- First build may take 15-20 minutes
- APK size will be around 50-80 MB
- The app name will appear as "Loopr" on the device
