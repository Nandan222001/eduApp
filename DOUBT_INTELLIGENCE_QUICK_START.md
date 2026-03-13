# Doubt Intelligence System - Quick Start Guide

## Installation

The system uses existing dependencies from `pyproject.toml`. All required packages are already installed:
- `sentence-transformers`
- `torch`
- `numpy`
- `scikit-learn`

## Database Setup

1. Run the migration to create new tables:
```bash
alembic upgrade head
```

This creates:
- `doubt_embeddings` - Vector embeddings for semantic search
- `similar_doubts` - Similar doubt relationships
- `doubt_suggested_answers` - Auto-generated suggestions
- `teacher_doubt_stats` - Teacher performance tracking
- Additional columns in `doubt_posts` table

## Quick Usage

### 1. Process a New Doubt with All AI Features

```python
import requests

# When a student posts a doubt
response = requests.post(
    'http://localhost:8000/api/v1/doubts/123/process',
    params={'enable_auto_assignment': True},
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

result = response.json()
print(result)
# {
#   "success": true,
#   "doubt_id": 123,
#   "processing_steps": {
#     "tagging": {"auto_tags": ["mathematics", "algebra"], "subject_id": 1},
#     "embedding": {"success": true, "embedding_id": 456},
#     "similar_doubts": {"count": 5},
#     "answer_suggestions": {"count": 3},
#     "priority": {"priority": "HIGH", "priority_score": 0.82},
#     "teacher_assignment": {"assigned_teacher_id": 10}
#   }
# }
```

### 2. Find Similar Doubts

```python
# Find doubts similar to doubt #123
response = requests.get(
    'http://localhost:8000/api/v1/doubts/123/similar',
    params={
        'top_k': 10,
        'similarity_threshold': 0.7,
        'same_subject_only': True
    },
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

similar = response.json()
for doubt in similar['similar_doubts']:
    print(f"{doubt['doubt'].title} - Score: {doubt['similarity_score']}")
```

### 3. Get Answer Suggestions

```python
# Get AI-generated answer suggestions
response = requests.get(
    'http://localhost:8000/api/v1/doubts/123/suggestions',
    params={'min_confidence': 0.5},
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

suggestions = response.json()
for suggestion in suggestions['suggestions']:
    print(f"Source: {suggestion['source_type']}")
    print(f"Confidence: {suggestion['confidence_score']}")
    print(f"Content: {suggestion['content'][:100]}...")
```

### 4. Auto-Tag a Doubt

```python
# Automatically detect subject, chapter, and generate tags
response = requests.post(
    'http://localhost:8000/api/v1/doubts/123/tags/auto-generate',
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

result = response.json()
print(f"Auto-generated tags: {result['auto_tags']}")
print(f"Detected subject: {result['subject_id']}")
print(f"Detected chapter: {result['chapter_id']}")
print(f"Detected difficulty: {result['difficulty']}")
```

### 5. Calculate Priority

```python
# Calculate doubt priority based on urgency and difficulty
response = requests.post(
    'http://localhost:8000/api/v1/doubts/123/priority/calculate',
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

result = response.json()
print(f"Priority: {result['priority']}")
print(f"Priority Score: {result['priority_score']}")
print(f"Urgency Score: {result['urgency_score']}")
print(f"Difficulty Score: {result['difficulty_score']}")
```

### 6. Assign Teacher Automatically

```python
# Let AI assign the best teacher
response = requests.post(
    'http://localhost:8000/api/v1/doubts/123/assign-teacher',
    params={'auto_assign': True},
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

result = response.json()
print(f"Assigned to: {result['teacher_name']}")
print(f"Assignment Score: {result['assignment_score']}")
```

### 7. Get Prioritized Doubts Queue

```python
# Get doubts sorted by priority
response = requests.get(
    'http://localhost:8000/api/v1/doubts/prioritized',
    params={
        'status': 'unanswered',
        'limit': 50
    },
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

doubts = response.json()
for doubt in doubts['doubts'][:5]:
    print(f"{doubt['title']} - Priority: {doubt['priority']} ({doubt['priority_score']})")
```

## Background Processing with Celery

For better performance, use Celery tasks for async processing:

```python
from src.tasks.doubt_intelligence_tasks import process_doubt_with_intelligence_task

# Queue the processing task
task = process_doubt_with_intelligence_task.delay(
    doubt_id=123,
    institution_id=1,
    enable_auto_assignment=True
)

# Check task status
print(f"Task ID: {task.id}")
print(f"Status: {task.state}")

# Get result when ready
if task.ready():
    result = task.get()
    print(result)
```

## Batch Processing

### Process Multiple Doubts

```python
# Process up to 50 unprocessed doubts
response = requests.post(
    'http://localhost:8000/api/v1/doubts/batch/process',
    params={
        'batch_size': 50,
        'enable_auto_assignment': True
    },
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

result = response.json()
print(f"Successfully processed: {result['successful']}")
print(f"Failed: {result['failed']}")
```

### Generate Embeddings in Bulk

```python
# Generate embeddings for doubts without them
response = requests.post(
    'http://localhost:8000/api/v1/doubts/batch/generate-embeddings',
    params={'batch_size': 50},
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)
```

### Auto-Tag Multiple Doubts

```python
# Auto-tag doubts in bulk
response = requests.post(
    'http://localhost:8000/api/v1/doubts/batch/auto-tag',
    params={'batch_size': 50},
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)
```

## Integration with Your Application

### When a Student Posts a Doubt

```python
# 1. Create the doubt in database (existing code)
doubt = create_doubt(title, description, user_id, institution_id)

# 2. Process with AI (async recommended)
from src.tasks.doubt_intelligence_tasks import process_doubt_with_intelligence_task
process_doubt_with_intelligence_task.delay(
    doubt_id=doubt.id,
    institution_id=doubt.institution_id,
    enable_auto_assignment=True
)

# 3. Return doubt to student immediately (processing happens in background)
return doubt
```

### Display Similar Doubts to Students

```python
# Before student submits, show similar doubts
similar_doubts = semantic_search_service.search_similar_by_text(
    db=db,
    query_text=student_question,
    institution_id=institution_id,
    top_k=5
)

# Show to student: "Similar questions have been asked before..."
for similar in similar_doubts:
    display_similar_doubt(similar)
```

### Teacher Dashboard

```python
# Show prioritized doubts to teacher
response = requests.get(
    'http://localhost:8000/api/v1/doubts/prioritized',
    params={
        'status': 'unanswered',
        'subject_id': teacher_subject_id,
        'limit': 20
    },
    headers={'Authorization': f'Bearer {teacher_token}'}
)

# Display doubts with priority badges
doubts = response.json()['doubts']
for doubt in doubts:
    display_doubt_with_priority(doubt)
```

### Show AI Suggestions to Teachers

```python
# When teacher views a doubt, show AI suggestions
response = requests.get(
    f'http://localhost:8000/api/v1/doubts/{doubt_id}/suggestions',
    headers={'Authorization': f'Bearer {teacher_token}'}
)

suggestions = response.json()['suggestions']
# Display: "AI found these relevant resources..."
for suggestion in suggestions:
    display_suggestion(suggestion)
```

## Monitoring and Analytics

### System Analytics

```python
response = requests.get(
    'http://localhost:8000/api/v1/doubts/analytics/intelligence',
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

analytics = response.json()
print(f"Total doubts: {analytics['total_doubts']}")
print(f"Embedding coverage: {analytics['intelligence_coverage']['embeddings']['percentage']}%")
print(f"Auto-assignment rate: {analytics['intelligence_coverage']['auto_assignment']['percentage']}%")
```

### Teacher Workload

```python
response = requests.get(
    'http://localhost:8000/api/v1/doubts/teachers/10/workload',
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

workload = response.json()
print(f"Active doubts: {workload['total_stats']['active_doubts']}")
print(f"Total answered: {workload['total_stats']['total_answered']}")
print(f"Expertise score: {workload['total_stats']['avg_expertise_score']}")
```

## Scheduled Maintenance Tasks

Set up periodic Celery beat tasks:

```python
# In your celery beat schedule
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'process-pending-doubts': {
        'task': 'batch_process_doubts',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
        'args': (institution_id, 50, True)
    },
    'update-priorities': {
        'task': 'batch_recalculate_priorities',
        'schedule': crontab(hour='*/6'),  # Every 6 hours
        'args': (institution_id, 100)
    },
    'generate-embeddings': {
        'task': 'batch_generate_embeddings',
        'schedule': crontab(hour='2'),  # Daily at 2 AM
        'args': (institution_id, 100)
    }
}
```

## Troubleshooting

### Model Download on First Run

First time running will download the sentence-transformers model (~90MB):
```
Downloading all-MiniLM-L6-v2 model...
```

This is normal and only happens once. The model is cached.

### Memory Requirements

- Minimum: 2GB RAM
- Recommended: 4GB+ RAM
- Model size: ~400MB in memory when loaded

### Performance Tips

1. **Use batch processing** for bulk operations
2. **Enable Celery** for async processing
3. **Cache model** by keeping service instances alive
4. **Index optimization** - ensure migrations ran correctly
5. **Limit top_k** - don't request too many similar doubts

## Testing

```python
# Test semantic search
from src.services.doubt_semantic_search_service import DoubtSemanticSearchService

service = DoubtSemanticSearchService()
similar = service.search_similar_by_text(
    db=db,
    query_text="How to solve quadratic equations?",
    institution_id=1,
    top_k=5
)
print(f"Found {len(similar)} similar doubts")

# Test priority calculation
from src.services.doubt_priority_service import DoubtPriorityService

service = DoubtPriorityService()
result = service.calculate_priority_score(db=db, doubt_id=123)
print(f"Priority: {result['priority']}")

# Test teacher assignment
from src.services.doubt_teacher_assignment_service import DoubtTeacherAssignmentService

service = DoubtTeacherAssignmentService()
result = service.assign_teacher_to_doubt(db=db, doubt_id=123, institution_id=1)
print(f"Assigned to teacher: {result['assigned_teacher_id']}")
```

## Next Steps

1. Run database migrations
2. Create some test doubts
3. Try processing a doubt with all features
4. Check the results in the database
5. View analytics dashboard
6. Integrate with your frontend
7. Set up Celery for production
8. Configure periodic tasks

For detailed documentation, see [DOUBT_INTELLIGENCE_SYSTEM.md](DOUBT_INTELLIGENCE_SYSTEM.md)
