# Deployment Checklist

Use this checklist for each release to ensure nothing is missed.

## Pre-Release (1-2 days before)

### Code Preparation
- [ ] All features tested and merged to main/release branch
- [ ] CHANGELOG.md updated with all changes
- [ ] Version number updated in package.json
- [ ] Build numbers incremented (iOS & Android)
- [ ] All TODO/FIXME comments addressed or documented
- [ ] Code review completed for all changes

### Testing
- [ ] Unit tests passing (`npm run test`)
- [ ] Integration tests passing
- [ ] E2E tests passing (if applicable)
- [ ] Linter passing (`npm run lint`)
- [ ] Type check passing (`npm run type-check`)
- [ ] Manual testing on iOS device
- [ ] Manual testing on Android device
- [ ] Tested on different screen sizes
- [ ] Tested in both light/dark mode
- [ ] Performance profiling completed

### Configuration
- [ ] Environment variables set correctly
- [ ] API endpoints configured for production
- [ ] Feature flags reviewed and set
- [ ] Analytics tracking verified
- [ ] Push notification configuration verified
- [ ] Deep linking tested
- [ ] App Store/Play Store metadata prepared

### Assets & Content
- [ ] App icons generated for all sizes
- [ ] Splash screens created
- [ ] Screenshots prepared for stores
- [ ] Marketing materials ready
- [ ] Privacy policy updated (if needed)
- [ ] Terms of service updated (if needed)

## Build Phase

### Pre-Build
- [ ] Run pre-build validation: `node scripts/validate-deployment.js`
- [ ] Verify credentials are set up correctly
- [ ] Check EAS CLI is up to date: `npm install -g eas-cli`
- [ ] Logged into EAS: `eas login`

### iOS Build
- [ ] Build preview: `npm run build:preview:ios`
- [ ] Test preview build
- [ ] Build production: `npm run build:prod:ios`
- [ ] Verify build succeeded in EAS dashboard
- [ ] Download and test production .ipa

### Android Build
- [ ] Build preview: `npm run build:preview:android`
- [ ] Test preview build (APK)
- [ ] Build production: `npm run build:prod:android`
- [ ] Verify build succeeded in EAS dashboard
- [ ] Download and test production .aab

### Post-Build
- [ ] Upload source maps to Sentry
- [ ] Verify crash reporting configuration
- [ ] Create git tag: `git tag -a v1.0.0 -m "Release 1.0.0"`
- [ ] Push tag: `git push origin v1.0.0`

## Submission Phase

### iOS Submission (TestFlight)
- [ ] Submit to TestFlight: `npm run submit:beta:ios`
- [ ] Wait for processing (15-30 minutes)
- [ ] Add release notes in App Store Connect
- [ ] Add to external testing group
- [ ] Test on TestFlight
- [ ] Collect feedback from beta testers

### iOS Submission (App Store)
- [ ] Submit to App Store: `npm run submit:ios`
- [ ] Complete App Store Connect information:
  - [ ] Screenshots
  - [ ] App preview videos (optional)
  - [ ] Description
  - [ ] Keywords
  - [ ] Support URL
  - [ ] Marketing URL
  - [ ] Privacy policy URL
- [ ] Select pricing tier
- [ ] Choose availability regions
- [ ] Configure phased release (optional)
- [ ] Submit for review
- [ ] Monitor review status

### Android Submission (Internal Testing)
- [ ] Submit to internal: `npm run submit:alpha:android`
- [ ] Add internal testers
- [ ] Test internal release
- [ ] Collect feedback

### Android Submission (Production)
- [ ] Submit to production: `npm run submit:android`
- [ ] Complete Google Play Console information:
  - [ ] Screenshots (phone, tablet)
  - [ ] Feature graphic
  - [ ] Short description
  - [ ] Full description
  - [ ] Privacy policy URL
- [ ] Set content rating
- [ ] Configure pricing & distribution
- [ ] Set staged rollout percentage (start with 5-10%)
- [ ] Submit for review
- [ ] Monitor review status

## Post-Release

### Immediate (First 24 hours)
- [ ] Monitor crash reports in Sentry
- [ ] Check analytics dashboard
- [ ] Monitor user reviews/ratings
- [ ] Watch for critical issues
- [ ] Be ready for emergency hotfix
- [ ] Monitor staged rollout metrics (Android)
- [ ] Check server logs for API issues

### Week 1
- [ ] Review crash-free session rate (target: >99.9%)
- [ ] Analyze user feedback
- [ ] Track key metrics (DAU, MAU, retention)
- [ ] Increase rollout percentage (Android)
- [ ] Monitor performance metrics
- [ ] Document any issues for next release

### Week 2
- [ ] Continue monitoring metrics
- [ ] Complete rollout to 100% (Android)
- [ ] Plan next release
- [ ] Archive release artifacts
- [ ] Update internal documentation

## OTA Update Deployment

### Pre-Update
- [ ] Verify changes are JavaScript-only
- [ ] Test changes locally
- [ ] Run tests: `npm run test:ci`
- [ ] Run linter: `npm run lint`

### Deploy Update
- [ ] Deploy to staging: `npm run update:preview -- "Description"`
- [ ] Test staging update
- [ ] Deploy to production: `npm run update:production -- "Description"`
- [ ] Verify update appears: `node scripts/check-updates.js production`

### Post-Update
- [ ] Monitor crash reports (1 hour)
- [ ] Check analytics for issues
- [ ] Be ready to rollback if needed

## Rollback Procedures

### If Critical Issue Found
- [ ] Assess severity and impact
- [ ] Notify team immediately
- [ ] Decide on rollback strategy:
  - [ ] OTA rollback (if JS-only)
  - [ ] Pause staged rollout
  - [ ] Remove from store (extreme cases)
- [ ] Execute rollback
- [ ] Prepare hotfix
- [ ] Deploy fixed version
- [ ] Monitor deployment
- [ ] Post-mortem analysis

## Documentation

### Update Documentation
- [ ] Update CHANGELOG.md
- [ ] Update README.md (if needed)
- [ ] Update API documentation (if changed)
- [ ] Create release notes
- [ ] Update internal wiki/docs

### Communication
- [ ] Notify team of release
- [ ] Send release notes to stakeholders
- [ ] Update status page
- [ ] Social media announcement (if applicable)
- [ ] Email users (if major release)

## Notes

**Version:** ______________________

**Release Date:** ______________________

**Platforms:** ☐ iOS  ☐ Android

**Type:** ☐ Major  ☐ Minor  ☐ Patch  ☐ Hotfix

**Issues Found:**
_____________________________________________
_____________________________________________
_____________________________________________

**Lessons Learned:**
_____________________________________________
_____________________________________________
_____________________________________________

**Sign-off:**

Developer: _________________ Date: _________

QA: _________________ Date: _________

Release Manager: _________________ Date: _________
