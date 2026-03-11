# AI Prediction Dashboard Implementation

## Overview

A comprehensive AI-powered exam prediction dashboard for students that provides topic probability rankings, predicted question paper blueprints, study plan generation, what-if scenario simulation, and crash course mode.

## Features Implemented

### 1. Topic Probability Ranking Table
- **Star ratings** (1-5) based on probability score
- **Percentage bars** showing probability visualization
- **Priority tags** (MUST STUDY, VERY HIGH, HIGH, MEDIUM, LOW, OVERDUE)
- **Confidence levels** with color-coded chips
- **Expected marks** and recommended study hours
- **Frequency count** and last appeared year tracking
- **Due topic indicators** with warning icons

### 2. Predicted Question Paper Blueprint Viewer
- **Expandable sections** showing different parts of exam paper
- **Total marks** and duration information
- **Question types** distribution per section
- **Topics included** in each section
- **Difficulty distribution** with visual bars
- **Bloom's Taxonomy level** distribution
- **Overall topic coverage** with probability percentages

### 3. Expected Marks Distribution Pie Chart
- **Category-wise marks** distribution
- **Probability ranges** (Very High 80-100%, High 65-79%, Medium 50-64%, Low 35-49%, Very Low 0-34%)
- **Color-coded segments** for easy visualization
- **Percentage labels** on each segment

### 4. Focus Area Recommendations
- **Priority tags** (critical, high, medium, low)
- **Expected impact** statements
- **Study hours needed** estimation
- **Resources list** for each topic
- **Difficulty level** indicators
- **Detailed reasoning** for prioritization

### 5. Study Time Allocation Donut Chart
- **Category breakdown** (High Priority, Medium Priority, Practice & Tests, Revision, Low Priority)
- **Hour allocation** with percentages
- **Color-coded segments** for visual clarity
- **Descriptions** for each category

### 6. Personalized Study Plan Timeline
- **Daily tasks** with completion checkboxes
- **Weekly breakdown** with focus topics
- **Task types** (study, practice, revision, test)
- **Priority indicators** for each task
- **Milestone dates** tracking
- **Progress tracking** with completion percentage
- **Interactive checkboxes** for task completion

### 7. What-If Scenario Simulator
- **Interactive sliders** for:
  - Study hours adjustment (-5 to +10 hours/day)
  - Practice test count (0-20 tests)
- **Topic focus selection** from high-probability topics
- **Current vs. projected score** comparison
- **Prediction changes** for multiple metrics
- **Recommendations** based on adjustments
- **Risk factors** identification

### 8. Last-Minute Crash Course Mode
- **Priority topics** sorted by ROI (Return on Investment)
- **Daily intensive schedule** (8 hours/day):
  - Morning session (3 hours)
  - Afternoon session (3 hours)
  - Evening session (2 hours)
- **Quick wins** list for fast scoring
- **Topics to skip** (low ROI in limited time)
- **Quick revision points** for each topic
- **Must-know concepts** highlighting
- **Practice questions** recommendations
- **Expected score range** (minimum, realistic, optimistic)
- **Estimated coverage** percentage

## Backend Implementation

### API Endpoints

#### 1. GET /ai-prediction-dashboard/dashboard
Get comprehensive AI prediction dashboard data.

**Query Parameters:**
- `board`: Board name (cbse, icse, state_board)
- `grade_id`: Grade ID
- `subject_id`: Subject ID

**Response:**
```python
{
    "board": "cbse",
    "grade_id": 10,
    "subject_id": 1,
    "subject_name": "Mathematics",
    "generated_at": "2024-01-15T10:30:00",
    "topic_rankings": [...],
    "predicted_blueprint": {...},
    "marks_distribution": [...],
    "focus_areas": [...],
    "study_time_allocation": [...],
    "overall_prediction": {...}
}
```

#### 2. POST /ai-prediction-dashboard/study-plan
Generate personalized study plan timeline.

**Request:**
```python
{
    "board": "cbse",
    "grade_id": 10,
    "subject_id": 1,
    "exam_date": "2024-03-15",
    "available_hours_per_day": 4.5,
    "weak_areas": [1, 5, 12]  // Optional topic IDs
}
```

**Response:**
```python
{
    "exam_date": "2024-03-15",
    "days_until_exam": 60,
    "total_study_hours": 270,
    "weeks": [...],
    "completion_percentage": 0,
    "milestone_dates": {...}
}
```

#### 3. POST /ai-prediction-dashboard/what-if-scenario
Simulate what-if scenarios with parameter adjustments.

**Request:**
```python
{
    "board": "cbse",
    "grade_id": 10,
    "subject_id": 1,
    "study_hours_adjustment": 2.0,  // Additional hours per day
    "focus_topic_ids": [1, 5, 12],  // Optional
    "practice_test_count": 10
}
```

**Response:**
```python
{
    "current_predicted_score": 75.5,
    "projected_score": 82.3,
    "score_improvement": 6.8,
    "confidence_level": "High",
    "prediction_changes": [...],
    "recommended_adjustments": [...],
    "risk_factors": [...]
}
```

#### 4. GET /ai-prediction-dashboard/crash-course-mode
Activate last-minute crash course mode.

**Query Parameters:**
- `board`: Board name
- `grade_id`: Grade ID
- `subject_id`: Subject ID
- `days_until_exam`: Days remaining (1-30)

**Response:**
```python
{
    "days_until_exam": 7,
    "mode_activated": true,
    "priority_topics": [...],
    "daily_schedule": [...],
    "quick_wins": [...],
    "topics_to_skip": [...],
    "estimated_coverage": 85.5,
    "expected_score_range": {
        "minimum": 65,
        "realistic": 75,
        "optimistic": 85
    }
}
```

### Services

#### AIPredictionDashboardService

Main service class with methods:

- `get_dashboard()`: Generate complete dashboard data
- `_generate_topic_rankings()`: Create topic probability rankings
- `_generate_question_blueprint()`: Build predicted question paper
- `_generate_marks_distribution()`: Calculate marks distribution
- `_generate_focus_areas()`: Identify focus areas
- `_generate_study_time_allocation()`: Allocate study time
- `_generate_overall_prediction()`: Create summary statistics
- `generate_study_plan()`: Create personalized study timeline
- `simulate_what_if_scenario()`: Run scenario simulations
- `activate_crash_course_mode()`: Generate crash course plan

### Models

Reuses existing models:
- `TopicPrediction`: Stores AI predictions for topics
- `Topic`, `Chapter`, `Subject`: Academic hierarchy
- `QuestionBank`, `PreviousYearPaper`: Historical data

### Schemas

New schemas in `src/schemas/ai_prediction_dashboard.py`:
- `TopicProbabilityRanking`
- `PredictedQuestionBlueprint`
- `QuestionPaperSection`
- `MarksDistribution`
- `FocusAreaRecommendation`
- `StudyTimeAllocation`
- `StudyPlanRequest/Response`
- `WhatIfScenarioRequest/Response`
- `CrashCourseModeResponse`
- `AIPredictionDashboardResponse`

## Frontend Implementation

### Components

#### 1. TopicProbabilityRankingTable
- Material-UI Table with sortable columns
- Star ratings using Rating component
- Linear progress bars for probability visualization
- Color-coded chips for priority and confidence
- Tooltip for additional information

#### 2. PredictedBlueprintViewer
- Accordion components for expandable sections
- Grid layout for section details
- Progress bars for difficulty/bloom distribution
- List of topics with coverage percentages

#### 3. MarksDistributionChart
- Recharts PieChart with custom colors
- Legend with category names
- Tooltip showing exact marks
- Responsive container

#### 4. StudyTimeAllocationChart
- Recharts PieChart with inner radius (donut)
- Color-coded segments
- Percentage labels
- Responsive design

#### 5. FocusAreaRecommendations
- Card-based layout
- Priority color-coding
- Resource lists
- Expected impact statements
- Study hours indicators

#### 6. StudyPlanTimeline
- Date picker for exam date selection
- Accordion for weekly breakdown
- Checkbox list for daily tasks
- Progress tracking
- Task type color-coding
- Milestone date display

#### 7. WhatIfScenarioSimulator
- Sliders for parameter adjustment
- Multi-select for topic focusing
- Result comparison display
- Recommendation alerts
- Risk factor warnings

#### 8. CrashCourseMode
- Alert banner for mode activation
- Priority topic cards with ROI scores
- Daily schedule accordion
- Quick wins list
- Topics to skip section
- Score range display

### Main Dashboard Page

`AIPredictionDashboard.tsx`:
- Tab navigation between features
- Filter controls (Board, Grade, Subject)
- Overall statistics cards
- Responsive grid layout
- Loading states
- Error handling

### API Client

`frontend/src/api/aiPredictionDashboard.ts`:
- Axios-based API calls
- TypeScript interfaces
- Authentication token handling
- Error handling

### Routing

Added route in `App.tsx`:
```tsx
<Route path="/student/ai-prediction" element={<AIPredictionDashboard />} />
```

Added navigation item in `navigation.tsx`:
```tsx
{
  id: 'ai-prediction',
  title: 'AI Exam Prediction',
  path: '/student/ai-prediction',
  icon: <AIIcon />,
  roles: ['student'],
  badge: 'NEW',
}
```

## Data Flow

1. **Dashboard Load:**
   - Frontend fetches predictions from backend
   - Service queries TopicPrediction model
   - Calculates additional metrics (ROI, priority, etc.)
   - Generates visualizations and recommendations

2. **Study Plan Generation:**
   - User selects exam date and hours per day
   - Backend prioritizes topics based on predictions
   - Generates weekly schedule with daily tasks
   - Returns timeline with milestones

3. **What-If Simulation:**
   - User adjusts parameters via sliders
   - Backend recalculates expected outcomes
   - Shows comparison with current predictions
   - Provides recommendations

4. **Crash Course Mode:**
   - User enters days until exam
   - Backend selects high-ROI topics
   - Creates intensive 8-hour daily schedule
   - Provides quick wins and skip lists

## Algorithms Used

### 1. Probability Scoring
- Frequency score (25% weight)
- Cyclical pattern detection (20% weight)
- Trend analysis (15% weight)
- Marks weightage (20% weight)
- Recency score (20% weight)

### 2. ROI Calculation
```
ROI = Expected Marks / Study Time Required
```

### 3. Priority Determination
- Based on probability score
- Due status (not appeared in X years)
- Marks weightage
- Student weak areas

### 4. Study Time Estimation
```
Base Hours = (Total Marks / 10) × (Probability / 100)
Minimum = 0.5 hours
```

## UI/UX Features

- **Responsive Design**: Works on desktop, tablet, mobile
- **Color Coding**: Consistent color scheme for priorities
- **Interactive Elements**: Sliders, checkboxes, accordions
- **Progress Tracking**: Visual indicators for completion
- **Tooltips**: Additional information on hover
- **Loading States**: Spinners during data fetch
- **Error Handling**: User-friendly error messages
- **Empty States**: Helpful messages when no data

## Performance Optimizations

- **Caching**: Dashboard data cached in Redis for 24 hours
- **Lazy Loading**: Components loaded on tab switch
- **Pagination**: Large datasets paginated
- **Debouncing**: Input changes debounced
- **Memoization**: Expensive calculations cached

## Testing Recommendations

### Backend Tests
- Unit tests for calculation algorithms
- Integration tests for API endpoints
- Test edge cases (0 predictions, extreme values)
- Mock database queries

### Frontend Tests
- Component rendering tests
- User interaction tests
- API integration tests
- Responsive design tests

## Future Enhancements

1. **Machine Learning Improvements**
   - Use actual ML models (Random Forest, Neural Networks)
   - Incorporate student performance history
   - Adaptive learning algorithms

2. **Additional Features**
   - Spaced repetition recommendations
   - Collaborative study groups
   - Video resource integration
   - Mobile app version

3. **Analytics**
   - Accuracy tracking of predictions
   - Student engagement metrics
   - A/B testing for recommendations

4. **Personalization**
   - Learning style adaptation
   - Custom study schedules
   - Preferred resource types

## Dependencies

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- Redis (for caching)

### Frontend
- React 18
- Material-UI v5
- Recharts (for charts)
- Axios (for API calls)
- React Router v6
- date-fns (for date handling)

## Configuration

No additional configuration required. Uses existing:
- Database connection
- Redis connection
- Authentication system
- RBAC permissions

## Files Created/Modified

### Backend
- `src/api/v1/ai_prediction_dashboard.py` (NEW)
- `src/schemas/ai_prediction_dashboard.py` (NEW)
- `src/services/ai_prediction_dashboard_service.py` (NEW)
- `src/api/v1/__init__.py` (MODIFIED)

### Frontend
- `frontend/src/pages/AIPredictionDashboard.tsx` (NEW)
- `frontend/src/api/aiPredictionDashboard.ts` (NEW)
- `frontend/src/components/aiPrediction/TopicProbabilityRankingTable.tsx` (NEW)
- `frontend/src/components/aiPrediction/PredictedBlueprintViewer.tsx` (NEW)
- `frontend/src/components/aiPrediction/MarksDistributionChart.tsx` (NEW)
- `frontend/src/components/aiPrediction/StudyTimeAllocationChart.tsx` (NEW)
- `frontend/src/components/aiPrediction/FocusAreaRecommendations.tsx` (NEW)
- `frontend/src/components/aiPrediction/StudyPlanTimeline.tsx` (NEW)
- `frontend/src/components/aiPrediction/WhatIfScenarioSimulator.tsx` (NEW)
- `frontend/src/components/aiPrediction/CrashCourseMode.tsx` (NEW)
- `frontend/src/components/aiPrediction/index.ts` (NEW)
- `frontend/src/App.tsx` (MODIFIED)
- `frontend/src/config/navigation.tsx` (MODIFIED)

## Deployment Notes

1. Run database migrations (if any new columns added)
2. Clear Redis cache after deployment
3. Test with sample prediction data
4. Monitor API response times
5. Check frontend bundle size

## Support and Maintenance

- Monitor prediction accuracy
- Update algorithms based on feedback
- Add new board/exam patterns
- Improve UI based on user feedback
- Regular performance optimization

## License

Part of the Education Management System project.
