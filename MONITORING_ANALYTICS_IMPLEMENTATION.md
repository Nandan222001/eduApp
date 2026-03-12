# Monitoring and Analytics Implementation Guide

This document describes the complete monitoring and analytics system implementation including Sentry error tracking, Google Analytics 4, Web Vitals performance monitoring, and custom analytics dashboard.

## Table of Contents

1. [Overview](#overview)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Analytics Dashboard](#analytics-dashboard)
5. [Configuration](#configuration)
6. [Usage Examples](#usage-examples)

## Overview

The monitoring and analytics system provides:

- **Error Tracking**: Sentry integration with source maps for both frontend and backend
- **Analytics**: Google Analytics 4 for event tracking and user behavior
- **Performance**: Web Vitals tracking (LCP, FID, CLS, FCP, TTFB, INP)
- **Custom Dashboard**: Product analytics for feature adoption, user flow, and retention

## Backend Implementation

### 1. Sentry Integration

**File**: `src/middleware/sentry_middleware.py`

Sentry is initialized with:
- FastAPI integration for request tracing
- SQLAlchemy integration for database query monitoring
- Redis integration
- Celery integration for background tasks
- Custom error filtering
- Environment-specific configuration

### 2. Analytics Models

**File**: `src/models/analytics.py`

Database models for tracking:
- `AnalyticsEvent`: User events and interactions
- `PerformanceMetric`: Web Vitals and performance data
- `UserSession`: Session tracking and user journey
- `FeatureUsage`: Feature adoption metrics
- `UserRetention`: Cohort retention analysis

### 3. Analytics API

**File**: `src/api/v1/analytics.py`

Endpoints:
- `POST /analytics/events` - Track events
- `POST /analytics/performance` - Track performance metrics
- `POST /analytics/sessions` - Create/update sessions
- `POST /analytics/features` - Track feature usage
- `POST /analytics/batch` - Batch event tracking
- `GET /analytics/dashboard` - Dashboard statistics
- `GET /analytics/features/adoption` - Feature adoption stats
- `GET /analytics/user-flow` - User flow analysis
- `GET /analytics/retention/cohorts` - Retention cohorts
- `GET /analytics/events/top` - Top events
- `GET /analytics/performance/stats` - Performance statistics

### 4. Database Migration

**File**: `alembic/versions/create_analytics_tables.py`

Run migration:
```bash
alembic upgrade head
```

## Frontend Implementation

### 1. Sentry Setup

**File**: `frontend/src/lib/sentry.ts`

Features:
- Error tracking with source maps
- Session replay
- Performance tracing
- React Router integration
- User context tracking
- Custom breadcrumbs

**Vite Plugin**: `frontend/vite.config.ts`
- Automatic source map upload
- Release tracking

### 2. Google Analytics 4

**File**: `frontend/src/lib/analytics.ts`

Capabilities:
- Page view tracking
- Event tracking
- Feature usage tracking
- Conversion tracking
- Click tracking
- Session management
- Backend synchronization

### 3. Web Vitals Tracking

**File**: `frontend/src/lib/webVitals.ts`

Metrics tracked:
- **LCP** (Largest Contentful Paint): Loading performance
- **FID** (First Input Delay): Interactivity
- **CLS** (Cumulative Layout Shift): Visual stability
- **FCP** (First Contentful Paint): Initial render
- **TTFB** (Time to First Byte): Server response
- **INP** (Interaction to Next Paint): Responsiveness

### 4. Analytics Hooks

**File**: `frontend/src/hooks/useAnalytics.ts`

React hooks:
- `usePageTracking()` - Auto page view tracking
- `useAnalytics()` - Access analytics methods
- `useFeatureTracking(name)` - Track feature usage

## Analytics Dashboard

**Location**: `frontend/src/pages/Analytics/`

### Dashboard Tabs

1. **Overview Tab**
   - Weekly activity trends
   - User engagement charts
   - Session statistics

2. **Feature Adoption Tab**
   - Feature usage metrics
   - Adoption rates
   - User engagement per feature
   - Daily/weekly/monthly active users

3. **User Flow Tab**
   - Top landing pages
   - Navigation patterns
   - Drop-off rates
   - Session flow visualization

4. **Retention Tab**
   - Cohort analysis
   - Day 1, 7, 14, 30 retention rates
   - User lifecycle tracking

5. **Performance Tab**
   - Web Vitals metrics
   - Percentile distribution (P50, P75, P95)
   - Good/Needs Improvement/Poor breakdown
   - Performance trends

6. **Events Tab**
   - Top tracked events
   - Event frequency
   - Unique users per event
   - Event type distribution

## Configuration

### Backend Environment Variables

Add to `.env`:

```bash
# Sentry Configuration
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=1.0
```

### Frontend Environment Variables

Add to `frontend/.env`:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
VITE_SENTRY_AUTH_TOKEN=your_sentry_auth_token_here

# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Sentry Project Setup

1. Create a Sentry account at https://sentry.io
2. Create a new project for both frontend and backend
3. Copy the DSN from project settings
4. Generate an auth token for source map uploads
5. Update `vite.config.ts` with your org and project name

### Google Analytics Setup

1. Create a GA4 property at https://analytics.google.com
2. Get the Measurement ID (G-XXXXXXXXXX)
3. Add the ID to your `.env` file

## Usage Examples

### Backend - Track Custom Events

```python
from src.repositories.analytics_repository import AnalyticsRepository
from src.schemas.analytics import AnalyticsEventCreate

async def track_custom_event(db: AsyncSession):
    repo = AnalyticsRepository(db)
    await repo.create_event(
        AnalyticsEventCreate(
            event_name="custom_action",
            event_type="user_action",
            properties={"key": "value"}
        )
    )
```

### Frontend - Track Events

```typescript
import { trackEvent, trackFeatureUsage, trackConversion } from '@/lib/analytics';

// Track a custom event
trackEvent({
  event_name: 'button_clicked',
  event_type: 'click',
  properties: { button_id: 'submit' }
});

// Track feature usage
trackFeatureUsage('assignment_creation', {
  subject: 'Mathematics',
  grade: '10'
});

// Track conversion
trackConversion('subscription_purchase', 999, {
  plan: 'premium',
  duration: 'annual'
});
```

### Frontend - Using Hooks

```typescript
import { usePageTracking, useFeatureTracking } from '@/hooks/useAnalytics';

function MyComponent() {
  // Auto-track page views
  usePageTracking();
  
  // Track feature usage on mount
  useFeatureTracking('my_feature');
  
  return <div>Content</div>;
}
```

### Frontend - Error Tracking

```typescript
import { captureException, captureMessage } from '@/lib/sentry';

try {
  // Some code that might fail
} catch (error) {
  captureException(error as Error, {
    context: 'user_action',
    userId: '123'
  });
}

// Log info message
captureMessage('Important event occurred', 'info');
```

### Setting User Context

```typescript
import { setUserContext } from '@/lib/sentry';
import { setAnalyticsUserId } from '@/lib/analytics';

// After user login
setUserContext({
  id: user.id,
  email: user.email,
  username: user.username
});

setAnalyticsUserId(user.id);
```

## Performance Monitoring

Web Vitals are automatically tracked and sent to:
1. Google Analytics (if configured)
2. Backend analytics API
3. Sentry performance monitoring

Metrics are categorized as:
- **Good**: Meets performance targets
- **Needs Improvement**: Below target but acceptable
- **Poor**: Performance issues that need attention

## Best Practices

1. **Event Naming**: Use descriptive, consistent naming (e.g., `feature_assignment_create`)
2. **Property Structure**: Keep event properties consistent and typed
3. **Sampling**: Adjust sampling rates in production to control data volume
4. **Privacy**: Don't track PII without proper consent
5. **Error Handling**: Wrap analytics calls in try-catch to prevent blocking
6. **Batch Tracking**: Use batch endpoints for multiple events
7. **Session Management**: Let the system handle session tracking automatically

## Dashboard Access

The analytics dashboard is available at:
- Route: `/analytics/dashboard`
- Component: `AnalyticsDashboard`

Add to your routing configuration to enable access.

## Troubleshooting

### Sentry Issues
- **Source maps not uploading**: Check auth token and build configuration
- **No errors appearing**: Verify DSN is correct
- **Too many errors**: Adjust sampling rate or add filters

### Analytics Issues
- **Events not tracking**: Check browser console for API errors
- **GA4 not receiving data**: Verify Measurement ID
- **Performance metrics missing**: Ensure web-vitals library is loaded

### Backend Issues
- **Database errors**: Run migrations: `alembic upgrade head`
- **Slow queries**: Add indexes or optimize queries
- **Memory issues**: Adjust batch sizes and enable cleanup tasks

## Dependencies

### Backend
- `sentry-sdk[fastapi]>=1.40.0`

### Frontend
- `@sentry/react>=7.99.0`
- `@sentry/vite-plugin>=2.14.2`
- `web-vitals>=3.5.1`

Install with:
```bash
# Backend
poetry add sentry-sdk[fastapi]

# Frontend
cd frontend
npm install @sentry/react @sentry/vite-plugin web-vitals
```

## Support

For issues or questions:
1. Check Sentry documentation: https://docs.sentry.io
2. Check GA4 documentation: https://developers.google.com/analytics/devguides/collection/ga4
3. Review Web Vitals: https://web.dev/vitals/
