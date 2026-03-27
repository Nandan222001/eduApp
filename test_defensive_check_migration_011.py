#!/usr/bin/env python3
"""
Test for defensive table existence check in migration 011.
This tests that migration 011 fails fast with clear error message 
if questions_bank table is missing.
"""

import os
import sys
from sqlalchemy import create_engine, text
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
    'database': os.getenv('DATABASE_NAME', 'test_migration_011_defensive'),
}

def get_database_url(include_db=True):
    """Construct database URL."""
    if include_db:
        return f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
    return f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}"

def setup_test_database_without_questions_bank():
    """Create test database WITHOUT questions_bank table."""
    logger.info("Setting up test database WITHOUT questions_bank table...")
    
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
            # Create minimal required tables for foreign keys (EXCEPT questions_bank)
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
            
            # NOTE: questions_bank table is NOT created - this should trigger the defensive check
            
            logger.info("Test database setup complete WITHOUT questions_bank table")
    except Exception as e:
        logger.error(f"Failed to setup test database: {e}")
        sys.exit(1)
    finally:
        engine.dispose()

def test_migration_fails_without_questions_bank():
    """Test that migration 011 fails with clear error when questions_bank is missing."""
    logger.info("Testing migration 011 fails with clear error message...")
    
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
            
            # Execute upgrade - this should fail
            try:
                migration_module.upgrade()
                logger.error("✗ Migration did NOT fail as expected!")
                return False
            except ValueError as e:
                error_msg = str(e)
                expected_msg = "questions_bank table must exist before creating question_recommendations"
                if expected_msg in error_msg:
                    logger.info(f"✓ Migration failed with expected error: {error_msg}")
                    return True
                else:
                    logger.error(f"✗ Migration failed with unexpected error: {error_msg}")
                    return False
            
    except Exception as e:
        logger.error(f"Unexpected error during test: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        engine.dispose()

def main():
    """Main test flow."""
    logger.info("=== Testing Migration 011 Defensive Check ===\n")
    
    # Step 1: Setup test database WITHOUT questions_bank
    setup_test_database_without_questions_bank()
    
    # Step 2: Test that migration fails with clear error
    if not test_migration_fails_without_questions_bank():
        logger.error("\n✗ Defensive check test FAILED")
        sys.exit(1)
    
    logger.info("\n" + "="*70)
    logger.info("✓ Migration 011 defensive check test PASSED!")
    logger.info("  - Migration correctly fails when questions_bank table is missing")
    logger.info("  - Error message clearly indicates the missing dependency")
    logger.info("="*70)

if __name__ == '__main__':
    main()
