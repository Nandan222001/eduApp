"""
Pytest configuration for migration tests.

This module provides fixtures and configuration for migration testing.
"""
import pytest
import os
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
from alembic.config import Config
from alembic import command


@pytest.fixture(scope="session")
def migration_test_db_url():
    """
    Get test database URL for migration tests.
    
    By default uses a separate test database to avoid conflicts.
    Can be overridden via TEST_MIGRATION_DATABASE_URL environment variable.
    """
    return os.getenv(
        "TEST_MIGRATION_DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/test_migrations_db"
    )


@pytest.fixture(scope="session")
def alembic_config_fixture():
    """Create Alembic configuration for tests."""
    config = Config("alembic.ini")
    return config


@pytest.fixture(scope="function")
def clean_test_db(migration_test_db_url):
    """
    Provide a clean test database for each test.
    
    This fixture:
    - Creates a fresh database schema
    - Yields to the test
    - Cleans up after the test
    """
    engine = create_engine(migration_test_db_url, poolclass=NullPool, echo=False)
    
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.commit()
    
    yield engine
    
    engine.dispose()


@pytest.fixture(scope="function")
def migrated_test_db(clean_test_db, alembic_config_fixture, migration_test_db_url):
    """
    Provide a test database with all migrations applied.
    
    This fixture:
    - Starts with a clean database
    - Applies all migrations to HEAD
    - Yields the engine
    - Cleans up after the test
    """
    engine = clean_test_db
    
    alembic_config_fixture.set_main_option("sqlalchemy.url", migration_test_db_url)
    
    command.upgrade(alembic_config_fixture, "head")
    
    yield engine


@pytest.fixture(scope="function")
def migration_config(alembic_config_fixture, migration_test_db_url):
    """
    Provide configured Alembic config for tests.
    
    This sets the database URL to the test database.
    """
    alembic_config_fixture.set_main_option("sqlalchemy.url", migration_test_db_url)
    return alembic_config_fixture


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "migration: mark test as a migration test"
    )
    config.addinivalue_line(
        "markers", "slow_migration: mark test as a slow migration test"
    )
    config.addinivalue_line(
        "markers", "production_like: mark test as requiring production-like data"
    )


def pytest_collection_modifyitems(config, items):
    """
    Automatically mark migration tests.
    
    This adds the 'migration' marker to all tests in the migration directory.
    """
    for item in items:
        if "migration" in str(item.fspath):
            item.add_marker(pytest.mark.migration)
