# Web Bundle Optimization Checklist

## Pre-Deployment Verification

Run these commands before deploying to ensure all optimizations are in place:

### 1. Storage Configuration
```bash
npm run check-web-storage
```
**Expected**: All checks pass ✅
- AsyncStorage imported from correct package
- Platform checks exist for web storage
- SecureStore conditionally required
- No direct expo-secure-store imports

### 2. Optimization Settings
```bash
npm run verify-web-optimization
```
**Expected**: All checks pass ✅
- Platform-specific files exist
- Webpack config properly set up
- Metro config has optimization settings
- Native module stubs present

### 3. Bundle Size Analysis
```bash
npm run analyze-bundle
```
**Expected**: 
- Total bundle size < 2MB ✅
- No native modules in bundle ✅
- Large files identified
- Optimization recommendations reviewed

## Manual Verification Steps

### Metro Config
- [x] Enhanced terser minification configured
- [x] Tree-shaking optimizations enabled
- [x] Platform-specific resolution prioritized
- [x] Dead code elimination enabled
- [x] Inline requires enabled

### Webpack Config
- [x] Code splitting configured
- [x] Vendor chunks separated
- [x] Heavy libraries (chart-kit) isolated
- [x] Module concatenation enabled
- [x] Performance budgets set (2MB)

### Dynamic Imports
- [x] AI Predictions screen lazy-loaded
- [x] Homework Scanner screen lazy-loaded
- [x] Suspense boundaries with loading states
- [x] Actual implementations in src/screens/

### Storage Layer
- [x] AsyncStorage used for web platform
- [x] expo-secure-store conditionally imported
- [x] Platform checks in secureStorage.ts
- [x] No direct native storage imports

### Native Module Exclusion
- [x] expo-camera aliased to web stub
- [x] expo-barcode-scanner aliased to web stub
- [x] expo-local-authentication aliased to web stub
- [x] expo-notifications aliased to web stub
- [x] expo-background-fetch aliased to web stub
- [x] expo-task-manager aliased to web stub
- [x] react-native-image-crop-picker aliased to web stub

### Babel Configuration
- [x] Module resolver plugin configured
- [x] Production console.log removal
- [x] Optimization assumptions enabled
- [x] Path aliases configured

### Package Configuration
- [x] sideEffects declared in package.json
- [x] AsyncStorage in dependencies
- [x] Build scripts configured
- [x] Verification scripts added

## Web Build Testing

### 1. Build Successfully
```bash
npm run build:web
```
**Expected**: Build completes without errors

### 2. Check Browser Console
```bash
npm run web
```
**Check for**:
- No native module errors
- No expo-secure-store errors
- No missing module warnings
- AsyncStorage working correctly

### 3. Test Dynamic Loading
- Navigate to AI Predictions screen
  - Should show loading state briefly
  - Charts should render correctly
- Navigate to Homework Scanner
  - Should show "Not Available on Web" message

### 4. Test Storage
- Login/logout functionality works
- Data persists across page reloads
- No console errors related to storage

## Bundle Size Breakdown

Expected sizes after optimization:

### Initial Bundle (Before Dynamic Imports Load)
- App code: ~500-800KB (gzipped)
- Vendor chunks: ~300-500KB (gzipped)
- Total initial: ~800KB-1.3MB (gzipped)

### Lazy-Loaded Chunks
- AI Predictions: ~150-200KB (with charts)
- Camera/Scanner: Excluded on web
- Other heavy features: Load on demand

### Total Bundle
- Uncompressed: < 2MB ✅
- Gzipped: ~1-1.5MB ✅

## Performance Metrics

### Lighthouse Scores (Target)
- Performance: > 90
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Total Bundle Size: < 2MB

### Code Splitting Metrics
- Initial chunks: 2-4 files
- Vendor chunks: 3-5 files (per package)
- Lazy chunks: Load on route navigation

## Common Issues Resolution

### ❌ Bundle size exceeds 2MB
**Solutions**:
1. Run `npm run analyze-bundle` to identify large files
2. Check if new dependencies were added
3. Verify dynamic imports are working
4. Review and optimize large assets

### ❌ Native module error on web
**Solutions**:
1. Check webpack.config.js aliases
2. Verify web stub exists in src/utils/stubs/
3. Add conditional Platform.OS check
4. Restart dev server

### ❌ expo-secure-store error on web
**Solutions**:
1. Verify secureStorage.ts has Platform check
2. Ensure AsyncStorage is imported
3. Check no direct imports of expo-secure-store
4. Run `npm run check-web-storage`

### ❌ Chart library increasing bundle size
**Solutions**:
1. Verify AI Predictions uses lazy loading
2. Check webpack code splitting config
3. Ensure chart-kit is in separate chunk
4. Review splitChunks configuration

## Deployment Checklist

Before deploying to production:

- [ ] All verification scripts pass
- [ ] Bundle size under 2MB
- [ ] No console errors on web
- [ ] Dynamic imports working
- [ ] Storage functioning correctly
- [ ] Native features disabled on web
- [ ] Lighthouse score > 90
- [ ] Load time acceptable
- [ ] Documentation updated
- [ ] Team notified of changes

## Monitoring Post-Deployment

### Week 1
- Monitor bundle size in analytics
- Check for client-side errors
- Verify load times in production
- Review user feedback

### Ongoing
- Weekly bundle size checks
- Monthly optimization review
- Update documentation as needed
- Keep dependencies updated

## Documentation References

- [WEB_BUNDLE_OPTIMIZATION.md](./WEB_BUNDLE_OPTIMIZATION.md) - Complete guide
- [BUNDLE_OPTIMIZATION_SUMMARY.md](./BUNDLE_OPTIMIZATION_SUMMARY.md) - Implementation summary
- [scripts/analyze-bundle.js](./scripts/analyze-bundle.js) - Bundle analyzer
- [scripts/check-web-storage.js](./scripts/check-web-storage.js) - Storage checker
- [scripts/verify-web-optimization.js](./scripts/verify-web-optimization.js) - Optimization verifier

## Quick Commands Reference

```bash
# Verify everything
npm run verify-web-optimization
npm run check-web-storage
npm run analyze-bundle

# Build and test
npm run build:web
npm run web

# Debug specific issue
node scripts/analyze-bundle.js
node scripts/check-web-storage.js
node scripts/verify-web-optimization.js
```

---

**Status**: ✅ All optimizations implemented
**Bundle Target**: < 2MB
**Last Verified**: 2024
**Next Review**: Before each major release
