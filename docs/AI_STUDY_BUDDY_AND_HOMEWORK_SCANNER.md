# AI Study Buddy and Smart Homework Scanner

## Overview

This document describes the AI Study Buddy and Smart Homework Scanner features that provide intelligent tutoring and automated homework assistance to students.

## Features

### AI Study Buddy

The AI Study Buddy is an intelligent conversational assistant that helps students with their studies using OpenAI GPT integration.

**Key Features:**
- Contextual conversations with personalized student data
- Study pattern analysis
- Daily study plan generation
- Motivational messages
- Intelligent insights based on performance

### Smart Homework Scanner

The Smart Homework Scanner uses OCR (Tesseract) and mathematical evaluation (SymPy) to analyze homework images.

**Key Features:**
- Image to text extraction using Tesseract OCR
- Automatic problem detection and classification
- Mathematical problem solving using SymPy
- AI-powered feedback generation
- Step-by-step solution breakdown

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

### Dependencies

The following Python packages are required:
- `openai>=1.6.1` - OpenAI API client
- `pytesseract>=0.3.10` - OCR library
- `sympy>=1.12` - Symbolic mathematics library
- `Pillow>=10.2.0` - Image processing

**Note:** You must also install Tesseract OCR on your system:
- Ubuntu/Debian: `sudo apt-get install tesseract-ocr`
- macOS: `brew install tesseract`
- Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki

## Database Models

### Study Buddy Models

#### StudyBuddySession
Stores conversation sessions between students and the AI tutor.

```python
- id: Primary key
- institution_id: Foreign key to institutions
- student_id: Foreign key to students
- session_title: Optional title
- context: JSON field for additional context
- started_at: Session start timestamp
- ended_at: Session end timestamp (nullable)
- total_messages: Count of messages in session
- is_active: Whether session is currently active
```

#### StudyBuddyMessage
Individual messages in a conversation session.

```python
- id: Primary key
- session_id: Foreign key to study_buddy_sessions
- role: 'user' or 'assistant'
- content: Message text
- metadata: JSON field for additional data
- created_at: Message timestamp
```

#### StudyBuddyInsight
AI-generated insights for students.

```python
- id: Primary key
- institution_id: Foreign key to institutions
- student_id: Foreign key to students
- insight_type: Type of insight
- title: Insight title
- content: Insight content
- priority: Priority level (1-5)
- is_read: Read status
- read_at: When insight was read
- metadata: JSON field for additional data
```

### Homework Scanner Models

#### HomeworkScan
Stores scanned homework images and their analysis.

```python
- id: Primary key
- institution_id: Foreign key to institutions
- student_id: Foreign key to students
- subject_id: Foreign key to subjects (nullable)
- scan_title: Optional title
- image_url: URL to stored image
- s3_key: S3 storage key
- extracted_text: OCR extracted text
- detected_problems: JSON array of detected problems
- solutions: JSON array of solutions
- ai_feedback: AI-generated feedback text
- confidence_score: OCR confidence (0-100)
- processing_status: 'pending', 'processing', 'completed', 'failed'
- error_message: Error message if failed
- metadata: JSON field for additional data
```

## API Endpoints

### Study Buddy Endpoints

Base URL: `/api/v1/study-buddy`

#### POST /sessions
Create a new study buddy session.

**Request Body:**
```json
{
  "student_id": 1,
  "session_title": "Math homework help",
  "context": {
    "subject": "Mathematics",
    "topic": "Algebra"
  }
}
```

**Response:** `StudyBuddySessionResponse`

#### GET /sessions
Get student's sessions.

**Query Parameters:**
- `student_id` (required): Student ID
- `is_active` (optional): Filter by active status
- `limit` (optional, default=10): Number of sessions to return

**Response:** Array of `StudyBuddySessionResponse`

#### GET /sessions/{session_id}
Get specific session details.

**Response:** `StudyBuddySessionResponse`

#### POST /sessions/{session_id}/end
End an active session.

**Response:** `StudyBuddySessionResponse`

#### GET /sessions/{session_id}/messages
Get all messages in a session.

**Query Parameters:**
- `limit` (optional, default=50): Number of messages to return

**Response:** Array of `StudyBuddyMessageResponse`

#### POST /chat
Send a message to the AI Study Buddy.

**Request Body:**
```json
{
  "session_id": 1,
  "message": "Can you explain quadratic equations?",
  "context": {
    "subject": "Mathematics"
  }
}
```

**Response:**
```json
{
  "session_id": 1,
  "response": "Sure! A quadratic equation is...",
  "suggestions": [
    "Would you like me to show some examples?",
    "Should I explain the quadratic formula?"
  ],
  "related_topics": [
    {
      "subject": "Mathematics",
      "topic": "Linear Equations",
      "weakness_score": 65.5
    }
  ]
}
```

#### GET /analyze-patterns/{student_id}
Analyze student's study patterns.

**Response:**
```json
{
  "strong_subjects": [
    {
      "subject": "Physics",
      "chapter": "Mechanics",
      "mastery_score": 85.5,
      "proficiency": "advanced"
    }
  ],
  "weak_subjects": [
    {
      "subject": "Mathematics",
      "topic": "Calculus",
      "weakness_score": 45.0,
      "attempts": 5
    }
  ],
  "study_hours_trend": [
    {
      "period": "Last 30 days",
      "hours": 45.5,
      "avg_per_day": 1.52
    }
  ],
  "performance_trend": [
    {
      "date": "2024-01-15",
      "percentage": 78.5,
      "subject": "Physics"
    }
  ],
  "consistency_score": 75.5,
  "recommendations": [
    "Focus on improving Mathematics - Calculus with targeted practice.",
    "Great work on Physics! Keep up the momentum."
  ]
}
```

#### GET /daily-plan/{student_id}
Generate a daily study plan for a student.

**Query Parameters:**
- `target_date` (optional): Target date (YYYY-MM-DD format), defaults to today

**Response:**
```json
{
  "date": "2024-01-20",
  "total_study_hours": 3.5,
  "tasks": [
    {
      "title": "Practice Calculus",
      "subject": "Mathematics",
      "duration_minutes": 60,
      "priority": "high",
      "status": "pending"
    }
  ],
  "break_intervals": [
    {
      "time": "10:00 AM - 10:15 AM",
      "type": "short_break"
    }
  ],
  "priority_areas": ["Calculus", "Thermodynamics"],
  "motivational_tips": [
    "Start with your most challenging task when your mind is fresh"
  ]
}
```

#### GET /motivational-message/{student_id}
Get a personalized motivational message.

**Response:**
```json
{
  "message": "Keep up the great work, John! Your recent performance has been excellent! 🌟",
  "type": "celebration",
  "tips": [
    "Maintain this momentum by consistent practice"
  ],
  "encouragement": "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep learning, keep growing!"
}
```

#### GET /insights/{student_id}
Get AI-generated insights for a student.

**Query Parameters:**
- `is_read` (optional): Filter by read status
- `limit` (optional, default=20): Number of insights to return

**Response:** Array of `StudyBuddyInsightResponse`

#### POST /insights/{insight_id}/mark-read
Mark an insight as read.

**Response:** `StudyBuddyInsightResponse`

### Homework Scanner Endpoints

Base URL: `/api/v1/homework-scanner`

#### POST /scans
Upload and scan homework image.

**Request (multipart/form-data):**
- `file` (required): Image file
- `student_id` (required): Student ID
- `subject_id` (optional): Subject ID
- `scan_title` (optional): Title for the scan

**Response:** `HomeworkScanResponse`

#### GET /scans
Get student's homework scans.

**Query Parameters:**
- `student_id` (required): Student ID
- `subject_id` (optional): Filter by subject
- `limit` (optional, default=20): Number of scans to return
- `skip` (optional, default=0): Number of scans to skip

**Response:** Array of `HomeworkScanResponse`

#### GET /scans/{scan_id}
Get specific scan details.

**Response:** `HomeworkScanResponse`

#### GET /scans/{scan_id}/analyze
Get detailed analysis of a scan.

**Response:**
```json
{
  "scan_id": 1,
  "problems_count": 5,
  "problems": [
    {
      "problem_text": "2x + 5 = 15",
      "problem_type": "linear_equation",
      "difficulty": "medium",
      "solution": "[5]",
      "steps": [
        "Given equation: 2x + 5 = 15",
        "Solution: [5]"
      ],
      "confidence": 0.75
    }
  ],
  "overall_difficulty": "medium",
  "estimated_time_minutes": 25,
  "recommendations": [
    "Review the step-by-step solutions provided",
    "Practice similar problems to reinforce understanding"
  ],
  "ai_feedback": "Great work on attempting these problems! Focus on..."
}
```

#### DELETE /scans/{scan_id}
Delete a homework scan.

**Response:** 204 No Content

## Service Layer

### StudyBuddyService

Located in `src/services/study_buddy_service.py`

**Key Methods:**
- `create_session()` - Create a new chat session
- `chat()` - Handle conversational interactions with OpenAI
- `analyze_study_patterns()` - Analyze student performance and behavior
- `generate_daily_plan()` - Create personalized daily study plans
- `generate_motivational_message()` - Generate context-aware motivational messages
- `create_insight()` - Create AI-generated insights

### HomeworkScannerService

Located in `src/services/homework_scanner_service.py`

**Key Methods:**
- `create_scan()` - Upload and process homework image
- `_extract_text_from_image()` - Extract text using Tesseract OCR
- `_detect_problems()` - Identify problems in extracted text
- `_solve_problem()` - Solve mathematical problems using SymPy
- `_generate_ai_feedback()` - Generate feedback using OpenAI
- `analyze_scan()` - Comprehensive analysis of scanned homework

## Usage Examples

### Study Buddy Chat Example

```python
from src.services.study_buddy_service import StudyBuddyService

service = StudyBuddyService(db)

# Start a chat
response = service.chat(
    institution_id=1,
    student_id=123,
    message="Can you help me understand derivatives?",
    context={"subject": "Calculus"}
)

print(response["response"])  # AI's response
print(response["suggestions"])  # Suggested follow-up questions
```

### Homework Scanner Example

```python
from src.services.homework_scanner_service import HomeworkScannerService

service = HomeworkScannerService(db)

# Scan homework
scan = await service.create_scan(
    institution_id=1,
    student_id=123,
    file=uploaded_file,
    subject_id=5,
    scan_title="Math Homework Chapter 3"
)

# Analyze results
analysis = service.analyze_scan(scan.id)
print(analysis["problems_count"])
print(analysis["ai_feedback"])
```

## Error Handling

The services handle various error scenarios:

1. **Missing API Keys**: Services gracefully degrade when OpenAI API key is not configured
2. **OCR Failures**: Returns informative error messages when OCR is unavailable
3. **Mathematical Parsing Errors**: Captures and reports SymPy parsing errors
4. **S3 Upload Failures**: Handles file upload errors appropriately

## Performance Considerations

1. **Async Processing**: Homework scans are processed asynchronously to avoid blocking
2. **Token Limits**: OpenAI requests are limited to 1000 tokens for responses
3. **Message History**: Chat maintains only the last 10 messages for context
4. **Caching**: Consider implementing Redis caching for frequently accessed data

## Security Considerations

1. **API Key Protection**: Never expose OpenAI API keys in logs or responses
2. **File Validation**: Only accept image files for homework scanning
3. **Rate Limiting**: Consider implementing rate limits on chat and scan endpoints
4. **Data Privacy**: Ensure student data is properly protected and complies with regulations

## Future Enhancements

1. Support for more problem types (geometry, trigonometry, etc.)
2. Voice-based interactions
3. Real-time collaborative study sessions
4. Integration with assignment submission workflow
5. Automated progress tracking and parent notifications
6. Multi-language support for OCR
7. Handwriting recognition improvements
8. Video problem solving explanations
