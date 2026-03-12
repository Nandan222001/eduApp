# Analytics & Monitoring System

Complete monitoring and analytics solution for tracking user behavior, application performance, and business metrics.

## 🎯 Features

### Error Tracking (Sentry)
- ✅ Frontend error tracking with session replay
- ✅ Backend error tracking with performance monitoring
- ✅ Source maps for production debugging
- ✅ User context and breadcrumbs
- ✅ Custom error filtering
- ✅ Integration with FastAPI, SQLAlchemy, Redis, Celery

### Analytics (Google Analytics 4)
- ✅ Automatic page view tracking
- ✅ Custom event tracking
- ✅ Feature usage tracking
- ✅ Conversion tracking
- ✅ E-commerce tracking ready
- ✅ User property tracking

### Performance Monitoring (Web Vitals)
- ✅ LCP - Largest Contentful Paint
- ✅ FID - First Input Delay
- ✅ CLS - Cumulative Layout Shift
- ✅ FCP - First Contentful Paint
- ✅ TTFB - Time to First Byte
- ✅ INP - Interaction to Next Paint

### Custom Analytics Dashboard
- ✅ User statistics and engagement metrics
- ✅ Feature adoption analysis
- ✅ User flow and navigation patterns
- ✅ Cohort retention analysis
- ✅ Performance metrics visualization
- ✅ Top events and interactions

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend
poetry add sentry-sdk[fastapi]

# Frontend
cd frontend
npm install @sentry/react @sentry/vite-plugin web-vitals
```

### 2. Configure Environment

**Backend `.env`:**
```bash
SENTRY_DSN=https://your-key@sentry.io/project-id
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
```

**Frontend `frontend/.env`:**
```bash
VITE_SENTRY_DSN=https://your-key@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=development
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Run Migration

```bash
alembic upgrade head
```

### 4. Start Tracking

```typescript
import { trackEvent, trackFeatureUsage } from '@/lib/analytics';

// Track events
trackEvent({
  event_name: 'button_click',
  event_type: 'user_action',
  properties: { button_id: 'submit' }
});

// Track features
trackFeatureUsage('study_planner', {
  plan_type: 'weekly'
});
```

## 📊 Analytics Dashboard

Access the analytics dashboard at `/analytics/dashboard` to view:

### Overview Tab
- Total users and active users
- Session statistics
- Page view trends
- Engagement metrics

### Feature Adoption Tab
- Feature usage statistics
- Adoption rates
- Active users per feature
- Usage trends (daily/weekly/monthly)

### User Flow Tab
- Top landing pages
- Navigation patterns
- Session flows
- Drop-off analysis

### Retention Tab
- Cohort analysis
- Day 1/7/14/30 retention
- User lifecycle tracking
- Engagement patterns

### Performance Tab
- Web Vitals metrics
- Performance distribution
- Percentile analysis (P50, P75, P95)
- Good/Needs Improvement/Poor breakdown

### Events Tab
- Top tracked events
- Event frequency
- Unique users per event
- Event type distribution

## 📝 Usage Examples

### Track Page Views (Automatic)

```typescript
import { usePageTracking } from '@/hooks/useAnalytics';

function MyComponent() {
  usePageTracking();
  return <div>Content</div>;
}
```

### Track Custom Events

```typescript
import { trackEvent } from '@/lib/analytics';

// Basic event
trackEvent({
  event_name: 'assignment_submitted',
  event_type: 'user_action',
  properties: {
    assignment_id: '123',
    subject: 'Mathematics'
  }
});

// Using helper
import { AnalyticsHelper } from '@/utils/analyticsHelpers';

AnalyticsHelper.trackAssignment('SUBMIT', {
  assignment_id: '123',
  on_time: true
});
```

### Track Feature Usage

```typescript
import { trackFeatureUsage } from '@/lib/analytics';

// Manual tracking
trackFeatureUsage('pomodoro_timer', {
  duration: 25,
  breaks: 3
});

// Auto-track on component mount
import { useFeatureTracking } from '@/hooks/useAnalytics';

function PomodoroTimer() {
  useFeatureTracking('pomodoro_timer');
  return <div>Timer</div>;
}
```

### Track Conversions

```typescript
import { trackConversion } from '@/lib/analytics';

trackConversion('subscription_purchase', 999, {
  plan: 'premium',
  billing_cycle: 'annual'
});
```

### Error Tracking

```typescript
import { captureException, captureMessage } from '@/lib/sentry';

try {
  // Your code
  processPayment();
} catch (error) {
  captureException(error as Error, {
    extra: {
      userId: user.id,
      amount: 999
    }
  });
}

// Log messages
captureMessage('Payment processed successfully', 'info');
```

### Set User Context

```typescript
import { setUserContext } from '@/lib/sentry';
import { setAnalyticsUserId } from '@/lib/analytics';

// After login
setUserContext({
  id: user.id,
  email: user.email,
  username: user.username
});

setAnalyticsUserId(user.id);
```

## 🛠️ Available Helpers

### AnalyticsHelper Methods

```typescript
// Authentication
AnalyticsHelper.trackAuth('LOGIN', { method: 'email' });

// Assignments
AnalyticsHelper.trackAssignment('CREATE', { subject: 'Math' });
AnalyticsHelper.trackAssignment('SUBMIT', { on_time: true });

// Exams
AnalyticsHelper.trackExam('CREATE', { type: 'midterm' });
AnalyticsHelper.trackExam('TAKE', { exam_id: '123' });

// Attendance
AnalyticsHelper.trackAttendance('MARK', { present: true });

// Subscriptions
AnalyticsHelper.trackSubscription('UPGRADE', { plan: 'premium' });

// Features
AnalyticsHelper.trackFeature('POMODORO_TIMER', { duration: 25 });

// Conversions
AnalyticsHelper.trackConversionEvent('SUBSCRIPTION_PURCHASE', 999);

// UI Interactions
AnalyticsHelper.trackButtonClick('submit_button');
AnalyticsHelper.trackLinkClick('help_link', '/help');
AnalyticsHelper.trackFormSubmission('contact_form');

// Media
AnalyticsHelper.trackVideoPlay('video_123');
AnalyticsHelper.trackVideoComplete('video_123', 600);
AnalyticsHelper.trackDownload('notes.pdf', 'pdf');

// Other
AnalyticsHelper.trackSearch('algebra', 25);
AnalyticsHelper.trackShare('facebook', 'article');
AnalyticsHelper.trackError('validation', 'Invalid email');
```

## 🔌 API Endpoints

### Analytics Events
```
POST   /api/v1/analytics/events
POST   /api/v1/analytics/performance
POST   /api/v1/analytics/sessions
POST   /api/v1/analytics/features
POST   /api/v1/analytics/batch
```

### Analytics Queries
```
GET    /api/v1/analytics/dashboard
GET    /api/v1/analytics/features/adoption
GET    /api/v1/analytics/user-flow
GET    /api/v1/analytics/retention/cohorts
GET    /api/v1/analytics/events/top
GET    /api/v1/analytics/performance/stats
```

## 📈 Metrics Tracked

### User Metrics
- Total users
- Active users (daily/weekly/monthly)
- New users
- Returning users

### Engagement Metrics
- Session duration
- Pages per session
- Bounce rate
- Session frequency

### Feature Metrics
- Adoption rate
- Usage frequency
- Active users per feature
- Time in feature

### Performance Metrics
- Core Web Vitals (LCP, FID, CLS)
- Load times (FCP, TTFB)
- Interaction delay (INP)
- Error rates

### Business Metrics
- Conversions
- Revenue
- Retention
- Churn

## 🔧 Configuration

### Sentry Settings

```typescript
// Frontend - lib/sentry.ts
{
  dsn: 'your_dsn',
  environment: 'production',
  tracesSampleRate: 0.1,  // 10% in production
  replaysSessionSampleRate: 0.01,  // 1% in production
  replaysOnErrorSampleRate: 1.0,   // 100% on errors
}
```

```python
# Backend - config.py
SENTRY_TRACES_SAMPLE_RATE = 0.1  # 10% in production
SENTRY_PROFILES_SAMPLE_RATE = 0.1  # 10% in production
```

### GA4 Settings

Update measurement ID in `.env`:
```bash
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Source Maps

Update `vite.config.ts` with your Sentry org and project:
```typescript
sentryVitePlugin({
  org: 'your-org',
  project: 'your-project',
  authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
})
```

## 🎓 Best Practices

1. **Consistent Naming**: Use descriptive, consistent event names
2. **Structured Properties**: Keep properties consistent across similar events
3. **Privacy First**: Never track PII without consent
4. **Error Handling**: Wrap analytics calls in try-catch
5. **Batch When Possible**: Use batch endpoint for multiple events
6. **Sample in Production**: Adjust rates to control volume and cost
7. **Document Events**: Keep track of all tracked events
8. **Test Thoroughly**: Verify tracking before deploying

## 📚 Documentation

- [Implementation Guide](MONITORING_ANALYTICS_IMPLEMENTATION.md) - Complete technical documentation
- [Quick Start Guide](MONITORING_ANALYTICS_QUICK_START.md) - Get started quickly
- [Implementation Checklist](MONITORING_ANALYTICS_CHECKLIST.md) - Ensure complete setup
- [Summary](MONITORING_ANALYTICS_SUMMARY.md) - Overview of implementation

## 🐛 Troubleshooting

### Events Not Showing

1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check environment variables
4. Verify database migration ran
5. Check network tab for failed requests

### Source Maps Not Uploading

1. Verify auth token is set
2. Check org and project names
3. Run production build
4. Check Sentry project settings

### Performance Metrics Missing

1. Check web-vitals package is installed
2. Verify browser console for errors
3. Test API endpoint manually
4. Check metric values are valid

## 📞 Support

- Sentry Docs: https://docs.sentry.io
- GA4 Docs: https://developers.google.com/analytics/devguides/collection/ga4
- Web Vitals: https://web.dev/vitals/

## 📄 License

Part of the main application license.
