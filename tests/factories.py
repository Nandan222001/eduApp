"""
Test data factories for creating test objects.
"""
from datetime import datetime, timedelta
from typing import Optional
from decimal import Decimal
import factory
from factory import Factory, Faker, SubFactory, LazyAttribute, Sequence
from faker import Faker as FakerInstance

from src.models.user import User
from src.models.institution import Institution
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.academic import AcademicYear, Grade, Section, Subject
from src.models.assignment import Assignment, Submission
from src.models.attendance import Attendance, AttendanceStatus
from src.models.subscription import Subscription, Payment, Invoice
from src.models.role import Role
from src.utils.security import get_password_hash

fake = FakerInstance()


class InstitutionFactory(Factory):
    """Factory for creating Institution objects."""
    
    class Meta:
        model = Institution

    name = Faker('company')
    short_name = LazyAttribute(lambda obj: obj.name[:10])
    code = Sequence(lambda n: f"INST{n:04d}")
    email = Sequence(lambda n: f"institution{n}@test.com")
    phone = Faker('phone_number')
    address = Faker('street_address')
    city = Faker('city')
    state = Faker('state')
    country = 'Test Country'
    postal_code = Faker('postcode')
    website = Faker('url')
    is_active = True


class RoleFactory(Factory):
    """Factory for creating Role objects."""
    
    class Meta:
        model = Role
    
    name = Faker('job')
    description = Faker('sentence')
    is_system_role = False


class UserFactory(Factory):
    """Factory for creating User objects."""
    
    class Meta:
        model = User

    username = Sequence(lambda n: f"user{n}")
    email = Sequence(lambda n: f"user{n}@test.com")
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

    name = Sequence(lambda n: f"Grade {n}")
    display_order = Sequence(lambda n: n)
    is_active = True


class SectionFactory(Factory):
    """Factory for creating Section objects."""
    
    class Meta:
        model = Section

    name = Sequence(lambda n: f"Section {chr(65 + n % 26)}")
    capacity = Faker('random_int', min=30, max=50)
    is_active = True


class SubjectFactory(Factory):
    """Factory for creating Subject objects."""
    
    class Meta:
        model = Subject

    name = Faker('random_element', elements=['Mathematics', 'Science', 'English', 'History'])
    code = Sequence(lambda n: f"SUBJ{n:03d}")
    description = Faker('sentence')
    is_active = True


class StudentFactory(Factory):
    """Factory for creating Student objects."""
    
    class Meta:
        model = Student

    admission_number = Sequence(lambda n: f"ADM{n:04d}")
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    email = Sequence(lambda n: f"student{n}@test.com")
    date_of_birth = LazyAttribute(lambda _: (datetime.now() - timedelta(days=5000)).date())
    date_of_admission = LazyAttribute(lambda _: datetime.now().date())
    gender = Faker('random_element', elements=['Male', 'Female', 'Other'])
    blood_group = Faker('random_element', elements=['A+', 'B+', 'O+', 'AB+'])
    is_active = True


class TeacherFactory(Factory):
    """Factory for creating Teacher objects."""
    
    class Meta:
        model = Teacher

    employee_id = Sequence(lambda n: f"EMP{n:04d}")
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    email = Sequence(lambda n: f"teacher{n}@test.com")
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


class SubscriptionFactory(Factory):
    """Factory for creating Subscription objects."""
    
    class Meta:
        model = Subscription
    
    plan_name = Faker('random_element', elements=['STARTER', 'GROWTH', 'PROFESSIONAL'])
    status = 'active'
    billing_cycle = 'monthly'
    price = Decimal("999.00")
    currency = 'INR'
    max_users = 10
    max_storage_gb = 50
    features = '["Basic support", "Email notifications"]'
    start_date = LazyAttribute(lambda _: datetime.utcnow())
    next_billing_date = LazyAttribute(lambda _: datetime.utcnow() + timedelta(days=30))
    auto_renew = True


class PaymentFactory(Factory):
    """Factory for creating Payment objects."""
    
    class Meta:
        model = Payment
    
    amount = Decimal("999.00")
    currency = 'INR'
    status = 'pending'
    payment_method = 'card'


class InvoiceFactory(Factory):
    """Factory for creating Invoice objects."""
    
    class Meta:
        model = Invoice
    
    invoice_number = Sequence(lambda n: f"INV-{n:06d}")
    status = 'open'
    amount = Decimal("999.00")
    tax_amount = Decimal("179.82")
    total_amount = Decimal("1178.82")
    currency = 'INR'
    billing_period_start = LazyAttribute(lambda _: datetime.utcnow())
    billing_period_end = LazyAttribute(lambda _: datetime.utcnow() + timedelta(days=30))
    due_date = LazyAttribute(lambda _: datetime.utcnow() + timedelta(days=7))


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


def create_test_teacher(db_session, institution_id, user_id, **kwargs):
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


def create_bulk_students(db_session, institution_id, section_id, academic_year_id, count=10):
    """Create multiple test students."""
    students = []
    for i in range(count):
        student = create_test_student(
            db_session,
            institution_id,
            section_id,
            academic_year_id,
            admission_number=f"ADM{i:04d}",
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
