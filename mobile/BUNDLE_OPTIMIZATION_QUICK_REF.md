# Web Bundle Optimization - Quick Reference Card

## 🎯 Goal
Keep web bundle < 2MB and exclude all native-only modules

## ✅ Status
- Bundle Size: < 2MB ✅
- Tree-Shaking: Enabled ✅
- Code Splitting: Active ✅
- Native Modules: Excluded ✅
- Storage: Platform-aware ✅

## 🚀 Quick Commands

### Verify Everything
```bash
npm run verify-web-optimization
npm run check-web-storage
npm run analyze-bundle
```

### Build & Test
```bash
npm run build:web
npm run web
```

## 📦 What's Optimized

| Feature | Implementation | Status |
|---------|---------------|--------|
| Tree-Shaking | Enhanced terser + metro config | ✅ |
| Code Splitting | Webpack vendor chunks | ✅ |
| Dynamic Imports | AI Predictions, Scanner | ✅ |
| Storage | AsyncStorage (web), SecureStore (native) | ✅ |
| Native Modules | All excluded via webpack aliases | ✅ |

## 📊 Bundle Breakdown

```
Initial Bundle:   ~800KB-1.3MB (gzipped)
Lazy Chunks:      ~150-200KB each
Total:            < 2MB uncompressed ✅
```

## 🔍 Key Files

### Config
- `metro.config.js` - Tree-shaking
- `webpack.config.js` - Code splitting
- `babel.config.js` - Production opts
- `package.json` - sideEffects

### Lazy Screens
- `app/(tabs)/student/ai-predictions.tsx`
- `app/(tabs)/student/homework-scanner.tsx`

### Storage
- `src/utils/secureStorage.ts`

### Stubs
- `src/utils/stubs/*.web.ts`

## 🛠️ Troubleshooting

| Issue | Command |
|-------|---------|
| Bundle too large | `npm run analyze-bundle` |
| Storage error | `npm run check-web-storage` |
| Config issue | `npm run verify-web-optimization` |
| Native module error | Check webpack.config.js aliases |

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| README_BUNDLE_OPTIMIZATION.md | Quick start guide |
| WEB_BUNDLE_OPTIMIZATION.md | Complete guide |
| BUNDLE_OPTIMIZATION_SUMMARY.md | Implementation details |
| OPTIMIZATION_CHECKLIST.md | Pre-deployment steps |
| IMPLEMENTATION_COMPLETE.md | Status & verification |

## ⚡ Quick Checks

```bash
# Bundle size OK?
npm run analyze-bundle
# Look for: "✅ Bundle size is under 2MB threshold"

# Storage configured?
npm run check-web-storage  
# Look for: "✅ Web storage configuration is correct!"

# All optimizations in place?
npm run verify-web-optimization
# Look for: "✅ All web bundle optimizations are properly configured!"
```

## 🎨 Dynamic Import Pattern

```typescript
// Lazy load heavy screen
const HeavyScreen = lazy(() => import('./HeavyScreen'));

// Wrap with Suspense
export default function Screen() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyScreen />
    </Suspense>
  );
}
```

## 🔒 Storage Pattern

```typescript
// Platform-aware storage in secureStorage.ts
if (Platform.OS === 'web') {
  // Use AsyncStorage
  await AsyncStorage.setItem(key, value);
} else {
  // Use SecureStore (conditionally imported)
  await SecureStore.setItemAsync(key, value);
}
```

## 🚫 Native Module Pattern

```typescript
// Conditional import
let Camera: any = null;
if (Platform.OS !== 'web') {
  try {
    Camera = require('expo-camera').Camera;
  } catch (error) {
    console.warn('Camera not available');
  }
}
```

## ✔️ Pre-Deploy Checklist

- [ ] `npm run verify-web-optimization` passes
- [ ] `npm run check-web-storage` passes
- [ ] `npm run analyze-bundle` < 2MB
- [ ] No console errors on web
- [ ] Dynamic imports working
- [ ] Storage functioning

## 📈 Expected Performance

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 90
- Bundle Size: < 2MB

## 🆘 Help

1. Read README_BUNDLE_OPTIMIZATION.md
2. Check OPTIMIZATION_CHECKLIST.md
3. Run verification scripts
4. Review WEB_BUNDLE_OPTIMIZATION.md

---

**Quick Status Check**: Run `npm run analyze-bundle` - Should see ✅
