# Student Newspaper Platform - Quick Start Guide

## Installation

No additional dependencies needed - all required packages are already in package.json:

- @mui/material
- @mui/icons-material
- react-chartjs-2
- chart.js
- react-router-dom

## Add Routes to Your App

In your main router file (e.g., `App.tsx` or `routes.tsx`):

```tsx
import StudentNewspaper from './pages/StudentNewspaper';
import JournalistDashboard from './pages/JournalistDashboard';
import NewspaperEditor from './pages/NewspaperEditor';
import NewspaperArchive from './pages/NewspaperArchive';
import NewspaperAnalytics from './pages/NewspaperAnalytics';

// Add to your Routes component:
<Route path="/newspaper" element={<StudentNewspaper />} />
<Route path="/journalist-dashboard" element={<JournalistDashboard />} />
<Route path="/newspaper-editor" element={<NewspaperEditor />} />
<Route path="/newspaper-archive" element={<NewspaperArchive />} />
<Route path="/newspaper-analytics" element={<NewspaperAnalytics />} />
```

## Add Navigation Menu Items

Example navigation configuration:

```tsx
const menuItems = [
  {
    title: 'Newspaper',
    icon: <ArticleIcon />,
    path: '/newspaper',
    children: [
      { title: 'Read Articles', path: '/newspaper', roles: ['all'] },
      { title: 'Archive', path: '/newspaper-archive', roles: ['all'] },
      { title: 'Write Article', path: '/journalist-dashboard', roles: ['journalist', 'admin'] },
      { title: 'Editor Dashboard', path: '/newspaper-editor', roles: ['editor', 'admin'] },
      { title: 'Analytics', path: '/newspaper-analytics', roles: ['editor', 'admin'] },
    ],
  },
];
```

## File Locations

```
frontend/
├── src/
│   ├── pages/
│   │   ├── StudentNewspaper.tsx          # Reader interface
│   │   ├── JournalistDashboard.tsx       # Writer workspace
│   │   ├── NewspaperEditor.tsx           # Editorial interface
│   │   ├── NewspaperArchive.tsx          # Archive search
│   │   └── NewspaperAnalytics.tsx        # Analytics dashboard
│   ├── components/
│   │   └── NewspaperArticleCard.tsx      # Reusable article card
│   ├── types/
│   │   └── newspaper.ts                   # TypeScript types
│   ├── api/
│   │   └── newspaperApi.ts                # API service layer
│   └── config/
│       └── newspaperRoutes.ts             # Route definitions
├── NEWSPAPER_PLATFORM.md                  # Full documentation
├── NEWSPAPER_IMPLEMENTATION_SUMMARY.md    # Technical summary
└── NEWSPAPER_QUICK_START.md              # This file
```

## Component Usage Examples

### 1. Display Article Card

```tsx
import ArticleCard from '@/components/NewspaperArticleCard';

const article = {
  id: 1,
  title: 'School Wins Championship',
  excerpt: 'Our team brought home the trophy...',
  author: { name: 'John Doe', avatar: '' },
  category: 'sports',
  publishedDate: '2024-03-15',
  coverImage: 'https://example.com/image.jpg',
  readTime: 5,
  views: 1250,
  comments: 23,
};

<ArticleCard
  article={article}
  variant="featured" // or "compact" or "list"
  onArticleClick={(article) => navigate(`/newspaper/article/${article.id}`)}
  onBookmark={(id) => console.log('Bookmarked:', id)}
  onShare={(id) => console.log('Shared:', id)}
  isBookmarked={false}
/>;
```

### 2. Use API Service

```tsx
import newspaperApi from '@/api/newspaperApi';

// Fetch all articles
const articles = await newspaperApi.articles.getAll({ category: 'sports' });

// Get single article
const article = await newspaperApi.articles.getById(1);

// Submit draft
await newspaperApi.drafts.submit(draftId);

// Approve submission
await newspaperApi.submissions.approve(submissionId);
```

### 3. Use TypeScript Types

```tsx
import type { Article, Edition, Draft } from '@/types/newspaper';

const article: Article = {
  id: 1,
  title: 'Example Article',
  // ... other properties
};
```

## Testing the Components

### Navigate to Each Page:

1. **Reader View**: `http://localhost:3000/newspaper`
2. **Write Article**: `http://localhost:3000/journalist-dashboard`
3. **Editorial**: `http://localhost:3000/newspaper-editor`
4. **Archive**: `http://localhost:3000/newspaper-archive`
5. **Analytics**: `http://localhost:3000/newspaper-analytics`

### Sample User Flows:

**As a Reader:**

1. Go to `/newspaper`
2. Browse featured articles and editions
3. Click on an article to read
4. Bookmark or share the article
5. Leave a comment

**As a Journalist:**

1. Go to `/journalist-dashboard`
2. Click "New Article"
3. Fill in article details
4. Write content with rich editor
5. Submit for review

**As an Editor:**

1. Go to `/newspaper-editor`
2. Review pending submissions
3. Add comments or approve/reject
4. Organize articles in edition planner
5. Schedule publication

## Customization

### Change Theme Colors

All components use MUI theme. Customize in `theme.ts`:

```tsx
primary: {
  main: '#0d47a1', // Change to your school colors
}
```

### Modify Categories

In each component, update the category options:

```tsx
const categories = [
  { value: 'news', label: 'News' },
  { value: 'sports', label: 'Sports' },
  { value: 'opinion', label: 'Opinion' },
  { value: 'arts', label: 'Arts' },
  // Add your custom categories
];
```

### Adjust Mock Data

Each component has mock data constants at the top. Replace with your data:

```tsx
const mockArticles: Article[] = [
  // Your articles here
];
```

## Backend Integration Checklist

- [ ] Set up API endpoints (see `newspaperApi.ts`)
- [ ] Replace mock API calls with actual axios calls
- [ ] Add authentication tokens to requests
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Set up WebSocket for real-time updates (optional)
- [ ] Configure CORS for API calls
- [ ] Add request/response interceptors

## Common Issues & Solutions

### Issue: Components not rendering

**Solution**: Ensure all routes are properly configured in your router

### Issue: Icons not showing

**Solution**: Verify `@mui/icons-material` is installed

### Issue: Charts not displaying

**Solution**: Check that Chart.js is properly imported and registered

### Issue: TypeScript errors

**Solution**: Ensure all types are imported from `@/types/newspaper`

### Issue: Mock data not showing

**Solution**: Components use hardcoded mock data - check console for errors

## Next Steps

1. **Connect to Backend**: Replace mock API calls in `newspaperApi.ts`
2. **Add Authentication**: Implement role-based access control
3. **File Uploads**: Add image upload functionality
4. **Real-time Updates**: Add WebSocket for live comments/notifications
5. **Testing**: Write unit and integration tests
6. **Deploy**: Build and deploy to production

## Support & Documentation

- **Full Documentation**: See `NEWSPAPER_PLATFORM.md`
- **Technical Details**: See `NEWSPAPER_IMPLEMENTATION_SUMMARY.md`
- **Type Definitions**: See `src/types/newspaper.ts`
- **API Reference**: See `src/api/newspaperApi.ts`

## Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linter
npm run lint

# Format code
npm run format
```

## Resources

- [MUI Documentation](https://mui.com/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [React Router Documentation](https://reactrouter.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
