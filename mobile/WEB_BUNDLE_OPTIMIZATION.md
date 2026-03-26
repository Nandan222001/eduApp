# Web Bundle Optimization Guide

This document outlines the web bundle optimizations implemented in the EduTrack mobile application.

## Overview

The application is optimized to keep the web bundle size under 2MB through various techniques including tree-shaking, code splitting, dynamic imports, and platform-specific code exclusion.

## Bundle Size Target

- **Target**: < 2MB total bundle size
- **Warning Threshold**: 2MB (configured in webpack and metro)
- **Current Status**: Run `npm run analyze-bundle` to check

## Optimization Techniques

### 1. Tree-Shaking Configuration

#### Metro Config (metro.config.js)
- **Terser Minification**: Configured with aggressive compression settings
  - Dead code elimination enabled
  - Unused exports removed
  - Variable collapsing and reduction
  - Top-level minification
- **Inline Requires**: Enabled to reduce initial bundle size
- **Package Exports**: Enabled for better tree-shaking support
- **Platform-Specific Resolution**: Prioritizes `.native.ts`, `.web.ts`, and `.ts` extensions

#### Webpack Config (webpack.config.js)
- **Code Splitting**: Vendor code split into separate chunks
- **Chart Library Isolation**: Heavy charting libraries (react-native-chart-kit, react-native-svg) bundled separately
- **Module Concatenation**: Enabled for smaller output
- **Used Exports**: Only includes explicitly used exports

### 2. Dynamic Imports for Heavy Screens

Heavy screens are lazy-loaded to reduce initial bundle size:

#### Student Screens
- **AI Predictions Screen**: Uses React.lazy() with Suspense
  - Contains heavy chart libraries (react-native-chart-kit)
  - Only loaded when user navigates to AI features
  - Location: `app/(tabs)/student/ai-predictions.tsx`

- **Homework Scanner Screen**: Lazy-loaded with camera functionality
  - Includes expo-camera (native-only)
  - Only loaded when user accesses scanner
  - Location: `app/(tabs)/student/homework-scanner.tsx`

#### Parent Screens
- Similar pattern applied to report screens with heavy visualizations

### 3. Platform-Specific Code

#### Storage Abstraction
- **Web Platform**: Uses `@react-native-async-storage/async-storage`
- **Native Platforms**: Uses `expo-secure-store` for sensitive data
- **Implementation**: `src/utils/secureStorage.ts` automatically selects appropriate storage

#### Native Module Stubs
Web stubs prevent native-only modules from being included in web bundle:
- `src/utils/stubs/camera.web.ts` - Camera stub
- `src/utils/stubs/barcode.web.ts` - Barcode scanner stub
- `src/utils/stubs/auth.web.ts` - Biometric auth stub
- `src/utils/stubs/notifications.web.ts` - Push notifications stub
- `src/utils/stubs/background.web.ts` - Background fetch stub
- `src/utils/stubs/tasks.web.ts` - Task manager stub
- `src/utils/stubs/imagePicker.web.ts` - Image picker stub

### 4. Conditional Native Imports

Screens that use native functionality include conditional imports:

```typescript
// Example from HomeworkScannerScreen.tsx
let Camera: any = null;
if (Platform.OS !== 'web') {
  try {
    Camera = require('expo-camera').Camera;
  } catch (error) {
    console.warn('expo-camera not available');
  }
}
```

This ensures native modules are never bundled for web.

### 5. App Config Optimizations

#### app.config.js
- **Platform-Specific Plugins**: Plugins configured to only load on relevant platforms
  - `expo-secure-store`: iOS and Android only
  - `expo-local-authentication`: iOS and Android only
- **Web-Specific Config**: Metro bundler with performance budgets

## Verification

### Running Bundle Analysis

```bash
# Build web bundle and analyze
npm run analyze-bundle

# Or run separately
npm run build:web
node scripts/analyze-bundle.js
```

### Verification Script

```bash
# Verify all optimizations are in place
npm run verify-web-optimization
```

This script checks:
- Platform-specific files exist
- Webpack config is properly set up
- Metro config has optimization settings
- Secure storage uses AsyncStorage on web
- Native module stubs are present

## Bundle Analysis Output

The `analyze-bundle.js` script provides:
- Total bundle size
- Individual file sizes
- Large files (> 100KB)
- Warnings if bundle exceeds 2MB threshold
- Optimization recommendations

## Performance Metrics

### Initial Load
- Code splitting ensures only essential code loads initially
- Heavy features load on-demand

### Lazy Loading
- Suspense boundaries provide loading states
- Smooth user experience during dynamic imports

## Native Module Exclusion

### Verified Excluded Modules
The following native-only modules are properly excluded from web builds:
- ✅ expo-camera
- ✅ expo-barcode-scanner
- ✅ expo-local-authentication
- ✅ expo-notifications (native features)
- ✅ expo-background-fetch
- ✅ expo-task-manager
- ✅ react-native-image-crop-picker

### Web Alternatives
- **Storage**: AsyncStorage (instead of SecureStore)
- **Camera**: Web fallback or disabled feature
- **Biometrics**: Password-only authentication
- **Notifications**: Web Push API (if needed)

## Monitoring Bundle Size

### During Development
```bash
# Watch mode with size monitoring
npm run web
```

### Before Deployment
```bash
# Production build analysis
NODE_ENV=production npm run analyze-bundle
```

## Optimization Checklist

When adding new features:

- [ ] Use dynamic imports for heavy screens (> 100KB)
- [ ] Create `.web.ts` variants for native modules
- [ ] Add conditional Platform checks before native imports
- [ ] Update webpack aliases if adding new native dependencies
- [ ] Run bundle analysis to verify size impact
- [ ] Test web build for native module errors
- [ ] Update this documentation

## Troubleshooting

### Bundle Size Exceeds 2MB

1. Run `npm run analyze-bundle` to identify large files
2. Check if new dependencies were added without web alternatives
3. Review if screens need dynamic imports
4. Verify tree-shaking is working (check unused exports)

### Native Module Errors on Web

1. Verify webpack.config.js includes alias for the module
2. Create web stub in `src/utils/stubs/`
3. Add conditional import in consuming code
4. Test web build

### Slow Initial Load

1. Review initial bundle with `analyze-bundle.js`
2. Move heavy components to dynamic imports
3. Check if large libraries can be code-split
4. Verify inline requires are enabled

## Future Optimizations

Potential areas for further optimization:
- Implement service worker for caching
- Use WebP images for better compression
- Lazy load additional route-based chunks
- Implement predictive prefetching for common routes
- Consider using SWC instead of Babel for faster builds

## References

- [Metro Bundler Configuration](https://facebook.github.io/metro/docs/configuration)
- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [React Lazy and Suspense](https://react.dev/reference/react/lazy)
- [Expo Web Support](https://docs.expo.dev/workflow/web/)

## Related Files

- `metro.config.js` - Metro bundler configuration
- `webpack.config.js` - Webpack configuration for web
- `scripts/analyze-bundle.js` - Bundle analysis script
- `scripts/verify-web-optimization.js` - Optimization verification script
- `app.config.js` - Expo configuration with platform-specific plugins

---

Last Updated: 2024
Maintained by: Development Team
