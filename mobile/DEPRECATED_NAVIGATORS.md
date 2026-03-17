# Deprecated Navigator Files

The following files are deprecated after the migration to Expo Router and can be safely removed:

## Navigation Directory Files (To Remove)

### Core Navigators

- `src/navigation/RootNavigator.tsx` - Replaced by `app/_layout.tsx`
- `src/navigation/MainNavigator.tsx` - Replaced by route groups in `app/(tabs)/`
- `src/navigation/StudentTabNavigator.tsx` - Replaced by `app/(tabs)/student/_layout.tsx`
- `src/navigation/ParentTabNavigator.tsx` - Replaced by `app/(tabs)/parent/_layout.tsx`
- `src/navigation/AuthNavigator.tsx` - Replaced by `app/(auth)/_layout.tsx`

### Navigation Configuration

- `src/navigation/linking.ts` - Deep linking now handled by Expo Router automatically
- `src/navigation/index.ts` - No longer needed

## Type Files (Deprecated but Kept)

### Navigation Types

- `src/types/navigation.ts` - Kept for reference but deprecated
  - Contains old React Navigation screen props types
  - New code should use Expo Router hooks instead
  - Will be removed in future cleanup

## Removal Instructions

### Step 1: Verify Migration

Before removing these files, ensure:

1. All screens have been updated to use Expo Router hooks
2. All navigation flows work correctly
3. Deep linking has been tested
4. No imports reference these files

### Step 2: Search for Imports

```bash
# Search for any remaining imports
grep -r "from '@navigation'" mobile/src/
grep -r "RootNavigator\|MainNavigator\|StudentTabNavigator\|ParentTabNavigator\|AuthNavigator" mobile/src/
```

### Step 3: Remove Files

```bash
# Remove the navigation directory
rm -rf mobile/src/navigation/

# Or selectively remove files
rm mobile/src/navigation/RootNavigator.tsx
rm mobile/src/navigation/MainNavigator.tsx
rm mobile/src/navigation/StudentTabNavigator.tsx
rm mobile/src/navigation/ParentTabNavigator.tsx
rm mobile/src/navigation/AuthNavigator.tsx
rm mobile/src/navigation/linking.ts
rm mobile/src/navigation/index.ts
```

### Step 4: Update Imports

If any files still import from `@navigation`, update them:

**Before:**

```typescript
import { RootNavigator } from '@navigation';
```

**After:**

```typescript
// Remove the import - not needed with Expo Router
```

### Step 5: Clean Up Type References

Search for old navigation type usage:

```bash
grep -r "StackScreenProps\|TabScreenProps\|AuthStackScreenProps\|MainStackScreenProps" mobile/src/
```

Replace with Expo Router patterns:

```typescript
// Old
import { MainStackScreenProps } from '@types';
type Props = MainStackScreenProps<'CourseDetail'>;

// New
import { useRouter, useLocalSearchParams } from 'expo-router';
// No Props type needed
```

## Files to Keep

### Keep These Files

- `src/types/navigation.ts` - Temporarily keep for reference during transition
- All screen component files in `src/screens/` - These have been updated
- `src/types/routes.ts` - New Expo Router types

### Eventually Remove

After team is comfortable with Expo Router:

- `src/types/navigation.ts` - Can be deleted in next major version

## Verification Checklist

Before considering removal complete:

- [ ] No compilation errors
- [ ] No TypeScript errors
- [ ] All screens load correctly
- [ ] Tab navigation works
- [ ] Deep linking tested
- [ ] Back/forward navigation works
- [ ] Role switching functions
- [ ] No console warnings about missing routes
- [ ] Build succeeds for iOS
- [ ] Build succeeds for Android

## Rollback Plan

If issues arise after removal:

1. **Restore from Git:**

   ```bash
   git checkout HEAD -- mobile/src/navigation/
   ```

2. **Identify the Issue:**
   - Check error messages
   - Review stack traces
   - Test affected flows

3. **Fix Forward:**
   - Update screens to use Expo Router properly
   - Don't revert to old navigators

## Additional Notes

### Why Keep Types Temporarily?

The old navigation types are kept temporarily because:

1. Team familiarity - gradual transition
2. Reference during refactoring
3. Documentation of old patterns
4. Comparison for troubleshooting

### Future Cleanup

In the next major version (v2.0.0):

- Remove all deprecated navigator files
- Remove old navigation types
- Update this document
- Archive migration documentation

---

**Last Updated**: [Current Date]
**Status**: Pending Removal After Testing
**Action Required**: Verify all navigation works, then remove files
