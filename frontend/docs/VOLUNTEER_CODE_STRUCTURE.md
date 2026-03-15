# Volunteer Feature - Code Structure Reference

## File Organization

```
frontend/src/
├── api/
│   └── volunteer.ts                          # API client for volunteer endpoints
├── components/
│   └── volunteer/
│       ├── VolunteerCertificateGenerator.tsx # Certificate display component
│       └── index.ts                          # Component exports
├── pages/
│   ├── ParentVolunteerHours.tsx             # Parent volunteer tracking page
│   ├── TeacherVolunteerVerification.tsx     # Teacher verification queue
│   ├── VolunteerLeaderboard.tsx             # Leaderboard for all roles
│   └── AdminVolunteerAnalytics.tsx          # Admin analytics dashboard
├── types/
│   └── volunteer.ts                          # TypeScript type definitions
└── App.tsx                                   # Routes configuration (modified)
```

## Type Definitions Reference

### Core Types (`types/volunteer.ts`)

```typescript
// Individual volunteer activity record
interface VolunteerActivity {
  id: number;
  activity_name: string;
  date: string;
  hours: number;
  supervisor_name: string;
  status: 'pending' | 'approved' | 'rejected';
  // ... more fields
}

// Summary with milestones
interface VolunteerHoursSummary {
  total_hours: number;
  approved_hours: number;
  milestones: Milestone[];
  activities_by_type: ActivityBreakdown[];
  // ... more fields
}

// Form submission
interface VolunteerActivityForm {
  activity_name: string;
  date: string;
  hours: number;
  supervisor_name: string;
  // ... more fields
}
```

## API Client Reference

### Usage Example

```typescript
import { volunteerApi } from '@/api/volunteer';

// Parent - Log activity
const activity = await volunteerApi.logActivity({
  activity_name: 'School Fair Helper',
  date: '2024-03-15',
  hours: 4,
  supervisor_name: 'Mrs. Smith',
});

// Teacher - Verify activity
const verified = await volunteerApi.verifyActivity({
  activity_id: 123,
  status: 'approved',
  notes: 'Great contribution!',
});

// Get leaderboard
const leaderboard = await volunteerApi.getLeaderboard(50);
```

## Component Architecture

### ParentVolunteerHours

```typescript
// Main sections:
// 1. Hours Dashboard - Stats cards with total, approved, pending, rejected
// 2. Milestone Progress - Progress bar with next milestone
// 3. Activity Breakdown - Chart showing hours by type
// 4. Activities Table - List of all logged activities
// 5. Log Hours Dialog - Form for adding/editing activities

// Key hooks:
useQuery(['volunteer-activities'], volunteerApi.getMyActivities);
useQuery(['volunteer-summary'], volunteerApi.getMySummary);
useMutation(volunteerApi.logActivity);
```

### TeacherVolunteerVerification

```typescript
// Main sections:
// 1. Pending Table - Activities awaiting verification
// 2. Expandable Rows - Additional activity details
// 3. Verification Dialog - Approve/reject with notes

// Key hooks:
useQuery(['pending-volunteer-verifications'], volunteerApi.getPendingVerifications);
useMutation(volunteerApi.verifyActivity);
```

### VolunteerLeaderboard

```typescript
// Main sections:
// 1. Stats Cards - Community overview
// 2. Tabs - Top Volunteers, Grade Competition, Community Impact
// 3. Anonymous Toggle - Privacy control

// Key hooks:
useQuery(['volunteer-leaderboard'], () => volunteerApi.getLeaderboard(50));
useQuery(['volunteer-grade-stats'], volunteerApi.getGradeStats);
useQuery(['volunteer-community-impact'], volunteerApi.getCommunityImpact);
```

### AdminVolunteerAnalytics

```typescript
// Main sections:
// 1. Date Filters - Range selection
// 2. Monthly Cards - Recent month summaries
// 3. Charts - Engagement, Activities, Distribution
// 4. Tables - Detailed activity and event data

// Key hooks:
useQuery(['volunteer-analytics', startDate, endDate], () =>
  volunteerApi.getAnalytics(startDate, endDate)
);
```

## Routes Configuration

### Parent Routes

```typescript
<Route path="/parent" element={<ParentLayout />}>
  <Route path="volunteer" element={<ParentVolunteerHours />} />
  <Route path="volunteer/leaderboard" element={<VolunteerLeaderboard />} />
</Route>
```

### Teacher Routes

```typescript
<Route path="/teacher" element={<AdminLayout />}>
  <Route path="volunteer/verification" element={<TeacherVolunteerVerification />} />
  <Route path="volunteer/leaderboard" element={<VolunteerLeaderboard />} />
</Route>
```

### Admin Routes

```typescript
<Route path="/admin" element={<AdminLayout />}>
  <Route path="volunteer/analytics" element={<AdminVolunteerAnalytics />} />
  <Route path="volunteer/leaderboard" element={<VolunteerLeaderboard />} />
</Route>
```

## State Management Patterns

### React Query Configuration

```typescript
// Query keys for caching
const queryKeys = {
  activities: ['volunteer-activities'],
  summary: ['volunteer-summary'],
  pending: ['pending-volunteer-verifications'],
  leaderboard: ['volunteer-leaderboard'],
  gradeStats: ['volunteer-grade-stats'],
  impact: ['volunteer-community-impact'],
  analytics: (startDate, endDate) => ['volunteer-analytics', startDate, endDate],
};

// Invalidation after mutations
queryClient.invalidateQueries({ queryKey: ['volunteer-activities'] });
queryClient.invalidateQueries({ queryKey: ['volunteer-summary'] });
```

### Form State

```typescript
const [formData, setFormData] = useState<VolunteerActivityForm>({
  activity_name: '',
  date: new Date().toISOString().split('T')[0],
  hours: 0,
  supervisor_name: '',
  supervisor_email: '',
  supervisor_phone: '',
  description: '',
  location: '',
});
```

## UI Components Used

### Material-UI Components

- `Container`, `Box`, `Grid` - Layout
- `Card`, `CardHeader`, `CardContent` - Content containers
- `Table`, `TableContainer`, `TableHead`, `TableBody`, `TableRow`, `TableCell` - Data display
- `Button`, `IconButton` - Actions
- `TextField`, `Select`, `MenuItem` - Form inputs
- `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` - Modals
- `Chip`, `Avatar` - Data badges
- `Alert`, `CircularProgress` - Feedback
- `LinearProgress` - Progress bars
- `Tabs`, `Tab` - Tab navigation

### Chart.js Components

- `Line` - Trend visualization
- `Bar` - Comparison charts
- `Doughnut` - Distribution charts

## Styling Patterns

### Theme Integration

```typescript
const theme = useTheme();

// Color usage
sx={{
  color: theme.palette.primary.main,
  bgcolor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`
}}
```

### Responsive Design

```typescript
// Grid breakpoints
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={4} lg={3}>
    {/* Content */}
  </Grid>
</Grid>

// Display control
sx={{
  display: { xs: 'none', md: 'block' }
}}
```

## Error Handling

### API Error Handling

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['volunteer-activities'],
  queryFn: volunteerApi.getMyActivities,
});

if (error) {
  return <Alert severity="error">Failed to load activities</Alert>;
}
```

### Mutation Error Handling

```typescript
const mutation = useMutation({
  mutationFn: volunteerApi.logActivity,
  onSuccess: () => {
    // Success handling
  },
  onError: (error) => {
    // Error handling
  },
});
```

## Best Practices Implemented

1. **TypeScript Strict Mode** - Full type safety
2. **React Query** - Efficient server state management
3. **Accessibility** - ARIA labels, keyboard navigation
4. **Responsive Design** - Mobile-first approach
5. **Loading States** - User feedback during async operations
6. **Error Boundaries** - Graceful error handling
7. **Code Splitting** - Lazy loading where appropriate
8. **Memoization** - Performance optimization
9. **Consistent Naming** - Clear, descriptive names
10. **Component Composition** - Reusable, modular code

## Testing Approach

### Component Testing

```typescript
// Test file structure
describe('ParentVolunteerHours', () => {
  it('should render hours dashboard', () => {});
  it('should open log hours dialog', () => {});
  it('should submit activity form', () => {});
  it('should handle edit activity', () => {});
  it('should delete activity with confirmation', () => {});
});
```

### API Testing

```typescript
// Mock API responses
const mockActivities = [
  /* ... */
];
jest.mock('@/api/volunteer', () => ({
  volunteerApi: {
    getMyActivities: jest.fn().mockResolvedValue(mockActivities),
  },
}));
```

## Common Patterns

### Data Fetching Pattern

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: apiFunction,
});

if (isLoading) return <CircularProgress />;
if (!data) return <Alert>No data</Alert>;
return <DataDisplay data={data} />;
```

### Mutation Pattern

```typescript
const mutation = useMutation({
  mutationFn: apiFunction,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['related-data'] });
    handleClose();
  },
});

const handleSubmit = () => {
  mutation.mutate(formData);
};
```

### Dialog Pattern

```typescript
const [open, setOpen] = useState(false);
const handleOpen = () => setOpen(true);
const handleClose = () => setOpen(false);

<Dialog open={open} onClose={handleClose}>
  {/* Dialog content */}
</Dialog>
```

## Performance Optimization

1. **React Query Caching** - Reduces API calls
2. **Memoization** - Prevents unnecessary re-renders
3. **Lazy Loading** - Splits code bundles
4. **Debouncing** - Reduces rapid API calls
5. **Virtualization** - For long lists (future enhancement)
6. **Image Optimization** - Lazy loading images
7. **Code Splitting** - Route-based splitting

## Troubleshooting Guide

### Common Issues

**Activities not loading:**

- Check API endpoint configuration
- Verify authentication token
- Check network tab for errors

**Form validation failing:**

- Ensure all required fields are filled
- Check field type validation
- Verify supervisor information

**Charts not rendering:**

- Verify Chart.js registration
- Check data format
- Ensure chart dependencies loaded

**Leaderboard not updating:**

- Check query invalidation
- Verify cache configuration
- Check mutation success handlers
