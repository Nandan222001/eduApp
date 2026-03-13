# Adaptive Learning Path - Quick Start Guide

## Installation

1. Run database migration:
```bash
alembic upgrade head
```

2. Verify tables created:
```bash
psql -d your_database -c "\dt *learning*"
psql -d your_database -c "\dt *spaced*"
```

## Quick Setup

### 1. Define Prerequisites (One-time setup)

```bash
curl -X POST http://localhost:8000/api/v1/learning-paths/prerequisites \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": 2,
    "prerequisite_topic_id": 1,
    "strength": 1.0,
    "is_hard_prerequisite": true,
    "minimum_mastery_required": 0.7
  }'
```

### 2. Generate Personalized Path

```bash
curl -X POST http://localhost:8000/api/v1/learning-paths/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "grade_id": 5,
    "subject_id": 3,
    "topic_ids": [1, 2, 3, 4, 5],
    "target_date": "2024-06-30",
    "include_ai_predictions": true
  }'
```

### 3. Record Performance

```bash
curl -X POST http://localhost:8000/api/v1/learning-paths/mastery/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_sequence_id": 1,
    "performance_score": 0.85,
    "time_spent_minutes": 45,
    "correct_answers": 17,
    "total_questions": 20
  }'
```

### 4. Get Due Reviews

```bash
curl -X GET "http://localhost:8000/api/v1/learning-paths/spaced-repetition/due?student_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Complete Review

```bash
curl -X PATCH http://localhost:8000/api/v1/learning-paths/spaced-repetition/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "review_quality": 4,
    "time_spent_minutes": 10,
    "score": 0.85
  }'
```

### 6. Check Progress

```bash
curl -X GET http://localhost:8000/api/v1/learning-paths/1/progress \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Key Concepts

### Mastery Levels (Auto-calculated)
- **NOT_STARTED** (0%): Not attempted
- **LEARNING** (50-70%): Initial learning
- **PRACTICING** (70-90%): Building proficiency
- **MASTERED** (90%+): High proficiency
- **NEEDS_REVIEW**: Declining performance

### Difficulty Levels (Adaptive)
- **BEGINNER**: Introduction (30 min)
- **ELEMENTARY**: Basic (45 min)
- **INTERMEDIATE**: Standard (60 min)
- **ADVANCED**: Complex (75 min)
- **EXPERT**: Expert (90 min)

### Review Quality Scale (0-5)
- **5**: Perfect recall
- **4**: Correct after hesitation
- **3**: Correct with difficulty
- **2**: Incorrect but close
- **1**: Incorrect but familiar
- **0**: Complete blackout

## Common Workflows

### For Students

**Daily Study Session:**
1. Get due reviews: `GET /spaced-repetition/due?student_id=X`
2. Complete reviews with quality rating
3. Work on unlocked topics in learning path
4. Record performance after each topic
5. Check progress and streak

**Weekly Review:**
1. Get progress: `GET /learning-paths/{id}/progress`
2. Review velocity trend
3. Check upcoming milestones
4. Plan next week's topics

### For Teachers

**Setup Class Path:**
1. Define topic prerequisites for subject
2. Generate paths for each student
3. Set class-wide milestones

**Monitor Progress:**
1. Check velocity trends by student
2. Review difficulty adaptations
3. Identify struggling students
4. Adjust milestones if needed

### For Developers

**Integrate with Your App:**
```python
# Create learning path
response = requests.post(
    "http://api/v1/learning-paths/generate",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "student_id": student.id,
        "grade_id": grade.id,
        "topic_ids": topic_list,
        "include_ai_predictions": True
    }
)
path = response.json()

# Record performance
requests.post(
    "http://api/v1/learning-paths/mastery/update",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "topic_sequence_id": sequence_id,
        "performance_score": score / 100,
        "time_spent_minutes": time_spent,
        "correct_answers": correct,
        "total_questions": total
    }
)

# Get visualization data
viz = requests.get(
    f"http://api/v1/learning-paths/{path_id}/visualization",
    headers={"Authorization": f"Bearer {token}"}
).json()
```

## API Response Examples

### Learning Path Detail
```json
{
  "id": 1,
  "student_id": 123,
  "name": "Personalized Path - 2024-01-15",
  "status": "active",
  "completion_percentage": 45.5,
  "learning_velocity": 1.2,
  "milestones": [
    {
      "id": 1,
      "title": "Foundation Milestone",
      "status": "completed",
      "reward_points": 100
    }
  ],
  "topic_sequences": [
    {
      "id": 1,
      "topic_id": 5,
      "sequence_order": 1,
      "mastery_level": "mastered",
      "mastery_score": 0.92,
      "difficulty_level": "intermediate",
      "is_unlocked": true
    }
  ]
}
```

### Progress Response
```json
{
  "learning_path_id": 1,
  "completion_percentage": 45.5,
  "topics_completed": 5,
  "topics_total": 11,
  "current_streak": 7,
  "estimated_days_remaining": 12,
  "next_review_topics": [
    {
      "topic_id": 3,
      "next_review_date": "2024-01-16",
      "priority": "high"
    }
  ],
  "upcoming_milestones": [
    {
      "title": "Intermediate Milestone",
      "target_date": "2024-01-25",
      "status": "in_progress",
      "reward_points": 200
    }
  ],
  "velocity_trend": "increasing",
  "recommendations": [
    "Great progress! You're nearing completion",
    "Consider dedicating more time to daily practice"
  ]
}
```

### Visualization Data
```json
{
  "nodes": [
    {
      "id": 1,
      "label": "Introduction to Algebra",
      "sequence_order": 1,
      "mastery_level": "mastered",
      "mastery_score": 0.92,
      "difficulty_level": "intermediate",
      "is_unlocked": true,
      "is_completed": true
    }
  ],
  "edges": [
    {
      "source": 1,
      "target": 2,
      "type": "prerequisite"
    }
  ],
  "milestones": [
    {
      "id": 1,
      "title": "Foundation",
      "order": 1,
      "status": "completed",
      "required_topics": [1, 2, 3]
    }
  ],
  "progress_summary": {
    "total_topics": 11,
    "completed_topics": 5,
    "unlocked_topics": 7,
    "completion_percentage": 45.5
  }
}
```

## Troubleshooting

### Topics Not Unlocking
- Check prerequisite completion: All prerequisites must be MASTERED
- Verify prerequisite relationships exist
- Check sequence order is correct

### Difficulty Not Adapting
- Ensure sufficient performance data (3+ attempts)
- Verify performance scores are being recorded
- Check if student is consistently in target range (60-75%)

### Reviews Not Appearing
- Verify schedule exists: `GET /spaced-repetition/due`
- Check if topic reached MASTERED level
- Ensure review dates have passed

### Velocity Seems Wrong
- Check calculation period (default 7 days)
- Verify topics have completion timestamps
- Ensure performance data is recorded

## Performance Tips

1. **Batch operations**: Update multiple performances in sequence
2. **Cache paths**: Store active path ID in session
3. **Lazy load**: Load visualization only when needed
4. **Paginate**: Use skip/limit for large topic lists
5. **Index**: Ensure database indexes are present

## Next Steps

1. Review full documentation: `ADAPTIVE_LEARNING_PATH_IMPLEMENTATION.md`
2. Set up front-end visualization using the API data
3. Integrate with your existing student dashboard
4. Configure notification system for due reviews
5. Set up analytics dashboards for teachers

## Support

For issues or questions:
1. Check the full implementation documentation
2. Review service layer code in `src/services/learning_path_service.py`
3. Examine API endpoints in `src/api/v1/learning_paths.py`
4. Test with the provided examples
