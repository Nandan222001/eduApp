# 🔍 Search Feature - Quick Reference

## What Was Implemented

A complete, production-ready search system that allows users to instantly find students, teachers, assignments, papers, and announcements from anywhere in the application.

## Quick Access

- **Search Bar**: Top navigation (every page)
- **Keyboard Shortcut**: `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
- **Full Results Page**: `/admin/search?q=your-query`

## Files Structure

```
Backend:
├── src/models/search.py              # Database models
├── src/schemas/search.py             # Request/response schemas
├── src/services/search_service.py    # Business logic
├── src/api/v1/search.py              # API endpoints
└── alembic/versions/add_search_tables.py  # Database migration

Frontend:
├── frontend/src/api/search.ts        # API client
├── frontend/src/components/search/
│   ├── GlobalSearchBar.tsx           # Search bar component
│   └── index.ts                      # Exports
└── frontend/src/pages/SearchResultsPage.tsx  # Full search page
```

## Setup (One-Time)

```bash
# 1. Apply database migration
alembic upgrade head

# 2. Start backend (if not running)
uvicorn src.main:app --reload

# 3. Start frontend (if not running)
cd frontend && npm run dev
```

## Features at a Glance

| Feature | Description |
|---------|-------------|
| **Instant Search** | Results appear as you type (300ms debounce) |
| **Multi-Entity** | Searches students, teachers, assignments, papers, announcements |
| **Smart Filters** | Grade, subject, section, board, year, status |
| **Search History** | Saves your recent searches |
| **Popular Searches** | Shows trending searches in your institution |
| **Keyboard Nav** | Full keyboard support (arrows, enter, escape) |
| **Mobile Ready** | Responsive design for all devices |

## API Endpoints

```
POST   /api/v1/search                  # Full search with filters
GET    /api/v1/search/quick?q=query    # Quick search (dropdown)
GET    /api/v1/search/history          # User's search history
DELETE /api/v1/search/history          # Clear history
GET    /api/v1/search/suggestions?q=x  # Get suggestions
GET    /api/v1/search/filters          # Get filter options
```

## Usage Examples

### Using the Search Bar

```tsx
import { GlobalSearchBar } from '@/components/search';

// In any component
<GlobalSearchBar />

// Full width variant
<GlobalSearchBar fullWidth />
```

### Navigate to Search Results

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate(`/admin/search?q=${encodeURIComponent('mathematics')}`);
```

### Use API Directly

```tsx
import { searchApi } from '@/api/search';

// Quick search
const results = await searchApi.quickSearch('john', 10);

// Full search with filters
const results = await searchApi.globalSearch({
  query: 'mathematics',
  search_types: ['assignments', 'papers'],
  filters: { grade_id: 5 },
  limit: 50
});

// Get search history
const history = await searchApi.getSearchHistory(20, 0);

// Clear history
await searchApi.clearSearchHistory();
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Focus search bar |
| `↑` `↓` | Navigate results |
| `Enter` | Open selected result |
| `Escape` | Close dropdown |

## Entity Types & Colors

- 🔵 **Students** - Blue (#1976d2)
- 🟢 **Teachers** - Green (#2e7d32)
- 🟠 **Assignments** - Orange (#ed6c02)
- 🟣 **Papers** - Purple (#9c27b0)
- 🔴 **Announcements** - Red (#d32f2f)

## Common Tasks

### Add Search to a New Page

Search is already integrated in AdminAppBar, so it appears on all pages using AdminLayout.

### Customize Search Behavior

Edit `frontend/src/components/search/GlobalSearchBar.tsx`:

```tsx
// Change debounce time
const debouncedQuery = useDebounce(query, 500); // Changed from 300ms

// Change result limit
const results = await searchApi.quickSearch(query, 15); // Changed from 10
```

### Add a New Entity Type to Search

1. Add search method to `src/services/search_service.py`
2. Add result schema to `src/schemas/search.py`
3. Update `global_search()` to include new entity
4. Add rendering logic to `SearchResultsPage.tsx`

### Customize Filters

Edit `src/services/search_service.py` → `get_filter_options()` method

## Troubleshooting

### Search Returns No Results

```bash
# Check if data exists
psql -d your_database -c "SELECT COUNT(*) FROM students WHERE institution_id = 1;"

# Check if search is working
curl -X GET "http://localhost:8000/api/v1/search/quick?q=test" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search is Slow

```sql
-- Verify indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('students', 'teachers', 'assignments');
```

### Migration Fails

```bash
# Check current revision
alembic current

# If stuck, check migration file
cat alembic/versions/add_search_tables.py

# Manual run
alembic upgrade head --sql > migration.sql
psql -d your_database -f migration.sql
```

## Performance Targets

- Quick Search: < 200ms
- Full Search: < 500ms
- Filter Application: < 300ms
- Database Queries: All indexed

## Security Notes

✅ Institution isolation enforced  
✅ Role-based access control  
✅ SQL injection prevented (ORM)  
✅ Input validation active  
✅ Authentication required  

## Documentation

- **Full Guide**: `SEARCH_SYSTEM_IMPLEMENTATION.md` (25 pages)
- **Quick Start**: `SEARCH_SYSTEM_QUICK_START.md` (10 pages)
- **Checklist**: `SEARCH_SYSTEM_CHECKLIST.md`
- **Summary**: `SEARCH_SYSTEM_SUMMARY.md`

## Need Help?

1. Check documentation files above
2. Review inline code comments
3. Test API using `/docs` (FastAPI Swagger UI)
4. Check browser console for frontend errors
5. Check backend logs for API errors

## Quick Test

```bash
# 1. Open application
# 2. Press Cmd/Ctrl + K
# 3. Type "test"
# 4. You should see instant results

# If it works: ✅ Setup complete!
# If not: Check troubleshooting section above
```

## Status

✅ **Implementation**: Complete  
✅ **Testing**: Ready for QA  
✅ **Documentation**: Complete  
✅ **Production Ready**: Yes (after migration)  

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: Production Ready
