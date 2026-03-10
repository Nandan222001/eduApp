# Admin Layout Structure

## Component Hierarchy

```
AdminLayout
├── AdminAppBar (Fixed Top)
│   ├── MenuIcon (Mobile Toggle)
│   ├── InstitutionSwitcher (Admin Only)
│   ├── ThemeToggle (Light/Dark)
│   ├── NotificationsMenu
│   │   ├── Badge (Unread Count)
│   │   └── NotificationsList
│   └── UserProfileMenu
│       ├── Avatar
│       ├── UserInfo
│       ├── ProfileLink
│       ├── SettingsLink
│       └── LogoutButton
│
├── AdminSidebar (Left Drawer)
│   ├── Logo/Brand
│   └── NavigationList
│       ├── DashboardItem
│       ├── InstitutionsGroup (Admin Only)
│       │   ├── AllInstitutions
│       │   └── AddInstitution
│       ├── UsersGroup (Admin Only)
│       │   ├── Students
│       │   ├── Teachers
│       │   └── Administrators
│       ├── AcademicGroup
│       │   ├── Classes
│       │   ├── Subjects
│       │   └── Syllabus
│       ├── Assignments (Badge)
│       ├── ExaminationsGroup
│       │   ├── Schedule
│       │   ├── Results
│       │   └── Analysis
│       ├── Attendance
│       ├── GamificationGroup
│       │   ├── Achievements
│       │   └── Leaderboard
│       ├── CommunicationGroup
│       │   ├── Announcements (Badge)
│       │   └── Messages
│       ├── Analytics
│       └── Settings
│
├── Main Content Area
│   ├── AdminBreadcrumb
│   │   ├── HomeIcon + Link
│   │   ├── Separator
│   │   ├── ParentLinks (if nested)
│   │   └── CurrentPage
│   │
│   └── Outlet (Router Content)
│       └── [Dynamic Page Components]
│           ├── Dashboard
│           ├── Users
│           ├── Settings
│           └── ... (other pages)
```

## Layout Flow (Visual)

```
┌─────────────────────────────────────────────────────────────────┐
│ AdminAppBar (Fixed, Full Width)                                 │
│ [☰] [Institution ▼] ...................... [🌙][🔔][👤▼]       │
└─────────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────────────────────────────┐
│              │                                                   │
│ AdminSidebar │ Main Content Area                                │
│ (Collapsible)│                                                   │
│              │ ┌─────────────────────────────────────────────┐  │
│ 📊 Dashboard │ │ AdminBreadcrumb                             │  │
│ 🏢 Instit... │ │ Home > Users > Students                     │  │
│ 👥 Users ▼   │ └─────────────────────────────────────────────┘  │
│   👨 Students│                                                   │
│   👨‍🏫 Teacher│ ┌─────────────────────────────────────────────┐  │
│   👨‍💼 Admins │ │                                             │  │
│ 📚 Academic ▼│ │                                             │  │
│ 📝 Assignm...│ │         Page Content (Outlet)               │  │
│ 📊 Exams ▼   │ │                                             │  │
│ 📅 Attend... │ │                                             │  │
│ 🏆 Gamifi... │ │                                             │  │
│ 💬 Commun... │ │                                             │  │
│ 📈 Analytics │ │                                             │  │
│ ⚙️  Settings │ │                                             │  │
│              │ └─────────────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────────────┘
```

## Mobile Layout Flow

```
┌─────────────────────────────────────────┐
│ AdminAppBar (Full Width)                │
│ [☰] ................... [🌙][🔔][👤▼]  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Main Content Area (Full Width)          │
│                                          │
│ ┌───────────────────────────────────┐   │
│ │ AdminBreadcrumb                   │   │
│ │ Home > Users                      │   │
│ └───────────────────────────────────┘   │
│                                          │
│ ┌───────────────────────────────────┐   │
│ │                                   │   │
│ │      Page Content (Outlet)        │   │
│ │                                   │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘

[Sidebar appears as overlay when ☰ is tapped]
┌──────────────┐
│ AdminSidebar │
│ (Overlay)    │
│              │
│ 📊 Dashboard │
│ 🏢 Instit... │
│ ...          │
└──────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        User Actions                          │
└────────┬───────────┬────────────┬───────────┬───────────────┘
         │           │            │           │
         ▼           ▼            ▼           ▼
    [Theme      [Navigate]  [Select     [Logout]
     Toggle]                 Inst.]
         │           │            │           │
         ▼           ▼            ▼           ▼
  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐
  │ Theme    │ │ Router  │ │ Auth     │ │ Auth    │
  │ Store    │ │ State   │ │ Store    │ │ Store   │
  └────┬─────┘ └────┬────┘ └────┬─────┘ └────┬────┘
       │            │            │             │
       ▼            ▼            ▼             ▼
  [Update     [Navigate    [Update      [Clear User
   Theme]      to Page]     Selected     & Redirect]
                             Inst.]
       │            │            │             │
       └────────────┴────────────┴─────────────┘
                    │
                    ▼
            [UI Re-renders]
```

## Data Flow

```
Navigation Config (navigation.tsx)
         │
         ▼
    AdminSidebar ──────────> Filter by User Role
         │                          │
         │                          ▼
         │                   Show Allowed Items
         │                          │
         │                          ▼
         │                   Render Menu Items
         │                          │
         ▼                          ▼
    User Click ────────────> Navigate to Path
         │                          │
         ▼                          ▼
    Update URL ────────────> AdminBreadcrumb
         │                   (Auto-generate)
         │                          │
         ▼                          ▼
    Render Outlet ──────────> Load Page Component
```

## Theme Flow

```
useThemeStore (Zustand)
         │
         ├── mode: 'light' | 'dark'
         ├── toggleTheme()
         └── setTheme(mode)
              │
              ▼
         getTheme(mode)
              │
              ├── Generate Palette
              ├── Generate Typography
              ├── Generate Shadows
              └── Component Overrides
                   │
                   ▼
              ThemeProvider
                   │
                   ├── AdminLayout
                   ├── AdminAppBar
                   ├── AdminSidebar
                   ├── AdminBreadcrumb
                   └── All Child Components
```

## Responsive Breakpoints Flow

```
useMediaQuery(theme.breakpoints)
         │
         ├── down('sm') ──> isMobile = true
         │                       │
         │                       ├── Drawer: temporary
         │                       ├── Width: DRAWER_WIDTH (280px)
         │                       └── AppBar: full width
         │
         └── up('sm') ───> isMobile = false
                                │
                                ├── Drawer: permanent
                                ├── Width: collapsible (280px/64px)
                                └── AppBar: adjusted width
```

## Role-Based Access Flow

```
User Login
    │
    ▼
Set User Role in AuthStore
    │
    ├── role: 'admin'
    ├── role: 'teacher'
    └── role: 'student'
         │
         ▼
Navigation Rendering
         │
         ├── Check item.roles
         ├── Compare with user.role
         └── Filter menu items
              │
              ├── Show: Dashboard (all)
              ├── Show: Institutions (admin)
              ├── Show: Users (admin)
              ├── Show: Academic (admin, teacher)
              └── ...
```

## Event Flow

```
User Interaction
    │
    ├── Click Menu Item
    │   ├── Has Children? ──> Toggle Expand/Collapse
    │   └── Has Path? ────> Navigate to Path
    │
    ├── Click Theme Toggle
    │   └── toggleTheme() ──> Update Store ──> Re-render
    │
    ├── Click Notification
    │   └── Open Dropdown ──> Show Notifications
    │
    ├── Click User Avatar
    │   └── Open Menu ──> Show Profile/Settings/Logout
    │
    └── Select Institution
        └── setSelectedInstitution() ──> Update Store
```

## Performance Optimizations

```
Component Level:
├── Memoized Theme Generation (useMemo)
├── Conditional Rendering (role-based)
├── Lazy Loading (route components)
└── Efficient Updates (Zustand)

Rendering Level:
├── Virtual Scrolling (long lists)
├── Debounced Search (future)
├── Throttled Resize (responsive)
└── Optimized Transitions (CSS)

State Level:
├── Persistent Storage (localStorage)
├── Selective Re-renders (Zustand selectors)
├── Minimal State Updates
└── Batched Updates (React 18)
```
