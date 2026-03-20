"""
Test data factories for creating test objects with realistic data using Faker.
"""
from datetime import datetime, timedelta, date, time
from typing import Optional, List
from decimal import Decimal
import random
import factory
from factory import Factory, Faker, SubFactory, LazyAttribute, Sequence, post_generation
from faker import Faker as FakerInstance

from src.models.user import User
from src.models.institution import Institution
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.academic import AcademicYear, Grade, Section, Subject
from src.models.assignment import Assignment, Submission, AssignmentStatus, SubmissionStatus
from src.models.attendance import Attendance, AttendanceStatus
from src.models.examination import Exam, ExamType, ExamStatus, ExamSubject, ExamSchedule, ExamMarks
from src.models.subscription import Subscription, Payment, Invoice
from src.models.role import Role
from src.utils.security import get_password_hash

fake = FakerInstance()


class InstitutionFactory(Factory):
    """Factory for creating Institution objects with realistic data."""
    
    class Meta:
        model = Institution

    name = Faker('company')
    slug = LazyAttribute(lambda obj: obj.name.lower().replace(' ', '-').replace(',', ''))
    domain = LazyAttribute(lambda obj: f"{obj.slug}.edu")
    description = Faker('catch_phrase')
    logo_url = Faker('image_url')
    is_active = True
    max_users = Faker('random_int', min=50, max=500)
    settings = '{"theme": "default", "timezone": "UTC"}'


class RoleFactory(Factory):
    """Factory for creating Role objects with realistic data."""
    
    class Meta:
        model = Role
    
    name = Faker('random_element', elements=['Admin', 'Teacher', 'Student', 'Parent', 'Staff'])
    slug = LazyAttribute(lambda obj: obj.name.lower().replace(' ', '-'))
    description = Faker('sentence')
    is_system_role = False
    is_active = True


class UserFactory(Factory):
    """Factory for creating User objects with realistic data."""
    
    class Meta:
        model = User

    username = Sequence(lambda n: f"user{n}")
    email = Faker('email')
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    phone = Faker('phone_number')
    hashed_password = LazyAttribute(lambda _: get_password_hash('password123'))
    is_active = True
    is_superuser = False
    email_verified = Faker('boolean', chance_of_getting_true=75)
    last_login = LazyAttribute(lambda _: fake.date_time_between(start_date='-30d', end_date='now'))


class AcademicYearFactory(Factory):
    """Factory for creating AcademicYear objects with realistic data."""
    
    class Meta:
        model = AcademicYear

    name = LazyAttribute(lambda _: f"{datetime.now().year}-{datetime.now().year + 1}")
    start_date = LazyAttribute(lambda _: date(datetime.now().year, 4, 1))
    end_date = LazyAttribute(lambda obj: date(obj.start_date.year + 1, 3, 31))
    is_current = True
    is_active = True
    description = Faker('sentence')


class GradeFactory(Factory):
    """Factory for creating Grade objects with realistic data."""
    
    class Meta:
        model = Grade

    name = Sequence(lambda n: f"Grade {n + 1}")
    display_order = Sequence(lambda n: n + 1)
    description = Faker('sentence')
    is_active = True


class SectionFactory(Factory):
    """Factory for creating Section objects with realistic data."""
    
    class Meta:
        model = Section

    name = Sequence(lambda n: f"Section {chr(65 + n % 26)}")
    capacity = Faker('random_int', min=30, max=50)
    description = Faker('sentence')
    is_active = True


class SubjectFactory(Factory):
    """Factory for creating Subject objects with realistic data."""
    
    class Meta:
        model = Subject

    name = Faker('random_element', elements=[
        'Mathematics', 'Science', 'English', 'History', 'Geography',
        'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics',
        'Literature', 'Physical Education', 'Art', 'Music'
    ])
    code = Sequence(lambda n: f"SUBJ{n:03d}")
    description = Faker('sentence')
    is_active = True


class StudentFactory(Factory):
    """Factory for creating Student objects with realistic data."""
    
    class Meta:
        model = Student

    admission_number = Sequence(lambda n: f"ADM{n:05d}")
    roll_number = Sequence(lambda n: f"ROLL{n:04d}")
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    email = Sequence(lambda n: f"student{n}@test.com")
    phone = Faker('phone_number')
    date_of_birth = LazyAttribute(lambda _: fake.date_of_birth(minimum_age=10, maximum_age=18))
    admission_date = LazyAttribute(lambda _: fake.date_between(start_date='-3y', end_date='today'))
    gender = Faker('random_element', elements=['Male', 'Female', 'Other'])
    blood_group = Faker('random_element', elements=['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])
    address = Faker('address')
    parent_name = Faker('name')
    parent_email = Faker('email')
    parent_phone = Faker('phone_number')
    emergency_contact_name = Faker('name')
    emergency_contact_phone = Faker('phone_number')
    emergency_contact_relation = Faker('random_element', elements=['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt'])
    previous_school = Faker('company')
    medical_conditions = Faker('random_element', elements=[None, 'Asthma', 'Diabetes', 'Allergies', 'None'])
    nationality = Faker('country')
    religion = Faker('random_element', elements=['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Other'])
    caste = Faker('random_element', elements=['General', 'OBC', 'SC', 'ST'])
    category = Faker('random_element', elements=['General', 'OBC', 'SC', 'ST'])
    status = 'active'
    is_active = True


class TeacherFactory(Factory):
    """Factory for creating Teacher objects with realistic data."""
    
    class Meta:
        model = Teacher

    employee_id = Sequence(lambda n: f"EMP{n:05d}")
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    email = Sequence(lambda n: f"teacher{n}@test.com")
    phone = Faker('phone_number')
    date_of_birth = LazyAttribute(lambda _: fake.date_of_birth(minimum_age=25, maximum_age=65))
    gender = Faker('random_element', elements=['Male', 'Female', 'Other'])
    address = Faker('address')
    qualification = Faker('random_element', elements=[
        'B.Ed', 'M.Ed', 'M.Sc', 'M.A', 'Ph.D',
        'B.Sc, B.Ed', 'M.Sc, M.Ed', 'MBA'
    ])
    specialization = Faker('random_element', elements=[
        'Mathematics', 'Science', 'English', 'History', 'Geography',
        'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics'
    ])
    joining_date = LazyAttribute(lambda _: fake.date_between(start_date='-10y', end_date='today'))
    is_active = True


class AssignmentFactory(Factory):
    """Factory for creating Assignment objects with realistic data."""
    
    class Meta:
        model = Assignment

    title = Faker('sentence', nb_words=6)
    description = Faker('paragraph', nb_sentences=3)
    content = Faker('text', max_nb_chars=500)
    instructions = Faker('paragraph', nb_sentences=5)
    due_date = LazyAttribute(lambda _: fake.date_time_between(start_date='now', end_date='+30d'))
    publish_date = LazyAttribute(lambda _: fake.date_time_between(start_date='-7d', end_date='now'))
    close_date = LazyAttribute(lambda obj: obj.due_date + timedelta(days=7) if obj.due_date else None)
    max_marks = Faker('random_element', elements=[50, 75, 100, 150, 200])
    passing_marks = LazyAttribute(lambda obj: Decimal(str(float(obj.max_marks) * 0.4)))
    allow_late_submission = Faker('boolean', chance_of_getting_true=30)
    late_penalty_percentage = LazyAttribute(lambda obj: 10.0 if obj.allow_late_submission else None)
    max_file_size_mb = 10
    allowed_file_types = 'pdf,doc,docx,txt'
    status = Faker('random_element', elements=[
        AssignmentStatus.DRAFT,
        AssignmentStatus.PUBLISHED,
        AssignmentStatus.CLOSED
    ])
    is_active = True


class SubmissionFactory(Factory):
    """Factory for creating Submission objects with realistic data."""
    
    class Meta:
        model = Submission

    content = Faker('paragraph', nb_sentences=5)
    submission_text = Faker('text', max_nb_chars=1000)
    submitted_at = LazyAttribute(lambda _: fake.date_time_between(start_date='-7d', end_date='now'))
    is_late = Faker('boolean', chance_of_getting_true=20)
    marks_obtained = LazyAttribute(lambda _: Decimal(str(fake.random_int(min=40, max=100))))
    grade = LazyAttribute(lambda obj: _calculate_grade(float(obj.marks_obtained)) if obj.marks_obtained else None)
    feedback = Faker('sentence', nb_words=10)
    graded_at = LazyAttribute(lambda obj: obj.submitted_at + timedelta(days=2) if obj.submitted_at else None)
    status = Faker('random_element', elements=[
        SubmissionStatus.SUBMITTED,
        SubmissionStatus.GRADED,
        SubmissionStatus.RETURNED
    ])


class AttendanceFactory(Factory):
    """Factory for creating Attendance objects with realistic data."""
    
    class Meta:
        model = Attendance

    date = LazyAttribute(lambda _: fake.date_between(start_date='-30d', end_date='today'))
    status = Faker('random_element', elements=[
        AttendanceStatus.PRESENT,
        AttendanceStatus.ABSENT,
        AttendanceStatus.LATE,
        AttendanceStatus.HALF_DAY
    ])
    remarks = LazyAttribute(lambda obj: 
        fake.sentence() if obj.status != AttendanceStatus.PRESENT else None
    )


class ExamFactory(Factory):
    """Factory for creating Exam objects with realistic data."""
    
    class Meta:
        model = Exam

    name = Faker('random_element', elements=[
        'Unit Test 1', 'Unit Test 2', 'Mid-Term Examination',
        'Final Examination', 'Mock Test', 'Pre-Board Exam',
        'Term 1 Exam', 'Term 2 Exam', 'Annual Examination'
    ])
    exam_type = Faker('random_element', elements=[
        ExamType.UNIT,
        ExamType.MID_TERM,
        ExamType.FINAL,
        ExamType.MOCK
    ])
    description = Faker('paragraph', nb_sentences=3)
    start_date = LazyAttribute(lambda _: fake.date_between(start_date='+7d', end_date='+30d'))
    end_date = LazyAttribute(lambda obj: obj.start_date + timedelta(days=random.randint(3, 14)))
    status = Faker('random_element', elements=[
        ExamStatus.SCHEDULED,
        ExamStatus.ONGOING,
        ExamStatus.COMPLETED
    ])
    total_marks = Faker('random_element', elements=[500, 600, 700, 800, 1000])
    passing_marks = LazyAttribute(lambda obj: Decimal(str(float(obj.total_marks) * 0.35)))
    is_published = Faker('boolean', chance_of_getting_true=50)


class ExamSubjectFactory(Factory):
    """Factory for creating ExamSubject objects with realistic data."""
    
    class Meta:
        model = ExamSubject

    theory_max_marks = Faker('random_element', elements=[70, 80, 100])
    practical_max_marks = Faker('random_element', elements=[0, 20, 30])
    theory_passing_marks = LazyAttribute(lambda obj: Decimal(str(float(obj.theory_max_marks) * 0.35)))
    practical_passing_marks = LazyAttribute(lambda obj: Decimal(str(float(obj.practical_max_marks) * 0.35)) if obj.practical_max_marks > 0 else None)
    weightage = Faker('random_element', elements=[1.0, 1.5, 2.0])


class ExamScheduleFactory(Factory):
    """Factory for creating ExamSchedule objects with realistic data."""
    
    class Meta:
        model = ExamSchedule

    exam_date = LazyAttribute(lambda _: fake.date_between(start_date='+7d', end_date='+30d'))
    start_time = LazyAttribute(lambda _: time(hour=random.randint(8, 13), minute=random.choice([0, 30])))
    end_time = LazyAttribute(lambda obj: time(
        hour=(obj.start_time.hour + 2) % 24,
        minute=obj.start_time.minute
    ))
    room_number = Faker('random_element', elements=['Room 101', 'Room 102', 'Hall A', 'Hall B', 'Lab 1', 'Lab 2'])
    instructions = Faker('paragraph', nb_sentences=3)


class ExamMarksFactory(Factory):
    """Factory for creating ExamMarks objects with realistic data."""
    
    class Meta:
        model = ExamMarks

    theory_marks_obtained = LazyAttribute(lambda _: Decimal(str(fake.random_int(min=30, max=100))))
    practical_marks_obtained = LazyAttribute(lambda _: Decimal(str(fake.random_int(min=15, max=30))))
    is_absent = Faker('boolean', chance_of_getting_true=5)
    remarks = LazyAttribute(lambda obj: 'Absent' if obj.is_absent else None)
    entered_at = LazyAttribute(lambda _: fake.date_time_between(start_date='-7d', end_date='now'))


class SubscriptionFactory(Factory):
    """Factory for creating Subscription objects with realistic data."""
    
    class Meta:
        model = Subscription
    
    plan_name = Faker('random_element', elements=['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'])
    status = Faker('random_element', elements=['active', 'trial', 'past_due', 'canceled'])
    billing_cycle = Faker('random_element', elements=['monthly', 'quarterly', 'yearly'])
    price = LazyAttribute(lambda obj: Decimal(_get_plan_price(obj.plan_name, obj.billing_cycle)))
    currency = 'INR'
    max_users = LazyAttribute(lambda obj: _get_max_users(obj.plan_name))
    max_storage_gb = LazyAttribute(lambda obj: _get_max_storage(obj.plan_name))
    features = LazyAttribute(lambda obj: _get_features(obj.plan_name))
    start_date = LazyAttribute(lambda _: fake.date_time_between(start_date='-90d', end_date='now'))
    end_date = LazyAttribute(lambda obj: obj.start_date + _get_billing_period(obj.billing_cycle))
    trial_end_date = LazyAttribute(lambda obj: obj.start_date + timedelta(days=14) if obj.status == 'trial' else None)
    next_billing_date = LazyAttribute(lambda obj: obj.end_date if obj.status == 'active' else None)
    auto_renew = Faker('boolean', chance_of_getting_true=80)
    razorpay_subscription_id = LazyAttribute(lambda _: f"sub_{fake.uuid4()[:16]}")
    razorpay_customer_id = LazyAttribute(lambda _: f"cust_{fake.uuid4()[:16]}")


class PaymentFactory(Factory):
    """Factory for creating Payment objects with realistic data."""
    
    class Meta:
        model = Payment
    
    amount = Decimal("999.00")
    currency = 'INR'
    status = Faker('random_element', elements=['pending', 'authorized', 'captured', 'failed'])
    payment_method = Faker('random_element', elements=['card', 'netbanking', 'upi', 'wallet'])
    razorpay_payment_id = LazyAttribute(lambda _: f"pay_{fake.uuid4()[:16]}")
    razorpay_order_id = LazyAttribute(lambda _: f"order_{fake.uuid4()[:16]}")
    razorpay_signature = LazyAttribute(lambda _: fake.sha256())
    failure_reason = LazyAttribute(lambda obj: fake.sentence() if obj.status == 'failed' else None)
    paid_at = LazyAttribute(lambda obj: fake.date_time_between(start_date='-30d', end_date='now') if obj.status == 'captured' else None)


class InvoiceFactory(Factory):
    """Factory for creating Invoice objects with realistic data."""
    
    class Meta:
        model = Invoice
    
    invoice_number = Sequence(lambda n: f"INV-{datetime.now().year}-{n:06d}")
    status = Faker('random_element', elements=['draft', 'open', 'paid', 'void', 'uncollectible'])
    amount = Decimal("999.00")
    tax_amount = LazyAttribute(lambda obj: Decimal(str(float(obj.amount) * 0.18)))
    total_amount = LazyAttribute(lambda obj: obj.amount + obj.tax_amount)
    currency = 'INR'
    billing_period_start = LazyAttribute(lambda _: fake.date_time_between(start_date='-60d', end_date='-30d'))
    billing_period_end = LazyAttribute(lambda obj: obj.billing_period_start + timedelta(days=30))
    due_date = LazyAttribute(lambda obj: obj.billing_period_end + timedelta(days=7))
    paid_at = LazyAttribute(lambda obj: fake.date_time_between(start_date=obj.billing_period_end, end_date=obj.due_date) if obj.status == 'paid' else None)
    invoice_url = LazyAttribute(lambda obj: f"https://example.com/invoices/{obj.invoice_number}.pdf")


def _calculate_grade(marks: float) -> str:
    """Calculate letter grade based on marks."""
    if marks >= 90:
        return 'A+'
    elif marks >= 80:
        return 'A'
    elif marks >= 70:
        return 'B+'
    elif marks >= 60:
        return 'B'
    elif marks >= 50:
        return 'C+'
    elif marks >= 40:
        return 'C'
    elif marks >= 33:
        return 'D'
    else:
        return 'F'


def _get_plan_price(plan_name: str, billing_cycle: str) -> str:
    """Get price based on plan and billing cycle."""
    base_prices = {
        'STARTER': 999,
        'GROWTH': 2999,
        'PROFESSIONAL': 4999,
        'ENTERPRISE': 9999
    }
    base_price = base_prices.get(plan_name, 999)
    
    if billing_cycle == 'quarterly':
        return str(base_price * 3 * 0.95)
    elif billing_cycle == 'yearly':
        return str(base_price * 12 * 0.85)
    return str(base_price)


def _get_max_users(plan_name: str) -> int:
    """Get max users based on plan."""
    return {
        'STARTER': 10,
        'GROWTH': 50,
        'PROFESSIONAL': 200,
        'ENTERPRISE': 1000
    }.get(plan_name, 10)


def _get_max_storage(plan_name: str) -> int:
    """Get max storage based on plan."""
    return {
        'STARTER': 50,
        'GROWTH': 200,
        'PROFESSIONAL': 500,
        'ENTERPRISE': 2000
    }.get(plan_name, 50)


def _get_features(plan_name: str) -> str:
    """Get features based on plan."""
    features = {
        'STARTER': '["Basic support", "Email notifications", "10 users"]',
        'GROWTH': '["Priority support", "Email & SMS notifications", "50 users", "Advanced analytics"]',
        'PROFESSIONAL': '["24/7 support", "All notifications", "200 users", "Advanced analytics", "Custom branding"]',
        'ENTERPRISE': '["Dedicated support", "All features", "1000+ users", "Advanced analytics", "Custom branding", "API access"]'
    }
    return features.get(plan_name, features['STARTER'])


def _get_billing_period(billing_cycle: str) -> timedelta:
    """Get billing period based on cycle."""
    if billing_cycle == 'quarterly':
        return timedelta(days=90)
    elif billing_cycle == 'yearly':
        return timedelta(days=365)
    return timedelta(days=30)


def create_test_institution(db_session, **kwargs):
    """Create a test institution with defaults."""
    institution = InstitutionFactory.build(**kwargs)
    db_session.add(institution)
    db_session.commit()
    db_session.refresh(institution)
    return institution


def create_test_role(db_session, **kwargs):
    """Create a test role with defaults."""
    role = RoleFactory.build(**kwargs)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


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


def create_test_academic_year(db_session, institution_id, **kwargs):
    """Create a test academic year with defaults."""
    academic_year = AcademicYearFactory.build(
        institution_id=institution_id,
        **kwargs
    )
    db_session.add(academic_year)
    db_session.commit()
    db_session.refresh(academic_year)
    return academic_year


def create_test_grade(db_session, institution_id, academic_year_id, **kwargs):
    """Create a test grade with defaults."""
    grade = GradeFactory.build(
        institution_id=institution_id,
        academic_year_id=academic_year_id,
        **kwargs
    )
    db_session.add(grade)
    db_session.commit()
    db_session.refresh(grade)
    return grade


def create_test_section(db_session, institution_id, grade_id, **kwargs):
    """Create a test section with defaults."""
    section = SectionFactory.build(
        institution_id=institution_id,
        grade_id=grade_id,
        **kwargs
    )
    db_session.add(section)
    db_session.commit()
    db_session.refresh(section)
    return section


def create_test_subject(db_session, institution_id, **kwargs):
    """Create a test subject with defaults."""
    subject = SubjectFactory.build(
        institution_id=institution_id,
        **kwargs
    )
    db_session.add(subject)
    db_session.commit()
    db_session.refresh(subject)
    return subject


def create_test_student(db_session, institution_id, section_id, **kwargs):
    """Create a test student with defaults."""
    student = StudentFactory.build(
        institution_id=institution_id,
        section_id=section_id,
        **kwargs
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student


def create_test_teacher(db_session, institution_id, user_id=None, **kwargs):
    """Create a test teacher with defaults."""
    teacher = TeacherFactory.build(
        institution_id=institution_id,
        user_id=user_id,
        **kwargs
    )
    db_session.add(teacher)
    db_session.commit()
    db_session.refresh(teacher)
    return teacher


def create_test_assignment(db_session, institution_id, teacher_id, grade_id, subject_id, **kwargs):
    """Create a test assignment with defaults."""
    assignment = AssignmentFactory.build(
        institution_id=institution_id,
        teacher_id=teacher_id,
        grade_id=grade_id,
        subject_id=subject_id,
        **kwargs
    )
    db_session.add(assignment)
    db_session.commit()
    db_session.refresh(assignment)
    return assignment


def create_test_attendance(db_session, institution_id, student_id, section_id=None, subject_id=None, **kwargs):
    """Create a test attendance record with defaults."""
    attendance = AttendanceFactory.build(
        institution_id=institution_id,
        student_id=student_id,
        section_id=section_id,
        subject_id=subject_id,
        **kwargs
    )
    db_session.add(attendance)
    db_session.commit()
    db_session.refresh(attendance)
    return attendance


def create_test_exam(db_session, institution_id, academic_year_id, grade_id, **kwargs):
    """Create a test exam with defaults."""
    exam = ExamFactory.build(
        institution_id=institution_id,
        academic_year_id=academic_year_id,
        grade_id=grade_id,
        **kwargs
    )
    db_session.add(exam)
    db_session.commit()
    db_session.refresh(exam)
    return exam


def create_test_subscription(db_session, institution_id, **kwargs):
    """Create a test subscription with defaults."""
    subscription = SubscriptionFactory.build(
        institution_id=institution_id,
        **kwargs
    )
    db_session.add(subscription)
    db_session.commit()
    db_session.refresh(subscription)
    return subscription


def create_test_payment(db_session, subscription_id, institution_id, **kwargs):
    """Create a test payment with defaults."""
    payment = PaymentFactory.build(
        subscription_id=subscription_id,
        institution_id=institution_id,
        **kwargs
    )
    db_session.add(payment)
    db_session.commit()
    db_session.refresh(payment)
    return payment


def create_test_invoice(db_session, subscription_id, institution_id, **kwargs):
    """Create a test invoice with defaults."""
    invoice = InvoiceFactory.build(
        subscription_id=subscription_id,
        institution_id=institution_id,
        **kwargs
    )
    db_session.add(invoice)
    db_session.commit()
    db_session.refresh(invoice)
    return invoice


def create_bulk_students(db_session, institution_id, section_id, count=10):
    """Create multiple test students."""
    students = []
    for i in range(count):
        student = create_test_student(
            db_session,
            institution_id,
            section_id,
            admission_number=f"ADM{i:05d}",
            email=f"student{i}@test.com"
        )
        students.append(student)
    return students


def create_bulk_users(db_session, institution_id, role_id, count=10):
    """Create multiple test users."""
    users = []
    for i in range(count):
        user = create_test_user(
            db_session,
            institution_id,
            role_id,
            username=f"user{i}",
            email=f"user{i}@test.com"
        )
        users.append(user)
    return users


def create_bulk_teachers(db_session, institution_id, count=5):
    """Create multiple test teachers."""
    teachers = []
    for i in range(count):
        teacher = create_test_teacher(
            db_session,
            institution_id,
            employee_id=f"EMP{i:05d}",
            email=f"teacher{i}@test.com"
        )
        teachers.append(teacher)
    return teachers


def create_bulk_assignments(db_session, institution_id, teacher_id, grade_id, subject_id, count=5):
    """Create multiple test assignments."""
    assignments = []
    for i in range(count):
        assignment = create_test_assignment(
            db_session,
            institution_id,
            teacher_id,
            grade_id,
            subject_id
        )
        assignments.append(assignment)
    return assignments


def create_bulk_attendance(db_session, institution_id, student_id, days=30, section_id=None, subject_id=None):
    """Create attendance records for multiple days."""
    attendance_records = []
    for i in range(days):
        attendance_date = date.today() - timedelta(days=days - i)
        attendance = create_test_attendance(
            db_session,
            institution_id,
            student_id,
            section_id,
            subject_id,
            date=attendance_date
        )
        attendance_records.append(attendance)
    return attendance_records


def generate_class_with_students(
    db_session,
    institution_id: int,
    academic_year_id: int,
    grade_name: str = "Grade 10",
    section_name: str = "Section A",
    count: int = 30
) -> dict:
    """
    Generate a complete class setup with grade, section, and students.
    
    Args:
        db_session: Database session
        institution_id: ID of the institution
        academic_year_id: ID of the academic year
        grade_name: Name of the grade (default: "Grade 10")
        section_name: Name of the section (default: "Section A")
        count: Number of students to create (default: 30)
    
    Returns:
        Dictionary containing grade, section, and list of students
    """
    grade = create_test_grade(
        db_session,
        institution_id,
        academic_year_id,
        name=grade_name
    )
    
    section = create_test_section(
        db_session,
        institution_id,
        grade.id,
        name=section_name,
        capacity=count
    )
    
    students = create_bulk_students(
        db_session,
        institution_id,
        section.id,
        count=count
    )
    
    return {
        'grade': grade,
        'section': section,
        'students': students
    }


def generate_complete_academic_setup(
    db_session,
    institution_id: int,
    num_grades: int = 3,
    sections_per_grade: int = 2,
    students_per_section: int = 30,
    num_subjects: int = 5,
    num_teachers: int = 10
) -> dict:
    """
    Generate a complete academic setup with years, grades, sections, students, subjects, and teachers.
    
    Args:
        db_session: Database session
        institution_id: ID of the institution
        num_grades: Number of grades to create
        sections_per_grade: Number of sections per grade
        students_per_section: Number of students per section
        num_subjects: Number of subjects to create
        num_teachers: Number of teachers to create
    
    Returns:
        Dictionary containing all created objects
    """
    academic_year = create_test_academic_year(db_session, institution_id)
    
    grades = []
    sections = []
    all_students = []
    
    for i in range(num_grades):
        grade = create_test_grade(
            db_session,
            institution_id,
            academic_year.id,
            name=f"Grade {i + 8}",
            display_order=i + 8
        )
        grades.append(grade)
        
        for j in range(sections_per_grade):
            section = create_test_section(
                db_session,
                institution_id,
                grade.id,
                name=f"Section {chr(65 + j)}",
                capacity=students_per_section
            )
            sections.append(section)
            
            students = create_bulk_students(
                db_session,
                institution_id,
                section.id,
                count=students_per_section
            )
            all_students.extend(students)
    
    subjects = []
    for i in range(num_subjects):
        subject = create_test_subject(db_session, institution_id)
        subjects.append(subject)
    
    teachers = create_bulk_teachers(db_session, institution_id, count=num_teachers)
    
    return {
        'academic_year': academic_year,
        'grades': grades,
        'sections': sections,
        'students': all_students,
        'subjects': subjects,
        'teachers': teachers
    }


def generate_exam_with_schedule(
    db_session,
    institution_id: int,
    academic_year_id: int,
    grade_id: int,
    subject_ids: List[int],
    exam_name: str = "Mid-Term Examination"
) -> dict:
    """
    Generate an exam with complete schedule for all subjects.
    
    Args:
        db_session: Database session
        institution_id: ID of the institution
        academic_year_id: ID of the academic year
        grade_id: ID of the grade
        subject_ids: List of subject IDs
        exam_name: Name of the exam
    
    Returns:
        Dictionary containing exam and exam subjects
    """
    exam = create_test_exam(
        db_session,
        institution_id,
        academic_year_id,
        grade_id,
        name=exam_name
    )
    
    exam_subjects = []
    for subject_id in subject_ids:
        exam_subject = ExamSubjectFactory.build(
            institution_id=institution_id,
            exam_id=exam.id,
            subject_id=subject_id
        )
        db_session.add(exam_subject)
        db_session.commit()
        db_session.refresh(exam_subject)
        exam_subjects.append(exam_subject)
    
    return {
        'exam': exam,
        'exam_subjects': exam_subjects
    }


def generate_student_attendance_history(
    db_session,
    institution_id: int,
    student_id: int,
    section_id: int,
    subject_id: int,
    days: int = 60,
    attendance_percentage: float = 0.85
) -> List[Attendance]:
    """
    Generate realistic attendance history for a student.
    
    Args:
        db_session: Database session
        institution_id: ID of the institution
        student_id: ID of the student
        section_id: ID of the section
        subject_id: ID of the subject
        days: Number of days to generate
        attendance_percentage: Percentage of days student should be present
    
    Returns:
        List of attendance records
    """
    attendance_records = []
    
    for i in range(days):
        attendance_date = date.today() - timedelta(days=days - i)
        
        is_present = random.random() < attendance_percentage
        
        if is_present:
            status = AttendanceStatus.PRESENT
        else:
            status = random.choice([
                AttendanceStatus.ABSENT,
                AttendanceStatus.LATE,
                AttendanceStatus.HALF_DAY
            ])
        
        attendance = create_test_attendance(
            db_session,
            institution_id,
            student_id,
            section_id,
            subject_id,
            date=attendance_date,
            status=status
        )
        attendance_records.append(attendance)
    
    return attendance_records
