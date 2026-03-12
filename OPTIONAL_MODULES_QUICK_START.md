# Optional Modules Quick Start Guide

Quick reference for using and extending the optional modules.

## Module Access URLs

- **Fee Management**: `/fees`
- **Library Management**: `/library`
- **Transport Management**: `/transport`
- **Event Management**: `/events`
- **Timetable Builder**: `/timetable-builder`

## Component Usage

### Fee Management

```tsx
import { FeeStructureConfig, PaymentRecording, OutstandingDuesReport } from '@/components/fees';

// Use in your page
<FeeStructureConfig />
<PaymentRecording />
<OutstandingDuesReport />
```

### Library Management

```tsx
import { BookCatalog, IssueReturnWorkflow, OverdueTracking } from '@/components/library';

// Use in your page
<BookCatalog />
<IssueReturnWorkflow />
<OverdueTracking />
```

### Transport Management

```tsx
import { RouteConfiguration, StudentAssignment } from '@/components/transport';

// Use in your page
<RouteConfiguration />
<StudentAssignment />
```

### Event Management

```tsx
import { EventCalendar, RSVPTracking, PhotoGallery } from '@/components/events';

// Use in your page with state
const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

<EventCalendar onSelectEvent={setSelectedEventId} />
<RSVPTracking eventId={selectedEventId} />
<PhotoGallery eventId={selectedEventId} />
```

### Timetable Builder

```tsx
import { TimetableControls, TimetableGrid, ConflictDetection } from '@/components/timetable';

// Use in your page with state
const [gradeId, setGradeId] = useState<number | null>(null);
const [sectionId, setSectionId] = useState<number | null>(null);
const [timetableId, setTimetableId] = useState<number | null>(null);

<TimetableControls
  onGradeChange={setGradeId}
  onSectionChange={setSectionId}
  onTimetableChange={setTimetableId}
/>
<TimetableGrid
  timetableId={timetableId}
  gradeId={gradeId}
  sectionId={sectionId}
/>
<ConflictDetection timetableId={timetableId} />
```

## API Usage

### Fees API

```typescript
import { feeApi } from '@/api/fees';

// List structures
const structures = await feeApi.listStructures();

// Create structure
await feeApi.createStructure({ name: 'Tuition Fee', amount: 5000, ... });

// Record payment
await feeApi.recordPayment({ student_id: 1, amount_paid: 5000, ... });

// Get outstanding dues
const dues = await feeApi.getOutstandingDues(gradeId);
```

### Library API

```typescript
import { libraryApi } from '@/api/library';

// List books
const books = await libraryApi.listBooks({ search: 'physics' });

// Issue book
await libraryApi.issueBook({ book_id: 1, student_id: 1, ... });

// Return book
await libraryApi.returnBook(issueId, { return_date: '2024-01-20' });

// Get overdue books
const overdue = await libraryApi.getOverdueBooks();
```

### Transport API

```typescript
import { transportApi } from '@/api/transport';

// List routes
const routes = await transportApi.listRoutes();

// Create route
await transportApi.createRoute({ route_number: 'R01', ... });

// Add stop
await transportApi.createStop(routeId, { stop_name: 'Main Gate', ... });

// Assign student
await transportApi.assignStudent({ student_id: 1, route_id: 1, ... });
```

### Events API

```typescript
import { eventsApi } from '@/api/events';

// Get calendar events
const events = await eventsApi.getEventCalendar('2024-01-01', '2024-01-31');

// Create event
await eventsApi.createEvent({ title: 'Annual Day', ... });

// List RSVPs
const rsvps = await eventsApi.listRSVPs(eventId);

// Upload photo
const formData = new FormData();
formData.append('photo', file);
await eventsApi.uploadPhoto(eventId, formData);
```

### Timetable API

```typescript
import { timetableApi } from '@/api/timetable';

// Get timetable entries
const entries = await timetableApi.getTimetableEntries(timetableId);

// Create entry
await timetableApi.createEntry(timetableId, {
  subject_id: 1,
  teacher_id: 1,
  day_of_week: 'monday',
  period_number: 1,
  ...
});

// Check conflicts
const conflicts = await timetableApi.checkConflicts(timetableId, entryData);
```

## React Query Hooks

All components use React Query for data fetching:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['books', searchQuery],
  queryFn: () => libraryApi.listBooks({ search: searchQuery }),
});

// Mutate data
const mutation = useMutation({
  mutationFn: libraryApi.createBook,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
  },
});

// Use mutation
mutation.mutate(bookData);
```

## Type Definitions

Import types for type safety:

```typescript
import type { FeeStructure, FeePayment } from '@/types/fee';
import type { Book, BookIssue } from '@/types/library';
import type { TransportRoute, StudentTransport } from '@/types/transport';
import type { Event, EventRSVP } from '@/types/event';
import type { Timetable, TimetableEntry } from '@/types/timetable';
```

## Backend Models

Import models for backend development:

```python
from src.models import (
    FeeStructure, FeePayment, FeeWaiver,
    Book, BookCategory, BookIssue, LibrarySettings,
    TransportRoute, RouteStop, StudentTransport,
    Event, EventRSVP, EventPhoto,
    TimetableTemplate, PeriodSlot, Timetable, TimetableEntry
)
```

## Common Patterns

### Creating a Dialog Form

```tsx
const [open, setOpen] = useState(false);
const [editing, setEditing] = useState<any>(null);

const handleOpen = (item?: any) => {
  setEditing(item || null);
  setOpen(true);
};

const handleClose = () => {
  setOpen(false);
  setEditing(null);
};

<Dialog open={open} onClose={handleClose}>
  <form onSubmit={handleSubmit}>
    {/* Form fields */}
  </form>
</Dialog>
```

### Table with Actions

```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableCell>Name</TableCell>
      <TableCell>Actions</TableCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {data?.items?.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>
          <IconButton onClick={() => handleEdit(item)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(item.id)}>
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Search and Filter

```tsx
const [search, setSearch] = useState('');
const [filter, setFilter] = useState<any>(undefined);

const { data } = useQuery({
  queryKey: ['data', search, filter],
  queryFn: () => api.list({ search, filter }),
});

<TextField
  placeholder="Search..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
```

## Testing

Test components with React Testing Library:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

test('renders component', () => {
  render(
    <QueryClientProvider client={queryClient}>
      <BookCatalog />
    </QueryClientProvider>
  );
  
  expect(screen.getByText('Add Book')).toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

1. **Query not updating**: Ensure proper query key invalidation
   ```typescript
   queryClient.invalidateQueries({ queryKey: ['books'] });
   ```

2. **Form validation**: Use required attribute and type validation
   ```tsx
   <TextField required type="number" />
   ```

3. **Date formatting**: Use proper date formatting
   ```typescript
   new Date(dateString).toLocaleDateString()
   ```

4. **API errors**: Handle errors gracefully
   ```typescript
   const { error } = useQuery(...);
   if (error) return <Alert severity="error">{error.message}</Alert>;
   ```

## Performance Tips

1. Use `useMemo` for expensive calculations
2. Implement pagination for large datasets
3. Use `React.lazy` for code splitting
4. Optimize images before upload
5. Enable query caching with React Query
6. Use virtualization for long lists

## Security Considerations

1. Always validate data on backend
2. Use proper authentication tokens
3. Implement role-based access control
4. Sanitize user inputs
5. Validate file uploads
6. Use HTTPS in production

## Next Steps

1. Review the full implementation in respective files
2. Check API documentation for backend endpoints
3. Test features in development environment
4. Customize UI as per requirements
5. Add institution-specific features
6. Configure permissions and roles
