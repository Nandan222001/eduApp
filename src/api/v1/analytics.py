from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import date

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.schemas.analytics import (
    AnalyticsQueryParams,
    StudentMetrics,
    ClassMetrics,
    InstitutionMetrics,
    ExamAnalytics,
    YoYComparison,
    StudentPerformanceComparison,
    AnalyticsResponse,
    ReportGenerationRequest,
    ReportResponse,
    StudentPerformanceTrend,
    AnalyticsDashboard,
    DateRangeType,
    MetricType,
    ReportType,
)
from src.services.analytics_service import AnalyticsService
from src.services.report_generation_service import ReportGenerationService
from src.redis_client import get_redis

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/student/{student_id}/metrics", response_model=StudentMetrics)
async def get_student_metrics(
    student_id: int,
    date_range_type: DateRangeType = Query(DateRangeType.MONTHLY),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudentMetrics:
    """Get comprehensive performance metrics for a specific student."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    params = AnalyticsQueryParams(
        date_range_type=date_range_type,
        start_date=start_date,
        end_date=end_date,
    )

    service = AnalyticsService(db, redis_client)
    try:
        metrics = await service.get_student_metrics(
            current_user.institution_id, student_id, params
        )
        return metrics
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch student metrics: {str(e)}",
        )


@router.get("/class/{section_id}/metrics", response_model=ClassMetrics)
async def get_class_metrics(
    section_id: int,
    date_range_type: DateRangeType = Query(DateRangeType.MONTHLY),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClassMetrics:
    """Get comprehensive performance metrics for a specific class/section."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    params = AnalyticsQueryParams(
        date_range_type=date_range_type,
        start_date=start_date,
        end_date=end_date,
    )

    service = AnalyticsService(db, redis_client)
    try:
        metrics = await service.get_class_metrics(
            current_user.institution_id, section_id, params
        )
        return metrics
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch class metrics: {str(e)}",
        )


@router.get("/institution/metrics", response_model=InstitutionMetrics)
async def get_institution_metrics(
    date_range_type: DateRangeType = Query(DateRangeType.MONTHLY),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InstitutionMetrics:
    """Get comprehensive performance metrics for the entire institution."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    params = AnalyticsQueryParams(
        date_range_type=date_range_type,
        start_date=start_date,
        end_date=end_date,
    )

    service = AnalyticsService(db, redis_client)
    try:
        metrics = await service.get_institution_metrics(
            current_user.institution_id, params
        )
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch institution metrics: {str(e)}",
        )


@router.get("/exam/{exam_id}/analytics", response_model=ExamAnalytics)
async def get_exam_analytics(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExamAnalytics:
    """Get detailed analytics for a specific exam including subject-wise performance."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    service = AnalyticsService(db, redis_client)
    try:
        analytics = await service.get_exam_analytics(
            current_user.institution_id, exam_id
        )
        return analytics
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch exam analytics: {str(e)}",
        )


@router.get("/yoy-comparison", response_model=List[YoYComparison])
async def get_yoy_comparison(
    date_range_type: DateRangeType = Query(DateRangeType.YEARLY),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[YoYComparison]:
    """Get year-over-year comparison of key performance metrics."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    params = AnalyticsQueryParams(
        date_range_type=date_range_type,
        start_date=start_date,
        end_date=end_date,
    )

    service = AnalyticsService(db, redis_client)
    try:
        comparisons = await service.get_yoy_comparison(
            current_user.institution_id, params
        )
        return comparisons
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch YoY comparison: {str(e)}",
        )


@router.get("/student/{student_id}/comparison", response_model=StudentPerformanceComparison)
async def get_student_performance_comparison(
    student_id: int,
    date_range_type: DateRangeType = Query(DateRangeType.MONTHLY),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudentPerformanceComparison:
    """Compare student performance against class and grade averages."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    params = AnalyticsQueryParams(
        date_range_type=date_range_type,
        start_date=start_date,
        end_date=end_date,
    )

    service = AnalyticsService(db, redis_client)
    try:
        comparison = await service.get_student_performance_comparison(
            current_user.institution_id, student_id, params
        )
        return comparison
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch performance comparison: {str(e)}",
        )


@router.get("/student/{student_id}/trends", response_model=List[StudentPerformanceTrend])
async def get_student_performance_trends(
    student_id: int,
    date_range_type: DateRangeType = Query(DateRangeType.YEARLY),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[StudentPerformanceTrend]:
    """Get performance trends for a student over time."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    params = AnalyticsQueryParams(
        date_range_type=date_range_type,
        start_date=start_date,
        end_date=end_date,
    )

    service = AnalyticsService(db, redis_client)
    try:
        trends = await service.get_student_performance_trends(
            current_user.institution_id, student_id, params
        )
        return trends
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch performance trends: {str(e)}",
        )


@router.post("/reports/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReportResponse:
    """Generate a comprehensive analytics report in PDF format."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    service = ReportGenerationService(db, redis_client)
    try:
        report_id = await service.generate_report(
            institution_id=current_user.institution_id,
            report_type=request.report_type,
            report_title=request.report_title,
            parameters=request.parameters,
            generated_by_id=current_user.id,
            include_charts=request.include_charts,
        )

        report = service.get_report(current_user.institution_id, report_id)
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
            )

        return ReportResponse(
            id=report.id,
            institution_id=report.institution_id,
            report_type=report.report_type.value,
            report_title=report.report_title,
            report_description=report.report_description,
            status=report.status.value,
            file_url=report.file_url,
            file_size=report.file_size,
            error_message=report.error_message,
            started_at=report.started_at,
            completed_at=report.completed_at,
            created_at=report.created_at,
            updated_at=report.updated_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}",
        )


@router.get("/reports", response_model=List[ReportResponse])
async def list_reports(
    report_type: Optional[ReportType] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[ReportResponse]:
    """List all generated reports for the institution."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    service = ReportGenerationService(db, redis_client)
    reports = service.list_reports(
        current_user.institution_id, report_type, limit, offset
    )

    return [
        ReportResponse(
            id=report.id,
            institution_id=report.institution_id,
            report_type=report.report_type.value,
            report_title=report.report_title,
            report_description=report.report_description,
            status=report.status.value,
            file_url=report.file_url,
            file_size=report.file_size,
            error_message=report.error_message,
            started_at=report.started_at,
            completed_at=report.completed_at,
            created_at=report.created_at,
            updated_at=report.updated_at,
        )
        for report in reports
    ]


@router.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReportResponse:
    """Get details of a specific report."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    service = ReportGenerationService(db, redis_client)
    report = service.get_report(current_user.institution_id, report_id)

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )

    return ReportResponse(
        id=report.id,
        institution_id=report.institution_id,
        report_type=report.report_type.value,
        report_title=report.report_title,
        report_description=report.report_description,
        status=report.status.value,
        file_url=report.file_url,
        file_size=report.file_size,
        error_message=report.error_message,
        started_at=report.started_at,
        completed_at=report.completed_at,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.post("/aggregation/student", response_model=List[StudentMetrics])
async def aggregate_student_metrics(
    student_ids: List[int],
    date_range_type: DateRangeType = Query(DateRangeType.MONTHLY),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[StudentMetrics]:
    """Get aggregated metrics for multiple students."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    params = AnalyticsQueryParams(
        date_range_type=date_range_type,
        start_date=start_date,
        end_date=end_date,
        student_ids=student_ids,
    )

    service = AnalyticsService(db, redis_client)
    results = []

    for student_id in student_ids:
        try:
            metrics = await service.get_student_metrics(
                current_user.institution_id, student_id, params
            )
            results.append(metrics)
        except Exception:
            continue

    return results


@router.post("/aggregation/class", response_model=List[ClassMetrics])
async def aggregate_class_metrics(
    section_ids: List[int],
    date_range_type: DateRangeType = Query(DateRangeType.MONTHLY),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[ClassMetrics]:
    """Get aggregated metrics for multiple classes/sections."""
    try:
        redis_client = await get_redis()
    except Exception:
        redis_client = None

    params = AnalyticsQueryParams(
        date_range_type=date_range_type,
        start_date=start_date,
        end_date=end_date,
        section_ids=section_ids,
    )

    service = AnalyticsService(db, redis_client)
    results = []

    for section_id in section_ids:
        try:
            metrics = await service.get_class_metrics(
                current_user.institution_id, section_id, params
            )
            results.append(metrics)
        except Exception:
            continue

    return results
