# Student Layout Structure

## File Organization

```
frontend/src/components/student/
├── StudentLayout.tsx          # Main layout wrapper
├── StudentSidebar.tsx         # Desktop sidebar navigation
├── StudentAppBar.tsx          # Top app bar with streak tracker
├── StudentBreadcrumb.tsx      # Navigation breadcrumbs
├── StudentBottomNav.tsx       # Mobile bottom navigation
├── index.ts                   # Component exports
├── README.md                  # Full documentation
├── QUICK_START.md            # Setup guide
└── STRUCTURE.md              # This file
```

## Component Hierarchy

```
StudentLayout (Main Container)
│
├─ SkipToContent
│  └─ Accessibility link to main content
│
├─ StudentAppBar (Top)
│  ├─ Menu Toggle (Desktop)
│  ├─ Hamburger Menu (Mobile)
│  ├─ Global Search Bar
│  ├─ Streak Tracker Chip (🔥)
│  ├─ Points Display Chip (🏆)
│  ├─ Accessibility Toolbar
│  ├─ Theme Toggle
│  ├─ Notifications Menu
│  └─ Profile Menu
│
├─ StudentSidebar (Left - Desktop)
│  ├─ Logo/Brand
│  └─ Navigation List
│     ├─ Dashboard
│     ├─ My Classes
│     ├─ Assignments (badge)
│     ├─ Tests
│     ├─ Study Materials (expandable)
│     │  ├─ Library
│     │  ├─ My Notes
│     │  └─ Previous Papers
│     ├─ AI Predictions (NEW badge)
│     ├─ Study Timer
│     ├─ Calendar
│     ├─ My Goals
│     ├─ Achievements
│     ├─ Doubt Forum (badge)
│     └─ AI Study Helper
│
├─ Main Content Area
│  ├─ StudentBreadcrumb (Desktop)
│  └─ Outlet (Nested Routes)
│
└─ StudentBottomNav (Bottom - Mobile)
   ├─ Dashboard
   ├─ Assignments
   ├─ AI Predict
   ├─ Materials
   └─ Rewards
```

## Props Interface

### StudentLayout

```typescript
// No props - self-contained
```

### StudentSidebar

```typescript
interface StudentSidebarProps {
  open: boolean; // Drawer open state
  drawerWidth: number; // Width of drawer
  variant?: 'permanent' | 'temporary' | 'persistent';
  onClose?: () => void; // Close handler for mobile
}
```

### StudentAppBar

```typescript
interface StudentAppBarProps {
  open: boolean; // Drawer open state
  onMenuClick: () => void; // Toggle drawer
  drawerWidth: number; // For offset calculation
}
```

### StudentBreadcrumb

```typescript
// No props - uses router location
```

### StudentBottomNav

```typescript
// No props - self-contained
```

## State Management

### Local State (StudentLayout)

```typescript
const [mobileOpen, setMobileOpen] = useState(false);
const [desktopOpen, setDesktopOpen] = useState(true);
```

### Local State (StudentSidebar)

```typescript
const [expandedItems, setExpandedItems] = useState<string[]>([]);
```

### Local State (StudentAppBar)

```typescript
const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
const [currentStreak, setCurrentStreak] = useState(0);
const [totalPoints, setTotalPoints] = useState(0);
```

### Global State (Zustand)

- `useAuthStore()` - User authentication and profile
- `useThemeStore()` - Theme mode (light/dark)

## Data Flow

```
API (Gamification)
  ↓
StudentAppBar
  ↓ (fetch on mount)
gamificationAPI.getUserPoints()
  ↓ (returns)
{ current_streak, total_points, ... }
  ↓ (display)
Streak Chip & Points Chip
```

## Navigation Flow

```
User clicks sidebar item
  ↓
navigate(path)
  ↓
React Router updates location
  ↓
Active state highlighted
  ↓
Breadcrumb updates (desktop)
  ↓
Content renders via Outlet
```

## Responsive Behavior

### Desktop (≥960px)

- Persistent sidebar (collapsible)
- Full app bar with all features
- Breadcrumbs visible
- No bottom navigation

### Tablet (600-960px)

- Drawer sidebar (can close)
- Full app bar
- Breadcrumbs visible
- No bottom navigation

### Mobile (<600px)

- Hamburger menu only
- Simplified app bar
- No breadcrumbs
- Bottom navigation visible

## Event Handlers

### StudentLayout

- `handleDrawerToggle()` - Opens/closes drawer

### StudentSidebar

- `handleToggle(itemId)` - Expands/collapses menu sections
- `handleNavigation(path)` - Navigates to route

### StudentAppBar

- `handleProfileMenuOpen()` - Opens profile menu
- `handleNotificationsMenuOpen()` - Opens notifications
- `handleMenuClose()` - Closes menus
- `handleLogout()` - Logs out user
- `loadStreakData()` - Fetches gamification data

### StudentBottomNav

- `handleChange(newValue)` - Navigates to selected item

## CSS Classes & Styling

### Theme Integration

All components use MUI's `sx` prop with theme values:

- `theme.palette.*` - Colors
- `theme.breakpoints.*` - Responsive breakpoints
- `theme.transitions.*` - Animations
- `theme.shadows.*` - Elevation
- `theme.zIndex.*` - Layering

### Custom Styling

```typescript
// Streak tracker gradient
background: 'linear-gradient(135deg, #ff5722 0%, #ff9800 100%)'

// Active navigation
bgcolor: alpha(theme.palette.primary.main, 0.08)
borderLeft: `3px solid ${theme.palette.primary.main}`

// Badge positioning
badge: { top: 8, right: 8 }
```

## Constants

```typescript
// Drawer widths
const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 64;

// Navigation items
const studentNavigation: NavItem[] = [...];

// Breadcrumb mappings
const breadcrumbNameMap: BreadcrumbMapping = {...};

// Bottom nav items
const navItems = [...];
```

## Type Definitions

### NavItem

```typescript
interface NavItem {
  id: string;
  title: string;
  path?: string;
  icon: React.ReactNode;
  badge?: number | string;
  children?: NavItem[];
}
```

### BreadcrumbMapping

```typescript
interface BreadcrumbMapping {
  [key: string]: string;
}
```

## Dependencies

### External

- `react` - Core framework
- `react-router-dom` - Routing
- `@mui/material` - UI components
- `@mui/icons-material` - Icons
- `date-fns` - Date utilities (for streak calc)

### Internal

- `@/store/useAuthStore` - Auth state
- `@/store/useThemeStore` - Theme state
- `@/api/gamification` - Gamification API
- `@/components/search/GlobalSearchBar` - Search
- `@/components/common/*` - Common components
- `@/components/mobile/*` - Mobile components

## Accessibility Attributes

### ARIA Labels

```typescript
aria-label="Main navigation"
aria-label="Main content"
aria-label="Breadcrumb"
aria-label="Account menu"
aria-label="Notifications"
aria-expanded={isOpen}
aria-haspopup="true"
```

### Roles

```typescript
role = 'main';
role = 'navigation';
role = 'menu';
```

### Tab Index

```typescript
tabIndex={-1}  // For skip-to-content target
```

## Performance Considerations

### Memoization

- Navigation items are static (no re-render)
- Menu state is local (isolated re-renders)

### Lazy Loading

- Route components loaded on demand
- Heavy components imported dynamically

### API Calls

- Gamification data fetched once on mount
- Cached in component state
- Refetch on user change only

## Testing Strategy

### Unit Tests

- Component rendering
- State management
- Event handlers
- Prop validation

### Integration Tests

- Navigation flow
- Route changes
- Menu interactions
- Responsive behavior

### E2E Tests

- Complete user journeys
- Mobile workflows
- Accessibility compliance
- Cross-browser compatibility

## Common Patterns

### Adding New Navigation Item

1. Add to `studentNavigation` array
2. Create route in App.tsx
3. Add breadcrumb mapping (if needed)
4. Test on desktop and mobile

### Styling Pattern

```typescript
sx={{
  // Base styles
  property: value,

  // Responsive
  property: { xs: value1, md: value2 },

  // State-based
  bgcolor: isActive ? 'primary.main' : 'transparent',

  // Pseudo-classes
  '&:hover': { ... },
  '&.Mui-selected': { ... },
}}
```

### Navigation Pattern

```typescript
const navigate = useNavigate();
const handleClick = () => {
  navigate('/path');
  // Optional: close mobile menu
  onClose?.();
};
```

This structure document provides a high-level overview of the StudentLayout component system architecture and implementation details.
