# Sentry Setup Guide for EDU Mobile

This guide will help you set up Sentry for crash reporting and error monitoring in the mobile app.

## Prerequisites

- Sentry account (sign up at https://sentry.io/)
- EAS CLI installed (`npm install -g eas-cli`)
- Project configured in EAS

## Step 1: Install Sentry SDK

The Sentry packages are already added to `package.json`. Install them:

```bash
cd mobile
npm install
```

## Step 2: Run Sentry Wizard

Run the Sentry wizard to configure your project:

```bash
npx @sentry/wizard -i reactNative -p ios android
```

This wizard will:
- Link your project to Sentry
- Configure source maps upload
- Add necessary build scripts
- Set up auto-instrumentation

## Step 3: Configure DSNs

### Get Your DSN from Sentry

1. Log in to your Sentry account
2. Create a new project for React Native
3. Copy the DSN from Settings > Client Keys (DSN)

### Add DSNs to Environment Files

Update the following files with your Sentry DSNs:

**`.env.development`**
```
SENTRY_DSN=https://your-dev-sentry-dsn@sentry.io/your-project-id
```

**`.env.staging`**
```
SENTRY_DSN=https://your-staging-sentry-dsn@sentry.io/your-project-id
```

**`.env.production`**
```
SENTRY_DSN=https://your-prod-sentry-dsn@sentry.io/your-project-id
```

## Step 4: Configure Sentry in app.config.js

The configuration is already set up in `app.config.js`. Update the organization and project names:

```javascript
hooks: {
  postPublish: [
    {
      file: 'sentry-expo/upload-sourcemaps',
      config: {
        organization: 'your-sentry-org',  // Update this
        project: 'edu-mobile',             // Update this
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    },
  ],
}
```

## Step 5: Set Up Auth Token

### Create Sentry Auth Token

1. Go to Sentry > Settings > Account > API > Auth Tokens
2. Create a new token with the following permissions:
   - `project:read`
   - `project:releases`
   - `org:read`
3. Copy the token

### Add Token to Environment

For local development:
```bash
export SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

For EAS Build, add it as a secret:
```bash
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value your-sentry-auth-token
```

## Step 6: Update app.json

The Sentry plugin is already configured in `app.json`:

```json
{
  "plugins": [
    [
      "sentry-expo",
      {
        "organization": "your-sentry-org",
        "project": "edu-mobile"
      }
    ]
  ]
}
```

Update the organization and project names to match your Sentry settings.

## Step 7: Build with Source Maps

### Development Build
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build with Source Maps
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

Source maps will be automatically uploaded to Sentry during the build process.

## Step 8: Test Error Tracking

To test if Sentry is working:

```javascript
import { Sentry } from '@config/sentry';

// Test error capture
Sentry.captureException(new Error('Test error'));

// Test message
Sentry.captureMessage('Test message', 'info');
```

## Monitoring Features

The app is configured with:

1. **Error Boundary**: Catches React errors and reports to Sentry
2. **API Monitoring**: Tracks API requests and responses
3. **Performance Monitoring**: Tracks app launch, screen renders, and API response times
4. **User Context**: Automatically sets user info when logged in
5. **Breadcrumbs**: Records navigation and user actions
6. **Screenshots**: Attaches screenshots on crashes (iOS)
7. **View Hierarchy**: Attaches view hierarchy on crashes

## Analytics Integration

The app also tracks custom analytics:

- **Screen Views**: Automatically tracked on navigation
- **Button Clicks**: Track user interactions
- **Assignment Submissions**: Academic activity tracking
- **Login/Logout**: Authentication events
- **Feature Usage**: Custom feature tracking

## Debugging

### Check if Sentry is Initialized

```javascript
import { Sentry } from '@config/sentry';

// Sentry is initialized in App.tsx
console.log('Sentry Hub:', Sentry.getCurrentHub());
```

### View Events in Sentry

1. Go to your Sentry dashboard
2. Navigate to Issues to see errors
3. Navigate to Performance to see transactions
4. Navigate to Releases to see source maps

## Best Practices

1. **Use Different DSNs for Each Environment**: Keep development, staging, and production separate
2. **Set Sample Rates**: Adjust `tracesSampleRate` based on environment
3. **Filter Sensitive Data**: The `beforeSend` hook filters console logs in production
4. **Tag Releases**: EAS automatically tags builds with version numbers
5. **Monitor Performance**: Set performance budgets and alerts in Sentry

## Troubleshooting

### Source Maps Not Uploading

1. Check that `SENTRY_AUTH_TOKEN` is set correctly
2. Verify organization and project names match Sentry
3. Check EAS build logs for upload errors
4. Ensure the auth token has correct permissions

### Events Not Appearing

1. Verify DSN is correct in environment files
2. Check internet connectivity
3. Look for initialization errors in logs
4. Test with `Sentry.captureMessage('test')`

### Performance Issues

1. Reduce `tracesSampleRate` in production
2. Disable screenshots if needed: `attachScreenshot: false`
3. Filter unnecessary breadcrumbs in `beforeBreadcrumb`

## Resources

- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Sentry Expo Integration](https://docs.expo.dev/guides/using-sentry/)
- [EAS Build Configuration](https://docs.expo.dev/build/introduction/)
