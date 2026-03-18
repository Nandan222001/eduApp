# Analytics & Error Monitoring Setup Checklist

Use this checklist to ensure everything is properly configured.

## 📋 Pre-Setup

- [ ] Node.js and npm installed
- [ ] React Native development environment set up
- [ ] Expo CLI installed
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Sentry account created at https://sentry.io/

## 🔧 Mobile App Setup

### 1. Dependencies
- [ ] Run `npm install` in mobile directory
- [ ] Verify `@sentry/react-native` and `sentry-expo` are installed
- [ ] Check `package.json` for correct versions

### 2. Environment Configuration
- [ ] Get Sentry DSN from Sentry dashboard
- [ ] Update `.env.development` with dev Sentry DSN
- [ ] Update `.env.staging` with staging Sentry DSN  
- [ ] Update `.env.production` with production Sentry DSN
- [ ] Verify `SENTRY_DSN` is set in all env files

### 3. Sentry Configuration
- [ ] Run `npx @sentry/wizard -i reactNative -p ios android` (optional)
- [ ] Update `app.json` with your Sentry org and project
- [ ] Update `app.config.js` with your Sentry org and project
- [ ] Create Sentry auth token with correct permissions
- [ ] Add auth token to EAS: `eas secret:create --scope project --name SENTRY_AUTH_TOKEN`

### 4. App Configuration Files
- [ ] Verify `sentry-expo` plugin in `app.json`
- [ ] Verify source maps config in `app.config.js`
- [ ] Check EAS build channels in `eas.json`
- [ ] Verify `.gitignore` includes Sentry config files

### 5. Code Integration
All files are already created, just verify they exist:
- [ ] `src/config/sentry.ts` exists
- [ ] `src/services/analytics.ts` exists
- [ ] `src/components/ErrorBoundary.tsx` exists
- [ ] `src/screens/shared/FeedbackScreen.tsx` exists
- [ ] `src/hooks/useScreenTracking.ts` exists
- [ ] `src/navigation/NavigationContainer.tsx` exists

## 🖥️ Backend Setup

### 1. Database Migration
- [ ] Navigate to project root
- [ ] Run `alembic upgrade head`
- [ ] Verify `feedbacks` table created in database
- [ ] Check indexes are created

### 2. API Endpoints
Verify these endpoints exist:
- [ ] `POST /api/v1/analytics/track`
- [ ] `POST /api/v1/analytics/performance`
- [ ] `POST /api/v1/feedback`
- [ ] `GET /api/v1/feedback/my-feedback`
- [ ] `GET /api/v1/feedback/{feedback_id}`
- [ ] `GET /api/v1/feedback/stats/summary`

### 3. Models
- [ ] `Feedback` model in `src/models/feedback.py`
- [ ] `Feedback` exported in `src/models/__init__.py`
- [ ] `feedbacks` relationship in User model

### 4. API Router
- [ ] Feedback router included in `src/api/v1/__init__.py`
- [ ] Analytics routes updated in `src/api/v1/analytics.py`

## 🧪 Testing

### 1. Local Testing
- [ ] Start backend server
- [ ] Start mobile app
- [ ] App launches without errors
- [ ] No console errors on startup

### 2. Error Tracking Test
- [ ] Add test error button
- [ ] Trigger test error
- [ ] Check Sentry dashboard for error
- [ ] Verify error appears within 1 minute

### 3. Analytics Test
```typescript
// Add this to a screen temporarily
useEffect(() => {
  analyticsService.trackEvent('test_event', 'testing', {
    test: true
  });
  analyticsService.forceFlush();
}, []);
```
- [ ] Add test event code
- [ ] Run app
- [ ] Check backend logs for POST to `/api/v1/analytics/track`
- [ ] Verify event received

### 4. Performance Test
- [ ] Check app launch time is tracked
- [ ] Navigate between screens
- [ ] Check screen render times are tracked
- [ ] Make API request
- [ ] Check API response time is tracked

### 5. Feedback Test
- [ ] Navigate to Settings
- [ ] Tap "Send Feedback"
- [ ] Fill out form
- [ ] Submit feedback
- [ ] Check backend logs for POST to `/api/v1/feedback`
- [ ] Verify feedback saved in database

### 6. Error Boundary Test
- [ ] Add component that throws error
- [ ] Verify error screen appears
- [ ] Check "Try Again" button works
- [ ] Verify error sent to Sentry

## 🚀 Production Deployment

### 1. EAS Build
- [ ] Update version in `app.json`
- [ ] Build for iOS: `eas build --profile production --platform ios`
- [ ] Build for Android: `eas build --profile production --platform android`
- [ ] Verify source maps uploaded (check EAS build logs)

### 2. Sentry Configuration
- [ ] Create releases in Sentry
- [ ] Verify source maps are associated with release
- [ ] Set up alerts in Sentry
- [ ] Configure notification channels
- [ ] Set up performance budgets

### 3. Backend Production
- [ ] Run database migration on production
- [ ] Verify API endpoints accessible
- [ ] Check database permissions
- [ ] Set up monitoring for API endpoints

### 4. Monitoring Setup
- [ ] Create Sentry dashboard
- [ ] Set up error alerts
- [ ] Set up performance alerts
- [ ] Configure email notifications
- [ ] Set up Slack/Discord webhooks (optional)

## 📊 Post-Deployment

### 1. Verify in Production
- [ ] Install production build on device
- [ ] Launch app
- [ ] Navigate through screens
- [ ] Submit test feedback
- [ ] Trigger test error (carefully!)
- [ ] Check Sentry for events

### 2. Dashboard Setup
- [ ] Review Sentry Issues dashboard
- [ ] Review Sentry Performance dashboard
- [ ] Check analytics data in backend
- [ ] Query feedback table in database

### 3. Documentation
- [ ] Share setup guide with team
- [ ] Document any custom configurations
- [ ] Create runbook for monitoring
- [ ] Document alert procedures

## 🎯 Success Criteria

Your setup is complete when:
- [ ] App launches without errors
- [ ] Sentry receives crash reports
- [ ] Analytics events appear in backend
- [ ] Performance metrics are tracked
- [ ] Feedback form works end-to-end
- [ ] Source maps work in production
- [ ] Team can access Sentry dashboard
- [ ] Alerts are configured
- [ ] Documentation is complete

## 🔍 Troubleshooting

If something doesn't work:

1. **Check Logs**
   - [ ] Mobile app console
   - [ ] Backend API logs
   - [ ] EAS build logs
   - [ ] Sentry debug console

2. **Verify Configuration**
   - [ ] DSN is correct
   - [ ] Auth token is valid
   - [ ] API URL is accessible
   - [ ] Environment variables loaded

3. **Test Connectivity**
   - [ ] Backend is reachable
   - [ ] Sentry is reachable
   - [ ] No firewall issues
   - [ ] SSL certificates valid

## 📚 Reference Documents

- [ ] Read `SENTRY_SETUP.md` for detailed setup
- [ ] Read `ANALYTICS_MONITORING_IMPLEMENTATION.md` for architecture
- [ ] Read `ANALYTICS_QUICK_START.md` for quick start
- [ ] Read `IMPLEMENTATION_SUMMARY_ANALYTICS.md` for overview

## ✅ Final Checklist

Before marking as complete:
- [ ] All tests passing
- [ ] Production build successful
- [ ] Source maps uploaded
- [ ] Monitoring active
- [ ] Team trained
- [ ] Documentation complete
- [ ] Alerts configured
- [ ] Backup plan in place

---

**Date Completed**: _______________

**Completed By**: _______________

**Sentry Project**: _______________

**Production DSN**: _______________

**Notes**: 
```
[Add any special notes or configurations here]
```
