# Volunteer Feature - Quick Start Guide

## Overview

This guide will help you quickly understand and work with the volunteer hour tracking feature.

## Prerequisites

- Node.js 16+ and npm/yarn installed
- React and TypeScript knowledge
- Material-UI familiarity
- React Query basics

## Installation

The feature is already integrated. No additional packages needed beyond what's in the project.

## Quick Navigation

### As a Developer

**Working on Parent Features?**
→ `frontend/src/pages/ParentVolunteerHours.tsx`

**Working on Teacher Features?**
→ `frontend/src/pages/TeacherVolunteerVerification.tsx`

**Working on Leaderboard?**
→ `frontend/src/pages/VolunteerLeaderboard.tsx`

**Working on Analytics?**
→ `frontend/src/pages/AdminVolunteerAnalytics.tsx`

**Need to modify API calls?**
→ `frontend/src/api/volunteer.ts`

**Need to modify types?**
→ `frontend/src/types/volunteer.ts`

## Quick Code Examples

### 1. Add a New Field to Activity Form

```typescript
// Step 1: Update type (types/volunteer.ts)
interface VolunteerActivityForm {
  // ... existing fields
  new_field: string;
}

// Step 2: Update form state (ParentVolunteerHours.tsx)
const [formData, setFormData] = useState<VolunteerActivityForm>({
  // ... existing fields
  new_field: '',
});

// Step 3: Add form field
<TextField
  fullWidth
  label="New Field"
  value={formData.new_field}
  onChange={(e) => setFormData({ ...formData, new_field: e.target.value })}
/>
```

### 2. Add a New API Endpoint

```typescript
// In api/volunteer.ts
export const volunteerApi = {
  // ... existing methods

  getVolunteerStats: async (): Promise<VolunteerStats> => {
    const response = await axios.get<VolunteerStats>('/api/v1/volunteer/stats');
    return response.data;
  },
};

// Usage in component
const { data: stats } = useQuery({
  queryKey: ['volunteer-stats'],
  queryFn: volunteerApi.getVolunteerStats,
});
```

### 3. Add a New Milestone

```typescript
// In types/volunteer.ts - update VolunteerHoursSummary
milestones: [
  { milestone: 'Bronze', target_hours: 10, achieved: false },
  { milestone: 'Silver', target_hours: 25, achieved: false },
  { milestone: 'Gold', target_hours: 50, achieved: false },
  { milestone: 'Platinum', target_hours: 100, achieved: false },
  { milestone: 'Diamond', target_hours: 200, achieved: false },
  { milestone: 'Legendary', target_hours: 500, achieved: false }, // NEW
];
```

### 4. Add a New Chart to Analytics

```typescript
// In AdminVolunteerAnalytics.tsx

// 1. Prepare data
const newChartData = {
  labels: analytics?.some_data.map((d) => d.label) || [],
  datasets: [{
    label: 'New Metric',
    data: analytics?.some_data.map((d) => d.value) || [],
    backgroundColor: 'rgba(75, 192, 192, 0.8)',
  }],
};

// 2. Add to JSX
<Card>
  <CardHeader title="New Chart" />
  <CardContent>
    <Box sx={{ height: 350 }}>
      <Bar data={newChartData} options={chartOptions} />
    </Box>
  </CardContent>
</Card>
```

## Common Tasks

### Task 1: Add Email Notification Preference

```typescript
// 1. Update types
interface VolunteerSettings {
  is_anonymous: boolean;
  email_notifications: boolean; // NEW
}

// 2. Update API
updateSettings: async (settings: Partial<VolunteerSettings>): Promise<void> => {
  await axios.put('/api/v1/volunteer/settings', settings);
}

// 3. Add UI toggle
<FormControlLabel
  control={
    <Switch
      checked={emailNotifications}
      onChange={(e) => handleUpdateSettings({ email_notifications: e.target.checked })}
    />
  }
  label="Email Notifications"
/>
```

### Task 2: Add Activity Type Filter

```typescript
// In ParentVolunteerHours.tsx

const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');

// Filter activities
const filteredActivities = activities?.filter(
  (activity) => activityTypeFilter === 'all' || activity.activity_name.includes(activityTypeFilter)
);

// Add filter UI
<FormControl>
  <InputLabel>Activity Type</InputLabel>
  <Select value={activityTypeFilter} onChange={(e) => setActivityTypeFilter(e.target.value)}>
    <MenuItem value="all">All</MenuItem>
    <MenuItem value="classroom">Classroom</MenuItem>
    <MenuItem value="event">Event</MenuItem>
    {/* More types... */}
  </Select>
</FormControl>
```

### Task 3: Export Leaderboard to CSV

```typescript
// Add to VolunteerLeaderboard.tsx

const exportToCSV = () => {
  if (!leaderboard) return;

  const csvContent = [
    ['Rank', 'Name', 'Hours', 'Activities'].join(','),
    ...leaderboard.map(entry =>
      [entry.rank, entry.display_name, entry.total_hours, entry.activities_count].join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'volunteer-leaderboard.csv';
  a.click();
};

// Add button
<Button startIcon={<DownloadIcon />} onClick={exportToCSV}>
  Export CSV
</Button>
```

## Testing Your Changes

### 1. Component Testing

```typescript
// ParentVolunteerHours.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ParentVolunteerHours from './ParentVolunteerHours';

const queryClient = new QueryClient();

describe('ParentVolunteerHours', () => {
  it('renders hours dashboard', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ParentVolunteerHours />
      </QueryClientProvider>
    );

    expect(screen.getByText('Volunteer Hours Tracking')).toBeInTheDocument();
  });

  it('opens log hours dialog', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ParentVolunteerHours />
      </QueryClientProvider>
    );

    const logButton = screen.getByText('Log Hours');
    fireEvent.click(logButton);

    expect(screen.getByText('Log Volunteer Hours')).toBeInTheDocument();
  });
});
```

### 2. API Testing

```typescript
// volunteer.test.ts
import { volunteerApi } from './volunteer';

// Mock axios
jest.mock('@/lib/axios');

describe('volunteerApi', () => {
  it('logs activity successfully', async () => {
    const mockActivity = {
      /* ... */
    };

    const result = await volunteerApi.logActivity(mockActivity);

    expect(result).toBeDefined();
  });
});
```

## Debugging Tips

### Issue: Activities not loading

```typescript
// Add debug logging
const { data, isLoading, error } = useQuery({
  queryKey: ['volunteer-activities'],
  queryFn: async () => {
    console.log('Fetching activities...');
    const result = await volunteerApi.getMyActivities();
    console.log('Activities fetched:', result);
    return result;
  },
});

// Check error
if (error) {
  console.error('Error loading activities:', error);
}
```

### Issue: Form not submitting

```typescript
// Add validation debugging
const handleSubmit = () => {
  console.log('Form data:', formData);

  if (!formData.activity_name) {
    console.error('Activity name is required');
    return;
  }

  console.log('Submitting...');
  logMutation.mutate(formData);
};
```

### Issue: Chart not rendering

```typescript
// Check data format
console.log('Chart data:', engagementTrendData);

// Ensure Chart.js is registered
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  // ... other components
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale /* ... */);
```

## Performance Tips

### Optimize Large Lists

```typescript
// Add pagination
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);

const paginatedActivities = activities?.slice(
  page * rowsPerPage,
  page * rowsPerPage + rowsPerPage
);

<TablePagination
  rowsPerPageOptions={[10, 25, 50]}
  count={activities?.length || 0}
  rowsPerPage={rowsPerPage}
  page={page}
  onPageChange={(_, newPage) => setPage(newPage)}
  onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
/>
```

### Debounce Search

```typescript
import { useDebounce } from '@/hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

// Use debouncedSearch in filter
const filteredActivities = activities?.filter((activity) =>
  activity.activity_name.toLowerCase().includes(debouncedSearch.toLowerCase())
);
```

## Styling Customization

### Custom Colors

```typescript
// Use theme colors
const theme = useTheme();

<Box sx={{
  bgcolor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  p: 2,
  borderRadius: 1,
}}>
  {/* Content */}
</Box>
```

### Responsive Breakpoints

```typescript
<Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
  <Grid item xs={12} sm={6} md={4} lg={3}>
    {/* Content */}
  </Grid>
</Grid>
```

## Common Pitfalls

❌ **Don't do this:**

```typescript
// Mutating state directly
formData.activity_name = 'New name';
```

✅ **Do this instead:**

```typescript
setFormData({ ...formData, activity_name: 'New name' });
```

❌ **Don't do this:**

```typescript
// Not handling loading state
return <div>{data.total_hours}</div>;
```

✅ **Do this instead:**

```typescript
if (isLoading) return <CircularProgress />;
if (!data) return <Alert>No data</Alert>;
return <div>{data.total_hours}</div>;
```

## Need Help?

1. Check the [Feature Documentation](./VOLUNTEER_FEATURE.md)
2. Review the [Code Structure Guide](./VOLUNTEER_CODE_STRUCTURE.md)
3. Look at existing code patterns in similar components
4. Check Material-UI documentation for UI components
5. Review React Query documentation for data fetching

## Useful Resources

- [Material-UI Documentation](https://mui.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Chart.js Documentation](https://www.chartjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Quick Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

## Contributing

When adding new features:

1. Update types in `types/volunteer.ts`
2. Add API methods in `api/volunteer.ts`
3. Update components as needed
4. Add tests for new functionality
5. Update documentation
6. Test on different screen sizes
7. Check accessibility

## Next Steps

- Implement email notifications
- Add photo upload for activities
- Create volunteer opportunity board
- Add social sharing features
- Implement advanced filtering
- Add data export options
