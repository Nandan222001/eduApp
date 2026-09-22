from typing import Optional, List, Dict, Any
from datetime import date, datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, case
from src.models.attendance import Attendance, AttendanceCorrection, AttendanceSummary, AttendanceStatus, CorrectionStatus
from src.models.student import Student
from src.models.academic import Section, Subject, Grade


class AttendanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Attendance:
        attendance = Attendance(**kwargs)
        self.db.add(attendance)
        self.db.flush()
        return attendance

    def create_bulk(self, items: List[Dict[str, Any]]) -> List[Attendance]:
        attendances = [Attendance(**item) for item in items]
        self.db.add_all(attendances)
        self.db.flush()
        return attendances

    def get_by_id(self, attendance_id: int) -> Optional[Attendance]:
        return self.db.query(Attendance).filter(Attendance.id == attendance_id).first()

    def get_by_student_date_subject(
        self,
        student_id: int,
        date: date,
        subject_id: Optional[int] = None
    ) -> Optional[Attendance]:
        query = self.db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.date == date
        )
        
        if subject_id is None:
            query = query.filter(Attendance.subject_id.is_(None))
        else:
            query = query.filter(Attendance.subject_id == subject_id)
        
        return query.first()

    def list_by_institution(
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
    ) -> List[Attendance]:
        query = self.db.query(Attendance).filter(
            Attendance.institution_id == institution_id
        )
        
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        
        if section_id:
            query = query.filter(Attendance.section_id == section_id)
        
        if subject_id:
            query = query.filter(Attendance.subject_id == subject_id)
        
        if student_id:
            query = query.filter(Attendance.student_id == student_id)
        
        if status:
            query = query.filter(Attendance.status == status)
        
        return query.options(
            joinedload(Attendance.student),
            joinedload(Attendance.subject)
        ).order_by(Attendance.date.desc(), Attendance.student_id).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        section_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        student_id: Optional[int] = None,
        status: Optional[AttendanceStatus] = None
    ) -> int:
        query = self.db.query(Attendance).filter(
            Attendance.institution_id == institution_id
        )
        
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        
        if section_id:
            query = query.filter(Attendance.section_id == section_id)
        
        if subject_id:
            query = query.filter(Attendance.subject_id == subject_id)
        
        if student_id:
            query = query.filter(Attendance.student_id == student_id)
        
        if status:
            query = query.filter(Attendance.status == status)
        
        return query.count()

    def update(self, attendance: Attendance, **kwargs) -> Attendance:
        for key, value in kwargs.items():
            setattr(attendance, key, value)
        self.db.flush()
        return attendance

    def delete(self, attendance: Attendance) -> None:
        self.db.delete(attendance)
        self.db.flush()

    def delete_bulk(self, attendance_ids: List[int]) -> int:
        count = self.db.query(Attendance).filter(
            Attendance.id.in_(attendance_ids)
        ).delete(synchronize_session=False)
        self.db.flush()
        return count

    def get_student_attendance_stats(
        self,
        student_id: int,
        start_date: date,
        end_date: date,
        subject_id: Optional[int] = None
    ) -> Dict[str, Any]:
        query = self.db.query(
            func.count(Attendance.id).label('total_days'),
            func.sum(case((Attendance.status == AttendanceStatus.PRESENT, 1), else_=0)).label('present_days'),
            func.sum(case((Attendance.status == AttendanceStatus.ABSENT, 1), else_=0)).label('absent_days'),
            func.sum(case((Attendance.status == AttendanceStatus.LATE, 1), else_=0)).label('late_days'),
            func.sum(case((Attendance.status == AttendanceStatus.HALF_DAY, 1), else_=0)).label('half_days')
        ).filter(
            Attendance.student_id == student_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date
        )
        
        if subject_id:
            query = query.filter(Attendance.subject_id == subject_id)
        
        result = query.first()
        
        if result and result.total_days:
            # MySQL's SUM(CASE ...) comes back as Decimal, which can't be
            # mixed with a float literal directly.
            present_count = float(result.present_days or 0) + float(result.late_days or 0) * 0.5 + float(result.half_days or 0) * 0.5
            percentage = (present_count / float(result.total_days)) * 100
        else:
            percentage = 0.0
        
        return {
            'total_days': result.total_days or 0,
            'present_days': result.present_days or 0,
            'absent_days': result.absent_days or 0,
            'late_days': result.late_days or 0,
            'half_days': result.half_days or 0,
            'attendance_percentage': round(percentage, 2)
        }

    def get_section_attendance_report(
        self,
        section_id: int,
        start_date: date,
        end_date: date,
        subject_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        query = self.db.query(
            Student.id.label('student_id'),
            Student.first_name,
            Student.last_name,
            Student.admission_number,
            func.count(Attendance.id).label('total_days'),
            func.sum(case((Attendance.status == AttendanceStatus.PRESENT, 1), else_=0)).label('present_days'),
            func.sum(case((Attendance.status == AttendanceStatus.ABSENT, 1), else_=0)).label('absent_days'),
            func.sum(case((Attendance.status == AttendanceStatus.LATE, 1), else_=0)).label('late_days'),
            func.sum(case((Attendance.status == AttendanceStatus.HALF_DAY, 1), else_=0)).label('half_days')
        ).join(
            Attendance, Student.id == Attendance.student_id
        ).filter(
            Student.section_id == section_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date
        )
        
        if subject_id:
            query = query.filter(Attendance.subject_id == subject_id)
        
        query = query.group_by(
            Student.id,
            Student.first_name,
            Student.last_name,
            Student.admission_number
        )
        
        results = query.all()
        
        report_data = []
        for row in results:
            if row.total_days:
                present_count = float(row.present_days or 0) + float(row.late_days or 0) * 0.5 + float(row.half_days or 0) * 0.5
                percentage = (present_count / float(row.total_days)) * 100
            else:
                percentage = 0.0
            
            report_data.append({
                'student_id': row.student_id,
                'student_name': f"{row.first_name} {row.last_name}",
                'admission_number': row.admission_number,
                'total_days': row.total_days or 0,
                'present_days': row.present_days or 0,
                'absent_days': row.absent_days or 0,
                'late_days': row.late_days or 0,
                'half_days': row.half_days or 0,
                'attendance_percentage': round(percentage, 2)
            })
        
        return report_data

    def get_defaulters(
        self,
        institution_id: int,
        start_date: date,
        end_date: date,
        threshold_percentage: float = 75.0,
        section_id: Optional[int] = None,
        subject_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        query = self.db.query(
            Student.id.label('student_id'),
            Student.first_name,
            Student.last_name,
            Student.admission_number,
            Section.name.label('section_name'),
            func.count(Attendance.id).label('total_days'),
            func.sum(case((Attendance.status == AttendanceStatus.PRESENT, 1), else_=0)).label('present_days'),
            func.sum(case((Attendance.status == AttendanceStatus.ABSENT, 1), else_=0)).label('absent_days'),
            func.sum(case((Attendance.status == AttendanceStatus.LATE, 1), else_=0)).label('late_days'),
            func.sum(case((Attendance.status == AttendanceStatus.HALF_DAY, 1), else_=0)).label('half_days')
        ).join(
            Attendance, Student.id == Attendance.student_id
        ).outerjoin(
            Section, Student.section_id == Section.id
        ).filter(
            Student.institution_id == institution_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date
        )
        
        if section_id:
            query = query.filter(Student.section_id == section_id)
        
        if subject_id:
            query = query.filter(Attendance.subject_id == subject_id)
        
        query = query.group_by(
            Student.id,
            Student.first_name,
            Student.last_name,
            Student.admission_number,
            Section.name
        )
        
        results = query.all()
        
        defaulters = []
        for row in results:
            if row.total_days:
                present_count = float(row.present_days or 0) + float(row.late_days or 0) * 0.5 + float(row.half_days or 0) * 0.5
                percentage = (present_count / float(row.total_days)) * 100
                
                if percentage < threshold_percentage:
                    defaulters.append({
                        'student_id': row.student_id,
                        'student_name': f"{row.first_name} {row.last_name}",
                        'admission_number': row.admission_number,
                        'section_name': row.section_name,
                        'total_days': row.total_days or 0,
                        'present_days': row.present_days or 0,
                        'absent_days': row.absent_days or 0,
                        'attendance_percentage': round(percentage, 2)
                    })
        
        return sorted(defaulters, key=lambda x: x['attendance_percentage'])

    def get_subject_wise_stats(
        self,
        institution_id: int,
        start_date: date,
        end_date: date,
        section_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        query = self.db.query(
            Subject.id.label('subject_id'),
            Subject.name.label('subject_name'),
            func.count(Attendance.id).label('total_days'),
            func.sum(case((Attendance.status == AttendanceStatus.PRESENT, 1), else_=0)).label('present_days'),
            func.sum(case((Attendance.status == AttendanceStatus.ABSENT, 1), else_=0)).label('absent_days'),
            func.sum(case((Attendance.status == AttendanceStatus.LATE, 1), else_=0)).label('late_days'),
            func.sum(case((Attendance.status == AttendanceStatus.HALF_DAY, 1), else_=0)).label('half_days')
        ).join(
            Attendance, Subject.id == Attendance.subject_id
        ).filter(
            Subject.institution_id == institution_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date
        )
        
        if section_id:
            query = query.filter(Attendance.section_id == section_id)
        
        query = query.group_by(Subject.id, Subject.name)
        
        results = query.all()
        
        stats = []
        for row in results:
            if row.total_days:
                present_count = float(row.present_days or 0) + float(row.late_days or 0) * 0.5 + float(row.half_days or 0) * 0.5
                percentage = (present_count / float(row.total_days)) * 100
            else:
                percentage = 0.0
            
            stats.append({
                'subject_id': row.subject_id,
                'subject_name': row.subject_name,
                'total_days': row.total_days or 0,
                'present_days': row.present_days or 0,
                'absent_days': row.absent_days or 0,
                'late_days': row.late_days or 0,
                'half_days': row.half_days or 0,
                'attendance_percentage': round(percentage, 2)
            })
        
        return stats


class AttendanceCorrectionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> AttendanceCorrection:
        correction = AttendanceCorrection(**kwargs)
        self.db.add(correction)
        self.db.flush()
        return correction

    def get_by_id(self, correction_id: int) -> Optional[AttendanceCorrection]:
        return self.db.query(AttendanceCorrection).filter(
            AttendanceCorrection.id == correction_id
        ).first()

    def list_by_institution(
        self,
        institution_id: int,
        status: Optional[CorrectionStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[AttendanceCorrection]:
        query = self.db.query(AttendanceCorrection).filter(
            AttendanceCorrection.institution_id == institution_id
        )
        
        if status:
            query = query.filter(AttendanceCorrection.status == status)
        
        return query.options(
            joinedload(AttendanceCorrection.attendance).joinedload(Attendance.student)
        ).order_by(AttendanceCorrection.created_at.desc()).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        status: Optional[CorrectionStatus] = None
    ) -> int:
        query = self.db.query(AttendanceCorrection).filter(
            AttendanceCorrection.institution_id == institution_id
        )
        
        if status:
            query = query.filter(AttendanceCorrection.status == status)
        
        return query.count()

    def update(self, correction: AttendanceCorrection, **kwargs) -> AttendanceCorrection:
        for key, value in kwargs.items():
            setattr(correction, key, value)
        self.db.flush()
        return correction

    def delete(self, correction: AttendanceCorrection) -> None:
        self.db.delete(correction)
        self.db.flush()


class AttendanceSummaryRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> AttendanceSummary:
        summary = AttendanceSummary(**kwargs)
        self.db.add(summary)
        self.db.flush()
        return summary

    def get_by_student_month_subject(
        self,
        student_id: int,
        year: int,
        month: int,
        subject_id: Optional[int] = None
    ) -> Optional[AttendanceSummary]:
        query = self.db.query(AttendanceSummary).filter(
            AttendanceSummary.student_id == student_id,
            AttendanceSummary.year == year,
            AttendanceSummary.month == month
        )
        
        if subject_id is None:
            query = query.filter(AttendanceSummary.subject_id.is_(None))
        else:
            query = query.filter(AttendanceSummary.subject_id == subject_id)
        
        return query.first()

    def list_by_student(
        self,
        student_id: int,
        year: Optional[int] = None,
        subject_id: Optional[int] = None
    ) -> List[AttendanceSummary]:
        query = self.db.query(AttendanceSummary).filter(
            AttendanceSummary.student_id == student_id
        )
        
        if year:
            query = query.filter(AttendanceSummary.year == year)
        
        if subject_id:
            query = query.filter(AttendanceSummary.subject_id == subject_id)
        
        return query.order_by(
            AttendanceSummary.year.desc(),
            AttendanceSummary.month.desc()
        ).all()

    def update(self, summary: AttendanceSummary, **kwargs) -> AttendanceSummary:
        for key, value in kwargs.items():
            setattr(summary, key, value)
        self.db.flush()
        return summary

    def delete(self, summary: AttendanceSummary) -> None:
        self.db.delete(summary)
        self.db.flush()

    def upsert_summary(
        self,
        student_id: int,
        year: int,
        month: int,
        subject_id: Optional[int],
        **kwargs
    ) -> AttendanceSummary:
        summary = self.get_by_student_month_subject(student_id, year, month, subject_id)
        
        if summary:
            return self.update(summary, **kwargs)
        else:
            return self.create(
                student_id=student_id,
                year=year,
                month=month,
                subject_id=subject_id,
                **kwargs
            )
