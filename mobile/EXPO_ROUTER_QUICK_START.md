# Expo Router Quick Start Guide

Quick reference for working with Expo Router in the EDU Mobile app.

## Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Clear cache if needed
npx expo start -c
```

## Navigation Basics

### Import the Router Hook

```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';
```

### Navigate Between Screens

```typescript
const router = useRouter();

// Push a new screen
router.push('/courses/123');
router.push('/(auth)/login');

// Replace current screen (no back button)
router.replace('/(tabs)/student');

// Go back
router.back();

// Navigate to a specific screen in the stack
router.navigate('/notifications');
```

### Access Route Parameters

```typescript
// For /courses/[id].tsx
const { id } = useLocalSearchParams();
// id = "123" when navigating to /courses/123

// Multiple parameters
const { id, section } = useLocalSearchParams();
```

### Pass Data via Navigation

```typescript
// Using path parameters
router.push(`/courses/${courseId}`);

// Using query parameters
router.push({
  pathname: '/courses/[id]',
  params: { id: courseId, section: 'overview' },
});
```

## Common Patterns

### Protected Routes

Authentication is handled automatically in `app/_layout.tsx`. No action needed in individual screens.

### Tab Navigation

```typescript
// Navigate to a tab
router.push('/(tabs)/student/assignments');

// Tabs are defined in layout files:
// app/(tabs)/student/_layout.tsx
```

### Modal Screens

```typescript
// Present as modal (add this to screen options)
// In _layout.tsx:
<Stack.Screen
  name="modal-screen"
  options={{
    presentation: 'modal'
  }}
/>
```

### Role-Based Navigation

```typescript
import { useAppSelector } from '@store/hooks';
import { UserRole } from '@types';

const { activeRole } = useAppSelector(state => state.auth);

// Navigation based on role
if (activeRole === UserRole.STUDENT) {
  router.push('/(tabs)/student');
} else if (activeRole === UserRole.PARENT) {
  router.push('/(tabs)/parent');
}
```

## File Structure Quick Reference

```
app/
├── (auth)/           → Authentication screens (hidden from URL)
├── (tabs)/
│   ├── student/     → Student tab navigator
│   └── parent/      → Parent tab navigator
├── courses/
│   ├── index.tsx    → /courses
│   └── [id].tsx     → /courses/:id
└── _layout.tsx      → Root layout
```

## Route Examples

| File Path                      | URL              | Description   |
| ------------------------------ | ---------------- | ------------- |
| `app/index.tsx`                | `/`              | Root redirect |
| `app/(auth)/login.tsx`         | `/login`         | Login screen  |
| `app/(tabs)/student/index.tsx` | `/student`       | Student home  |
| `app/courses/[id].tsx`         | `/courses/123`   | Course detail |
| `app/notifications.tsx`        | `/notifications` | Notifications |

## Adding New Routes

### 1. Simple Route

```bash
# Create file
touch app/new-screen.tsx
```

```typescript
// app/new-screen.tsx
export default function NewScreen() {
  return <View>...</View>;
}
```

### 2. Dynamic Route

```bash
# Create file
touch app/items/[id].tsx
```

```typescript
// app/items/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  return <View><Text>Item {id}</Text></View>;
}
```

### 3. Layout with Children

```bash
# Create layout
touch app/section/_layout.tsx
```

```typescript
// app/section/_layout.tsx
import { Stack } from 'expo-router';

export default function SectionLayout() {
  return <Stack />;
}
```

## TypeScript Types

### Route Parameters

```typescript
// Automatically typed with experiments.typedRoutes = true
const params = useLocalSearchParams<{
  id: string;
  section?: string;
}>();
```

### Navigation

```typescript
import type { Router } from 'expo-router';

const router = useRouter();
// TypeScript knows all valid routes
```

## Common Tasks

### Link Component

```typescript
import { Link } from 'expo-router';

<Link href="/courses/123">View Course</Link>
<Link href={{ pathname: '/courses/[id]', params: { id: '123' } }}>
  View Course
</Link>
```

### Programmatic Navigation

```typescript
const router = useRouter();

// After form submission
const handleSubmit = async () => {
  await submitData();
  router.push('/success');
};
```

### Get Current Route

```typescript
import { usePathname, useSegments } from 'expo-router';

const pathname = usePathname(); // "/courses/123"
const segments = useSegments(); // ["courses", "123"]
```

### Navigation Events

```typescript
import { useFocusEffect } from 'expo-router';

useFocusEffect(
  useCallback(() => {
    // Screen focused
    fetchData();

    return () => {
      // Screen unfocused (cleanup)
    };
  }, [])
);
```

## Debugging

### Enable Debug Mode

```typescript
// app/_layout.tsx
if (__DEV__) {
  const segments = useSegments();
  console.log('Current route:', segments.join('/'));
}
```

### Check Route Manifest

```bash
# View generated routes
npx expo customize tsconfig.json
# Routes are in .expo/types/router.d.ts
```

### Common Errors

**"No route named X"**

- Check file exists in `app/` directory
- Verify file exports default component
- Restart dev server with `-c` flag

**"Cannot read params"**

- Use `useLocalSearchParams()` instead of `route.params`
- Check parameter name matches file name `[paramName].tsx`

**"Navigation not working"**

- Verify you're using `router.push()` not `navigation.navigate()`
- Check route path is correct (include leading `/`)

## Testing Deep Links

### iOS Simulator

```bash
xcrun simctl openurl booted edumobile://courses/123
```

### Android Emulator

```bash
adb shell am start -W -a android.intent.action.VIEW -d "edumobile://courses/123" com.edu.mobile
```

### Physical Device

Create QR code with:

```
edumobile://courses/123
```

## Best Practices

1. **Use hooks, not props**
   - ✅ `const router = useRouter()`
   - ❌ `({ navigation }) => ...`

2. **Type your parameters**
   - ✅ `const { id } = useLocalSearchParams<{ id: string }>()`
   - ❌ `const { id } = useLocalSearchParams()`

3. **Use replace for auth flows**
   - ✅ `router.replace('/(auth)/login')`
   - ❌ `router.push('/(auth)/login')`

4. **Leverage file-based routing**
   - ✅ Create files in `app/` directory
   - ❌ Define routes programmatically

5. **Use layouts for shared UI**
   - ✅ Create `_layout.tsx` files
   - ❌ Duplicate navigation setup

## Resources

- [Full Migration Guide](./EXPO_ROUTER_MIGRATION.md)
- [Implementation Summary](./EXPO_ROUTER_IMPLEMENTATION_SUMMARY.md)
- [Expo Router Docs](https://docs.expo.dev/router/)
- [API Reference](https://docs.expo.dev/router/reference/api/)

## Need Help?

1. Check this guide
2. Review `EXPO_ROUTER_MIGRATION.md`
3. Check Expo Router documentation
4. Ask the team

---

**Quick Tip**: Type `router.` in VS Code to see all available navigation methods with autocomplete!
