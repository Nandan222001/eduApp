# Admin Layout Components

This directory contains the core admin layout structure for the application, implementing Material Design 3 principles with a responsive, modern interface.

## Components

### AdminLayout

Main layout wrapper that combines all admin components.

**Features:**

- Responsive drawer (permanent on desktop, temporary on mobile)
- Collapsible sidebar navigation
- Smooth transitions and animations
- Mobile-first approach
- Proper spacing and elevation

**Usage:**

```tsx
import { AdminLayout } from '@/components/admin';

// In your routing
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<Dashboard />} />
  {/* Other routes */}
</Route>;
```

### AdminSidebar

Collapsible navigation sidebar with role-based menu items.

**Features:**

- Hierarchical navigation with collapsible sub-menus
- Active route highlighting
- Badge support for notifications
- Icon-based navigation
- Role-based filtering
- Smooth expand/collapse animations

**Props:**

- `open: boolean` - Controls sidebar visibility
- `drawerWidth: number` - Width of the drawer
- `variant: 'permanent' | 'temporary' | 'persistent'` - Drawer behavior
- `onClose?: () => void` - Callback for closing mobile drawer

### AdminAppBar

Top application bar with user controls and notifications.

**Features:**

- Institution switcher (for super admin)
- Theme toggle (light/dark mode)
- Notifications dropdown with unread count
- User profile dropdown
- Responsive layout
- Material Design 3 elevation

**Props:**

- `open: boolean` - Current drawer state
- `onMenuClick: () => void` - Handler for menu toggle
- `drawerWidth: number` - Current drawer width

### AdminBreadcrumb

Automatic breadcrumb navigation based on current route.

**Features:**

- Auto-generated from URL path
- Clickable navigation links
- Home icon for root
- Material Design styling
- Smooth hover effects

### InstitutionSwitcher

Dropdown for super admins to switch between institutions.

**Features:**

- Institution logo display
- Searchable institution list
- Compact mode for mobile
- Persistent selection
- Only visible for admin role

**Props:**

- `compact?: boolean` - Show compact version

## Theme System

The layout uses a theme store for managing light/dark mode:

```tsx
import { useThemeStore } from '@/store/useThemeStore';

const { mode, toggleTheme, setTheme } = useThemeStore();
```

## Navigation Configuration

Navigation items are configured in `@/config/navigation.tsx`:

```tsx
export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/admin',
    icon: <DashboardIcon />,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    id: 'users',
    title: 'Users',
    icon: <PeopleIcon />,
    roles: ['admin'],
    children: [
      {
        id: 'users-students',
        title: 'Students',
        path: '/admin/users/students',
        icon: <PersonIcon />,
      },
    ],
  },
];
```

## Material Design 3 Principles

The admin layout implements MD3 guidelines:

### Elevation

- Uses proper elevation levels (0-6)
- Contextual shadows based on theme mode
- Subtle elevation for cards and papers

### Spacing

- Consistent spacing scale (8px base unit)
- Proper padding and margins
- Responsive spacing for different screen sizes

### Typography

- Clear hierarchy with proper font weights
- Legible font sizes
- Responsive typography

### Colors

- Proper color contrast ratios
- Theme-aware color palette
- Alpha transparency for overlays

### Interactions

- Smooth transitions (300ms)
- Hover states on interactive elements
- Focus indicators for accessibility
- Touch-friendly targets on mobile

## Responsive Breakpoints

```tsx
xs: 0px     // Mobile
sm: 600px   // Tablet
md: 900px   // Small Desktop
lg: 1200px  // Large Desktop
xl: 1536px  // Extra Large
```

## Customization

### Changing Drawer Width

Edit constants in `AdminLayout.tsx`:

```tsx
const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 64;
```

### Adding New Navigation Items

Add items to `@/config/navigation.tsx`:

```tsx
{
  id: 'new-feature',
  title: 'New Feature',
  path: '/admin/new-feature',
  icon: <NewIcon />,
  roles: ['admin'],
  badge: 5, // Optional notification badge
}
```

### Customizing Theme

Modify `@/theme.ts` to adjust:

- Color palette
- Typography
- Shadows
- Border radius
- Component overrides

## Accessibility

The layout includes:

- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader friendly
- High contrast support

## Best Practices

1. **Always use role-based access control** for navigation items
2. **Keep sidebar items under 10** for better UX
3. **Use meaningful icons** that represent the feature
4. **Maintain consistent spacing** across all pages
5. **Test on mobile devices** for responsive behavior
6. **Use theme variables** instead of hardcoded colors
7. **Follow Material Design guidelines** for new components

## Dependencies

- @mui/material (^5.15.6)
- @mui/icons-material (^5.15.6)
- react-router-dom (^6.21.3)
- zustand (^4.5.0)
