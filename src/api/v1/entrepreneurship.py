from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal

from src.database import get_db
from src.schemas.entrepreneurship import (
    StudentVentureCreate,
    StudentVentureUpdate,
    StudentVentureResponse,
    PitchCompetitionCreate,
    PitchCompetitionUpdate,
    PitchCompetitionResponse,
    PitchSubmissionCreate,
    PitchSubmissionUpdate,
    PitchSubmissionResponse,
    EntrepreneurshipMentorCreate,
    EntrepreneurshipMentorUpdate,
    EntrepreneurshipMentorResponse,
    MentorshipRelationshipCreate,
    MentorshipRelationshipUpdate,
    MentorshipRelationshipResponse,
    VentureFundingRequestCreate,
    VentureFundingRequestUpdate,
    VentureFundingRequestResponse,
    MentorMatchRequest,
    SubmitPitchRequest,
    JudgeScoreRequest,
    VentureShowcaseFilter,
)
from src.models.entrepreneurship import (
    StudentVenture,
    PitchCompetition,
    PitchSubmission,
    EntrepreneurshipMentor,
    MentorshipRelationship,
    VentureFundingRequest,
    VentureStatus,
    CompetitionStatus,
    MentorshipStatus,
    FundingStatus,
)
from src.dependencies.auth import get_current_user
from src.models.user import User

router = APIRouter()


def _check_institution_access(current_user: User, institution_id: Optional[int]) -> None:
    """403s unless the caller is a superuser, belongs to this institution,
    or the institution is unset (some records here, e.g. platform-wide
    mentors, are intentionally institution-less).

    None of the create/update/delete endpoints below checked this before:
    a caller could create a venture/competition/mentor/mentorship/funding
    request tagged with *any* institution_id (not just their own), and
    could update or delete any other institution's existing records by id
    -- a cross-tenant write gap (bug class 12), distinct from this
    router's read-side endpoints (list/get/showcase), which are
    deliberately cross-institution by design (a public venture/competition/
    mentor discovery surface, per the optional institution_id filters and
    the dedicated /showcase endpoint).
    """
    if institution_id is None:
        return
    if not current_user.is_superuser and current_user.institution_id != institution_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


@router.post("/ventures", response_model=StudentVentureResponse, status_code=status.HTTP_201_CREATED)
async def create_venture(
    venture_data: StudentVentureCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_institution_access(current_user, venture_data.institution_id)

    venture = StudentVenture(
        institution_id=venture_data.institution_id,
        venture_name=venture_data.venture_name,
        tagline=venture_data.tagline,
        founder_students=venture_data.founder_students,
        primary_founder_id=venture_data.primary_founder_id,
        business_idea=venture_data.business_idea,
        problem_statement=venture_data.problem_statement,
        solution=venture_data.solution,
        target_market=venture_data.target_market,
        revenue_model=venture_data.revenue_model,
        pitch_deck_url=venture_data.pitch_deck_url,
        business_plan_url=venture_data.business_plan_url,
        logo_url=venture_data.logo_url,
        website_url=venture_data.website_url,
        funding_requested=venture_data.funding_requested,
        currency=venture_data.currency,
        social_impact=venture_data.social_impact,
        metrics=venture_data.metrics,
        milestones=venture_data.milestones,
        team_roles=venture_data.team_roles,
        venture_status=VentureStatus.IDEA,
    )
    
    db.add(venture)
    db.commit()
    db.refresh(venture)
    
    return venture


@router.get("/ventures", response_model=List[StudentVentureResponse])
async def list_ventures(
    institution_id: Optional[int] = None,
    status: Optional[str] = None,
    has_mentor: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(StudentVenture).filter(StudentVenture.is_active == True)
    
    if institution_id:
        query = query.filter(StudentVenture.institution_id == institution_id)
    
    if status:
        query = query.filter(StudentVenture.venture_status == status)
    
    if has_mentor is not None:
        if has_mentor:
            query = query.filter(StudentVenture.mentor_id.isnot(None))
        else:
            query = query.filter(StudentVenture.mentor_id.is_(None))
    
    if is_featured is not None:
        query = query.filter(StudentVenture.is_featured == is_featured)
    
    ventures = query.order_by(desc(StudentVenture.created_at)).offset(offset).limit(limit).all()
    
    return ventures


@router.get("/ventures/{venture_id}", response_model=StudentVentureResponse)
async def get_venture(
    venture_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    venture = db.query(StudentVenture).filter(StudentVenture.id == venture_id).first()
    
    if not venture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venture not found"
        )
    
    return venture


@router.put("/ventures/{venture_id}", response_model=StudentVentureResponse)
async def update_venture(
    venture_id: int,
    venture_data: StudentVentureUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    venture = db.query(StudentVenture).filter(StudentVenture.id == venture_id).first()
    
    if not venture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venture not found"
        )

    _check_institution_access(current_user, venture.institution_id)

    update_data = venture_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(venture, key, value)
    
    db.commit()
    db.refresh(venture)
    
    return venture


@router.delete("/ventures/{venture_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_venture(
    venture_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    venture = db.query(StudentVenture).filter(StudentVenture.id == venture_id).first()
    
    if not venture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venture not found"
        )

    _check_institution_access(current_user, venture.institution_id)

    venture.is_active = False
    db.commit()
    
    return None


@router.post("/competitions", response_model=PitchCompetitionResponse, status_code=status.HTTP_201_CREATED)
async def create_competition(
    competition_data: PitchCompetitionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_institution_access(current_user, competition_data.institution_id)

    competition = PitchCompetition(
        institution_id=competition_data.institution_id,
        competition_name=competition_data.competition_name,
        description=competition_data.description,
        theme=competition_data.theme,
        judges=competition_data.judges,
        judge_details=competition_data.judge_details,
        prize_pool=competition_data.prize_pool,
        currency=competition_data.currency,
        prizes=competition_data.prizes,
        submission_deadline=competition_data.submission_deadline,
        competition_date=competition_data.competition_date,
        eligibility_criteria=competition_data.eligibility_criteria,
        evaluation_criteria=competition_data.evaluation_criteria,
        max_participants=competition_data.max_participants,
        status=CompetitionStatus.UPCOMING,
    )
    
    db.add(competition)
    db.commit()
    db.refresh(competition)
    
    return competition


@router.get("/competitions", response_model=List[PitchCompetitionResponse])
async def list_competitions(
    institution_id: Optional[int] = None,
    status: Optional[str] = None,
    is_public: Optional[bool] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(PitchCompetition).filter(PitchCompetition.is_active == True)
    
    if institution_id:
        query = query.filter(PitchCompetition.institution_id == institution_id)
    
    if status:
        query = query.filter(PitchCompetition.status == status)
    
    if is_public is not None:
        query = query.filter(PitchCompetition.is_public == is_public)
    
    competitions = query.order_by(desc(PitchCompetition.submission_deadline)).offset(offset).limit(limit).all()
    
    return competitions


@router.get("/competitions/{competition_id}", response_model=PitchCompetitionResponse)
async def get_competition(
    competition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    competition = db.query(PitchCompetition).filter(PitchCompetition.id == competition_id).first()
    
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )
    
    return competition


@router.put("/competitions/{competition_id}", response_model=PitchCompetitionResponse)
async def update_competition(
    competition_id: int,
    competition_data: PitchCompetitionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    competition = db.query(PitchCompetition).filter(PitchCompetition.id == competition_id).first()
    
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )

    _check_institution_access(current_user, competition.institution_id)

    update_data = competition_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(competition, key, value)
    
    db.commit()
    db.refresh(competition)
    
    return competition


@router.post("/competitions/{competition_id}/submit", response_model=PitchSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_pitch(
    competition_id: int,
    submission_data: SubmitPitchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    competition = db.query(PitchCompetition).filter(PitchCompetition.id == competition_id).first()
    
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )
    
    venture = db.query(StudentVenture).filter(StudentVenture.id == submission_data.venture_id).first()

    if not venture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venture not found"
        )

    # Previously unchecked: submission_data.venture_id was used directly in
    # the PitchSubmission(...) constructor below with no existence check at
    # all (an unknown venture_id raised an unhandled FK IntegrityError ->
    # 500 instead of a clean 404) and no institution check (any caller
    # could submit *any* institution's venture into a competition, cross-
    # tenant).
    _check_institution_access(current_user, venture.institution_id)

    if competition.status != CompetitionStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Competition is not open for submissions"
        )

    if datetime.utcnow() > competition.submission_deadline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission deadline has passed"
        )
    
    existing_submission = db.query(PitchSubmission).filter(
        and_(
            PitchSubmission.competition_id == competition_id,
            PitchSubmission.venture_id == submission_data.venture_id
        )
    ).first()
    
    if existing_submission:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Venture has already submitted to this competition"
        )
    
    if competition.max_participants and competition.current_participants >= competition.max_participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Competition has reached maximum participants"
        )
    
    submission = PitchSubmission(
        institution_id=current_user.institution_id,
        competition_id=competition_id,
        venture_id=submission_data.venture_id,
        pitch_video_url=submission_data.pitch_video_url,
        presentation_url=submission_data.presentation_url,
        supporting_documents=submission_data.supporting_documents,
    )
    
    competition.current_participants += 1
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return submission


@router.get("/competitions/{competition_id}/submissions", response_model=List[PitchSubmissionResponse])
async def list_competition_submissions(
    competition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submissions = db.query(PitchSubmission).filter(
        PitchSubmission.competition_id == competition_id
    ).order_by(desc(PitchSubmission.total_score)).all()
    
    return submissions


@router.post("/submissions/{submission_id}/score", response_model=PitchSubmissionResponse)
async def score_submission(
    submission_id: int,
    score_data: JudgeScoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submission = db.query(PitchSubmission).filter(PitchSubmission.id == submission_id).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    competition = db.query(PitchCompetition).filter(PitchCompetition.id == submission.competition_id).first()
    
    if not competition.judges or score_data.judge_id not in competition.judges:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a judge for this competition"
        )
    
    # `judge_scores` is a plain JSON column (not wrapped in
    # sqlalchemy.ext.mutable.MutableDict), so SQLAlchemy's change-tracking
    # only notices a *reassignment* of the attribute, not an in-place
    # mutation of the dict object it already holds. Mutating in place (the
    # previous `submission.judge_scores[key] = ...`) worked by accident the
    # very first time a submission was scored (that call also did
    # `submission.judge_scores = {}` right above it, which IS a tracked
    # reassignment), but every subsequent judge's score on the same
    # submission was silently dropped: db.commit() never included the
    # column in its UPDATE, and the following db.refresh() then overwrote
    # the in-memory dict with the (still-missing-that-score) DB value,
    # permanently losing it. Building a new dict and reassigning it ensures
    # every scoring call is tracked and persisted correctly.
    updated_scores = dict(submission.judge_scores or {})
    updated_scores[str(score_data.judge_id)] = {
        "scores": {k: float(v) for k, v in score_data.scores.items()},
        "feedback": score_data.feedback,
        "scored_at": datetime.utcnow().isoformat()
    }
    submission.judge_scores = updated_scores

    total = Decimal(0)
    count = 0
    for judge_score in submission.judge_scores.values():
        for score_value in judge_score["scores"].values():
            total += Decimal(str(score_value))
            count += 1
    
    if count > 0:
        submission.total_score = total / count
    
    db.commit()
    db.refresh(submission)
    
    return submission


@router.post("/mentors", response_model=EntrepreneurshipMentorResponse, status_code=status.HTTP_201_CREATED)
async def create_mentor(
    mentor_data: EntrepreneurshipMentorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_institution_access(current_user, mentor_data.institution_id)

    mentor = EntrepreneurshipMentor(
        institution_id=mentor_data.institution_id,
        user_id=mentor_data.user_id,
        first_name=mentor_data.first_name,
        last_name=mentor_data.last_name,
        email=mentor_data.email,
        phone=mentor_data.phone,
        expertise_areas=mentor_data.expertise_areas,
        industry_experience=mentor_data.industry_experience,
        current_position=mentor_data.current_position,
        company=mentor_data.company,
        bio=mentor_data.bio,
        linkedin_url=mentor_data.linkedin_url,
        photo_url=mentor_data.photo_url,
        years_of_experience=mentor_data.years_of_experience,
        successful_ventures=mentor_data.successful_ventures,
        mentoring_capacity=mentor_data.mentoring_capacity,
        preferred_communication=mentor_data.preferred_communication,
        availability_schedule=mentor_data.availability_schedule,
    )
    
    db.add(mentor)
    db.commit()
    db.refresh(mentor)
    
    return mentor


@router.get("/mentors", response_model=List[EntrepreneurshipMentorResponse])
async def list_mentors(
    institution_id: Optional[int] = None,
    available_only: bool = False,
    expertise: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(EntrepreneurshipMentor).filter(EntrepreneurshipMentor.is_active == True)
    
    if institution_id:
        query = query.filter(
            or_(
                EntrepreneurshipMentor.institution_id == institution_id,
                EntrepreneurshipMentor.institution_id.is_(None)
            )
        )
    
    if available_only:
        query = query.filter(
            and_(
                EntrepreneurshipMentor.available_for_mentoring == True,
                EntrepreneurshipMentor.current_mentees < EntrepreneurshipMentor.mentoring_capacity
            )
        )
    
    mentors = query.order_by(desc(EntrepreneurshipMentor.average_rating)).offset(offset).limit(limit).all()
    
    return mentors


@router.get("/mentors/{mentor_id}", response_model=EntrepreneurshipMentorResponse)
async def get_mentor(
    mentor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mentor = db.query(EntrepreneurshipMentor).filter(EntrepreneurshipMentor.id == mentor_id).first()
    
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found"
        )
    
    return mentor


@router.put("/mentors/{mentor_id}", response_model=EntrepreneurshipMentorResponse)
async def update_mentor(
    mentor_id: int,
    mentor_data: EntrepreneurshipMentorUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mentor = db.query(EntrepreneurshipMentor).filter(EntrepreneurshipMentor.id == mentor_id).first()

    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found"
        )

    _check_institution_access(current_user, mentor.institution_id)

    update_data = mentor_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mentor, key, value)
    
    db.commit()
    db.refresh(mentor)
    
    return mentor


@router.post("/mentorships/match", response_model=List[EntrepreneurshipMentorResponse])
async def match_mentor(
    match_request: MentorMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    venture = db.query(StudentVenture).filter(StudentVenture.id == match_request.venture_id).first()
    
    if not venture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venture not found"
        )
    
    query = db.query(EntrepreneurshipMentor).filter(
        and_(
            EntrepreneurshipMentor.is_active == True,
            EntrepreneurshipMentor.available_for_mentoring == True,
            EntrepreneurshipMentor.current_mentees < EntrepreneurshipMentor.mentoring_capacity
        )
    )
    
    if venture.institution_id:
        query = query.filter(
            or_(
                EntrepreneurshipMentor.institution_id == venture.institution_id,
                EntrepreneurshipMentor.institution_id.is_(None)
            )
        )
    
    mentors = query.order_by(desc(EntrepreneurshipMentor.average_rating)).limit(10).all()
    
    return mentors


@router.post("/mentorships", response_model=MentorshipRelationshipResponse, status_code=status.HTTP_201_CREATED)
async def create_mentorship(
    mentorship_data: MentorshipRelationshipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_institution_access(current_user, mentorship_data.institution_id)

    mentor = db.query(EntrepreneurshipMentor).filter(EntrepreneurshipMentor.id == mentorship_data.mentor_id).first()

    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found"
        )

    # `venture_id` was never validated at all before being handed straight
    # to the MentorshipRelationship(...) constructor below -- an unknown
    # venture_id raised an unhandled FK IntegrityError (500) instead of a
    # clean 404.
    venture = db.query(StudentVenture).filter(StudentVenture.id == mentorship_data.venture_id).first()

    if not venture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venture not found"
        )

    if not mentor.available_for_mentoring or mentor.current_mentees >= mentor.mentoring_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mentor is not available for new mentorships"
        )

    mentorship = MentorshipRelationship(
        institution_id=mentorship_data.institution_id,
        mentor_id=mentorship_data.mentor_id,
        venture_id=mentorship_data.venture_id,
        goals=mentorship_data.goals,
        meeting_frequency=mentorship_data.meeting_frequency,
        status=MentorshipStatus.PENDING,
    )
    
    db.add(mentorship)
    db.commit()
    db.refresh(mentorship)
    
    return mentorship


@router.get("/mentorships", response_model=List[MentorshipRelationshipResponse])
async def list_mentorships(
    mentor_id: Optional[int] = None,
    venture_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(MentorshipRelationship).filter(MentorshipRelationship.is_active == True)
    
    if mentor_id:
        query = query.filter(MentorshipRelationship.mentor_id == mentor_id)
    
    if venture_id:
        query = query.filter(MentorshipRelationship.venture_id == venture_id)
    
    if status:
        query = query.filter(MentorshipRelationship.status == status)
    
    mentorships = query.order_by(desc(MentorshipRelationship.created_at)).offset(offset).limit(limit).all()
    
    return mentorships


@router.put("/mentorships/{mentorship_id}", response_model=MentorshipRelationshipResponse)
async def update_mentorship(
    mentorship_id: int,
    mentorship_data: MentorshipRelationshipUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mentorship = db.query(MentorshipRelationship).filter(MentorshipRelationship.id == mentorship_id).first()

    if not mentorship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentorship not found"
        )

    _check_institution_access(current_user, mentorship.institution_id)

    old_status = mentorship.status
    
    update_data = mentorship_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mentorship, key, value)
    
    if 'status' in update_data and old_status != mentorship.status:
        mentor = db.query(EntrepreneurshipMentor).filter(EntrepreneurshipMentor.id == mentorship.mentor_id).first()
        
        if mentorship.status == MentorshipStatus.ACTIVE and old_status != MentorshipStatus.ACTIVE:
            mentor.current_mentees += 1
            if not mentorship.start_date:
                mentorship.start_date = date.today()
        elif old_status == MentorshipStatus.ACTIVE and mentorship.status in [MentorshipStatus.COMPLETED, MentorshipStatus.CANCELLED]:
            mentor.current_mentees = max(0, mentor.current_mentees - 1)
            if mentorship.status == MentorshipStatus.COMPLETED:
                mentor.total_mentorships += 1
    
    db.commit()
    db.refresh(mentorship)
    
    return mentorship


@router.post("/funding-requests", response_model=VentureFundingRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_funding_request(
    funding_data: VentureFundingRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_institution_access(current_user, funding_data.institution_id)

    venture = db.query(StudentVenture).filter(StudentVenture.id == funding_data.venture_id).first()

    if not venture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venture not found"
        )

    funding_request = VentureFundingRequest(
        institution_id=funding_data.institution_id,
        venture_id=funding_data.venture_id,
        amount_requested=funding_data.amount_requested,
        currency=funding_data.currency,
        funding_purpose=funding_data.funding_purpose,
        use_of_funds_breakdown=funding_data.use_of_funds_breakdown,
        justification=funding_data.justification,
        expected_outcomes=funding_data.expected_outcomes,
        supporting_documents=funding_data.supporting_documents,
        financial_projections=funding_data.financial_projections,
        status=FundingStatus.REQUESTED,
    )
    
    db.add(funding_request)
    db.commit()
    db.refresh(funding_request)
    
    return funding_request


@router.get("/funding-requests", response_model=List[VentureFundingRequestResponse])
async def list_funding_requests(
    venture_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(VentureFundingRequest)
    
    if venture_id:
        query = query.filter(VentureFundingRequest.venture_id == venture_id)
    
    if status:
        query = query.filter(VentureFundingRequest.status == status)
    
    funding_requests = query.order_by(desc(VentureFundingRequest.created_at)).offset(offset).limit(limit).all()
    
    return funding_requests


@router.get("/funding-requests/{request_id}", response_model=VentureFundingRequestResponse)
async def get_funding_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    funding_request = db.query(VentureFundingRequest).filter(VentureFundingRequest.id == request_id).first()
    
    if not funding_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Funding request not found"
        )
    
    return funding_request


@router.put("/funding-requests/{request_id}", response_model=VentureFundingRequestResponse)
async def update_funding_request(
    request_id: int,
    funding_data: VentureFundingRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    funding_request = db.query(VentureFundingRequest).filter(VentureFundingRequest.id == request_id).first()
    
    if not funding_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Funding request not found"
        )

    _check_institution_access(current_user, funding_request.institution_id)

    old_status = funding_request.status
    
    update_data = funding_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(funding_request, key, value)
    
    if 'status' in update_data:
        funding_request.reviewed_by = current_user.id
        funding_request.review_date = datetime.utcnow()
        
        if funding_request.status == FundingStatus.DISBURSED and funding_data.disbursed_amount:
            venture = db.query(StudentVenture).filter(StudentVenture.id == funding_request.venture_id).first()
            venture.funding_received += funding_data.disbursed_amount
            
            if venture.venture_status == VentureStatus.IDEA:
                venture.venture_status = VentureStatus.DEVELOPMENT
    
    db.commit()
    db.refresh(funding_request)
    
    return funding_request


@router.get("/showcase", response_model=List[StudentVentureResponse])
async def venture_showcase(
    status: Optional[str] = None,
    has_mentor: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    min_funding: Optional[Decimal] = None,
    search_query: Optional[str] = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(StudentVenture).filter(StudentVenture.is_active == True)
    
    if status:
        query = query.filter(StudentVenture.venture_status == status)
    
    if has_mentor is not None:
        if has_mentor:
            query = query.filter(StudentVenture.mentor_id.isnot(None))
        else:
            query = query.filter(StudentVenture.mentor_id.is_(None))
    
    if is_featured is not None:
        query = query.filter(StudentVenture.is_featured == is_featured)
    
    if min_funding is not None:
        query = query.filter(StudentVenture.funding_received >= min_funding)
    
    if search_query:
        search_pattern = f"%{search_query}%"
        query = query.filter(
            or_(
                StudentVenture.venture_name.ilike(search_pattern),
                StudentVenture.business_idea.ilike(search_pattern),
                StudentVenture.problem_statement.ilike(search_pattern),
                StudentVenture.solution.ilike(search_pattern)
            )
        )
    
    ventures = query.order_by(
        desc(StudentVenture.is_featured),
        desc(StudentVenture.funding_received),
        desc(StudentVenture.created_at)
    ).offset(offset).limit(limit).all()
    
    return ventures
