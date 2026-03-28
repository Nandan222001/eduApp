# Student Content Marketplace

## Overview
The Student Content Marketplace is a feature that allows students to create, sell, and purchase educational content created by their peers. It includes content moderation by teachers, plagiarism checking, and a credits-based revenue sharing system.

## Features

### Content Types Supported
- Study Guides
- Flashcard Decks
- Summary Notes
- Practice Quizzes
- Video Tutorials
- Cheat Sheets

### Key Components

#### 1. Content Management
- **Create Content**: Students can create and upload educational content
- **Update Content**: Creators can edit their content before approval
- **Submit for Review**: Submit content to moderation queue for teacher approval
- **Delete Content**: Creators and admins can delete content
- **Search & Browse**: Filter and search content by type, subject, grade, rating, price, etc.

#### 2. Review & Approval Workflow
- **Pending Review**: Content awaits teacher moderation
- **Quality Checks**: Automated quality validation (title, description, content, thumbnail)
- **Teacher Moderation**: Teachers can:
  - Approve content with quality/accuracy scores
  - Reject content with reasons
  - Request revisions with specific notes
- **Moderation History**: Track all moderation decisions

#### 3. Plagiarism Detection
- **Automatic Checks**: Runs when content is submitted for review
- **Text Similarity**: Compare against existing approved content
- **External Source Detection**: Identify URLs and external references
- **Similarity Scoring**: Calculate plagiarism scores
- **Status Levels**:
  - Passed: < 50% similarity
  - Under Review: 50-70% similarity
  - Failed: > 70% similarity

#### 4. Credits System & Revenue Sharing
- **Purchase with Credits**: Students use credits to buy content
- **Revenue Share**: 80% to creator, 20% platform fee
- **Transaction Tracking**: Complete history of earnings and spending
- **Balance Management**: Track total, earned, purchased, and spent credits

#### 5. Reviews & Ratings
- **Rate Content**: 1-5 star ratings
- **Write Reviews**: Text reviews with verified purchase badges
- **Update Reviews**: Edit or delete own reviews
- **Helpful Votes**: Mark reviews as helpful

#### 6. Creator Analytics
- **Sales Metrics**: Total sales, revenue, views, downloads
- **Content Performance**: Track individual content performance
- **Top Sellers**: Identify best-performing content
- **Revenue by Type**: Breakdown earnings by content type

## Database Models

### StudentContent
- Content metadata (type, subject, topic, grade level)
- Pricing and sales information
- Status tracking (draft, pending review, approved, rejected)
- Plagiarism and moderation status
- Analytics (views, downloads, sales, rating)

### ContentReview
- User ratings and review text
- Verified purchase tracking
- Helpful votes
- Flagging for inappropriate content

### ContentPurchase
- Purchase transactions
- Credit payment tracking
- Refund management

### ContentModerationReview
- Teacher reviews and decisions
- Quality and accuracy scores
- Feedback and revision notes
- Quality check results

### ContentPlagiarismCheck
- Plagiarism detection results
- Similarity scores
- Matched content references
- External source findings

### StudentCreditsBalance
- Credit balances (total, earned, purchased, spent)
- Earnings tracking (total, pending, withdrawn)

### CreditTransaction
- Complete transaction history
- Transaction types (earn, spend, refund, etc.)
- Reference tracking to purchases/sales

## API Endpoints

### Content Management
- `POST /api/v1/content-marketplace/contents` - Create content
- `GET /api/v1/content-marketplace/contents/{id}` - Get content details
- `PUT /api/v1/content-marketplace/contents/{id}` - Update content
- `DELETE /api/v1/content-marketplace/contents/{id}` - Delete content
- `POST /api/v1/content-marketplace/contents/{id}/submit-review` - Submit for moderation
- `POST /api/v1/content-marketplace/contents/search` - Search/filter content
- `GET /api/v1/content-marketplace/my-contents` - Get creator's content
- `GET /api/v1/content-marketplace/contents/{id}/download` - Download content

### Purchases
- `POST /api/v1/content-marketplace/purchases` - Purchase content
- `GET /api/v1/content-marketplace/my-purchases` - Get purchase history

### Reviews
- `POST /api/v1/content-marketplace/reviews` - Add review
- `GET /api/v1/content-marketplace/contents/{id}/reviews` - Get content reviews
- `PUT /api/v1/content-marketplace/reviews/{id}` - Update review
- `DELETE /api/v1/content-marketplace/reviews/{id}` - Delete review

### Credits
- `GET /api/v1/content-marketplace/credits/balance` - Get credit balance
- `GET /api/v1/content-marketplace/credits/transactions` - Get transaction history

### Analytics
- `GET /api/v1/content-marketplace/analytics/creator` - Get creator analytics

### Moderation (Teacher/Admin)
- `POST /api/v1/content-marketplace/moderation/queue` - Get moderation queue
- `POST /api/v1/content-marketplace/moderation/{id}/approve` - Approve content
- `POST /api/v1/content-marketplace/moderation/{id}/reject` - Reject content
- `POST /api/v1/content-marketplace/moderation/{id}/request-revision` - Request revision
- `GET /api/v1/content-marketplace/moderation/{id}/history` - Get moderation history

### Plagiarism
- `POST /api/v1/content-marketplace/plagiarism/{id}/check` - Run plagiarism check
- `GET /api/v1/content-marketplace/plagiarism/{id}/report` - Get plagiarism report

## Workflow

### Content Creation Flow
1. Student creates content (draft status)
2. Student uploads content files and adds metadata
3. Student submits for review
4. Plagiarism check runs automatically (background task)
5. Teacher reviews content in moderation queue
6. Teacher approves/rejects/requests revision
7. If approved, content becomes available for purchase
8. Content appears in marketplace search results

### Purchase Flow
1. Student browses/searches marketplace
2. Student views content details and preview
3. Student purchases with credits
4. Credits deducted from buyer
5. 80% of credits added to creator's earnings
6. Purchase recorded with transaction ID
7. Student can now download full content
8. Student can leave a review

### Revenue Sharing
- Platform fee: 20%
- Creator share: 80%
- Credits are immediately available to creator
- Creators can use earned credits to purchase other content

## Access Control

### Students
- Create, update, delete own content
- Purchase content
- Review purchased content
- View own analytics
- Download purchased/free content

### Teachers
- Access moderation queue
- Approve/reject/request revisions
- Run plagiarism checks
- View all content details

### Admins
- All teacher permissions
- Delete any content
- Delete any review
- Access all analytics

## Quality Assurance

### Automated Quality Checks
- Title length (minimum 5 characters)
- Description length (minimum 20 characters)
- Preview content available
- Full content file uploaded
- Thumbnail image present
- Valid price (non-negative)

### Teacher Review Criteria
- Quality score (1-10)
- Accuracy score (1-10)
- Content appropriateness
- Educational value
- Proper formatting

### Plagiarism Thresholds
- 0-30%: Acceptable similarity
- 30-50%: Passed with minor similarities
- 50-70%: Under review
- 70%+: Failed, likely plagiarized

## Implementation Notes

### Files Created
1. `src/models/content_marketplace.py` - Database models
2. `src/schemas/content_marketplace.py` - Pydantic schemas
3. `src/repositories/content_marketplace_repository.py` - Data access layer
4. `src/services/content_marketplace_service.py` - Business logic
5. `src/services/content_moderation_service.py` - Moderation workflow
6. `src/services/content_plagiarism_service.py` - Plagiarism detection
7. `src/api/v1/content_marketplace.py` - API endpoints

### Files Modified
1. `src/models/student.py` - Added relationships to Student model
2. `src/api/v1/__init__.py` - Registered content marketplace router

## Future Enhancements

### Potential Features
- Content versioning
- Bundle deals (multiple content pieces)
- Subscription model for unlimited access
- Content recommendations based on purchase history
- Collaborative content creation
- Content licensing options
- Advanced plagiarism detection with AI
- Content usage analytics for creators
- Automated quality scoring
- Payment gateway integration for real money
- Withdrawal system for earned credits
