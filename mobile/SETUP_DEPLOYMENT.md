# Deployment Setup Guide

Step-by-step guide to set up the deployment pipeline from scratch.

## Prerequisites

Before you begin, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Git installed and configured
- [ ] macOS (for iOS builds, or use EAS Build)
- [ ] Xcode installed (if building iOS locally)
- [ ] Android Studio installed (if building Android locally)
- [ ] Accounts created (see below)

## Required Accounts

### 1. Expo Account
1. Sign up at https://expo.dev/signup
2. Create an organization (if needed)
3. Note your username/organization slug

### 2. Apple Developer Account
1. Enroll at https://developer.apple.com/programs/
2. Cost: $99/year
3. Complete enrollment process (can take 24-48 hours)
4. Note your Team ID

### 3. Google Play Console
1. Sign up at https://play.google.com/console/signup
2. One-time fee: $25
3. Complete registration
4. Create a new app listing

### 4. Sentry Account
1. Sign up at https://sentry.io/signup/
2. Create an organization
3. Create a project for mobile app
4. Note your DSN and organization/project names

### 5. Firebase Account (Optional but Recommended)
1. Sign up at https://console.firebase.google.com/
2. Create a new project
3. Add iOS and Android apps
4. Download configuration files

### 6. Amplitude Account (Optional)
1. Sign up at https://amplitude.com/
2. Create a new project
3. Note your API key

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd mobile
npm install
```

### Step 2: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 3: Login to Expo

```bash
eas login
```

Enter your Expo credentials.

### Step 4: Initialize EAS

```bash
eas init
```

This will:
- Create `eas.json` (already exists)
- Link your project to Expo
- Generate a project ID

Update `app.json` with the project ID:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID_HERE"
      }
    }
  }
}
```

### Step 5: Configure Environment Variables

Create environment files:

```bash
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production
```

Edit each file with appropriate values:

**`.env.development`:**
```env
APP_ENV=development
EXPO_PROJECT_ID=your-project-id
API_URL=http://localhost:8000
# Leave analytics/monitoring empty for dev
```

**`.env.staging`:**
```env
APP_ENV=staging
EXPO_PROJECT_ID=your-project-id
API_URL=https://staging-api.eduplatform.com
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project-staging
AMPLITUDE_API_KEY=your-amplitude-key
# Add other staging configs
```

**`.env.production`:**
```env
APP_ENV=production
EXPO_PROJECT_ID=your-project-id
API_URL=https://api.eduplatform.com
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token
AMPLITUDE_API_KEY=your-amplitude-key
# Add other production configs
```

### Step 6: Setup iOS Code Signing

#### Option A: Let EAS Manage (Recommended)

```bash
eas credentials --platform ios
```

Select:
1. "Set up a new iOS App Store distribution certificate"
2. "Set up a new push notification key"
3. "Set up a new provisioning profile"

EAS will handle everything automatically.

#### Option B: Use Existing Certificates

If you have existing certificates:
1. Export from Xcode or Keychain Access
2. Run `eas credentials --platform ios`
3. Select "Use existing credentials"
4. Upload your certificate and provisioning profile

### Step 7: Setup Android Keystore

#### Option A: Let EAS Generate (Recommended)

```bash
eas credentials --platform android
```

Select "Generate new keystore"

EAS will generate and store your keystore securely.

#### Option B: Use Existing Keystore

If you have an existing keystore:
1. Run `eas credentials --platform android`
2. Select "Upload existing keystore"
3. Provide keystore file and credentials

### Step 8: Configure Firebase

#### iOS
1. Go to Firebase Console
2. Add iOS app with bundle ID: `com.yourcompany.eduplatform`
3. Download `GoogleService-Info.plist`
4. Rename to `GoogleService-Info-prod.plist` (or dev/staging)
5. Place in mobile root directory

#### Android
1. Go to Firebase Console
2. Add Android app with package name: `com.yourcompany.eduplatform`
3. Download `google-services.json`
4. Rename to `google-services-prod.json` (or dev/staging)
5. Place in mobile root directory

### Step 9: Setup Sentry

1. Login to Sentry
2. Create project (React Native)
3. Get DSN from project settings
4. Get auth token from Settings → Account → API → Auth Tokens

Create `.sentryclirc` in mobile root:
```ini
[auth]
token=YOUR_SENTRY_AUTH_TOKEN

[defaults]
url=https://sentry.io/
org=your-organization
project=your-project
```

**Important:** This file is gitignored. Never commit it.

### Step 10: Setup Google Play Service Account

For automated Android submissions:

1. Go to Google Cloud Console
2. Enable Google Play Android Developer API
3. Create service account
4. Download JSON key
5. Save as `service-account-key.json` in mobile root
6. Go to Google Play Console → Settings → API access
7. Grant permissions to the service account

### Step 11: Setup App Store Connect API Key

For automated iOS submissions:

1. Go to App Store Connect
2. Users and Access → Keys → Generate API Key
3. Download key (.p8 file)
4. Note Key ID and Issuer ID
5. Configure in eas.json:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-asc-app-id",
        "appleTeamId": "your-team-id",
        "appleApiKey": {
          "path": "./AuthKey_XXXXXXXX.p8",
          "keyId": "XXXXXXXXXX",
          "issuerId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        }
      }
    }
  }
}
```

### Step 12: Configure GitHub Actions (Optional)

Add secrets to GitHub repository:

1. Go to Repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `EXPO_TOKEN` - Get from: `eas whoami` → Settings → Access Tokens
   - `SENTRY_AUTH_TOKEN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SLACK_WEBHOOK_URL` (optional, for notifications)

### Step 13: Test Your Setup

Run validation:
```bash
node scripts/validate-deployment.js
```

Fix any issues reported.

### Step 14: Build Preview Versions

Test the build system:

```bash
# iOS
npm run build:preview:ios

# Android
npm run build:preview:android

# Both
npm run build:preview:all
```

Wait for builds to complete (15-30 minutes).

### Step 15: Test Builds

1. Download builds from EAS dashboard
2. Install on test devices
3. Test all major functionality
4. Verify crash reporting works (cause a test crash)
5. Verify analytics tracking (check dashboard)

### Step 16: Create Production Builds

Once preview builds are working:

```bash
npm run build:prod:all
```

### Step 17: Submit to Stores

#### iOS (TestFlight First)
```bash
npm run submit:beta:ios
```

Wait for processing, then test on TestFlight.

#### Android (Internal Testing First)
```bash
npm run submit:alpha:android
```

Test the internal release.

#### Production Submission
After testing:
```bash
npm run submit:ios
npm run submit:android
```

### Step 18: Setup OTA Updates

Generate code signing certificate:
```bash
mkdir -p certificates
openssl genrsa -out certificates/code-signing.pem 2048
```

Update `app.config.js` to reference it (already configured).

Test OTA update:
```bash
npm run update:preview -- "Test update"
```

## Verification Checklist

After setup, verify:

- [ ] Builds complete successfully
- [ ] Crash reporting works (test crash appears in Sentry)
- [ ] Analytics tracking works (events appear in Firebase/Amplitude)
- [ ] Push notifications work
- [ ] OTA updates work
- [ ] Deep linking works
- [ ] All environment variables are set
- [ ] CI/CD pipeline runs (if configured)

## Common Issues

### Build Fails with Certificate Error

**Solution:**
```bash
eas credentials --clear-cache
eas credentials --platform ios
```

### Android Build Fails with Keystore Error

**Solution:**
```bash
eas credentials --platform android
# Re-enter keystore details
```

### OTA Update Not Appearing

**Solution:**
1. Check channel configuration in app.config.js
2. Verify expo-updates is installed
3. Check update ID: `eas update:list`
4. Force check in app: `otaUpdateService.forceUpdate()`

### Sentry Not Receiving Events

**Solution:**
1. Verify DSN is correct
2. Check environment (dev mode disabled by default)
3. Test manually: `crashReporting.captureMessage('Test')`
4. Check internet connection
5. Verify Sentry project settings

## Next Steps

After successful setup:

1. Read [DEPLOYMENT.md](./DEPLOYMENT.md) for release procedures
2. Review [.github/DEPLOYMENT_CHECKLIST.md](./.github/DEPLOYMENT_CHECKLIST.md)
3. Set up monitoring dashboards
4. Configure alerts in Sentry
5. Plan your release schedule
6. Train team on deployment process

## Support

If you encounter issues:

1. Check EAS Build logs in dashboard
2. Review Expo documentation: https://docs.expo.dev/
3. Check GitHub issues
4. Contact DevOps team

## Security Reminders

- Never commit credentials to git
- Use environment variables for sensitive data
- Rotate credentials regularly
- Use separate credentials for dev/staging/prod
- Enable 2FA on all accounts
- Restrict access to production credentials

---

**Setup Complete! 🎉**

You're now ready to deploy your mobile app to production.
