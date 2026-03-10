# Admin Layout Implementation Guide

## Overview

This document describes the implementation of the core admin layout structure with Material Design 3 principles, featuring a responsive sidebar navigation, top app bar, breadcrumb navigation, institution switcher, and theme toggle.

## Components Implemented

### 1. AdminLayout (`frontend/src/components/admin/AdminLayout.tsx`)
Main layout container that orchestrates all admin UI components.

**Key Features:**
- Responsive drawer behavior (permanent on desktop, temporary on mobile)
- Collapsible sidebar with smooth transitions
- Adaptive drawer width based on collapsed state
- Outlet for nested route rendering

### 2. AdminSidebar (`frontend/src/components/admin/AdminSidebar.tsx`)
Navigation sidebar with hierarchical menu structure.

**Key Features:**
- Collapsible menu groups with expand/collapse animations
- Active route highlighting with visual indicators
- Role-based menu filtering
- Badge support for notifications and counts
- Icon-based navigation with text labels
- Smooth transitions for all interactions

### 3. AdminAppBar (`frontend/src/components/admin/AdminAppBar.tsx`)
Top application bar with user controls and system actions.

**Key Features:**
- Institution switcher (super admin only)
- Theme toggle button (light/dark mode)
- Notifications dropdown with unread count
- User profile dropdown with logout
- Responsive menu toggle for mobile
- Material Design 3 elevation

### 4. AdminBreadcrumb (`frontend/src/components/admin/AdminBreadcrumb.tsx`)
Automatic breadcrumb trail based on current route.

**Key Features:**
- Auto-generated from URL segments
- Clickable navigation links
- Home icon for dashboard
- Dynamic label formatting
- Current page highlighting

### 5. InstitutionSwitcher (`frontend/src/components/admin/InstitutionSwitcher.tsx`)
Dropdown for switching between institutions (super admin only).

**Key Features:**
- Institution list with logos
- Persistent selection via store
- Compact mode option
- Role-based visibility
- Material Design select component

## Supporting Infrastructure

### Theme Store (`frontend/src/store/useThemeStore.ts`)
Zustand store for managing theme mode.

**State:**
- `mode: PaletteMode` - Current theme mode (light/dark)
- `toggleTheme()` - Switches between light and dark
- `setTheme(mode)` - Sets specific theme mode

### Enhanced Auth Store (`frontend/src/store/useAuthStore.ts`)
Extended with institution selection support.

**Added:**
- `selectedInstitution: string | null` - Currently selected institution ID
- `setSelectedInstitution(id)` - Updates selected institution

### Theme Configuration (`frontend/src/theme.ts`)
Enhanced theme with light/dark mode support.

**Features:**
- Dynamic theme generation based on mode
- Material Design 3 color palette
- Custom shadows for both modes
- Component-specific overrides
- Consistent border radius and spacing

### Navigation Types (`frontend/src/types/navigation.ts`)
TypeScript interfaces for navigation structure.

**Interfaces:**
- `NavigationItem` - Menu item structure
- `BreadcrumbItem` - Breadcrumb link structure
- `Institution` - Institution data structure

### Navigation Configuration (`frontend/src/config/navigation.tsx`)
Centralized navigation menu configuration.

**Structure:**
- Hierarchical menu items
- Role-based access control
- Icon associations
- Badge support
- Path definitions

## Material Design 3 Implementation

### Elevation System
- Level 0: Base surfaces (drawers, app bar)
- Level 1: Subtle elevation for cards
- Level 2: Medium elevation for dropdowns
- Level 3: High elevation for modals
- Level 4-6: Reserved for special use cases

### Spacing Scale
- Base unit: 8px
- Padding: 8px, 16px, 24px, 32px
- Margins: 8px, 16px, 24px, 32px
- Component spacing: Consistent multiples of 8px

### Color System
- Primary: Blue (#1976d2 light, #90caf9 dark)
- Secondary: Purple (#9c27b0 light, #ce93d8 dark)
- Error: Red (#d32f2f light, #f44336 dark)
- Warning: Orange (#ed6c02 light, #ffa726 dark)
- Success: Green (#2e7d32 light, #66bb6a dark)
- Info: Light Blue (#0288d1 light, #29b6f6 dark)

### Typography Scale
- h1: 2.5rem (40px), weight 600
- h2: 2rem (32px), weight 600
- h3: 1.75rem (28px), weight 600
- h4: 1.5rem (24px), weight 600
- h5: 1.25rem (20px), weight 600
- h6: 1rem (16px), weight 600
- body1: 1rem (16px), weight 400
- body2: 0.875rem (14px), weight 400

### Transitions
- Duration: 300ms (standard)
- Easing: sharp (entering), ease-out (leaving)
- Properties: width, margin, transform, opacity

## Responsive Design

### Breakpoints
- xs: 0px (mobile portrait)
- sm: 600px (mobile landscape, tablet portrait)
- md: 900px (tablet landscape, small desktop)
- lg: 1200px (desktop)
- xl: 1536px (large desktop)

### Mobile Behavior
- Drawer: Temporary overlay
- AppBar: Full width with hamburger menu
- Sidebar: Slides in from left
- Institution switcher: Compact mode
- Breadcrumb: Truncated on small screens

### Desktop Behavior
- Drawer: Permanent with collapse option
- AppBar: Adjusted for drawer width
- Sidebar: Persistent with expand/collapse
- Institution switcher: Full display
- Breadcrumb: Full path display

## Usage Examples

### Basic Setup in App.tsx
```tsx
import { AdminLayout } from './components/admin';

<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<Dashboard />} />
  <Route path="users" element={<Users />} />
</Route>
```

### Adding Navigation Item
```tsx
// In frontend/src/config/navigation.tsx
{
  id: 'reports',
  title: 'Reports',
  path: '/admin/reports',
  icon: <AssessmentIcon />,
  roles: ['admin', 'teacher'],
  badge: 3,
}
```

### Using Theme Toggle
```tsx
import { useThemeStore } from '@/store/useThemeStore';

const { mode, toggleTheme } = useThemeStore();
// mode will be 'light' or 'dark'
// toggleTheme() switches between modes
```

### Accessing Selected Institution
```tsx
import { useAuthStore } from '@/store/useAuthStore';

const { selectedInstitution } = useAuthStore();
// Use in API calls or display logic
```

## File Structure

```
frontend/src/
├── components/
│   └── admin/
│       ├── AdminLayout.tsx
│       ├── AdminSidebar.tsx
│       ├── AdminAppBar.tsx
│       ├── AdminBreadcrumb.tsx
│       ├── InstitutionSwitcher.tsx
│       ├── index.ts
│       └── README.md
├── config/
│   └── navigation.tsx
├── store/
│   ├── useAuthStore.ts (enhanced)
│   └── useThemeStore.ts (new)
├── types/
│   └── navigation.ts (new)
├── theme.ts (enhanced)
└── main.tsx (updated)
```

## Key Design Decisions

1. **Zustand for State Management**: Lightweight, minimal boilerplate
2. **Material-UI Components**: Consistent design system, accessibility
3. **Role-Based Navigation**: Security and UX optimization
4. **Responsive First**: Mobile-optimized with progressive enhancement
5. **Theme Persistence**: localStorage-backed theme selection
6. **Type Safety**: Full TypeScript coverage
7. **Modular Architecture**: Easy to extend and maintain

## Accessibility Features

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- High contrast mode support
- Screen reader friendly
- Touch-friendly tap targets (48x48px minimum)

## Performance Considerations

- Lazy loading for route components
- Memoized theme generation
- Efficient re-render prevention
- Optimized transitions
- Code splitting by route

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Future Enhancements

1. Sidebar search functionality
2. Customizable sidebar width
3. Pinned/favorite menu items
4. Recent items history
5. Advanced notification filtering
6. Institution search in switcher
7. Keyboard shortcuts
8. Sidebar themes/skins
9. Layout presets (compact, comfortable, spacious)
10. Multi-level breadcrumb customization

## Troubleshooting

### Sidebar Not Opening on Mobile
- Check that `onMenuClick` is properly connected
- Verify `mobileOpen` state is being updated
- Ensure `variant="temporary"` is set for mobile

### Theme Not Persisting
- Verify zustand persist middleware is configured
- Check localStorage is available
- Ensure ThemeWrapper is at correct level in component tree

### Navigation Items Not Showing
- Verify role matches in navigation config
- Check user object has correct role property
- Ensure navigation config is imported correctly

### Breadcrumb Not Updating
- Verify useLocation is working
- Check route paths match expected format
- Ensure breadcrumb component is inside Router

## Contributing

When adding new features to the admin layout:

1. Follow existing code patterns
2. Maintain TypeScript type safety
3. Add proper documentation
4. Test on mobile and desktop
5. Verify accessibility
6. Update this guide
7. Keep Material Design principles

## License

This implementation is part of the EduPortal project and follows the project's license terms.
