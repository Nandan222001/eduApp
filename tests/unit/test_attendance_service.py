import pytest
from datetime import date, datetime, timedelta
from unittest.mock import MagicMock, patch, PropertyMock
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.services.attendance_service import AttendanceService
from src.models.attendance import Attendance, AttendanceCorrection, AttendanceSummary, AttendanceStatus, CorrectionStatus
from src.models.student import Student
from src.models.academic import Section, Subject
from src.schemas.attendance import (
    AttendanceCreate,
    BulkAttendanceCreate,
    BulkAttendanceItem,
    AttendanceCorrectionCreate,
    AttendanceCorrectionReview
)


@pytest.mark.unit
class TestMarkAttendance:
    """Test mark_attendance (create_attendance) functionality"""
    
    def test_mark_attendance_with_valid_student_present(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test marking attendance with PRESENT status"""
        service = AttendanceService(db_session)
        
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.PRESENT,
            section_id=section.id,
            subject_id=subject.id,
            remarks="On time"
        )
        
        attendance = service.create_attendance(attendance_data)
        
        assert attendance is not None
        assert attendance.id is not None
        assert attendance.student_id == student.id
        assert attendance.status == AttendanceStatus.PRESENT
        assert attendance.date == date.today()
        assert attendance.remarks == "On time"
    
    def test_mark_attendance_with_valid_student_absent(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test marking attendance with ABSENT status"""
        service = AttendanceService(db_session)
        
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.ABSENT,
            section_id=section.id,
            subject_id=subject.id,
            remarks="Sick leave"
        )
        
        attendance = service.create_attendance(attendance_data)
        
        assert attendance is not None
        assert attendance.status == AttendanceStatus.ABSENT
        assert attendance.remarks == "Sick leave"
    
    def test_mark_attendance_with_valid_student_late(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test marking attendance with LATE status"""
        service = AttendanceService(db_session)
        
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.LATE,
            section_id=section.id,
            subject_id=subject.id,
            remarks="Arrived 30 minutes late"
        )
        
        attendance = service.create_attendance(attendance_data)
        
        assert attendance is not None
        assert attendance.status == AttendanceStatus.LATE
        assert attendance.remarks == "Arrived 30 minutes late"
    
    def test_mark_attendance_with_valid_student_half_day(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test marking attendance with HALF_DAY status"""
        service = AttendanceService(db_session)
        
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.HALF_DAY,
            section_id=section.id,
            subject_id=subject.id,
            remarks="Left early for appointment"
        )
        
        attendance = service.create_attendance(attendance_data)
        
        assert attendance is not None
        assert attendance.status == AttendanceStatus.HALF_DAY
        assert attendance.remarks == "Left early for appointment"
    
    def test_mark_attendance_duplicate_prevention(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test duplicate marking prevention for same student, date, and subject"""
        service = AttendanceService(db_session)
        
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.PRESENT,
            section_id=section.id,
            subject_id=subject.id
        )
        
        # First marking should succeed
        service.create_attendance(attendance_data)
        
        # Second marking with same data should fail
        with pytest.raises(HTTPException) as exc_info:
            service.create_attendance(attendance_data)
        
        assert exc_info.value.status_code == 400
        assert "already marked" in exc_info.value.detail.lower()
    
    def test_mark_attendance_different_subjects_same_day(
        self, db_session: Session, institution, student, section
    ):
        """Test marking attendance for same student on same day but different subjects"""
        service = AttendanceService(db_session)
        
        subject1 = Subject(
            institution_id=institution.id,
            grade_id=section.grade_id,
            name="Mathematics",
            code="MATH",
            is_active=True
        )
        subject2 = Subject(
            institution_id=institution.id,
            grade_id=section.grade_id,
            name="Science",
            code="SCI",
            is_active=True
        )
        db_session.add_all([subject1, subject2])
        db_session.commit()
        db_session.refresh(subject1)
        db_session.refresh(subject2)
        
        # Mark attendance for first subject
        attendance1_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.PRESENT,
            section_id=section.id,
            subject_id=subject1.id
        )
        attendance1 = service.create_attendance(attendance1_data)
        
        # Mark attendance for second subject
        attendance2_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.LATE,
            section_id=section.id,
            subject_id=subject2.id
        )
        attendance2 = service.create_attendance(attendance2_data)
        
        assert attendance1.subject_id == subject1.id
        assert attendance2.subject_id == subject2.id
        assert attendance1.status == AttendanceStatus.PRESENT
        assert attendance2.status == AttendanceStatus.LATE
    
    def test_mark_attendance_without_remarks(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test marking attendance without optional remarks"""
        service = AttendanceService(db_session)
        
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.PRESENT,
            section_id=section.id,
            subject_id=subject.id
        )
        
        attendance = service.create_attendance(attendance_data)
        
        assert attendance is not None
        assert attendance.remarks is None
    
    def test_mark_attendance_with_marked_by_id(
        self, db_session: Session, institution, student, subject, section, teacher_user
    ):
        """Test marking attendance with marked_by_id"""
        service = AttendanceService(db_session)
        
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.PRESENT,
            section_id=section.id,
            subject_id=subject.id,
            marked_by_id=teacher_user.id
        )
        
        attendance = service.create_attendance(attendance_data)
        
        assert attendance is not None
        assert attendance.marked_by_id == teacher_user.id


@pytest.mark.unit
class TestBulkMarkAttendance:
    """Test bulk_mark_attendance functionality"""
    
    def test_bulk_mark_attendance_for_class_roster(
        self, db_session: Session, institution, section, subject, academic_year, student_role
    ):
        """Test bulk marking attendance for entire class"""
        service = AttendanceService(db_session)
        
        # Create multiple students
        students = []
        for i in range(5):
            from src.models.user import User
            user = User(
                username=f"student{i}",
                email=f"student{i}@test.com",
                hashed_password="hash",
                institution_id=institution.id,
                role_id=student_role.id,
                is_active=True
            )
            db_session.add(user)
            db_session.flush()
            
            student = Student(
                institution_id=institution.id,
                user_id=user.id,
                admission_number=f"ADM{i:03d}",
                first_name=f"Student{i}",
                last_name="Test",
                section_id=section.id,
                academic_year_id=academic_year.id,
                date_of_birth=date(2008, 1, 1),
                date_of_admission=date(2020, 1, 1),
                gender="Male",
                is_active=True
            )
            db_session.add(student)
            students.append(student)
        db_session.commit()
        
        bulk_data = BulkAttendanceCreate(
            date=date.today(),
            section_id=section.id,
            subject_id=subject.id,
            attendances=[
                BulkAttendanceItem(student_id=students[0].id, status=AttendanceStatus.PRESENT),
                BulkAttendanceItem(student_id=students[1].id, status=AttendanceStatus.PRESENT),
                BulkAttendanceItem(student_id=students[2].id, status=AttendanceStatus.ABSENT),
                BulkAttendanceItem(student_id=students[3].id, status=AttendanceStatus.LATE),
                BulkAttendanceItem(student_id=students[4].id, status=AttendanceStatus.HALF_DAY),
            ]
        )
        
        result = service.bulk_mark_attendance(institution.id, bulk_data)
        
        assert result["total"] == 5
        assert result["success"] == 5
        assert result["failed"] == 0
        assert len(result["errors"]) == 0
    
    def test_bulk_mark_attendance_with_mixed_statuses(
        self, db_session: Session, institution, section, subject, academic_year, student_role
    ):
        """Test bulk marking with different attendance statuses"""
        service = AttendanceService(db_session)
        
        students = []
        for i in range(3):
            from src.models.user import User
            user = User(
                username=f"bulkstudent{i}",
                email=f"bulkstudent{i}@test.com",
                hashed_password="hash",
                institution_id=institution.id,
                role_id=student_role.id,
                is_active=True
            )
            db_session.add(user)
            db_session.flush()
            
            student = Student(
                institution_id=institution.id,
                user_id=user.id,
                admission_number=f"BULK{i:03d}",
                first_name=f"BulkStudent{i}",
                last_name="Test",
                section_id=section.id,
                academic_year_id=academic_year.id,
                date_of_birth=date(2008, 1, 1),
                date_of_admission=date(2020, 1, 1),
                gender="Female",
                is_active=True
            )
            db_session.add(student)
            students.append(student)
        db_session.commit()
        
        bulk_data = BulkAttendanceCreate(
            date=date.today(),
            section_id=section.id,
            subject_id=subject.id,
            attendances=[
                BulkAttendanceItem(student_id=students[0].id, status=AttendanceStatus.PRESENT),
                BulkAttendanceItem(student_id=students[1].id, status=AttendanceStatus.ABSENT),
                BulkAttendanceItem(student_id=students[2].id, status=AttendanceStatus.LATE),
            ]
        )
        
        result = service.bulk_mark_attendance(institution.id, bulk_data)
        
        assert result["success"] == 3
        
        # Verify each status was recorded correctly
        att1 = service.attendance_repo.get_by_student_date_subject(
            students[0].id, date.today(), subject.id
        )
        att2 = service.attendance_repo.get_by_student_date_subject(
            students[1].id, date.today(), subject.id
        )
        att3 = service.attendance_repo.get_by_student_date_subject(
            students[2].id, date.today(), subject.id
        )
        
        assert att1.status == AttendanceStatus.PRESENT
        assert att2.status == AttendanceStatus.ABSENT
        assert att3.status == AttendanceStatus.LATE
    
    def test_bulk_mark_attendance_duplicate_prevention(
        self, db_session: Session, institution, section, subject, student
    ):
        """Test bulk marking prevents duplicates"""
        service = AttendanceService(db_session)
        
        bulk_data = BulkAttendanceCreate(
            date=date.today(),
            section_id=section.id,
            subject_id=subject.id,
            attendances=[
                BulkAttendanceItem(student_id=student.id, status=AttendanceStatus.PRESENT),
            ]
        )
        
        # First bulk marking
        result1 = service.bulk_mark_attendance(institution.id, bulk_data)
        assert result1["success"] == 1
        
        # Second bulk marking with same data
        result2 = service.bulk_mark_attendance(institution.id, bulk_data)
        assert result2["success"] == 0
        assert result2["failed"] == 1
        assert len(result2["errors"]) == 1
        assert "already marked" in result2["errors"][0]["error"].lower()
    
    def test_bulk_mark_attendance_partial_failure(
        self, db_session: Session, institution, section, subject, student, student_role, academic_year
    ):
        """Test bulk marking with some failures doesn't rollback successful ones"""
        service = AttendanceService(db_session)
        
        # Create second student
        from src.models.user import User
        user2 = User(
            username="student_partial",
            email="student_partial@test.com",
            hashed_password="hash",
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True
        )
        db_session.add(user2)
        db_session.flush()
        
        student2 = Student(
            institution_id=institution.id,
            user_id=user2.id,
            admission_number="PART001",
            first_name="Partial",
            last_name="Test",
            section_id=section.id,
            academic_year_id=academic_year.id,
            date_of_birth=date(2008, 1, 1),
            date_of_admission=date(2020, 1, 1),
            gender="Male",
            is_active=True
        )
        db_session.add(student2)
        db_session.commit()
        db_session.refresh(student2)
        
        # Mark first student's attendance
        first_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.PRESENT,
            section_id=section.id,
            subject_id=subject.id
        )
        service.create_attendance(first_data)
        
        # Try bulk marking with one duplicate and one new
        bulk_data = BulkAttendanceCreate(
            date=date.today(),
            section_id=section.id,
            subject_id=subject.id,
            attendances=[
                BulkAttendanceItem(student_id=student.id, status=AttendanceStatus.PRESENT),  # Duplicate
                BulkAttendanceItem(student_id=student2.id, status=AttendanceStatus.PRESENT),  # New
            ]
        )
        
        result = service.bulk_mark_attendance(institution.id, bulk_data)
        
        assert result["total"] == 2
        assert result["success"] == 1
        assert result["failed"] == 1
        assert len(result["errors"]) == 1


@pytest.mark.unit
class TestCalculateAttendancePercentage:
    """Test calculate_attendance_percentage (get_student_attendance_stats) functionality"""
    
    def test_calculate_attendance_percentage_with_date_range(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test calculating attendance percentage for a date range"""
        service = AttendanceService(db_session)
        
        start_date = date(2024, 1, 1)
        end_date = date(2024, 1, 10)
        
        # Create attendance records
        for i in range(10):
            att_date = start_date + timedelta(days=i)
            status = AttendanceStatus.PRESENT if i < 8 else AttendanceStatus.ABSENT
            
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=att_date,
                status=status,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        stats = service.get_student_attendance_stats(
            student_id=student.id,
            start_date=start_date,
            end_date=end_date,
            subject_id=subject.id
        )
        
        assert stats["total_days"] == 10
        assert stats["present_days"] == 8
        assert stats["absent_days"] == 2
        assert stats["attendance_percentage"] == 80.0
    
    def test_calculate_attendance_percentage_with_late_and_half_day(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test percentage calculation with late and half_day statuses"""
        service = AttendanceService(db_session)
        
        start_date = date(2024, 1, 1)
        
        # Create mixed attendance records
        statuses = [
            AttendanceStatus.PRESENT,
            AttendanceStatus.PRESENT,
            AttendanceStatus.LATE,
            AttendanceStatus.LATE,
            AttendanceStatus.HALF_DAY,
            AttendanceStatus.HALF_DAY,
            AttendanceStatus.ABSENT,
            AttendanceStatus.ABSENT,
        ]
        
        for i, status in enumerate(statuses):
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=start_date + timedelta(days=i),
                status=status,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        end_date = start_date + timedelta(days=len(statuses)-1)
        stats = service.get_student_attendance_stats(
            student_id=student.id,
            start_date=start_date,
            end_date=end_date,
            subject_id=subject.id
        )
        
        assert stats["total_days"] == 8
        assert stats["present_days"] == 2
        assert stats["late_days"] == 2
        assert stats["half_days"] == 2
        assert stats["absent_days"] == 2
        # Percentage = (2 + 2*0.5 + 2*0.5) / 8 * 100 = 50%
        assert stats["attendance_percentage"] == 50.0
    
    def test_calculate_attendance_percentage_no_records(
        self, db_session: Session, student, subject
    ):
        """Test percentage calculation with no attendance records"""
        service = AttendanceService(db_session)
        
        stats = service.get_student_attendance_stats(
            student_id=student.id,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            subject_id=subject.id
        )
        
        assert stats["total_days"] == 0
        assert stats["attendance_percentage"] == 0.0
    
    def test_calculate_attendance_percentage_all_present(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test percentage with all present days"""
        service = AttendanceService(db_session)
        
        start_date = date(2024, 1, 1)
        
        for i in range(5):
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=start_date + timedelta(days=i),
                status=AttendanceStatus.PRESENT,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        stats = service.get_student_attendance_stats(
            student_id=student.id,
            start_date=start_date,
            end_date=start_date + timedelta(days=4),
            subject_id=subject.id
        )
        
        assert stats["attendance_percentage"] == 100.0
    
    def test_calculate_attendance_percentage_all_absent(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test percentage with all absent days"""
        service = AttendanceService(db_session)
        
        start_date = date(2024, 1, 1)
        
        for i in range(5):
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=start_date + timedelta(days=i),
                status=AttendanceStatus.ABSENT,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        stats = service.get_student_attendance_stats(
            student_id=student.id,
            start_date=start_date,
            end_date=start_date + timedelta(days=4),
            subject_id=subject.id
        )
        
        assert stats["attendance_percentage"] == 0.0


@pytest.mark.unit
class TestIdentifyDefaulters:
    """Test identify_defaulters functionality"""
    
    def test_identify_defaulters_with_threshold_75(
        self, db_session: Session, institution, section, subject, academic_year, student_role
    ):
        """Test identifying defaulters with 75% threshold"""
        service = AttendanceService(db_session)
        
        # Create students with different attendance percentages
        students_data = []
        for i in range(3):
            from src.models.user import User
            user = User(
                username=f"defaulter_test_{i}",
                email=f"defaulter{i}@test.com",
                hashed_password="hash",
                institution_id=institution.id,
                role_id=student_role.id,
                is_active=True
            )
            db_session.add(user)
            db_session.flush()
            
            student = Student(
                institution_id=institution.id,
                user_id=user.id,
                admission_number=f"DEF{i:03d}",
                first_name=f"Defaulter{i}",
                last_name="Test",
                section_id=section.id,
                academic_year_id=academic_year.id,
                date_of_birth=date(2008, 1, 1),
                date_of_admission=date(2020, 1, 1),
                gender="Male",
                is_active=True
            )
            db_session.add(student)
            db_session.flush()
            students_data.append(student)
        
        db_session.commit()
        
        start_date = date(2024, 1, 1)
        
        # Student 0: 90% attendance (9 present out of 10)
        for i in range(10):
            status = AttendanceStatus.PRESENT if i < 9 else AttendanceStatus.ABSENT
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=students_data[0].id,
                date=start_date + timedelta(days=i),
                status=status,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        # Student 1: 60% attendance (6 present out of 10) - defaulter
        for i in range(10):
            status = AttendanceStatus.PRESENT if i < 6 else AttendanceStatus.ABSENT
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=students_data[1].id,
                date=start_date + timedelta(days=i),
                status=status,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        # Student 2: 70% attendance (7 present out of 10) - defaulter
        for i in range(10):
            status = AttendanceStatus.PRESENT if i < 7 else AttendanceStatus.ABSENT
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=students_data[2].id,
                date=start_date + timedelta(days=i),
                status=status,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        defaulters = service.get_defaulters(
            institution_id=institution.id,
            start_date=start_date,
            end_date=start_date + timedelta(days=9),
            threshold_percentage=75.0,
            subject_id=subject.id
        )
        
        assert len(defaulters) == 2
        assert defaulters[0].attendance_percentage < 75.0
        assert defaulters[1].attendance_percentage < 75.0
        # Check they are sorted by percentage
        assert defaulters[0].attendance_percentage <= defaulters[1].attendance_percentage
    
    def test_identify_defaulters_with_section_filter(
        self, db_session: Session, institution, section, subject, academic_year, student_role, grade
    ):
        """Test identifying defaulters filtered by section"""
        service = AttendanceService(db_session)
        
        # Create another section
        section2 = Section(
            institution_id=institution.id,
            grade_id=grade.id,
            name="Section B",
            capacity=40,
            is_active=True
        )
        db_session.add(section2)
        db_session.commit()
        db_session.refresh(section2)
        
        # Create student in section1 with low attendance
        from src.models.user import User
        user1 = User(
            username="section1_student",
            email="section1@test.com",
            hashed_password="hash",
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True
        )
        db_session.add(user1)
        db_session.flush()
        
        student1 = Student(
            institution_id=institution.id,
            user_id=user1.id,
            admission_number="SEC1001",
            first_name="Section1",
            last_name="Student",
            section_id=section.id,
            academic_year_id=academic_year.id,
            date_of_birth=date(2008, 1, 1),
            date_of_admission=date(2020, 1, 1),
            gender="Male",
            is_active=True
        )
        db_session.add(student1)
        db_session.commit()
        db_session.refresh(student1)
        
        # Create student in section2 with low attendance
        user2 = User(
            username="section2_student",
            email="section2@test.com",
            hashed_password="hash",
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True
        )
        db_session.add(user2)
        db_session.flush()
        
        student2 = Student(
            institution_id=institution.id,
            user_id=user2.id,
            admission_number="SEC2001",
            first_name="Section2",
            last_name="Student",
            section_id=section2.id,
            academic_year_id=academic_year.id,
            date_of_birth=date(2008, 1, 1),
            date_of_admission=date(2020, 1, 1),
            gender="Female",
            is_active=True
        )
        db_session.add(student2)
        db_session.commit()
        db_session.refresh(student2)
        
        start_date = date(2024, 1, 1)
        
        # Mark low attendance for both
        for student in [student1, student2]:
            for i in range(10):
                status = AttendanceStatus.PRESENT if i < 5 else AttendanceStatus.ABSENT
                attendance_data = AttendanceCreate(
                    institution_id=institution.id,
                    student_id=student.id,
                    date=start_date + timedelta(days=i),
                    status=status,
                    section_id=student.section_id,
                    subject_id=subject.id
                )
                service.create_attendance(attendance_data)
        
        # Get defaulters for section1 only
        defaulters = service.get_defaulters(
            institution_id=institution.id,
            start_date=start_date,
            end_date=start_date + timedelta(days=9),
            threshold_percentage=75.0,
            section_id=section.id,
            subject_id=subject.id
        )
        
        assert len(defaulters) == 1
        assert defaulters[0].student_id == student1.id
    
    def test_identify_defaulters_no_defaulters(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test when no students are below threshold"""
        service = AttendanceService(db_session)
        
        start_date = date(2024, 1, 1)
        
        # Mark 100% attendance
        for i in range(10):
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=start_date + timedelta(days=i),
                status=AttendanceStatus.PRESENT,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        defaulters = service.get_defaulters(
            institution_id=institution.id,
            start_date=start_date,
            end_date=start_date + timedelta(days=9),
            threshold_percentage=75.0,
            subject_id=subject.id
        )
        
        assert len(defaulters) == 0


@pytest.mark.unit
class TestGetAttendanceHistory:
    """Test get_attendance_history (list_attendances) functionality"""
    
    def test_get_attendance_history_with_student_filter(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test getting attendance history filtered by student"""
        service = AttendanceService(db_session)
        
        # Create attendance records
        for i in range(5):
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=date.today() - timedelta(days=i),
                status=AttendanceStatus.PRESENT,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        attendances, total = service.list_attendances(
            institution_id=institution.id,
            student_id=student.id
        )
        
        assert total == 5
        assert len(attendances) == 5
        assert all(att.student_id == student.id for att in attendances)
    
    def test_get_attendance_history_with_date_range_filter(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test getting attendance history with date range filter"""
        service = AttendanceService(db_session)
        
        base_date = date(2024, 1, 15)
        
        # Create attendance records across different dates
        for i in range(30):
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=base_date - timedelta(days=i),
                status=AttendanceStatus.PRESENT,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        # Query for specific date range
        start_date = date(2024, 1, 10)
        end_date = date(2024, 1, 15)
        
        attendances, total = service.list_attendances(
            institution_id=institution.id,
            student_id=student.id,
            start_date=start_date,
            end_date=end_date
        )
        
        assert total == 6  # Days 10-15 inclusive
        assert all(start_date <= att.date <= end_date for att in attendances)
    
    def test_get_attendance_history_with_status_filter(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test getting attendance history filtered by status"""
        service = AttendanceService(db_session)
        
        # Create mixed attendance records
        statuses = [
            AttendanceStatus.PRESENT,
            AttendanceStatus.ABSENT,
            AttendanceStatus.LATE,
            AttendanceStatus.PRESENT,
            AttendanceStatus.ABSENT,
        ]
        
        for i, status in enumerate(statuses):
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=date.today() - timedelta(days=i),
                status=status,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        # Query for only ABSENT records
        attendances, total = service.list_attendances(
            institution_id=institution.id,
            student_id=student.id,
            status=AttendanceStatus.ABSENT
        )
        
        assert total == 2
        assert all(att.status == AttendanceStatus.ABSENT for att in attendances)
    
    def test_get_attendance_history_with_section_filter(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test getting attendance history filtered by section"""
        service = AttendanceService(db_session)
        
        # Create attendance records
        for i in range(3):
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=date.today() - timedelta(days=i),
                status=AttendanceStatus.PRESENT,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        attendances, total = service.list_attendances(
            institution_id=institution.id,
            section_id=section.id
        )
        
        assert total >= 3
        assert all(att.section_id == section.id for att in attendances)
    
    def test_get_attendance_history_with_subject_filter(
        self, db_session: Session, institution, student, section, grade
    ):
        """Test getting attendance history filtered by subject"""
        service = AttendanceService(db_session)
        
        # Create two subjects
        subject1 = Subject(
            institution_id=institution.id,
            grade_id=grade.id,
            name="Math",
            code="MATH",
            is_active=True
        )
        subject2 = Subject(
            institution_id=institution.id,
            grade_id=grade.id,
            name="English",
            code="ENG",
            is_active=True
        )
        db_session.add_all([subject1, subject2])
        db_session.commit()
        db_session.refresh(subject1)
        db_session.refresh(subject2)
        
        # Create attendance for subject1
        for i in range(3):
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=date.today() - timedelta(days=i),
                status=AttendanceStatus.PRESENT,
                section_id=section.id,
                subject_id=subject1.id
            )
            service.create_attendance(attendance_data)
        
        # Create attendance for subject2
        for i in range(2):
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=date.today() - timedelta(days=i+10),
                status=AttendanceStatus.PRESENT,
                section_id=section.id,
                subject_id=subject2.id
            )
            service.create_attendance(attendance_data)
        
        attendances, total = service.list_attendances(
            institution_id=institution.id,
            subject_id=subject1.id
        )
        
        assert total == 3
        assert all(att.subject_id == subject1.id for att in attendances)
    
    def test_get_attendance_history_with_pagination(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test getting attendance history with pagination"""
        service = AttendanceService(db_session)
        
        # Create 20 attendance records
        for i in range(20):
            attendance_data = AttendanceCreate(
                institution_id=institution.id,
                student_id=student.id,
                date=date.today() - timedelta(days=i),
                status=AttendanceStatus.PRESENT,
                section_id=section.id,
                subject_id=subject.id
            )
            service.create_attendance(attendance_data)
        
        # Get first page
        attendances_page1, total = service.list_attendances(
            institution_id=institution.id,
            student_id=student.id,
            skip=0,
            limit=10
        )
        
        # Get second page
        attendances_page2, _ = service.list_attendances(
            institution_id=institution.id,
            student_id=student.id,
            skip=10,
            limit=10
        )
        
        assert total == 20
        assert len(attendances_page1) == 10
        assert len(attendances_page2) == 10
        # Ensure pages don't overlap
        page1_ids = {att.id for att in attendances_page1}
        page2_ids = {att.id for att in attendances_page2}
        assert len(page1_ids.intersection(page2_ids)) == 0


@pytest.mark.unit
class TestAttendanceCorrectionWorkflow:
    """Test attendance_correction_workflow functionality"""
    
    def test_request_correction(
        self, db_session: Session, institution, student, subject, section, teacher_user
    ):
        """Test requesting an attendance correction"""
        service = AttendanceService(db_session)
        
        # Create attendance record
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.ABSENT,
            section_id=section.id,
            subject_id=subject.id
        )
        attendance = service.create_attendance(attendance_data)
        
        # Request correction
        correction_data = AttendanceCorrectionCreate(
            institution_id=institution.id,
            attendance_id=attendance.id,
            requested_by_id=teacher_user.id,
            new_status=AttendanceStatus.PRESENT,
            reason="Student was actually present, marked wrong by mistake"
        )
        
        correction = service.request_correction(correction_data)
        
        assert correction is not None
        assert correction.id is not None
        assert correction.attendance_id == attendance.id
        assert correction.old_status == AttendanceStatus.ABSENT
        assert correction.new_status == AttendanceStatus.PRESENT
        assert correction.status == CorrectionStatus.PENDING
        assert correction.reason == "Student was actually present, marked wrong by mistake"
    
    def test_approve_correction(
        self, db_session: Session, institution, student, subject, section, teacher_user, admin_user
    ):
        """Test approving an attendance correction"""
        service = AttendanceService(db_session)
        
        # Create attendance record
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.ABSENT,
            section_id=section.id,
            subject_id=subject.id
        )
        attendance = service.create_attendance(attendance_data)
        
        # Request correction
        correction_data = AttendanceCorrectionCreate(
            institution_id=institution.id,
            attendance_id=attendance.id,
            requested_by_id=teacher_user.id,
            new_status=AttendanceStatus.PRESENT,
            reason="Marking error"
        )
        correction = service.request_correction(correction_data)
        
        # Approve correction
        review_data = AttendanceCorrectionReview(
            status=CorrectionStatus.APPROVED,
            review_remarks="Correction approved"
        )
        
        updated_correction = service.review_correction(
            correction.id,
            review_data,
            reviewed_by_id=admin_user.id
        )
        
        assert updated_correction.status == CorrectionStatus.APPROVED
        assert updated_correction.reviewed_by_id == admin_user.id
        assert updated_correction.review_remarks == "Correction approved"
        assert updated_correction.reviewed_at is not None
        
        # Verify attendance record was updated
        db_session.refresh(attendance)
        assert attendance.status == AttendanceStatus.PRESENT
    
    def test_reject_correction(
        self, db_session: Session, institution, student, subject, section, teacher_user, admin_user
    ):
        """Test rejecting an attendance correction"""
        service = AttendanceService(db_session)
        
        # Create attendance record
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.ABSENT,
            section_id=section.id,
            subject_id=subject.id
        )
        attendance = service.create_attendance(attendance_data)
        original_status = attendance.status
        
        # Request correction
        correction_data = AttendanceCorrectionCreate(
            institution_id=institution.id,
            attendance_id=attendance.id,
            requested_by_id=teacher_user.id,
            new_status=AttendanceStatus.PRESENT,
            reason="Questionable reason"
        )
        correction = service.request_correction(correction_data)
        
        # Reject correction
        review_data = AttendanceCorrectionReview(
            status=CorrectionStatus.REJECTED,
            review_remarks="Insufficient evidence for correction"
        )
        
        updated_correction = service.review_correction(
            correction.id,
            review_data,
            reviewed_by_id=admin_user.id
        )
        
        assert updated_correction.status == CorrectionStatus.REJECTED
        assert updated_correction.review_remarks == "Insufficient evidence for correction"
        
        # Verify attendance record was NOT updated
        db_session.refresh(attendance)
        assert attendance.status == original_status
    
    def test_correction_already_reviewed_error(
        self, db_session: Session, institution, student, subject, section, teacher_user, admin_user
    ):
        """Test that reviewing an already reviewed correction raises error"""
        service = AttendanceService(db_session)
        
        # Create attendance and correction
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.ABSENT,
            section_id=section.id,
            subject_id=subject.id
        )
        attendance = service.create_attendance(attendance_data)
        
        correction_data = AttendanceCorrectionCreate(
            institution_id=institution.id,
            attendance_id=attendance.id,
            requested_by_id=teacher_user.id,
            new_status=AttendanceStatus.PRESENT,
            reason="Test"
        )
        correction = service.request_correction(correction_data)
        
        # First review
        review_data = AttendanceCorrectionReview(
            status=CorrectionStatus.APPROVED,
            review_remarks="Approved"
        )
        service.review_correction(correction.id, review_data, reviewed_by_id=admin_user.id)
        
        # Try to review again
        with pytest.raises(HTTPException) as exc_info:
            review_data2 = AttendanceCorrectionReview(
                status=CorrectionStatus.REJECTED,
                review_remarks="Changed mind"
            )
            service.review_correction(correction.id, review_data2, reviewed_by_id=admin_user.id)
        
        assert exc_info.value.status_code == 400
        assert "already reviewed" in exc_info.value.detail.lower()
    
    def test_correction_nonexistent_attendance_error(
        self, db_session: Session, institution, teacher_user
    ):
        """Test requesting correction for non-existent attendance raises error"""
        service = AttendanceService(db_session)
        
        correction_data = AttendanceCorrectionCreate(
            institution_id=institution.id,
            attendance_id=99999,  # Non-existent
            requested_by_id=teacher_user.id,
            new_status=AttendanceStatus.PRESENT,
            reason="Test"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            service.request_correction(correction_data)
        
        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail.lower()
    
    def test_correction_nonexistent_correction_error(
        self, db_session: Session, admin_user
    ):
        """Test reviewing non-existent correction raises error"""
        service = AttendanceService(db_session)
        
        review_data = AttendanceCorrectionReview(
            status=CorrectionStatus.APPROVED,
            review_remarks="Test"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            service.review_correction(99999, review_data, reviewed_by_id=admin_user.id)
        
        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail.lower()


@pytest.mark.unit
class TestValidationAndErrorHandling:
    """Test validation and error handling"""
    
    def test_mark_attendance_invalid_student_id(
        self, db_session: Session, institution, subject, section
    ):
        """Test marking attendance with invalid student ID"""
        service = AttendanceService(db_session)
        
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=99999,  # Non-existent
            date=date.today(),
            status=AttendanceStatus.PRESENT,
            section_id=section.id,
            subject_id=subject.id
        )
        
        # This should fail at DB level due to foreign key constraint
        from sqlalchemy.exc import IntegrityError
        with pytest.raises(IntegrityError):
            service.create_attendance(attendance_data)
            db_session.commit()
    
    def test_get_attendance_nonexistent_id(self, db_session: Session):
        """Test getting attendance with non-existent ID returns None"""
        service = AttendanceService(db_session)
        
        attendance = service.get_attendance(99999)
        
        assert attendance is None
    
    def test_update_attendance_nonexistent_id(self, db_session: Session):
        """Test updating non-existent attendance returns None"""
        service = AttendanceService(db_session)
        from src.schemas.attendance import AttendanceUpdate
        
        update_data = AttendanceUpdate(
            status=AttendanceStatus.PRESENT
        )
        
        result = service.update_attendance(99999, update_data)
        
        assert result is None
    
    def test_delete_attendance_nonexistent_id(self, db_session: Session):
        """Test deleting non-existent attendance returns False"""
        service = AttendanceService(db_session)
        
        result = service.delete_attendance(99999)
        
        assert result is False
    
    def test_get_student_detailed_report_nonexistent_student(
        self, db_session: Session
    ):
        """Test getting detailed report for non-existent student raises error"""
        service = AttendanceService(db_session)
        
        with pytest.raises(HTTPException) as exc_info:
            service.get_student_detailed_report(
                student_id=99999,
                start_date=date(2024, 1, 1),
                end_date=date(2024, 1, 31)
            )
        
        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail.lower()
    
    def test_list_corrections_with_status_filter(
        self, db_session: Session, institution, student, subject, section, teacher_user
    ):
        """Test listing corrections filtered by status"""
        service = AttendanceService(db_session)
        
        # Create attendance
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            date=date.today(),
            status=AttendanceStatus.ABSENT,
            section_id=section.id,
            subject_id=subject.id
        )
        attendance = service.create_attendance(attendance_data)
        
        # Create correction
        correction_data = AttendanceCorrectionCreate(
            institution_id=institution.id,
            attendance_id=attendance.id,
            requested_by_id=teacher_user.id,
            new_status=AttendanceStatus.PRESENT,
            reason="Test"
        )
        service.request_correction(correction_data)
        
        # List pending corrections
        corrections, total = service.list_corrections(
            institution_id=institution.id,
            status=CorrectionStatus.PENDING
        )
        
        assert total >= 1
        assert all(c.status == CorrectionStatus.PENDING for c in corrections)
    
    def test_bulk_mark_attendance_empty_list(
        self, db_session: Session, institution, section, subject
    ):
        """Test bulk marking with empty attendance list"""
        service = AttendanceService(db_session)
        
        bulk_data = BulkAttendanceCreate(
            date=date.today(),
            section_id=section.id,
            subject_id=subject.id,
            attendances=[]
        )
        
        result = service.bulk_mark_attendance(institution.id, bulk_data)
        
        assert result["total"] == 0
        assert result["success"] == 0
        assert result["failed"] == 0
