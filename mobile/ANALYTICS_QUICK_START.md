# Analytics & Error Monitoring - Quick Start Guide

Get up and running with analytics tracking and error monitoring in 5 minutes.

## Step 1: Install Dependencies

```bash
cd mobile
npm install
```

## Step 2: Configure Environment Variables

Update your `.env.development` file:

```bash
API_URL=http://localhost:8000/api/v1
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
APP_ENV=development
```

Get your Sentry DSN from https://sentry.io/ after creating a React Native project.

## Step 3: Run Sentry Wizard (Optional)

For full Sentry integration with source maps:

```bash
npx @sentry/wizard -i reactNative -p ios android
```

Follow the prompts and enter your Sentry organization and project names.

## Step 4: That's It! 🎉

The implementation is already complete. Everything is automatically configured:

- ✅ Error tracking with Sentry
- ✅ Performance monitoring
- ✅ Analytics event tracking
- ✅ API request monitoring
- ✅ Screen view tracking
- ✅ User feedback form

## Quick Usage Examples

### Track a Button Click

```typescript
import { analyticsService } from '@services/analytics';

const handlePress = () => {
  analyticsService.trackButtonClick('submit_button', 'AssignmentScreen');
  // Your button logic
};
```

### Track Feature Usage

```typescript
analyticsService.trackFeatureUsage('document_scanner', 'study_tools', {
  pages_scanned: 5
});
```

### Capture an Error

```typescript
import { Sentry } from '@config/sentry';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### Use Screen Tracking in a Component

```typescript
import { useScreenTracking } from '@hooks/useScreenTracking';

export const MyScreen = () => {
  useScreenTracking('MyScreen');
  
  return <View>{/* Your screen content */}</View>;
};
```

## What Gets Tracked Automatically?

1. **App Launch Time** - Measured automatically on app start
2. **Screen Views** - Every navigation change is tracked
3. **API Requests** - Request/response times and errors
4. **Errors** - All uncaught errors are sent to Sentry
5. **User Context** - Set automatically on login/logout

## View Your Data

### Sentry Dashboard
- Go to https://sentry.io/
- Select your project
- View Issues, Performance, and Releases

### Backend Analytics
- Events sent to: `POST /api/v1/analytics/track`
- Performance metrics: `POST /api/v1/analytics/performance`
- Query your database for insights

## User Feedback

Users can submit feedback through:
1. Navigate to Settings
2. Tap "Send Feedback"
3. Fill out the form
4. Submit

Feedback is sent to: `POST /api/v1/feedback`

## Testing

### Test Error Reporting

```typescript
// Add this to any screen temporarily
<Button
  title="Test Sentry"
  onPress={() => {
    throw new Error('Test error');
  }}
/>
```

### Test Analytics

```typescript
// Add this to test analytics
analyticsService.trackEvent('test_event', 'testing', {
  message: 'This is a test'
});

// Force send immediately
await analyticsService.forceFlush();
```

Check your backend logs to see the events arrive.

## Troubleshooting

### Events Not Appearing?

1. **Check DSN**: Make sure `SENTRY_DSN` is set in `.env` file
2. **Check API**: Ensure backend is running and accessible
3. **Check Network**: Look for failed requests in React Native Debugger
4. **Force Flush**: Call `analyticsService.forceFlush()` to send immediately

### Still Having Issues?

See the full documentation in `ANALYTICS_MONITORING_IMPLEMENTATION.md`

## Next Steps

1. ✅ Set up production Sentry project
2. ✅ Configure EAS Build for source maps
3. ✅ Set up Sentry alerts
4. ✅ Create analytics dashboards
5. ✅ Configure retention policies

For detailed setup instructions, see `SENTRY_SETUP.md`.
