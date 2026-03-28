# Reverse Classroom (Teach AI) Implementation

## Overview
The Reverse Classroom feature allows students to explain topics to an AI tutor, which then analyzes their understanding, identifies knowledge gaps, and provides feedback. This "learning by teaching" approach helps reinforce concepts and reveals misconceptions.

## Database Models

### TeachingSession
Located in `src/models/reverse_classroom.py`

**Fields:**
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `student_id`: Foreign key to students
- `topic_id`: Foreign key to topics
- `explanation_type`: Enum (text, voice, video)
- `explanation_content`: The student's explanation text
- `ai_analysis`: Full JSON analysis from OpenAI
- `correctly_explained`: Array of correctly explained concepts
- `missing_concepts`: Array of missing concepts
- `confused_concepts`: Array of confused/incorrect concepts
- `understanding_level_percent`: Overall understanding score (0-100)
- `clarity_score`: Clarity of explanation score (0-100)
- `duration_seconds`: Duration for voice/video explanations
- `word_count`: Number of words in explanation
- `is_analyzed`: Boolean flag indicating if AI analysis is complete
- `created_at`, `updated_at`: Timestamps

### TeachingChallenge
Located in `src/models/reverse_classroom.py`

**Fields:**
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `session_id`: Foreign key to teaching_sessions
- `student_id`: Foreign key to students
- `difficulty`: Enum (explain_to_5yo, explain_to_10yo, explain_to_college, explain_in_30s)
- `challenge_prompt`: AI-generated challenge question
- `student_response`: Student's response to the challenge
- `completed`: Boolean flag
- `score`: Score for the challenge response (0-100)
- `ai_feedback`: Full JSON feedback from OpenAI
- `strengths`: Array of identified strengths
- `areas_for_improvement`: Array of areas to improve
- `completed_at`: When the challenge was completed
- `created_at`, `updated_at`: Timestamps

## Service Layer

### ReverseClassroomService
Located in `src/services/reverse_classroom_service.py`

**Key Methods:**
1. `transcribe_audio(audio_url)`: Transcribe audio using OpenAI Whisper API
2. `get_topic_knowledge_base(db, topic_id)`: Retrieve topic information for analysis
3. `analyze_student_explanation(db, session_id, explanation_content, topic_knowledge)`: Analyze student explanation using GPT-4
4. `generate_challenge(db, session_id, difficulty, topic_knowledge, previous_analysis)`: Generate teaching challenges
5. `evaluate_challenge_response(db, challenge_id, student_response, difficulty, topic_knowledge)`: Evaluate challenge responses
6. `get_student_progress(db, student_id, institution_id)`: Get comprehensive student progress
7. `get_topic_progress(db, topic_id, institution_id)`: Get topic-level analytics

## API Endpoints

All endpoints are prefixed with `/api/v1/reverse-classroom`

### Teaching Sessions

**POST /sessions**
- Create a new teaching session
- Body: `TeachingSessionCreate` (student_id, topic_id, explanation_type, explanation_content)
- Triggers background AI analysis
- Returns: `TeachingSessionResponse`

**POST /sessions/transcribe**
- Create session from audio transcription
- Body: `AudioTranscriptionRequest` (audio_url, student_id, topic_id)
- Uses Whisper API to transcribe audio
- Returns: `TeachingSessionResponse`

**GET /sessions**
- List teaching sessions with filters
- Query params: student_id, topic_id, explanation_type, skip, limit
- Returns: List of `TeachingSessionResponse`

**GET /sessions/{session_id}**
- Get specific session with full details
- Returns: `TeachingSessionDetail`

**PUT /sessions/{session_id}**
- Update session details
- Body: `TeachingSessionUpdate`
- Returns: `TeachingSessionResponse`

**POST /sessions/{session_id}/analyze**
- Manually trigger AI analysis
- Returns: `AIAnalysisResult`

**DELETE /sessions/{session_id}**
- Delete a teaching session
- Returns: 204 No Content

### Teaching Challenges

**POST /challenges**
- Create a new teaching challenge
- Body: `TeachingChallengeCreate` (session_id, difficulty)
- Auto-generates challenge prompt based on difficulty
- Returns: `TeachingChallengeResponse`

**GET /challenges**
- List teaching challenges with filters
- Query params: session_id, student_id, difficulty, completed, skip, limit
- Returns: List of `TeachingChallengeResponse`

**GET /challenges/{challenge_id}**
- Get specific challenge
- Returns: `TeachingChallengeResponse`

**POST /challenges/{challenge_id}/submit**
- Submit response to a challenge
- Body: `TeachingChallengeSubmit` (student_response)
- Triggers AI evaluation
- Returns: `TeachingChallengeResponse`

**DELETE /challenges/{challenge_id}**
- Delete a challenge
- Returns: 204 No Content

### Progress Tracking

**GET /progress/student/{student_id}**
- Get comprehensive student progress
- Returns: `StudentProgress` (total sessions, challenges, average scores, topics covered)

**GET /progress/topic/{topic_id}**
- Get topic-level analytics
- Query param: institution_id
- Returns: `TopicProgress` (average understanding, clarity, student count, concept mastery)

### Bulk Operations

**POST /sessions/bulk-analyze**
- Trigger analysis for multiple sessions
- Body: `BulkAnalysisRequest` (session_ids array)
- Returns: 202 Accepted with message

## Database Migration

Migration file: `alembic/versions/033_create_reverse_classroom_tables.py`

Run migration with:
```bash
alembic upgrade head
```

## AI Integration

The service uses OpenAI's GPT-4 and Whisper models:

1. **GPT-4**: Used for analyzing student explanations, generating challenges, and evaluating responses
2. **Whisper**: Used for transcribing audio explanations

Required environment variable:
```
OPENAI_API_KEY=your-api-key-here
```

## Features

### Explanation Analysis
- Identifies correctly explained concepts
- Detects missing concepts that should have been covered
- Identifies confused or incorrectly explained concepts
- Calculates understanding level percentage
- Calculates clarity score
- Provides detailed feedback and suggestions
- Generates follow-up questions

### Teaching Challenges
- **Explain to 5-year-old**: Simplify concepts with basic language
- **Explain to 10-year-old**: Age-appropriate explanations
- **Explain to college student**: Technical and in-depth
- **Explain in 30 seconds**: Concise, focused explanations

### Progress Tracking
- Student-level progress across all topics
- Topic-level analytics across all students
- Concept mastery tracking
- Performance trends

## Usage Example

```python
# Create a teaching session
session_data = {
    "student_id": 1,
    "topic_id": 42,
    "explanation_type": "text",
    "explanation_content": "Photosynthesis is the process by which plants make food using sunlight..."
}
response = requests.post("/api/v1/reverse-classroom/sessions", json=session_data)

# Get analysis results
session = requests.get(f"/api/v1/reverse-classroom/sessions/{session_id}")
print(session["understanding_level_percent"])  # e.g., 75.0
print(session["correctly_explained"])  # ["light energy conversion", "chlorophyll"]
print(session["missing_concepts"])  # ["carbon dioxide intake", "oxygen release"]

# Create a challenge
challenge_data = {
    "session_id": session_id,
    "difficulty": "explain_to_5yo"
}
challenge = requests.post("/api/v1/reverse-classroom/challenges", json=challenge_data)

# Submit challenge response
submission = {
    "student_response": "Plants are like little factories that use sunshine to make their food..."
}
result = requests.post(f"/api/v1/reverse-classroom/challenges/{challenge_id}/submit", json=submission)
print(result["score"])  # e.g., 85.0
```

## Error Handling

The service includes comprehensive error handling:
- Missing student/topic validation
- OpenAI API failure handling
- JSON parsing fallbacks
- Database transaction management
- Background task error logging

## Performance Considerations

- AI analysis runs in background tasks to avoid blocking requests
- Indexes on frequently queried fields (student_id, topic_id, created_at)
- JSON columns for flexible storage of AI responses
- Efficient progress queries using aggregations

## Future Enhancements

Potential improvements:
1. Real-time feedback during explanation typing
2. Video upload and analysis support
3. Peer comparison and benchmarking
4. Gamification of teaching challenges
5. Topic prerequisite mapping
6. Concept knowledge graph visualization
7. Adaptive difficulty based on performance
8. Multi-language support
