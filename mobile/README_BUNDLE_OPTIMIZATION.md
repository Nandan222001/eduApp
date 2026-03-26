# Web Bundle Optimization - Quick Start Guide

## 🎯 Objective
Optimize the web bundle to stay under 2MB and ensure no native-only modules are included in the web build.

## ✅ Implementation Status

**Bundle Size**: ✅ Optimized to < 2MB  
**Tree-Shaking**: ✅ Enhanced with aggressive minification  
**Dynamic Imports**: ✅ Heavy screens lazy-loaded  
**Storage**: ✅ AsyncStorage for web, SecureStore for native  
**Native Modules**: ✅ Excluded from web bundle  

## 🚀 Quick Verification

Run these three commands to verify all optimizations:

```bash
npm run verify-web-optimization  # Check optimization config
npm run check-web-storage        # Verify storage setup
npm run analyze-bundle           # Analyze bundle size
```

All should pass with ✅ status.

## 📦 What Was Optimized

### 1. **Metro Configuration** (`metro.config.js`)
- Enhanced Terser minification with aggressive compression
- Dead code elimination and unused export removal
- Top-level minification and variable optimization
- Platform-specific resolution prioritization

### 2. **Webpack Configuration** (`webpack.config.js`)
- Vendor code split by package for optimal caching
- Heavy libraries (chart-kit, SVG) isolated into separate chunks
- Module concatenation for smaller output
- Performance budgets enforced (2MB limit)

### 3. **Dynamic Imports for Heavy Screens**
- **AI Predictions**: Lazy-loaded (contains chart libraries ~150KB)
- **Homework Scanner**: Lazy-loaded (camera functionality)
- Both use React.lazy() with Suspense boundaries

### 4. **Storage Optimization**
- **Web**: Uses `@react-native-async-storage/async-storage`
- **Native**: Uses `expo-secure-store` for sensitive data
- Automatic platform detection in `src/utils/secureStorage.ts`

### 5. **Native Module Exclusion**
All native-only modules aliased to web stubs:
- expo-camera
- expo-local-authentication
- expo-notifications (native features)
- expo-background-fetch
- expo-task-manager
- react-native-image-crop-picker

## 📋 Key Files

### Configuration Files
- `metro.config.js` - Metro bundler with tree-shaking
- `webpack.config.js` - Webpack with code splitting
- `babel.config.js` - Babel with production optimizations
- `app.config.js` - Platform-specific plugin configuration

### Lazy-Loaded Screens
- `app/(tabs)/student/ai-predictions.tsx` - Lazy wrapper
- `src/screens/student/AIPredictionsScreen.tsx` - Implementation
- `app/(tabs)/student/homework-scanner.tsx` - Lazy wrapper
- `src/screens/student/HomeworkScannerScreen.tsx` - Implementation

### Verification Scripts
- `scripts/analyze-bundle.js` - Bundle size analyzer
- `scripts/check-web-storage.js` - Storage configuration checker
- `scripts/verify-web-optimization.js` - Optimization verifier

### Documentation
- `WEB_BUNDLE_OPTIMIZATION.md` - Complete guide
- `BUNDLE_OPTIMIZATION_SUMMARY.md` - Implementation details
- `OPTIMIZATION_CHECKLIST.md` - Pre-deployment checklist

## 🔍 Verification Details

### Storage Configuration
Run `npm run check-web-storage` to verify:
- ✅ AsyncStorage imported from correct package
- ✅ Platform checks exist for web storage
- ✅ SecureStore conditionally required
- ✅ No direct expo-secure-store imports

### Bundle Analysis
Run `npm run analyze-bundle` to check:
- ✅ Total bundle size < 2MB
- ✅ No native modules in web bundle
- ✅ Heavy libraries properly split
- ✅ Vendor chunks optimized

### Optimization Settings
Run `npm run verify-web-optimization` to ensure:
- ✅ Platform-specific files exist
- ✅ Webpack config properly set up
- ✅ Metro config has optimization settings
- ✅ Native module stubs present

## 🛠️ How It Works

### Tree-Shaking Process
1. Metro/Webpack analyze import statements
2. Unused exports are marked for removal
3. Terser minifier eliminates dead code
4. Platform-specific code removed based on target
5. Final bundle contains only used code

### Dynamic Loading Flow
1. User navigates to heavy screen (e.g., AI Predictions)
2. React.lazy() triggers dynamic import
3. Suspense shows loading state
4. Heavy chunk downloads in background
5. Screen renders when loaded

### Storage Selection
1. Code checks `Platform.OS`
2. If `Platform.OS === 'web'`: Use AsyncStorage
3. If native platform: Lazy load expo-secure-store
4. Storage methods abstracted behind consistent API

### Native Module Exclusion
1. Webpack aliases native modules to stubs
2. Conditional Platform checks prevent imports
3. Web stubs provide no-op implementations
4. No native code included in web bundle

## 📊 Expected Results

### Bundle Sizes
- **Initial Bundle**: ~800KB-1.3MB (gzipped)
- **Lazy Chunks**: ~150-200KB each (gzipped)
- **Total Uncompressed**: < 2MB ✅

### Performance
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90

### Features on Web
- ✅ Login/Authentication (with AsyncStorage)
- ✅ Dashboard and basic features
- ✅ Assignments, Grades, Schedule
- ⚠️ AI Predictions (lazy-loaded)
- ❌ Camera/Scanner (not available)
- ❌ Biometric auth (password only)
- ❌ Native notifications (web alternative needed)

## 🚨 Important Notes

### When Adding New Features

**If adding heavy dependencies (> 100KB)**:
```typescript
// Use dynamic import
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Wrap with Suspense
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

**If using native modules**:
```typescript
// Conditional import
let NativeModule: any = null;
if (Platform.OS !== 'web') {
  try {
    NativeModule = require('native-module');
  } catch (error) {
    console.warn('Native module not available');
  }
}
```

**If adding new native dependency**:
1. Create web stub in `src/utils/stubs/`
2. Add webpack alias in `webpack.config.js`
3. Use conditional import in consuming code
4. Update verification scripts

### Before Every Deployment
```bash
# Run all verification
npm run verify-web-optimization
npm run check-web-storage
npm run analyze-bundle

# Build and test
npm run build:web
npm run web  # Check browser console
```

## 📚 Additional Documentation

For complete details, see:
- **[WEB_BUNDLE_OPTIMIZATION.md](./WEB_BUNDLE_OPTIMIZATION.md)** - Full optimization guide
- **[BUNDLE_OPTIMIZATION_SUMMARY.md](./BUNDLE_OPTIMIZATION_SUMMARY.md)** - Implementation summary
- **[OPTIMIZATION_CHECKLIST.md](./OPTIMIZATION_CHECKLIST.md)** - Pre-deployment checklist

## 🤝 Contributing

When modifying bundle optimization:
1. Read the full documentation
2. Make changes
3. Run all verification scripts
4. Test web build thoroughly
5. Update documentation
6. Verify bundle size impact

## ❓ Troubleshooting

### Bundle size exceeds 2MB
```bash
npm run analyze-bundle  # Identify large files
# Then add dynamic imports or optimize assets
```

### Native module error on web
```bash
npm run verify-web-optimization  # Check configuration
# Verify webpack aliases and stubs exist
```

### Storage error on web
```bash
npm run check-web-storage  # Verify storage setup
# Check Platform.OS checks in secureStorage.ts
```

## 🎓 Learn More

- [Metro Bundler Docs](https://facebook.github.io/metro/docs/configuration)
- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [React Lazy Loading](https://react.dev/reference/react/lazy)
- [Tree-Shaking Guide](https://webpack.js.org/guides/tree-shaking/)

---

**Implementation Date**: 2024  
**Status**: ✅ Complete and Verified  
**Maintained By**: Development Team  
**Next Review**: Before each major release
