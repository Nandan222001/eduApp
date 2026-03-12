from typing import Optional, List, Tuple
from datetime import date, datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.models.attendance import Attendance, AttendanceCorrection, AttendanceSummary, AttendanceStatus, CorrectionStatus
from src.models.student import Student
from src.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    BulkAttendanceCreate,
    AttendanceCorrectionCreate,
    AttendanceCorrectionReview,
    AttendanceReportFilters,
    StudentAttendanceReport,
    SubjectAttendanceReport,
    AttendanceDefaulter,
    StudentAttendanceDetail,
    DateRangeAttendance
)
from src.repositories.attendance_repository import (
    AttendanceRepository,
    AttendanceCorrectionRepository,
    AttendanceSummaryRepository
)
from src.services.realtime_service import realtime_service
import asyncio


class AttendanceService:
    def __init__(self, db: Session):
        self.db = db
        self.attendance_repo = AttendanceRepository(db)
        self.correction_repo = AttendanceCorrectionRepository(db)
        self.summary_repo = AttendanceSummaryRepository(db)

    def create_attendance(self, data: AttendanceCreate) -> Attendance:
        existing = self.attendance_repo.get_by_student_date_subject(
            data.student_id,
            data.date,
            data.subject_id
        )
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance already marked for this student, date and subject"
            )
        
        attendance = self.attendance_repo.create(**data.model_dump())
        self.db.commit()
        
        self._update_summary(attendance)
        
        self._send_realtime_notification(attendance)
        
        return attendance
    
    def _send_realtime_notification(self, attendance: Attendance):
        try:
            student = attendance.student
            if student and student.parents:
                parent_user_ids = [parent.user_id for parent in student.parents if parent.user_id]
                if parent_user_ids:
                    asyncio.create_task(
                        realtime_service.notify_attendance_update(
                            db=self.db,
                            student_id=student.id,
                            student_name=f"{student.first_name} {student.last_name}",
                            date=attendance.date.isoformat(),
                            status=attendance.status.value,
                            parent_user_ids=parent_user_ids
                        )
                    )
        except Exception as e:
            pass

    def get_attendance(self, attendance_id: int) -> Optional[Attendance]:
        return self.attendance_repo.get_by_id(attendance_id)

    def list_attendances(
        self,
        institution_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        section_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        student_id: Optional[int] = None,
        status: Optional[AttendanceStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Attendance], int]:
        attendances = self.attendance_repo.list_by_institution(
            institution_id=institution_id,
            start_date=start_date,
            end_date=end_date,
            section_id=section_id,
            subject_id=subject_id,
            student_id=student_id,
            status=status,
            skip=skip,
            limit=limit
        )
        
        total = self.attendance_repo.count_by_institution(
            institution_id=institution_id,
            start_date=start_date,
            end_date=end_date,
            section_id=section_id,
            subject_id=subject_id,
            student_id=student_id,
            status=status
        )
        
        return attendances, total

    def update_attendance(
        self,
        attendance_id: int,
        data: AttendanceUpdate
    ) -> Optional[Attendance]:
        attendance = self.attendance_repo.get_by_id(attendance_id)
        if not attendance:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        attendance = self.attendance_repo.update(attendance, **update_data)
        self.db.commit()
        
        self._update_summary(attendance)
        
        return attendance

    def delete_attendance(self, attendance_id: int) -> bool:
        attendance = self.attendance_repo.get_by_id(attendance_id)
        if not attendance:
            return False
        
        student_id = attendance.student_id
        year = attendance.date.year
        month = attendance.date.month
        subject_id = attendance.subject_id
        
        self.attendance_repo.delete(attendance)
        self.db.commit()
        
        self._recalculate_summary(student_id, year, month, subject_id)
        
        return True

    def bulk_mark_attendance(
        self,
        institution_id: int,
        data: BulkAttendanceCreate,
        marked_by_id: Optional[int] = None
    ) -> dict:
        results = {
            "total": len(data.attendances),
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        for item in data.attendances:
            try:
                existing = self.attendance_repo.get_by_student_date_subject(
                    item.student_id,
                    data.date,
                    data.subject_id
                )
                
                if existing:
                    results["errors"].append({
                        "student_id": item.student_id,
                        "error": "Attendance already marked"
                    })
                    results["failed"] += 1
                    continue
                
                attendance_data = {
                    "institution_id": institution_id,
                    "student_id": item.student_id,
                    "date": data.date,
                    "status": item.status,
                    "section_id": data.section_id,
                    "subject_id": data.subject_id,
                    "remarks": item.remarks,
                    "marked_by_id": marked_by_id
                }
                
                attendance = self.attendance_repo.create(**attendance_data)
                results["success"] += 1
                
            except Exception as e:
                self.db.rollback()
                results["errors"].append({
                    "student_id": item.student_id,
                    "error": str(e)
                })
                results["failed"] += 1
        
        self.db.commit()
        
        for item in data.attendances:
            try:
                attendance = self.attendance_repo.get_by_student_date_subject(
                    item.student_id,
                    data.date,
                    data.subject_id
                )
                if attendance:
                    self._update_summary(attendance)
            except:
                pass
        
        return results

    def request_correction(
        self,
        data: AttendanceCorrectionCreate
    ) -> AttendanceCorrection:
        attendance = self.attendance_repo.get_by_id(data.attendance_id)
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found"
            )
        
        correction = self.correction_repo.create(
            institution_id=data.institution_id,
            attendance_id=data.attendance_id,
            requested_by_id=data.requested_by_id,
            old_status=attendance.status,
            new_status=data.new_status,
            reason=data.reason,
            status=CorrectionStatus.PENDING
        )
        
        self.db.commit()
        return correction

    def review_correction(
        self,
        correction_id: int,
        data: AttendanceCorrectionReview,
        reviewed_by_id: Optional[int] = None
    ) -> AttendanceCorrection:
        correction = self.correction_repo.get_by_id(correction_id)
        if not correction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Correction request not found"
            )
        
        if correction.status != CorrectionStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Correction request already reviewed"
            )
        
        correction = self.correction_repo.update(
            correction,
            status=data.status,
            review_remarks=data.review_remarks,
            reviewed_by_id=reviewed_by_id,
            reviewed_at=datetime.utcnow()
        )
        
        if data.status == CorrectionStatus.APPROVED:
            attendance = self.attendance_repo.get_by_id(correction.attendance_id)
            if attendance:
                self.attendance_repo.update(attendance, status=correction.new_status)
                self._update_summary(attendance)
        
        self.db.commit()
        return correction

    def list_corrections(
        self,
        institution_id: int,
        status: Optional[CorrectionStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[AttendanceCorrection], int]:
        corrections = self.correction_repo.list_by_institution(
            institution_id=institution_id,
            status=status,
            skip=skip,
            limit=limit
        )
        
        total = self.correction_repo.count_by_institution(
            institution_id=institution_id,
            status=status
        )
        
        return corrections, total

    def get_student_attendance_stats(
        self,
        student_id: int,
        start_date: date,
        end_date: date,
        subject_id: Optional[int] = None
    ) -> dict:
        return self.attendance_repo.get_student_attendance_stats(
            student_id=student_id,
            start_date=start_date,
            end_date=end_date,
            subject_id=subject_id
        )

    def get_section_report(
        self,
        section_id: int,
        start_date: date,
        end_date: date,
        subject_id: Optional[int] = None
    ) -> List[StudentAttendanceReport]:
        data = self.attendance_repo.get_section_attendance_report(
            section_id=section_id,
            start_date=start_date,
            end_date=end_date,
            subject_id=subject_id
        )
        
        return [StudentAttendanceReport(**item) for item in data]

    def get_defaulters(
        self,
        institution_id: int,
        start_date: date,
        end_date: date,
        threshold_percentage: float = 75.0,
        section_id: Optional[int] = None,
        subject_id: Optional[int] = None
    ) -> List[AttendanceDefaulter]:
        data = self.attendance_repo.get_defaulters(
            institution_id=institution_id,
            start_date=start_date,
            end_date=end_date,
            threshold_percentage=threshold_percentage,
            section_id=section_id,
            subject_id=subject_id
        )
        
        return [AttendanceDefaulter(**item) for item in data]

    def get_subject_wise_report(
        self,
        institution_id: int,
        start_date: date,
        end_date: date,
        section_id: Optional[int] = None
    ) -> List[SubjectAttendanceReport]:
        data = self.attendance_repo.get_subject_wise_stats(
            institution_id=institution_id,
            start_date=start_date,
            end_date=end_date,
            section_id=section_id
        )
        
        return [SubjectAttendanceReport(**item) for item in data]

    def get_student_detailed_report(
        self,
        student_id: int,
        start_date: date,
        end_date: date,
        subject_id: Optional[int] = None
    ) -> StudentAttendanceDetail:
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        attendances = self.attendance_repo.list_by_institution(
            institution_id=student.institution_id,
            student_id=student_id,
            start_date=start_date,
            end_date=end_date,
            subject_id=subject_id,
            skip=0,
            limit=1000
        )
        
        attendance_list = []
        for attendance in attendances:
            attendance_list.append(DateRangeAttendance(
                date=attendance.date,
                status=attendance.status,
                subject_id=attendance.subject_id,
                subject_name=attendance.subject.name if attendance.subject else None,
                marked_by_id=attendance.marked_by_id,
                remarks=attendance.remarks
            ))
        
        stats = self.get_student_attendance_stats(
            student_id=student_id,
            start_date=start_date,
            end_date=end_date,
            subject_id=subject_id
        )
        
        return StudentAttendanceDetail(
            student_id=student.id,
            student_name=f"{student.first_name} {student.last_name}",
            admission_number=student.admission_number,
            attendances=attendance_list,
            total_days=stats['total_days'],
            present_days=stats['present_days'],
            absent_days=stats['absent_days'],
            late_days=stats['late_days'],
            half_days=stats['half_days'],
            attendance_percentage=stats['attendance_percentage']
        )

    def get_student_summaries(
        self,
        student_id: int,
        year: Optional[int] = None,
        subject_id: Optional[int] = None
    ) -> List[AttendanceSummary]:
        return self.summary_repo.list_by_student(
            student_id=student_id,
            year=year,
            subject_id=subject_id
        )

    def _update_summary(self, attendance: Attendance) -> None:
        year = attendance.date.year
        month = attendance.date.month
        
        self._recalculate_summary(
            attendance.student_id,
            year,
            month,
            attendance.subject_id
        )

    def _recalculate_summary(
        self,
        student_id: int,
        year: int,
        month: int,
        subject_id: Optional[int]
    ) -> None:
        from calendar import monthrange
        
        start_date = date(year, month, 1)
        _, last_day = monthrange(year, month)
        end_date = date(year, month, last_day)
        
        stats = self.attendance_repo.get_student_attendance_stats(
            student_id=student_id,
            start_date=start_date,
            end_date=end_date,
            subject_id=subject_id
        )
        
        if stats['total_days'] > 0:
            student = self.db.query(Student).filter(Student.id == student_id).first()
            if student:
                self.summary_repo.upsert_summary(
                    student_id=student_id,
                    year=year,
                    month=month,
                    subject_id=subject_id,
                    institution_id=student.institution_id,
                    total_days=stats['total_days'],
                    present_days=stats['present_days'],
                    absent_days=stats['absent_days'],
                    late_days=stats['late_days'],
                    half_days=stats['half_days'],
                    attendance_percentage=stats['attendance_percentage']
                )
                self.db.commit()
