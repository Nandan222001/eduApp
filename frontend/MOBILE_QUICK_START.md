# Mobile Optimizations - Quick Start Guide

## Import Components

```typescript
import {
  // Navigation
  MobileBottomNav,
  MobileHamburgerMenu,

  // UI Components
  SwipeableCard,
  CollapsibleSection,
  TouchOptimizedButton,
  TouchOptimizedTextField,

  // List Components
  MobileStudentCard,
  MobileAssignmentCard,
  MobileDashboardCards,

  // Interactions
  PullToRefresh,
  MobileAttendanceMarking,

  // Utilities
  ResponsiveView,
  getDefaultDashboardCards,
} from '@/components/mobile';
```

## Common Use Cases

### 1. Add Bottom Navigation

```tsx
// In AdminLayout or main layout component
<MobileBottomNav />
```

### 2. Add Hamburger Menu

```tsx
// In AppBar component
<MobileHamburgerMenu />
```

### 3. Create Swipeable Cards

```tsx
<SwipeableCard>
  <Box>Card 1 Content</Box>
  <Box>Card 2 Content</Box>
  <Box>Card 3 Content</Box>
</SwipeableCard>
```

### 4. Add Collapsible Sections

```tsx
<CollapsibleSection
  title="Section Title"
  subtitle="Optional subtitle"
  icon={<Icon />}
  defaultExpanded={false}
>
  <Typography>Content here</Typography>
</CollapsibleSection>
```

### 5. Add Pull-to-Refresh

```tsx
<PullToRefresh
  onRefresh={async () => {
    await fetchData();
  }}
>
  <List>{/* Your list items */}</List>
</PullToRefresh>
```

### 6. Use Touch-Optimized Components

```tsx
// Buttons
<TouchOptimizedButton variant="contained" color="primary">
  Click Me
</TouchOptimizedButton>

// Text Fields
<TouchOptimizedTextField
  label="Name"
  value={value}
  onChange={handleChange}
/>
```

### 7. Create Student Cards

```tsx
<MobileStudentCard
  student={studentData}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onViewIDCard={handleViewIDCard}
/>
```

### 8. Create Assignment Cards

```tsx
<MobileAssignmentCard
  assignment={assignmentData}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onDownload={handleDownload}
/>
```

### 9. Add Dashboard Cards

```tsx
import { MobileDashboardCards, getDefaultDashboardCards } from '@/components/mobile';

const cards = getDefaultDashboardCards(user.role);

<MobileDashboardCards cards={cards} />;
```

### 10. Conditional Mobile/Desktop Rendering

```tsx
<ResponsiveView mobile={<MobilePage />} desktop={<DesktopPage />} breakpoint="md" />
```

## Mobile Page Template

```tsx
import { useState, useEffect } from 'react';
import { Box, Typography, Stack, CircularProgress, Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  PullToRefresh,
  CollapsibleSection,
  TouchOptimizedTextField,
  MobileStudentCard,
} from '@/components/mobile';

export default function MobileListPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    // Fetch your data
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Page Title
        </Typography>
        <TouchOptimizedTextField
          fullWidth
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <PullToRefresh onRefresh={fetchData}>
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={2}>
                {data.map((item) => (
                  <MobileStudentCard key={item.id} student={item} />
                ))}
              </Stack>
            )}
          </Box>
        </PullToRefresh>
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => console.log('Add new')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
```

## Responsive Styling

```tsx
// Mobile-first responsive padding
<Box sx={{ p: { xs: 2, md: 3 } }}>

// Hide on mobile
<Box sx={{ display: { xs: 'none', md: 'block' } }}>

// Show only on mobile
<Box sx={{ display: { xs: 'block', md: 'none' } }}>

// Responsive font size
<Typography sx={{ fontSize: { xs: '1rem', md: '1.5rem' } }}>

// Responsive spacing
<Stack spacing={{ xs: 1, md: 2 }}>

// Responsive grid
<Grid container spacing={{ xs: 1, md: 2 }}>
```

## Touch Target Sizes

```tsx
// Minimum button size
minHeight: 44,
minWidth: 44,

// Minimum list item height
minHeight: 48,

// Input field height
minHeight: 44,

// Icon button size
<IconButton sx={{ minWidth: 44, minHeight: 44 }}>
```

## Mobile-Specific CSS Classes

```css
/* Hide scrollbar */
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
```

## Common Breakpoints

```typescript
theme.breakpoints.down('xs'); // < 600px
theme.breakpoints.down('sm'); // < 900px
theme.breakpoints.down('md'); // < 1200px
theme.breakpoints.down('lg'); // < 1536px
theme.breakpoints.down('xl'); // < 1920px
```

## Testing on Mobile

```bash
# Local network access
npm run dev -- --host

# Then access from mobile:
http://YOUR_IP:5173
```

## Performance Tips

1. Use `React.memo()` for list items
2. Implement virtual scrolling for long lists
3. Use lazy loading for images
4. Debounce search inputs
5. Use passive event listeners

## Troubleshooting

### iOS Zoom Issues

- Ensure input font-size is 16px or larger
- Use `TouchOptimizedTextField` component

### Tap Delays

- Add `touchAction: 'manipulation'` to interactive elements
- Use provided touch-optimized components

### Viewport Issues

- Check meta viewport tag in index.html
- Ensure CSS doesn't override viewport

### Bottom Navigation Hidden

- Check if page has `pb: { xs: 8, md: 0 }` padding
- Verify z-index conflicts

## Need Help?

See full documentation in `MOBILE_OPTIMIZATIONS.md`
