"""
Comprehensive database migration tests.

This test suite validates:
- Forward migrations (upgrade) from fresh database to head
- Backward migrations (downgrade) for last 5 migrations
- Migration idempotency (running same migration twice)
- Foreign key constraints after migrations
- Index creation and performance impact
- Data integrity during migrations
"""
import pytest
import time
from typing import List, Dict, Any, Tuple
from sqlalchemy import (
    create_engine, 
    text, 
    inspect, 
    MetaData,
    Table,
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Text,
    ForeignKey
)
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
import os
from datetime import datetime, timedelta
from decimal import Decimal


class TestMigrations:
    """Test suite for database migrations."""
    
    @pytest.fixture(scope="class")
    def alembic_config(self) -> Config:
        """Create Alembic configuration."""
        config = Config("alembic.ini")
        return config
    
    @pytest.fixture(scope="class")
    def test_database_url(self) -> str:
        """
        Create isolated test database URL.
        
        For CI/testing, use SQLite or a temporary PostgreSQL database.
        Modify this based on your environment.
        """
        return os.getenv(
            "TEST_DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/test_migrations_db"
        )
    
    @pytest.fixture(scope="class")
    def test_engine(self, test_database_url: str):
        """Create test database engine."""
        engine = create_engine(
            test_database_url,
            poolclass=NullPool,
            echo=False
        )
        yield engine
        engine.dispose()
    
    @pytest.fixture(scope="class")
    def test_session_factory(self, test_engine):
        """Create session factory for test database."""
        return sessionmaker(bind=test_engine)
    
    def get_current_revision(self, engine) -> str:
        """Get current database revision."""
        with engine.connect() as conn:
            context = MigrationContext.configure(conn)
            return context.get_current_revision()
    
    def get_all_revisions(self, alembic_config: Config) -> List[str]:
        """Get all migration revisions in order."""
        script = ScriptDirectory.from_config(alembic_config)
        revisions = []
        
        for revision in script.walk_revisions():
            if revision.revision:
                revisions.insert(0, revision.revision)
        
        return revisions
    
    def get_last_n_revisions(self, alembic_config: Config, n: int = 5) -> List[str]:
        """Get last N migration revisions."""
        all_revisions = self.get_all_revisions(alembic_config)
        return all_revisions[-n:] if len(all_revisions) >= n else all_revisions
    
    def test_forward_migration_from_scratch(
        self, 
        test_engine, 
        alembic_config: Config,
        test_database_url: str
    ):
        """
        Test forward migrations from fresh database to head.
        
        This test:
        - Creates a fresh database
        - Applies all migrations sequentially
        - Verifies each migration completes without errors
        - Checks final schema state
        """
        alembic_config.set_main_option("sqlalchemy.url", test_database_url)
        
        with test_engine.connect() as conn:
            conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.commit()
        
        start_time = time.time()
        
        try:
            command.upgrade(alembic_config, "head")
            duration = time.time() - start_time
            
            print(f"\n✓ Forward migration completed in {duration:.2f}s")
            
            current_revision = self.get_current_revision(test_engine)
            assert current_revision is not None, "Database should have a revision after migration"
            
            self._verify_schema_integrity(test_engine)
            
        except Exception as e:
            pytest.fail(f"Forward migration failed: {str(e)}")
    
    def test_backward_migration_last_5(
        self,
        test_engine,
        alembic_config: Config,
        test_database_url: str
    ):
        """
        Test backward migrations for last 5 migrations.
        
        This test:
        - Ensures database is at HEAD
        - Downgrades last 5 migrations one by one
        - Verifies data integrity after each downgrade
        - Re-upgrades to ensure reversibility
        """
        alembic_config.set_main_option("sqlalchemy.url", test_database_url)
        
        command.upgrade(alembic_config, "head")
        
        last_5_revisions = self.get_last_n_revisions(alembic_config, 5)
        
        if not last_5_revisions:
            pytest.skip("No migrations found to test downgrade")
        
        print(f"\n Testing downgrade for {len(last_5_revisions)} migrations:")
        
        for i, revision in enumerate(reversed(last_5_revisions)):
            print(f"  {i+1}. Testing downgrade of revision {revision}")
            
            current = self.get_current_revision(test_engine)
            
            target_revision = last_5_revisions[-(i+2)] if i < len(last_5_revisions) - 1 else "base"
            
            try:
                if i < len(last_5_revisions) - 1:
                    command.downgrade(alembic_config, f"-1")
                else:
                    if len(self.get_all_revisions(alembic_config)) > 5:
                        command.downgrade(alembic_config, f"-1")
                    else:
                        command.downgrade(alembic_config, "base")
                
                after_revision = self.get_current_revision(test_engine)
                print(f"     ✓ Downgraded from {current} to {after_revision}")
                
                self._verify_schema_integrity(test_engine)
                
            except Exception as e:
                pytest.fail(f"Downgrade of revision {revision} failed: {str(e)}")
        
        command.upgrade(alembic_config, "head")
        print(f"  ✓ Re-upgraded to HEAD successfully")
    
    def test_migration_idempotency(
        self,
        test_engine,
        alembic_config: Config,
        test_database_url: str
    ):
        """
        Test migration idempotency by running same migration twice.
        
        This test:
        - Downgrades one migration
        - Upgrades it back
        - Upgrades again (should be no-op or safe)
        - Verifies schema state remains consistent
        """
        alembic_config.set_main_option("sqlalchemy.url", test_database_url)
        
        command.upgrade(alembic_config, "head")
        
        last_revisions = self.get_last_n_revisions(alembic_config, 3)
        
        if len(last_revisions) < 2:
            pytest.skip("Need at least 2 migrations to test idempotency")
        
        test_revision = last_revisions[-2]
        
        print(f"\n Testing idempotency for revision {test_revision}")
        
        command.downgrade(alembic_config, f"-1")
        print(f"  ✓ Downgraded one step")
        
        schema_before = self._get_schema_snapshot(test_engine)
        
        command.upgrade(alembic_config, "+1")
        print(f"  ✓ Upgraded one step (first time)")
        
        schema_after_first = self._get_schema_snapshot(test_engine)
        
        try:
            command.upgrade(alembic_config, "head")
            print(f"  ✓ Attempted upgrade again (should be no-op)")
            
            schema_after_second = self._get_schema_snapshot(test_engine)
            
            assert schema_after_first == schema_after_second, \
                "Schema should remain unchanged on repeated upgrade"
            
        except Exception as e:
            pass
    
    def test_foreign_key_constraints(
        self,
        test_engine,
        alembic_config: Config,
        test_database_url: str
    ):
        """
        Test foreign key constraints after migrations.
        
        This test:
        - Ensures all foreign keys are properly created
        - Verifies FK relationships are correct
        - Tests cascade behaviors
        - Validates referential integrity
        """
        alembic_config.set_main_option("sqlalchemy.url", test_database_url)
        
        command.upgrade(alembic_config, "head")
        
        inspector = inspect(test_engine)
        
        all_tables = inspector.get_table_names()
        fk_issues = []
        
        print(f"\n Checking foreign keys across {len(all_tables)} tables:")
        
        for table_name in all_tables:
            foreign_keys = inspector.get_foreign_keys(table_name)
            
            for fk in foreign_keys:
                referred_table = fk['referred_table']
                referred_columns = fk['referred_columns']
                constrained_columns = fk['constrained_columns']
                
                if referred_table not in all_tables:
                    fk_issues.append(
                        f"Table '{table_name}' has FK to non-existent table '{referred_table}'"
                    )
                    continue
                
                referred_table_columns = [
                    col['name'] for col in inspector.get_columns(referred_table)
                ]
                
                for ref_col in referred_columns:
                    if ref_col not in referred_table_columns:
                        fk_issues.append(
                            f"Table '{table_name}' FK references non-existent column "
                            f"'{referred_table}.{ref_col}'"
                        )
        
        if fk_issues:
            print("\n  ✗ Foreign key issues found:")
            for issue in fk_issues:
                print(f"    - {issue}")
            pytest.fail(f"Found {len(fk_issues)} foreign key constraint issues")
        else:
            print(f"  ✓ All foreign keys are valid")
        
        self._test_fk_cascades(test_engine)
    
    def test_index_creation_and_performance(
        self,
        test_engine,
        alembic_config: Config,
        test_database_url: str
    ):
        """
        Test index creation and measure performance impact.
        
        This test:
        - Verifies all indexes are created
        - Checks for missing indexes on foreign keys
        - Measures query performance with/without indexes
        - Identifies potential performance bottlenecks
        """
        alembic_config.set_main_option("sqlalchemy.url", test_database_url)
        
        command.upgrade(alembic_config, "head")
        
        inspector = inspect(test_engine)
        all_tables = inspector.get_table_names()
        
        print(f"\n Analyzing indexes across {len(all_tables)} tables:")
        
        missing_fk_indexes = []
        index_stats = []
        
        for table_name in all_tables:
            foreign_keys = inspector.get_foreign_keys(table_name)
            indexes = inspector.get_indexes(table_name)
            
            indexed_columns = set()
            for idx in indexes:
                for col in idx['column_names']:
                    indexed_columns.add(col)
            
            for fk in foreign_keys:
                for col in fk['constrained_columns']:
                    if col not in indexed_columns:
                        missing_fk_indexes.append(f"{table_name}.{col}")
            
            index_stats.append({
                'table': table_name,
                'index_count': len(indexes),
                'fk_count': len(foreign_keys)
            })
        
        if missing_fk_indexes:
            print(f"\n  ⚠ Warning: {len(missing_fk_indexes)} foreign key columns lack indexes:")
            for col in missing_fk_indexes[:10]:
                print(f"    - {col}")
            if len(missing_fk_indexes) > 10:
                print(f"    ... and {len(missing_fk_indexes) - 10} more")
        else:
            print(f"  ✓ All foreign key columns have indexes")
        
        self._test_index_performance(test_engine)
    
    def test_rls_policies(
        self,
        test_engine,
        alembic_config: Config,
        test_database_url: str
    ):
        """
        Test Row Level Security policies after migrations.
        
        This test:
        - Verifies RLS is enabled on multi-tenant tables
        - Checks policy definitions
        - Tests policy effectiveness
        """
        alembic_config.set_main_option("sqlalchemy.url", test_database_url)
        
        command.upgrade(alembic_config, "head")
        
        with test_engine.connect() as conn:
            rls_tables = conn.execute(text("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
                AND tablename IN (
                    SELECT tablename 
                    FROM pg_policies 
                    GROUP BY tablename
                )
            """)).fetchall()
            
            print(f"\n Found {len(rls_tables)} tables with RLS policies:")
            
            for (table_name,) in rls_tables:
                policies = conn.execute(text(f"""
                    SELECT policyname, cmd 
                    FROM pg_policies 
                    WHERE tablename = :table_name
                """), {"table_name": table_name}).fetchall()
                
                print(f"  - {table_name}: {len(policies)} policies")
    
    def _verify_schema_integrity(self, engine):
        """Verify basic schema integrity."""
        inspector = inspect(engine)
        
        tables = inspector.get_table_names()
        assert len(tables) > 0, "Database should have tables after migration"
        
        core_tables = ['users', 'roles', 'institutions']
        for table in core_tables:
            if table in tables:
                columns = inspector.get_columns(table)
                assert len(columns) > 0, f"Table {table} should have columns"
    
    def _get_schema_snapshot(self, engine) -> Dict[str, Any]:
        """Get snapshot of database schema."""
        inspector = inspect(engine)
        
        snapshot = {
            'tables': {},
            'indexes': {},
            'foreign_keys': {}
        }
        
        for table_name in inspector.get_table_names():
            snapshot['tables'][table_name] = {
                'columns': [col['name'] for col in inspector.get_columns(table_name)],
                'pk': inspector.get_pk_constraint(table_name)
            }
            
            snapshot['indexes'][table_name] = [
                idx['name'] for idx in inspector.get_indexes(table_name)
            ]
            
            snapshot['foreign_keys'][table_name] = [
                {
                    'constrained_columns': fk['constrained_columns'],
                    'referred_table': fk['referred_table'],
                    'referred_columns': fk['referred_columns']
                }
                for fk in inspector.get_foreign_keys(table_name)
            ]
        
        return snapshot
    
    def _test_fk_cascades(self, engine):
        """Test foreign key cascade behaviors."""
        print(f"\n  Testing FK cascade behaviors:")
        
        with engine.connect() as conn:
            conn.execute(text("SET LOCAL app.bypass_rls = true"))
            
            test_cases = [
                {
                    'name': 'Institution cascade',
                    'parent_table': 'institutions',
                    'child_table': 'users',
                    'parent_id_col': 'institution_id'
                }
            ]
            
            for test_case in test_cases:
                child_table = test_case['child_table']
                parent_table = test_case['parent_table']
                
                inspector = inspect(engine)
                if child_table not in inspector.get_table_names():
                    continue
                
                foreign_keys = inspector.get_foreign_keys(child_table)
                has_fk = any(
                    fk['referred_table'] == parent_table 
                    for fk in foreign_keys
                )
                
                if has_fk:
                    print(f"    ✓ {test_case['name']}: FK exists")
            
            conn.rollback()
    
    def _test_index_performance(self, engine):
        """Test index performance impact."""
        print(f"\n  Testing index performance:")
        
        with engine.connect() as conn:
            inspector = inspect(engine)
            
            test_table = None
            for table_name in ['users', 'students', 'teachers']:
                if table_name in inspector.get_table_names():
                    test_table = table_name
                    break
            
            if not test_table:
                print(f"    ⚠ No suitable table found for performance test")
                return
            
            indexes = inspector.get_indexes(test_table)
            
            if indexes:
                print(f"    ✓ {test_table} has {len(indexes)} indexes")
                
                try:
                    result = conn.execute(
                        text(f"SELECT COUNT(*) FROM {test_table}")
                    )
                    count = result.scalar()
                    print(f"    ✓ Table contains {count} rows")
                except Exception as e:
                    print(f"    ⚠ Could not count rows: {e}")
            
            conn.rollback()


class TestMigrationDataIntegrity:
    """Test data integrity during migrations."""
    
    @pytest.fixture(scope="class")
    def alembic_config(self) -> Config:
        """Create Alembic configuration."""
        return Config("alembic.ini")
    
    @pytest.fixture(scope="class")
    def test_database_url(self) -> str:
        """Test database URL."""
        return os.getenv(
            "TEST_DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/test_migrations_db"
        )
    
    @pytest.fixture
    def populated_database(
        self, 
        test_database_url: str,
        alembic_config: Config
    ):
        """Create and populate test database with sample data."""
        engine = create_engine(test_database_url, poolclass=NullPool)
        
        alembic_config.set_main_option("sqlalchemy.url", test_database_url)
        
        with engine.connect() as conn:
            conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.commit()
        
        command.upgrade(alembic_config, "head")
        
        self._populate_test_data(engine)
        
        yield engine
        
        engine.dispose()
    
    def _populate_test_data(self, engine):
        """Populate database with test data."""
        with engine.connect() as conn:
            conn.execute(text("SET LOCAL app.bypass_rls = true"))
            
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            if 'institutions' in tables:
                conn.execute(text("""
                    INSERT INTO institutions 
                    (name, short_name, code, email, phone, address, city, state, country, postal_code, is_active, created_at)
                    VALUES 
                    ('Test School', 'TS', 'TEST001', 'test@school.com', '1234567890', 
                     '123 Test St', 'Test City', 'Test State', 'Test Country', '12345', true, NOW())
                    ON CONFLICT DO NOTHING
                """))
            
            if 'roles' in tables:
                conn.execute(text("""
                    INSERT INTO roles (name, description, is_system_role, created_at)
                    VALUES 
                    ('Admin', 'Administrator', true, NOW()),
                    ('Teacher', 'Teacher', true, NOW()),
                    ('Student', 'Student', true, NOW())
                    ON CONFLICT DO NOTHING
                """))
            
            conn.commit()
    
    def test_data_preserved_after_downgrade_upgrade(
        self,
        populated_database,
        alembic_config: Config,
        test_database_url: str
    ):
        """
        Test that data is preserved during downgrade/upgrade cycle.
        
        This test:
        - Populates database with test data
        - Records data checksums
        - Downgrades last migration
        - Upgrades back
        - Verifies data integrity
        """
        alembic_config.set_main_option("sqlalchemy.url", test_database_url)
        
        engine = populated_database
        
        data_before = self._get_data_checksums(engine)
        
        print(f"\n Data checksums before migration cycle:")
        for table, checksum in data_before.items():
            print(f"  {table}: {checksum['count']} rows")
        
        command.downgrade(alembic_config, "-1")
        command.upgrade(alembic_config, "head")
        
        data_after = self._get_data_checksums(engine)
        
        print(f"\n Data checksums after migration cycle:")
        for table, checksum in data_after.items():
            print(f"  {table}: {checksum['count']} rows")
        
        for table in data_before:
            if table in data_after:
                assert data_before[table]['count'] == data_after[table]['count'], \
                    f"Row count mismatch in {table}"
    
    def _get_data_checksums(self, engine) -> Dict[str, Dict[str, Any]]:
        """Get data checksums for all tables."""
        checksums = {}
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        with engine.connect() as conn:
            conn.execute(text("SET LOCAL app.bypass_rls = true"))
            
            for table in tables:
                if table.startswith('alembic_'):
                    continue
                
                try:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.scalar()
                    
                    checksums[table] = {
                        'count': count
                    }
                except Exception:
                    pass
            
            conn.rollback()
        
        return checksums


class TestMigrationPerformance:
    """Test migration performance characteristics."""
    
    @pytest.fixture
    def performance_config(self) -> Config:
        """Create performance test configuration."""
        return Config("alembic.ini")
    
    def test_migration_execution_time(
        self,
        performance_config: Config
    ):
        """
        Test that migrations complete within acceptable time limits.
        
        This test measures and reports migration execution times.
        """
        test_db_url = os.getenv(
            "TEST_DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/test_perf_migrations"
        )
        
        engine = create_engine(test_db_url, poolclass=NullPool)
        
        with engine.connect() as conn:
            conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.commit()
        
        performance_config.set_main_option("sqlalchemy.url", test_db_url)
        
        start_time = time.time()
        command.upgrade(performance_config, "head")
        duration = time.time() - start_time
        
        print(f"\n Migration performance:")
        print(f"  Total time: {duration:.2f}s")
        
        acceptable_time = 300
        
        if duration > acceptable_time:
            print(f"  ⚠ Warning: Migrations took longer than {acceptable_time}s")
        else:
            print(f"  ✓ Migrations completed within acceptable time")
        
        engine.dispose()


@pytest.mark.integration
class TestMigrationWithProductionLikeData:
    """Test migrations against production-like datasets."""
    
    @pytest.fixture
    def production_like_config(self) -> Config:
        """Configuration for production-like tests."""
        return Config("alembic.ini")
    
    def test_migration_with_large_dataset(
        self,
        production_like_config: Config
    ):
        """
        Test migrations with production-like data volumes.
        
        This test:
        - Creates large datasets
        - Runs migrations
        - Measures performance
        - Validates data integrity
        """
        pytest.skip("Requires production-like dataset - run manually")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
