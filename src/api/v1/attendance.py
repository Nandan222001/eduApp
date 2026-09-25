from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.models.attendance import AttendanceStatus, CorrectionStatus
from src.models.student import Student
from src.dependencies.auth import get_current_user
from src.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceResponse,
    BulkAttendanceCreate,
    BulkAttendanceResult,
    AttendanceCorrectionCreate,
    AttendanceCorrectionReview,
    AttendanceCorrectionResponse,
    AttendanceSummaryResponse,
    StudentAttendanceReport,
    SubjectAttendanceReport,
    AttendanceDefaulter,
    StudentAttendanceDetail
)
from src.services.attendance_service import AttendanceService

router = APIRouter()


@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
async def create_attendance(
    attendance_data: AttendanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != attendance_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create attendance for this institution"
        )

    if current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers or admins can mark attendance"
        )

    student = db.query(Student).filter(Student.id == attendance_data.student_id).first()
    if not student or student.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    service = AttendanceService(db)
    attendance = service.create_attendance(attendance_data)
    return attendance


@router.post("/bulk", response_model=BulkAttendanceResult, status_code=status.HTTP_201_CREATED)
async def bulk_mark_attendance(
    bulk_data: BulkAttendanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers or admins can mark attendance"
        )

    requested_student_ids = {item.student_id for item in bulk_data.attendances}
    valid_student_ids = {
        s.id for s in db.query(Student.id).filter(
            Student.id.in_(requested_student_ids),
            Student.institution_id == current_user.institution_id
        ).all()
    }
    invalid_items = [item for item in bulk_data.attendances if item.student_id not in valid_student_ids]
    valid_items = [item for item in bulk_data.attendances if item.student_id in valid_student_ids]

    service = AttendanceService(db)
    filtered_bulk_data = bulk_data.model_copy(update={"attendances": valid_items})
    result = service.bulk_mark_attendance(
        institution_id=current_user.institution_id,
        data=filtered_bulk_data,
        marked_by_id=current_user.id
    )

    for item in invalid_items:
        result["errors"].append({
            "student_id": item.student_id,
            "error": "Student not found in this institution"
        })
        result["failed"] += 1
    result["total"] = len(bulk_data.attendances)

    return result


@router.get("/", response_model=dict)
async def list_attendances(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    section_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    status: Optional[AttendanceStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    attendances, total = service.list_attendances(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date,
        section_id=section_id,
        subject_id=subject_id,
        student_id=student_id,
        status=status,
        skip=skip,
        limit=limit
    )
    return {
        "items": [AttendanceResponse.model_validate(a) for a in attendances],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{attendance_id:int}", response_model=AttendanceResponse)
async def get_attendance(
    attendance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    attendance = service.get_attendance(attendance_id)
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance not found"
        )
    
    if attendance.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this attendance"
        )

    if current_user.student_profile and attendance.student_id != current_user.student_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this attendance"
        )

    return attendance


@router.put("/{attendance_id:int}", response_model=AttendanceResponse)
async def update_attendance(
    attendance_id: int,
    attendance_data: AttendanceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    attendance = service.get_attendance(attendance_id)
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance not found"
        )
    
    if attendance.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this attendance"
        )

    if current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers or admins can update attendance"
        )

    updated_attendance = service.update_attendance(attendance_id, attendance_data)
    return updated_attendance


@router.delete("/{attendance_id:int}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attendance(
    attendance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    attendance = service.get_attendance(attendance_id)
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance not found"
        )
    
    if attendance.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this attendance"
        )

    if current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers or admins can delete attendance"
        )

    service.delete_attendance(attendance_id)
    return None


@router.post("/corrections", response_model=AttendanceCorrectionResponse, status_code=status.HTTP_201_CREATED)
async def request_correction(
    correction_data: AttendanceCorrectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != correction_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create correction for this institution"
        )

    service = AttendanceService(db)

    # The check above only confirms the caller belongs to the institution
    # they *claim* in the request body -- it says nothing about whether the
    # target attendance record actually belongs to that institution. Without
    # this, a caller could submit their own institution_id (passing the
    # check above) while pointing attendance_id at a record that actually
    # belongs to a different institution, creating a cross-institution
    # correction request.
    target_attendance = service.get_attendance(correction_data.attendance_id)
    if not target_attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    if target_attendance.institution_id != correction_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create correction for this institution"
        )

    if current_user.student_profile and target_attendance.student_id != current_user.student_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to request a correction for this attendance"
        )

    correction = service.request_correction(correction_data)
    return correction


@router.get("/corrections", response_model=dict)
async def list_corrections(
    status: Optional[CorrectionStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    corrections, total = service.list_corrections(
        institution_id=current_user.institution_id,
        status=status,
        skip=skip,
        limit=limit
    )
    return {
        "items": [AttendanceCorrectionResponse.model_validate(c) for c in corrections],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.put("/corrections/{correction_id}", response_model=AttendanceCorrectionResponse)
async def review_correction(
    correction_id: int,
    review_data: AttendanceCorrectionReview,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers or admins can review attendance corrections"
        )

    service = AttendanceService(db)
    correction = service.review_correction(
        correction_id=correction_id,
        data=review_data,
        reviewed_by_id=current_user.id,
        institution_id=current_user.institution_id
    )

    return correction


@router.get("/reports/section/{section_id}", response_model=list[StudentAttendanceReport])
async def get_section_report(
    section_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    subject_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    report = service.get_section_report(
        section_id=section_id,
        start_date=start_date,
        end_date=end_date,
        subject_id=subject_id
    )
    return report


@router.get("/reports/student/{student_id}", response_model=StudentAttendanceDetail)
async def get_student_detailed_report(
    student_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    subject_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    report = service.get_student_detailed_report(
        student_id=student_id,
        start_date=start_date,
        end_date=end_date,
        subject_id=subject_id
    )
    
    if report.student_id:
        from src.models.student import Student
        student = db.query(Student).filter(Student.id == student_id).first()
        if student and student.institution_id != current_user.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this student's attendance"
            )
    
    return report


@router.get("/reports/student/{student_id}/stats", response_model=dict)
async def get_student_stats(
    student_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    subject_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from src.models.student import Student
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if student.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this student's stats"
        )
    
    service = AttendanceService(db)
    stats = service.get_student_attendance_stats(
        student_id=student_id,
        start_date=start_date,
        end_date=end_date,
        subject_id=subject_id
    )
    return stats


@router.get("/reports/defaulters", response_model=list[AttendanceDefaulter])
async def get_defaulters(
    start_date: date = Query(...),
    end_date: date = Query(...),
    threshold_percentage: float = Query(75.0, ge=0, le=100),
    section_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    defaulters = service.get_defaulters(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date,
        threshold_percentage=threshold_percentage,
        section_id=section_id,
        subject_id=subject_id
    )
    return defaulters


@router.get("/reports/subjects", response_model=list[SubjectAttendanceReport])
async def get_subject_wise_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    section_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    report = service.get_subject_wise_report(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date,
        section_id=section_id
    )
    return report


@router.get("/summaries/student/{student_id}", response_model=list[AttendanceSummaryResponse])
async def get_student_summaries(
    student_id: int,
    year: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from src.models.student import Student
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if student.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this student's summaries"
        )
    
    service = AttendanceService(db)
    summaries = service.get_student_summaries(
        student_id=student_id,
        year=year,
        subject_id=subject_id
    )
    return summaries
