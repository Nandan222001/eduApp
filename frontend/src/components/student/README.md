# Student Layout Components

This directory contains the layout components specifically designed for the student portal experience.

## Components

### StudentLayout

Main layout component that wraps the entire student portal. It handles:

- Responsive sidebar management
- Mobile/desktop view switching
- Page transitions
- Layout structure

**Usage:**

```tsx
import { StudentLayout } from '@/components/student';

// In your route configuration
<Route path="/student" element={<StudentLayout />}>
  <Route path="dashboard" element={<StudentDashboard />} />
  {/* other student routes */}
</Route>;
```

### StudentSidebar

Simplified sidebar navigation optimized for student workflows with study-centric sections:

- **My Classes** - Quick access to enrolled classes
- **Assignments** - View and submit assignments (with badge count)
- **Tests** - Upcoming tests and exam schedules
- **Study Materials** - Organized library with sub-sections:
  - Library
  - My Notes
  - Previous Papers
- **AI Predictions** - AI-powered exam predictions (NEW badge)
- **Study Timer** - Pomodoro timer for focused study sessions
- **Calendar** - Academic calendar and schedules
- **My Goals** - Personal learning goals tracker
- **Achievements** - Gamification and rewards
- **Doubt Forum** - Ask questions and help peers (with badge count)
- **AI Study Helper** - Chatbot for instant help

**Features:**

- Collapsible sidebar for desktop
- Active route highlighting
- Badge notifications for pending items
- Smooth animations and transitions
- Keyboard accessible

### StudentAppBar

Student-friendly app bar with quick access features:

- **Search Bar** - Global search for content
- **Streak Tracker** - Displays current learning streak with fire emoji 🔥
- **Points Display** - Shows total gamification points
- **Notifications** - Student-relevant notifications (assignments, tests, achievements)
- **Theme Toggle** - Light/dark mode switch
- **Accessibility Menu** - Font size, contrast, motion settings
- **Profile Menu** - Shows streak and points in dropdown

**Special Features:**

- Streak counter with gradient styling
- Points badge that links to gamification page
- Student-focused notifications
- Mobile-optimized layout

### StudentBreadcrumb

Navigation breadcrumbs for better orientation within the student portal:

- Home icon links to dashboard
- Current page hierarchy
- Desktop only (hidden on mobile)
- All student routes supported

### StudentBottomNav

Mobile-optimized bottom navigation tailored for student workflows:

- **Dashboard** - Quick return to home
- **Assignments** - Most accessed feature
- **AI Predict** - Quick access to predictions
- **Materials** - Study materials library
- **Rewards** - Gamification and achievements

**Features:**

- Fixed bottom position on mobile
- Active state highlighting
- Touch-optimized sizing
- Hidden on desktop (≥md breakpoint)

## Design Philosophy

### Student-Centric Design

- Simplified navigation focused on study activities
- Quick access to frequently used features
- Gamification elements to encourage engagement
- Mobile-first approach for on-the-go studying

### Visual Hierarchy

- Primary actions are prominently displayed
- Color coding for different sections
- Badge notifications for actionable items
- Gradient styling for motivational elements (streak, achievements)

### Responsive Design

- Drawer sidebar on desktop
- Bottom navigation on mobile
- Collapsible sections for better space usage
- Touch-optimized controls on mobile

## Integration with Gamification

The student layout deeply integrates with the gamification system:

- **Streak Tracker**: Real-time display of learning streaks
- **Points System**: Total points visible in app bar
- **Achievement Notifications**: Toast notifications for unlocked achievements
- **Visual Motivation**: Fire emoji and gradient colors to encourage daily engagement

## Accessibility

All components follow accessibility best practices:

- Keyboard navigation support
- ARIA labels and roles
- Skip to content link
- High contrast support
- Screen reader friendly
- Focus management

## Mobile Optimizations

### Touch Targets

- Minimum 44x44px touch targets
- Adequate spacing between interactive elements
- Swipeable drawers on mobile

### Performance

- Lazy loading of navigation items
- Optimized re-renders
- Smooth transitions (respects reduced motion)

### Layout

- Bottom navigation for thumb-friendly access
- Hamburger menu for extended navigation
- Simplified app bar on mobile
- Responsive padding and spacing

## Customization

### Drawer Width

```tsx
const DRAWER_WIDTH = 280; // Default
const COLLAPSED_DRAWER_WIDTH = 64; // Collapsed state
```

### Navigation Items

Edit the `studentNavigation` array in `StudentSidebar.tsx` to add/modify menu items.

### Bottom Nav Items

Edit the `navItems` array in `StudentBottomNav.tsx` to customize mobile navigation.

### Breadcrumb Mappings

Add route mappings in `breadcrumbNameMap` in `StudentBreadcrumb.tsx`.

## Dependencies

- React Router (navigation)
- Material-UI (components)
- Zustand stores (auth, theme)
- Gamification API (streak/points)

## Notes

- The layout automatically handles role-based access (student role required)
- Streak and points data is fetched from gamification API
- Mock notifications are used; replace with real notification system
- All components are TypeScript with proper type definitions
