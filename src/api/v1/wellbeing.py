from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta

from src.database import get_db
from src.services.wellbeing_service import WellbeingService
from src.models.wellbeing import (
    WellbeingAlert,
    AlertNote,
    WellbeingIntervention,
    SentimentAnalysis,
    BehavioralPattern,
    WellbeingConsent,
    CounselorProfile,
    StudentWellbeingProfile,
    AlertStatus,
    ConsentStatus,
)
from src.schemas.wellbeing import (
    WellbeingAlertCreate,
    WellbeingAlertUpdate,
    WellbeingAlertResponse,
    AlertNoteCreate,
    AlertNoteResponse,
    WellbeingInterventionCreate,
    WellbeingInterventionUpdate,
    WellbeingInterventionResponse,
    SentimentAnalysisRequest,
    SentimentAnalysisResponse,
    BehavioralAnalysisRequest,
    BehavioralPatternResponse,
    WellbeingConsentCreate,
    WellbeingConsentUpdate,
    WellbeingConsentResponse,
    CounselorProfileCreate,
    CounselorProfileUpdate,
    CounselorProfileResponse,
    StudentWellbeingProfileResponse,
    CounselorDashboardResponse,
    StudentRiskSummary,
    DataAccessLogRequest,
)

router = APIRouter(prefix="/wellbeing", tags=["Wellbeing"])


@router.post("/sentiment-analysis", response_model=SentimentAnalysisResponse)
def analyze_sentiment(
    request: SentimentAnalysisRequest,
    institution_id: int,
    db: Session = Depends(get_db)
):
    service = WellbeingService(db)
    
    has_consent, access_level = service.check_data_access_consent(
        request.student_id,
        institution_id
    )
    
    if not has_consent or access_level == 'none':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No consent for wellbeing monitoring"
        )
    
    analysis = service.analyze_sentiment(
        content=request.content,
        student_id=request.student_id,
        institution_id=institution_id,
        source_type=request.source_type,
        source_id=request.source_id
    )
    
    db.commit()
    
    return analysis


@router.post("/behavioral-analysis", response_model=List[BehavioralPatternResponse])
def analyze_behavioral_patterns(
    request: BehavioralAnalysisRequest,
    institution_id: int,
    db: Session = Depends(get_db)
):
    service = WellbeingService(db)
    
    has_consent, access_level = service.check_data_access_consent(
        request.student_id,
        institution_id
    )
    
    if not has_consent or access_level == 'none':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No consent for wellbeing monitoring"
        )
    
    patterns = service.analyze_behavioral_patterns(
        student_id=request.student_id,
        institution_id=institution_id,
        analysis_days=request.analysis_period_days
    )
    
    db.commit()
    
    return patterns


@router.get("/alerts", response_model=List[WellbeingAlertResponse])
def get_alerts(
    institution_id: int,
    student_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    severity: Optional[str] = None,
    assigned_counselor_id: Optional[int] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(WellbeingAlert).filter(
        WellbeingAlert.institution_id == institution_id
    )
    
    if student_id:
        query = query.filter(WellbeingAlert.student_id == student_id)
    
    if status_filter:
        query = query.filter(WellbeingAlert.status == status_filter)
    
    if severity:
        query = query.filter(WellbeingAlert.severity == severity)
    
    if assigned_counselor_id:
        query = query.filter(WellbeingAlert.assigned_counselor_id == assigned_counselor_id)
    
    alerts = query.order_by(
        WellbeingAlert.risk_score.desc(),
        WellbeingAlert.detected_at.desc()
    ).limit(limit).offset(offset).all()
    
    return alerts


@router.get("/alerts/{alert_id}", response_model=WellbeingAlertResponse)
def get_alert(
    alert_id: int,
    institution_id: int,
    current_user_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(WellbeingAlert).filter(
        WellbeingAlert.id == alert_id,
        WellbeingAlert.institution_id == institution_id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    service = WellbeingService(db)
    service.log_data_access(
        user_id=current_user_id,
        student_id=alert.student_id,
        institution_id=institution_id,
        log_request=DataAccessLogRequest(
            resource_type="wellbeing_alert",
            resource_id=alert_id,
            purpose="View alert details"
        )
    )
    
    db.commit()
    
    return alert


@router.post("/alerts", response_model=WellbeingAlertResponse)
def create_alert(
    alert_data: WellbeingAlertCreate,
    db: Session = Depends(get_db)
):
    service = WellbeingService(db)
    
    has_consent, access_level = service.check_data_access_consent(
        alert_data.student_id,
        alert_data.institution_id
    )
    
    if not has_consent or access_level == 'none':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No consent for wellbeing monitoring"
        )
    
    alert = WellbeingAlert(**alert_data.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    service._update_wellbeing_profile(alert.student_id, alert.institution_id)
    db.commit()
    
    return alert


@router.patch("/alerts/{alert_id}", response_model=WellbeingAlertResponse)
def update_alert(
    alert_id: int,
    institution_id: int,
    current_user_id: int,
    alert_update: WellbeingAlertUpdate,
    db: Session = Depends(get_db)
):
    alert = db.query(WellbeingAlert).filter(
        WellbeingAlert.id == alert_id,
        WellbeingAlert.institution_id == institution_id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    update_data = alert_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == 'status':
            setattr(alert, key, value)
            if value == AlertStatus.ACKNOWLEDGED.value:
                alert.acknowledged_by = current_user_id
                alert.acknowledged_at = datetime.utcnow()
            elif value == AlertStatus.RESOLVED.value:
                alert.resolved_by = current_user_id
                alert.resolved_at = datetime.utcnow()
        else:
            setattr(alert, key, value)
    
    db.commit()
    db.refresh(alert)
    
    service = WellbeingService(db)
    service._update_wellbeing_profile(alert.student_id, alert.institution_id)
    db.commit()
    
    return alert


@router.post("/alerts/{alert_id}/notes", response_model=AlertNoteResponse)
def add_alert_note(
    alert_id: int,
    institution_id: int,
    current_user_id: int,
    note_data: AlertNoteCreate,
    db: Session = Depends(get_db)
):
    alert = db.query(WellbeingAlert).filter(
        WellbeingAlert.id == alert_id,
        WellbeingAlert.institution_id == institution_id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    note = AlertNote(
        alert_id=alert_id,
        created_by=current_user_id,
        content=note_data.content,
        is_confidential=note_data.is_confidential
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return note


@router.get("/alerts/{alert_id}/notes", response_model=List[AlertNoteResponse])
def get_alert_notes(
    alert_id: int,
    institution_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(WellbeingAlert).filter(
        WellbeingAlert.id == alert_id,
        WellbeingAlert.institution_id == institution_id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    notes = db.query(AlertNote).filter(
        AlertNote.alert_id == alert_id
    ).order_by(AlertNote.created_at.desc()).all()
    
    return notes


@router.post("/interventions", response_model=WellbeingInterventionResponse)
def create_intervention(
    intervention_data: WellbeingInterventionCreate,
    db: Session = Depends(get_db)
):
    intervention = WellbeingIntervention(**intervention_data.model_dump())
    db.add(intervention)
    db.commit()
    db.refresh(intervention)
    
    return intervention


@router.patch("/interventions/{intervention_id}", response_model=WellbeingInterventionResponse)
def update_intervention(
    intervention_id: int,
    institution_id: int,
    intervention_update: WellbeingInterventionUpdate,
    db: Session = Depends(get_db)
):
    intervention = db.query(WellbeingIntervention).filter(
        WellbeingIntervention.id == intervention_id,
        WellbeingIntervention.institution_id == institution_id
    ).first()
    
    if not intervention:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intervention not found"
        )
    
    update_data = intervention_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(intervention, key, value)
    
    db.commit()
    db.refresh(intervention)
    
    return intervention


@router.get("/interventions", response_model=List[WellbeingInterventionResponse])
def get_interventions(
    institution_id: int,
    student_id: Optional[int] = None,
    counselor_id: Optional[int] = None,
    completed: Optional[bool] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(WellbeingIntervention).filter(
        WellbeingIntervention.institution_id == institution_id
    )
    
    if student_id:
        query = query.filter(WellbeingIntervention.student_id == student_id)
    
    if counselor_id:
        query = query.filter(WellbeingIntervention.counselor_id == counselor_id)
    
    if completed is not None:
        if completed:
            query = query.filter(WellbeingIntervention.completed_at.isnot(None))
        else:
            query = query.filter(WellbeingIntervention.completed_at.is_(None))
    
    interventions = query.order_by(
        WellbeingIntervention.scheduled_at.desc()
    ).limit(limit).offset(offset).all()
    
    return interventions


@router.post("/consents", response_model=WellbeingConsentResponse)
def create_consent(
    consent_data: WellbeingConsentCreate,
    db: Session = Depends(get_db)
):
    consent = WellbeingConsent(**consent_data.model_dump())
    
    if consent.granted_by_parent or consent.granted_by_student:
        consent.status = ConsentStatus.GRANTED.value
        consent.granted_at = datetime.utcnow()
    
    db.add(consent)
    db.commit()
    db.refresh(consent)
    
    return consent


@router.patch("/consents/{consent_id}", response_model=WellbeingConsentResponse)
def update_consent(
    consent_id: int,
    institution_id: int,
    current_user_id: int,
    consent_update: WellbeingConsentUpdate,
    db: Session = Depends(get_db)
):
    consent = db.query(WellbeingConsent).filter(
        WellbeingConsent.id == consent_id,
        WellbeingConsent.institution_id == institution_id
    ).first()
    
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consent record not found"
        )
    
    update_data = consent_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == 'status' and value == ConsentStatus.REVOKED.value:
            consent.revoked_at = datetime.utcnow()
            consent.revoked_by = current_user_id
        setattr(consent, key, value)
    
    db.commit()
    db.refresh(consent)
    
    return consent


@router.get("/consents/student/{student_id}", response_model=List[WellbeingConsentResponse])
def get_student_consents(
    student_id: int,
    institution_id: int,
    db: Session = Depends(get_db)
):
    consents = db.query(WellbeingConsent).filter(
        WellbeingConsent.student_id == student_id,
        WellbeingConsent.institution_id == institution_id
    ).order_by(WellbeingConsent.created_at.desc()).all()
    
    return consents


@router.post("/counselors", response_model=CounselorProfileResponse)
def create_counselor_profile(
    profile_data: CounselorProfileCreate,
    db: Session = Depends(get_db)
):
    existing = db.query(CounselorProfile).filter(
        CounselorProfile.user_id == profile_data.user_id,
        CounselorProfile.institution_id == profile_data.institution_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Counselor profile already exists"
        )
    
    profile = CounselorProfile(**profile_data.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return profile


@router.patch("/counselors/{counselor_id}", response_model=CounselorProfileResponse)
def update_counselor_profile(
    counselor_id: int,
    institution_id: int,
    profile_update: CounselorProfileUpdate,
    db: Session = Depends(get_db)
):
    profile = db.query(CounselorProfile).filter(
        CounselorProfile.id == counselor_id,
        CounselorProfile.institution_id == institution_id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Counselor profile not found"
        )
    
    update_data = profile_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    
    return profile


@router.get("/counselors", response_model=List[CounselorProfileResponse])
def get_counselors(
    institution_id: int,
    is_active: Optional[bool] = None,
    can_handle_crisis: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CounselorProfile).filter(
        CounselorProfile.institution_id == institution_id
    )
    
    if is_active is not None:
        query = query.filter(CounselorProfile.is_active == is_active)
    
    if can_handle_crisis is not None:
        query = query.filter(CounselorProfile.can_handle_crisis == can_handle_crisis)
    
    counselors = query.order_by(CounselorProfile.current_case_load).all()
    
    return counselors


@router.get("/dashboard/counselor", response_model=Dict)
def get_counselor_dashboard(
    institution_id: int,
    counselor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    service = WellbeingService(db)
    dashboard_data = service.get_counselor_dashboard(institution_id, counselor_id)
    
    return dashboard_data


@router.get("/students/{student_id}/profile", response_model=StudentWellbeingProfileResponse)
def get_student_wellbeing_profile(
    student_id: int,
    institution_id: int,
    current_user_id: int,
    db: Session = Depends(get_db)
):
    service = WellbeingService(db)
    
    has_consent, access_level = service.check_data_access_consent(
        student_id,
        institution_id
    )
    
    if not has_consent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No consent for accessing wellbeing data"
        )
    
    profile = db.query(StudentWellbeingProfile).filter(
        StudentWellbeingProfile.student_id == student_id,
        StudentWellbeingProfile.institution_id == institution_id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wellbeing profile not found"
        )
    
    service.log_data_access(
        user_id=current_user_id,
        student_id=student_id,
        institution_id=institution_id,
        log_request=DataAccessLogRequest(
            resource_type="wellbeing_profile",
            resource_id=profile.id,
            purpose="View student wellbeing profile"
        )
    )
    
    db.commit()
    
    return profile


@router.get("/students/{student_id}/sentiments", response_model=List[SentimentAnalysisResponse])
def get_student_sentiments(
    student_id: int,
    institution_id: int,
    days: int = Query(30, le=365),
    flagged_only: bool = False,
    db: Session = Depends(get_db)
):
    service = WellbeingService(db)
    
    has_consent, access_level = service.check_data_access_consent(
        student_id,
        institution_id
    )
    
    if not has_consent or access_level == 'none':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No consent for accessing sentiment data"
        )
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(SentimentAnalysis).filter(
        SentimentAnalysis.student_id == student_id,
        SentimentAnalysis.institution_id == institution_id,
        SentimentAnalysis.created_at >= start_date
    )
    
    if flagged_only:
        query = query.filter(SentimentAnalysis.flagged_for_review == True)
    
    sentiments = query.order_by(SentimentAnalysis.created_at.desc()).all()
    
    return sentiments


@router.get("/students/{student_id}/patterns", response_model=List[BehavioralPatternResponse])
def get_student_behavioral_patterns(
    student_id: int,
    institution_id: int,
    days: int = Query(30, le=365),
    concerning_only: bool = False,
    db: Session = Depends(get_db)
):
    service = WellbeingService(db)
    
    has_consent, access_level = service.check_data_access_consent(
        student_id,
        institution_id
    )
    
    if not has_consent or access_level == 'none':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No consent for accessing behavioral data"
        )
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(BehavioralPattern).filter(
        BehavioralPattern.student_id == student_id,
        BehavioralPattern.institution_id == institution_id,
        BehavioralPattern.created_at >= start_date
    )
    
    if concerning_only:
        query = query.filter(BehavioralPattern.is_concerning == True)
    
    patterns = query.order_by(BehavioralPattern.created_at.desc()).all()
    
    return patterns
