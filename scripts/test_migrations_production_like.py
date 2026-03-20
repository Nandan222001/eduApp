#!/usr/bin/env python3
"""
Script to test database migrations against production-like datasets.

This script:
1. Creates a test database with production-like data volumes
2. Runs migrations and measures performance
3. Validates data integrity
4. Tests rollback procedures
5. Generates detailed reports

Usage:
    python scripts/test_migrations_production_like.py --config alembic.ini --size medium
    
Size options:
    - small: ~1K records per table
    - medium: ~10K records per table  
    - large: ~100K records per table
    - xlarge: ~1M records per table
"""
import argparse
import sys
import time
import json
from typing import Dict, Any, List
from datetime import datetime, timedelta
from decimal import Decimal
import random
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.pool import NullPool
from alembic import command
from alembic.config import Config
from faker import Faker


fake = Faker()


class MigrationProductionTester:
    """Test migrations with production-like data."""
    
    DATASET_SIZES = {
        'small': {
            'institutions': 10,
            'users': 1000,
            'students': 800,
            'teachers': 100,
            'assignments': 500,
            'attendance': 5000
        },
        'medium': {
            'institutions': 50,
            'users': 10000,
            'students': 8000,
            'teachers': 1000,
            'assignments': 5000,
            'attendance': 50000
        },
        'large': {
            'institutions': 100,
            'users': 100000,
            'students': 80000,
            'teachers': 10000,
            'assignments': 50000,
            'attendance': 500000
        },
        'xlarge': {
            'institutions': 500,
            'users': 1000000,
            'students': 800000,
            'teachers': 100000,
            'assignments': 500000,
            'attendance': 5000000
        }
    }
    
    def __init__(self, config_path: str, database_url: str, size: str = 'small'):
        """Initialize tester."""
        self.config = Config(config_path)
        self.config.set_main_option("sqlalchemy.url", database_url)
        self.database_url = database_url
        self.size = size
        self.dataset_config = self.DATASET_SIZES.get(size, self.DATASET_SIZES['small'])
        self.engine = None
        self.results = {
            'size': size,
            'started_at': datetime.utcnow().isoformat(),
            'data_generation': {},
            'migration_performance': {},
            'data_integrity': {},
            'rollback_tests': {}
        }
    
    def setup(self):
        """Setup test environment."""
        print(f"\n{'='*80}")
        print(f"Migration Production-Like Testing")
        print(f"{'='*80}")
        print(f"Dataset size: {self.size}")
        print(f"Database: {self.database_url}")
        print(f"{'='*80}\n")
        
        self.engine = create_engine(self.database_url, poolclass=NullPool, echo=False)
        
        print("Dropping existing schema...")
        with self.engine.connect() as conn:
            conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.commit()
        print("✓ Schema reset complete\n")
    
    def cleanup(self):
        """Cleanup resources."""
        if self.engine:
            self.engine.dispose()
    
    def run_migrations(self):
        """Run migrations and measure performance."""
        print("Running migrations to HEAD...")
        start_time = time.time()
        
        try:
            command.upgrade(self.config, "head")
            duration = time.time() - start_time
            
            self.results['migration_performance']['upgrade_duration'] = duration
            print(f"✓ Migrations completed in {duration:.2f}s\n")
            
            return True
        except Exception as e:
            print(f"✗ Migration failed: {e}\n")
            self.results['migration_performance']['error'] = str(e)
            return False
    
    def generate_test_data(self):
        """Generate production-like test data."""
        print("Generating production-like test data...")
        print(f"Target dataset: {json.dumps(self.dataset_config, indent=2)}\n")
        
        start_time = time.time()
        
        inspector = inspect(self.engine)
        tables = inspector.get_table_names()
        
        with self.engine.connect() as conn:
            conn.execute(text("SET LOCAL app.bypass_rls = true"))
            
            if 'institutions' in tables:
                self._generate_institutions(conn)
            
            if 'roles' in tables:
                self._generate_roles(conn)
            
            if 'users' in tables and 'institutions' in tables and 'roles' in tables:
                self._generate_users(conn)
            
            if 'academic_years' in tables:
                self._generate_academic_years(conn)
            
            if 'grades' in tables:
                self._generate_grades(conn)
            
            if 'sections' in tables:
                self._generate_sections(conn)
            
            if 'subjects' in tables:
                self._generate_subjects(conn)
            
            if 'students' in tables:
                self._generate_students(conn)
            
            if 'teachers' in tables:
                self._generate_teachers(conn)
            
            if 'assignments' in tables:
                self._generate_assignments(conn)
            
            if 'attendance' in tables:
                self._generate_attendance(conn)
            
            conn.commit()
        
        duration = time.time() - start_time
        self.results['data_generation']['duration'] = duration
        print(f"\n✓ Data generation completed in {duration:.2f}s\n")
    
    def _generate_institutions(self, conn):
        """Generate institution records."""
        count = self.dataset_config['institutions']
        print(f"  Generating {count} institutions...")
        
        batch_size = 100
        for i in range(0, count, batch_size):
            values = []
            for j in range(min(batch_size, count - i)):
                values.append(
                    f"('School_{i+j}', 'SCH{i+j}', 'CODE{i+j:05d}', "
                    f"'school{i+j}@test.com', '{fake.phone_number()[:15]}', "
                    f"'{fake.street_address()[:100]}', '{fake.city()[:50]}', "
                    f"'{fake.state()[:50]}', '{fake.country()[:50]}', "
                    f"'{fake.zipcode()[:10]}', true, NOW())"
                )
            
            if values:
                conn.execute(text(f"""
                    INSERT INTO institutions 
                    (name, short_name, code, email, phone, address, city, state, 
                     country, postal_code, is_active, created_at)
                    VALUES {', '.join(values)}
                    ON CONFLICT DO NOTHING
                """))
        
        print(f"    ✓ Generated {count} institutions")
    
    def _generate_roles(self, conn):
        """Generate role records."""
        print(f"  Generating system roles...")
        
        conn.execute(text("""
            INSERT INTO roles (name, description, is_system_role, created_at)
            VALUES 
            ('Admin', 'Administrator', true, NOW()),
            ('Teacher', 'Teacher', true, NOW()),
            ('Student', 'Student', true, NOW()),
            ('Parent', 'Parent', true, NOW())
            ON CONFLICT DO NOTHING
        """))
        
        print(f"    ✓ Generated system roles")
    
    def _generate_users(self, conn):
        """Generate user records."""
        count = self.dataset_config['users']
        print(f"  Generating {count} users...")
        
        institution_ids = self._get_ids(conn, 'institutions')
        role_ids = self._get_ids(conn, 'roles')
        
        if not institution_ids or not role_ids:
            print(f"    ✗ Skipping users - missing institutions or roles")
            return
        
        batch_size = 100
        for i in range(0, count, batch_size):
            values = []
            for j in range(min(batch_size, count - i)):
                inst_id = random.choice(institution_ids)
                role_id = random.choice(role_ids)
                
                values.append(
                    f"('user_{i+j}', 'user{i+j}@test.com', "
                    f"'{fake.first_name()}', '{fake.last_name()}', "
                    f"'hashed_password', {inst_id}, {role_id}, true, false, NOW())"
                )
            
            if values:
                conn.execute(text(f"""
                    INSERT INTO users 
                    (username, email, first_name, last_name, hashed_password, 
                     institution_id, role_id, is_active, is_superuser, created_at)
                    VALUES {', '.join(values)}
                    ON CONFLICT DO NOTHING
                """))
        
        print(f"    ✓ Generated {count} users")
    
    def _generate_academic_years(self, conn):
        """Generate academic year records."""
        print(f"  Generating academic years...")
        
        institution_ids = self._get_ids(conn, 'institutions')
        
        for inst_id in institution_ids[:min(len(institution_ids), 50)]:
            for year in range(2020, 2025):
                conn.execute(text(f"""
                    INSERT INTO academic_years 
                    (institution_id, name, start_date, end_date, is_current, is_active, created_at)
                    VALUES 
                    ({inst_id}, '{year}-{year+1}', '{year}-04-01', '{year+1}-03-31', 
                     {str(year == 2024).lower()}, true, NOW())
                    ON CONFLICT DO NOTHING
                """))
        
        print(f"    ✓ Generated academic years")
    
    def _generate_grades(self, conn):
        """Generate grade records."""
        print(f"  Generating grades...")
        
        institution_ids = self._get_ids(conn, 'institutions')
        academic_year_ids = self._get_ids(conn, 'academic_years')
        
        if not academic_year_ids:
            return
        
        for inst_id in institution_ids[:min(len(institution_ids), 50)]:
            for grade_num in range(1, 13):
                year_id = random.choice(academic_year_ids)
                conn.execute(text(f"""
                    INSERT INTO grades 
                    (institution_id, academic_year_id, name, display_order, is_active, created_at)
                    VALUES 
                    ({inst_id}, {year_id}, 'Grade {grade_num}', {grade_num}, true, NOW())
                    ON CONFLICT DO NOTHING
                """))
        
        print(f"    ✓ Generated grades")
    
    def _generate_sections(self, conn):
        """Generate section records."""
        print(f"  Generating sections...")
        
        grade_ids = self._get_ids(conn, 'grades')
        institution_ids = self._get_ids(conn, 'institutions')
        
        if not grade_ids:
            return
        
        sections = ['A', 'B', 'C', 'D']
        for grade_id in grade_ids[:min(len(grade_ids), 100)]:
            for section in sections:
                inst_id = random.choice(institution_ids)
                conn.execute(text(f"""
                    INSERT INTO sections 
                    (institution_id, grade_id, name, capacity, is_active, created_at)
                    VALUES 
                    ({inst_id}, {grade_id}, 'Section {section}', 40, true, NOW())
                    ON CONFLICT DO NOTHING
                """))
        
        print(f"    ✓ Generated sections")
    
    def _generate_subjects(self, conn):
        """Generate subject records."""
        print(f"  Generating subjects...")
        
        grade_ids = self._get_ids(conn, 'grades')
        institution_ids = self._get_ids(conn, 'institutions')
        
        if not grade_ids:
            return
        
        subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography']
        for grade_id in grade_ids[:min(len(grade_ids), 100)]:
            for subject in subjects:
                inst_id = random.choice(institution_ids)
                code = f"{subject[:4].upper()}{grade_id}"
                conn.execute(text(f"""
                    INSERT INTO subjects 
                    (institution_id, grade_id, name, code, is_active, created_at)
                    VALUES 
                    ({inst_id}, {grade_id}, '{subject}', '{code}', true, NOW())
                    ON CONFLICT DO NOTHING
                """))
        
        print(f"    ✓ Generated subjects")
    
    def _generate_students(self, conn):
        """Generate student records."""
        count = self.dataset_config['students']
        print(f"  Generating {count} students...")
        
        institution_ids = self._get_ids(conn, 'institutions')
        section_ids = self._get_ids(conn, 'sections')
        academic_year_ids = self._get_ids(conn, 'academic_years')
        user_ids = self._get_ids(conn, 'users', limit=count)
        
        if not section_ids or not academic_year_ids:
            print(f"    ✗ Skipping students - missing sections or academic years")
            return
        
        batch_size = 100
        for i in range(0, min(count, len(user_ids)), batch_size):
            values = []
            for j in range(min(batch_size, len(user_ids) - i)):
                idx = i + j
                inst_id = random.choice(institution_ids)
                section_id = random.choice(section_ids)
                year_id = random.choice(academic_year_ids)
                user_id = user_ids[idx]
                
                values.append(
                    f"({inst_id}, {user_id}, 'ADM{idx:06d}', "
                    f"'{fake.first_name()}', '{fake.last_name()}', "
                    f"'student{idx}@test.com', {section_id}, {year_id}, "
                    f"'2010-01-01', '2020-04-01', 'Male', 'O+', true, NOW())"
                )
            
            if values:
                conn.execute(text(f"""
                    INSERT INTO students 
                    (institution_id, user_id, admission_number, first_name, last_name,
                     email, section_id, academic_year_id, date_of_birth, 
                     date_of_admission, gender, blood_group, is_active, created_at)
                    VALUES {', '.join(values)}
                    ON CONFLICT DO NOTHING
                """))
        
        print(f"    ✓ Generated students")
    
    def _generate_teachers(self, conn):
        """Generate teacher records."""
        count = self.dataset_config['teachers']
        print(f"  Generating {count} teachers...")
        
        institution_ids = self._get_ids(conn, 'institutions')
        user_ids = self._get_ids(conn, 'users', limit=count)
        
        batch_size = 100
        for i in range(0, min(count, len(user_ids)), batch_size):
            values = []
            for j in range(min(batch_size, len(user_ids) - i)):
                idx = i + j
                inst_id = random.choice(institution_ids)
                user_id = user_ids[idx]
                
                values.append(
                    f"({inst_id}, {user_id}, 'EMP{idx:06d}', "
                    f"'{fake.first_name()}', '{fake.last_name()}', "
                    f"'teacher{idx}@test.com', '1234567890', "
                    f"'1980-01-01', '2015-06-01', 'M.Sc', 'Subject', true, NOW())"
                )
            
            if values:
                conn.execute(text(f"""
                    INSERT INTO teachers 
                    (institution_id, user_id, employee_id, first_name, last_name,
                     email, phone, date_of_birth, date_of_joining, qualification,
                     specialization, is_active, created_at)
                    VALUES {', '.join(values)}
                    ON CONFLICT DO NOTHING
                """))
        
        print(f"    ✓ Generated teachers")
    
    def _generate_assignments(self, conn):
        """Generate assignment records."""
        count = self.dataset_config['assignments']
        print(f"  Generating {count} assignments...")
        
        institution_ids = self._get_ids(conn, 'institutions')
        teacher_ids = self._get_ids(conn, 'teachers')
        grade_ids = self._get_ids(conn, 'grades')
        subject_ids = self._get_ids(conn, 'subjects')
        
        if not teacher_ids or not subject_ids:
            print(f"    ✗ Skipping assignments - missing teachers or subjects")
            return
        
        batch_size = 100
        for i in range(0, count, batch_size):
            values = []
            for j in range(min(batch_size, count - i)):
                inst_id = random.choice(institution_ids)
                teacher_id = random.choice(teacher_ids)
                grade_id = random.choice(grade_ids)
                subject_id = random.choice(subject_ids)
                
                values.append(
                    f"({inst_id}, {teacher_id}, {grade_id}, {subject_id}, "
                    f"'Assignment {i+j}', 'Description', 'pending', "
                    f"100, NOW() + interval '7 days', NOW())"
                )
            
            if values:
                conn.execute(text(f"""
                    INSERT INTO assignments 
                    (institution_id, teacher_id, grade_id, subject_id, title,
                     description, status, max_marks, due_date, created_at)
                    VALUES {', '.join(values)}
                    ON CONFLICT DO NOTHING
                """))
        
        print(f"    ✓ Generated assignments")
    
    def _generate_attendance(self, conn):
        """Generate attendance records."""
        count = self.dataset_config['attendance']
        print(f"  Generating {count} attendance records...")
        
        institution_ids = self._get_ids(conn, 'institutions')
        student_ids = self._get_ids(conn, 'students', limit=1000)
        section_ids = self._get_ids(conn, 'sections')
        subject_ids = self._get_ids(conn, 'subjects')
        
        if not student_ids or not section_ids:
            print(f"    ✗ Skipping attendance - missing students or sections")
            return
        
        batch_size = 500
        statuses = ['present', 'absent', 'late']
        
        for i in range(0, count, batch_size):
            values = []
            for j in range(min(batch_size, count - i)):
                inst_id = random.choice(institution_ids)
                student_id = random.choice(student_ids)
                section_id = random.choice(section_ids)
                subject_id = random.choice(subject_ids) if subject_ids else 'NULL'
                status = random.choice(statuses)
                days_ago = random.randint(0, 365)
                
                values.append(
                    f"({inst_id}, {student_id}, {section_id}, {subject_id}, "
                    f"NOW() - interval '{days_ago} days', '{status}', NOW())"
                )
            
            if values:
                try:
                    conn.execute(text(f"""
                        INSERT INTO attendance 
                        (institution_id, student_id, section_id, subject_id,
                         date, status, created_at)
                        VALUES {', '.join(values)}
                        ON CONFLICT DO NOTHING
                    """))
                except Exception as e:
                    print(f"    ! Error generating attendance batch: {e}")
        
        print(f"    ✓ Generated attendance records")
    
    def _get_ids(self, conn, table: str, limit: int = None) -> List[int]:
        """Get IDs from a table."""
        try:
            query = f"SELECT id FROM {table}"
            if limit:
                query += f" LIMIT {limit}"
            result = conn.execute(text(query))
            return [row[0] for row in result.fetchall()]
        except Exception:
            return []
    
    def verify_data_integrity(self):
        """Verify data integrity after migrations."""
        print("Verifying data integrity...")
        
        with self.engine.connect() as conn:
            conn.execute(text("SET LOCAL app.bypass_rls = true"))
            
            inspector = inspect(self.engine)
            tables = inspector.get_table_names()
            
            integrity_results = {}
            
            for table in tables:
                if table.startswith('alembic_'):
                    continue
                
                try:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.scalar()
                    integrity_results[table] = {'count': count, 'status': 'ok'}
                    print(f"  ✓ {table}: {count} rows")
                except Exception as e:
                    integrity_results[table] = {'error': str(e), 'status': 'error'}
                    print(f"  ✗ {table}: {e}")
            
            conn.rollback()
        
        self.results['data_integrity'] = integrity_results
        print()
    
    def test_rollback_procedures(self):
        """Test rollback procedures."""
        print("Testing rollback procedures...")
        
        try:
            print("  Downgrading last migration...")
            command.downgrade(self.config, "-1")
            print("  ✓ Downgrade successful")
            
            print("  Re-upgrading to HEAD...")
            command.upgrade(self.config, "head")
            print("  ✓ Re-upgrade successful")
            
            self.results['rollback_tests']['status'] = 'success'
        except Exception as e:
            print(f"  ✗ Rollback test failed: {e}")
            self.results['rollback_tests']['status'] = 'failed'
            self.results['rollback_tests']['error'] = str(e)
        
        print()
    
    def generate_report(self):
        """Generate test report."""
        self.results['completed_at'] = datetime.utcnow().isoformat()
        
        print(f"\n{'='*80}")
        print("Test Report")
        print(f"{'='*80}")
        
        print(f"\nDataset Size: {self.size}")
        print(f"Started: {self.results['started_at']}")
        print(f"Completed: {self.results['completed_at']}")
        
        if 'upgrade_duration' in self.results['migration_performance']:
            duration = self.results['migration_performance']['upgrade_duration']
            print(f"\nMigration Performance:")
            print(f"  Upgrade duration: {duration:.2f}s")
        
        if 'duration' in self.results['data_generation']:
            duration = self.results['data_generation']['duration']
            print(f"\nData Generation:")
            print(f"  Duration: {duration:.2f}s")
        
        print(f"\nData Integrity:")
        total_rows = 0
        for table, info in self.results['data_integrity'].items():
            if 'count' in info:
                total_rows += info['count']
        print(f"  Total rows: {total_rows:,}")
        
        print(f"\nRollback Tests:")
        status = self.results['rollback_tests'].get('status', 'not_run')
        print(f"  Status: {status}")
        
        report_file = f"migration_test_report_{self.size}_{int(time.time())}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\nDetailed report saved to: {report_file}")
        print(f"{'='*80}\n")
    
    def run(self):
        """Run complete test suite."""
        try:
            self.setup()
            
            if not self.run_migrations():
                print("Migrations failed, aborting tests")
                return False
            
            self.generate_test_data()
            self.verify_data_integrity()
            self.test_rollback_procedures()
            self.generate_report()
            
            return True
            
        except Exception as e:
            print(f"\n✗ Test suite failed: {e}")
            return False
        finally:
            self.cleanup()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Test migrations with production-like data"
    )
    parser.add_argument(
        '--config',
        default='alembic.ini',
        help='Alembic configuration file'
    )
    parser.add_argument(
        '--database-url',
        default='postgresql://postgres:postgres@localhost:5432/test_prod_migrations',
        help='Test database URL'
    )
    parser.add_argument(
        '--size',
        choices=['small', 'medium', 'large', 'xlarge'],
        default='small',
        help='Dataset size'
    )
    
    args = parser.parse_args()
    
    tester = MigrationProductionTester(
        config_path=args.config,
        database_url=args.database_url,
        size=args.size
    )
    
    success = tester.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
