# Search System - Quick Start Guide

## Setup Instructions

### 1. Backend Setup

#### Apply Database Migration

```bash
# Navigate to project root
cd /path/to/project

# Run the migration
alembic upgrade head
```

The migration creates two new tables:
- `search_history` - Stores user search queries
- `popular_searches` - Tracks popular search terms

#### Verify Tables Created

```bash
# Connect to PostgreSQL
psql -U your_username -d your_database

# Check tables exist
\dt search_history
\dt popular_searches

# Exit
\q
```

### 2. Frontend Setup

No additional setup required! The search components are automatically included when you:
- Import and use `GlobalSearchBar` component
- Navigate to `/admin/search` route

### 3. Test the Search System

#### A. Test Global Search Bar

1. Start the development server:
```bash
cd frontend
npm run dev
```

2. Login to the application
3. Look at the top navigation bar - you'll see the search bar
4. Try these actions:
   - Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) - search bar should focus
   - Type any query (e.g., "student", "math", "assignment")
   - Watch instant results appear in dropdown
   - Use arrow keys to navigate results
   - Press Enter to view full results page
   - Press Escape to close dropdown

#### B. Test Full Search Page

1. Navigate to `/admin/search?q=test`
2. You should see:
   - Search input box at top
   - Filter button (click to show filters)
   - Tabs for different entity types
   - Search results grouped by category
   - Search statistics (time, count)

#### C. Test Filters

1. On search results page, click the filter icon
2. Try selecting:
   - Different grades
   - Different subjects
   - Different statuses
3. Click "Apply Filters"
4. Results should update based on selected filters

#### D. Test Search History

1. Perform several searches
2. Click on search bar (without typing)
3. You should see popular searches if available
4. API endpoint to check history: `GET /api/v1/search/history`

## Quick Feature Guide

### Using Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Focus search bar |
| `Arrow Up/Down` | Navigate results |
| `Enter` | Select result or view all |
| `Escape` | Close dropdown |

### Entity Type Colors

- **Students**: Blue
- **Teachers**: Green
- **Assignments**: Orange
- **Papers**: Purple
- **Announcements**: Red

### Available Filters

- **Grade**: Filter by class/grade
- **Subject**: Filter by subject
- **Section**: Filter by section
- **Board**: Filter papers by board (CBSE, ICSE, etc.)
- **Year**: Filter papers by year
- **Status**: Filter by status (active, inactive, published, etc.)

## API Endpoints Reference

### Quick Search (Dropdown)
```http
GET /api/v1/search/quick?q=query&limit=10
```

### Global Search
```http
POST /api/v1/search
Content-Type: application/json

{
  "query": "search term",
  "search_types": ["students", "teachers"],
  "filters": {
    "grade_id": 5,
    "status": "active"
  },
  "limit": 50,
  "offset": 0
}
```

### Search History
```http
GET /api/v1/search/history?limit=20&offset=0
```

### Clear History
```http
DELETE /api/v1/search/history
```

### Search Suggestions
```http
GET /api/v1/search/suggestions?q=partial&limit=10
```

### Get Filter Options
```http
GET /api/v1/search/filters
```

## Integration Examples

### Add Search Bar to Custom Component

```tsx
import { GlobalSearchBar } from '@/components/search';

function MyComponent() {
  return (
    <Box>
      <GlobalSearchBar fullWidth />
    </Box>
  );
}
```

### Navigate to Search Results Programmatically

```tsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleSearch = (query: string) => {
    navigate(`/admin/search?q=${encodeURIComponent(query)}`);
  };
  
  return <Button onClick={() => handleSearch('test')}>Search</Button>;
}
```

### Use Search API Directly

```tsx
import { searchApi } from '@/api/search';

async function searchStudents(query: string) {
  const results = await searchApi.globalSearch({
    query,
    search_types: ['students'],
    filters: { status: 'active' },
    limit: 20
  });
  
  console.log('Found students:', results.students);
}
```

## Common Customizations

### Change Search Debounce Time

Edit `frontend/src/components/search/GlobalSearchBar.tsx`:

```tsx
// Change from 300ms to 500ms
const debouncedQuery = useDebounce(query, 500);
```

### Adjust Results Limit

Edit `frontend/src/services/search_service.py`:

```python
# Change default limit in quick_search
def quick_search(self, institution_id, user_id, query, limit=20):  # Changed from 10
    # ... rest of method
```

### Add Custom Filter

1. Add field to `SearchFilterOptions` in `src/schemas/search.py`
2. Update `get_filter_options()` in `src/services/search_service.py`
3. Add UI component in `SearchResultsPage.tsx`

### Change Entity Colors

Edit `frontend/src/pages/SearchResultsPage.tsx`:

```tsx
const categoryInfo = {
  students: { icon: StudentIcon, label: 'Students', color: '#YOUR_COLOR' },
  // ... rest
};
```

## Troubleshooting

### Search Returns No Results

1. **Check Database**:
   ```sql
   SELECT COUNT(*) FROM students WHERE institution_id = YOUR_INSTITUTION_ID;
   ```

2. **Check User Institution Context**:
   - Verify user has correct institution_id
   - Check middleware is setting institution context

3. **Check Query**:
   - Ensure query is at least 2 characters for quick search
   - Check for special characters

### Search is Slow

1. **Verify Indexes Exist**:
   ```sql
   SELECT indexname, tablename FROM pg_indexes 
   WHERE tablename IN ('students', 'teachers', 'assignments', 'previous_year_papers', 'announcements');
   ```

2. **Check Query Performance**:
   ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM students 
   WHERE institution_id = 1 
   AND LOWER(first_name) LIKE '%john%';
   ```

3. **Optimize**:
   - Add more specific indexes
   - Reduce result limit
   - Implement pagination

### Keyboard Shortcuts Not Working

1. Check for JavaScript errors in console
2. Verify event listeners are attached
3. Check for conflicting shortcuts from other libraries

### Search History Not Saving

1. **Check API Response**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/search \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query": "test"}'
   ```

2. **Check Database Permissions**:
   ```sql
   SELECT * FROM search_history LIMIT 1;
   ```

3. **Check Logs**:
   - Look for errors in backend logs
   - Check browser console for frontend errors

## Performance Tips

### For Large Institutions (10,000+ entities)

1. **Implement Pagination**:
   ```tsx
   const results = await searchApi.globalSearch({
     query: 'test',
     limit: 20,
     offset: page * 20
   });
   ```

2. **Add Search Debounce**:
   - Already implemented at 300ms
   - Increase if needed for slower networks

3. **Cache Filter Options**:
   ```tsx
   const { data: filters } = useQuery('searchFilters', 
     searchApi.getFilterOptions,
     { staleTime: 5 * 60 * 1000 } // 5 minutes
   );
   ```

4. **Lazy Load Results**:
   - Load only visible category tabs
   - Implement infinite scroll for large result sets

## Next Steps

1. **Customize UI**: Adjust colors, icons, and layout to match your brand
2. **Add Analytics**: Track search behavior and popular queries
3. **Enhance Results**: Add more entity types (exams, materials, etc.)
4. **Improve Relevance**: Implement ranking algorithm for better results
5. **Add Exports**: Allow users to export search results

## Support

For issues or questions:
1. Check the main documentation: `SEARCH_SYSTEM_IMPLEMENTATION.md`
2. Review API documentation: `/docs` endpoint (FastAPI auto-generated)
3. Check database schema: Review migration files in `alembic/versions/`
