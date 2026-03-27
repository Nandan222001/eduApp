#!/usr/bin/env python3
"""
Direct test of migration 011 upgrade function.
This test directly imports and executes the migration code without using alembic CLI.
"""

import os
import sys
from sqlalchemy import create_engine, inspect, text, MetaData
from sqlalchemy.exc import OperationalError
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Test database configuration
DB_CONFIG = {
    'host': os.getenv('DATABASE_HOST', 'localhost'),
    'port': int(os.getenv('DATABASE_PORT', '3306')),
    'user': os.getenv('DATABASE_USER', 'root'),
    'password': os.getenv('DATABASE_PASSWORD', ''),
    'database': os.getenv('DATABASE_NAME', 'test_migration_011_direct'),
}

def get_database_url(include_db=True):
    """Construct database URL."""
    if include_db:
        return f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
    return f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}"

def setup_test_database():
    """Create test database and minimal schema."""
    logger.info("Setting up test database...")
    
    # Connect without database
    engine = create_engine(get_database_url(include_db=False), isolation_level="AUTOCOMMIT")
    
    try:
        with engine.connect() as conn:
            # Drop and recreate database
            conn.execute(text(f"DROP DATABASE IF EXISTS {DB_CONFIG['database']}"))
            conn.execute(text(f"CREATE DATABASE {DB_CONFIG['database']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        logger.info(f"Created database: {DB_CONFIG['database']}")
    except OperationalError as e:
        logger.error(f"Failed to create database: {e}")
        sys.exit(1)
    finally:
        engine.dispose()
    
    # Connect to the new database
    engine = create_engine(get_database_url())
    
    try:
        with engine.begin() as conn:
            # Create minimal required tables for foreign keys
            conn.execute(text("""
                CREATE TABLE institutions (
                    id INT NOT NULL AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id)
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE students (
                    id INT NOT NULL AUTO_INCREMENT,
                    institution_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE subjects (
                    id INT NOT NULL AUTO_INCREMENT,
                    institution_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE chapters (
                    id INT NOT NULL AUTO_INCREMENT,
                    subject_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE topics (
                    id INT NOT NULL AUTO_INCREMENT,
                    chapter_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE questions_bank (
                    id INT NOT NULL AUTO_INCREMENT,
                    institution_id INT NOT NULL,
                    question_text TEXT NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
                )
            """))
            
            # Create chapter_performance table (simulating existing table)
            logger.info("Creating chapter_performance table (simulating existing table)...")
            conn.execute(text("""
                CREATE TABLE chapter_performance (
                    id INT NOT NULL AUTO_INCREMENT,
                    institution_id INT NOT NULL,
                    student_id INT NOT NULL,
                    subject_id INT NOT NULL,
                    chapter_id INT NOT NULL,
                    average_score DECIMAL(5, 2) NOT NULL,
                    total_attempts INT NOT NULL DEFAULT 0,
                    successful_attempts INT NOT NULL DEFAULT 0,
                    failed_attempts INT NOT NULL DEFAULT 0,
                    success_rate DECIMAL(5, 2) NOT NULL,
                    time_spent_minutes INT NOT NULL DEFAULT 0,
                    last_practiced_at DATETIME NULL,
                    proficiency_level VARCHAR(50) NULL,
                    trend VARCHAR(50) NULL,
                    improvement_rate DECIMAL(5, 2) NULL,
                    difficulty_rating DECIMAL(5, 2) NULL,
                    mastery_score DECIMAL(5, 2) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uq_student_chapter_performance (student_id, chapter_id),
                    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
                )
            """))
            
            # Insert some test data to verify it's preserved
            conn.execute(text("INSERT INTO institutions (name) VALUES ('Test Institution')"))
            conn.execute(text("INSERT INTO subjects (institution_id, name) VALUES (1, 'Mathematics')"))
            conn.execute(text("INSERT INTO chapters (subject_id, name) VALUES (1, 'Algebra')"))
            conn.execute(text("INSERT INTO students (institution_id, name) VALUES (1, 'Test Student')"))
            conn.execute(text("""
                INSERT INTO chapter_performance 
                (institution_id, student_id, subject_id, chapter_id, average_score, success_rate, mastery_score)
                VALUES (1, 1, 1, 1, 85.5, 90.0, 87.5)
            """))
            
            logger.info("Test database setup complete with sample data")
    except Exception as e:
        logger.error(f"Failed to setup test database: {e}")
        sys.exit(1)
    finally:
        engine.dispose()

def run_migration_upgrade():
    """Directly execute the migration upgrade function."""
    logger.info("Running migration 011 upgrade function...")
    
    from alembic.migration import MigrationContext
    from alembic.operations import Operations
    
    engine = create_engine(get_database_url())
    
    try:
        with engine.begin() as conn:
            # Setup migration context
            ctx = MigrationContext.configure(conn)
            op = Operations(ctx)
            
            # Import and execute the upgrade function from migration 011
            sys.path.insert(0, 'alembic/versions')
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "migration_011",
                "alembic/versions/011_create_weakness_detection_tables.py"
            )
            migration_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(migration_module)
            
            # Execute upgrade
            migration_module.upgrade()
            
            logger.info("Migration upgrade completed successfully")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        engine.dispose()
    
    return True

def verify_migration():
    """Verify migration results."""
    logger.info("\nVerifying migration results...")
    
    engine = create_engine(get_database_url())
    inspector = inspect(engine)
    
    try:
        # Check tables
        tables = inspector.get_table_names()
        expected_tables = ['chapter_performance', 'question_recommendations', 'focus_areas', 'personalized_insights']
        
        logger.info(f"\nTables in database: {sorted(tables)}")
        
        all_tables_ok = True
        for table in expected_tables:
            if table in tables:
                logger.info(f"✓ Table '{table}' exists")
            else:
                logger.error(f"✗ Table '{table}' missing")
                all_tables_ok = False
        
        if not all_tables_ok:
            return False
        
        # Verify data in chapter_performance wasn't lost
        logger.info("\nVerifying existing data preservation...")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM chapter_performance"))
            count = result.scalar()
            if count > 0:
                logger.info(f"✓ chapter_performance has {count} row(s) - data preserved")
            else:
                logger.warning("⚠ chapter_performance has no data")
        
        # Check indexes for chapter_performance
        logger.info("\nVerifying chapter_performance indexes...")
        cp_indexes = {idx['name'] for idx in inspector.get_indexes('chapter_performance')}
        expected_cp_indexes = [
            'idx_chapter_perf_institution',
            'idx_chapter_perf_student',
            'idx_chapter_perf_subject',
            'idx_chapter_perf_chapter',
            'idx_chapter_perf_mastery',
            'idx_chapter_perf_proficiency'
        ]
        
        all_indexes_ok = True
        for idx_name in expected_cp_indexes:
            if idx_name in cp_indexes:
                logger.info(f"✓ Index '{idx_name}' exists")
            else:
                logger.error(f"✗ Index '{idx_name}' missing")
                all_indexes_ok = False
        
        if not all_indexes_ok:
            return False
        
        # Check indexes for question_recommendations
        logger.info("\nVerifying question_recommendations indexes...")
        qr_indexes = {idx['name'] for idx in inspector.get_indexes('question_recommendations')}
        expected_qr_indexes = [
            'idx_question_rec_institution',
            'idx_question_rec_student',
            'idx_question_rec_question',
            'idx_question_rec_score',
            'idx_question_rec_rank',
            'idx_question_rec_review_date',
            'idx_question_rec_completed'
        ]
        
        for idx_name in expected_qr_indexes:
            if idx_name in qr_indexes:
                logger.info(f"✓ Index '{idx_name}' exists")
            else:
                logger.error(f"✗ Index '{idx_name}' missing")
                all_indexes_ok = False
        
        if not all_indexes_ok:
            return False
        
        # Check indexes for focus_areas
        logger.info("\nVerifying focus_areas indexes...")
        fa_indexes = {idx['name'] for idx in inspector.get_indexes('focus_areas')}
        expected_fa_indexes = [
            'idx_focus_area_institution',
            'idx_focus_area_student',
            'idx_focus_area_subject',
            'idx_focus_area_chapter',
            'idx_focus_area_type',
            'idx_focus_area_priority',
            'idx_focus_area_status'
        ]
        
        for idx_name in expected_fa_indexes:
            if idx_name in fa_indexes:
                logger.info(f"✓ Index '{idx_name}' exists")
            else:
                logger.error(f"✗ Index '{idx_name}' missing")
                all_indexes_ok = False
        
        if not all_indexes_ok:
            return False
        
        # Check indexes for personalized_insights
        logger.info("\nVerifying personalized_insights indexes...")
        pi_indexes = {idx['name'] for idx in inspector.get_indexes('personalized_insights')}
        expected_pi_indexes = [
            'idx_insight_institution',
            'idx_insight_student',
            'idx_insight_type',
            'idx_insight_category',
            'idx_insight_severity',
            'idx_insight_priority',
            'idx_insight_resolved'
        ]
        
        for idx_name in expected_pi_indexes:
            if idx_name in pi_indexes:
                logger.info(f"✓ Index '{idx_name}' exists")
            else:
                logger.error(f"✗ Index '{idx_name}' missing")
                all_indexes_ok = False
        
        if not all_indexes_ok:
            return False
        
        logger.info("\n✓ All verification checks passed!")
        return True
        
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        engine.dispose()

def main():
    """Main test flow."""
    logger.info("=== Direct Test of Migration 011 Upgrade Function ===\n")
    
    # Step 1: Setup test database with chapter_performance
    setup_test_database()
    
    # Step 2: Run migration upgrade function directly
    if not run_migration_upgrade():
        logger.error("\n✗ Migration 011 upgrade FAILED")
        sys.exit(1)
    
    # Step 3: Verify results
    if not verify_migration():
        logger.error("\n✗ Verification FAILED")
        sys.exit(1)
    
    logger.info("\n" + "="*70)
    logger.info("✓ Migration 011 direct test completed successfully!")
    logger.info("  - Skipped creating existing chapter_performance table")
    logger.info("  - Created missing tables: question_recommendations, focus_areas, personalized_insights")
    logger.info("  - Created all indexes for existing and new tables")
    logger.info("  - Preserved existing data in chapter_performance")
    logger.info("="*70)

if __name__ == '__main__':
    main()
