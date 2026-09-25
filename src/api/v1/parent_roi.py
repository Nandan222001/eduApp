from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.services.parent_roi_service import ParentROIService
from src.models.parent_roi import ParentROIReport


router = APIRouter()


def _serialize_report(report: ParentROIReport) -> dict:
    return {
        "id": report.id,
        "parent_id": report.parent_id,
        "academic_year": report.academic_year,
        "fees_paid": float(report.fees_paid),
        "money_saved": float(report.money_saved),
        "tuition_cost_avoidance": float(report.tuition_cost_avoidance),
        "time_saved_hours": report.time_saved_hours,
        "performance_improvement": report.performance_improvement,
        "features_used": report.features_used,
        "engagement_score": report.engagement_score,
        "roi_percentage": report.roi_percentage,
        "report_generated_at": report.report_generated_at,
        "created_at": report.created_at,
    }


@router.post("/reports/generate")
def generate_roi_report(
    parent_id: int,
    academic_year: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate ROI report for a parent.

    Previously this whole router had NO authentication dependency on any
    endpoint at all -- any unauthenticated caller could generate and read
    another parent's/institution's financial ROI data (fees paid, money
    saved, engagement score) just by guessing IDs, the router's own
    docstring-implied purpose notwithstanding. Also previously accepted an
    arbitrary `institution_id` directly from the caller instead of deriving
    it from the authenticated session, which would let one institution's
    user generate/read reports scoped to a different institution. Fixed by
    requiring `Depends(get_current_user)` on every endpoint (matching every
    other router in this codebase) and always using
    `current_user.institution_id` rather than a client-supplied value.
    """
    roi_service = ParentROIService(db)

    try:
        report = roi_service.calculate_roi_report(
            parent_id=parent_id,
            institution_id=current_user.institution_id,
            academic_year=academic_year
        )

        return _serialize_report(report)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/reports/parent/{parent_id}")
def get_parent_roi_report(
    parent_id: int,
    academic_year: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ROI report for a specific parent and academic year.

    Scoped to the caller's own institution (see `generate_roi_report` above
    for why this is required, not optional).
    """
    roi_service = ParentROIService(db)
    report = roi_service.get_roi_report(
        parent_id=parent_id,
        institution_id=current_user.institution_id,
        academic_year=academic_year
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ROI report not found"
        )

    return _serialize_report(report)


@router.get("/reports/institution/{institution_id}")
def list_institution_roi_reports(
    institution_id: int,
    academic_year: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all ROI reports for an institution.

    `institution_id` must match the caller's own institution -- previously
    this endpoint had no auth at all and trusted the path parameter
    outright, letting any caller enumerate any institution's parent
    financial data.
    """
    if institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access another institution's ROI reports"
        )

    roi_service = ParentROIService(db)
    reports = roi_service.list_roi_reports(
        institution_id=institution_id,
        academic_year=academic_year,
        skip=skip,
        limit=limit
    )

    return [
        {
            "id": report.id,
            "parent_id": report.parent_id,
            "academic_year": report.academic_year,
            "fees_paid": float(report.fees_paid),
            "money_saved": float(report.money_saved),
            "tuition_cost_avoidance": float(report.tuition_cost_avoidance),
            "time_saved_hours": report.time_saved_hours,
            "performance_improvement": report.performance_improvement,
            "features_used": report.features_used,
            "engagement_score": report.engagement_score,
            "roi_percentage": report.roi_percentage,
            "report_generated_at": report.report_generated_at
        }
        for report in reports
    ]


@router.get("/reports/{report_id:int}")
def get_roi_report_by_id(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific ROI report by ID, scoped to the caller's own institution."""
    roi_service = ParentROIService(db)
    report = roi_service.get_roi_report_by_id(
        report_id=report_id,
        institution_id=current_user.institution_id
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ROI report not found"
        )

    result = _serialize_report(report)
    result["updated_at"] = report.updated_at
    return result
