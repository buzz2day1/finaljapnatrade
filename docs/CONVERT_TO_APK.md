# ApnaTrade - Web to APK Conversion Guide (macOS)

This guide will help you convert the ApnaTrade web app into an Android APK file using Capacitor.

## Prerequisites

Before starting, install the following on your Mac:

### 1. Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js (if not installed)
```bash
brew install node
```

### 3. Install Java JDK (Required for Android)
```bash
brew install openjdk@17
```

Add Java to your PATH:
```bash
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 4. Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install and open Android Studio
3. Go to **Settings > Languages & Frameworks > Android SDK**
4. Install **Android SDK Platform 34** (or latest)
5. Under **SDK Tools**, install:
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator
   - Android SDK Platform-Tools

### 5. Set Android Environment Variables
Add to your `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

Reload:
```bash
source ~/.zshrc
```

---

## Step-by-Step APK Conversion

### Step 1: Clone/Export Your Project

If using Lovable, export to GitHub first:
1. Click **Export to GitHub** in Lovable
2. Clone your repository:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Install Capacitor Dependencies
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Step 4: Initialize Capacitor
```bash
npx cap init "ApnaTrade" "app.lovable.apnatrade" --web-dir dist
```

### Step 5: Configure Capacitor

Edit `capacitor.config.ts` (or create if not exists):
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.apnatrade',
  appName: 'ApnaTrade',
  webDir: 'dist',
  server: {
    // For development - connects to live preview
    // url: 'https://your-preview-url.lovable.app',
    // cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
```

### Step 6: Build the Web App
```bash
npm run build
```

### Step 7: Add Android Platform
```bash
npx cap add android
```

### Step 8: Sync Web Assets to Android
```bash
npx cap sync android
```

### Step 9: Open in Android Studio
```bash
npx cap open android
```

This opens Android Studio with your project.

---

## Building the APK

### Option A: Debug APK (For Testing)

In Android Studio:
1. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Wait for build to complete
3. Click **locate** in the notification
4. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

Or via Terminal:
```bash
cd android
./gradlew assembleDebug
```
APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Release APK (For Production)

#### 1. Generate Signing Key
```bash
keytool -genkey -v -keystore apnatrade-release-key.keystore -alias apnatrade -keyalg RSA -keysize 2048 -validity 10000
```
Remember your password!

#### 2. Create `android/key.properties`
```properties
storePassword=YOUR_PASSWORD
keyPassword=YOUR_PASSWORD
keyAlias=apnatrade
storeFile=../apnatrade-release-key.keystore
```

#### 3. Update `android/app/build.gradle`

Add before `android {`:
```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
```

Inside `android {`, add:
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}
```

Update `buildTypes.release`:
```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

#### 4. Build Release APK
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## Quick Commands Reference

```bash
# Full build process (run from project root)
npm run build && npx cap sync android

# Build debug APK
cd android && ./gradlew assembleDebug

# Build release APK
cd android && ./gradlew assembleRelease

# Clean build
cd android && ./gradlew clean

# Run on connected device/emulator
npx cap run android

# Open Android Studio
npx cap open android
```

---

## App Icon Setup

Replace these files with your app icons:
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

---

## Splash Screen Setup

1. Install splash plugin:
```bash
npm install @capacitor/splash-screen
npx cap sync
```

2. Add splash images to:
- `android/app/src/main/res/drawable/splash.png`

---

## Troubleshooting

### "SDK location not found"
Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### "JAVA_HOME not set"
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
```

### Build fails with memory error
Add to `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m
```

### App crashes on launch
- Check Logcat in Android Studio for errors
- Ensure all environment variables are set correctly in capacitor.config.ts

---

## Testing

### On Emulator
1. Open Android Studio
2. Go to **Tools > Device Manager**
3. Create a new virtual device
4. Run: `npx cap run android`

### On Physical Device
1. Enable **Developer Options** on your Android phone
2. Enable **USB Debugging**
3. Connect phone via USB
4. Run: `npx cap run android`

---

## Publishing to Play Store

1. Build release AAB (Android App Bundle):
```bash
cd android
./gradlew bundleRelease
```
AAB location: `android/app/build/outputs/bundle/release/app-release.aab`

2. Create Google Play Developer account ($25 one-time fee)
3. Upload AAB to Google Play Console
4. Fill in store listing details
5. Submit for review

---

## Hot Reload During Development

For live development, update `capacitor.config.ts`:
```typescript
server: {
  url: 'https://your-preview-url.lovable.app?forceHideBadge=true',
  cleartext: true
}
```

Then sync and run:
```bash
npx cap sync android
npx cap run android
```

This connects the app to your live Lovable preview!
