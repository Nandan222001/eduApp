# Monitoring & Analytics Quick Start Guide

Get up and running with Sentry error tracking, Google Analytics 4, and custom analytics in minutes.

## 📋 Prerequisites

- Sentry account (https://sentry.io)
- Google Analytics 4 property (https://analytics.google.com)
- Python 3.11+ and Node.js 18+ installed

## 🚀 Quick Setup

### Step 1: Install Dependencies

#### Backend
```bash
poetry add sentry-sdk[fastapi]
```

#### Frontend
```bash
cd frontend
npm install @sentry/react @sentry/vite-plugin web-vitals
```

### Step 2: Configure Environment Variables

#### Backend `.env`
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=1.0
```

#### Frontend `frontend/.env`
```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
VITE_SENTRY_AUTH_TOKEN=your_sentry_auth_token
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 3: Run Database Migration

```bash
alembic upgrade head
```

### Step 4: Update Vite Config

In `frontend/vite.config.ts`, update Sentry plugin settings:

```typescript
sentryVitePlugin({
  org: 'your-sentry-org',          // Replace with your org
  project: 'your-sentry-project',  // Replace with your project
  authToken: env.VITE_SENTRY_AUTH_TOKEN,
  // ... rest of config
})
```

### Step 5: Start the Application

```bash
# Backend
uvicorn src.main:app --reload

# Frontend
cd frontend
npm run dev
```

## 📊 Using Analytics

### Track Page Views (Automatic)

Page views are automatically tracked when using React Router.

### Track Custom Events

```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent({
  event_name: 'assignment_submitted',
  event_type: 'user_action',
  properties: {
    assignment_id: '123',
    subject: 'Mathematics'
  }
});
```

### Track Feature Usage

```typescript
import { trackFeatureUsage } from '@/lib/analytics';

trackFeatureUsage('pomodoro_timer', {
  duration: 25,
  breaks: 3
});
```

### Track Conversions

```typescript
import { trackConversion } from '@/lib/analytics';

trackConversion('subscription', 999, {
  plan: 'premium',
  billing: 'annual'
});
```

## 🐛 Error Tracking

### Capture Exceptions

```typescript
import { captureException } from '@/lib/sentry';

try {
  // Your code
} catch (error) {
  captureException(error as Error, {
    extra: { context: 'payment_processing' }
  });
}
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

## 📈 View Analytics Dashboard

Navigate to `/analytics/dashboard` to view:
- User statistics
- Feature adoption metrics
- User flow analysis
- Retention cohorts
- Performance metrics (Web Vitals)
- Top events

## ⚡ Performance Monitoring

Web Vitals are automatically tracked:
- **LCP**: Largest Contentful Paint
- **FID**: First Input Delay
- **CLS**: Cumulative Layout Shift
- **FCP**: First Contentful Paint
- **TTFB**: Time to First Byte
- **INP**: Interaction to Next Paint

View metrics in the Performance tab of the analytics dashboard.

## 🔧 Common Tasks

### Test Error Tracking

```typescript
// Frontend - throw test error
throw new Error('Test error for Sentry');

// Backend - raise test error
raise Exception("Test error for Sentry")
```

### View Sentry Events

1. Go to https://sentry.io
2. Select your project
3. View Issues, Performance, or Replays

### View Google Analytics

1. Go to https://analytics.google.com
2. Select your GA4 property
3. View Reports → Realtime or Engagement

### Query Analytics Data

```typescript
import { analyticsApi } from '@/api/analytics';

// Get dashboard stats
const stats = await analyticsApi.getDashboardStats();

// Get feature adoption
const features = await analyticsApi.getFeatureAdoption();

// Get performance stats
const performance = await analyticsApi.getPerformanceStats();
```

## 🎯 Best Practices

1. **Use descriptive event names**: `feature_assignment_create` not `click1`
2. **Include context**: Add relevant properties to events
3. **Don't track PII**: Avoid email addresses, passwords, etc.
4. **Batch when possible**: Use batch endpoint for multiple events
5. **Monitor sample rates**: Adjust in production to manage costs
6. **Test in development**: Verify events before deploying

## 📚 Next Steps

- Read the full implementation guide: `MONITORING_ANALYTICS_IMPLEMENTATION.md`
- Configure Sentry alerts and notifications
- Set up GA4 custom dimensions and metrics
- Create custom dashboards in GA4
- Configure retention policies
- Set up automated reports

## 🆘 Troubleshooting

### Events Not Appearing

1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check environment variables are set
4. Verify database migrations ran successfully

### Source Maps Not Uploading

1. Verify `VITE_SENTRY_AUTH_TOKEN` is set
2. Check Sentry org and project names in config
3. Ensure production build is run
4. Check Sentry project settings allow source maps

### Performance Metrics Missing

1. Ensure `web-vitals` package is installed
2. Check browser console for errors
3. Verify `/api/v1/analytics/performance` endpoint works
4. Check that metrics are within expected ranges

## 📞 Support Resources

- Sentry Docs: https://docs.sentry.io
- GA4 Docs: https://developers.google.com/analytics/devguides/collection/ga4
- Web Vitals: https://web.dev/vitals/
- FastAPI Analytics: Check backend API documentation
