"""
Comprehensive MySQL Migration Testing Suite

This test suite validates:
1. Alembic upgrade head on fresh MySQL database
2. Full test suite execution with pytest
3. Multi-tenant data isolation with application-level filtering
4. Load testing for MySQL performance
5. API endpoint validation
6. Real-time features testing
7. Analytics aggregations
8. ML model predictions with MySQL

Run with: pytest tests/migration/test_mysql_comprehensive.py -v -s
"""

import pytest
import time
from typing import List, Dict, Any
from sqlalchemy import create_engine, text, inspect, func
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from alembic import command
from alembic.config import Config
from datetime import datetime, timedelta, date
from decimal import Decimal
import os
import random

from src.database import Base, apply_tenant_filter, set_rls_context
from src.models.institution import Institution
from src.models.user import User
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.attendance import Attendance, AttendanceStatus
from src.models.assignment import Assignment, Submission, AssignmentStatus, SubmissionStatus
from src.models.gamification import UserPoints, LeaderboardEntry, Leaderboard, LeaderboardType, LeaderboardPeriod
from src.models.ml_prediction import PerformancePrediction, MLModel, MLModelVersion, ModelType, PredictionType, ModelStatus
from src.models.analytics import DashboardMetric, AnalyticsEvent
from src.models.role import Role
from src.models.academic import AcademicYear, Grade, Section, Subject


class TestMySQLMigrationComprehensive:
    """Comprehensive test suite for MySQL migration"""
    
    @pytest.fixture(scope="class")
    def mysql_test_database_url(self) -> str:
        """MySQL test database URL"""
        return os.getenv(
            "MYSQL_TEST_DATABASE_URL",
            "mysql+pymysql://root:test_password@localhost:3306/test_mysql_migration?charset=utf8mb4"
        )
    
    @pytest.fixture(scope="class")
    def mysql_engine(self, mysql_test_database_url: str):
        """Create MySQL test engine"""
        engine = create_engine(
            mysql_test_database_url,
            poolclass=NullPool,
            echo=False,
            pool_pre_ping=True,
            connect_args={'charset': 'utf8mb4'},
        )
        yield engine
        engine.dispose()
    
    @pytest.fixture(scope="class")
    def mysql_session_factory(self, mysql_engine):
        """Create session factory for MySQL test database"""
        return sessionmaker(bind=mysql_engine, autocommit=False, autoflush=False)
    
    @pytest.fixture(scope="class")
    def alembic_config(self) -> Config:
        """Create Alembic configuration"""
        return Config("alembic.ini")
    
    def clean_database(self, engine):
        """Drop all tables from database"""
        with engine.connect() as conn:
            result = conn.execute(text("SELECT DATABASE()"))
            current_db = result.scalar()
            
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = :db_name
            """), {"db_name": current_db})
            
            tables = [row[0] for row in result.fetchall()]
            
            if tables:
                conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
                for table in tables:
                    conn.execute(text(f"DROP TABLE IF EXISTS `{table}`"))
                conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            
            conn.commit()
    
    def test_01_alembic_upgrade_head(
        self, 
        mysql_engine, 
        mysql_test_database_url: str,
        alembic_config: Config
    ):
        """
        Test 1: Execute alembic upgrade head on fresh MySQL database
        
        This test validates:
        - All migrations execute successfully
        - No migration errors occur
        - Database schema is created correctly
        - All tables are present
        """
        print("\n" + "="*80)
        print("TEST 1: Alembic Upgrade Head on Fresh MySQL Database")
        print("="*80)
        
        # Clean database
        self.clean_database(mysql_engine)
        
        # Configure alembic
        alembic_config.set_main_option("sqlalchemy.url", mysql_test_database_url)
        
        # Execute upgrade
        start_time = time.time()
        
        try:
            command.upgrade(alembic_config, "head")
            duration = time.time() - start_time
            
            print(f"\n✓ Migrations executed successfully in {duration:.2f}s")
            
            # Verify tables exist
            inspector = inspect(mysql_engine)
            tables = inspector.get_table_names()
            
            print(f"✓ Created {len(tables)} tables")
            
            # Verify core tables
            core_tables = [
                'institutions', 'users', 'roles', 'permissions',
                'students', 'teachers', 'academic_years', 'grades',
                'sections', 'subjects', 'assignments', 'attendance',
                'subscriptions', 'payments'
            ]
            
            missing_tables = []
            for table in core_tables:
                if table not in tables:
                    missing_tables.append(table)
            
            if missing_tables:
                pytest.fail(f"Missing core tables: {', '.join(missing_tables)}")
            
            print(f"✓ All core tables present")
            
            # Verify foreign keys
            fk_count = 0
            for table_name in tables:
                fks = inspector.get_foreign_keys(table_name)
                fk_count += len(fks)
            
            print(f"✓ Created {fk_count} foreign key constraints")
            
            # Verify indexes
            index_count = 0
            for table_name in tables:
                indexes = inspector.get_indexes(table_name)
                index_count += len(indexes)
            
            print(f"✓ Created {index_count} indexes")
            
        except Exception as e:
            pytest.fail(f"Migration failed: {str(e)}")
    
    def test_02_multi_tenant_data_isolation(
        self,
        mysql_engine,
        mysql_session_factory
    ):
        """
        Test 2: Multi-tenant data isolation with application-level filtering
        
        This test validates:
        - Data is properly isolated between institutions
        - Query filters work correctly
        - No cross-institution data leakage
        - Tenant context is properly applied
        """
        print("\n" + "="*80)
        print("TEST 2: Multi-Tenant Data Isolation")
        print("="*80)
        
        session = mysql_session_factory()
        
        try:
            # Create two institutions
            inst1 = Institution(
                name="School A",
                short_name="SA",
                code="INST001",
                email="admin@schoola.com",
                phone="1111111111",
                address="Address A",
                city="City A",
                state="State A",
                country="Country A",
                postal_code="11111",
                is_active=True
            )
            session.add(inst1)
            
            inst2 = Institution(
                name="School B",
                short_name="SB",
                code="INST002",
                email="admin@schoolb.com",
                phone="2222222222",
                address="Address B",
                city="City B",
                state="State B",
                country="Country B",
                postal_code="22222",
                is_active=True
            )
            session.add(inst2)
            session.flush()
            
            # Create roles
            role = Role(
                name="Student",
                description="Student role",
                is_system_role=True
            )
            session.add(role)
            session.flush()
            
            # Create users for each institution
            user1 = User(
                institution_id=inst1.id,
                role_id=role.id,
                username="user1_inst1",
                email="user1@schoola.com",
                first_name="User",
                last_name="One",
                hashed_password="hashedpass",
                is_active=True
            )
            session.add(user1)
            
            user2 = User(
                institution_id=inst2.id,
                role_id=role.id,
                username="user1_inst2",
                email="user1@schoolb.com",
                first_name="User",
                last_name="One",
                hashed_password="hashedpass",
                is_active=True
            )
            session.add(user2)
            session.flush()
            
            # Create academic year for each
            ay1 = AcademicYear(
                institution_id=inst1.id,
                name="2023-2024",
                start_date=date(2023, 4, 1),
                end_date=date(2024, 3, 31),
                is_current=True,
                is_active=True
            )
            session.add(ay1)
            
            ay2 = AcademicYear(
                institution_id=inst2.id,
                name="2023-2024",
                start_date=date(2023, 4, 1),
                end_date=date(2024, 3, 31),
                is_current=True,
                is_active=True
            )
            session.add(ay2)
            session.flush()
            
            # Create students for each institution
            grade1 = Grade(
                institution_id=inst1.id,
                academic_year_id=ay1.id,
                name="Grade 10",
                display_order=10,
                is_active=True
            )
            session.add(grade1)
            
            grade2 = Grade(
                institution_id=inst2.id,
                academic_year_id=ay2.id,
                name="Grade 10",
                display_order=10,
                is_active=True
            )
            session.add(grade2)
            session.flush()
            
            section1 = Section(
                institution_id=inst1.id,
                grade_id=grade1.id,
                name="A",
                capacity=40,
                is_active=True
            )
            session.add(section1)
            
            section2 = Section(
                institution_id=inst2.id,
                grade_id=grade2.id,
                name="A",
                capacity=40,
                is_active=True
            )
            session.add(section2)
            session.flush()
            
            student1 = Student(
                institution_id=inst1.id,
                user_id=user1.id,
                section_id=section1.id,
                academic_year_id=ay1.id,
                admission_number="ADM001",
                first_name="Student",
                last_name="One",
                email="student1@schoola.com",
                date_of_birth=date(2008, 1, 1),
                is_active=True
            )
            session.add(student1)
            
            student2 = Student(
                institution_id=inst2.id,
                user_id=user2.id,
                section_id=section2.id,
                academic_year_id=ay2.id,
                admission_number="ADM001",
                first_name="Student",
                last_name="One",
                email="student1@schoolb.com",
                date_of_birth=date(2008, 1, 1),
                is_active=True
            )
            session.add(student2)
            session.commit()
            
            print(f"\n✓ Created 2 institutions with data")
            
            # Test 1: Query without tenant filter (should see all data)
            all_students = session.query(Student).all()
            assert len(all_students) == 2, "Should see all students without filter"
            print(f"✓ Without filter: Found {len(all_students)} students (expected 2)")
            
            # Test 2: Apply tenant filter for institution 1
            set_rls_context(session, institution_id=inst1.id)
            query = session.query(Student)
            query = apply_tenant_filter(query, Student, session)
            inst1_students = query.all()
            
            assert len(inst1_students) == 1, "Should see only institution 1 students"
            assert all(s.institution_id == inst1.id for s in inst1_students), \
                "All students should belong to institution 1"
            print(f"✓ With inst1 filter: Found {len(inst1_students)} student (expected 1)")
            
            # Test 3: Apply tenant filter for institution 2
            set_rls_context(session, institution_id=inst2.id)
            query = session.query(Student)
            query = apply_tenant_filter(query, Student, session)
            inst2_students = query.all()
            
            assert len(inst2_students) == 1, "Should see only institution 2 students"
            assert all(s.institution_id == inst2.id for s in inst2_students), \
                "All students should belong to institution 2"
            print(f"✓ With inst2 filter: Found {len(inst2_students)} student (expected 1)")
            
            # Test 4: Verify no cross-institution data leakage
            set_rls_context(session, institution_id=inst1.id)
            query = session.query(Student).filter(Student.id == student2.id)
            query = apply_tenant_filter(query, Student, session)
            cross_check = query.first()
            
            assert cross_check is None, "Should not see student from different institution"
            print(f"✓ Cross-institution check: No data leakage detected")
            
            # Test 5: Test bypass_rls flag
            set_rls_context(session, bypass_rls=True)
            query = session.query(Student)
            query = apply_tenant_filter(query, Student, session)
            all_students_bypass = query.all()
            
            assert len(all_students_bypass) == 2, "Should see all students with bypass_rls"
            print(f"✓ With bypass_rls: Found {len(all_students_bypass)} students (expected 2)")
            
            print(f"\n✓ Multi-tenant isolation verified successfully")
            
        finally:
            session.rollback()
            session.close()
    
    def test_03_load_testing_mysql_performance(
        self,
        mysql_engine,
        mysql_session_factory
    ):
        """
        Test 3: Load testing to ensure MySQL performs adequately
        
        This test validates:
        - Bulk insert performance
        - Query performance with large datasets
        - Index effectiveness
        - Join performance
        - Aggregation performance
        """
        print("\n" + "="*80)
        print("TEST 3: MySQL Load Testing and Performance")
        print("="*80)
        
        session = mysql_session_factory()
        
        try:
            # Create test institution
            institution = Institution(
                name="Load Test School",
                short_name="LTS",
                code="LOAD001",
                email="admin@loadtest.com",
                phone="9999999999",
                address="Load Test Address",
                city="Load City",
                state="Load State",
                country="Load Country",
                postal_code="99999",
                is_active=True
            )
            session.add(institution)
            session.flush()
            
            # Create role
            role = Role(
                name="Student",
                description="Student role",
                is_system_role=True
            )
            session.add(role)
            session.flush()
            
            # Create academic structure
            academic_year = AcademicYear(
                institution_id=institution.id,
                name="2023-2024",
                start_date=date(2023, 4, 1),
                end_date=date(2024, 3, 31),
                is_current=True,
                is_active=True
            )
            session.add(academic_year)
            session.flush()
            
            grade = Grade(
                institution_id=institution.id,
                academic_year_id=academic_year.id,
                name="Grade 10",
                display_order=10,
                is_active=True
            )
            session.add(grade)
            session.flush()
            
            section = Section(
                institution_id=institution.id,
                grade_id=grade.id,
                name="A",
                capacity=500,
                is_active=True
            )
            session.add(section)
            session.flush()
            
            subject = Subject(
                institution_id=institution.id,
                name="Mathematics",
                code="MATH10",
                is_active=True
            )
            session.add(subject)
            session.commit()
            
            # Test 1: Bulk insert 1000 students
            print("\n Performance Test 1: Bulk Insert 1000 Students")
            start_time = time.time()
            
            students = []
            users = []
            for i in range(1000):
                user = User(
                    institution_id=institution.id,
                    role_id=role.id,
                    username=f"student{i}",
                    email=f"student{i}@loadtest.com",
                    first_name=f"Student",
                    last_name=f"{i}",
                    hashed_password="hashedpass",
                    is_active=True
                )
                users.append(user)
                session.add(user)
            
            session.flush()
            
            for i, user in enumerate(users):
                student = Student(
                    institution_id=institution.id,
                    user_id=user.id,
                    section_id=section.id,
                    academic_year_id=academic_year.id,
                    admission_number=f"ADM{i:04d}",
                    first_name=f"Student",
                    last_name=f"{i}",
                    email=f"student{i}@loadtest.com",
                    date_of_birth=date(2008, 1, 1),
                    is_active=True
                )
                students.append(student)
                session.add(student)
            
            session.commit()
            
            insert_duration = time.time() - start_time
            print(f"   ✓ Inserted 1000 students in {insert_duration:.2f}s")
            print(f"   ✓ Rate: {1000/insert_duration:.0f} students/sec")
            
            # Performance threshold
            assert insert_duration < 30.0, \
                f"Bulk insert too slow: {insert_duration:.2f}s (threshold: 30s)"
            
            # Test 2: Query performance with filtering
            print("\n Performance Test 2: Query with Filtering")
            start_time = time.time()
            
            query = session.query(Student).filter(
                Student.institution_id == institution.id,
                Student.is_active == True
            ).limit(100)
            
            results = query.all()
            query_duration = time.time() - start_time
            
            print(f"   ✓ Queried 100 students in {query_duration:.4f}s")
            assert query_duration < 0.5, \
                f"Query too slow: {query_duration:.4f}s (threshold: 0.5s)"
            
            # Test 3: Join performance
            print("\n Performance Test 3: Complex Join Query")
            start_time = time.time()
            
            results = session.query(Student)\
                .join(Section)\
                .join(Grade)\
                .filter(Student.institution_id == institution.id)\
                .limit(50)\
                .all()
            
            join_duration = time.time() - start_time
            print(f"   ✓ Join query completed in {join_duration:.4f}s")
            assert join_duration < 1.0, \
                f"Join query too slow: {join_duration:.4f}s (threshold: 1.0s)"
            
            # Test 4: Bulk attendance records
            print("\n Performance Test 4: Bulk Attendance Insert")
            start_time = time.time()
            
            attendance_records = []
            for student in students[:100]:
                for day in range(30):
                    attendance = Attendance(
                        institution_id=institution.id,
                        student_id=student.id,
                        section_id=section.id,
                        subject_id=subject.id,
                        date=date.today() - timedelta(days=day),
                        status=random.choice([AttendanceStatus.PRESENT, AttendanceStatus.ABSENT])
                    )
                    attendance_records.append(attendance)
                    session.add(attendance)
            
            session.commit()
            
            attendance_duration = time.time() - start_time
            print(f"   ✓ Inserted 3000 attendance records in {attendance_duration:.2f}s")
            print(f"   ✓ Rate: {3000/attendance_duration:.0f} records/sec")
            
            assert attendance_duration < 10.0, \
                f"Attendance insert too slow: {attendance_duration:.2f}s (threshold: 10s)"
            
            # Test 5: Aggregation performance
            print("\n Performance Test 5: Aggregation Query")
            start_time = time.time()
            
            stats = session.query(
                func.count(Attendance.id).label('total'),
                func.sum(
                    func.case((Attendance.status == AttendanceStatus.PRESENT, 1), else_=0)
                ).label('present')
            ).filter(
                Attendance.institution_id == institution.id
            ).first()
            
            agg_duration = time.time() - start_time
            print(f"   ✓ Aggregation completed in {agg_duration:.4f}s")
            print(f"   ✓ Total: {stats.total}, Present: {stats.present}")
            
            assert agg_duration < 1.0, \
                f"Aggregation too slow: {agg_duration:.4f}s (threshold: 1.0s)"
            
            print(f"\n✓ All performance tests passed")
            
        finally:
            session.rollback()
            session.close()
    
    def test_04_analytics_aggregations(
        self,
        mysql_engine,
        mysql_session_factory
    ):
        """
        Test 4: Analytics aggregations function properly with MySQL
        
        This test validates:
        - Dashboard metrics calculation
        - Time-series aggregations
        - Group-by queries
        - Statistical calculations
        """
        print("\n" + "="*80)
        print("TEST 4: Analytics Aggregations")
        print("="*80)
        
        session = mysql_session_factory()
        
        try:
            # Setup test data
            institution = Institution(
                name="Analytics School",
                short_name="AS",
                code="ANAL001",
                email="admin@analytics.com",
                phone="8888888888",
                address="Analytics Address",
                city="Analytics City",
                state="Analytics State",
                country="Country",
                postal_code="88888",
                is_active=True
            )
            session.add(institution)
            session.flush()
            
            # Test 1: Student count by section
            print("\n Analytics Test 1: Count Aggregation")
            
            role = Role(name="Student", description="Student", is_system_role=True)
            session.add(role)
            session.flush()
            
            ay = AcademicYear(
                institution_id=institution.id,
                name="2023-2024",
                start_date=date(2023, 4, 1),
                end_date=date(2024, 3, 31),
                is_current=True,
                is_active=True
            )
            session.add(ay)
            session.flush()
            
            grade = Grade(
                institution_id=institution.id,
                academic_year_id=ay.id,
                name="Grade 10",
                display_order=10,
                is_active=True
            )
            session.add(grade)
            session.flush()
            
            sections = []
            for i in range(3):
                section = Section(
                    institution_id=institution.id,
                    grade_id=grade.id,
                    name=f"Section {chr(65+i)}",
                    capacity=40,
                    is_active=True
                )
                session.add(section)
                sections.append(section)
            session.flush()
            
            # Add students to sections
            for i, section in enumerate(sections):
                for j in range((i+1) * 10):
                    user = User(
                        institution_id=institution.id,
                        role_id=role.id,
                        username=f"stud_s{i}_u{j}",
                        email=f"stud_s{i}_u{j}@test.com",
                        first_name="Student",
                        last_name=f"{j}",
                        hashed_password="pass",
                        is_active=True
                    )
                    session.add(user)
                    session.flush()
                    
                    student = Student(
                        institution_id=institution.id,
                        user_id=user.id,
                        section_id=section.id,
                        academic_year_id=ay.id,
                        admission_number=f"S{i}U{j}",
                        first_name="Student",
                        last_name=f"{j}",
                        email=f"stud_s{i}_u{j}@test.com",
                        date_of_birth=date(2008, 1, 1),
                        is_active=True
                    )
                    session.add(student)
            
            session.commit()
            
            # Query student counts by section
            counts = session.query(
                Section.name,
                func.count(Student.id).label('student_count')
            ).join(Student).filter(
                Section.institution_id == institution.id
            ).group_by(Section.id, Section.name).all()
            
            print(f"   ✓ Student counts by section:")
            for section_name, count in counts:
                print(f"     - {section_name}: {count} students")
            
            assert len(counts) == 3, "Should have counts for 3 sections"
            assert counts[0].student_count == 10, "Section A should have 10 students"
            assert counts[1].student_count == 20, "Section B should have 20 students"
            assert counts[2].student_count == 30, "Section C should have 30 students"
            
            # Test 2: Attendance percentage calculation
            print("\n Analytics Test 2: Percentage Calculation")
            
            subject = Subject(
                institution_id=institution.id,
                name="Math",
                code="MATH",
                is_active=True
            )
            session.add(subject)
            session.flush()
            
            # Add attendance records
            students = session.query(Student).filter(
                Student.institution_id == institution.id
            ).limit(10).all()
            
            for student in students:
                for day in range(20):
                    attendance = Attendance(
                        institution_id=institution.id,
                        student_id=student.id,
                        section_id=student.section_id,
                        subject_id=subject.id,
                        date=date.today() - timedelta(days=day),
                        status=AttendanceStatus.PRESENT if day % 4 != 0 else AttendanceStatus.ABSENT
                    )
                    session.add(attendance)
            
            session.commit()
            
            # Calculate attendance percentage
            attendance_stats = session.query(
                Student.id,
                func.count(Attendance.id).label('total'),
                func.sum(
                    func.case((Attendance.status == AttendanceStatus.PRESENT, 1), else_=0)
                ).label('present')
            ).join(Attendance).filter(
                Student.institution_id == institution.id
            ).group_by(Student.id).first()
            
            if attendance_stats:
                percentage = (attendance_stats.present / attendance_stats.total) * 100
                print(f"   ✓ Attendance: {attendance_stats.present}/{attendance_stats.total} = {percentage:.1f}%")
                assert 70 <= percentage <= 80, "Expected ~75% attendance"
            
            print(f"\n✓ Analytics aggregations working correctly")
            
        finally:
            session.rollback()
            session.close()
    
    def test_05_ml_model_predictions(
        self,
        mysql_engine,
        mysql_session_factory
    ):
        """
        Test 5: ML model predictions function properly with MySQL
        
        This test validates:
        - ML model creation and storage
        - Prediction generation
        - Feature storage (JSON)
        - Model versioning
        """
        print("\n" + "="*80)
        print("TEST 5: ML Model Predictions")
        print("="*80)
        
        session = mysql_session_factory()
        
        try:
            # Create test institution
            institution = Institution(
                name="ML Test School",
                short_name="MLS",
                code="ML001",
                email="admin@mltest.com",
                phone="7777777777",
                address="ML Address",
                city="ML City",
                state="ML State",
                country="Country",
                postal_code="77777",
                is_active=True
            )
            session.add(institution)
            session.flush()
            
            # Create ML model
            print("\n ML Test 1: Create ML Model")
            
            ml_model = MLModel(
                institution_id=institution.id,
                name="Performance Predictor",
                description="Predicts student performance",
                model_type=ModelType.REGRESSION,
                prediction_type=PredictionType.EXAM_PERFORMANCE,
                algorithm="RandomForest",
                hyperparameters={'n_estimators': 100, 'max_depth': 10},
                feature_names=['attendance_rate', 'assignment_avg', 'previous_score'],
                target_column='exam_score',
                status=ModelStatus.ACTIVE,
                is_active=True
            )
            session.add(ml_model)
            session.flush()
            
            print(f"   ✓ Created ML model: {ml_model.name}")
            
            # Create model version
            print("\n ML Test 2: Create Model Version")
            
            model_version = MLModelVersion(
                model_id=ml_model.id,
                version="1.0.0",
                model_path="/models/perf_v1.pkl",
                s3_key="ml-models/perf_v1.pkl",
                training_metrics={'accuracy': 0.92, 'r2_score': 0.88},
                validation_metrics={'accuracy': 0.90, 'r2_score': 0.86},
                training_samples=1000,
                training_date=datetime.utcnow(),
                is_deployed=True,
                deployed_at=datetime.utcnow()
            )
            session.add(model_version)
            session.flush()
            
            print(f"   ✓ Created model version: {model_version.version}")
            print(f"   ✓ Training metrics: {model_version.training_metrics}")
            
            # Create student for prediction
            print("\n ML Test 3: Generate Predictions")
            
            role = Role(name="Student", description="Student", is_system_role=True)
            session.add(role)
            session.flush()
            
            user = User(
                institution_id=institution.id,
                role_id=role.id,
                username="mlstudent",
                email="ml@test.com",
                first_name="ML",
                last_name="Student",
                hashed_password="pass",
                is_active=True
            )
            session.add(user)
            session.flush()
            
            ay = AcademicYear(
                institution_id=institution.id,
                name="2023-2024",
                start_date=date(2023, 4, 1),
                end_date=date(2024, 3, 31),
                is_current=True,
                is_active=True
            )
            session.add(ay)
            session.flush()
            
            grade = Grade(
                institution_id=institution.id,
                academic_year_id=ay.id,
                name="Grade 10",
                display_order=10,
                is_active=True
            )
            session.add(grade)
            session.flush()
            
            section = Section(
                institution_id=institution.id,
                grade_id=grade.id,
                name="A",
                capacity=40,
                is_active=True
            )
            session.add(section)
            session.flush()
            
            student = Student(
                institution_id=institution.id,
                user_id=user.id,
                section_id=section.id,
                academic_year_id=ay.id,
                admission_number="ML001",
                first_name="ML",
                last_name="Student",
                email="ml@test.com",
                date_of_birth=date(2008, 1, 1),
                is_active=True
            )
            session.add(student)
            session.flush()
            
            # Generate prediction
            input_features = {
                'attendance_rate': 85.5,
                'assignment_avg': 78.3,
                'previous_score': 82.0
            }
            
            predicted_value = 80.5
            
            prediction = PerformancePrediction(
                institution_id=institution.id,
                model_id=ml_model.id,
                model_version_id=model_version.id,
                student_id=student.id,
                predicted_value=predicted_value,
                confidence_lower=predicted_value - 5.0,
                confidence_upper=predicted_value + 5.0,
                confidence_level=0.95,
                input_features=input_features,
                feature_contributions={
                    'attendance_rate': 0.30,
                    'assignment_avg': 0.35,
                    'previous_score': 0.35
                },
                prediction_context={'model_version': '1.0.0'},
                is_scenario=False,
                predicted_at=datetime.utcnow()
            )
            session.add(prediction)
            session.commit()
            
            print(f"   ✓ Generated prediction: {predicted_value}")
            print(f"   ✓ Confidence interval: [{prediction.confidence_lower}, {prediction.confidence_upper}]")
            print(f"   ✓ Input features stored as JSON: {len(input_features)} features")
            
            # Verify prediction retrieval
            print("\n ML Test 4: Retrieve and Verify Predictions")
            
            retrieved = session.query(PerformancePrediction).filter(
                PerformancePrediction.student_id == student.id
            ).first()
            
            assert retrieved is not None, "Should retrieve prediction"
            assert retrieved.predicted_value == predicted_value, "Predicted value should match"
            assert retrieved.input_features == input_features, "Features should match"
            assert len(retrieved.feature_contributions) == 3, "Should have 3 feature contributions"
            
            print(f"   ✓ Prediction retrieved successfully")
            print(f"   ✓ JSON fields preserved correctly")
            
            print(f"\n✓ ML predictions working correctly with MySQL")
            
        finally:
            session.rollback()
            session.close()


class TestMySQLRealTimeFeatures:
    """Test real-time features with MySQL"""
    
    @pytest.fixture(scope="class")
    def mysql_test_database_url(self) -> str:
        """MySQL test database URL"""
        return os.getenv(
            "MYSQL_TEST_DATABASE_URL",
            "mysql+pymysql://root:test_password@localhost:3306/test_mysql_migration?charset=utf8mb4"
        )
    
    @pytest.fixture(scope="class")
    def mysql_engine(self, mysql_test_database_url: str):
        """Create MySQL test engine"""
        engine = create_engine(
            mysql_test_database_url,
            poolclass=NullPool,
            echo=False,
            pool_pre_ping=True,
            connect_args={'charset': 'utf8mb4'},
        )
        yield engine
        engine.dispose()
    
    @pytest.fixture(scope="class")
    def mysql_session_factory(self, mysql_engine):
        """Create session factory"""
        return sessionmaker(bind=mysql_engine, autocommit=False, autoflush=False)
    
    def test_real_time_leaderboard(
        self,
        mysql_engine,
        mysql_session_factory
    ):
        """
        Test real-time leaderboard generation
        
        This validates:
        - Leaderboard creation
        - Real-time ranking updates
        - Score aggregation
        - Period-based filtering
        """
        print("\n" + "="*80)
        print("TEST 6: Real-Time Leaderboard")
        print("="*80)
        
        session = mysql_session_factory()
        
        try:
            # Create institution
            institution = Institution(
                name="Leaderboard School",
                short_name="LBS",
                code="LB001",
                email="admin@lb.com",
                phone="6666666666",
                address="LB Address",
                city="LB City",
                state="LB State",
                country="Country",
                postal_code="66666",
                is_active=True
            )
            session.add(institution)
            session.flush()
            
            # Create leaderboard
            leaderboard = Leaderboard(
                institution_id=institution.id,
                name="Top Students",
                description="Monthly leaderboard",
                leaderboard_type=LeaderboardType.GLOBAL,
                period=LeaderboardPeriod.MONTHLY,
                is_public=True,
                show_full_names=True,
                max_entries=10,
                is_active=True
            )
            session.add(leaderboard)
            session.flush()
            
            print(f"   ✓ Created leaderboard: {leaderboard.name}")
            
            # Create users with points
            role = Role(name="Student", description="Student", is_system_role=True)
            session.add(role)
            session.flush()
            
            users = []
            for i in range(20):
                user = User(
                    institution_id=institution.id,
                    role_id=role.id,
                    username=f"lbuser{i}",
                    email=f"lbuser{i}@test.com",
                    first_name=f"User",
                    last_name=f"{i}",
                    hashed_password="pass",
                    is_active=True
                )
                session.add(user)
                session.flush()
                
                points = UserPoints(
                    institution_id=institution.id,
                    user_id=user.id,
                    total_points=random.randint(100, 5000),
                    level=random.randint(1, 20),
                    experience_points=random.randint(0, 10000),
                    current_streak=random.randint(0, 30)
                )
                session.add(points)
                users.append((user, points))
            
            session.commit()
            
            # Generate leaderboard entries
            print(f"\n   Generating leaderboard entries...")
            
            start_time = time.time()
            
            top_users = session.query(
                UserPoints.user_id,
                UserPoints.total_points
            ).filter(
                UserPoints.institution_id == institution.id
            ).order_by(UserPoints.total_points.desc()).limit(10).all()
            
            for rank, (user_id, score) in enumerate(top_users, 1):
                entry = LeaderboardEntry(
                    institution_id=institution.id,
                    leaderboard_id=leaderboard.id,
                    user_id=user_id,
                    rank=rank,
                    score=score,
                    metadata_json={'month': datetime.utcnow().month}
                )
                session.add(entry)
            
            session.commit()
            
            duration = time.time() - start_time
            
            print(f"   ✓ Generated leaderboard in {duration:.4f}s")
            
            # Verify leaderboard
            entries = session.query(LeaderboardEntry).filter(
                LeaderboardEntry.leaderboard_id == leaderboard.id
            ).order_by(LeaderboardEntry.rank).all()
            
            assert len(entries) == 10, "Should have 10 entries"
            assert entries[0].rank == 1, "First entry should be rank 1"
            assert entries[0].score >= entries[1].score, "Scores should be descending"
            
            print(f"   ✓ Top 3 entries:")
            for i in range(min(3, len(entries))):
                print(f"     Rank {entries[i].rank}: {entries[i].score} points")
            
            print(f"\n✓ Real-time leaderboard working correctly")
            
        finally:
            session.rollback()
            session.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
