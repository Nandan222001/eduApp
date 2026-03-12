# Student Layout - Quick Start Guide

## Installation

The StudentLayout components are already included in the codebase. No additional installation required.

## Basic Setup

### 1. Add Student Routes

In your `App.tsx` or router configuration:

```tsx
import { StudentLayout } from '@/components/student';
import StudentDashboard from '@/pages/student/Dashboard';

// In your routes
<Route path="/student" element={<StudentLayout />}>
  <Route path="dashboard" element={<StudentDashboard />} />
  <Route path="classes" element={<MyClasses />} />
  <Route path="assignments" element={<Assignments />} />
  <Route path="tests" element={<Tests />} />
  <Route path="materials/library" element={<MaterialsLibrary />} />
  <Route path="materials/notes" element={<MyNotes />} />
  <Route path="materials/papers" element={<PreviousPapers />} />
  <Route path="ai-prediction" element={<AIPrediction />} />
  <Route path="pomodoro" element={<PomodoroTimer />} />
  <Route path="calendar" element={<Calendar />} />
  <Route path="goals" element={<Goals />} />
  <Route path="gamification" element={<Gamification />} />
  <Route path="doubts" element={<DoubtForum />} />
  <Route path="chatbot" element={<AIChatbot />} />
  <Route path="profile" element={<Profile />} />
  <Route path="settings" element={<Settings />} />
</Route>;
```

### 2. Protect with Authentication

Wrap with ProtectedRoute if needed:

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

<Route
  path="/student"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <StudentLayout />
    </ProtectedRoute>
  }
>
  {/* student routes */}
</Route>;
```

## Features Overview

### Desktop Experience

- **Sidebar Navigation**: Full sidebar with collapsible sections
- **Top App Bar**: Search, streak tracker, points, notifications
- **Breadcrumbs**: Navigation path display
- **Main Content Area**: Scrollable content with responsive padding

### Mobile Experience

- **Hamburger Menu**: Slide-out drawer for full navigation
- **Simplified App Bar**: Essential features only
- **Bottom Navigation**: 5 most-used features for quick access
- **Touch-Optimized**: Large tap targets and spacing

## Key Features

### 1. Streak Tracker

Displays in the app bar:

```tsx
// Automatically fetches from gamification API
// Shows: "5 🔥" with gradient background
// Clicking navigates to /student/gamification
```

### 2. Points Display

Shows total points earned:

```tsx
// Format: Trophy icon + "1,250"
// Clicking navigates to /student/gamification
```

### 3. Notifications

Student-specific notifications:

- New assignments
- Upcoming tests
- Achievement unlocks
- Badge count shows unread items

### 4. Study Materials Navigation

Organized in collapsible section:

- Library (main materials)
- My Notes (personal notes)
- Previous Papers (exam papers)

## Customization

### Change Sidebar Items

Edit `StudentSidebar.tsx`:

```tsx
const studentNavigation: NavItem[] = [
  {
    id: 'my-feature',
    title: 'My Feature',
    path: '/student/my-feature',
    icon: <MyIcon />,
    badge: 5, // optional
  },
  // ... more items
];
```

### Change Bottom Navigation

Edit `StudentBottomNav.tsx`:

```tsx
const navItems = [
  {
    label: 'Home',
    icon: <HomeIcon />,
    path: '/student/dashboard',
  },
  // ... 4 more items (total 5)
];
```

### Add Breadcrumb Mapping

Edit `StudentBreadcrumb.tsx`:

```tsx
const breadcrumbNameMap: BreadcrumbMapping = {
  '/student/my-page': 'My Page Name',
  // ... more mappings
};
```

## Styling

### Theme Integration

The layout uses your app's theme:

- Primary color for active states
- Background colors from theme
- Responsive breakpoints
- Dark mode support

### Custom Colors

Override in theme:

```tsx
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Active navigation color
    },
    background: {
      default: '#f5f5f5', // Main content background
      paper: '#ffffff', // Sidebar/AppBar background
    },
  },
});
```

## Mobile Breakpoints

- **xs (0-600px)**: Mobile bottom nav + hamburger menu
- **sm (600-960px)**: Tablet layout with drawer
- **md (960px+)**: Desktop layout with persistent sidebar

## API Requirements

### Gamification API

For streak and points:

```tsx
// Must implement:
gamificationAPI.getUserPoints(userId, institutionId)

// Returns:
{
  current_streak: number,
  total_points: number,
  longest_streak: number,
  last_activity_date: string
}
```

### User Store

Requires auth store with:

```tsx
{
  user: {
    id: number,
    institutionId: number,
    firstName: string,
    lastName: string,
    fullName: string,
    email: string,
    avatar?: string,
  },
  logout: () => void,
}
```

## Accessibility

All components are accessible by default:

- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels and roles
- Screen reader support
- Focus management
- Skip to content link

### Keyboard Shortcuts

- `⌘K` / `Ctrl+K`: Focus search bar
- `Tab`: Navigate through elements
- `Enter`: Activate buttons/links
- `Escape`: Close menus/dialogs

## Troubleshooting

### Sidebar not showing

- Check breakpoint: sidebar hidden on mobile (<md)
- Verify drawer state management
- Check z-index conflicts

### Streak not loading

- Verify gamification API is running
- Check user.id and user.institutionId are set
- Check browser console for errors

### Bottom nav not appearing

- Only shows on mobile (<md breakpoint)
- Check if component is imported correctly
- Verify z-index is not covered

### Routes not working

- Ensure StudentLayout is parent route
- Check nested route paths (relative paths)
- Verify Outlet is present in layout

## Best Practices

1. **Keep sidebar items focused**: 10-12 items max
2. **Use badges sparingly**: Only for actionable items
3. **Update breadcrumbs**: Add new routes to mapping
4. **Test on mobile**: Verify bottom nav works
5. **Monitor performance**: Lazy load heavy components

## Examples

### Simple Student Page

```tsx
// pages/student/MyPage.tsx
export default function MyPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Page
      </Typography>
      <Paper sx={{ p: 3 }}>{/* Your content */}</Paper>
    </Box>
  );
}
```

### With Loading State

```tsx
import { Loading } from '@/components/Loading';

export default function MyPage() {
  const [loading, setLoading] = useState(true);

  if (loading) return <Loading />;

  return <Box>{/* Your content */}</Box>;
}
```

### With Error Boundary

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<Route
  path="/student"
  element={
    <ErrorBoundary>
      <StudentLayout />
    </ErrorBoundary>
  }
>
  {/* routes */}
</Route>;
```

## Support

For issues or questions:

1. Check README.md for detailed documentation
2. Review component source code
3. Check browser console for errors
4. Verify API endpoints are working

## Next Steps

1. ✅ Install and configure routes
2. ✅ Test on desktop and mobile
3. ✅ Customize navigation items
4. ✅ Connect to gamification API
5. ✅ Add your student pages
6. ✅ Test accessibility
7. ✅ Deploy and monitor
