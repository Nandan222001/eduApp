#!/usr/bin/env python3
"""
Migration Dependency Checker

This diagnostic script uses Alembic API to verify migration chain integrity,
check for missing tables before foreign key creation, and validate column type
compatibility between foreign keys and their referenced columns.

Run this before future migrations to catch dependency issues early.

Usage:
    python scripts/check_migration_dependencies.py

Requirements:
    - alembic
    - sqlalchemy
"""

import ast
import os
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Any

try:
    from alembic import command
    from alembic.config import Config
    from alembic.script import ScriptDirectory
    from alembic.runtime.migration import MigrationContext
    from alembic.operations import Operations
    import sqlalchemy as sa
    from sqlalchemy import inspect
except ImportError as e:
    print(f"Error: Required package not installed: {e}")
    print("Please install required packages: pip install alembic sqlalchemy")
    sys.exit(1)


class MigrationDependencyChecker:
    """Comprehensive migration dependency and compatibility checker"""

    def __init__(self, alembic_ini_path: str = "alembic.ini"):
        self.alembic_ini_path = alembic_ini_path
        self.config = None
        self.script_dir = None
        self.issues: List[str] = []
        self.warnings: List[str] = []
        self.info: List[str] = []
        
        # Track table definitions across migrations
        self.tables_created: Dict[str, Dict[str, Any]] = {}  # table_name -> {revision, columns, ...}
        self.tables_dropped: Set[Tuple[str, str]] = set()  # (table_name, revision)
        self.foreign_keys: List[Dict[str, Any]] = []  # All foreign key definitions
        
        # Track column types for FK validation
        self.column_types: Dict[str, Dict[str, str]] = {}  # table -> {column: type}
        
    def log_issue(self, message: str):
        """Log a critical issue"""
        self.issues.append(f"[ISSUE] {message}")
        print(f"❌ {message}")
        
    def log_warning(self, message: str):
        """Log a warning"""
        self.warnings.append(f"[WARNING] {message}")
        print(f"⚠️  {message}")
        
    def log_info(self, message: str):
        """Log informational message"""
        self.info.append(f"[INFO] {message}")
        print(f"ℹ️  {message}")
        
    def log_success(self, message: str):
        """Log a success message"""
        self.info.append(f"[SUCCESS] {message}")
        print(f"✅ {message}")
        
    def initialize_alembic(self) -> bool:
        """Initialize Alembic configuration"""
        try:
            if not Path(self.alembic_ini_path).exists():
                self.log_issue(f"Alembic configuration file not found: {self.alembic_ini_path}")
                return False
                
            self.config = Config(self.alembic_ini_path)
            self.script_dir = ScriptDirectory.from_config(self.config)
            self.log_info(f"Alembic initialized from {self.alembic_ini_path}")
            return True
        except Exception as e:
            self.log_issue(f"Failed to initialize Alembic: {e}")
            return False
    
    def check_migration_chain(self) -> bool:
        """Check migration chain integrity using Alembic API"""
        self.log_info("Checking migration chain integrity...")
        
        try:
            # Get all revisions
            revisions = list(self.script_dir.walk_revisions())
            self.log_info(f"Found {len(revisions)} migrations in chain")
            
            # Check for duplicate revision IDs
            revision_ids = [rev.revision for rev in revisions]
            duplicates = [rid for rid in revision_ids if revision_ids.count(rid) > 1]
            if duplicates:
                self.log_issue(f"Duplicate revision IDs found: {set(duplicates)}")
                return False
            
            # Check for broken links
            all_revisions = {rev.revision for rev in revisions}
            for rev in revisions:
                if rev.down_revision:
                    # Handle both single down_revision and tuple of down_revisions
                    down_revs = rev.down_revision if isinstance(rev.down_revision, tuple) else (rev.down_revision,)
                    for down_rev in down_revs:
                        if down_rev not in all_revisions:
                            self.log_issue(
                                f"Migration {rev.revision} references non-existent "
                                f"down_revision: {down_rev}"
                            )
                            return False
                
                # Check depends_on
                if rev.dependencies:
                    for dep in rev.dependencies:
                        if dep not in all_revisions:
                            self.log_issue(
                                f"Migration {rev.revision} has non-existent "
                                f"dependency: {dep}"
                            )
                            return False
            
            # Check for circular dependencies
            if self._check_circular_dependencies(revisions):
                return False
                
            self.log_success("Migration chain integrity verified")
            return True
            
        except Exception as e:
            self.log_issue(f"Error checking migration chain: {e}")
            return False
    
    def _check_circular_dependencies(self, revisions: List) -> bool:
        """Check for circular dependencies in migration chain"""
        visited = set()
        rec_stack = set()
        
        rev_map = {rev.revision: rev for rev in revisions}
        
        def has_cycle(rev_id: str) -> bool:
            visited.add(rev_id)
            rec_stack.add(rev_id)
            
            rev = rev_map.get(rev_id)
            if rev:
                # Check down_revision
                if rev.down_revision:
                    down_revs = rev.down_revision if isinstance(rev.down_revision, tuple) else (rev.down_revision,)
                    for down_rev in down_revs:
                        if down_rev not in visited:
                            if has_cycle(down_rev):
                                return True
                        elif down_rev in rec_stack:
                            self.log_issue(f"Circular dependency detected involving {rev_id} -> {down_rev}")
                            return True
                
                # Check dependencies
                if rev.dependencies:
                    for dep in rev.dependencies:
                        if dep not in visited:
                            if has_cycle(dep):
                                return True
                        elif dep in rec_stack:
                            self.log_issue(f"Circular dependency detected involving {rev_id} -> {dep}")
                            return True
            
            rec_stack.remove(rev_id)
            return False
        
        for rev in revisions:
            if rev.revision not in visited:
                if has_cycle(rev.revision):
                    return True
        
        return False
    
    def parse_migration_operations(self, revision) -> Dict[str, Any]:
        """Parse migration file to extract table operations and foreign keys"""
        operations = {
            'creates_tables': [],
            'drops_tables': [],
            'foreign_keys': [],
            'columns': defaultdict(list)
        }
        
        try:
            # Read the migration file
            module_path = revision.module.__file__
            with open(module_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse AST
            tree = ast.parse(content)
            
            # Find upgrade function
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef) and node.name == 'upgrade':
                    self._parse_upgrade_function(node, operations)
            
            return operations
            
        except Exception as e:
            self.log_warning(f"Could not parse migration {revision.revision}: {e}")
            return operations
    
    def _parse_upgrade_function(self, func_node: ast.FunctionDef, operations: Dict):
        """Parse the upgrade function to extract operations"""
        for stmt in ast.walk(func_node):
            if isinstance(stmt, ast.Call):
                # Check for op.create_table
                if (isinstance(stmt.func, ast.Attribute) and
                    stmt.func.attr == 'create_table'):
                    self._parse_create_table(stmt, operations)
                
                # Check for op.drop_table
                elif (isinstance(stmt.func, ast.Attribute) and
                      stmt.func.attr == 'drop_table'):
                    self._parse_drop_table(stmt, operations)
    
    def _parse_create_table(self, call_node: ast.Call, operations: Dict):
        """Parse create_table call"""
        if not call_node.args:
            return
        
        # Table name is first argument
        table_name = None
        if isinstance(call_node.args[0], ast.Constant):
            table_name = call_node.args[0].value
        elif isinstance(call_node.args[0], ast.Str):  # Python 3.7 compatibility
            table_name = call_node.args[0].s
        
        if table_name:
            operations['creates_tables'].append(table_name)
            
            # Extract columns and foreign keys
            for arg in call_node.args[1:]:
                if isinstance(arg, ast.Call):
                    # Check if it's a Column
                    if isinstance(arg.func, ast.Attribute) and arg.func.attr == 'Column':
                        col_info = self._parse_column(arg)
                        if col_info:
                            operations['columns'][table_name].append(col_info)
                    
                    # Check if it's a ForeignKeyConstraint
                    elif isinstance(arg.func, ast.Attribute) and arg.func.attr == 'ForeignKeyConstraint':
                        fk_info = self._parse_foreign_key_constraint(arg, table_name)
                        if fk_info:
                            operations['foreign_keys'].append(fk_info)
    
    def _parse_drop_table(self, call_node: ast.Call, operations: Dict):
        """Parse drop_table call"""
        if not call_node.args:
            return
        
        table_name = None
        if isinstance(call_node.args[0], ast.Constant):
            table_name = call_node.args[0].value
        elif isinstance(call_node.args[0], ast.Str):
            table_name = call_node.args[0].s
        
        if table_name:
            operations['drops_tables'].append(table_name)
    
    def _parse_column(self, call_node: ast.Call) -> Optional[Dict]:
        """Parse Column definition"""
        if not call_node.args:
            return None
        
        col_name = None
        col_type = None
        
        # First arg is column name
        if isinstance(call_node.args[0], ast.Constant):
            col_name = call_node.args[0].value
        elif isinstance(call_node.args[0], ast.Str):
            col_name = call_node.args[0].s
        
        # Second arg is column type
        if len(call_node.args) > 1:
            col_type_node = call_node.args[1]
            col_type = self._extract_type_name(col_type_node)
        
        if col_name and col_type:
            return {'name': col_name, 'type': col_type}
        
        return None
    
    def _extract_type_name(self, node: ast.AST) -> Optional[str]:
        """Extract SQLAlchemy type name from AST node"""
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute):
                return node.func.attr
            elif isinstance(node.func, ast.Name):
                return node.func.id
        elif isinstance(node, ast.Attribute):
            return node.attr
        elif isinstance(node, ast.Name):
            return node.id
        return None
    
    def _parse_foreign_key_constraint(self, call_node: ast.Call, table_name: str) -> Optional[Dict]:
        """Parse ForeignKeyConstraint"""
        if len(call_node.args) < 2:
            return None
        
        # First arg: local columns (list)
        # Second arg: foreign columns (list)
        local_cols = []
        foreign_cols = []
        
        # Parse local columns
        if isinstance(call_node.args[0], (ast.List, ast.Tuple)):
            for elem in call_node.args[0].elts:
                if isinstance(elem, ast.Constant):
                    local_cols.append(elem.value)
                elif isinstance(elem, ast.Str):
                    local_cols.append(elem.s)
        
        # Parse foreign columns
        if isinstance(call_node.args[1], (ast.List, ast.Tuple)):
            for elem in call_node.args[1].elts:
                if isinstance(elem, ast.Constant):
                    foreign_cols.append(elem.value)
                elif isinstance(elem, ast.Str):
                    foreign_cols.append(elem.s)
        
        if local_cols and foreign_cols:
            return {
                'table': table_name,
                'local_columns': local_cols,
                'foreign_columns': foreign_cols
            }
        
        return None
    
    def check_table_dependencies(self) -> bool:
        """Check that referenced tables exist before foreign keys are created"""
        self.log_info("Checking table dependencies and foreign key references...")
        
        try:
            revisions = list(self.script_dir.walk_revisions("base", "heads"))
            revisions.reverse()  # Process in chronological order
            
            created_tables = set()
            has_errors = False
            
            for revision in revisions:
                ops = self.parse_migration_operations(revision)
                
                # Track table creations
                for table in ops['creates_tables']:
                    if table in created_tables:
                        self.log_warning(
                            f"Table '{table}' created again in migration {revision.revision}"
                        )
                    created_tables.add(table)
                    
                    # Store column types
                    self.column_types[table] = {}
                    for col in ops['columns'][table]:
                        self.column_types[table][col['name']] = col['type']
                
                # Check foreign keys
                for fk in ops['foreign_keys']:
                    for foreign_col in fk['foreign_columns']:
                        # Parse table.column format
                        if '.' in foreign_col:
                            ref_table, ref_col = foreign_col.split('.', 1)
                            
                            if ref_table not in created_tables:
                                self.log_issue(
                                    f"Migration {revision.revision} creates foreign key in "
                                    f"table '{fk['table']}' referencing non-existent table '{ref_table}'"
                                )
                                has_errors = True
                            elif ref_table in self.column_types:
                                if ref_col not in self.column_types[ref_table]:
                                    self.log_warning(
                                        f"Migration {revision.revision} creates foreign key "
                                        f"referencing column '{ref_col}' in table '{ref_table}' "
                                        f"but column definition not found in parsed data"
                                    )
                
                # Track table drops
                for table in ops['drops_tables']:
                    if table in created_tables:
                        created_tables.remove(table)
                    if table in self.column_types:
                        del self.column_types[table]
            
            if not has_errors:
                self.log_success("All table dependencies verified")
                return True
            
            return False
            
        except Exception as e:
            self.log_issue(f"Error checking table dependencies: {e}")
            return False
    
    def check_column_type_compatibility(self) -> bool:
        """Check foreign key and referenced column type compatibility"""
        self.log_info("Checking column type compatibility for foreign keys...")
        
        try:
            revisions = list(self.script_dir.walk_revisions("base", "heads"))
            revisions.reverse()  # Process in chronological order
            
            # Build complete column type mapping
            column_types = {}  # table -> {column: type}
            
            for revision in revisions:
                ops = self.parse_migration_operations(revision)
                
                for table in ops['creates_tables']:
                    if table not in column_types:
                        column_types[table] = {}
                    
                    for col in ops['columns'][table]:
                        column_types[table][col['name']] = col['type']
            
            # Now check foreign keys
            has_errors = False
            for revision in revisions:
                ops = self.parse_migration_operations(revision)
                
                for fk in ops['foreign_keys']:
                    local_table = fk['table']
                    
                    for i, local_col in enumerate(fk['local_columns']):
                        if i >= len(fk['foreign_columns']):
                            continue
                        
                        foreign_ref = fk['foreign_columns'][i]
                        if '.' not in foreign_ref:
                            continue
                        
                        ref_table, ref_col = foreign_ref.split('.', 1)
                        
                        # Get types
                        local_type = column_types.get(local_table, {}).get(local_col)
                        ref_type = column_types.get(ref_table, {}).get(ref_col)
                        
                        if local_type and ref_type:
                            # Normalize type names for comparison
                            local_type_norm = self._normalize_type(local_type)
                            ref_type_norm = self._normalize_type(ref_type)
                            
                            if local_type_norm != ref_type_norm:
                                self.log_warning(
                                    f"Type mismatch in migration {revision.revision}: "
                                    f"FK column '{local_table}.{local_col}' ({local_type}) "
                                    f"references '{ref_table}.{ref_col}' ({ref_type})"
                                )
                                has_errors = True
            
            if not has_errors:
                self.log_success("All foreign key type compatibilities verified")
                return True
            else:
                self.log_warning("Some type compatibility issues found (may be acceptable)")
                return True  # Don't fail on type mismatches, just warn
            
        except Exception as e:
            self.log_issue(f"Error checking column type compatibility: {e}")
            return False
    
    def _normalize_type(self, type_str: str) -> str:
        """Normalize SQL type for comparison"""
        type_str = type_str.upper()
        
        # Map related types
        type_map = {
            'INTEGER': 'INT',
            'INT': 'INT',
            'BIGINT': 'INT',
            'SMALLINT': 'INT',
            'VARCHAR': 'STRING',
            'STRING': 'STRING',
            'TEXT': 'STRING',
            'CHAR': 'STRING',
        }
        
        return type_map.get(type_str, type_str)
    
    def generate_report(self) -> str:
        """Generate comprehensive report"""
        lines = []
        lines.append("=" * 80)
        lines.append("MIGRATION DEPENDENCY CHECK REPORT")
        lines.append("=" * 80)
        lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append(f"Alembic Config: {self.alembic_ini_path}")
        lines.append("=" * 80)
        lines.append("")
        
        # Summary
        lines.append("SUMMARY")
        lines.append("-" * 80)
        lines.append(f"Critical Issues: {len(self.issues)}")
        lines.append(f"Warnings: {len(self.warnings)}")
        lines.append(f"Info Messages: {len(self.info)}")
        lines.append("")
        
        # Issues
        if self.issues:
            lines.append("CRITICAL ISSUES")
            lines.append("-" * 80)
            for issue in self.issues:
                lines.append(issue)
            lines.append("")
        
        # Warnings
        if self.warnings:
            lines.append("WARNINGS")
            lines.append("-" * 80)
            for warning in self.warnings:
                lines.append(warning)
            lines.append("")
        
        # Info
        if self.info:
            lines.append("INFORMATION")
            lines.append("-" * 80)
            for info in self.info:
                lines.append(info)
            lines.append("")
        
        lines.append("=" * 80)
        lines.append("END OF REPORT")
        lines.append("=" * 80)
        
        return "\n".join(lines)
    
    def save_report(self, filename: str = "migration_dependency_report.txt"):
        """Save report to file"""
        report = self.generate_report()
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(report)
        self.log_info(f"Report saved to {filename}")
    
    def run_all_checks(self) -> bool:
        """Run all dependency checks"""
        print("\n" + "=" * 80)
        print("MIGRATION DEPENDENCY CHECKER")
        print("=" * 80)
        print()
        
        if not self.initialize_alembic():
            return False
        
        all_passed = True
        
        # Check 1: Migration chain integrity
        if not self.check_migration_chain():
            all_passed = False
        print()
        
        # Check 2: Table dependencies
        if not self.check_table_dependencies():
            all_passed = False
        print()
        
        # Check 3: Column type compatibility
        if not self.check_column_type_compatibility():
            all_passed = False
        print()
        
        # Generate report
        self.save_report()
        
        # Print summary
        print("\n" + "=" * 80)
        print("FINAL SUMMARY")
        print("=" * 80)
        print(f"Critical Issues: {len(self.issues)}")
        print(f"Warnings: {len(self.warnings)}")
        
        if all_passed and len(self.issues) == 0:
            print("\n✅ All checks passed!")
            print("=" * 80)
            return True
        else:
            print("\n❌ Some checks failed. Please review the issues above.")
            print("=" * 80)
            return False


def main():
    """Main entry point"""
    # Change to repo root if running from scripts directory
    script_dir = Path(__file__).parent
    if script_dir.name == "scripts":
        os.chdir(script_dir.parent)
    
    checker = MigrationDependencyChecker()
    success = checker.run_all_checks()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
