# Study Materials Library - Quick Start Guide

## Overview
The Study Materials Library provides a complete digital library system for educational institutions with file management, search, bookmarking, and sharing capabilities.

## Quick Setup

### 1. Backend Setup

```bash
# Run database migration
alembic upgrade head

# Start the backend server
uvicorn src.main:app --reload
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (includes react-dropzone and lodash)
npm install

# Start development server
npm run dev
```

## Key Features at a Glance

### 📁 File Management
- Upload files via drag-and-drop
- Support for PDF, Video, Audio, Images, Documents, Presentations, Spreadsheets
- Automatic file type detection
- File size tracking

### 🔍 Search & Discovery
- Real-time autocomplete search
- Filter by type, subject, chapter, topic, grade, tags, date
- Sort by date, title, views, downloads
- Hierarchical navigation tree

### 📚 Organization
- Subject → Chapter → Topic hierarchy
- Tag-based categorization
- Custom metadata (title, description)
- Public/private visibility

### ⭐ Bookmarks & Favorites
- Bookmark materials for quick access
- Mark favorites
- Add personal notes to bookmarks

### 📊 Analytics
- View count tracking
- Download statistics
- Recently accessed materials
- Popular materials

### 🔗 Sharing
- Generate shareable links
- Set expiration dates
- Share with custom messages
- Copy link to clipboard

## Usage Examples

### Upload a Material

1. Click "Upload Material" button
2. Drag & drop a file or click to browse
3. Fill in title and description
4. Select grade, subject, chapter, topic (optional)
5. Add tags
6. Toggle public/private
7. Click "Upload"

### Search for Materials

1. Use the search bar for quick search
2. Click filter icon for advanced filters
3. Select material type, subject, etc.
4. Apply filters
5. Results update automatically

### Browse by Hierarchy

1. Left sidebar shows subject tree
2. Click to expand subjects
3. Click to expand chapters
4. Click topics to filter materials
5. Material count shown at each level

### View & Download

1. Click any material card
2. Material viewer opens with preview
3. For PDFs: inline viewer
4. For Videos: embedded player
5. For Audio: audio player
6. Click "Download" to save locally

### Bookmark Materials

1. Click bookmark icon on material card
2. Material added to bookmarks
3. Click star icon to mark as favorite
4. Access bookmarks from "Bookmarks" tab

### Share Materials

1. Click share icon on material
2. Share dialog opens
3. Add optional message
4. Set expiration date (optional)
5. Click "Create Share Link"
6. Copy link and share

## API Endpoints Quick Reference

### Upload
- `POST /api/v1/study-materials/upload`

### Search & List
- `GET /api/v1/study-materials/search?query=...&material_type=pdf`
- `GET /api/v1/study-materials/{id}`

### Actions
- `POST /api/v1/study-materials/{id}/view`
- `POST /api/v1/study-materials/{id}/download`

### Bookmarks
- `POST /api/v1/study-materials/bookmarks`
- `GET /api/v1/study-materials/bookmarks/my/list`
- `DELETE /api/v1/study-materials/bookmarks/{id}`

### Sharing
- `POST /api/v1/study-materials/share`
- `GET /api/v1/study-materials/share/{token}`

### Navigation
- `GET /api/v1/study-materials/hierarchy/tree`
- `GET /api/v1/study-materials/autocomplete/suggestions?q=...`

### Stats
- `GET /api/v1/study-materials/stats/overview`
- `GET /api/v1/study-materials/recent/accessed`

## Component Reference

### Page Component
- `StudyMaterialsLibrary` - Main library page

### UI Components
- `MaterialCard` - Displays individual material
- `MaterialHierarchyTree` - Subject/Chapter/Topic navigation
- `MaterialUploadForm` - Upload dialog
- `MaterialSearchBar` - Search with autocomplete
- `MaterialFilterDialog` - Advanced filters
- `MaterialViewer` - File viewer with player
- `MaterialShareDialog` - Share link generator

## Material Types Supported

| Type | Extensions | Viewer |
|------|-----------|--------|
| PDF | .pdf | Inline PDF viewer |
| Video | .mp4, .webm, .ogg | HTML5 video player |
| Audio | .mp3, .wav, .ogg | HTML5 audio player |
| Image | .jpg, .png, .gif, .svg | Image viewer |
| Document | .doc, .docx | Download only |
| Presentation | .ppt, .pptx | Download only |
| Spreadsheet | .xls, .xlsx | Download only |
| Archive | .zip, .rar, .7z | Download only |

## Database Schema

### Tables Created
- `study_materials` - Main materials table
- `material_bookmarks` - User bookmarks
- `material_access_logs` - View/download tracking
- `material_shares` - Share links
- `material_tags` - Tag definitions

### Relationships
- Materials belong to Institution
- Materials link to Subject, Chapter, Topic, Grade
- Materials have many Bookmarks, AccessLogs, Shares
- Bookmarks belong to User and Material

## Configuration

### Environment Variables

Backend (.env):
```
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket
AWS_REGION=your_region
```

Frontend (.env):
```
VITE_API_BASE_URL=http://localhost:8000
```

## Testing the Implementation

### 1. Upload Test
```bash
# Upload a PDF file
curl -X POST http://localhost:8000/api/v1/study-materials/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "title=Test Material" \
  -F "description=Test Description"
```

### 2. Search Test
```bash
# Search materials
curl http://localhost:8000/api/v1/study-materials/search?query=test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Stats Test
```bash
# Get statistics
curl http://localhost:8000/api/v1/study-materials/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### File Upload Issues
- Check S3 credentials
- Verify file size limits
- Ensure MIME type is supported

### Search Not Working
- Verify database indexes created
- Check search query format
- Ensure materials exist in database

### Hierarchy Empty
- Verify subjects, chapters, topics exist
- Check materials are linked to hierarchy
- Ensure institution context is correct

## Next Steps

1. Configure S3 storage for production
2. Set up thumbnail generation
3. Implement role-based access control
4. Add bulk upload functionality
5. Configure email notifications for shares
6. Set up analytics dashboard
7. Implement content recommendations

## Support

For issues or questions:
1. Check the implementation documentation
2. Review API endpoint documentation
3. Check database migrations
4. Verify environment configuration
