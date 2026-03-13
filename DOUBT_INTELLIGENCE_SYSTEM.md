# Intelligent Doubt Resolution System with AI-Powered Features

## Overview

This system provides a comprehensive AI-powered doubt resolution platform with semantic search, automatic answer suggestions, smart tagging, priority scoring, and intelligent teacher assignment capabilities.

## Features

### 1. Semantic Search for Similar Doubts

Uses sentence-transformers (all-MiniLM-L6-v2) to find semantically similar questions from previous doubts.

**Key Components:**
- `DoubtSemanticSearchService`: Core service for semantic search
- `DoubtEmbedding`: Model storing vector embeddings for doubts
- `SimilarDoubt`: Model tracking similar doubt relationships

**Capabilities:**
- Generate embeddings for doubt posts
- Find similar doubts based on semantic similarity
- Search doubts using natural language queries
- Filter by subject and similarity threshold
- Batch process embeddings for multiple doubts

**API Endpoints:**
```
GET /api/v1/doubts/{doubt_id}/similar
POST /api/v1/doubts/search/semantic
POST /api/v1/doubts/batch/generate-embeddings
```

### 2. Automatic Answer Suggestion System

Matches doubts with knowledge base and previous year papers to suggest relevant answers.

**Key Components:**
- `DoubtAnswerSuggestionService`: Core service for answer suggestions
- `DoubtSuggestedAnswer`: Model storing suggested answers

**Answer Sources:**
1. **Similar Doubts**: Finds answers from previously resolved similar doubts
2. **Question Bank**: Matches with previous year paper questions and answers
3. **Study Materials**: Links relevant study materials

**Confidence Scoring:**
- Similar doubts: Based on similarity score and answer quality
- Question bank: Based on semantic similarity and question type match
- Study materials: Based on content relevance

**API Endpoints:**
```
GET /api/v1/doubts/{doubt_id}/suggestions
POST /api/v1/doubts/{doubt_id}/suggestions/generate
POST /api/v1/doubts/suggestions/{suggestion_id}/vote
```

### 3. Smart Tagging with Auto Subject/Chapter Detection

Automatically detects subject, chapter, topic, and generates relevant tags.

**Key Components:**
- `DoubtTaggingService`: Core service for auto-tagging
- Subject keyword mapping for various subjects
- Chapter and topic detection algorithms

**Auto-Detection Features:**
- **Subject Detection**: Uses keyword matching and existing data
- **Chapter Detection**: Matches chapter names and keywords
- **Topic Detection**: Identifies specific topics within chapters
- **Difficulty Detection**: Analyzes complexity keywords
- **Concept Extraction**: Extracts theorems, formulas, laws mentioned

**API Endpoints:**
```
POST /api/v1/doubts/{doubt_id}/tags/auto-generate
GET /api/v1/doubts/{doubt_id}/tags/suggestions
POST /api/v1/doubts/batch/auto-tag
```

### 4. Doubt Priority Scoring

Calculates priority based on urgency and difficulty factors.

**Key Components:**
- `DoubtPriorityService`: Core service for priority calculation
- `DoubtPriority`: Enum (LOW, MEDIUM, HIGH, URGENT)
- `DoubtDifficulty`: Enum (EASY, MEDIUM, HARD, EXPERT)

**Priority Factors:**

**Urgency Score (60% weight):**
- Time since creation (25%)
- Urgency keywords (20%)
- Unanswered duration (25%)
- Student history (15%)
- Engagement metrics (15%)

**Difficulty Score (40% weight):**
- Explicit difficulty tags (30%)
- Question complexity (25%)
- Subject difficulty (20%)
- Previous attempts (15%)
- Description length (10%)

**Priority Levels:**
- URGENT: Priority score > 0.85 or urgency > 0.8
- HIGH: Priority score > 0.7
- MEDIUM: Priority score > 0.4
- LOW: Priority score ≤ 0.4

**API Endpoints:**
```
POST /api/v1/doubts/{doubt_id}/priority/calculate
GET /api/v1/doubts/prioritized
POST /api/v1/doubts/batch/recalculate-priorities
```

### 5. Teacher Assignment Algorithm

Intelligently routes doubts to the most suitable teachers.

**Key Components:**
- `DoubtTeacherAssignmentService`: Core service for teacher assignment
- `TeacherDoubtStats`: Model tracking teacher performance and workload

**Assignment Factors:**

**Teacher Scoring (100%):**
- **Expertise (35%)**: Subject knowledge, specialization, answer history
- **Workload (25%)**: Current active doubts (optimal: 0-5 doubts)
- **Availability (20%)**: Time since last assignment
- **Performance (15%)**: Rating, response time, answer acceptance rate
- **Subject Match (5%)**: Primary vs secondary subject

**Teacher Stats Tracked:**
- Total assigned/answered/accepted doubts
- Active doubt count
- Average response time
- Average rating
- Expertise score (0.0 - 1.0)
- Last assignment timestamp

**API Endpoints:**
```
POST /api/v1/doubts/{doubt_id}/assign-teacher
POST /api/v1/doubts/{doubt_id}/reassign-teacher
GET /api/v1/doubts/teachers/{teacher_id}/workload
POST /api/v1/doubts/batch/auto-assign-teachers
```

## Orchestration Service

### DoubtIntelligenceService

Central service that orchestrates all AI features for comprehensive doubt processing.

**Main Functions:**
- `process_new_doubt()`: Runs all AI features on a new doubt
- `get_doubt_intelligence_summary()`: Returns complete AI analysis
- `batch_process_doubts()`: Process multiple doubts
- `reprocess_doubt()`: Re-run specific AI features
- `get_intelligence_analytics()`: System-wide analytics

**Processing Pipeline:**
1. Auto-tagging (subject/chapter/topic detection)
2. Embedding generation
3. Similar doubt discovery
4. Answer suggestion generation
5. Priority calculation
6. Teacher auto-assignment (optional)

**API Endpoints:**
```
POST /api/v1/doubts/{doubt_id}/process
GET /api/v1/doubts/{doubt_id}/intelligence
POST /api/v1/doubts/{doubt_id}/reprocess
POST /api/v1/doubts/batch/process
GET /api/v1/doubts/analytics/intelligence
```

## Background Tasks (Celery)

All AI processing can be done asynchronously using Celery tasks.

**Available Tasks:**
- `process_doubt_with_intelligence_task`: Complete AI processing
- `generate_doubt_embedding_task`: Generate embeddings
- `find_similar_doubts_task`: Find similar doubts
- `generate_answer_suggestions_task`: Generate suggestions
- `auto_tag_doubt_task`: Auto-tag doubt
- `calculate_doubt_priority_task`: Calculate priority
- `assign_teacher_to_doubt_task`: Assign teacher
- `batch_generate_embeddings_task`: Batch embeddings
- `batch_auto_tag_doubts_task`: Batch tagging
- `batch_recalculate_priorities_task`: Batch priorities
- `batch_auto_assign_teachers_task`: Batch assignments
- `periodic_doubt_intelligence_update_task`: Periodic maintenance

**Usage Example:**
```python
from src.tasks.doubt_intelligence_tasks import process_doubt_with_intelligence_task

# Async processing
process_doubt_with_intelligence_task.delay(
    doubt_id=123,
    institution_id=1,
    enable_auto_assignment=True
)
```

## Database Models

### Extended DoubtPost Fields
```python
auto_generated_tags: List[str]
priority: DoubtPriority
difficulty: DoubtDifficulty
priority_score: float
urgency_score: float
difficulty_score: float
assigned_teacher_id: int
auto_assigned: bool
assignment_score: float
has_suggested_answers: bool
suggestion_count: int
```

### New Models
- **DoubtEmbedding**: Vector embeddings for semantic search
- **SimilarDoubt**: Similar doubt relationships
- **DoubtSuggestedAnswer**: Auto-generated answer suggestions
- **TeacherDoubtStats**: Teacher performance and workload tracking

## Configuration

### Sentence Transformer Model
Default: `all-MiniLM-L6-v2` (384 dimensions)
- Fast and efficient
- Good balance of speed and accuracy
- Suitable for educational content

### Similarity Thresholds
- Similar doubts: 0.7 (default)
- Question bank: 0.7
- Study materials: 0.65
- Semantic search: 0.6

### Batch Processing Sizes
- Embeddings: 50 doubts
- Auto-tagging: 50 doubts
- Priorities: 100 doubts
- Teacher assignments: 50 doubts

## Performance Optimization

### Indexing
All critical fields are indexed:
- Priority score
- Similarity scores
- Auto-generated tags (GIN index)
- Teacher assignments
- Embeddings

### Caching Considerations
- Model loading: Models cached in memory
- Embeddings: Stored in database, not regenerated
- Similar doubts: Cached in SimilarDoubt table

### Batch Processing
Use batch endpoints for bulk operations:
```python
# Process 100 doubts at once
POST /api/v1/doubts/batch/process?batch_size=100
```

## API Integration Examples

### Complete Doubt Processing
```python
import requests

# Process new doubt with all AI features
response = requests.post(
    'http://api/v1/doubts/123/process',
    params={'enable_auto_assignment': True},
    headers={'Authorization': 'Bearer token'}
)

result = response.json()
print(f"Priority: {result['processing_steps']['priority']['priority']}")
print(f"Suggested answers: {result['processing_steps']['answer_suggestions']['count']}")
```

### Get Intelligence Summary
```python
response = requests.get(
    'http://api/v1/doubts/123/intelligence',
    headers={'Authorization': 'Bearer token'}
)

summary = response.json()
print(f"Similar doubts: {len(summary['similar_doubts'])}")
print(f"Auto tags: {summary['tagging']['auto_generated_tags']}")
print(f"Assigned teacher: {summary['teacher_assignment']['teacher_id']}")
```

### Semantic Search
```python
response = requests.post(
    'http://api/v1/doubts/search/semantic',
    json={
        'query_text': 'How to solve quadratic equations?',
        'subject_id': 1,
        'top_k': 10
    },
    headers={'Authorization': 'Bearer token'}
)

results = response.json()
for result in results['results']:
    print(f"Doubt: {result['doubt'].title} (Score: {result['similarity_score']})")
```

## Monitoring and Analytics

### System-Wide Analytics
```python
GET /api/v1/doubts/analytics/intelligence
```

Returns:
- Total doubts processed
- Coverage percentages (embeddings, suggestions, assignments, tagging)
- Priority distribution
- Teacher workload statistics

### Teacher Performance
```python
GET /api/v1/doubts/teachers/{teacher_id}/workload
```

Returns:
- Total stats across all subjects
- Subject-wise breakdown
- Active doubt count
- Expertise and performance metrics

## Best Practices

1. **Process doubts immediately**: Call `/process` endpoint when doubt is created
2. **Use batch operations**: For bulk processing, use batch endpoints
3. **Monitor priorities**: Regularly check prioritized doubts queue
4. **Update teacher stats**: Keep stats updated when answers are provided
5. **Reprocess periodically**: Use periodic tasks to update old doubts
6. **Cache ML models**: Models are cached, but ensure server has sufficient RAM
7. **Index optimization**: Ensure database indices are maintained

## Troubleshooting

### Embeddings not generating
- Check if sentence-transformers is installed
- Verify model download (first run downloads model)
- Check disk space for model storage

### Low similarity scores
- Verify embedding dimension (should be 384)
- Check if doubts have sufficient text content
- Consider lowering similarity threshold

### Teacher assignment failing
- Ensure teachers have subject assignments
- Check teacher active status
- Verify TeacherDoubtStats records exist

### Slow performance
- Use batch processing for bulk operations
- Ensure database indices are created
- Consider async task processing with Celery
- Cache frequently accessed data

## Future Enhancements

1. **Multi-language support**: Add support for multiple languages
2. **Advanced NLP**: Incorporate more advanced NLP models
3. **Real-time notifications**: Notify teachers of new assignments
4. **Feedback loop**: Learn from teacher corrections and student ratings
5. **Clustering**: Group similar doubts for pattern analysis
6. **Predictive analytics**: Predict doubt trends and topics
7. **Integration with LMS**: Connect with learning management systems
8. **Mobile optimization**: Optimize for mobile apps
