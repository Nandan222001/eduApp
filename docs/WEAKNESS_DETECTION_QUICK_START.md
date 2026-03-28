# Weakness Detection System - Quick Start Guide

## Installation

### 1. Run Database Migration
```bash
alembic upgrade head
```

This creates four new tables:
- `chapter_performance`
- `question_recommendations`
- `focus_areas`
- `personalized_insights`

## Basic Usage

### API Endpoints

#### 1. Run Comprehensive Analysis
```http
POST /api/v1/weakness-detection/analyze
Content-Type: application/json

{
  "student_id": 123,
  "target_exam_date": "2024-03-15",
  "generate_recommendations": true
}
```

**Response:**
```json
{
  "summary": {
    "total_chapters_analyzed": 25,
    "weak_chapters_count": 8,
    "weak_areas_count": 12,
    "focus_areas_count": 10,
    "critical_focus_areas": 3,
    "question_recommendations_count": 20,
    "personalized_insights_count": 7,
    "average_mastery_score": 68.5
  },
  "chapter_performances": [...],
  "weak_areas": [...],
  "focus_areas": [...],
  "question_recommendations": [...],
  "personalized_insights": [...]
}
```

#### 2. Get Question Recommendations
```http
GET /api/v1/weakness-detection/question-recommendations?student_id=123&limit=20&due_only=true
```

#### 3. Update Spaced Repetition
```http
PUT /api/v1/weakness-detection/question-recommendations/456
Content-Type: application/json

{
  "performance_score": 85.0
}
```

#### 4. Get Focus Areas
```http
GET /api/v1/weakness-detection/focus-areas?student_id=123&status=active
```

#### 5. Get Personalized Insights
```http
GET /api/v1/weakness-detection/personalized-insights?student_id=123&severity=critical
```

## Python Usage

### Running Analysis

```python
from src.services.weakness_detection_service import WeaknessDetectionEngine
from datetime import date, timedelta

# Initialize
engine = WeaknessDetectionEngine(db)

# Run analysis
result = engine.run_comprehensive_analysis(
    institution_id=1,
    student_id=123,
    target_exam_date=date.today() + timedelta(days=30),
    generate_recommendations=True
)

# Access results
print(f"Weak chapters: {result['summary']['weak_chapters_count']}")
print(f"Critical areas: {result['summary']['critical_focus_areas']}")

# Get top priorities
for priority in result['summary']['top_priorities'][:5]:
    print(f"{priority['area']}: {priority['priority_score']:.2f}")
```

### Chapter Performance Analysis

```python
from src.services.weakness_detection_service import ChapterPerformanceAnalyzer

analyzer = ChapterPerformanceAnalyzer(db)

# Analyze all chapters
performances = analyzer.analyze_chapter_performance(
    institution_id=1,
    student_id=123
)

# Get weak chapters
weak_chapters = analyzer.get_weak_chapters(
    institution_id=1,
    student_id=123,
    mastery_threshold=60.0,
    limit=10
)

for chapter in weak_chapters:
    print(f"{chapter.chapter.name}: {chapter.mastery_score}%")
```

### Smart Recommendations

```python
from src.services.weakness_detection_service import SmartQuestionRecommender
from src.models.study_planner import WeakArea

recommender = SmartQuestionRecommender(db)

# Get weak areas
weak_areas = db.query(WeakArea).filter(
    WeakArea.student_id == 123,
    WeakArea.is_resolved == False
).all()

# Generate recommendations
recommendations = recommender.generate_recommendations(
    institution_id=1,
    student_id=123,
    weak_areas=weak_areas,
    limit=20
)

# Update after practice
updated = recommender.update_spaced_repetition(
    recommendation_id=456,
    performance_score=85.0,
    institution_id=1
)

print(f"Next review: {updated.next_review_date}")
```

### Focus Areas

```python
from src.services.weakness_detection_service import FocusAreaPrioritizer

prioritizer = FocusAreaPrioritizer(db)

focus_areas = prioritizer.identify_focus_areas(
    institution_id=1,
    student_id=123,
    target_exam_date=date(2024, 3, 15)
)

# Get critical areas
critical = [f for f in focus_areas if f.focus_type == 'critical']

for area in critical:
    print(f"{area.chapter.name}:")
    print(f"  Priority: {area.combined_priority}")
    print(f"  Recommended Hours: {area.recommended_hours}")
    print(f"  Est. Improvement: {area.estimated_improvement}%")
```

### Personalized Insights

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

# Filter by severity
critical_insights = [i for i in insights if i.severity == 'critical']

for insight in critical_insights:
    print(f"{insight.title}")
    print(f"  {insight.description}")
    print(f"  Actions: {len(insight.actionable_items or [])}")
    print(f"  Recommendations: {len(insight.recommendations or [])}")
```

## Common Workflows

### 1. Daily Student Dashboard

```python
# Get today's due recommendations
from datetime import date

recommendations = db.query(QuestionRecommendation).filter(
    QuestionRecommendation.student_id == student_id,
    QuestionRecommendation.next_review_date <= date.today(),
    QuestionRecommendation.is_completed == False
).order_by(QuestionRecommendation.priority_rank).limit(10).all()

# Get unresolved insights
insights = db.query(PersonalizedInsight).filter(
    PersonalizedInsight.student_id == student_id,
    PersonalizedInsight.is_resolved == False
).order_by(PersonalizedInsight.priority).all()
```

### 2. Weekly Progress Review

```python
# Run fresh analysis
result = engine.run_comprehensive_analysis(
    institution_id=institution_id,
    student_id=student_id,
    target_exam_date=exam_date,
    generate_recommendations=True
)

# Compare with last week
last_week_avg = previous_analysis['summary']['average_mastery_score']
current_avg = result['summary']['average_mastery_score']
improvement = current_avg - last_week_avg

print(f"Improvement this week: {improvement:+.2f}%")
```

### 3. Study Session

```python
# Get next recommended questions
recommendations = db.query(QuestionRecommendation).filter(
    QuestionRecommendation.student_id == student_id,
    QuestionRecommendation.is_completed == False
).order_by(QuestionRecommendation.priority_rank).limit(5).all()

# After practice
for rec in recommendations:
    # Student completes question
    score = get_student_score(rec.question_id)
    
    # Update spaced repetition
    recommender.update_spaced_repetition(
        recommendation_id=rec.id,
        performance_score=score,
        institution_id=institution_id
    )
```

### 4. Focus Area Management

```python
# Start working on focus area
focus_area = db.query(FocusArea).filter(
    FocusArea.id == focus_area_id
).first()

focus_area.status = 'in_progress'
focus_area.started_at = datetime.utcnow()
db.commit()

# After completing
focus_area.status = 'completed'
focus_area.completed_at = datetime.utcnow()
db.commit()
```

## Understanding Scores

### Mastery Score (0-100)
- **90-100**: Expert - Excellent mastery
- **75-89**: Proficient - Strong understanding
- **60-74**: Competent - Adequate knowledge
- **40-59**: Developing - Needs improvement
- **0-39**: Beginner - Requires attention

### Recommendation Score (0-100)
Higher scores indicate better match for current needs:
- **80-100**: Highly recommended, priority review
- **60-79**: Recommended, schedule soon
- **40-59**: Moderately useful
- **0-39**: Lower priority

### Combined Priority (0-100)
- **80-100**: Critical - Immediate attention required
- **60-79**: High - Address soon
- **40-59**: Medium - Schedule within week
- **0-39**: Low - Routine review

### Insight Severity
- **Critical**: Requires immediate action
- **High**: Important, address within days
- **Medium**: Moderate concern
- **Info**: Informational, good to know

## Best Practices

### 1. Regular Analysis
```python
# Run weekly
engine.run_comprehensive_analysis(...)

# After each exam
analyzer.analyze_chapter_performance(...)
```

### 2. Follow Spaced Repetition
```python
# Review questions on schedule
due_today = db.query(QuestionRecommendation).filter(
    QuestionRecommendation.next_review_date <= date.today()
).all()

# Don't skip reviews
```

### 3. Act on Insights
```python
# Acknowledge insights
insight.is_acknowledged = True
insight.acknowledged_at = datetime.utcnow()

# Resolve after addressing
insight.is_resolved = True
insight.resolved_at = datetime.utcnow()
```

### 4. Track Progress
```python
# Monitor mastery improvements
performances = analyzer.analyze_chapter_performance(...)

improving = [p for p in performances if p.trend == 'improving']
print(f"Improving in {len(improving)} chapters!")
```

## Troubleshooting

### No Recommendations Generated
- Check that weak areas exist in database
- Verify question bank has questions for weak areas
- Ensure questions have proper chapter/topic mapping

### Low Confidence Scores
- Need more performance data
- Run analysis after more assessments
- Check data quality in exam marks

### Insights Not Appearing
- Verify chapter performances are analyzed
- Check focus areas are identified
- Ensure weak areas exist

### Spaced Repetition Not Working
- Verify performance scores are being updated
- Check next_review_date is set
- Ensure ease_factor is within valid range (1.3+)

## Configuration

### Adjust Thresholds
```python
# In service initialization or configuration
MASTERY_THRESHOLD = 60.0  # Lower to identify more weak areas
MIN_EASE_FACTOR = 1.3     # Don't change unless needed
```

### Customize Weights
```python
# In recommendation scoring
RELEVANCE_WEIGHT = 0.30
DIFFICULTY_WEIGHT = 0.25
WEAKNESS_WEIGHT = 0.25
SPACING_WEIGHT = 0.20

# In priority scoring
URGENCY_WEIGHT = 0.35
IMPORTANCE_WEIGHT = 0.40
IMPACT_WEIGHT = 0.25
```

## Support

For detailed documentation, see:
- `docs/WEAKNESS_DETECTION_SYSTEM.md` - Complete system documentation
- `examples/weakness_detection_example.py` - Working code examples
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
