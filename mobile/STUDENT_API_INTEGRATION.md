# Student API Integration Documentation

This document describes the complete API integration for student screens with real backend endpoints.

## Overview

All student screens now connect to real backend APIs with comprehensive error handling, loading states, and retry mechanisms using React Query.

## API Endpoints

### Dashboard Screen

**Endpoint**: `GET /api/v1/students/dashboard`

Returns comprehensive dashboard data including:

- Attendance summary (total classes, attended, percentage, today's status)
- Upcoming assignments (next 5 assignments)
- Recent grades (last 5 grades)
- AI predictions (predicted percentage, confidence, trend)
- Weak areas (subjects/topics needing attention)
- Gamification data (points, level, badges, streak)

**Hook**: `useDashboard()`
**Component**: `src/screens/student/DashboardScreen.tsx`

### Assignments Screen

**Endpoint**: `GET /api/v1/assignments?status={status}`

Query Parameters:

- `status`: 'pending' | 'submitted' | 'graded' | 'overdue'
- `page`: Page number (optional)
- `limit`: Items per page (optional)

Returns array of assignments with:

- Assignment details (title, description, due date)
- Subject information
- Teacher name
- Status and marks
- Attachments

**Hook**: `useAssignmentsList(params)`
**Component**: `src/screens/student/AssignmentsScreen.tsx`

#### Assignment Detail

**Endpoint**: `GET /api/v1/assignments/{id}`

Returns detailed assignment information including submission status and feedback.

**Hook**: `useAssignmentDetail(assignmentId)`
**Component**: `src/screens/student/AssignmentDetailScreen.tsx`

#### Submit Assignment

**Endpoint**: `POST /api/v1/submissions`

Request Body:

```typescript
{
  assignmentId: number;
  comments?: string;
  attachments: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string; // base64 encoded
  }>;
}
```

**Hook**: `useSubmitAssignment()`
**Features**:

- Document picker integration (expo-document-picker)
- Camera integration (expo-camera)
- Base64 file encoding
- Optimistic updates
- Progress feedback

### Grades Screen

**Endpoint**: `GET /api/v1/grades?term={term}&subject={subject}`

Query Parameters:

- `term`: 'term_1' | 'term_2' | 'term_3' (optional)
- `subject`: Subject name filter (optional)
- `page`: Page number (optional)
- `limit`: Items per page (optional)

Returns array of grades with:

- Exam details (name, date)
- Subject information
- Marks (obtained, total, percentage, grade)
- Remarks

**Hook**: `useGrades(params)`
**Component**: `src/screens/student/GradesScreen.tsx`

**Features**:

- Term filtering (All, Term 1, Term 2, Term 3)
- Performance statistics (average, highest, lowest)
- Visual performance chart
- Color-coded grades

### Schedule/Timetable Screen

**Endpoint**: `GET /api/v1/timetable`

Returns:

```typescript
{
  currentDay: string; // e.g., "Monday"
  entries: Array<{
    id: number;
    day: string;
    startTime: string; // HH:mm format
    endTime: string;
    subject: string;
    subjectCode: string;
    teacher: string;
    room: string;
    type: 'lecture' | 'lab' | 'tutorial' | 'exam';
  }>;
}
```

**Hook**: `useTimetable()`
**Component**: `src/screens/student/ScheduleScreen.tsx`

**Features**:

- Day-wise schedule view
- Current class highlighting
- Class type badges
- Time-based filtering
- Horizontal day navigation

## Error Handling

### Query Error Handling

All queries include:

- Automatic retry (3 attempts)
- Exponential backoff retry delay
- Network error detection
- Auth error handling (401/403)
- User-friendly error messages

### Retry Configuration

```typescript
retry: 3,
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
```

### Error States

Each screen includes:

- Loading state with message
- Error state with retry button
- Empty state with helpful message
- Network error detection
- Session expiration handling

## Loading States

### Components

- `LoadingState`: Centered loading spinner with optional message
- `ErrorState`: Error display with retry functionality
- `EmptyState`: Empty data display with icon and message

### Usage

```typescript
if (isLoading) return <LoadingState message="Loading..." />;
if (isError) return <ErrorState onRetry={refetch} />;
if (!data?.length) return <EmptyState title="No data" />;
```

## React Query Configuration

### Global Settings (`src/config/reactQuery.ts`)

- Default stale time: 5 minutes
- Cache time: 10 minutes
- Retry logic with auth exception
- Network mode: online
- Automatic refetch on reconnect
- No refetch on window focus

### Query Keys Structure

```typescript
['student-dashboard'][('assignments', status)][('assignment', id)][('grades', term, subject)][ // Dashboard data // Assignments list // Assignment detail // Grades list
  'timetable'
]['profile'][('attendance', 'summary')]['ai-prediction']['weak-areas']['gamification']; // Timetable data // User profile // Attendance summary // AI predictions // Weak areas // Gamification data
```

## Optimistic Updates

### Assignment Submission

When submitting an assignment:

1. Cancel ongoing queries
2. Update cache optimistically
3. On error, rollback to previous state
4. On success, invalidate related queries
5. Show success modal

### Implementation

```typescript
onMutate: async (newSubmission) => {
  await queryClient.cancelQueries({ queryKey: ['assignment', id] });
  const previousData = queryClient.getQueryData(['assignment', id]);
  queryClient.setQueryData(['assignment', id], optimisticData);
  return { previousData };
},
onError: (err, variables, context) => {
  queryClient.setQueryData(['assignment', id], context.previousData);
},
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['assignment', id] });
  queryClient.invalidateQueries({ queryKey: ['assignments'] });
}
```

## Pull-to-Refresh

All list screens support pull-to-refresh:

```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await refetch();
  setRefreshing(false);
};

<RefreshControl
  refreshing={refreshing}
  onRefresh={onRefresh}
  tintColor={COLORS.primary}
/>
```

## File Upload (Assignment Submission)

### Document Picker

```typescript
import * as DocumentPicker from 'expo-document-picker';

const result = await DocumentPicker.getDocumentAsync({
  type: '*/*',
  copyToCacheDirectory: true,
  multiple: true,
});
```

### Camera Integration

```typescript
import { Camera } from 'expo-camera';

const [permission, requestPermission] = Camera.useCameraPermissions();
const photo = await cameraRef.current.takePictureAsync({
  quality: 0.8,
  base64: true,
});
```

### File to Base64 Conversion

```typescript
const response = await fetch(file.uri);
const blob = await response.blob();
const base64 = await new Promise(resolve => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result.split(',')[1]);
  reader.readAsDataURL(blob);
});
```

## Type Safety

All API responses and requests are fully typed:

- `DashboardData` - Dashboard response
- `AssignmentDetail` - Assignment data
- `Grade` - Grade information
- `TimetableEntry` - Timetable entry
- `SubmitAssignmentData` - Submission payload

## Best Practices

1. **Always show loading states** - Use LoadingState component
2. **Handle all error cases** - Use ErrorState with retry
3. **Provide empty states** - Use EmptyState with helpful messages
4. **Enable pull-to-refresh** - Allow users to manually refresh
5. **Use optimistic updates** - For better UX on mutations
6. **Invalidate related queries** - Keep data consistent
7. **Use proper query keys** - For efficient caching
8. **Handle network errors** - Detect and show appropriate messages
9. **Respect stale times** - Balance freshness and performance
10. **Log errors appropriately** - For debugging and monitoring

## Testing Endpoints

To test the integration, ensure your backend implements these endpoints:

1. `/api/v1/students/dashboard` - Returns dashboard data
2. `/api/v1/assignments` - Returns assignments list
3. `/api/v1/assignments/:id` - Returns assignment detail
4. `/api/v1/submissions` - Accepts assignment submissions
5. `/api/v1/grades` - Returns grades list
6. `/api/v1/timetable` - Returns timetable data

All endpoints should:

- Require authentication (Bearer token)
- Return proper status codes
- Include error messages
- Support pagination where applicable
- Handle validation errors (422)

## Error Response Format

Expected error response:

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

## Success Response Format

Expected success response:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```
