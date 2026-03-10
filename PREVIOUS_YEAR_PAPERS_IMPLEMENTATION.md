# Previous Year Papers Repository Backend - Implementation Guide

## Overview

This document describes the implementation of the Previous Year Papers Repository backend system with comprehensive metadata management, PDF storage, OCR text extraction, and advanced search and filtering capabilities.

## Features Implemented

### 1. Database Models

#### Previous Year Papers Table (`previous_year_papers`)
Comprehensive metadata for previous year examination papers:
- **Basic Info**: title, description, board, year, exam_month
- **Academic Mapping**: institution_id, grade_id, subject_id
- **Exam Details**: total_marks, duration_minutes
- **File Storage**: pdf_file_name, pdf_file_size, pdf_file_url, pdf_s3_key
- **OCR Support**: ocr_text, ocr_processed, ocr_processed_at
- **Metadata**: tags, view_count, download_count
- **Tracking**: is_active, uploaded_by, created_at, updated_at

#### Question Bank Table (`questions_bank`)
Detailed question metadata with comprehensive tagging:
- **Question Details**: question_text, question_type, marks, estimated_time_minutes
- **Academic Mapping**: institution_id, grade_id, subject_id, chapter_id, topic_id, paper_id
- **Classification**: difficulty_level, bloom_taxonomy_level
- **Content**: answer_text, explanation, hints, options, correct_option
- **Media**: image_url, image_s3_key
- **Metadata**: tags, keywords, usage_count
- **Verification**: is_verified, verified_by, verified_at
- **Tracking**: is_active, created_by, created_at, updated_at

### 2. Enums and Classifications

#### Board
- CBSE
- ICSE
- STATE_BOARD
- IB
- CAMBRIDGE
- OTHER

#### Question Type
- MULTIPLE_CHOICE
- SHORT_ANSWER
- LONG_ANSWER
- TRUE_FALSE
- FILL_IN_BLANK
- NUMERICAL
- MATCH_THE_FOLLOWING
- ASSERTION_REASONING

#### Difficulty Level
- VERY_EASY
- EASY
- MEDIUM
- HARD
- VERY_HARD

#### Bloom's Taxonomy Level
- REMEMBER
- UNDERSTAND
- APPLY
- ANALYZE
- EVALUATE
- CREATE

### 3. File Storage

#### PDF Storage for Papers
- S3-based storage with configurable bucket
- Upload endpoint: `POST /api/v1/previous-year-papers/{paper_id}/upload-pdf`
- File validation (PDF only, max 50MB)
- Automatic cleanup of old files on replacement
- Secure presigned URLs for downloads

#### Image Storage for Questions
- S3-based storage for question images
- Upload endpoint: `POST /api/v1/question-bank/{question_id}/upload-image`
- File validation (images only, max 5MB)
- Support for mathematical diagrams, graphs, etc.

### 4. OCR Text Extraction

#### OCR Service (`src/utils/ocr_service.py`)
Preparation tools for OCR text extraction:

**Text Extraction from PDF**
```python
ocr_service.extract_text_from_pdf(pdf_bytes)
```

**OCR Preparation**
```python
ocr_service.prepare_for_ocr(pdf_bytes)
```

**Quality Validation**
```python
ocr_service.validate_ocr_quality(ocr_text)
```

**Question Extraction**
```python
ocr_service.extract_questions_from_text(ocr_text)
```

**Chapter Tagging**
```python
ocr_service.tag_chapters_in_text(ocr_text, chapters)
```

#### OCR Workflow
1. Upload PDF paper
2. Extract text using OCR service (integrate with Tesseract/AWS Textract/Google Vision)
3. Validate OCR quality
4. Process OCR endpoint: `POST /api/v1/previous-year-papers/{paper_id}/process-ocr`
5. Extract questions from OCR text
6. Tag chapters automatically

### 5. API Endpoints

#### Previous Year Papers

**Create Paper**
```
POST /api/v1/previous-year-papers/
```

**List Papers with Filters**
```
GET /api/v1/previous-year-papers/?board=cbse&year=2023&grade_id=1&subject_id=2&search=algebra
```

**Get Paper Details**
```
GET /api/v1/previous-year-papers/{paper_id}
```

**Get Paper with OCR Text**
```
GET /api/v1/previous-year-papers/{paper_id}/with-ocr
```

**Update Paper**
```
PUT /api/v1/previous-year-papers/{paper_id}
```

**Delete Paper**
```
DELETE /api/v1/previous-year-papers/{paper_id}
```

**Upload PDF**
```
POST /api/v1/previous-year-papers/{paper_id}/upload-pdf
```

**Process OCR**
```
POST /api/v1/previous-year-papers/{paper_id}/process-ocr
```

**Increment View Count**
```
POST /api/v1/previous-year-papers/{paper_id}/view
```

**Increment Download Count**
```
POST /api/v1/previous-year-papers/{paper_id}/download
```

**Get Facets for Filtering**
```
GET /api/v1/previous-year-papers/facets
```

**Get Statistics**
```
GET /api/v1/previous-year-papers/statistics
```

#### Question Bank

**Create Question**
```
POST /api/v1/question-bank/
```

**List Questions with Filters**
```
GET /api/v1/question-bank/?grade_id=1&subject_id=2&chapter_id=3&topic_id=4&question_type=multiple_choice&difficulty_level=medium&bloom_taxonomy_level=apply&is_verified=true
```

**Get Question by Paper**
```
GET /api/v1/question-bank/paper/{paper_id}
```

**Get Question Details**
```
GET /api/v1/question-bank/{question_id}
```

**Update Question**
```
PUT /api/v1/question-bank/{question_id}
```

**Delete Question**
```
DELETE /api/v1/question-bank/{question_id}
```

**Verify Question**
```
POST /api/v1/question-bank/{question_id}/verify
```

**Upload Question Image**
```
POST /api/v1/question-bank/{question_id}/upload-image
```

**Increment Usage Count**
```
POST /api/v1/question-bank/{question_id}/use
```

**Get Facets for Filtering**
```
GET /api/v1/question-bank/facets
```

**Get Statistics**
```
GET /api/v1/question-bank/statistics
```

### 6. Search and Filtering

#### Faceted Filtering for Papers
- **Board**: Count by education board
- **Year**: List of available years
- **Grade**: Filter by grade
- **Subject**: Filter by subject
- **OCR Status**: Processed/Not processed
- **Text Search**: Title, description, tags

#### Faceted Filtering for Questions
- **Question Type**: Count by type
- **Difficulty Level**: Count by difficulty
- **Bloom's Taxonomy**: Count by cognitive level
- **Grade/Subject**: Academic mapping
- **Chapter/Topic**: Fine-grained filtering
- **Verification Status**: Verified/Unverified
- **Text Search**: Question text, tags, keywords

### 7. Chapter-wise Tagging

Questions can be tagged with:
- **Grade**: Academic level
- **Subject**: Subject area
- **Chapter**: Specific chapter
- **Topic**: Specific topic within chapter

Automatic chapter detection from OCR text using keyword matching.

### 8. Statistics and Analytics

#### Paper Statistics
- Total papers count
- Papers by board
- Papers by year
- Papers by grade
- Papers by subject
- OCR processed count
- OCR pending count

#### Question Statistics
- Total questions count
- Questions by type
- Questions by difficulty
- Questions by Bloom's taxonomy level
- Verified vs unverified count
- Questions by chapter distribution

## Database Schema

### Indexes
Comprehensive indexing for optimal query performance:
- Institution-based filtering
- Board and year combinations
- Grade and subject combinations
- Chapter and topic combinations
- OCR processing status
- Verification status
- Creation date sorting

### Foreign Keys
- CASCADE delete for institution, grade, subject
- SET NULL for user references (uploaded_by, verified_by)
- CASCADE delete for paper_id in questions

## Usage Examples

### Creating a Previous Year Paper

```python
POST /api/v1/previous-year-papers/
{
  "institution_id": 1,
  "title": "CBSE Class 12 Mathematics 2023",
  "description": "Annual examination paper",
  "board": "cbse",
  "year": 2023,
  "exam_month": "March",
  "grade_id": 12,
  "subject_id": 5,
  "total_marks": 100,
  "duration_minutes": 180,
  "tags": "calculus, algebra, geometry",
  "uploaded_by": 10
}
```

### Creating a Question

```python
POST /api/v1/question-bank/
{
  "institution_id": 1,
  "paper_id": 25,
  "question_text": "Evaluate the definite integral...",
  "question_type": "long_answer",
  "grade_id": 12,
  "subject_id": 5,
  "chapter_id": 15,
  "topic_id": 42,
  "difficulty_level": "hard",
  "bloom_taxonomy_level": "apply",
  "marks": 6.0,
  "estimated_time_minutes": 15,
  "answer_text": "Step-by-step solution...",
  "explanation": "This uses integration by parts...",
  "tags": "integration, calculus",
  "keywords": "definite integral, limits",
  "created_by": 10
}
```

### Searching Papers

```python
GET /api/v1/previous-year-papers/?board=cbse&year=2023&grade_id=12&subject_id=5&search=mathematics
```

### Searching Questions

```python
GET /api/v1/question-bank/?grade_id=12&subject_id=5&chapter_id=15&difficulty_level=medium&bloom_taxonomy_level=apply&is_verified=true&search=integration
```

## Integration Points

### External OCR Services
The system is prepared to integrate with:
- **AWS Textract**: For production-grade OCR
- **Google Cloud Vision API**: Alternative OCR service
- **Tesseract OCR**: Open-source option
- **Azure Computer Vision**: Microsoft's OCR service

### File Storage
Currently configured for AWS S3, can be adapted for:
- Google Cloud Storage
- Azure Blob Storage
- MinIO (self-hosted S3-compatible)

## Security Considerations

1. **Institution Isolation**: All queries filter by institution_id
2. **File Validation**: PDF and image files validated before upload
3. **Size Limits**: 50MB for PDFs, 5MB for images
4. **Access Control**: User authorization checked for all operations
5. **S3 Security**: Presigned URLs with expiration for downloads

## Performance Optimizations

1. **Composite Indexes**: board+year, grade+subject, chapter+topic
2. **Selective Loading**: OCR text loaded only when requested
3. **Pagination**: Default limit of 100 items per request
4. **Count Queries**: Optimized facet counting with database-level aggregation

## Future Enhancements

1. **AI-powered Question Classification**: Auto-detect difficulty and Bloom's level
2. **Duplicate Detection**: Identify similar questions across papers
3. **Auto-tagging**: ML-based chapter and topic tagging
4. **Question Recommendation**: Suggest similar questions
5. **Practice Test Generation**: Auto-generate tests from question bank
6. **Analytics Dashboard**: Visual analytics for paper trends
7. **Bulk Upload**: Import multiple papers at once
8. **Question Templates**: Reusable question formats

## Migration

To apply the database migration:

```bash
alembic upgrade head
```

To rollback:

```bash
alembic downgrade -1
```

## Testing

Test the endpoints using the FastAPI interactive docs:
```
http://localhost:8000/docs
```

## Dependencies

Required Python packages:
- PyPDF2: PDF text extraction
- Pillow: Image processing
- boto3: AWS S3 integration
- sqlalchemy: Database ORM
- fastapi: API framework
- pydantic: Data validation

## Conclusion

This implementation provides a comprehensive backend for managing previous year examination papers with:
- Rich metadata and classification
- File storage and OCR support
- Advanced search and filtering
- Chapter-wise question tagging
- Statistics and analytics
- Scalable architecture for future enhancements
