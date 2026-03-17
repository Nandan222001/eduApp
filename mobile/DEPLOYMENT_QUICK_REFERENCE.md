# Deployment Quick Reference

Quick commands and procedures for common deployment tasks.

## Quick Commands

### Building

```bash
# Development builds
npm run build:dev:ios
npm run build:dev:android
npm run build:dev:all

# Preview/Staging builds
npm run build:preview:ios
npm run build:preview:android
npm run build:preview:all

# Production builds
npm run build:prod:ios
npm run build:prod:android
npm run build:prod:all
```

### Submitting

```bash
# iOS
npm run submit:beta:ios          # TestFlight
npm run submit:ios               # App Store

# Android
npm run submit:alpha:android     # Internal testing
npm run submit:beta:android      # Beta testing
npm run submit:android           # Production
```

### OTA Updates

```bash
# Preview/Staging
npm run update:preview -- "Your update message"

# Production
npm run update:production -- "Your update message"

# Check updates
node scripts/check-updates.js production
node scripts/check-updates.js staging
```

### Automated Releases

```bash
# Platform-specific releases
npm run release:ios
npm run release:android

# Full release (both platforms)
npm run release:full
```

### Validation & Testing

```bash
# Run all tests
npm run test:ci

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Validate deployment setup
node scripts/validate-deployment.js
```

### Credentials

```bash
# Setup all credentials
bash scripts/setup-credentials.sh

# Manage iOS credentials
eas credentials --platform ios

# Manage Android credentials
eas credentials --platform android

# Clear credential cache
eas credentials --clear-cache
```

## Common Workflows

### Standard Release

```bash
# 1. Update version
npm version [patch|minor|major]

# 2. Run tests
npm run test:ci && npm run lint

# 3. Build and release
npm run release:full

# 4. Follow prompts for:
#    - Version bumping
#    - Testing
#    - Building
#    - Submitting
#    - OTA updates
```

### Hotfix Release

```bash
# 1. Create hotfix branch
git checkout -b hotfix/v1.0.1

# 2. Make fixes
# ... edit files ...

# 3. Test
npm run test:ci

# 4. If JavaScript-only changes
npm run update:production -- "Hotfix: [description]"

# 5. If native changes required
npm version patch
npm run build:prod:all
npm run submit:ios
npm run submit:android
```

### Beta Release

```bash
# 1. Build preview
npm run build:preview:all

# 2. Submit to beta
npm run submit:beta:ios
npm run submit:alpha:android

# 3. Notify testers
# Send TestFlight/Play Store links
```

### OTA-Only Update

```bash
# 1. Make JavaScript changes
# 2. Test locally
npm start

# 3. Deploy to staging
npm run update:preview -- "Feature: [description]"

# 4. Test on staging
# 5. Deploy to production
npm run update:production -- "Feature: [description]"

# 6. Monitor
# Check Sentry for crashes
```

## Rollback Procedures

### OTA Rollback

```bash
# List updates
eas update:list --branch production

# Rollback to previous
eas update:rollback --branch production

# Or republish specific version
eas update:republish --update-id [UPDATE_ID] --branch production
```

### Store Release Rollback

**iOS:**
1. App Store Connect → My Apps → [App]
2. App Store → App Store Versions
3. Select previous version → Submit for Review

**Android:**
1. Play Console → Release → Production
2. Find previous version → Roll back

## Monitoring Commands

### Check Build Status

```bash
# List recent builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Build logs
eas build:view [BUILD_ID] --log
```

### Check Update Status

```bash
# List updates
eas update:list --branch production
eas update:list --branch staging

# View specific update
eas update:view [UPDATE_ID]
```

### Check Credentials

```bash
# View stored credentials
eas credentials

# Check specific platform
eas credentials --platform ios
eas credentials --platform android
```

## Environment Setup

### Switch Environments

```bash
# Development
export APP_ENV=development

# Staging
export APP_ENV=staging

# Production
export APP_ENV=production
```

### Load Environment Variables

```bash
# Development
export $(cat .env.development | xargs)

# Staging
export $(cat .env.staging | xargs)

# Production
export $(cat .env.production | xargs)
```

## Troubleshooting

### Build Failed

```bash
# View build logs
eas build:view [BUILD_ID] --log

# Clear cache and retry
eas build:clear-cache
npm run build:prod:ios --clear-cache
```

### Credential Issues

```bash
# Clear and reconfigure
eas credentials --clear-cache
eas credentials --platform [ios|android]
```

### Update Not Appearing

```bash
# Check update published
eas update:list --branch production

# Force update in app
# Use UpdateManager component or
# otaUpdateService.forceUpdate()

# Verify runtime version matches
# Check app.config.js updates.runtimeVersion
```

### Submission Failed

```bash
# View submission status
eas submit:list

# Retry submission
eas submit --platform [ios|android] --latest
```

## Emergency Procedures

### Critical Bug in Production

```bash
# 1. Immediate: Pause rollouts
# iOS: App Store Connect → Pause Phased Release
# Android: Play Console → Pause rollout

# 2. Deploy hotfix via OTA (if JS-only)
npm run update:production -- "Emergency fix: [description]"

# 3. Monitor Sentry
# Watch for crash rate drop

# 4. If native fix needed
npm version patch
npm run build:prod:all
npm run submit:ios
npm run submit:android
```

### Revert to Previous Version

```bash
# OTA revert
eas update:rollback --branch production

# Store revert
# iOS: Use App Store Connect
# Android: Use Play Console rollback feature
```

## Useful EAS Commands

```bash
# Login/Logout
eas login
eas logout
eas whoami

# Project info
eas project:info
eas project:init

# Build
eas build --platform [all|ios|android]
eas build --profile [development|preview|production]
eas build --local  # Build locally
eas build:list
eas build:view [BUILD_ID]
eas build:cancel [BUILD_ID]

# Submit
eas submit --platform [ios|android]
eas submit --latest
eas submit:list

# Update (OTA)
eas update --branch [branch-name]
eas update:list
eas update:view [UPDATE_ID]
eas update:delete [UPDATE_ID]
eas update:rollback

# Credentials
eas credentials
eas credentials --platform [ios|android]
eas credentials --clear-cache

# Metadata
eas metadata:pull
eas metadata:push

# Other
eas channel:list
eas channel:create [name]
eas device:create
eas device:list
```

## Version Management

```bash
# Bump version (updates package.json)
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# Update with message
npm version patch -m "Release version %s"

# No git tag
npm version patch --no-git-tag-version
```

## Git Tags

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release 1.0.0"

# Push tag
git push origin v1.0.0

# Push all tags
git push origin --tags

# List tags
git tag -l

# Delete tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

## Sentry

```bash
# Upload source maps
npx sentry-cli sourcemaps upload \
  --org [ORG] \
  --project [PROJECT] \
  --release [VERSION] \
  ./dist

# Create release
npx sentry-cli releases new [VERSION]
npx sentry-cli releases finalize [VERSION]

# Associate commits
npx sentry-cli releases set-commits [VERSION] --auto
```

## Analytics

```bash
# Firebase
# View analytics in Firebase Console

# Amplitude
# View analytics in Amplitude dashboard

# Test events
# Use app and check dashboards
```

## Status Checks

```bash
# Check EAS build queue
eas build:list --status in-queue

# Check running builds
eas build:list --status in-progress

# Check recent completions
eas build:list --limit 5

# Check update status
eas update:list --branch production --limit 5

# Check project configuration
eas project:info
```

## Links

- **EAS Dashboard:** https://expo.dev/accounts/[account]/projects/[project]
- **Sentry:** https://sentry.io/organizations/[org]/projects/
- **Firebase Console:** https://console.firebase.google.com/
- **App Store Connect:** https://appstoreconnect.apple.com/
- **Google Play Console:** https://play.google.com/console/
- **Amplitude:** https://analytics.amplitude.com/

---

## Quick Tips

1. **Always test preview builds before production**
2. **Use OTA updates for quick fixes (JS-only)**
3. **Monitor Sentry after every deployment**
4. **Start with small staged rollouts (5-10%)**
5. **Keep backups of all credentials**
6. **Document every production change**
7. **Communicate releases to team**
8. **Have rollback plan ready**

---

For detailed procedures, see [DEPLOYMENT.md](./DEPLOYMENT.md)
