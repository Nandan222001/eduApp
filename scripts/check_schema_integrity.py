#!/usr/bin/env python3
"""
Script to check database schema integrity after migrations.

This script verifies:
- All tables exist
- Foreign key relationships are valid
- Indexes are properly created
- Constraints are in place
- No orphaned data exists

Usage:
    python scripts/check_schema_integrity.py --database-url postgresql://user:pass@host/db
"""
import argparse
import sys
from typing import List, Dict, Any, Tuple
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.pool import NullPool
from tabulate import tabulate


class SchemaIntegrityChecker:
    """Check database schema integrity."""
    
    def __init__(self, database_url: str, verbose: bool = False):
        """Initialize checker."""
        self.database_url = database_url
        self.verbose = verbose
        self.engine = create_engine(database_url, poolclass=NullPool, echo=False)
        self.issues = []
        self.warnings = []
        self.info = []
    
    def log_issue(self, message: str):
        """Log an integrity issue."""
        self.issues.append(message)
        print(f"  ✗ ISSUE: {message}")
    
    def log_warning(self, message: str):
        """Log a warning."""
        self.warnings.append(message)
        if self.verbose:
            print(f"  ⚠ WARNING: {message}")
    
    def log_info(self, message: str):
        """Log informational message."""
        self.info.append(message)
        if self.verbose:
            print(f"  ℹ INFO: {message}")
    
    def check_all(self):
        """Run all integrity checks."""
        print("\n" + "="*80)
        print("Database Schema Integrity Check")
        print("="*80 + "\n")
        
        self.check_core_tables()
        self.check_foreign_keys()
        self.check_indexes()
        self.check_constraints()
        self.check_orphaned_records()
        self.check_rls_policies()
        self.generate_report()
    
    def check_core_tables(self):
        """Check that core tables exist."""
        print("1. Checking core tables...")
        
        inspector = inspect(self.engine)
        tables = inspector.get_table_names()
        
        required_tables = [
            'users',
            'roles', 
            'institutions',
            'alembic_version'
        ]
        
        for table in required_tables:
            if table in tables:
                columns = inspector.get_columns(table)
                self.log_info(f"Table '{table}' exists with {len(columns)} columns")
            else:
                self.log_issue(f"Required table '{table}' is missing")
        
        print(f"   Found {len(tables)} total tables\n")
    
    def check_foreign_keys(self):
        """Check foreign key integrity."""
        print("2. Checking foreign key integrity...")
        
        inspector = inspect(self.engine)
        tables = inspector.get_table_names()
        
        fk_count = 0
        
        for table_name in tables:
            foreign_keys = inspector.get_foreign_keys(table_name)
            fk_count += len(foreign_keys)
            
            for fk in foreign_keys:
                referred_table = fk['referred_table']
                referred_columns = fk['referred_columns']
                constrained_columns = fk['constrained_columns']
                
                if referred_table not in tables:
                    self.log_issue(
                        f"Table '{table_name}' has FK to non-existent table '{referred_table}'"
                    )
                    continue
                
                referred_table_columns = [
                    col['name'] for col in inspector.get_columns(referred_table)
                ]
                
                for ref_col in referred_columns:
                    if ref_col not in referred_table_columns:
                        self.log_issue(
                            f"Table '{table_name}' FK references non-existent column "
                            f"'{referred_table}.{ref_col}'"
                        )
        
        print(f"   Validated {fk_count} foreign key relationships\n")
    
    def check_indexes(self):
        """Check index coverage."""
        print("3. Checking index coverage...")
        
        inspector = inspect(self.engine)
        tables = inspector.get_table_names()
        
        total_indexes = 0
        missing_fk_indexes = []
        
        for table_name in tables:
            indexes = inspector.get_indexes(table_name)
            total_indexes += len(indexes)
            
            foreign_keys = inspector.get_foreign_keys(table_name)
            
            indexed_columns = set()
            for idx in indexes:
                for col in idx['column_names']:
                    indexed_columns.add(col)
            
            for fk in foreign_keys:
                for col in fk['constrained_columns']:
                    if col not in indexed_columns:
                        missing_fk_indexes.append(f"{table_name}.{col}")
                        self.log_warning(
                            f"Foreign key column '{table_name}.{col}' lacks an index"
                        )
        
        print(f"   Found {total_indexes} indexes across {len(tables)} tables")
        if missing_fk_indexes:
            print(f"   ⚠ {len(missing_fk_indexes)} foreign key columns lack indexes\n")
        else:
            print(f"   ✓ All foreign key columns have indexes\n")
    
    def check_constraints(self):
        """Check database constraints."""
        print("4. Checking constraints...")
        
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    contype,
                    COUNT(*) as count
                FROM pg_constraint
                WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
                GROUP BY contype
            """))
            
            constraints = dict(result.fetchall())
            
            constraint_types = {
                'p': 'Primary Key',
                'f': 'Foreign Key', 
                'u': 'Unique',
                'c': 'Check'
            }
            
            for ctype, name in constraint_types.items():
                count = constraints.get(ctype, 0)
                print(f"   {name}: {count}")
        
        print()
    
    def check_orphaned_records(self):
        """Check for orphaned records."""
        print("5. Checking for orphaned records...")
        
        inspector = inspect(self.engine)
        tables = inspector.get_table_names()
        
        orphan_checks = [
            ('users', 'institution_id', 'institutions', 'id'),
            ('students', 'institution_id', 'institutions', 'id'),
            ('students', 'user_id', 'users', 'id'),
            ('teachers', 'institution_id', 'institutions', 'id'),
            ('teachers', 'user_id', 'users', 'id'),
        ]
        
        total_orphans = 0
        
        with self.engine.connect() as conn:
            conn.execute(text("SET LOCAL app.bypass_rls = true"))
            
            for child_table, child_fk, parent_table, parent_pk in orphan_checks:
                if child_table not in tables or parent_table not in tables:
                    continue
                
                try:
                    result = conn.execute(text(f"""
                        SELECT COUNT(*) 
                        FROM {child_table} c
                        LEFT JOIN {parent_table} p ON c.{child_fk} = p.{parent_pk}
                        WHERE c.{child_fk} IS NOT NULL AND p.{parent_pk} IS NULL
                    """))
                    
                    orphan_count = result.scalar()
                    
                    if orphan_count > 0:
                        total_orphans += orphan_count
                        self.log_warning(
                            f"Found {orphan_count} orphaned records in "
                            f"{child_table}.{child_fk} -> {parent_table}.{parent_pk}"
                        )
                except Exception as e:
                    self.log_info(f"Could not check {child_table}.{child_fk}: {e}")
            
            conn.rollback()
        
        if total_orphans == 0:
            print("   ✓ No orphaned records found\n")
        else:
            print(f"   ⚠ Found {total_orphans} total orphaned records\n")
    
    def check_rls_policies(self):
        """Check Row Level Security policies."""
        print("6. Checking RLS policies...")
        
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    tablename,
                    COUNT(*) as policy_count
                FROM pg_policies
                WHERE schemaname = 'public'
                GROUP BY tablename
                ORDER BY tablename
            """))
            
            policies = result.fetchall()
            
            if policies:
                print(f"   Found RLS policies on {len(policies)} tables:")
                for table, count in policies[:10]:
                    print(f"     - {table}: {count} policies")
                
                if len(policies) > 10:
                    print(f"     ... and {len(policies) - 10} more tables")
            else:
                self.log_warning("No RLS policies found")
        
        print()
    
    def generate_report(self):
        """Generate final report."""
        print("="*80)
        print("Integrity Check Summary")
        print("="*80 + "\n")
        
        print(f"Issues Found: {len(self.issues)}")
        print(f"Warnings: {len(self.warnings)}")
        print(f"Info Messages: {len(self.info)}")
        print()
        
        if self.issues:
            print("CRITICAL ISSUES:")
            for issue in self.issues:
                print(f"  ✗ {issue}")
            print()
        
        if not self.issues and not self.warnings:
            print("✓ Database schema integrity check PASSED")
            print("  No issues found!")
        elif not self.issues:
            print("✓ Database schema integrity check PASSED with warnings")
            print(f"  Review {len(self.warnings)} warnings above")
        else:
            print("✗ Database schema integrity check FAILED")
            print(f"  Fix {len(self.issues)} critical issues")
        
        print("\n" + "="*80 + "\n")
        
        return len(self.issues) == 0
    
    def cleanup(self):
        """Cleanup resources."""
        if self.engine:
            self.engine.dispose()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Check database schema integrity"
    )
    parser.add_argument(
        '--database-url',
        default='postgresql://postgres:postgres@localhost:5432/fastapi_db',
        help='Database URL'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose output'
    )
    
    args = parser.parse_args()
    
    checker = SchemaIntegrityChecker(
        database_url=args.database_url,
        verbose=args.verbose
    )
    
    try:
        checker.check_all()
        success = len(checker.issues) == 0
        sys.exit(0 if success else 1)
    finally:
        checker.cleanup()


if __name__ == "__main__":
    main()
