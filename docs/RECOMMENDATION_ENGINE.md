# Smart Content Recommendation Engine

A comprehensive, AI-powered recommendation system for personalized learning content delivery.

## Overview

The Smart Content Recommendation Engine uses multiple advanced algorithms to provide personalized study material recommendations, optimize learning paths, and integrate external educational resources.

## Core Features

### 1. Collaborative Filtering Algorithm
- **Peer-based recommendations** using cosine similarity
- Identifies students with similar performance patterns
- Recommends materials that helped similar high-performing students
- Minimum similarity threshold: 0.5
- Requires at least 3 common chapters for comparison

**Algorithm**: Cosine Similarity
```python
similarity = dot_product(student1_vector, student2_vector) / 
             (magnitude(student1_vector) * magnitude(student2_vector))
```

### 2. Content Effectiveness Scoring
Tracks which materials lead to better assessment performance:

**Metrics Tracked**:
- Average performance improvement after material access
- Performance correlation (consistency of improvements)
- Engagement score (views, downloads, access frequency)
- Unique student count
- Positive outcome ratio

**Effectiveness Score Calculation**:
```python
effectiveness_score = (
    normalized_improvement * 0.5 +
    engagement_score * 0.2 +
    performance_correlation * 0.3
)
```

**Improvement Window**: 30 days after material access

### 3. Difficulty Level Detection
Automatically detects appropriate difficulty levels based on mastery:

| Mastery Score | Difficulty Level | Reasoning |
|--------------|-----------------|-----------|
| < 30% | Very Easy | Building foundational understanding |
| 30-50% | Easy | Developing basic concepts |
| 50-70% | Medium | Ready for moderate challenges |
| 70-85% | Hard | Advanced problem-solving |
| > 85% | Very Hard | Expert-level challenges |

### 4. Multi-Modal Content Recommendation (VARK Model)

Recommends content based on learning style preferences:

#### Learning Styles
- **Visual**: Videos, diagrams, infographics, presentations
- **Auditory**: Audio lectures, podcasts
- **Reading/Writing**: PDFs, documents, textbooks
- **Kinesthetic**: Interactive content, practice quizzes, hands-on activities

**Detection Method**: Analyzes material access patterns and quiz attempt frequency

**Style Match Scoring**:
- Video content → Visual learners: 1.0 match
- Audio content → Auditory learners: 1.0 match
- PDF/Document → Reading/Writing learners: 1.0 match
- Presentations → Visual (0.5) + Reading/Writing (0.5)

### 5. Personalized Study Path Sequencing

Creates optimized learning paths with:

**Sequencing Criteria**:
1. **Prerequisite relationships**: Topics are ordered by dependencies
2. **Difficulty progression**: Gradual difficulty increase
3. **Weakness prioritization**: Weak areas get higher priority
4. **Sequence numbers**: Respects curriculum order

**Priority Score Calculation**:
```python
priority = (
    50.0 * is_weak +
    (100.0 - mastery_score) * 0.3 +
    sequence_number * 0.1
)
```

**Time Estimation**:
```python
estimated_hours = base_hours * (1 + (100 - mastery_score) / 100)
```

### 6. External Content Library Integration

Integrates with major educational platforms:

#### Supported Platforms
1. **Khan Academy**
   - Video playlists
   - Interactive exercises
   - Comprehensive topic coverage

2. **YouTube EDU**
   - Educational videos
   - Curated channels
   - Multiple formats

3. **OpenStax**
   - Free textbooks (PDF)
   - CC-BY licensed
   - College-level content

4. **Coursera**
   - Structured courses
   - University partnerships
   - 4-week average duration

5. **MIT OpenCourseWare**
   - Lecture notes
   - Assignments and exams
   - Graduate-level content

**Search Parameters**:
- Topic name
- Subject area
- Difficulty level
- Language (default: English)

## API Endpoints

### Get Comprehensive Recommendations
```http
GET /api/v1/recommendations/comprehensive/{student_id}
```

Returns:
- Personalized material recommendations
- External content from all sources
- Optimized study paths
- Learning style profile
- Weak area summaries

### Get Topic-Specific Recommendations
```http
POST /api/v1/recommendations/topic
Content-Type: application/json

{
  "topic_id": 123,
  "include_external": true
}
```

### Get Learning Style Profile
```http
GET /api/v1/recommendations/learning-style/{student_id}
```

Returns VARK scores and dominant learning style.

### Get Difficulty Recommendation
```http
GET /api/v1/recommendations/difficulty-level/{student_id}?chapter_id=456
```

### Find Similar Students
```http
GET /api/v1/recommendations/similar-students/{student_id}?limit=20
```

### Get Material Effectiveness
```http
GET /api/v1/recommendations/material-effectiveness/{material_id}
```

### Generate Study Path
```http
GET /api/v1/recommendations/study-path/{student_id}/{subject_id}
```

### Search External Content
```http
GET /api/v1/recommendations/external-content/{topic_id}
```

### Get Peer Success Materials
```http
GET /api/v1/recommendations/peer-success-materials/{student_id}?limit=10
```

## Database Schema

### ExternalContent
Stores external educational resources:
- `source`: Platform (Khan Academy, YouTube, etc.)
- `external_id`: Platform-specific ID
- `title`, `description`, `url`
- `subject_id`, `chapter_id`, `topic_id`
- `difficulty_level`
- `estimated_duration_minutes`
- `view_count`, `recommendation_count`

### ExternalContentAccessLog
Tracks student interactions with external content:
- `content_id`, `user_id`
- `accessed_at`
- `duration_seconds`
- `completion_percentage`

### ContentEffectivenessScore
Stores calculated effectiveness metrics:
- `material_id` or `external_content_id`
- `effectiveness_score`
- `avg_improvement`
- `engagement_score`
- `performance_correlation`
- `unique_students`, `total_accesses`
- `positive_outcomes`

### StudentLearningPreference
Stores VARK learning style profiles:
- `student_id`
- `visual_score`, `auditory_score`, `reading_writing_score`, `kinesthetic_score`
- `dominant_style`
- `confidence_level`
- Material type preference weights
- `total_materials_accessed`

## Service Classes

### IntelligentRecommendationService
Main orchestration service integrating all recommendation engines.

**Methods**:
- `generate_comprehensive_recommendations()`
- `get_recommendations_for_topic()`

### CollaborativeFilteringEngine
Implements peer-based collaborative filtering.

**Methods**:
- `find_similar_students()`
- `get_peer_success_materials()`

### ContentEffectivenessEngine
Tracks and scores content effectiveness.

**Methods**:
- `calculate_material_effectiveness()`

### DifficultyLevelDetector
Detects appropriate difficulty levels.

**Methods**:
- `detect_student_difficulty_level()`
- `get_difficulty_appropriate_materials()`

### MultiModalContentRecommender
Recommends content by learning style.

**Methods**:
- `detect_learning_style()`
- `recommend_by_learning_style()`

### StudyPathSequencer
Creates personalized study paths.

**Methods**:
- `generate_study_path()`

### ExternalContentLibraryIntegrator
Integrates external educational platforms.

**Methods**:
- `search_khan_academy()`
- `search_youtube_edu()`
- `search_openstax()`
- `search_coursera()`
- `search_mit_ocw()`
- `get_comprehensive_external_content()`

## Usage Examples

### Get Comprehensive Recommendations
```python
from src.services.recommendation_service import IntelligentRecommendationService
from src.database import get_db

db = next(get_db())
service = IntelligentRecommendationService(db)

recommendations = service.generate_comprehensive_recommendations(
    institution_id=1,
    student_id=123
)

print(f"Learning Style: {recommendations['learning_style_profile']}")
print(f"Materials: {len(recommendations['recommended_materials'])}")
print(f"External Sources: {len(recommendations['external_content'])}")
```

### Detect Learning Style
```python
learning_style = service.multimodal_recommender.detect_learning_style(
    institution_id=1,
    student_id=123
)

print(f"Visual: {learning_style['visual']:.2f}")
print(f"Auditory: {learning_style['auditory']:.2f}")
print(f"Reading/Writing: {learning_style['reading_writing']:.2f}")
print(f"Kinesthetic: {learning_style['kinesthetic']:.2f}")
```

### Find Similar Students
```python
similar_students = service.collaborative_engine.find_similar_students(
    institution_id=1,
    student_id=123,
    limit=20
)

for student_id, similarity_score in similar_students:
    print(f"Student {student_id}: {similarity_score:.3f} similarity")
```

### Generate Study Path
```python
study_path = service.path_sequencer.generate_study_path(
    institution_id=1,
    student_id=123,
    subject_id=5
)

print(f"Total chapters: {study_path['total_chapters']}")
print(f"Estimated hours: {study_path['total_estimated_hours']:.1f}")

for chapter in study_path['path']:
    print(f"{chapter['chapter_name']}: {chapter['priority_score']:.1f} priority")
```

## Configuration

### Environment Variables
```env
# External API Keys (when integrated)
KHAN_ACADEMY_API_KEY=your_key_here
YOUTUBE_DATA_API_KEY=your_key_here
COURSERA_API_KEY=your_key_here

# Recommendation Engine Settings
SIMILARITY_THRESHOLD=0.5
MIN_COMMON_CHAPTERS=3
IMPROVEMENT_WINDOW_DAYS=30
```

### Tunable Parameters

#### Collaborative Filtering
- `similarity_threshold`: 0.5 (minimum similarity to consider)
- `min_common_chapters`: 3 (minimum chapters in common)

#### Content Effectiveness
- `improvement_window_days`: 30 (days to measure improvement)
- Effectiveness weights:
  - Improvement: 50%
  - Engagement: 20%
  - Correlation: 30%

#### Study Path
- Priority weights:
  - Weakness: 50.0
  - Low mastery: 30%
  - Sequence: 10%

## Performance Considerations

1. **Caching**: Implement Redis caching for:
   - Similar student calculations (1 hour TTL)
   - Learning style profiles (24 hour TTL)
   - External content searches (1 week TTL)

2. **Batch Processing**: 
   - Calculate effectiveness scores asynchronously
   - Update learning preferences nightly

3. **Indexes**: 
   - All foreign keys indexed
   - Composite indexes on common query patterns

4. **Query Optimization**:
   - Use eager loading for relationships
   - Limit result sets appropriately
   - Implement pagination

## Future Enhancements

1. **Deep Learning Integration**
   - Neural collaborative filtering
   - Content embeddings
   - Sequential pattern mining

2. **Real-time Adaptation**
   - Live learning style updates
   - Dynamic difficulty adjustment
   - Instant feedback loops

3. **Advanced Analytics**
   - A/B testing for recommendations
   - Click-through rate tracking
   - Conversion metrics

4. **Social Learning**
   - Study group recommendations
   - Peer tutoring matches
   - Collaborative study sessions

5. **Enhanced External Integration**
   - Real API integrations (currently mock)
   - Content synchronization
   - Quality scoring from external sources

## Monitoring & Analytics

### Key Metrics to Track
- Recommendation acceptance rate
- Material effectiveness trends
- Learning style distribution
- External content usage
- Study path completion rates
- Performance improvements post-recommendation

### Logging
All recommendation generation is logged with:
- Student ID
- Timestamp
- Number of recommendations
- Algorithm versions used
- Response time

## Support & Documentation

For detailed implementation questions, see:
- `src/services/recommendation_service.py` - Main service implementation
- `src/schemas/recommendation.py` - Request/response schemas
- `src/api/v1/recommendations.py` - API endpoints
- `src/utils/recommendation_helpers.py` - Helper utilities
