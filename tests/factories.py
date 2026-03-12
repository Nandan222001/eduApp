"""
Test data factories for creating test objects.
"""
from datetime import datetime, timedelta
from typing import Optional
import factory
from factory import Factory, Faker, SubFactory, LazyAttribute
from faker import Faker as FakerInstance

from src.models.user import User
from src.models.institution import Institution
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.academic import AcademicYear, Grade, Section, Subject
from src.models.assignment import Assignment, Submission
from src.models.attendance import Attendance, AttendanceStatus
from src.utils.security import get_password_hash

fake = FakerInstance()


class InstitutionFactory(Factory):
    """Factory for creating Institution objects."""
    
    class Meta:
        model = Institution

    name = Faker('company')
    short_name = LazyAttribute(lambda obj: obj.name[:10])
    code = Faker('random_int', min=1000, max=9999)
    email = Faker('company_email')
    phone = Faker('phone_number')
    address = Faker('street_address')
    city = Faker('city')
    state = Faker('state')
    country = 'Test Country'
    postal_code = Faker('postcode')
    website = Faker('url')
    is_active = True


class UserFactory(Factory):
    """Factory for creating User objects."""
    
    class Meta:
        model = User

    username = Faker('user_name')
    email = Faker('email')
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    hashed_password = LazyAttribute(lambda _: get_password_hash('password123'))
    is_active = True
    is_superuser = False


class AcademicYearFactory(Factory):
    """Factory for creating AcademicYear objects."""
    
    class Meta:
        model = AcademicYear

    name = LazyAttribute(lambda _: f"{datetime.now().year}-{datetime.now().year + 1}")
    start_date = LazyAttribute(lambda _: datetime.now().date())
    end_date = LazyAttribute(lambda _: (datetime.now() + timedelta(days=365)).date())
    is_current = True
    is_active = True


class GradeFactory(Factory):
    """Factory for creating Grade objects."""
    
    class Meta:
        model = Grade

    name = Faker('random_element', elements=['Grade 1', 'Grade 2', 'Grade 10'])
    display_order = Faker('random_int', min=1, max=12)
    is_active = True


class SectionFactory(Factory):
    """Factory for creating Section objects."""
    
    class Meta:
        model = Section

    name = Faker('random_element', elements=['Section A', 'Section B', 'Section C'])
    capacity = Faker('random_int', min=30, max=50)
    is_active = True


class SubjectFactory(Factory):
    """Factory for creating Subject objects."""
    
    class Meta:
        model = Subject

    name = Faker('random_element', elements=['Mathematics', 'Science', 'English'])
    code = Faker('random_element', elements=['MATH10', 'SCI10', 'ENG10'])
    description = Faker('sentence')
    is_active = True


class StudentFactory(Factory):
    """Factory for creating Student objects."""
    
    class Meta:
        model = Student

    admission_number = Faker('random_int', min=1000, max=9999)
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    email = Faker('email')
    date_of_birth = LazyAttribute(lambda _: (datetime.now() - timedelta(days=5000)).date())
    date_of_admission = LazyAttribute(lambda _: datetime.now().date())
    gender = Faker('random_element', elements=['Male', 'Female', 'Other'])
    blood_group = Faker('random_element', elements=['A+', 'B+', 'O+', 'AB+'])
    is_active = True


class TeacherFactory(Factory):
    """Factory for creating Teacher objects."""
    
    class Meta:
        model = Teacher

    employee_id = Faker('random_int', min=1000, max=9999)
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    email = Faker('email')
    phone = Faker('phone_number')
    date_of_birth = LazyAttribute(lambda _: (datetime.now() - timedelta(days=10000)).date())
    date_of_joining = LazyAttribute(lambda _: datetime.now().date())
    qualification = 'M.Sc'
    specialization = 'Mathematics'
    is_active = True


class AssignmentFactory(Factory):
    """Factory for creating Assignment objects."""
    
    class Meta:
        model = Assignment

    title = Faker('sentence', nb_words=4)
    description = Faker('paragraph')
    due_date = LazyAttribute(lambda _: datetime.now() + timedelta(days=7))
    total_marks = Faker('random_int', min=50, max=100)
    instructions = Faker('paragraph')
    status = 'active'


class SubmissionFactory(Factory):
    """Factory for creating Submission objects."""
    
    class Meta:
        model = Submission

    remarks = Faker('sentence')
    status = 'submitted'
    submission_date = LazyAttribute(lambda _: datetime.now())


class AttendanceFactory(Factory):
    """Factory for creating Attendance objects."""
    
    class Meta:
        model = Attendance

    date = LazyAttribute(lambda _: datetime.now().date())
    status = AttendanceStatus.PRESENT
    period = Faker('random_int', min=1, max=8)
    remarks = Faker('sentence')


def create_test_institution(db_session, **kwargs):
    """Create a test institution with defaults."""
    institution = InstitutionFactory.build(**kwargs)
    db_session.add(institution)
    db_session.commit()
    db_session.refresh(institution)
    return institution


def create_test_user(db_session, institution_id, role_id, **kwargs):
    """Create a test user with defaults."""
    user = UserFactory.build(
        institution_id=institution_id,
        role_id=role_id,
        **kwargs
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def create_test_student(db_session, institution_id, section_id, academic_year_id, **kwargs):
    """Create a test student with defaults."""
    student = StudentFactory.build(
        institution_id=institution_id,
        section_id=section_id,
        academic_year_id=academic_year_id,
        **kwargs
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student


def create_test_assignment(db_session, institution_id, teacher_id, **kwargs):
    """Create a test assignment with defaults."""
    assignment = AssignmentFactory.build(
        institution_id=institution_id,
        teacher_id=teacher_id,
        **kwargs
    )
    db_session.add(assignment)
    db_session.commit()
    db_session.refresh(assignment)
    return assignment
