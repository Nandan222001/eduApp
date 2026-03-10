# Admin Layout Quick Start Guide

## 🚀 Quick Setup

### 1. Import and Use AdminLayout
```tsx
// In App.tsx or your routing file
import { AdminLayout } from '@/components/admin';

<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<Dashboard />} />
  <Route path="users" element={<Users />} />
</Route>
```

### 2. Add Navigation Item
```tsx
// In frontend/src/config/navigation.tsx
{
  id: 'my-feature',
  title: 'My Feature',
  path: '/admin/my-feature',
  icon: <MyIcon />,
  roles: ['admin', 'teacher'],
  badge: 5, // Optional
}
```

### 3. Use Theme Toggle
```tsx
import { useThemeStore } from '@/store/useThemeStore';

const { mode, toggleTheme } = useThemeStore();
```

### 4. Access Selected Institution
```tsx
import { useAuthStore } from '@/store/useAuthStore';

const { selectedInstitution } = useAuthStore();
```

## 📦 Component Imports

```tsx
// Import all
import { 
  AdminLayout, 
  AdminSidebar, 
  AdminAppBar, 
  AdminBreadcrumb,
  InstitutionSwitcher 
} from '@/components/admin';

// Import individual
import AdminLayout from '@/components/admin/AdminLayout';
```

## 🎨 Customization Examples

### Change Drawer Width
```tsx
// In AdminLayout.tsx
const DRAWER_WIDTH = 300; // Default: 280
const COLLAPSED_DRAWER_WIDTH = 80; // Default: 64
```

### Add Nested Menu
```tsx
{
  id: 'reports',
  title: 'Reports',
  icon: <ReportsIcon />,
  children: [
    {
      id: 'reports-sales',
      title: 'Sales Report',
      path: '/admin/reports/sales',
      icon: <SalesIcon />,
    },
    {
      id: 'reports-users',
      title: 'Users Report',
      path: '/admin/reports/users',
      icon: <UsersIcon />,
    },
  ],
}
```

### Customize Theme Colors
```tsx
// In theme.ts
primary: {
  main: '#YOUR_COLOR',
  light: '#YOUR_LIGHT_COLOR',
  dark: '#YOUR_DARK_COLOR',
}
```

## 🔧 Common Tasks

### Add New Page
1. Create component: `frontend/src/pages/MyPage.tsx`
2. Add route in `App.tsx`: `<Route path="my-page" element={<MyPage />} />`
3. Add navigation item in `config/navigation.tsx`

### Hide Menu for Role
```tsx
{
  id: 'admin-only',
  title: 'Admin Only',
  path: '/admin/admin-only',
  icon: <LockIcon />,
  roles: ['admin'], // Only admins see this
}
```

### Add Badge Count
```tsx
{
  id: 'notifications',
  title: 'Notifications',
  path: '/admin/notifications',
  icon: <NotificationsIcon />,
  badge: unreadCount, // Dynamic count
}
```

## 🎯 Key Features

| Feature | Component | Props/Usage |
|---------|-----------|-------------|
| Sidebar | `AdminSidebar` | `open`, `drawerWidth`, `variant` |
| App Bar | `AdminAppBar` | `open`, `onMenuClick`, `drawerWidth` |
| Breadcrumb | `AdminBreadcrumb` | Auto-generated from URL |
| Institution | `InstitutionSwitcher` | `compact` (optional) |
| Theme | `useThemeStore()` | `mode`, `toggleTheme()` |

## 📱 Responsive Behavior

| Breakpoint | Drawer | App Bar | Behavior |
|------------|--------|---------|----------|
| xs (0-600px) | Temporary | Full width | Overlay drawer |
| sm (600-900px) | Permanent | Adjusted | Collapsible |
| md+ (900px+) | Permanent | Adjusted | Collapsible |

## 🎭 Role Access

| Role | Visible Menus |
|------|---------------|
| Admin | All menus |
| Teacher | Dashboard, Academic, Assignments, etc. |
| Student | Dashboard, Assignments, Attendance, etc. |

## 🔑 Store APIs

### Theme Store
```tsx
const { mode, toggleTheme, setTheme } = useThemeStore();

mode // 'light' | 'dark'
toggleTheme() // Switch theme
setTheme('dark') // Set specific theme
```

### Auth Store (Enhanced)
```tsx
const { selectedInstitution, setSelectedInstitution } = useAuthStore();

selectedInstitution // string | null
setSelectedInstitution('inst-id') // Update selection
```

## 🎨 Material Design 3

### Elevation Levels
```tsx
elevation={0} // No shadow
elevation={1} // Subtle
elevation={2} // Medium
elevation={3} // High
```

### Spacing Scale
```tsx
sx={{ p: 1 }}  // 8px
sx={{ p: 2 }}  // 16px
sx={{ p: 3 }}  // 24px
sx={{ m: 2 }}  // 16px margin
sx={{ gap: 2 }} // 16px gap
```

### Typography
```tsx
<Typography variant="h4">Heading</Typography>
<Typography variant="body1">Body text</Typography>
<Typography variant="caption">Small text</Typography>
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Sidebar not showing | Check user role matches navigation item |
| Theme not persisting | Verify localStorage is enabled |
| Menu not expanding | Check `expandedItems` state |
| Breadcrumb wrong | Verify route path structure |

## 📚 File Locations

```
frontend/src/
├── components/admin/     # Admin components
├── config/navigation.tsx # Menu configuration
├── store/useThemeStore.ts # Theme state
├── store/useAuthStore.ts  # Auth state
├── types/navigation.ts    # Type definitions
└── theme.ts              # Theme configuration
```

## 🔗 Related Documentation

- [Full Implementation Guide](./ADMIN_LAYOUT_IMPLEMENTATION.md)
- [Component Structure](./frontend/src/components/admin/STRUCTURE.md)
- [Component README](./frontend/src/components/admin/README.md)
- [Summary](./ADMIN_LAYOUT_SUMMARY.md)

## ⚡ Performance Tips

1. Use `React.memo()` for heavy components
2. Lazy load route components
3. Debounce search inputs
4. Use virtual scrolling for long lists
5. Minimize state updates

## 🎯 Best Practices

✅ **DO:**
- Use role-based access control
- Keep menu items under 10 top-level
- Use meaningful icons
- Test on mobile devices
- Follow Material Design guidelines

❌ **DON'T:**
- Hardcode colors (use theme)
- Ignore accessibility
- Create deep nesting (max 2 levels)
- Override theme inconsistently
- Forget to test dark mode

## 💡 Pro Tips

1. **Custom Breadcrumb**: Override `AdminBreadcrumb` for custom logic
2. **Persistent Sidebar State**: Store collapse state in localStorage
3. **Keyboard Shortcuts**: Add global shortcuts for navigation
4. **Search Sidebar**: Implement menu search for better UX
5. **Favorites**: Add "pin" feature for frequently used items

## 🚀 Next Steps

1. ✅ Setup complete
2. 📝 Create your pages
3. 🎨 Customize theme
4. 📱 Test responsive
5. 🎯 Deploy!

---

**Need Help?** Check the full documentation or raise an issue.
