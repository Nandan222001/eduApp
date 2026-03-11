from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from src.models.previous_year_papers import Board


class TopicProbabilityRanking(BaseModel):
    """Topic probability ranking with star ratings and percentage bars"""
    topic_id: Optional[int] = None
    topic_name: str
    chapter_name: Optional[str] = None
    probability_score: float = Field(..., ge=0, le=100)
    star_rating: int = Field(..., ge=1, le=5)
    confidence_level: str
    frequency_count: int
    last_appeared_year: Optional[int] = None
    years_since_last_appearance: int
    is_due: bool
    priority_tag: str
    expected_marks: float
    study_hours_recommended: float


class QuestionPaperSection(BaseModel):
    """Section in predicted question paper blueprint"""
    section_name: str
    total_marks: int
    question_types: List[str]
    topics_included: List[str]
    difficulty_distribution: Dict[str, int]
    bloom_level_distribution: Dict[str, int]


class PredictedQuestionBlueprint(BaseModel):
    """Predicted question paper blueprint with expandable sections"""
    total_marks: int
    duration_minutes: int
    sections: List[QuestionPaperSection]
    topic_coverage: Dict[str, float]
    difficulty_breakdown: Dict[str, int]


class MarksDistribution(BaseModel):
    """Expected marks distribution for pie chart"""
    category: str
    marks: float
    percentage: float
    color: str


class FocusAreaRecommendation(BaseModel):
    """Focus area recommendation with priority tags"""
    topic_id: Optional[int] = None
    topic_name: str
    chapter_name: Optional[str] = None
    priority: str  # "critical", "high", "medium", "low"
    priority_score: float
    reason: str
    expected_impact: str
    study_hours_needed: float
    resources: List[str]
    difficulty_level: str


class StudyTimeAllocation(BaseModel):
    """Study time allocation for donut chart"""
    category: str
    hours: float
    percentage: float
    color: str
    description: str


class DailyTask(BaseModel):
    """Daily task in personalized study plan"""
    task_id: str
    date: date
    topic_name: str
    task_type: str  # "study", "practice", "revision", "test"
    duration_hours: float
    priority: str
    description: str
    resources: List[str]
    is_completed: bool = False


class StudyPlanWeek(BaseModel):
    """Week in study plan timeline"""
    week_number: int
    start_date: date
    end_date: date
    focus_topics: List[str]
    total_hours: float
    tasks: List[DailyTask]


class StudyPlanRequest(BaseModel):
    """Request to generate personalized study plan"""
    board: Board
    grade_id: int
    subject_id: int
    exam_date: date
    available_hours_per_day: float = Field(..., ge=0.5, le=12)
    weak_areas: Optional[List[int]] = Field(None, description="List of topic IDs student struggles with")


class StudyPlanResponse(BaseModel):
    """Personalized study plan timeline with daily tasks"""
    exam_date: date
    days_until_exam: int
    total_study_hours: float
    weeks: List[StudyPlanWeek]
    completion_percentage: float
    milestone_dates: Dict[str, date]


class WhatIfScenarioRequest(BaseModel):
    """What-if scenario simulation request"""
    board: Board
    grade_id: int
    subject_id: int
    study_hours_adjustment: float = Field(0, description="Additional study hours per day (-5 to +10)")
    focus_topic_ids: Optional[List[int]] = Field(None, description="Topics to focus on")
    practice_test_count: int = Field(0, ge=0, le=20, description="Number of practice tests")


class PredictionChange(BaseModel):
    """Change in prediction based on what-if scenario"""
    metric: str
    current_value: float
    projected_value: float
    change_percentage: float
    impact_level: str


class WhatIfScenarioResponse(BaseModel):
    """What-if scenario simulation results"""
    current_predicted_score: float
    projected_score: float
    score_improvement: float
    confidence_level: str
    prediction_changes: List[PredictionChange]
    recommended_adjustments: List[str]
    risk_factors: List[str]


class CrashCourseTopicPriority(BaseModel):
    """Topic priority for crash course mode"""
    topic_id: Optional[int] = None
    topic_name: str
    priority_level: int  # 1-5, with 1 being highest
    time_to_study_hours: float
    expected_marks: float
    roi_score: float  # Return on investment score
    quick_revision_points: List[str]
    must_know_concepts: List[str]
    practice_questions: List[str]


class CrashCourseDay(BaseModel):
    """Daily plan in crash course mode"""
    day_number: int
    date: date
    morning_session: List[str]
    afternoon_session: List[str]
    evening_session: List[str]
    revision_topics: List[str]
    practice_tests: List[str]
    total_hours: float


class CrashCourseModeResponse(BaseModel):
    """Last-minute crash course mode activation response"""
    days_until_exam: int
    mode_activated: bool
    priority_topics: List[CrashCourseTopicPriority]
    daily_schedule: List[CrashCourseDay]
    quick_wins: List[str]
    topics_to_skip: List[str]
    estimated_coverage: float
    expected_score_range: Dict[str, float]


class AIPredictionDashboardResponse(BaseModel):
    """Complete AI prediction dashboard response"""
    board: Board
    grade_id: int
    subject_id: int
    subject_name: str
    generated_at: datetime
    
    # Topic probability rankings
    topic_rankings: List[TopicProbabilityRanking]
    
    # Predicted question paper blueprint
    predicted_blueprint: PredictedQuestionBlueprint
    
    # Expected marks distribution
    marks_distribution: List[MarksDistribution]
    
    # Focus area recommendations
    focus_areas: List[FocusAreaRecommendation]
    
    # Study time allocation
    study_time_allocation: List[StudyTimeAllocation]
    
    # Overall predictions
    overall_prediction: Dict[str, Any]
