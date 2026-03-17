# Student API Integration - Quick Start Guide

## Overview
This guide helps you quickly understand and use the real API integration for student screens.

## Quick Reference

### Dashboard Screen
```typescript
// src/screens/student/DashboardScreen.tsx
import { studentApi } from '../../api/student';

const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['student-dashboard'],
  queryFn: async () => {
    const response = await studentApi.getDashboard();
    return response.data;
  }
});
```

**Endpoint**: `GET /api/v1/students/dashboard`

### Assignments Screen
```typescript
// src/screens/student/AssignmentsScreen.tsx
import { assignmentsApi } from '../../api/assignments';

const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['assignments', status],
  queryFn: async () => {
    const response = await assignmentsApi.getAssignments({ status });
    return response.data;
  }
});
```

**Endpoint**: `GET /api/v1/assignments?status={status}`

### Grades Screen
```typescript
// src/screens/student/GradesScreen.tsx
import { studentApi } from '../../api/student';

const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['grades', term],
  queryFn: async () => {
    const response = await studentApi.getGrades({ term });
    return response.data;
  }
});
```

**Endpoint**: `GET /api/v1/grades?term={term}`

### Schedule Screen
```typescript
// src/screens/student/ScheduleScreen.tsx
import { studentApi } from '../../api/student';

const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['timetable'],
  queryFn: async () => {
    const response = await studentApi.getTimetable();
    return response.data;
  }
});
```

**Endpoint**: `GET /api/v1/timetable`

## Using Custom Hooks

### Import Hooks
```typescript
import { 
  useDashboard,
  useGrades,
  useTimetable,
  useAssignmentsList,
  useAssignmentDetail,
  useSubmitAssignment
} from '@hooks';
```

### Dashboard Hook
```typescript
const { data, isLoading, isError, refetch } = useDashboard();
```

### Grades Hook
```typescript
const { data, isLoading, isError, refetch } = useGrades({ term: 'term_1' });
```

### Timetable Hook
```typescript
const { data, isLoading, isError, refetch } = useTimetable();
```

### Assignments Hook
```typescript
const { data, isLoading, isError, refetch } = useAssignmentsList({ 
  status: 'pending' 
});
```

### Submit Assignment Hook
```typescript
const submitMutation = useSubmitAssignment();

submitMutation.mutate({
  assignmentId: 123,
  comments: 'My submission',
  attachments: [...]
});
```

## Using Shared Components

### Loading State
```typescript
import { LoadingState } from '@components';

if (isLoading) {
  return <LoadingState message="Loading data..." />;
}
```

### Error State
```typescript
import { ErrorState } from '@components';

if (isError) {
  return (
    <ErrorState
      title="Failed to load"
      message="Please try again"
      onRetry={refetch}
    />
  );
}
```

### Empty State
```typescript
import { EmptyState } from '@components';

if (!data?.length) {
  return (
    <EmptyState
      icon="inbox"
      title="No data available"
      message="Check back later"
    />
  );
}
```

## Error Handling Pattern

```typescript
const { data, isLoading, isError, error, refetch } = useQuery({
  queryKey: ['my-data'],
  queryFn: fetchData,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

if (isLoading) return <LoadingState />;
if (isError) return <ErrorState onRetry={refetch} />;
if (!data) return <EmptyState title="No data" />;

return <YourComponent data={data} />;
```

## Pull-to-Refresh Pattern

```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await refetch();
  setRefreshing(false);
};

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={COLORS.primary}
      colors={[COLORS.primary]}
    />
  }
>
  {/* Content */}
</ScrollView>
```

## File Upload Pattern (Assignments)

### Document Picker
```typescript
import * as DocumentPicker from 'expo-document-picker';

const handlePickDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: true,
  });

  if (!result.canceled) {
    // Handle selected files
  }
};
```

### Camera
```typescript
import { Camera } from 'expo-camera';

const [permission, requestPermission] = Camera.useCameraPermissions();

const handleTakePhoto = async () => {
  if (!permission?.granted) {
    await requestPermission();
  }
  // Open camera
};
```

## API Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["Error detail"]
  }
}
```

## Environment Setup

### Required Environment Variables
```env
API_URL=https://api.example.com
API_TIMEOUT=30000
```

### Update .env files
- `.env.development`
- `.env.production`

## Testing API Integration

### 1. Mock API Responses
Create mock responses in `__mocks__` directory for testing.

### 2. Test Hooks
```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useDashboard } from '@hooks';

test('should fetch dashboard data', async () => {
  const { result } = renderHook(() => useDashboard());
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
  
  expect(result.current.data).toBeDefined();
});
```

### 3. Test Components
```typescript
import { render, screen } from '@testing-library/react-native';
import { DashboardScreen } from './DashboardScreen';

test('renders dashboard screen', async () => {
  render(<DashboardScreen />);
  expect(screen.getByText('Loading...')).toBeDefined();
});
```

## Common Issues & Solutions

### Issue: API not connecting
**Solution**: Check API_URL in .env file

### Issue: 401 Unauthorized
**Solution**: Ensure auth token is valid and not expired

### Issue: Network error
**Solution**: Check internet connection and API availability

### Issue: Data not updating
**Solution**: Invalidate queries or adjust stale time

### Issue: Slow performance
**Solution**: Check query configuration and caching settings

## Performance Tips

1. **Use appropriate stale times** - Balance freshness vs performance
2. **Enable caching** - Reduce unnecessary network requests
3. **Implement pagination** - For large data sets
4. **Use optimistic updates** - For better perceived performance
5. **Lazy load images** - Use lazy loading for images
6. **Debounce searches** - Prevent excessive API calls
7. **Monitor bundle size** - Keep dependencies minimal

## Debugging

### Enable React Query DevTools (Development)
```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  {__DEV__ && <ReactQueryDevtools />}
</QueryClientProvider>
```

### Log API Calls
```typescript
// src/api/client.ts
this.instance.interceptors.request.use(config => {
  if (__DEV__) {
    console.log('API Request:', config.url);
  }
  return config;
});
```

### Monitor Query States
```typescript
const query = useQuery({ ... });
console.log({
  isLoading: query.isLoading,
  isError: query.isError,
  isSuccess: query.isSuccess,
  data: query.data,
});
```

## Additional Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [STUDENT_API_INTEGRATION.md](./STUDENT_API_INTEGRATION.md) - Detailed API docs
- [STUDENT_SCREENS_IMPLEMENTATION_SUMMARY.md](./STUDENT_SCREENS_IMPLEMENTATION_SUMMARY.md) - Full summary

## Support

For issues or questions:
1. Check documentation files
2. Review error logs
3. Test with mock data
4. Verify API responses
5. Check network connectivity
