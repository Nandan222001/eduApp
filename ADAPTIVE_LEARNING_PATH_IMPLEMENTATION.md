# Adaptive Learning Path Implementation

## Overview

This implementation provides a comprehensive adaptive learning path system that uses AI predictions and student performance data to create personalized curriculum sequences. The system dynamically adjusts difficulty, schedules reviews using spaced repetition, tracks learning velocity, and provides visual learning path representations.

## Features Implemented

### 1. Personalized Curriculum Sequencing Algorithm
- **Prerequisite-based ordering**: Topics are automatically sequenced based on prerequisite relationships
- **Topological sorting**: Ensures topics are presented in the correct dependency order
- **Adaptive initial placement**: Starting difficulty is based on student's historical performance
- **Dynamic unlocking**: Topics unlock as prerequisites are mastered

### 2. Difficulty Progression System
- **Five difficulty levels**: Beginner, Elementary, Intermediate, Advanced, Expert
- **Automatic adaptation**: Difficulty adjusts based on performance trends
- **Performance thresholds**: 
  - Excellent (≥90%) with positive trend → Increase difficulty
  - Struggling (<50%) with negative trend → Decrease difficulty
  - Target performance: 60-75% → Maintain current level
- **Adaptation tracking**: All difficulty changes are logged with reasoning

### 3. Spaced Repetition Scheduler
- **SM-2 Algorithm**: Industry-standard spaced repetition algorithm
- **Quality-based intervals**: Review intervals adapt to student's recall quality (0-5 scale)
- **Priority system**: Reviews prioritized as Critical, High, Medium, or Low
- **Automatic scheduling**: Next review dates calculated based on performance
- **Review history**: Complete tracking of all review sessions

### 4. Learning Velocity Tracker
- **Velocity calculation**: Topics completed per day
- **Efficiency metrics**: Mastery score per time unit
- **Consistency scoring**: Measures regularity of study patterns
- **Pace recommendations**: Suggests optimal content delivery speed
- **Trend analysis**: Multi-period velocity tracking

### 5. Learning Path Visualization API
- **Graph-based representation**: Nodes (topics) and edges (prerequisites)
- **Visual status indicators**: Locked, unlocked, in-progress, completed states
- **Milestone tracking**: Progress markers with reward points
- **Progress summary**: Comprehensive overview of path completion
- **Interactive data**: Supports front-end visualization libraries

## Database Schema

### Core Tables

#### learning_paths
Main learning path entity for each student
- Tracks overall progress and status
- Stores learning velocity and adaptation scores
- Links student, grade, and subject

#### topic_sequences
Individual topics within a learning path
- Ordered sequence with prerequisites
- Mastery level and score tracking
- Difficulty level assignment
- Unlock status management

#### topic_performance_data
Performance metrics for each topic attempt
- Quiz and assignment scores
- Practice accuracy
- Time spent tracking
- Struggle indicators
- AI confidence scores

#### learning_milestones
Achievement markers within learning paths
- Ordered milestones with requirements
- Status tracking (locked to completed)
- Reward points
- Target dates

#### spaced_repetition_schedules
Review scheduling for mastered topics
- SM-2 algorithm parameters
- Next review date calculation
- Priority and due status
- Average quality tracking

#### review_history
Historical record of all review sessions
- Quality ratings
- Time spent
- Performance scores
- Review notes

#### learning_velocity_records
Periodic velocity measurements
- Topics completed per period
- Time efficiency metrics
- Consistency scores
- Pace adjustment recommendations

#### difficulty_progressions
Audit trail of difficulty adjustments
- Previous and current difficulty
- Performance scores
- Adaptation reasoning
- Confidence intervals

#### prerequisite_relationships
Topic dependency definitions
- Hard vs. soft prerequisites
- Prerequisite strength
- Minimum mastery requirements

## API Endpoints

### Learning Paths

#### POST /api/v1/learning-paths
Create a new learning path
```json
{
  "student_id": 1,
  "grade_id": 5,
  "subject_id": 3,
  "name": "Mathematics Path",
  "description": "Personalized math curriculum",
  "target_date": "2024-06-30"
}
```

#### POST /api/v1/learning-paths/generate
Generate personalized sequence with AI
```json
{
  "student_id": 1,
  "grade_id": 5,
  "subject_id": 3,
  "topic_ids": [1, 2, 3, 4, 5],
  "target_date": "2024-06-30",
  "include_ai_predictions": true
}
```

#### GET /api/v1/learning-paths
List learning paths with filters
- Query params: student_id, grade_id, subject_id, status, skip, limit

#### GET /api/v1/learning-paths/{learning_path_id}
Get detailed learning path with milestones and sequences

#### PATCH /api/v1/learning-paths/{learning_path_id}
Update learning path properties

#### DELETE /api/v1/learning-paths/{learning_path_id}
Delete a learning path

### Progress & Milestones

#### GET /api/v1/learning-paths/{learning_path_id}/progress
Get comprehensive progress information
- Completion percentage
- Current streak
- Upcoming reviews
- Milestones status
- Recommendations

#### POST /api/v1/learning-paths/{learning_path_id}/milestones
Create custom milestone

#### GET /api/v1/learning-paths/{learning_path_id}/visualization
Get visualization data for graph representation
- Nodes with mastery status
- Edges showing prerequisites
- Milestone markers
- Progress summary

### Performance Tracking

#### POST /api/v1/learning-paths/mastery/update
Update topic mastery based on performance
```json
{
  "topic_sequence_id": 1,
  "performance_score": 0.85,
  "time_spent_minutes": 45,
  "correct_answers": 17,
  "total_questions": 20
}
```

#### POST /api/v1/learning-paths/performance
Record detailed performance data
```json
{
  "topic_sequence_id": 1,
  "quiz_score": 0.85,
  "practice_accuracy": 0.90,
  "time_spent_minutes": 45,
  "attempts_count": 3,
  "correct_answers": 17,
  "total_questions": 20,
  "struggle_indicators": {
    "frequent_pauses": true,
    "multiple_attempts": 3
  }
}
```

### Spaced Repetition

#### POST /api/v1/learning-paths/spaced-repetition
Create review schedule for a topic
```json
{
  "topic_id": 5,
  "learning_path_id": 1
}
```

#### PATCH /api/v1/learning-paths/spaced-repetition/{schedule_id}
Update schedule after review session
```json
{
  "review_quality": 4,
  "time_spent_minutes": 15,
  "score": 0.85,
  "difficulty_rating": 3
}
```

#### GET /api/v1/learning-paths/spaced-repetition/due
Get due review items for student
- Query param: student_id, limit

### Learning Velocity

#### POST /api/v1/learning-paths/{learning_path_id}/velocity/calculate
Calculate velocity for a period
- Query param: period_days (default: 7)

#### GET /api/v1/learning-paths/{learning_path_id}/velocity/trend
Get velocity trend over multiple periods
- Query param: periods (default: 4)

### Prerequisites

#### POST /api/v1/learning-paths/prerequisites
Create prerequisite relationship
```json
{
  "topic_id": 5,
  "prerequisite_topic_id": 3,
  "strength": 1.0,
  "is_hard_prerequisite": true,
  "minimum_mastery_required": 0.7
}
```

#### GET /api/v1/learning-paths/prerequisites/{topic_id}
Get all prerequisites for a topic

#### DELETE /api/v1/learning-paths/prerequisites/{prerequisite_id}
Remove prerequisite relationship

## Service Layer Architecture

### AdaptiveLearningPathService
Core service for learning path management
- `create_learning_path()`: Create new path
- `generate_personalized_sequence()`: AI-driven sequence generation
- `_topological_sort()`: Prerequisite-aware ordering
- `_calculate_initial_difficulty()`: Performance-based starting point
- `_create_milestones()`: Automatic milestone generation

### DifficultyAdaptationService
Manages adaptive difficulty progression
- `adapt_difficulty()`: Analyze performance and adjust level
- `_increase_difficulty()`: Step up difficulty
- `_decrease_difficulty()`: Step down difficulty

### SpacedRepetitionService
Implements SM-2 spaced repetition algorithm
- `create_schedule()`: Initialize review schedule
- `update_schedule()`: Process review and calculate next interval
- `get_due_reviews()`: Retrieve pending reviews
- `update_due_status()`: Refresh due status

### LearningVelocityService
Tracks and analyzes learning pace
- `calculate_velocity()`: Compute velocity metrics
- `get_velocity_trend()`: Historical velocity analysis

### MasteryTrackingService
Manages topic mastery progression
- `update_mastery()`: Record performance and update levels
- `_unlock_next_topics()`: Progressive unlocking
- `_update_milestones()`: Milestone status updates

## Mastery Levels

1. **NOT_STARTED**: Topic not yet attempted
2. **LEARNING**: Initial learning phase (50-70% mastery)
3. **PRACTICING**: Practice phase (70-90% mastery)
4. **MASTERED**: High proficiency (≥90% mastery)
5. **NEEDS_REVIEW**: Declining performance, requires review

## Difficulty Levels

1. **BEGINNER**: Introduction level (30 min estimated)
2. **ELEMENTARY**: Basic concepts (45 min estimated)
3. **INTERMEDIATE**: Standard level (60 min estimated)
4. **ADVANCED**: Complex material (75 min estimated)
5. **EXPERT**: Expert level (90 min estimated)

## SM-2 Spaced Repetition Algorithm

### Parameters
- **Easiness Factor (EF)**: 1.3 to 2.5+, starts at 2.5
- **Quality Scale**: 0-5
  - 0: Complete blackout
  - 1: Incorrect but familiar
  - 2: Incorrect but close
  - 3: Correct with difficulty
  - 4: Correct after hesitation
  - 5: Perfect response

### Interval Calculation
- First review: 1 day
- Second review: 6 days
- Subsequent: Previous interval × EF

### EF Adjustment Formula
```
EF = EF + (0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02))
```

## Integration Points

### With ML Prediction System
- Uses student performance predictions for initial difficulty
- AI confidence scores inform adaptation decisions
- Historical performance data feeds sequence generation

### With Gamification System
- Milestone completion awards points
- Streak tracking for consecutive days
- Achievement unlocking on path completion

### With Analytics System
- Velocity metrics feed into overall progress analytics
- Performance data contributes to weakness detection
- Completion rates tracked for institutional insights

## Usage Examples

### Creating a Personalized Learning Path

```python
# 1. Define topics with prerequisites
POST /api/v1/learning-paths/prerequisites
{
  "topic_id": 2,
  "prerequisite_topic_id": 1,
  "strength": 1.0,
  "is_hard_prerequisite": true
}

# 2. Generate personalized sequence
POST /api/v1/learning-paths/generate
{
  "student_id": 123,
  "grade_id": 5,
  "subject_id": 3,
  "topic_ids": [1, 2, 3, 4, 5],
  "include_ai_predictions": true
}

# 3. Student completes topic
POST /api/v1/learning-paths/mastery/update
{
  "topic_sequence_id": 1,
  "performance_score": 0.85,
  "time_spent_minutes": 45,
  "correct_answers": 17,
  "total_questions": 20
}

# 4. System creates review schedule
# Automatically triggered when mastery level reaches MASTERED

# 5. Get due reviews
GET /api/v1/learning-paths/spaced-repetition/due?student_id=123

# 6. Complete review
PATCH /api/v1/learning-paths/spaced-repetition/15
{
  "review_quality": 4,
  "time_spent_minutes": 10
}
```

### Monitoring Progress

```python
# Get comprehensive progress
GET /api/v1/learning-paths/1/progress

# Calculate current velocity
POST /api/v1/learning-paths/1/velocity/calculate?period_days=7

# Get visualization data
GET /api/v1/learning-paths/1/visualization
```

## Best Practices

### For Educators
1. Define clear prerequisite relationships
2. Set realistic target dates for learning paths
3. Review milestone completion rates
4. Monitor velocity trends across students
5. Use visualization to identify bottlenecks

### For Students
1. Complete topics in sequence order
2. Don't skip review sessions
3. Maintain consistent daily practice
4. Aim for 70-85% performance for optimal challenge
5. Track streak and milestone progress

### For System Administrators
1. Regularly calculate velocity metrics
2. Monitor difficulty adaptation patterns
3. Review prerequisite relationship effectiveness
4. Analyze milestone completion rates
5. Track review session completion

## Performance Considerations

- Topological sort is O(V + E) where V is topics and E is prerequisites
- Velocity calculations are batched by period
- Review schedules updated asynchronously
- Prerequisite checks cached for active paths
- Visualization data generated on-demand

## Future Enhancements

1. **Collaborative filtering**: Recommend paths based on similar students
2. **Content recommendations**: Suggest study materials per topic
3. **Peer comparison**: Anonymous benchmarking against cohort
4. **Learning style adaptation**: Adjust based on VAK preferences
5. **Predictive completion**: ML-based completion date estimation
6. **Mobile notifications**: Push alerts for due reviews
7. **Parent dashboard**: Progress visibility for guardians
8. **Teacher insights**: Class-wide velocity and mastery analytics

## Database Migration

Run the migration:
```bash
alembic upgrade head
```

Rollback if needed:
```bash
alembic downgrade -1
```

## Testing Recommendations

1. Test topological sort with circular dependencies
2. Verify difficulty adaptation thresholds
3. Test SM-2 algorithm with various quality scores
4. Validate prerequisite unlocking logic
5. Test velocity calculations with edge cases
6. Verify milestone status transitions
7. Test concurrent mastery updates
8. Validate API authorization

## Monitoring & Metrics

Key metrics to track:
- Average learning velocity by grade/subject
- Difficulty adaptation frequency
- Review completion rates
- Milestone achievement rates
- Path completion times
- Student engagement (streak length)
- Mastery level distribution

## Security Considerations

- All endpoints require authentication
- Institution-level data isolation
- Student data privacy compliance
- Role-based access control ready
- Audit trail for all changes
- Rate limiting recommended for expensive operations
