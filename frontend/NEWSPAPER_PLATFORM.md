# Student Newspaper Platform

A comprehensive digital newspaper platform built for students, featuring a reader interface, journalist dashboard, editor workflow, archive system, and analytics.

## Features Overview

### 1. Student Newspaper Reader (`StudentNewspaper.tsx`)

The main public-facing interface for reading the school newspaper.

**Key Features:**

- **Magazine-style layout** with featured stories and grid view
- **Category navigation**: News, Sports, Opinion, Arts
- **Published editions** display with cover images and metadata
- **Article detail page** with:
  - Author byline with avatar and role
  - Publication date and read time
  - Cover images and rich content
  - Share buttons (Facebook, Twitter, LinkedIn, Copy Link)
  - Bookmark functionality
  - Related articles section
  - Comment section with threaded discussions
  - Tag-based organization
- **Search functionality** to find articles
- **Responsive design** for all device sizes

**UI Components:**

- Edition cards with cover images
- Featured article cards with large images
- Article grid for regular content
- Article detail view with full content
- Share dialog with social media options
- Comment section with user avatars

### 2. Journalist Dashboard (`JournalistDashboard.tsx`)

A workspace for student journalists to write and manage their articles.

**Key Features:**

- **Article drafts management** with status tracking:
  - Draft: Work in progress
  - Submitted: Under review
  - Approved: Ready for publication
  - Rejected: Needs revision
- **Rich text editor** with formatting tools:
  - Bold, Italic, Underline
  - Bullet and numbered lists
  - Image insertion
  - Video embeds
  - File attachments
- **Submission form** with multi-step wizard:
  - Step 1: Basic Info (title, category, excerpt, tags)
  - Step 2: Content writing with rich editor
  - Step 3: Review and submit
- **Publication calendar** showing upcoming editions and deadlines
- **Writing tips** for better journalism
- **Submission guidelines** with detailed requirements:
  - Word count guidelines (500-1500 words)
  - Format requirements
  - Citation standards
  - Image specifications
  - Deadline information
- **Word count tracker** in real-time
- **Auto-save** functionality for drafts

**UI Components:**

- Tabbed interface for filtering articles
- Draft cards with metadata
- Multi-step submission wizard
- Rich text editor toolbar
- Calendar widget for publication dates
- Accordion panels for guidelines

### 3. Newspaper Editor Interface (`NewspaperEditor.tsx`)

An administrative interface for editors to review submissions and manage publication.

**Key Features:**

- **Submission queue** with filtering:
  - All submissions view
  - Pending review
  - Under review
  - Approved articles
- **Review workflow** with:
  - Inline commenting system
  - Article preview
  - Approve/reject buttons
  - Feedback mechanism
- **Edition planner** with:
  - Section organization (News, Sports, Opinion, Arts)
  - Article reordering (up/down arrows)
  - Visual section management
  - Article assignment to sections
- **Publication scheduler**:
  - Set publication date and time
  - Edition naming
  - Batch publishing
- **Priority indicators** for urgent submissions
- **Status tracking** with color-coded chips
- **Author information** display

**UI Components:**

- Badge counters for pending items
- Filterable submission list
- Review dialog with preview
- Section-based article organizer
- Publication scheduling dialog
- Context menus for article actions

### 4. Newspaper Archive (`NewspaperArchive.tsx`)

A searchable repository of past newspaper editions.

**Key Features:**

- **Advanced search** by:
  - Keywords in title or description
  - Publication year
  - Theme/topic
  - Date range
- **Filter options**:
  - Year selector
  - Theme categories
  - Sort by date, views, or downloads
- **Edition cards** displaying:
  - Cover images
  - Publication date
  - Article count
  - Theme badges
  - View and download statistics
- **Pagination** for easy browsing
- **Download functionality** for offline reading
- **View tracking** for analytics

**UI Components:**

- Search bar with filters
- Filter controls (year, theme, sort)
- Grid layout for editions
- Pagination controls
- Empty state for no results
- Statistics chips (views, downloads)

### 5. Reader Engagement Analytics (`NewspaperAnalytics.tsx`)

Comprehensive analytics dashboard for tracking readership and content performance.

**Key Features:**

- **Overview metrics**:
  - Total views with trend
  - Unique readers count
  - Average read time
  - Total engagement (likes + comments + shares)
- **Readership trends** chart showing:
  - Total views over time
  - Unique readers trend
  - Time-based comparisons
- **Most-read articles** ranking with:
  - View counts
  - Like counts
  - Comment counts
  - Share counts
  - Read time metrics
- **Category distribution** pie chart
- **Trending topics** with mention tracking
- **Reader demographics** breakdown by grade level
- **Engagement metrics** bar chart comparing articles
- **Time range selector** (7 days, 30 days, 90 days, year)

**UI Components:**

- Stat cards with trend indicators
- Line charts for trends
- Pie and doughnut charts for distributions
- Bar charts for comparisons
- Top articles list with detailed metrics
- Demographics visualization

## Technical Implementation

### Technologies Used

- **React 18** with TypeScript
- **Material-UI (MUI) v5** for UI components
- **Chart.js** with react-chartjs-2 for data visualization
- **React Router** for navigation
- **Date-fns** for date formatting

### File Structure

```
frontend/src/
├── pages/
│   ├── StudentNewspaper.tsx       # Main reader interface
│   ├── JournalistDashboard.tsx    # Writer workspace
│   ├── NewspaperEditor.tsx        # Editorial interface
│   ├── NewspaperArchive.tsx       # Historical editions
│   └── NewspaperAnalytics.tsx     # Analytics dashboard
└── types/
    └── newspaper.ts               # TypeScript interfaces
```

### Key Types

All TypeScript interfaces are defined in `src/types/newspaper.ts`:

- `Article`: Main article structure
- `Edition`: Newspaper edition metadata
- `Draft`: Writer's draft article
- `Submission`: Editorial submission
- `EditionSection`: Section organization
- `ArticleMetrics`: Analytics data
- `ReaderDemographic`: Audience data

### State Management

Each component uses local React state with `useState` hooks for:

- Form data
- UI state (dialogs, tabs, filters)
- Mock data (will be replaced with API calls)

### Styling Approach

- MUI theme integration
- Responsive grid layout
- Alpha transparency for subtle backgrounds
- Consistent color coding for status
- Hover effects for interactive elements
- Card-based layouts for content organization

## Future Enhancements

### Recommended Additions

1. **Real-time collaboration** on articles
2. **Version history** for drafts
3. **Image upload** functionality
4. **Notification system** for submission updates
5. **Role-based permissions** (writer, editor, admin)
6. **Print layout** export for PDF generation
7. **Social media integration** for auto-posting
8. **AI writing assistant** for grammar and style
9. **Advanced analytics** with heatmaps
10. **Mobile app** for on-the-go reading

### API Integration Points

Each component is designed to integrate with backend APIs:

- `GET /api/newspaper/editions` - List editions
- `GET /api/newspaper/articles` - List articles
- `GET /api/newspaper/articles/:id` - Article details
- `POST /api/newspaper/articles` - Create article
- `PUT /api/newspaper/articles/:id` - Update article
- `POST /api/newspaper/submissions` - Submit for review
- `PUT /api/newspaper/submissions/:id/approve` - Approve submission
- `PUT /api/newspaper/submissions/:id/reject` - Reject submission
- `GET /api/newspaper/analytics` - Analytics data
- `GET /api/newspaper/archive` - Archive search

## Usage Examples

### For Students (Readers)

1. Navigate to `/newspaper` to browse articles
2. Filter by category or search for topics
3. Click article to read full content
4. Bookmark favorite articles
5. Share articles on social media
6. Leave comments on articles

### For Journalists

1. Navigate to `/journalist-dashboard`
2. Click "New Article" to start writing
3. Fill in article details and write content
4. Save as draft or submit for review
5. Track submission status
6. View publication calendar

### For Editors

1. Navigate to `/newspaper-editor`
2. Review pending submissions
3. Add inline comments for feedback
4. Approve or reject articles
5. Organize articles into sections
6. Schedule publication

### For Analytics Users

1. Navigate to `/newspaper-analytics`
2. Select time range
3. View readership trends
4. Analyze top-performing articles
5. Understand reader demographics
6. Track engagement metrics

## Accessibility Features

- Semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast color schemes
- Responsive text sizing
- Focus indicators
- Alt text for images

## Performance Considerations

- Lazy loading for images
- Pagination for large lists
- Memoization of expensive calculations
- Debounced search inputs
- Virtualized lists for long content
- Optimized chart rendering

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
