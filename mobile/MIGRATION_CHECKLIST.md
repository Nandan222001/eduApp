# Expo Router Migration Checklist

Use this checklist to verify the migration from React Navigation to Expo Router is complete and working correctly.

## Pre-Migration ✅

- [x] Backup existing code
- [x] Review current navigation structure
- [x] Document existing routes
- [x] Plan file structure

## Implementation ✅

### Core Setup

- [x] Install `expo-router` dependency
- [x] Update `package.json` main entry to `expo-router/entry`
- [x] Update `app.json` with typed routes experiment
- [x] Update `tsconfig.json` to include app directory
- [x] Update `.gitignore` for Expo Router files

### Directory Structure

- [x] Create `app/` directory
- [x] Create `app/_layout.tsx` (root layout)
- [x] Create `app/index.tsx` (root redirect)
- [x] Create `app/(auth)/` group
- [x] Create `app/(tabs)/` group
- [x] Create `app/(tabs)/student/` group
- [x] Create `app/(tabs)/parent/` group

### Authentication Routes

- [x] Create `app/(auth)/_layout.tsx`
- [x] Create `app/(auth)/login.tsx`
- [x] Create `app/(auth)/register.tsx`
- [x] Create `app/(auth)/forgot-password.tsx`
- [x] Create `app/(auth)/reset-password.tsx`

### Student Tab Routes

- [x] Create `app/(tabs)/student/_layout.tsx`
- [x] Create `app/(tabs)/student/index.tsx` (Home)
- [x] Create `app/(tabs)/student/assignments.tsx`
- [x] Create `app/(tabs)/student/schedule.tsx`
- [x] Create `app/(tabs)/student/grades.tsx`
- [x] Create `app/(tabs)/student/profile.tsx`

### Parent Tab Routes

- [x] Create `app/(tabs)/parent/_layout.tsx`
- [x] Create `app/(tabs)/parent/index.tsx` (Dashboard)
- [x] Create `app/(tabs)/parent/children.tsx`
- [x] Create `app/(tabs)/parent/communication.tsx`
- [x] Create `app/(tabs)/parent/reports.tsx`
- [x] Create `app/(tabs)/parent/profile.tsx`

### Detail Routes

- [x] Create `app/courses/index.tsx`
- [x] Create `app/courses/[id].tsx`
- [x] Create `app/assignments/[id].tsx`
- [x] Create `app/children/[id].tsx`
- [x] Create `app/messages/[id].tsx`
- [x] Create `app/notifications.tsx`
- [x] Create `app/notifications/[id].tsx`

### Common Routes

- [x] Create `app/profile.tsx`
- [x] Create `app/settings.tsx`

### Screen Component Updates

- [x] Update `LoginScreen.tsx`
- [x] Update `RegisterScreen.tsx`
- [x] Update `ForgotPasswordScreen.tsx`
- [x] Update `ResetPasswordScreen.tsx`
- [x] Update `DashboardScreen.tsx` (Student)
- [x] Update `DashboardScreen.tsx` (Parent)
- [x] Update `CoursesScreen.tsx`
- [x] Update `CourseDetailScreen.tsx`
- [x] Update `AssignmentDetailScreen.tsx`
- [x] Update `ChildDetailScreen.tsx`
- [x] Update `MessageDetailScreen.tsx`
- [x] Update `NotificationDetailScreen.tsx`
- [x] Update `ProfileScreen.tsx` (Common)
- [x] Update `SettingsScreen.tsx`
- [x] Update `NotificationsScreen.tsx`

### Type Definitions

- [x] Create `src/types/routes.ts`
- [x] Update `src/types/index.ts`
- [x] Mark `src/types/navigation.ts` as deprecated

### Documentation

- [x] Create `EXPO_ROUTER_MIGRATION.md`
- [x] Create `EXPO_ROUTER_IMPLEMENTATION_SUMMARY.md`
- [x] Create `EXPO_ROUTER_QUICK_START.md`
- [x] Create `DEPRECATED_NAVIGATORS.md`
- [x] Create `app/README.md`
- [x] Create `MIGRATION_CHECKLIST.md` (this file)

## Testing 🧪

### Authentication Flow

- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test registration
- [ ] Test forgot password
- [ ] Test reset password
- [ ] Verify protected routes redirect to login
- [ ] Verify authenticated users can't access auth screens

### Student Navigation

- [ ] Navigate to Home tab
- [ ] Navigate to Assignments tab
- [ ] Navigate to Schedule tab
- [ ] Navigate to Grades tab
- [ ] Navigate to Profile tab
- [ ] Open course detail
- [ ] Open assignment detail
- [ ] Navigate back from details

### Parent Navigation

- [ ] Navigate to Dashboard tab
- [ ] Navigate to Children tab
- [ ] Navigate to Communication tab
- [ ] Navigate to Reports tab
- [ ] Navigate to Profile tab
- [ ] Open child detail
- [ ] Open message detail
- [ ] Navigate back from details

### Common Features

- [ ] Open notifications list
- [ ] Open notification detail
- [ ] Open profile screen
- [ ] Open settings screen
- [ ] Navigate back from common screens

### Role Switching

- [ ] Switch from Student to Parent
- [ ] Switch from Parent to Student
- [ ] Verify correct tabs shown after switch
- [ ] Verify state persists during switch

### Deep Linking

- [ ] Test custom scheme: `edumobile://login`
- [ ] Test custom scheme: `edumobile://student`
- [ ] Test custom scheme: `edumobile://courses/123`
- [ ] Test HTTPS: `https://edu.app/login`
- [ ] Test HTTPS: `https://edu.app/student/assignments`
- [ ] Test invalid deep links (should redirect gracefully)

### Navigation Patterns

- [ ] Push navigation works
- [ ] Replace navigation works
- [ ] Back navigation works
- [ ] Forward navigation works (if applicable)
- [ ] Modal presentation works (if applicable)
- [ ] Bottom sheet works (if applicable)

### Type Safety

- [ ] No TypeScript errors
- [ ] Route autocomplete works in IDE
- [ ] Parameter types are correct
- [ ] Navigation methods are typed

### Performance

- [ ] App starts quickly
- [ ] Navigation is smooth
- [ ] No memory leaks
- [ ] No unnecessary re-renders
- [ ] Bundle size is reasonable

## Platform Testing 📱

### iOS

- [ ] Test on iOS simulator
- [ ] Test on physical iOS device
- [ ] Deep links work on iOS
- [ ] Back gesture works
- [ ] Tab bar displays correctly
- [ ] Navigation bar displays correctly

### Android

- [ ] Test on Android emulator
- [ ] Test on physical Android device
- [ ] Deep links work on Android
- [ ] Back button works
- [ ] Bottom navigation displays correctly
- [ ] App bar displays correctly

### Web (if applicable)

- [ ] Test in browser
- [ ] URL bar shows correct routes
- [ ] Browser back/forward works
- [ ] Deep links work

## Build Testing 🏗️

### Development Build

- [ ] Development build compiles successfully
- [ ] No build warnings related to routing
- [ ] Navigation works in dev build

### Production Build

- [ ] Production build compiles successfully
- [ ] Minification doesn't break routes
- [ ] Navigation works in production build

## Cleanup 🧹

### Code Cleanup

- [ ] Remove unused navigator files (see DEPRECATED_NAVIGATORS.md)
- [ ] Remove unused imports
- [ ] Remove commented-out code
- [ ] Update component documentation

### Dependency Cleanup

- [ ] Verify all React Navigation dependencies can be removed
  - `@react-navigation/native`
  - `@react-navigation/native-stack`
  - `@react-navigation/bottom-tabs`
  - `@react-navigation/stack`
  - ⚠️ Keep if still using other navigation features

### Git Cleanup

- [ ] Review all changes
- [ ] Commit with clear message
- [ ] Create pull request
- [ ] Get code review

## Post-Migration 📋

### Documentation

- [ ] Update README.md
- [ ] Update onboarding docs
- [ ] Update API documentation
- [ ] Create team training materials

### Team Communication

- [ ] Announce migration completion
- [ ] Schedule team walkthrough
- [ ] Share quick start guide
- [ ] Offer support for questions

### Monitoring

- [ ] Monitor error logs
- [ ] Track navigation analytics
- [ ] Watch for user-reported issues
- [ ] Monitor app performance

### Known Issues

- [ ] Document any known issues
- [ ] Create tickets for fixes
- [ ] Plan resolution timeline

## Rollback Plan 🔄

If critical issues are found:

1. **Quick Rollback**

   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Identify Issues**
   - [ ] Document the problem
   - [ ] Collect error logs
   - [ ] Identify affected screens

3. **Fix Forward**
   - [ ] Create fix branch
   - [ ] Test thoroughly
   - [ ] Deploy fix

## Sign-Off ✍️

### Developer

- [ ] All implementation tasks complete
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Code reviewed

**Developer:** ********\_********  
**Date:** ********\_********

### QA

- [ ] All test cases passed
- [ ] No critical issues found
- [ ] Regression tests passed
- [ ] Sign-off approved

**QA Engineer:** ********\_********  
**Date:** ********\_********

### Tech Lead

- [ ] Architecture approved
- [ ] Code quality approved
- [ ] Documentation approved
- [ ] Ready for production

**Tech Lead:** ********\_********  
**Date:** ********\_********

## Notes

### Issues Found During Testing

(Document any issues here)

### Performance Observations

(Document performance notes here)

### Recommendations for Future

(Document improvements or suggestions here)

---

**Migration Status**: ✅ Implementation Complete, ⏳ Testing Pending  
**Last Updated**: [Current Date]
