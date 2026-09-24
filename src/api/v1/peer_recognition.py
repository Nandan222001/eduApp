from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.auth import get_current_user, require_roles
from src.models.user import User
from src.models.student import Student
from src.services.peer_recognition_service import PeerRecognitionService
from src.schemas.peer_recognition import (
    PeerRecognitionCreate, PeerRecognitionResponse,
    PeerRecognitionWithStudents, RecognitionBadgeResponse,
    DailyRecognitionLimitResponse, AppreciationWallResponse,
    TrendingRecognitionResponse, RecognitionAnalyticsResponse,
    PositivityIndexResponse, MostRecognizedStudentsResponse,
    RecognitionStatsResponse
)
from src.models.peer_recognition import RecognitionType

router = APIRouter()


def _get_current_student(db: Session, current_user: User) -> Student:
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student profile not found"
        )
    return student


@router.post("/recognitions", response_model=PeerRecognitionResponse, status_code=status.HTTP_201_CREATED)
def send_recognition(
    recognition_data: PeerRecognitionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a peer recognition.

    Previously this whole router had no authentication dependency on any
    endpoint at all, and every endpoint accepted arbitrary
    `institution_id`/`student_id`/`from_student_id` query parameters
    straight from the caller -- any unauthenticated client could send
    recognitions as any student, like recognitions as any student, and read
    any institution's recognition/analytics data. Fixed by requiring
    `Depends(get_current_user)` on every endpoint, always deriving
    `institution_id` from `current_user.institution_id`, and deriving the
    acting student from the caller's own linked `Student` profile instead
    of trusting a client-supplied id.
    """
    from_student = _get_current_student(db, current_user)

    recognition = PeerRecognitionService.create_recognition(
        db=db,
        institution_id=current_user.institution_id,
        from_student_id=from_student.id,
        recognition_data=recognition_data
    )

    # `create_recognition` commits several more times after its own initial
    # `db.refresh(recognition)` (incrementing the daily limit, awarding
    # points, awarding badges, creating a notification), and each of those
    # commits expires every attribute on every object still attached to the
    # session -- including `recognition` -- under this session's default
    # `expire_on_commit=True`. Building the response from `recognition.__dict__`
    # without refreshing first previously returned an all-but-empty dict
    # (only `_sa_instance_state`), 100% failing `PeerRecognitionResponse`
    # validation on every successful send (same shape as this session's
    # earlier `content_marketplace.py` `__dict__`-after-commit fix).
    db.refresh(recognition)

    response_dict = {
        **recognition.__dict__,
        'from_student_name': f"{recognition.from_student.first_name} {recognition.from_student.last_name}",
        'to_student_name': f"{recognition.to_student.first_name} {recognition.to_student.last_name}",
        'is_liked_by_current_user': False
    }

    return PeerRecognitionResponse(**response_dict)


@router.get("/recognitions/received", response_model=List[PeerRecognitionResponse])
def get_received_recognitions(
    student_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recognitions = PeerRecognitionService.get_received_recognitions(
        db=db,
        institution_id=current_user.institution_id,
        student_id=student_id,
        skip=skip,
        limit=limit
    )
    
    responses = []
    for recognition in recognitions:
        response_dict = {
            **recognition.__dict__,
            'from_student_name': f"{recognition.from_student.first_name} {recognition.from_student.last_name}",
            'to_student_name': f"{recognition.to_student.first_name} {recognition.to_student.last_name}",
            'is_liked_by_current_user': False
        }
        responses.append(PeerRecognitionResponse(**response_dict))
    
    return responses


@router.get("/appreciation-wall", response_model=AppreciationWallResponse)
def get_appreciation_wall(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()

    return PeerRecognitionService.get_appreciation_wall(
        db=db,
        institution_id=current_user.institution_id,
        page=page,
        page_size=page_size,
        current_student_id=current_student.id if current_student else None
    )


@router.post("/recognitions/{recognition_id}/like")
def toggle_like(
    recognition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like/unlike a recognition as the caller's own student profile.

    Previously accepted an arbitrary `student_id` query parameter with no
    verification -- any caller could like or unlike a recognition on behalf
    of any other student. Fixed to derive the acting student from the
    caller's own linked `Student` profile.
    """
    student = _get_current_student(db, current_user)
    return PeerRecognitionService.toggle_like(
        db=db,
        recognition_id=recognition_id,
        student_id=student.id,
        institution_id=current_user.institution_id
    )


@router.get("/trending", response_model=List[TrendingRecognitionResponse])
def get_trending_recognitions(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return PeerRecognitionService.get_trending_recognitions(
        db=db,
        institution_id=current_user.institution_id,
        limit=limit,
        days=days
    )


@router.get("/analytics/positivity-index", response_model=PositivityIndexResponse)
def get_positivity_index(
    period: str = Query("week", regex="^(day|week|month)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return PeerRecognitionService.calculate_positivity_index(
        db=db,
        institution_id=current_user.institution_id,
        period=period
    )


@router.get("/analytics/most-recognized", response_model=List[MostRecognizedStudentsResponse])
def get_most_recognized_students(
    limit: int = Query(10, ge=1, le=50),
    days: Optional[int] = Query(None, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return PeerRecognitionService.get_most_recognized_students(
        db=db,
        institution_id=current_user.institution_id,
        limit=limit,
        days=days
    )


@router.get("/students/{student_id}/stats", response_model=RecognitionStatsResponse)
def get_student_recognition_stats(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return PeerRecognitionService.get_recognition_stats(
        db=db,
        institution_id=current_user.institution_id,
        student_id=student_id
    )


@router.get("/students/{student_id}/badges", response_model=List[RecognitionBadgeResponse])
def get_student_badges(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from src.models.peer_recognition import RecognitionBadge

    badges = db.query(RecognitionBadge).filter(
        RecognitionBadge.student_id == student_id,
        RecognitionBadge.institution_id == current_user.institution_id
    ).all()

    return [RecognitionBadgeResponse.model_validate(badge) for badge in badges]


@router.get("/students/{student_id}/daily-limit", response_model=DailyRecognitionLimitResponse)
def get_daily_limit_status(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    can_send, remaining = PeerRecognitionService.check_daily_limit(
        db=db,
        institution_id=current_user.institution_id,
        student_id=student_id
    )

    from src.models.peer_recognition import DailyRecognitionLimit
    today = date.today()

    limit_record = db.query(DailyRecognitionLimit).filter(
        DailyRecognitionLimit.institution_id == current_user.institution_id,
        DailyRecognitionLimit.student_id == student_id,
        DailyRecognitionLimit.limit_date == today
    ).first()

    if not limit_record:
        return DailyRecognitionLimitResponse(
            id=0,
            institution_id=current_user.institution_id,
            student_id=student_id,
            limit_date=today,
            recognitions_sent=0,
            max_daily_limit=10,
            remaining=10
        )

    response_dict = {
        **limit_record.__dict__,
        'remaining': remaining
    }

    return DailyRecognitionLimitResponse(**response_dict)


@router.post("/analytics/update")
def update_analytics(
    analytics_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recompute the institution's recognition analytics (teacher/admin only)."""
    require_roles(current_user, ["teacher", "admin", "super_admin"])

    if not analytics_date:
        analytics_date = date.today()

    analytics = PeerRecognitionService.update_analytics(
        db=db,
        institution_id=current_user.institution_id,
        analytics_date=analytics_date
    )

    return {
        "message": "Analytics updated successfully",
        "analytics": RecognitionAnalyticsResponse.model_validate(analytics)
    }


@router.get("/analytics/daily", response_model=RecognitionAnalyticsResponse)
def get_daily_analytics(
    analytics_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from src.models.peer_recognition import RecognitionAnalytics

    if not analytics_date:
        analytics_date = date.today()

    analytics = db.query(RecognitionAnalytics).filter(
        RecognitionAnalytics.institution_id == current_user.institution_id,
        RecognitionAnalytics.analytics_date == analytics_date
    ).first()

    if not analytics:
        analytics = PeerRecognitionService.update_analytics(
            db=db,
            institution_id=current_user.institution_id,
            analytics_date=analytics_date
        )

    response_dict = {**analytics.__dict__}

    if analytics.most_recognized_student_id:
        student = db.query(Student).filter(Student.id == analytics.most_recognized_student_id).first()
        if student:
            response_dict['most_recognized_student_name'] = f"{student.first_name} {student.last_name}"

    return RecognitionAnalyticsResponse(**response_dict)


@router.get("/recognition-types", response_model=List[dict])
def get_recognition_types(
    current_user: User = Depends(get_current_user),
):
    return [
        {
            "value": rec_type.value,
            "label": rec_type.value.replace('_', ' ').title(),
            "points": PeerRecognitionService.RECOGNITION_POINTS.get(rec_type, 10)
        }
        for rec_type in RecognitionType
    ]
