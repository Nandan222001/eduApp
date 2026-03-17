from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal


class HomeworkScanCreate(BaseModel):
    student_id: int
    subject_id: Optional[int] = None
    scan_title: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class HomeworkScanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    subject_id: Optional[int] = None
    scan_title: Optional[str] = None
    image_url: str
    s3_key: str
    extracted_text: Optional[str] = None
    detected_problems: Optional[List[Dict[str, Any]]] = None
    solutions: Optional[List[Dict[str, Any]]] = None
    ai_feedback: Optional[str] = None
    confidence_score: Optional[Decimal] = None
    processing_status: str
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class HomeworkScanDetailResponse(HomeworkScanResponse):
    subject_name: Optional[str] = None
    student_name: Optional[str] = None


class DetectedProblem(BaseModel):
    problem_text: str
    problem_type: str
    difficulty: Optional[str] = None
    solution: Optional[str] = None
    steps: Optional[List[str]] = None
    confidence: Optional[float] = None


class HomeworkScanAnalysis(BaseModel):
    scan_id: int
    problems_count: int
    problems: List[DetectedProblem]
    overall_difficulty: str
    estimated_time_minutes: int
    recommendations: List[str]
    ai_feedback: str
