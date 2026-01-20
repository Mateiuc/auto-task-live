# Opening Auto Task Tracker in Android Studio - Complete Guide

This guide provides step-by-step instructions for opening and running the Auto Task Tracker project in Android Studio as a native Android application.

## Prerequisites

Before you begin, ensure you have the following installed on your computer:

### 1. Android Studio
- Download from: https://developer.android.com/studio
- Version: Arctic Fox (2020.3.1) or newer recommended
- During installation, make sure to install:
  - Android SDK
  - Android SDK Platform
  - Android Virtual Device (AVD)

### 2. Java Development Kit (JDK)
- JDK 11 or newer required
- Android Studio usually includes JDK, but you can verify by running:
  ```bash
  java -version
  ```

### 3. Node.js and npm
- Version: Node.js 16 or newer
- Verify installation:
  ```bash
  node -v
  npm -v
  ```

### 4. Git
- Required to clone the repository
- Download from: https://git-scm.com/

## Step-by-Step Setup

### Step 1: Export Project to GitHub

1. In Lovable editor, click the **"GitHub"** button in the top right
2. Click **"Connect to GitHub"** if not already connected
3. Click **"Create Repository"** or **"Push to GitHub"** if repository exists
4. Wait for the code to sync to GitHub

### Step 2: Clone Repository to Your Computer

Open terminal/command prompt and run:

```bash
# Navigate to where you want the project
cd ~/Documents/Projects

# Clone your repository
git clone https://github.com/YOUR_USERNAME/auto-task.git

# Navigate into the project
cd auto-task
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install all Node.js dependencies including React, Vite, and other libraries.

### Step 4: Install Capacitor Dependencies

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Step 5: Verify Capacitor Configuration

Check that `capacitor.config.ts` exists in the project root. It should look like this:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.70729249c2c7444997db39afcc82cf8d',
  appName: 'auto-task',
  webDir: 'dist',
  server: {
    url: 'https://70729249-c2c7-4449-97db-39afcc82cf8d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
```

### Step 6: Build the Web Application

```bash
npm run build
```

This creates the production build in the `dist` folder that will be used by the mobile app.

### Step 7: Add Android Platform

```bash
npx cap add android
```

This command:
- Creates an `android` folder in your project
- Sets up the native Android project structure
- Copies web assets to the Android project
- Configures Capacitor for Android

**Note:** If you see an error about the android folder already existing, you can skip this step.

### Step 7b: Add Required Permissions to AndroidManifest.xml

**IMPORTANT:** After adding the Android platform, you must manually add permissions to enable contacts, camera, storage, and notifications.

1. Open `android/app/src/main/AndroidManifest.xml`
2. Add these permissions **inside** the `<manifest>` tag, **before** the `<application>` tag:

```xml
<!-- Contacts permissions (required for phone contacts integration) -->
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.WRITE_CONTACTS" />

<!-- Camera permission (required for VIN scanning) -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Storage permissions for backup/restore on Android 9 and below -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />

<!-- Notification permissions -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />

<!-- Internet (usually already present) -->
<uses-permission android:name="android.permission.INTERNET" />
```

**Your AndroidManifest.xml should look like:**
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- All permissions go here -->
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.WRITE_CONTACTS" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application ...>
        <!-- Application content -->
    </application>
</manifest>
```

**Note:** Without these permissions, the app will fail silently when trying to access contacts, camera, or storage. After adding permissions, you must uninstall the old app and reinstall for changes to take effect.

### Step 8: Sync Project to Android

```bash
npx cap sync android
```

This command:
- Copies the latest web build to Android
- Updates native dependencies
- Syncs Capacitor plugins

**Important:** Run this command every time you:
- Pull new changes from GitHub
- Make changes to web code and rebuild
- Add or update Capacitor plugins

### Step 9: Open in Android Studio

You have two options:

#### Option A: Using Command Line (Recommended)
```bash
npx cap open android
```

This automatically opens the Android project in Android Studio.

#### Option B: Manually
1. Open Android Studio
2. Click **"Open an Existing Project"**
3. Navigate to your project folder
4. Select the `android` folder (NOT the root project folder)
5. Click **"Open"**

### Step 10: Wait for Gradle Sync

When Android Studio opens the project:
1. It will automatically start syncing Gradle
2. You'll see a progress bar at the bottom: "Gradle Build Running..."
3. This may take 5-10 minutes the first time
4. Wait for it to complete before proceeding

**Common Gradle Issues:**
- If sync fails, click **"File" → "Sync Project with Gradle Files"**
- If you see SDK errors, go to **"Tools" → "SDK Manager"** and install recommended SDK versions

## Running the App

### Option 1: Run on Emulator (Virtual Device)

#### Create an Emulator (if you don't have one):

1. In Android Studio, click **"Tools" → "Device Manager"**
2. Click **"Create Device"**
3. Select a device (e.g., Pixel 5)
4. Click **"Next"**
5. Select a system image (e.g., API 33 - Android 13)
   - If not downloaded, click **"Download"** next to the system image
6. Click **"Next"**, then **"Finish"**

#### Run the App:

1. In the toolbar, select your emulator from the device dropdown
2. Click the green **"Run"** button (▶️) or press **Shift + F10**
3. Wait for the emulator to boot (first time may take 2-3 minutes)
4. The app will install and launch automatically

### Option 2: Run on Physical Device

#### Enable Developer Mode on Your Android Phone:

1. Go to **Settings** → **About Phone**
2. Tap **"Build Number"** 7 times
3. You'll see "You are now a developer!"
4. Go back to **Settings** → **System** → **Developer Options**
5. Enable **"USB Debugging"**

#### Connect and Run:

1. Connect your phone to computer via USB cable
2. On your phone, allow USB debugging when prompted
3. In Android Studio, select your device from the dropdown
4. Click the green **"Run"** button (▶️)
5. The app will install on your phone and launch

## Development Workflow

### Making Changes to the App

#### For Web Code Changes (React/TypeScript):

1. Make changes in Lovable or your local IDE
2. If using Lovable, push changes to GitHub and pull locally:
   ```bash
   git pull origin main
   ```

3. Rebuild the web app:
   ```bash
   npm run build
   ```

4. Sync to Android:
   ```bash
   npx cap sync android
   ```

5. In Android Studio, click **"Run"** again

#### For Android-Specific Changes:

1. Make changes directly in Android Studio
2. Click **"Run"** to test changes
3. Changes are automatically saved in the `android` folder

### Live Reload During Development

For faster development, you can use the hot reload feature:

1. Make sure the `capacitor.config.ts` has the server URL configured
2. Your phone/emulator must be on the same network as your computer
3. The app will load content from the Lovable sandbox URL
4. Changes in Lovable will reflect immediately without rebuilding

**To disable live reload and use local build:**
1. Open `capacitor.config.ts`
2. Remove or comment out the `server` section
3. Run `npx cap sync android`
4. Rebuild and run in Android Studio

## Project Structure

```
auto-task/
├── android/                    # Android native project (managed by Capacitor)
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── AndroidManifest.xml
│   │   │       ├── java/        # Java/Kotlin code
│   │   │       └── res/         # Android resources (icons, etc.)
│   │   └── build.gradle
│   ├── gradle/
│   └── build.gradle
├── src/                        # React web app source code
├── dist/                       # Built web app (copied to Android)
├── capacitor.config.ts         # Capacitor configuration
└── package.json
```

## Troubleshooting

### Problem: "SDK location not found"

**Solution:**
1. In Android Studio, go to **"File" → "Project Structure"**
2. Under SDK Location, set the Android SDK path
3. Typical paths:
   - Mac: `/Users/[username]/Library/Android/sdk`
   - Windows: `C:\Users\[username]\AppData\Local\Android\Sdk`
   - Linux: `/home/[username]/Android/Sdk`

### Problem: "Gradle sync failed"

**Solution:**
1. Click **"File" → "Invalidate Caches / Restart"**
2. Try **"File" → "Sync Project with Gradle Files"**
3. Check your internet connection (Gradle downloads dependencies)
4. Update Gradle: **"File" → "Project Structure" → "Project"** → Update Gradle version

### Problem: "App not installing on device"

**Solution:**
1. Check USB debugging is enabled on device
2. Try revoking USB debugging authorization on phone and reconnecting
3. Run `adb devices` in terminal to verify device is connected
4. Try **"Build" → "Clean Project"** then **"Build" → "Rebuild Project"**

### Problem: "White screen when app launches"

**Solution:**
1. Ensure you ran `npm run build` before `npx cap sync`
2. Check `dist` folder exists and contains files
3. Verify `capacitor.config.ts` has correct `webDir: 'dist'`
4. Clear app data on device/emulator and reinstall

### Problem: "Cannot find module '@capacitor/core'"

**Solution:**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap sync android
```

### Problem: "Java version error"

**Solution:**
1. Check Java version: `java -version`
2. Android Studio preferences → Build Tools → Gradle → Gradle JDK
3. Select JDK 11 or newer
4. Click Apply

### Problem: Changes not reflecting in app

**Solution:**
1. Rebuild: `npm run build`
2. Sync: `npx cap sync android`
3. In Android Studio: **"Build" → "Clean Project"**
4. Run app again

## Building Release APK

To create a production APK for distribution:

### 1. Disable Live Reload

Edit `capacitor.config.ts` and remove the `server` section:

```typescript
const config: CapacitorConfig = {
  appId: 'app.lovable.70729249c2c7444997db39afcc82cf8d',
  appName: 'auto-task',
  webDir: 'dist',
  // Remove server section for production
};
```

### 2. Build Production Web App

```bash
npm run build
npx cap sync android
```

### 3. Generate Signing Key (First Time Only)

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Answer the prompts and remember your passwords!

### 4. Configure Signing in Android Studio

1. In Android Studio, go to **"Build" → "Generate Signed Bundle / APK"**
2. Select **"APK"**
3. Click **"Next"**
4. Select your keystore file
5. Enter keystore password and key password
6. Click **"Next"**
7. Select **"release"** build variant
8. Click **"Finish"**

### 5. Find Your APK

The signed APK will be at:
```
android/app/release/app-release.apk
```

You can now distribute this APK or upload to Google Play Store.

## Useful Commands Reference

```bash
# Install dependencies
npm install

# Build web app
npm run build

# Add Android platform (first time only)
npx cap add android

# Sync web code to Android
npx cap sync android

# Update Android platform
npx cap update android

# Open in Android Studio
npx cap open android

# Run on Android (with device/emulator connected)
npx cap run android

# Check connected devices
adb devices

# View Android logs
adb logcat
```

## Additional Resources

- **Capacitor Documentation**: https://capacitorjs.com/docs
- **Android Developer Docs**: https://developer.android.com/docs
- **Capacitor Android Guide**: https://capacitorjs.com/docs/android
- **Android Studio User Guide**: https://developer.android.com/studio/intro

## Getting Help

If you encounter issues:

1. Check the **"Build"** tab in Android Studio for detailed error messages
2. Check **"Logcat"** tab for runtime errors
3. Search error messages on Stack Overflow
4. Visit Capacitor Community Forum: https://forum.ionicframework.com/c/capacitor
5. Check project issues on GitHub

## Next Steps

After successfully running in Android Studio:

1. **Customize App Icon**: Replace icons in `android/app/src/main/res/mipmap-*/`
2. **Update App Name**: Edit `android/app/src/main/res/values/strings.xml`
3. **Add Permissions**: Edit `android/app/src/main/AndroidManifest.xml`
4. **Add Plugins**: Install Capacitor plugins for camera, storage, etc.
5. **Prepare for Store**: Follow Google Play Console guidelines

---

**Important Note**: Always run `npm run build` followed by `npx cap sync android` after making changes to your web code. This ensures the latest version is deployed to the Android app.
