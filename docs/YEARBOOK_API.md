# Yearbook Platform API Documentation

## Overview

The Digital Yearbook Platform enables educational institutions to create, manage, and publish interactive digital yearbooks. Students can collaborate by submitting photos, quotes, and memories, while also signing each other's yearbooks digitally.

## Features

- **Yearbook Edition Management**: Create and manage yearbooks for different academic years
- **Page Management**: Design and organize yearbook pages with customizable layouts
- **Digital Signatures**: Students can sign each other's yearbooks with messages, stickers, and emojis
- **Student Submissions**: Collaborative content creation through photo, quote, and memory submissions
- **Flip-Book Viewer**: Interactive digital viewing experience
- **PDF Generation**: Export yearbooks for print orders
- **Archive**: Browse and access past yearbooks

## Models

### YearbookEdition

Represents a yearbook for a specific academic year.

**Fields:**
- `id`: Unique identifier
- `institution_id`: Institution reference
- `academic_year`: Academic year (e.g., "2023-2024")
- `theme`: Yearbook theme/title
- `cover_design_url`: URL to cover design image
- `dedication_text`: Dedication message
- `editor_students`: JSON array of student IDs who are editors
- `publication_status`: Status (draft, in_progress, review, ready_for_print, published, archived)
- `digital_flip_book_url`: URL to digital flip-book version
- `pdf_url`: URL to PDF version
- `print_order_count`: Number of print orders placed
- `is_public`: Whether yearbook is publicly accessible
- `published_at`: Publication timestamp

### YearbookPage

Represents a single page in the yearbook.

**Fields:**
- `id`: Unique identifier
- `edition_id`: Reference to yearbook edition
- `page_number`: Sequential page number
- `section`: Page section (students, faculty, events, sports, clubs, memories, signatures)
- `layout_template`: Template name for page layout
- `photos`: JSON array of photo objects with captions and positions
- `text_content`: JSON array of text content with styling
- `background_color`: Page background color
- `background_image_url`: Background image URL
- `is_double_page`: Whether this is a double-page spread
- `is_locked`: Whether page is locked from editing

### YearbookSignature

Represents a digital signature from one student to another.

**Fields:**
- `id`: Unique identifier
- `edition_id`: Reference to yearbook edition
- `from_student_id`: Signing student
- `to_student_id`: Recipient student
- `message`: Signature message
- `stickers`: JSON array of sticker identifiers
- `emojis`: JSON array of emoji characters
- `page_location`: Page number where signature appears
- `font_style`: Text font style
- `color`: Text color
- `is_public`: Whether signature is publicly visible

### YearbookPhotoSubmission

Student-submitted photo for yearbook inclusion.

**Fields:**
- `id`: Unique identifier
- `edition_id`: Reference to yearbook edition
- `student_id`: Submitting student
- `photo_url`: Photo URL
- `s3_key`: S3 storage key
- `caption`: Photo caption
- `category`: Photo category
- `suggested_section`: Suggested yearbook section
- `status`: Review status (pending, approved, rejected)
- `reviewed_by`: Reviewing user ID
- `review_notes`: Review comments
- `page_id`: Assigned page (if approved)

### YearbookQuoteSubmission

Student-submitted quote for yearbook inclusion.

**Fields:**
- `id`: Unique identifier
- `edition_id`: Reference to yearbook edition
- `student_id`: Submitting student
- `quote_text`: Quote content
- `category`: Quote category
- `status`: Review status
- `reviewed_by`: Reviewing user ID
- `review_notes`: Review comments
- `page_id`: Assigned page (if approved)

### YearbookMemorySubmission

Student-submitted memory/story for yearbook inclusion.

**Fields:**
- `id`: Unique identifier
- `edition_id`: Reference to yearbook edition
- `student_id`: Submitting student
- `title`: Memory title
- `content`: Memory content
- `associated_event`: Related event name
- `tags`: JSON array of tags
- `status`: Review status
- `reviewed_by`: Reviewing user ID
- `review_notes`: Review comments
- `page_id`: Assigned page (if approved)

## API Endpoints

### Yearbook Edition Management

#### Create Yearbook Edition
```
POST /api/v1/yearbook/editions
```

**Request Body:**
```json
{
  "institution_id": 1,
  "academic_year": "2023-2024",
  "theme": "Memories of a Lifetime",
  "cover_design_url": "https://example.com/cover.jpg",
  "dedication_text": "Dedicated to the Class of 2024",
  "editor_students": [101, 102, 103],
  "publication_status": "draft",
  "is_public": false
}
```

#### List Yearbook Editions
```
GET /api/v1/yearbook/editions?skip=0&limit=100&academic_year=2023-2024&status=published
```

#### Get Yearbook Edition with Statistics
```
GET /api/v1/yearbook/editions/{edition_id}
```

**Response includes:**
- Total pages count
- Total signatures count
- Pending submissions count
- Approved submissions count

#### Update Yearbook Edition
```
PUT /api/v1/yearbook/editions/{edition_id}
```

#### Delete Yearbook Edition
```
DELETE /api/v1/yearbook/editions/{edition_id}
```

### Page Management

#### Create Yearbook Page
```
POST /api/v1/yearbook/pages
```

**Request Body:**
```json
{
  "edition_id": 1,
  "page_number": 1,
  "section": "students",
  "layout_template": "grid-4x4",
  "photos": [
    {
      "photo_url": "https://example.com/photo1.jpg",
      "caption": "First day of school",
      "position_x": 0,
      "position_y": 0,
      "width": 200,
      "height": 200
    }
  ],
  "text_content": [
    {
      "text": "Class of 2024",
      "position_x": 100,
      "position_y": 50,
      "font_family": "Arial",
      "font_size": 24,
      "color": "#000000"
    }
  ],
  "background_color": "#ffffff",
  "is_double_page": false,
  "is_locked": false
}
```

#### List Pages for Edition
```
GET /api/v1/yearbook/editions/{edition_id}/pages?section=students
```

#### Get Specific Page
```
GET /api/v1/yearbook/pages/{page_id}
```

#### Update Page
```
PUT /api/v1/yearbook/pages/{page_id}
```

#### Delete Page
```
DELETE /api/v1/yearbook/pages/{page_id}
```

### Signature Collection

#### Create Signature
```
POST /api/v1/yearbook/signatures
```

**Request Body:**
```json
{
  "edition_id": 1,
  "to_student_id": 105,
  "message": "It was great being in class with you! Stay awesome!",
  "stickers": ["star", "heart", "trophy"],
  "emojis": ["😊", "🎓", "🎉"],
  "page_location": 42,
  "font_style": "cursive",
  "color": "#0000ff",
  "is_public": true
}
```

#### List Signatures for Edition
```
GET /api/v1/yearbook/editions/{edition_id}/signatures?to_student_id=105&skip=0&limit=100
```

#### Get My Signatures
```
GET /api/v1/yearbook/signatures/my-signatures?edition_id=1
```

**Returns signatures received by the current student with student details.**

#### Update Signature
```
PUT /api/v1/yearbook/signatures/{signature_id}
```

#### Delete Signature
```
DELETE /api/v1/yearbook/signatures/{signature_id}
```

### Photo Submissions

#### Submit Photo
```
POST /api/v1/yearbook/photo-submissions
```

**Request Body:**
```json
{
  "edition_id": 1,
  "photo_url": "https://example.com/my-photo.jpg",
  "s3_key": "yearbook/2024/photos/photo123.jpg",
  "caption": "Science fair winners",
  "category": "academics",
  "suggested_section": "events"
}
```

#### List Photo Submissions
```
GET /api/v1/yearbook/editions/{edition_id}/photo-submissions?status=pending&skip=0&limit=100
```

#### Update Photo Submission
```
PUT /api/v1/yearbook/photo-submissions/{submission_id}
```

#### Review Photo Submission
```
POST /api/v1/yearbook/photo-submissions/{submission_id}/review
```

**Request Body:**
```json
{
  "status": "approved",
  "review_notes": "Great photo!",
  "page_id": 15
}
```

### Quote Submissions

#### Submit Quote
```
POST /api/v1/yearbook/quote-submissions
```

**Request Body:**
```json
{
  "edition_id": 1,
  "quote_text": "The future belongs to those who believe in the beauty of their dreams.",
  "category": "inspirational"
}
```

#### List Quote Submissions
```
GET /api/v1/yearbook/editions/{edition_id}/quote-submissions?status=pending
```

#### Update Quote Submission
```
PUT /api/v1/yearbook/quote-submissions/{submission_id}
```

#### Review Quote Submission
```
POST /api/v1/yearbook/quote-submissions/{submission_id}/review
```

### Memory Submissions

#### Submit Memory
```
POST /api/v1/yearbook/memory-submissions
```

**Request Body:**
```json
{
  "edition_id": 1,
  "title": "The Day We Won State Championship",
  "content": "It was an unforgettable day when our basketball team...",
  "associated_event": "State Basketball Championship",
  "tags": ["sports", "basketball", "championship"]
}
```

#### List Memory Submissions
```
GET /api/v1/yearbook/editions/{edition_id}/memory-submissions?status=approved
```

#### Update Memory Submission
```
PUT /api/v1/yearbook/memory-submissions/{submission_id}
```

#### Review Memory Submission
```
POST /api/v1/yearbook/memory-submissions/{submission_id}/review
```

### Flip-Book Viewing

#### Get Flip-Book Pages
```
GET /api/v1/yearbook/editions/{edition_id}/flipbook
```

**Returns ordered list of pages for digital flip-book display. Only available for published yearbooks.**

### Archive

#### Get Yearbook Archive
```
GET /api/v1/yearbook/archive
```

**Returns list of all published yearbooks for the institution with metadata.**

### PDF Generation & Print Orders

#### Generate PDF
```
POST /api/v1/yearbook/editions/{edition_id}/generate-pdf
```

**Triggers background job to generate PDF for the yearbook.**

#### Create Print Order
```
POST /api/v1/yearbook/print-orders
```

**Request Body:**
```json
{
  "edition_id": 1,
  "quantity": 50,
  "delivery_address": "123 School St, City, State 12345",
  "contact_name": "John Doe",
  "contact_phone": "+1234567890",
  "contact_email": "john.doe@school.edu",
  "special_instructions": "Rush delivery needed"
}
```

### Statistics

#### Get Edition Statistics
```
GET /api/v1/yearbook/editions/{edition_id}/statistics
```

**Returns comprehensive statistics:**
- Total pages
- Pages by section breakdown
- Total signatures
- Submission counts by status (photos, quotes, memories)
- Print order count
- Publication status

## Publication Workflow

1. **Draft**: Initial creation, editors can add content
2. **In Progress**: Active development, students can submit content
3. **Review**: Content review and finalization
4. **Ready for Print**: PDF generated, ready for print orders
5. **Published**: Available for viewing and ordering
6. **Archived**: Historical archive

## Submission Review Workflow

1. Student submits photo/quote/memory
2. Status: **Pending**
3. Editor reviews submission
4. Status: **Approved** or **Rejected**
5. If approved, assigned to specific page
6. Content appears in yearbook

## Authorization

- **Students**: Can submit content, sign yearbooks, view published yearbooks
- **Editors**: Can manage pages, review submissions, update yearbook settings
- **Admins**: Full access to all yearbook features
- All endpoints require authentication via JWT token

## Best Practices

1. **Lock pages** when they are finalized to prevent accidental edits
2. **Review submissions** regularly to keep students engaged
3. **Set submission deadlines** using the publication status workflow
4. **Test PDF generation** before placing bulk print orders
5. **Back up yearbook data** before publishing
6. **Use appropriate sections** to organize content logically
7. **Encourage student participation** through announcements and reminders

## Technical Considerations

- **Photo uploads** should be handled separately via S3/file upload endpoint
- **PDF generation** is an async background task
- **Flip-book URLs** may require external viewer integration
- **Print orders** may integrate with external printing services
- **Signature limits** can be configured per institution
- **Storage quotas** should be monitored for photo submissions
