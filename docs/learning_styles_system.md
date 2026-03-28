# Learning Styles & Adaptive Learning System

## Overview

The Learning Styles and Adaptive Learning system provides comprehensive functionality for assessing student learning preferences, tagging content by suitability, generating personalized recommendations, and dynamically adjusting content difficulty and format based on real-time performance and engagement.

## Components

### 1. Models (`src/models/learning_styles.py`)

#### LearningStyleProfile
Stores comprehensive learning style information for each student:
- **VARK Scores**: Visual, Auditory, Kinesthetic, Reading/Writing preferences (0-1 scale)
- **Social Preferences**: Solitary vs Social learning preference
- **Processing Style**: Sequential vs Global thinking
- **Cognitive Strengths**: Flexible JSONB field for additional cognitive attributes
- **Assessment History**: Tracks assessment results and verification status

#### LearningStyleAssessment
Manages assessment administration and scoring:
- Question storage and response tracking
- Automatic scoring calculation
- Cognitive analysis and recommendations generation
- Time tracking and status management

#### ContentTag
Tags content by learning style suitability:
- Suitability scores for each learning modality (Visual, Auditory, Kinesthetic, Reading/Writing)
- Delivery format classification (Video, Text, Audio, Interactive, Hands-on)
- Social/Solitary and Sequential/Global indicators
- Auto-tagging support based on content type

#### AdaptiveContentRecommendation
Intelligent content recommendation engine:
- Multi-factor scoring:
  - Learning style match (35%)
  - Difficulty alignment (20%)
  - Performance-based need (25%)
  - Collaborative filtering (20%)
- Tracks effectiveness and engagement
- Provides reasoning for recommendations

#### PersonalizedContentFeed
Student-specific content feed:
- Combines learning style matching with collaborative filtering
- Recency-based relevance scoring
- Click and engagement tracking
- Feed expiration management

#### AdaptiveLearningSession
Real-time adaptive learning:
- Dynamic difficulty adjustment based on success rate
- Format switching based on engagement
- Comprehensive tracking of performance and engagement data
- History of all adjustments made

#### LearningStyleEffectiveness
Analytics and feedback:
- Tracks effectiveness of different formats per student
- Pre/post assessment comparisons
- Engagement and satisfaction metrics
- Learning style snapshot at time of content consumption

### 2. Services

#### `LearningStylesService` (`src/services/learning_styles_service.py`)

**Profile Management:**
- `create_profile()`: Initialize learning style profile
- `get_profile()`: Retrieve student profile
- `update_profile()`: Update profile scores and preferences

**Assessment Management:**
- `create_assessment()`: Generate new assessment
- `start_assessment()`: Begin timed assessment
- `submit_assessment()`: Score and update profile
- `_calculate_assessment_scores()`: VARK scoring algorithm
- `_perform_cognitive_analysis()`: Analyze learning patterns
- `_generate_recommendations()`: Personalized learning strategies

**Content Tagging:**
- `create_content_tag()`: Manual content tagging
- `update_content_tag()`: Modify existing tags
- `auto_tag_content()`: Automatic tagging based on content type
- `_infer_suitability_from_material_type()`: Material type to suitability mapping
- `_map_material_type_to_format()`: Material type to delivery format mapping

#### `LearningContentRecommendationService` (`src/services/learning_content_recommendation_service.py`)

**Recommendation Generation:**
- `generate_recommendations()`: Multi-factor recommendation algorithm
- `_calculate_learning_style_match()`: Style-content alignment scoring
- `_calculate_difficulty_match()`: Difficulty appropriateness
- `_calculate_performance_based_score()`: Weakness-based prioritization
- `_calculate_collaborative_filter_score()`: Peer usage patterns
- `_determine_recommended_format()`: Optimal delivery format selection

**Feed Management:**
- `generate_personalized_feed()`: Create student-specific content feed
- `get_active_feed()`: Retrieve unexpired feed items
- `record_feed_interaction()`: Track clicks and engagement
- `get_recommendation_effectiveness()`: Analyze recommendation quality

#### `AdaptiveLearningService` (`src/services/adaptive_learning_service.py`)

**Session Management:**
- `create_learning_session()`: Initialize adaptive session
- `update_session_performance()`: Track performance metrics
- `end_learning_session()`: Finalize session

**Real-time Adaptation:**
- `adjust_content_difficulty()`: Dynamic difficulty adjustment
  - Success rate >= 85%: Increase difficulty
  - Success rate 70-85%: Maintain difficulty
  - Success rate < 70%: Decrease difficulty
- `adjust_content_format()`: Format switching based on engagement
  - Engagement < 40%: Switch to better-suited format
  - Engagement >= 40%: Maintain current format
- `get_real_time_adjustments()`: Combined difficulty and format adjustment

**Analytics:**
- `get_student_performance_trend()`: Performance tracking over time
- `record_effectiveness()`: Record format effectiveness
- `get_format_effectiveness_analysis()`: Analyze format preferences

### 3. API Endpoints (`src/api/v1/learning_styles.py`)

#### Profile Management
- `POST /learning-styles/profiles`: Create learning style profile
- `GET /learning-styles/profiles/{student_id}`: Get profile
- `PUT /learning-styles/profiles/{student_id}`: Update profile

#### Assessment
- `POST /learning-styles/assessments`: Create assessment
- `POST /learning-styles/assessments/{assessment_id}/start`: Start assessment
- `POST /learning-styles/assessments/submit`: Submit responses
- `GET /learning-styles/assessments/student/{student_id}`: Get assessment history
- `GET /learning-styles/default-assessment-questions`: Get sample questions

#### Content Tagging
- `POST /learning-styles/content-tags`: Create content tag
- `PUT /learning-styles/content-tags/{content_type}/{content_id}`: Update tag
- `GET /learning-styles/content-tags/{content_type}/{content_id}`: Get tag
- `POST /learning-styles/content-tags/{content_type}/{content_id}/auto-tag`: Auto-tag content

#### Recommendations
- `POST /learning-styles/recommendations/generate`: Generate recommendations
- `GET /learning-styles/recommendations/effectiveness/{student_id}`: Get effectiveness metrics

#### Personalized Feed
- `POST /learning-styles/feed/generate`: Generate personalized feed
- `GET /learning-styles/feed/{student_id}`: Get active feed
- `POST /learning-styles/feed/{feed_id}/interact`: Record interaction

#### Adaptive Learning
- `POST /learning-styles/adaptive-sessions`: Create session
- `POST /learning-styles/adaptive-sessions/{session_id}/adjust-difficulty`: Adjust difficulty
- `POST /learning-styles/adaptive-sessions/{session_id}/adjust-format`: Adjust format
- `POST /learning-styles/adaptive-sessions/{session_id}/real-time-adjust`: Get real-time adjustments
- `POST /learning-styles/adaptive-sessions/{session_id}/update-performance`: Update performance
- `POST /learning-styles/adaptive-sessions/{session_id}/end`: End session
- `GET /learning-styles/adaptive-sessions/performance-trend/{student_id}`: Get performance trend

#### Effectiveness Analytics
- `POST /learning-styles/effectiveness`: Record effectiveness
- `GET /learning-styles/effectiveness/analysis/{student_id}`: Format effectiveness analysis
- `GET /learning-styles/analytics/effectiveness/{student_id}`: Comprehensive analytics

## Usage Examples

### 1. Administer Learning Style Assessment

```python
# Create assessment
assessment = {
    "student_id": 123,
    "assessment_type": "vark",
    "questions": [...]  # Use default questions endpoint
}
POST /learning-styles/assessments

# Start assessment
POST /learning-styles/assessments/{assessment_id}/start?student_id=123

# Submit responses
submission = {
    "assessment_id": assessment_id,
    "responses": [
        {"question_id": 1, "answer": "a"},
        {"question_id": 2, "answer": "c"},
        ...
    ]
}
POST /learning-styles/assessments/submit
```

### 2. Generate Personalized Recommendations

```python
request = {
    "student_id": 123,
    "subject_id": 5,
    "chapter_id": 12,
    "limit": 10
}
POST /learning-styles/recommendations/generate
```

### 3. Create Adaptive Learning Session

```python
# Start session
session = {
    "student_id": 123,
    "content_type": "study_material",
    "content_id": 456,
    "initial_format": "video",
    "initial_difficulty": "medium"
}
POST /learning-styles/adaptive-sessions

# Update with performance
performance = {
    "success_rate": 0.75,
    "questions_attempted": 10,
    "questions_correct": 7.5
}
engagement = {
    "engagement_rate": 0.60,
    "time_spent_seconds": 300,
    "interaction_count": 15
}
POST /learning-styles/adaptive-sessions/{session_id}/real-time-adjust

# End session
POST /learning-styles/adaptive-sessions/{session_id}/end
```

### 4. Tag Content

```python
# Manual tagging
tag = {
    "content_type": "study_material",
    "content_id": 789,
    "visual_suitability": 0.9,
    "auditory_suitability": 0.3,
    "kinesthetic_suitability": 0.2,
    "reading_writing_suitability": 0.7,
    "delivery_format": "video",
    "supports_social_learning": false,
    "supports_solitary_learning": true,
    "sequential_flow": true
}
POST /learning-styles/content-tags

# Auto-tagging
POST /learning-styles/content-tags/study_material/789/auto-tag
```

## Algorithms

### Learning Style Match Score
```
score = (
    visual_score * visual_suitability +
    auditory_score * auditory_suitability +
    kinesthetic_score * kinesthetic_suitability +
    reading_writing_score * reading_writing_suitability
) * social_match * processing_match
```

### Overall Recommendation Score
```
overall_score = (
    learning_style_match * 0.35 +
    difficulty_match * 0.20 +
    performance_based * 0.25 +
    collaborative_filter * 0.20
)
```

### Difficulty Adjustment Logic
- Success rate >= 85%: Increase difficulty by 1 level
- Success rate 70-85%: Maintain current difficulty
- Success rate 50-70%: Decrease difficulty by 1 level
- Success rate < 50%: Decrease difficulty by 1 level

### Format Switching Logic
- Engagement < 40%: Calculate format scores, exclude current, select highest
- Engagement >= 40%: Maintain current format

## Database Schema

All tables include standard fields:
- `id`: Primary key
- `institution_id`: Institution foreign key
- `created_at`, `updated_at`: Timestamps

Key indexes:
- Student-based queries: `student_id`
- Content-based queries: `content_type`, `content_id`
- Performance queries: `created_at`, `overall_score`

## Configuration

Default scoring weights are configured in the recommendation service and can be adjusted:
- Learning style match: 35%
- Difficulty match: 20%
- Performance-based: 25%
- Collaborative filtering: 20%

Difficulty thresholds:
- High performance: >= 85%
- Optimal performance: 70-85%
- Moderate struggle: 50-70%
- Low performance: < 50%

Engagement thresholds:
- Good engagement: >= 40%
- Low engagement: < 40%

## Future Enhancements

1. Machine learning model for predicting optimal learning styles
2. A/B testing framework for recommendation algorithms
3. Integration with eye-tracking and attention metrics
4. Adaptive assessment question selection
5. Multi-modal content recommendation (combining formats)
6. Learning style evolution tracking over time
7. Peer learning style clustering
8. Teacher dashboard for class-wide learning style insights
