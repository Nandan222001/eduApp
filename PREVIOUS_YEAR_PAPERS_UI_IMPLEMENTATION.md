# Previous Year Papers Repository UI Implementation

This document describes the complete implementation of the Previous Year Papers Repository UI with all requested features.

## Features Implemented

### 1. Paper Upload Form
- **File**: `frontend/src/pages/PaperUploadPage.tsx`
- Comprehensive form with metadata fields:
  - Board (CBSE, ICSE, State Board, IB, Cambridge, Other)
  - Year (validation for 1900-2100)
  - Subject and Grade selection
  - Paper Set/Exam Month
  - Total Marks and Duration
  - Description and Tags
  - PDF file upload with validation (max 50MB)
- Real-time validation and error handling
- Success feedback after upload

### 2. Paper Viewer with PDF Renderer
- **File**: `frontend/src/pages/PaperViewerPage.tsx`
- Embedded PDF viewer with iframe
- Zoom controls (50% to 200%)
- Download and Print functionality
- View count and download count tracking
- Paper metadata display with chips
- Integration with question tagging interface

### 3. Chapter-wise Question Tagging Interface
- **File**: `frontend/src/components/papers/QuestionTaggingInterface.tsx`
- Add multiple questions with metadata:
  - Question text (multiline input)
  - Question type (Multiple Choice, Short Answer, Long Answer, etc.)
  - Difficulty level (Very Easy to Very Hard)
  - Bloom's Taxonomy level (Remember to Create)
  - Marks allocation
  - Tags and keywords
- AI-powered tag suggestions
- Batch save functionality
- Question preview before saving

### 4. AI Tag Suggestion Service
- **Files**: 
  - `src/services/ai_tag_suggestion_service.py`
  - `src/api/v1/question_bank.py` (suggest-tags endpoint)
- Keyword extraction from question text
- Chapter and topic matching based on text analysis
- Difficulty level prediction based on question indicators
- Bloom's taxonomy level prediction based on keywords
- Confidence score calculation

### 5. Question Bank Browser
- **File**: `frontend/src/pages/QuestionBankBrowserPage.tsx`
- Advanced filters:
  - Question type filter
  - Difficulty level filter
  - Bloom's taxonomy level filter
  - Board, year, grade, subject filters
  - Keyword search with highlighting
- Pagination support (12 items per page)
- Question card display with metadata
- Bookmark functionality integration
- Download individual questions
- Print support

### 6. Search Functionality with Keyword Highlighting
- Implemented in `QuestionBankBrowserPage.tsx`
- Real-time search across question text
- Highlighted search terms in results (yellow background)
- Search on Enter key press
- Clear filters option

### 7. Bookmark Feature
- **Files**:
  - `src/models/previous_year_papers.py` (QuestionBookmark model)
  - `src/schemas/previous_year_papers.py` (Bookmark schemas)
  - `src/api/v1/question_bookmarks.py` (API endpoints)
  - `src/services/question_bookmark_service.py` (Business logic)
- Add/remove bookmarks with icon toggle
- Personal notes and tags for bookmarks
- Check bookmark status per question
- List all bookmarked questions

### 8. Download/Print Options
- Download individual questions as text files
- Print entire paper from viewer
- Print filtered question lists
- Download count tracking for papers

### 9. Paper List Page
- **File**: `frontend/src/pages/PaperListPage.tsx`
- Grid view of all papers
- Filter by board, year, status
- Search functionality
- Navigation to paper viewer
- Statistics display (views, downloads)
- OCR processing status indicator

## Backend Implementation

### Models
- **File**: `src/models/previous_year_papers.py`
- Added `QuestionBookmark` model with:
  - User-question relationship (unique constraint)
  - Personal notes and tags
  - Timestamps
  - Institution association

### Schemas
- **File**: `src/schemas/previous_year_papers.py`
- Added schemas:
  - `QuestionBookmarkCreate`
  - `QuestionBookmarkUpdate`
  - `QuestionBookmarkResponse`
  - `QuestionTagSuggestion`

### API Endpoints

#### Previous Year Papers API (`src/api/v1/previous_year_papers.py`)
- `POST /` - Create paper
- `GET /` - List papers with filters
- `GET /{paper_id}` - Get paper details
- `GET /{paper_id}/with-ocr` - Get paper with OCR text
- `PUT /{paper_id}` - Update paper
- `DELETE /{paper_id}` - Delete paper
- `POST /{paper_id}/upload-pdf` - Upload PDF file
- `POST /{paper_id}/process-ocr` - Process OCR
- `POST /{paper_id}/view` - Increment view count
- `POST /{paper_id}/download` - Increment download count
- `GET /statistics` - Get paper statistics
- `GET /facets` - Get filter facets

#### Question Bank API (`src/api/v1/question_bank.py`)
- `POST /` - Create question
- `GET /` - List questions with filters
- `GET /{question_id}` - Get question details
- `PUT /{question_id}` - Update question
- `DELETE /{question_id}` - Delete question
- `POST /{question_id}/verify` - Verify question
- `POST /{question_id}/upload-image` - Upload question image
- `POST /{question_id}/use` - Increment usage count
- `POST /{question_id}/suggest-tags` - AI tag suggestions (NEW)
- `GET /paper/{paper_id}` - Get questions by paper
- `GET /statistics` - Get question statistics
- `GET /facets` - Get filter facets

#### Question Bookmarks API (`src/api/v1/question_bookmarks.py`) - NEW
- `POST /` - Create bookmark
- `GET /` - List user bookmarks
- `GET /{bookmark_id}` - Get bookmark details
- `PUT /{bookmark_id}` - Update bookmark
- `DELETE /{bookmark_id}` - Delete bookmark
- `GET /check/{question_id}` - Check if question is bookmarked

### Services
1. **AITagSuggestionService** (`src/services/ai_tag_suggestion_service.py`)
   - Keyword extraction using NLP techniques
   - Chapter/topic matching
   - Difficulty prediction
   - Bloom's taxonomy level prediction

2. **QuestionBookmarkService** (`src/services/question_bookmark_service.py`)
   - CRUD operations for bookmarks
   - User-specific bookmark management
   - Duplicate prevention

## Frontend Implementation

### Types
- **File**: `frontend/src/types/previousYearPapers.ts`
- Comprehensive TypeScript interfaces:
  - `PreviousYearPaper`
  - `QuestionBank`
  - `QuestionBookmark`
  - `QuestionTagSuggestion`
  - Enums: `Board`, `QuestionType`, `DifficultyLevel`, `BloomTaxonomyLevel`
  - Filter interfaces

### API Client
- **File**: `frontend/src/api/previousYearPapers.ts`
- Complete API client with methods for:
  - Paper CRUD operations
  - Question CRUD operations
  - Bookmark operations
  - PDF upload
  - OCR processing
  - Statistics and facets
  - AI tag suggestions

### Components
1. **QuestionTaggingInterface** (`frontend/src/components/papers/QuestionTaggingInterface.tsx`)
   - Reusable component for tagging questions
   - AI integration
   - Batch operations

### Pages
1. **PaperListPage** - Browse all papers
2. **PaperUploadPage** - Upload new papers
3. **PaperViewerPage** - View and interact with papers
4. **QuestionBankBrowserPage** - Browse and search questions

### Navigation
- Updated `frontend/src/config/navigation.tsx`
- Added "Previous Year Papers" section with:
  - All Papers
  - Upload Paper
  - Question Bank

### Routing
- Updated `frontend/src/App.tsx` with routes:
  - `/admin/papers/list`
  - `/admin/papers/upload`
  - `/admin/papers/view/:paperId`
  - `/admin/papers/question-bank`

## Database Schema

### QuestionBookmark Table
```sql
CREATE TABLE question_bookmarks (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    institution_id INTEGER NOT NULL,
    notes TEXT,
    tags VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions_bank(id) ON DELETE CASCADE,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    UNIQUE(user_id, question_id)
);

CREATE INDEX idx_qbm_user ON question_bookmarks(user_id);
CREATE INDEX idx_qbm_question ON question_bookmarks(question_id);
CREATE INDEX idx_qbm_institution ON question_bookmarks(institution_id);
```

## Features Overview

### Paper Management
✅ Upload papers with comprehensive metadata
✅ PDF file storage and retrieval
✅ OCR text processing support
✅ Paper statistics and analytics
✅ View/download tracking

### Question Management
✅ Extract questions from papers
✅ Tag questions with metadata
✅ AI-powered tag suggestions
✅ Question verification workflow
✅ Image support for questions

### Search & Browse
✅ Advanced filtering (board, year, subject, chapter, difficulty, type)
✅ Full-text search with keyword highlighting
✅ Faceted search with counts
✅ Pagination support
✅ Sort options

### User Features
✅ Bookmark important questions
✅ Add personal notes to bookmarks
✅ Download questions in text format
✅ Print papers and question sets
✅ Track usage statistics

### AI Features
✅ Automatic keyword extraction
✅ Chapter/topic suggestion
✅ Difficulty level prediction
✅ Bloom's taxonomy classification
✅ Confidence scoring

## Files Created/Modified

### Backend
- `src/models/previous_year_papers.py` (modified - added QuestionBookmark)
- `src/schemas/previous_year_papers.py` (modified - added bookmark schemas)
- `src/api/v1/question_bookmarks.py` (new)
- `src/api/v1/question_bank.py` (modified - added suggest-tags endpoint)
- `src/api/v1/__init__.py` (modified - registered bookmarks router)
- `src/services/question_bookmark_service.py` (new)
- `src/services/ai_tag_suggestion_service.py` (new)
- `src/models/__init__.py` (modified - exported QuestionBookmark)

### Frontend
- `frontend/src/types/previousYearPapers.ts` (new)
- `frontend/src/api/previousYearPapers.ts` (new)
- `frontend/src/pages/PaperListPage.tsx` (new)
- `frontend/src/pages/PaperUploadPage.tsx` (new)
- `frontend/src/pages/PaperViewerPage.tsx` (new)
- `frontend/src/pages/QuestionBankBrowserPage.tsx` (new)
- `frontend/src/components/papers/QuestionTaggingInterface.tsx` (new)
- `frontend/src/components/papers/index.ts` (new)
- `frontend/src/config/navigation.tsx` (modified - added navigation items)
- `frontend/src/App.tsx` (modified - added routes)

## Usage Guide

### Uploading a Paper
1. Navigate to "Previous Year Papers" → "Upload Paper"
2. Fill in paper metadata (title, board, year, subject, etc.)
3. Upload PDF file
4. Click "Upload Paper"

### Viewing a Paper
1. Navigate to "Previous Year Papers" → "All Papers"
2. Click "View Paper" on any paper card
3. Use zoom controls to adjust view
4. Click "Tag Questions" to add questions

### Tagging Questions
1. Open paper viewer
2. Click "Tag Questions" button
3. Enter question text
4. Click "AI Suggest Tags" for automatic tagging
5. Adjust metadata as needed
6. Click "Add Question" to add to batch
7. Click "Save All Questions" when done

### Browsing Questions
1. Navigate to "Previous Year Papers" → "Question Bank"
2. Use filters to narrow down questions
3. Search for specific keywords
4. Click bookmark icon to save questions
5. Download or print individual questions

### Managing Bookmarks
1. Bookmark questions from question bank
2. Add personal notes to bookmarks
3. View all bookmarks from your profile
4. Remove bookmarks when no longer needed

## Technical Notes

- PDF rendering uses iframe with blob URLs
- Search highlighting uses regex with mark tags
- AI suggestions use keyword frequency analysis
- Bookmarks are user-specific with unique constraints
- All API calls include proper error handling
- Loading states and error messages throughout UI
- Responsive design for mobile and desktop
- Accessibility features included (ARIA labels, keyboard navigation)

## Future Enhancements

- Advanced NLP for better AI suggestions
- Similarity search for duplicate questions
- Question difficulty adjustment based on student performance
- Collaborative tagging with crowd-sourcing
- Export to various formats (Word, PDF with questions)
- Question paper generator from question bank
- Integration with exam creation workflow
- Analytics dashboard for paper usage
- Recommendation engine for relevant papers
