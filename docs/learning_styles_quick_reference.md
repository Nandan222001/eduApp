# Learning Styles API Quick Reference

## Quick Start

### 1. Create a Learning Profile
```bash
curl -X POST http://localhost:8000/api/v1/learning-styles/profiles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 123,
    "visual_score": 0.35,
    "auditory_score": 0.20,
    "kinesthetic_score": 0.25,
    "reading_writing_score": 0.20
  }'
```

### 2. Get Assessment Questions
```bash
curl http://localhost:8000/api/v1/learning-styles/default-assessment-questions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Create & Submit Assessment
```bash
# Create
curl -X POST http://localhost:8000/api/v1/learning-styles/assessments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 123,
    "assessment_type": "vark",
    "questions": [...]
  }'

# Start
curl -X POST http://localhost:8000/api/v1/learning-styles/assessments/1/start?student_id=123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit
curl -X POST http://localhost:8000/api/v1/learning-styles/assessments/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_id": 1,
    "responses": [
      {"question_id": 1, "answer": "a"},
      {"question_id": 2, "answer": "c"}
    ]
  }'
```

### 4. Tag Content
```bash
# Auto-tag
curl -X POST http://localhost:8000/api/v1/learning-styles/content-tags/study_material/456/auto-tag \
  -H "Authorization: Bearer YOUR_TOKEN"

# Manual tag
curl -X POST http://localhost:8000/api/v1/learning-styles/content-tags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content_type": "study_material",
    "content_id": 456,
    "visual_suitability": 0.9,
    "auditory_suitability": 0.3,
    "kinesthetic_suitability": 0.2,
    "reading_writing_suitability": 0.7,
    "delivery_format": "video"
  }'
```

### 5. Generate Recommendations
```bash
curl -X POST http://localhost:8000/api/v1/learning-styles/recommendations/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 123,
    "subject_id": 5,
    "limit": 10
  }'
```

### 6. Create Adaptive Session
```bash
# Create session
curl -X POST http://localhost:8000/api/v1/learning-styles/adaptive-sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 123,
    "content_type": "study_material",
    "content_id": 456,
    "initial_format": "video",
    "initial_difficulty": "medium"
  }'

# Real-time adjust
curl -X POST http://localhost:8000/api/v1/learning-styles/adaptive-sessions/1/real-time-adjust \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "performance_metrics": {
      "success_rate": 0.75,
      "questions_attempted": 10,
      "questions_correct": 7
    },
    "engagement_metrics": {
      "engagement_rate": 0.60,
      "time_spent_seconds": 300,
      "interaction_count": 15
    }
  }'

# End session
curl -X POST http://localhost:8000/api/v1/learning-styles/adaptive-sessions/1/end \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Use Cases

### Student Takes Assessment
```python
# Get questions
questions = get("/learning-styles/default-assessment-questions")

# Create assessment
assessment = post("/learning-styles/assessments", {
    "student_id": student_id,
    "assessment_type": "vark",
    "questions": questions["questions"]
})

# Start
post(f"/learning-styles/assessments/{assessment['id']}/start?student_id={student_id}")

# Student answers questions...

# Submit
result = post("/learning-styles/assessments/submit", {
    "assessment_id": assessment["id"],
    "responses": student_responses
})

# Profile is automatically updated with scores
```

### Teacher Tags Content
```python
# Auto-tag based on material type
tag = post(f"/learning-styles/content-tags/study_material/{material_id}/auto-tag")

# Or manually tag with custom scores
tag = post("/learning-styles/content-tags", {
    "content_type": "study_material",
    "content_id": material_id,
    "visual_suitability": 0.9,
    "auditory_suitability": 0.7,
    "kinesthetic_suitability": 0.3,
    "reading_writing_suitability": 0.5,
    "delivery_format": "video",
    "supports_social_learning": False,
    "sequential_flow": True
})
```

### Student Gets Personalized Recommendations
```python
# Generate recommendations for a specific chapter
recommendations = post("/learning-styles/recommendations/generate", {
    "student_id": student_id,
    "subject_id": subject_id,
    "chapter_id": chapter_id,
    "limit": 10
})

# Each recommendation includes:
# - content details
# - recommended format
# - scoring breakdown
# - reasoning
```

### Student Uses Adaptive Learning
```python
# Start session
session = post("/learning-styles/adaptive-sessions", {
    "student_id": student_id,
    "content_type": "study_material",
    "content_id": material_id,
    "initial_format": "video",
    "initial_difficulty": "medium"
})

# During learning, periodically adjust
while learning:
    # Calculate current metrics
    performance = calculate_performance()
    engagement = calculate_engagement()
    
    # Get adjustments
    adjustments = post(
        f"/learning-styles/adaptive-sessions/{session['id']}/real-time-adjust",
        {
            "performance_metrics": performance,
            "engagement_metrics": engagement
        }
    )
    
    # Apply new difficulty and/or format
    if adjustments["difficulty"]["format_changed"]:
        switch_to_format(adjustments["format"]["recommended_format"])
    
    if adjustments["difficulty"]["adjustment_magnitude"] != 0:
        switch_to_difficulty(adjustments["difficulty"]["new_difficulty"])

# End session
post(f"/learning-styles/adaptive-sessions/{session['id']}/end")
```

### Track Learning Effectiveness
```python
# Record effectiveness after content consumption
effectiveness = post("/learning-styles/effectiveness", {
    "student_id": student_id,
    "content_type": "study_material",
    "content_id": material_id,
    "delivery_format": "video",
    "time_spent_seconds": 600,
    "completion_rate": 1.0,
    "pre_assessment_score": 65,
    "post_assessment_score": 82,
    "improvement": 17,
    "engagement_score": 0.75,
    "satisfaction_rating": 4,
    "would_recommend": True,
    "feedback": "Great explanation!"
})

# Get analytics
analytics = get(f"/learning-styles/analytics/effectiveness/{student_id}?days=30")

# Returns:
# - by_format: effectiveness by delivery format
# - overall_metrics: aggregate statistics
# - recommendations: personalized suggestions
```

## Data Models

### Learning Style Profile
```python
{
    "student_id": int,
    "visual_score": float,        # 0-1
    "auditory_score": float,      # 0-1
    "kinesthetic_score": float,   # 0-1
    "reading_writing_score": float, # 0-1
    "social_vs_solitary": "mixed" | "social" | "solitary",
    "social_score": float,        # 0-1
    "sequential_vs_global": "balanced" | "sequential" | "global",
    "sequential_score": float,    # 0-1
    "cognitive_strengths": dict,  # flexible
    "dominant_style": str,
    "confidence_level": float
}
```

### Content Tag
```python
{
    "content_type": str,
    "content_id": int,
    "visual_suitability": float,       # 0-1
    "auditory_suitability": float,     # 0-1
    "kinesthetic_suitability": float,  # 0-1
    "reading_writing_suitability": float, # 0-1
    "delivery_format": "video" | "text" | "audio" | "interactive" | "hands_on",
    "difficulty_level": str,
    "supports_social_learning": bool,
    "supports_solitary_learning": bool,
    "sequential_flow": bool,
    "holistic_approach": bool
}
```

### Recommendation
```python
{
    "content_type": str,
    "content_id": int,
    "recommended_format": str,
    "learning_style_match_score": float,
    "difficulty_match_score": float,
    "performance_based_score": float,
    "collaborative_filter_score": float,
    "overall_score": float,
    "rank": int,
    "reasoning": {
        "learning_style_match": str,
        "difficulty_match": str,
        "performance_alignment": str,
        "collaborative_signal": str,
        "primary_reason": str
    }
}
```

## Scoring Algorithms

### Overall Recommendation Score
```
overall_score = (
    learning_style_match * 0.35 +
    difficulty_match * 0.20 +
    performance_based * 0.25 +
    collaborative_filter * 0.20
)
```

### Learning Style Match
```
match = (
    student.visual * content.visual_suitability +
    student.auditory * content.auditory_suitability +
    student.kinesthetic * content.kinesthetic_suitability +
    student.reading_writing * content.reading_writing_suitability
)

# Multiply by social and processing modifiers (1.0 or 1.2)
```

### Difficulty Adjustment
```
if success_rate >= 0.85:
    increase_difficulty()  # Move up 1 level
elif success_rate >= 0.70:
    maintain_difficulty()  # Keep current
elif success_rate >= 0.50:
    decrease_difficulty()  # Move down 1 level
else:
    decrease_difficulty()  # Move down 1 level
```

### Format Switching
```
if engagement_rate < 0.40:
    # Calculate format scores based on learning profile
    # Exclude current format
    # Select highest scoring alternative
    switch_format()
else:
    maintain_format()
```

## Response Examples

### Assessment Result
```json
{
    "id": 1,
    "student_id": 123,
    "status": "completed",
    "visual_score": 0.40,
    "auditory_score": 0.20,
    "kinesthetic_score": 0.25,
    "reading_writing_score": 0.15,
    "cognitive_analysis": {
        "dominant_modality": "visual",
        "learning_preferences": [
            "Prefers charts, diagrams, and visual aids"
        ],
        "strengths": [
            "Strong visual processing"
        ]
    },
    "recommendations": {
        "content_formats": ["Videos", "Infographics", "Mind maps"],
        "study_strategies": ["Use color coding", "Create visual summaries"],
        "tools_and_resources": ["Concept mapping software"]
    }
}
```

### Recommendation
```json
{
    "id": 1,
    "content_type": "study_material",
    "content_id": 456,
    "recommended_format": "video",
    "learning_style_match_score": 0.85,
    "difficulty_match_score": 0.75,
    "performance_based_score": 0.90,
    "collaborative_filter_score": 0.70,
    "overall_score": 0.82,
    "rank": 1,
    "reasoning": {
        "learning_style_match": "0.85",
        "difficulty_match": "0.75",
        "performance_alignment": "0.90",
        "collaborative_signal": "0.70",
        "primary_reason": "Addresses your learning needs"
    }
}
```

### Adaptive Session Adjustment
```json
{
    "difficulty": {
        "new_difficulty": "medium",
        "previous_difficulty": "hard",
        "reason": "Moderate struggle, decreasing difficulty",
        "adjustment_magnitude": -1
    },
    "format": {
        "recommended_format": "interactive",
        "previous_format": "video",
        "reason": "Low engagement, switching to better-suited format",
        "format_changed": true
    },
    "timestamp": "2024-01-15T10:30:00"
}
```

## Error Handling

All endpoints return standard HTTP status codes:
- `200 OK`: Success
- `201 Created`: Resource created
- `204 No Content`: Success with no response body
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:
```json
{
    "detail": "Error message description"
}
```
