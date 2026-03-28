# Weakness Detection and Recommendation Engine

## Overview

The Weakness Detection and Recommendation Engine is a comprehensive AI-powered system designed to analyze student performance, identify areas of weakness, and provide personalized recommendations for improvement. The system integrates with existing performance data and uses advanced algorithms to generate actionable insights.

## Key Features

### 1. Chapter-wise Performance Analyzer
- **Automated Performance Tracking**: Analyzes student performance across all chapters
- **Mastery Score Calculation**: Combines average scores, success rates, and consistency
- **Trend Detection**: Identifies improving, declining, or stable performance patterns
- **Proficiency Levels**: Categorizes students as beginner, developing, competent, proficient, or expert
- **Improvement Rate Tracking**: Measures progress over time

### 2. Smart Question Recommendation Algorithm
- **Spaced Repetition System**: Implements SM-2 algorithm for optimal learning retention
- **Multi-factor Scoring**: Considers relevance, difficulty match, weakness alignment, and review timing
- **Adaptive Scheduling**: Dynamically adjusts review intervals based on performance
- **Priority Ranking**: Orders questions by recommendation score
- **Completion Tracking**: Monitors mastery achievement

### 3. Focus Area Prioritizer
- **Urgency Calculation**: Considers exam proximity and last practice date
- **Importance Assessment**: Integrates topic prediction probabilities
- **Impact Analysis**: Evaluates effect on overall performance
- **Combined Priority Scoring**: Weights urgency (35%), importance (40%), and impact (25%)
- **AI Insights Integration**: Leverages ML predictions for targeted preparation
- **Performance Gap Analysis**: Calculates current vs. target performance

### 4. Personalized Insight Generator
- **Multi-category Insights**: Performance, trends, priorities, achievements, action plans
- **Severity Classification**: Critical, high, medium, and info levels
- **Actionable Recommendations**: Specific, measurable action items
- **Supporting Data**: Evidence-based insights with metrics
- **Expiration Management**: Time-sensitive insights that auto-expire
- **Acknowledgment Tracking**: Monitors student engagement

## System Architecture

```
WeaknessDetectionEngine
├── ChapterPerformanceAnalyzer
│   ├── analyze_chapter_performance()
│   ├── get_weak_chapters()
│   └── _calculate_mastery_score()
│
├── SmartQuestionRecommender
│   ├── generate_recommendations()
│   ├── update_spaced_repetition()
│   ├── _calculate_relevance_score()
│   ├── _calculate_difficulty_match()
│   └── _calculate_spaced_repetition_score()
│
├── FocusAreaPrioritizer
│   ├── identify_focus_areas()
│   ├── _calculate_urgency()
│   ├── _calculate_importance()
│   ├── _calculate_impact()
│   └── _extract_ai_insights()
│
└── PersonalizedInsightGenerator
    ├── generate_insights()
    ├── _generate_performance_insights()
    ├── _generate_trend_insights()
    ├── _generate_focus_insights()
    ├── _generate_strength_insights()
    └── _generate_actionable_insights()
```

## Database Schema

### chapter_performance
Stores detailed performance metrics for each chapter per student.

```sql
- id (PK)
- institution_id (FK)
- student_id (FK)
- subject_id (FK)
- chapter_id (FK)
- average_score
- total_attempts
- successful_attempts
- failed_attempts
- success_rate
- time_spent_minutes
- proficiency_level
- trend
- improvement_rate
- mastery_score
```

### question_recommendations
Manages question recommendations with spaced repetition.

```sql
- id (PK)
- institution_id (FK)
- student_id (FK)
- question_id (FK)
- recommendation_score
- relevance_score
- difficulty_match_score
- weakness_alignment_score
- spaced_repetition_score
- priority_rank
- next_review_date
- repetition_number
- ease_factor
- interval_days
- is_completed
```

### focus_areas
Tracks prioritized areas requiring attention.

```sql
- id (PK)
- institution_id (FK)
- student_id (FK)
- subject_id (FK)
- chapter_id (FK)
- topic_id (FK)
- focus_type
- urgency_score
- importance_score
- impact_score
- combined_priority
- current_performance
- target_performance
- performance_gap
- recommended_hours
- estimated_improvement
- ai_insights (JSON)
- status
```

### personalized_insights
Stores generated insights and recommendations.

```sql
- id (PK)
- institution_id (FK)
- student_id (FK)
- insight_type
- category
- title
- description
- severity
- priority
- is_actionable
- actionable_items (JSON)
- recommendations (JSON)
- supporting_data (JSON)
- ai_generated
- confidence_score
- is_acknowledged
- is_resolved
```

## API Endpoints

### Analysis
- `POST /api/v1/weakness-detection/analyze` - Run comprehensive analysis
- `GET /api/v1/weakness-detection/chapter-performance/{student_id}` - Get chapter performance
- `GET /api/v1/weakness-detection/weak-chapters/{student_id}` - Get weak chapters

### Recommendations
- `GET /api/v1/weakness-detection/question-recommendations` - Get question recommendations
- `PUT /api/v1/weakness-detection/question-recommendations/{id}` - Update spaced repetition

### Focus Areas
- `GET /api/v1/weakness-detection/focus-areas` - Get focus areas
- `PUT /api/v1/weakness-detection/focus-areas/{id}` - Update focus area status

### Insights
- `GET /api/v1/weakness-detection/personalized-insights` - Get insights
- `PUT /api/v1/weakness-detection/personalized-insights/{id}` - Update insight
- `GET /api/v1/weakness-detection/insights/summary/{student_id}` - Get insights summary

## Algorithms

### 1. Mastery Score Calculation

```python
mastery_score = (average_score * 0.6) + (success_rate * 0.4) + consistency_bonus
where:
  consistency_bonus = min(attempts * 2, 20)
  mastery_score = min(base_score + consistency_bonus, 100)
```

### 2. Recommendation Score Calculation

```python
recommendation_score = (
    relevance_score * 0.30 +
    difficulty_match * 0.25 +
    weakness_alignment * 0.25 +
    spaced_repetition * 0.20
)
```

### 3. Spaced Repetition (SM-2 Algorithm)

```python
if quality >= 3:  # Successful recall
    if repetition_number == 0:
        interval = 1 day
    elif repetition_number == 1:
        interval = 6 days
    else:
        interval = interval_days * ease_factor
    
    repetition_number += 1
else:  # Failed recall
    repetition_number = 0
    interval = 1 day

ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
ease_factor = max(1.3, ease_factor)
```

### 4. Combined Priority Scoring

```python
combined_priority = (
    urgency_score * 0.35 +
    importance_score * 0.40 +
    impact_score * 0.25
) * 100
```

### 5. Focus Type Determination

```python
if urgency >= 80 and importance >= 70:
    focus_type = "critical"
elif urgency >= 60 or importance >= 60:
    focus_type = "high_priority"
elif weakness_score >= 70:
    focus_type = "remedial"
else:
    focus_type = "maintenance"
```

## Usage Examples

### Running Comprehensive Analysis

```python
from src.services.weakness_detection_service import WeaknessDetectionEngine

engine = WeaknessDetectionEngine(db)

result = engine.run_comprehensive_analysis(
    institution_id=1,
    student_id=123,
    target_exam_date=date(2024, 3, 15),
    generate_recommendations=True
)

print(f"Weak chapters: {result['summary']['weak_chapters_count']}")
print(f"Focus areas: {result['summary']['focus_areas_count']}")
print(f"Recommendations: {result['summary']['question_recommendations_count']}")
```

### Generating Question Recommendations

```python
from src.services.weakness_detection_service import SmartQuestionRecommender

recommender = SmartQuestionRecommender(db)

recommendations = recommender.generate_recommendations(
    institution_id=1,
    student_id=123,
    weak_areas=weak_areas,
    limit=20
)

for rec in recommendations:
    print(f"Question {rec.question_id}: Score {rec.recommendation_score}")
```

### Updating Spaced Repetition

```python
updated = recommender.update_spaced_repetition(
    recommendation_id=456,
    performance_score=85.0,
    institution_id=1
)

print(f"Next review: {updated.next_review_date}")
print(f"New interval: {updated.interval_days} days")
```

### Prioritizing Focus Areas

```python
from src.services.weakness_detection_service import FocusAreaPrioritizer

prioritizer = FocusAreaPrioritizer(db)

focus_areas = prioritizer.identify_focus_areas(
    institution_id=1,
    student_id=123,
    target_exam_date=date(2024, 3, 15),
    ai_predictions=predictions
)

for area in focus_areas[:5]:
    print(f"{area.chapter.name}: Priority {area.combined_priority}")
```

### Generating Personalized Insights

```python
from src.services.weakness_detection_service import PersonalizedInsightGenerator

generator = PersonalizedInsightGenerator(db)

insights = generator.generate_insights(
    institution_id=1,
    student_id=123,
    focus_areas=focus_areas,
    chapter_performances=performances,
    weak_areas=weak_areas
)

for insight in insights:
    print(f"{insight.title} ({insight.severity})")
    print(f"  {insight.description}")
```

## Integration Points

### 1. Exam Performance Data
- Automatically analyzes exam marks to identify weak areas
- Tracks performance trends across multiple assessments
- Calculates subject-wise and chapter-wise metrics

### 2. Assignment Submissions
- Incorporates assignment scores into performance analysis
- Identifies concepts requiring reinforcement
- Tracks completion rates and accuracy

### 3. AI Predictions
- Integrates with ML models for performance forecasting
- Uses feature contributions to identify key factors
- Provides confidence intervals for recommendations

### 4. Topic Predictions
- Leverages board exam prediction data
- Prioritizes high-probability topics
- Balances importance with weakness scores

### 5. Study Planner
- Generates study plans based on focus areas
- Allocates time proportional to priority scores
- Creates daily tasks aligned with recommendations

## Configuration

### Thresholds

```python
# Performance thresholds
MASTERY_THRESHOLD = 60.0  # Below this is considered weak
PROFICIENCY_EXPERT = 90.0
PROFICIENCY_PROFICIENT = 75.0
PROFICIENCY_COMPETENT = 60.0
PROFICIENCY_DEVELOPING = 40.0

# Spaced repetition
INITIAL_INTERVAL = 1  # Days
EASY_BONUS = 0.1
HARD_PENALTY = -0.2
MIN_EASE_FACTOR = 1.3

# Recommendation scoring weights
RELEVANCE_WEIGHT = 0.30
DIFFICULTY_WEIGHT = 0.25
WEAKNESS_WEIGHT = 0.25
SPACING_WEIGHT = 0.20

# Priority scoring weights
URGENCY_WEIGHT = 0.35
IMPORTANCE_WEIGHT = 0.40
IMPACT_WEIGHT = 0.25
```

## Best Practices

### 1. Regular Analysis
- Run comprehensive analysis weekly
- Update after each major assessment
- Monitor trend changes consistently

### 2. Spaced Repetition
- Follow the recommended review schedule
- Update performance scores promptly
- Don't skip scheduled reviews

### 3. Focus Area Management
- Start with critical areas first
- Allocate recommended study hours
- Mark areas as complete when mastered

### 4. Insight Engagement
- Acknowledge insights promptly
- Act on high-priority recommendations
- Resolve insights after addressing them

### 5. Data Quality
- Ensure exam marks are entered accurately
- Keep assignment scores up to date
- Maintain consistent chapter/topic mapping

## Performance Optimization

### Database Indexing
All critical query paths are indexed:
- Student + Chapter (unique)
- Institution + Student
- Priority scores
- Review dates
- Status flags

### Caching Strategies
- Cache chapter performance for 1 hour
- Cache recommendations for 30 minutes
- Invalidate on new exam/assignment data

### Batch Processing
- Analyze multiple students in parallel
- Generate recommendations asynchronously
- Process insights in background tasks

## Monitoring and Metrics

### Key Metrics
- Analysis completion time
- Recommendation accuracy
- Insight engagement rate
- Focus area resolution time
- Average mastery improvement

### Health Checks
- Monitor failed analyses
- Track stale recommendations
- Alert on critical insights
- Verify data completeness

## Future Enhancements

1. **Advanced ML Integration**
   - Deep learning for pattern recognition
   - Collaborative filtering for recommendations
   - Predictive difficulty adjustment

2. **Enhanced Insights**
   - Peer comparison insights
   - Learning style adaptation
   - Emotional intelligence integration

3. **Gamification**
   - Achievement badges for mastery
   - Streak tracking for consistency
   - Leaderboards for motivation

4. **Mobile Optimization**
   - Push notifications for reviews
   - Offline recommendation access
   - Quick performance updates

5. **Teacher Dashboard**
   - Class-wide weakness analysis
   - Intervention recommendations
   - Progress tracking tools
