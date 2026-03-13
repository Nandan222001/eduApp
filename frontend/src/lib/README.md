# Library Modules

This directory contains core library modules for monitoring, analytics, and performance tracking.

## Modules

### analytics.ts

Google Analytics 4 integration for tracking user interactions and events.

**Features:**

- Event tracking
- Page view tracking
- Feature usage tracking
- Conversion tracking
- Click tracking

**Configuration:**
Set `VITE_GA4_MEASUREMENT_ID` in your environment file.

### sentry.ts

Sentry integration for error tracking and monitoring.

**Features:**

- Error capture
- Message capture with severity levels
- User context tracking
- Breadcrumb tracking
- Custom tags and contexts

**Configuration:**
Set the following in your environment file:

- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT`
- `VITE_SENTRY_TRACES_SAMPLE_RATE`
- `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`
- `VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`

### webVitals.ts

Web Vitals tracking using the `web-vitals` package.

**Metrics Tracked:**

- **CLS** (Cumulative Layout Shift): Measures visual stability
- **FID** (First Input Delay): Measures interactivity
- **FCP** (First Contentful Paint): Measures loading performance
- **LCP** (Largest Contentful Paint): Measures loading performance
- **TTFB** (Time to First Byte): Measures server response time

**Features:**

- Automatic tracking of all Core Web Vitals
- Integration with Google Analytics for performance data
- Sentry reporting for poor performance metrics
- Environment-based conditional tracking
- Console logging in development mode
- Custom thresholds for rating metrics

**Configuration:**
Set `VITE_ENABLE_WEB_VITALS=true` to enable tracking in development mode.
Production mode is enabled by default.

**Rating Thresholds:**

- CLS: good ≤ 0.1, needs improvement ≤ 0.25
- FID: good ≤ 100ms, needs improvement ≤ 300ms
- FCP: good ≤ 1800ms, needs improvement ≤ 3000ms
- LCP: good ≤ 2500ms, needs improvement ≤ 4000ms
- TTFB: good ≤ 800ms, needs improvement ≤ 1800ms

## Usage

All modules are initialized in `src/main.tsx`:

```typescript
import { initSentry } from './lib/sentry';
import { analytics } from './lib/analytics';
import { initWebVitals } from './lib/webVitals';

initSentry();
analytics.init();
initWebVitals();
```

## Error Handling

All modules include proper error handling:

- Failed initialization is logged but doesn't crash the application
- Missing configuration shows warnings in console
- Runtime errors are caught and logged
