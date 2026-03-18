# Shared Components Integration Checklist

## Pre-Installation

- [ ] Review component documentation in `/mobile/src/components/shared/README.md`
- [ ] Review theme system in `/mobile/SHARED_COMPONENTS_GUIDE.md`
- [ ] Check examples in `/mobile/SHARED_COMPONENTS_EXAMPLES.tsx`

## Installation Steps

### 1. Install Dependencies
```bash
cd mobile
npm install
```

**New Dependencies:**
- `@gorhom/bottom-sheet@^4.6.1`
- `@react-native-community/datetimepicker@^7.6.2`

**Verify Installation:**
```bash
npm list @gorhom/bottom-sheet
npm list @react-native-community/datetimepicker
```

- [ ] Dependencies installed successfully
- [ ] No peer dependency warnings

### 2. Clear Cache (Optional but Recommended)
```bash
# Clear Metro bundler cache
npx expo start --clear

# Or if using React Native CLI
npx react-native start --reset-cache
```

- [ ] Cache cleared

### 3. iOS Setup (if targeting iOS)
```bash
cd ios
pod install
cd ..
```

- [ ] Pods installed (iOS only)

## App Configuration

### 4. Wrap App with ThemeProvider

**File:** `mobile/App.tsx`

```tsx
import { ThemeProvider } from '@/theme';
import { ErrorBoundary } from '@components/shared';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        {/* Your existing app code */}
        <NavigationContainer>
          {/* ... */}
        </NavigationContainer>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

- [ ] ThemeProvider added
- [ ] ErrorBoundary wrapper added
- [ ] App still runs without errors

### 5. Verify Path Aliases

**Check that imports work:**
```tsx
import { useTheme } from '@/theme';
import { Button, Input } from '@components/shared';
```

- [ ] `@/theme` imports work
- [ ] `@components/shared` imports work
- [ ] TypeScript shows proper autocomplete

## Testing Components

### 6. Test Basic Components

Create a test screen to verify components work:

```tsx
import {
  ScreenContainer,
  Header,
  Card,
  Button,
  Input,
  LoadingSpinner,
} from '@components/shared';
import { useTheme } from '@/theme';

export const TestScreen = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <ScreenContainer>
      <Header title="Component Test" />
      <Card elevation="md">
        <Input
          label="Test Input"
          placeholder="Type here"
          leftIcon="email"
        />
        <Button
          title="Test Button"
          variant="primary"
          onPress={() => alert('Works!')}
        />
        <Button
          title="Toggle Theme"
          variant="outline"
          onPress={toggleTheme}
        />
      </Card>
    </ScreenContainer>
  );
};
```

- [ ] ScreenContainer renders
- [ ] Header displays correctly
- [ ] Card shows with elevation
- [ ] Input accepts text
- [ ] Buttons respond to press
- [ ] Theme toggle works

### 7. Test Theme Switching

- [ ] App starts with system theme (or last saved preference)
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] Theme persists after app restart
- [ ] All colors update when theme changes

### 8. Test Individual Components

**Button:**
- [ ] Primary variant works
- [ ] Secondary variant works
- [ ] Outline variant works
- [ ] Ghost variant works
- [ ] Danger variant works
- [ ] Loading state shows spinner
- [ ] Disabled state prevents press
- [ ] Icons display (left/right)

**Input:**
- [ ] Label displays
- [ ] Placeholder shows
- [ ] Text entry works
- [ ] Error message displays
- [ ] Helper text displays
- [ ] Left icon shows
- [ ] Right icon shows
- [ ] Password toggle works (secureTextEntry)

**Card:**
- [ ] None elevation works
- [ ] Small elevation works
- [ ] Base elevation works
- [ ] Medium elevation works
- [ ] Large elevation works
- [ ] XL elevation works
- [ ] Bordered variant works

**Avatar:**
- [ ] Name initials display
- [ ] Image URI loads
- [ ] Icon fallback works
- [ ] Small size works
- [ ] Medium size works
- [ ] Large size works
- [ ] XLarge size works
- [ ] Rounded style works

**Badge:**
- [ ] All variants display correctly
- [ ] Icons show in badges
- [ ] Sizes work (small, medium, large)

**EmptyState:**
- [ ] Icon displays
- [ ] Title shows
- [ ] Description shows
- [ ] CTA button works

**LoadingSpinner:**
- [ ] Small size works
- [ ] Large size works
- [ ] Text label displays
- [ ] Full screen mode works

**RefreshControl:**
- [ ] Pull to refresh works
- [ ] Loading animation shows
- [ ] Theme colors apply

### 9. Test Advanced Components

**BottomSheet:**
- [ ] Sheet opens
- [ ] Sheet closes
- [ ] Snap points work
- [ ] Backdrop dismisses
- [ ] Title displays

**DatePicker:**
- [ ] Date mode works
- [ ] Time mode works
- [ ] DateTime mode works
- [ ] Min/max dates work
- [ ] Error display works

**FilePicker:**
- [ ] File picker opens
- [ ] File selection works
- [ ] Error handling works

**ImagePicker:**
- [ ] Camera option works
- [ ] Library option works
- [ ] Image cropping works
- [ ] Selected image displays

**ErrorBoundary:**
- [ ] Catches errors
- [ ] Displays fallback UI
- [ ] Error logging works

### 10. Test Layout Components

**ScreenContainer:**
- [ ] SafeAreaView works
- [ ] Scroll mode works
- [ ] Keyboard aware mode works
- [ ] Padding control works
- [ ] Edge control works

**Header:**
- [ ] Title displays
- [ ] Subtitle displays
- [ ] Back button navigates
- [ ] Right action works

**SectionHeader:**
- [ ] Title displays
- [ ] Subtitle displays
- [ ] Icon shows
- [ ] Action link works

## Platform Testing

### 11. iOS Testing
- [ ] App runs on iOS simulator
- [ ] Components render correctly
- [ ] Theme switching works
- [ ] No layout issues
- [ ] SafeArea respected
- [ ] Keyboard avoidance works

### 12. Android Testing
- [ ] App runs on Android emulator
- [ ] Components render correctly
- [ ] Theme switching works
- [ ] No layout issues
- [ ] SafeArea respected
- [ ] Keyboard avoidance works

## Performance Testing

### 13. Performance Checks
- [ ] No lag when switching themes
- [ ] Smooth scrolling in lists
- [ ] Fast component renders
- [ ] No memory leaks
- [ ] Images load efficiently

## Documentation Review

### 14. Review Documentation
- [ ] Quick Start guide read
- [ ] Implementation guide reviewed
- [ ] Component README checked
- [ ] Examples file reviewed
- [ ] Type definitions understood

## Production Readiness

### 15. Final Checks
- [ ] All components tested
- [ ] Theme works in both modes
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] App runs on physical device
- [ ] Performance is acceptable

## Common Issues & Solutions

### Issue: Components not found
**Solution:** Check that `@components/shared` alias is configured in `babel.config.js` and `tsconfig.json`

### Issue: Theme not persisting
**Solution:** Verify `@react-native-async-storage/async-storage` is installed and linked

### Issue: Icons not showing
**Solution:** Ensure `react-native-vector-icons` is properly linked. Run `pod install` on iOS.

### Issue: BottomSheet not working
**Solution:** Verify `@gorhom/bottom-sheet` is installed and `react-native-reanimated` is configured

### Issue: DatePicker crashes
**Solution:** Ensure `@react-native-community/datetimepicker` is installed and properly linked

### Issue: Type errors
**Solution:** Restart TypeScript server in your IDE, or run `npm run type-check`

## Support

If you encounter issues:

1. Check the documentation files
2. Review the examples in `SHARED_COMPONENTS_EXAMPLES.tsx`
3. Verify all dependencies are installed
4. Clear cache and restart the bundler
5. Check that path aliases are configured correctly

## Next Steps After Integration

- [ ] Replace existing components with shared components
- [ ] Customize theme colors if needed
- [ ] Add custom components following same patterns
- [ ] Update existing screens to use new components
- [ ] Remove old component implementations
- [ ] Update team documentation

## Success Criteria

✅ All checkboxes above are checked  
✅ App runs without errors  
✅ Theme switching works  
✅ All components display correctly  
✅ Both iOS and Android work  
✅ Performance is good  

**Status:** [ ] Complete ❌ | [ ] Partial ⚠️ | [ ] Not Started 🔄

---

**Last Updated:** [Date]  
**Tested By:** [Name]  
**Platform Versions:** iOS [version], Android [version]
