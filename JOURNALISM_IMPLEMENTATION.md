# Student Journalism and Newspaper Platform Implementation

## Overview
This document describes the implementation of the student journalism and newspaper platform feature.

## Files Created/Modified

### Models (`src/models/journalism.py`)
Created comprehensive models for the journalism platform:

1. **NewspaperEdition** - Manages newspaper editions
   - Fields: edition_number, publication_date, theme, editor_in_chief_student_id, editorial_board, publication_status, cover_image_url, description, total_pages, pdf_url
   - Statuses: draft, review, published, archived
   - Relationships: Institution, Student (editor), Articles

2. **Article** - Manages individual articles
   - Fields: title, author_student_id, article_type, content_html, images, category, word_count, submission_date, review_status, editor_notes, publish_date, slug, excerpt, tags, featured, view_count
   - Types: news, opinion, feature, sports, arts, humor
   - Review Statuses: pending, peer_review, editor_review, faculty_review, approved, rejected, revision_requested
   - Relationships: Institution, Edition, Author (Student), Reviews, Analytics

3. **ArticleReview** - Tracks editorial workflow reviews
   - Fields: article_id, reviewer_student_id, reviewer_user_id, review_type, comments, rating, approved, reviewed_at
   - Supports both student peer reviews and faculty advisor reviews

4. **JournalismMember** - Tracks student roles in journalism
   - Fields: student_id, role, position_title, bio, portfolio_url, specialization, join_date, is_active
   - Roles: writer, editor, photographer, designer

5. **ArticleAnalytics** - Tracks reader engagement
   - Fields: article_id, user_id, student_id, view_date, view_time, time_spent_seconds, engagement_score, device_type, referrer_source, ip_address

### Schemas (`src/schemas/journalism.py`)
Created Pydantic schemas for request/response validation:
- Edition schemas: Create, Update, Response, DetailResponse
- Article schemas: Create, Update, Response, DetailResponse, SubmitRequest, PublishRequest
- Review schemas: Create, Response, DetailResponse
- Member schemas: Create, Update, Response, DetailResponse
- Analytics schemas: Create, Response, Summary
- Additional schemas: EditionAnalyticsSummary, JournalismMemberStats, WorkflowStatusUpdate

### API Endpoints (`src/api/v1/journalism.py`)

#### Newspaper Edition Endpoints
- `POST /journalism/editions` - Create new edition
- `GET /journalism/editions` - List editions (with filters: status, year)
- `GET /journalism/editions/{edition_id}` - Get edition details
- `PUT /journalism/editions/{edition_id}` - Update edition
- `DELETE /journalism/editions/{edition_id}` - Delete edition

#### Article Endpoints
- `POST /journalism/articles` - Create article (auto-generates slug and word count)
- `GET /journalism/articles` - List articles (with filters: type, status, edition, author, category, featured, search)
- `GET /journalism/articles/published` - List published articles
- `GET /journalism/articles/{article_id}` - Get article details
- `PUT /journalism/articles/{article_id}` - Update article
- `DELETE /journalism/articles/{article_id}` - Delete article

#### Workflow Endpoints
- `POST /journalism/articles/{article_id}/submit` - Submit for peer review
- `POST /journalism/articles/{article_id}/publish` - Publish approved article
- `PUT /journalism/articles/{article_id}/workflow` - Update workflow status

#### Review Endpoints
- `POST /journalism/reviews` - Create review
- `GET /journalism/articles/{article_id}/reviews` - Get article reviews

#### Member Management Endpoints
- `POST /journalism/members` - Assign journalism role
- `GET /journalism/members` - List members (with filters: role, active status)
- `GET /journalism/members/{member_id}` - Get member details
- `PUT /journalism/members/{member_id}` - Update member
- `DELETE /journalism/members/{member_id}` - Remove member

#### Analytics Endpoints
- `POST /journalism/analytics/view` - Track article view
- `GET /journalism/analytics/articles/{article_id}` - Get article analytics
- `GET /journalism/analytics/editions/{edition_id}` - Get edition analytics
- `GET /journalism/analytics/members/stats` - Get member statistics

## Editorial Workflow

The platform implements a complete editorial workflow:

1. **Submission** - Student writers create and submit articles (status: pending)
2. **Peer Review** - Articles move to peer_review status for student editor feedback
3. **Editor Approval** - Senior editors review and provide editor_notes (status: editor_review)
4. **Faculty Review** - Faculty advisor provides final review (status: faculty_review)
5. **Approval/Rejection** - Articles are approved or rejected with feedback
6. **Publication** - Approved articles can be published with a publish_date

## Features Implemented

### Core Features
- Article CRUD with automatic slug generation and word count calculation
- Multi-stage editorial workflow with review tracking
- Role-based journalism team management (writer, editor, photographer, designer)
- Newspaper edition management with editorial boards
- Rich article metadata (tags, categories, images, excerpts, featured status)

### Analytics & Engagement
- Article view tracking with engagement metrics
- Time spent and engagement scoring
- Device type and referrer source tracking
- Edition-level analytics with top articles
- Member performance statistics with total views and ratings

### Advanced Features
- Search functionality across article titles and excerpts
- Filtering by type, status, category, edition, author, and featured status
- Published articles endpoint for public consumption
- Unique edition number validation per institution
- Support for multiple reviewers per article
- Article-to-edition assignment

## Database Relationships

- NewspaperEdition -> Article (one-to-many)
- Student -> Article (author, one-to-many)
- Student -> NewspaperEdition (editor-in-chief, one-to-many)
- Article -> ArticleReview (one-to-many)
- Article -> ArticleAnalytics (one-to-many)
- Student -> JournalismMember (one-to-many)
- Institution -> All models (one-to-many, institution isolation)

## Security & Authorization
- All endpoints require authentication via `get_current_user` dependency
- Institution-level isolation enforced on all queries
- Only authorized users can create/modify content within their institution

## Utility Functions
- `generate_slug()` - Creates URL-friendly slugs from article titles
- `calculate_word_count()` - Extracts text from HTML and counts words

## Integration Points

The journalism module is integrated with:
- Student model for author and member tracking
- User model for reviewer tracking
- Institution model for multi-tenancy
- Standard authentication and authorization system
