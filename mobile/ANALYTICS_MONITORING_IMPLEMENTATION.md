# Analytics Tracking and Error Monitoring Implementation

This document describes the complete implementation of analytics tracking and error monitoring for the EDU Mobile app.

## Overview

The implementation includes:
- **Sentry Integration**: Error tracking, crash reporting, and performance monitoring
- **Custom Analytics Service**: Track user behavior, feature usage, and engagement
- **Error Boundaries**: Graceful error handling with user-friendly screens
- **Performance Tracking**: Monitor app launch, screen renders, and API response times
- **User Feedback**: In-app feedback form integrated with backend API

## Architecture

### Components

```
mobile/
├── src/
│   ├── config/
│   │   └── sentry.ts                  # Sentry configuration and initialization
│   ├── services/
│   │   └── analytics.ts               # Analytics service with event tracking
│   ├── components/
│   │   └── ErrorBoundary.tsx          # React error boundary component
│   ├── screens/
│   │   └── shared/
│   │       ├── FeedbackScreen.tsx     # User feedback form
│   │       └── SettingsScreen.tsx     # Updated with feedback link
│   ├── hooks/
│   │   └── useScreenTracking.ts       # Screen tracking hook
│   └── navigation/
│       └── NavigationContainer.tsx     # Navigation tracking wrapper
├── app.config.js                      # Sentry source maps configuration
├── eas.json                           # EAS build with source maps
└── SENTRY_SETUP.md                    # Setup instructions
```

## Features Implemented

### 1. Sentry Error Monitoring

**Location**: `mobile/src/config/sentry.ts`

Features:
- Environment-specific DSN configuration
- Performance monitoring with React Navigation instrumentation
- Automatic session tracking
- Screenshot and view hierarchy capture on crashes
- Custom breadcrumbs for debugging
- User context tracking
- Development vs. production filtering

**Usage**:
```typescript
import { Sentry, setSentryUser, clearSentryUser } from '@config/sentry';

// Initialize (done automatically in App.tsx)
initializeSentry();

// Set user context
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.username
});

// Capture error
Sentry.captureException(error);

// Capture message
Sentry.captureMessage('Something happened', 'info');
```

### 2. Analytics Service

**Location**: `mobile/src/services/analytics.ts`

Features:
- Event batching and queuing
- Auto-flush every 30 seconds or when queue reaches 50 events
- Performance metrics tracking
- Session management
- Device and platform metadata

**Tracked Events**:

1. **Screen Views**: Automatically tracked on navigation
```typescript
analyticsService.trackScreenView('HomeScreen', 'LoginScreen');
```

2. **Button Clicks**: Track user interactions
```typescript
analyticsService.trackButtonClick('submit_button', 'AssignmentScreen');
```

3. **Assignment Submissions**: Academic activity
```typescript
analyticsService.trackAssignmentSubmission(
  'assignment-123',
  'Math Homework',
  'file_upload'
);
```

4. **Authentication**: Login/logout tracking
```typescript
analyticsService.trackLogin('email', true);
analyticsService.trackLogout();
```

5. **Feature Usage**: Custom features
```typescript
analyticsService.trackFeatureUsage(
  'document_scanner',
  'study_tools',
  { pages_scanned: 5 }
);
```

6. **Search**: Search queries and results
```typescript
analyticsService.trackSearch('calculus', 'assignments', 10);
```

**Performance Metrics**:

1. **App Launch Time**
```typescript
analyticsService.trackAppLaunchTime();
```

2. **Screen Render Time**
```typescript
analyticsService.startScreenRender('HomeScreen');
// ... render logic ...
analyticsService.endScreenRender('HomeScreen');
```

3. **API Response Time** (automatic via interceptor)

### 3. Error Boundary

**Location**: `mobile/src/components/ErrorBoundary.tsx`

Features:
- Catches React component errors
- Reports to Sentry with component stack
- User-friendly error screen
- Retry functionality
- Development mode error details
- Automatic error tracking to analytics

**Usage**:
```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Custom fallback:
```typescript
<ErrorBoundary
  fallback={(error, resetError) => (
    <CustomErrorScreen error={error} onRetry={resetError} />
  )}
>
  <Component />
</ErrorBoundary>
```

### 4. API Performance Tracking

**Location**: `mobile/src/api/client.ts`

Features:
- Automatic request/response timing
- Request ID generation
- Error capture and reporting
- Sentry breadcrumbs for API calls
- Performance metrics sent to analytics

All API requests are automatically tracked:
```typescript
// Automatic tracking
const response = await apiClient.get('/assignments');

// Metrics sent:
// - Request ID
// - Endpoint
// - Method
// - Response time
// - Status code
// - Success/failure
```

### 5. Navigation Tracking

**Location**: `mobile/src/navigation/NavigationContainer.tsx`

Features:
- Automatic screen view tracking
- Previous screen tracking
- Sentry breadcrumbs for navigation
- Screen-to-screen flow analysis

### 6. Screen Tracking Hook

**Location**: `mobile/src/hooks/useScreenTracking.ts`

Usage in screens:
```typescript
import { useScreenTracking } from '@hooks/useScreenTracking';

export const MyScreen = () => {
  useScreenTracking('MyScreen');
  
  return <View>...</View>;
};
```

### 7. User Feedback System

**Location**: `mobile/src/screens/shared/FeedbackScreen.tsx`

Features:
- Multiple feedback categories (bug, feature, improvement, other)
- 5-star rating system
- Subject and message fields
- Character count validation
- Submission tracking to analytics
- Backend API integration

Backend endpoint: `POST /api/v1/feedback`

### 8. Settings Screen Enhancement

**Location**: `mobile/src/screens/shared/SettingsScreen.tsx`

Additions:
- "Send Feedback" link
- Enhanced app version display with:
  - App version
  - Build number
  - Platform and OS version
  - Expo version

## Backend Integration

### Analytics Endpoints

**Location**: `src/api/v1/analytics.py`

1. **Track Events Batch**
```
POST /api/v1/analytics/track
```
Body:
```json
{
  "events": [
    {
      "event_name": "screen_view",
      "event_category": "navigation",
      "event_properties": {...},
      "user_id": "user-123",
      "session_id": "session-456",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

2. **Track Performance Metrics**
```
POST /api/v1/analytics/performance
```
Body:
```json
{
  "metrics": [
    {
      "metric_name": "app_launch_time",
      "metric_type": "app_launch",
      "value": 1500,
      "unit": "ms",
      "metadata": {...},
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Feedback Endpoints

**Location**: `src/api/v1/feedback.py`

1. **Submit Feedback**
```
POST /api/v1/feedback
```
Body:
```json
{
  "category": "bug",
  "subject": "App crashes on login",
  "message": "Detailed description...",
  "rating": 4,
  "metadata": {...}
}
```

2. **Get My Feedback**
```
GET /api/v1/feedback/my-feedback?skip=0&limit=50
```

3. **Get Feedback by ID**
```
GET /api/v1/feedback/{feedback_id}
```

4. **Get Feedback Stats**
```
GET /api/v1/feedback/stats/summary
```

### Database Models

**Feedback Model**: `src/models/feedback.py`
```python
class Feedback(Base):
    id: UUID
    user_id: UUID
    category: str
    subject: str
    message: str
    rating: Optional[int]
    status: str  # pending, reviewed, resolved
    metadata: dict
    admin_response: Optional[str]
    created_at: datetime
    updated_at: datetime
```

## Configuration

### Environment Variables

**Mobile App** (`.env.development`, `.env.staging`, `.env.production`):
```
API_URL=https://api.example.com/api/v1
SENTRY_DSN=https://your-dsn@sentry.io/project-id
APP_ENV=production
```

**Backend**:
No additional environment variables needed. Analytics and feedback are integrated with existing auth and database.

### EAS Build Configuration

**Location**: `mobile/eas.json`

```json
{
  "build": {
    "production": {
      "env": {
        "APP_ENV": "production"
      },
      "channel": "production"
    }
  }
}
```

Source maps are automatically uploaded during EAS builds when properly configured.

## Usage Examples

### Track User Login
```typescript
// In login action
await dispatch(login(credentials));
analyticsService.trackLogin('email', true);
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.username
});
```

### Track Assignment Submission
```typescript
const handleSubmit = async () => {
  try {
    await submitAssignment(data);
    analyticsService.trackAssignmentSubmission(
      assignment.id,
      assignment.title,
      'camera_photo'
    );
  } catch (error) {
    Sentry.captureException(error);
    analyticsService.trackError(error.message);
  }
};
```

### Track Feature Usage
```typescript
const handleScanDocument = async () => {
  analyticsService.trackFeatureUsage(
    'document_scanner',
    'study_tools',
    { source: 'assignments_screen' }
  );
  // ... scan logic ...
};
```

### Track Screen Performance
```typescript
useEffect(() => {
  analyticsService.startScreenRender('ComplexScreen');
  
  // Heavy rendering or data loading
  loadData().then(() => {
    analyticsService.endScreenRender('ComplexScreen');
  });
}, []);
```

## Testing

### Test Error Tracking
```typescript
// Throw test error
throw new Error('Test error for Sentry');

// Or capture manually
Sentry.captureException(new Error('Test error'));
```

### Test Analytics
```typescript
// Track test event
analyticsService.trackEvent('test_event', 'testing', {
  test: true,
  timestamp: Date.now()
});

// Force flush to see events immediately
await analyticsService.forceFlush();
```

### Test Feedback
1. Navigate to Settings > Send Feedback
2. Fill out the form
3. Submit
4. Check backend logs for received data

## Monitoring Dashboard

### Sentry Dashboard
- **Issues**: View errors and crashes
- **Performance**: API response times, screen renders
- **Releases**: Track issues by app version
- **Users**: See affected users

### Backend Analytics
Query the analytics database for:
- Most used features
- User engagement metrics
- Performance bottlenecks
- Error rates

## Performance Considerations

1. **Event Batching**: Events are queued and sent in batches
2. **Sample Rates**: Production uses 20% sampling for performance
3. **Offline Support**: Events are queued when offline
4. **Memory Management**: Queue size limited to 50 events
5. **Auto-flush**: Automatic flush every 30 seconds

## Privacy & GDPR

- User IDs are hashed in analytics
- No PII in event properties
- User can opt out via settings
- Data retention policies in backend
- Clear user data on logout

## Troubleshooting

### Events Not Appearing in Sentry
1. Check DSN is correct
2. Verify internet connection
3. Check Sentry dashboard filters
4. Test with `Sentry.captureMessage('test')`

### Analytics Not Sending
1. Check API endpoint is accessible
2. Verify authentication token
3. Check network requests in dev tools
4. Force flush: `analyticsService.forceFlush()`

### Performance Issues
1. Reduce sample rate in production
2. Increase flush interval
3. Reduce queue size
4. Disable screenshots if needed

## Future Enhancements

1. **A/B Testing**: Track experiment variants
2. **Funnel Analysis**: Track user conversion flows
3. **Cohort Analysis**: Group users by signup date
4. **Custom Dashboards**: Real-time analytics in admin panel
5. **Alerts**: Automated alerts for errors and performance
6. **Session Replay**: Record user sessions (Sentry feature)
7. **Heatmaps**: Track touch interactions
8. **Crash-Free Rate**: Track app stability metrics

## Support

For issues or questions:
- Check logs in Sentry dashboard
- Review backend API logs
- Check mobile app console logs
- Contact development team
