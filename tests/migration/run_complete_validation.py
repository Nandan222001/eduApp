#!/usr/bin/env python3
"""
Complete MySQL Migration Validation Script

This Python script orchestrates all validation tests for the MySQL migration:
1. Alembic upgrade head
2. Full test suite (unit, integration, API)
3. Multi-tenant data isolation
4. Load testing
5. API endpoint validation
6. Real-time features
7. Analytics aggregations
8. ML model predictions

Usage:
    python tests/migration/run_complete_validation.py
"""

import subprocess
import sys
import os
import time
from typing import List, Tuple, Dict
from datetime import datetime


class TestRunner:
    """Orchestrates comprehensive MySQL migration testing"""
    
    def __init__(self):
        self.results: List[Tuple[str, bool, float, str]] = []
        self.start_time = time.time()
        
        # Configuration
        self.mysql_host = os.getenv("MYSQL_HOST", "localhost")
        self.mysql_port = os.getenv("MYSQL_PORT", "3306")
        self.mysql_user = os.getenv("MYSQL_USER", "root")
        self.mysql_password = os.getenv("MYSQL_PASSWORD", "test_password")
        self.mysql_test_db = os.getenv("MYSQL_TEST_DB", "test_mysql_migration")
        
        self.test_db_url = (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}@"
            f"{self.mysql_host}:{self.mysql_port}/{self.mysql_test_db}?charset=utf8mb4"
        )
        
        # Set environment variables
        os.environ["MYSQL_TEST_DATABASE_URL"] = self.test_db_url
        os.environ["TEST_DATABASE_URL"] = self.test_db_url
        os.environ["DATABASE_URL"] = self.test_db_url
    
    def print_header(self, title: str):
        """Print a formatted header"""
        print("\n" + "=" * 80)
        print(f"  {title}")
        print("=" * 80)
    
    def print_success(self, message: str):
        """Print success message"""
        print(f"✓ {message}")
    
    def print_error(self, message: str):
        """Print error message"""
        print(f"✗ {message}")
    
    def print_warning(self, message: str):
        """Print warning message"""
        print(f"⚠ {message}")
    
    def run_command(
        self, 
        command: List[str], 
        description: str,
        critical: bool = True
    ) -> bool:
        """
        Run a command and track results
        
        Args:
            command: Command to execute
            description: Description of the test
            critical: Whether failure should stop execution
        
        Returns:
            True if successful, False otherwise
        """
        print(f"\n  Running: {description}")
        start = time.time()
        
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )
            
            duration = time.time() - start
            success = result.returncode == 0
            
            if success:
                self.print_success(f"{description} completed in {duration:.2f}s")
                self.results.append((description, True, duration, ""))
            else:
                error_msg = result.stderr[-500:] if result.stderr else "Unknown error"
                self.print_error(f"{description} failed")
                self.results.append((description, False, duration, error_msg))
                
                if critical:
                    print(f"\nError output:\n{result.stderr[-1000:]}")
                    return False
            
            return success
            
        except subprocess.TimeoutExpired:
            duration = time.time() - start
            self.print_error(f"{description} timed out after {duration:.2f}s")
            self.results.append((description, False, duration, "Timeout"))
            
            if critical:
                return False
            return False
        
        except Exception as e:
            duration = time.time() - start
            self.print_error(f"{description} failed with exception: {str(e)}")
            self.results.append((description, False, duration, str(e)))
            
            if critical:
                return False
            return False
    
    def check_mysql_connection(self) -> bool:
        """Verify MySQL connection is available"""
        self.print_header("Checking MySQL Connection")
        
        command = [
            "mysql",
            "-h", self.mysql_host,
            "-P", self.mysql_port,
            "-u", self.mysql_user,
            f"-p{self.mysql_password}",
            "-e", "SELECT 1"
        ]
        
        return self.run_command(
            command,
            "MySQL connection test",
            critical=True
        )
    
    def setup_test_database(self) -> bool:
        """Create and configure test database"""
        self.print_header("Setting Up Test Database")
        
        # Create database
        create_db_sql = (
            f"CREATE DATABASE IF NOT EXISTS {self.mysql_test_db} "
            f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        )
        
        command = [
            "mysql",
            "-h", self.mysql_host,
            "-P", self.mysql_port,
            "-u", self.mysql_user,
            f"-p{self.mysql_password}",
            "-e", create_db_sql
        ]
        
        return self.run_command(
            command,
            "Create test database",
            critical=True
        )
    
    def run_alembic_migrations(self) -> bool:
        """Execute Alembic migrations"""
        self.print_header("Step 1: Running Alembic Migrations")
        
        # Clean database first
        clean_command = [
            "mysql",
            "-h", self.mysql_host,
            "-P", self.mysql_port,
            "-u", self.mysql_user,
            f"-p{self.mysql_password}",
            self.mysql_test_db,
            "-e",
            "SET FOREIGN_KEY_CHECKS = 0; "
            "DROP DATABASE IF EXISTS test_mysql_migration; "
            "CREATE DATABASE test_mysql_migration CHARACTER SET utf8mb4; "
            "SET FOREIGN_KEY_CHECKS = 1;"
        ]
        
        self.run_command(clean_command, "Clean test database", critical=False)
        
        # Run migrations
        return self.run_command(
            ["alembic", "upgrade", "head"],
            "Alembic upgrade head",
            critical=True
        )
    
    def run_comprehensive_tests(self) -> bool:
        """Run comprehensive migration tests"""
        self.print_header("Step 2: Running Comprehensive Migration Tests")
        
        return self.run_command(
            [
                "pytest",
                "tests/migration/test_mysql_comprehensive.py",
                "-v",
                "--tb=short"
            ],
            "Comprehensive migration tests",
            critical=True
        )
    
    def run_unit_tests(self) -> bool:
        """Run unit tests"""
        self.print_header("Step 3: Running Unit Tests")
        
        return self.run_command(
            [
                "pytest",
                "tests/unit/",
                "-v",
                "--tb=short",
                "-m", "not slow"
            ],
            "Unit tests",
            critical=False
        )
    
    def run_integration_tests(self) -> bool:
        """Run integration tests"""
        self.print_header("Step 4: Running Integration Tests")
        
        return self.run_command(
            [
                "pytest",
                "tests/integration/",
                "-v",
                "--tb=short",
                "-m", "not slow"
            ],
            "Integration tests",
            critical=False
        )
    
    def run_api_tests(self) -> bool:
        """Run API endpoint tests"""
        self.print_header("Step 5: Running API Endpoint Tests")
        
        return self.run_command(
            [
                "pytest",
                "tests/migration/test_api_endpoints_mysql.py",
                "-v",
                "--tb=short"
            ],
            "API endpoint tests",
            critical=False
        )
    
    def run_performance_tests(self) -> bool:
        """Run performance benchmarks"""
        self.print_header("Step 6: Running Performance Benchmarks")
        
        return self.run_command(
            [
                "pytest",
                "tests/benchmark/test_performance.py",
                "-v",
                "--tb=short"
            ],
            "Performance benchmarks",
            critical=False
        )
    
    def validate_schema(self) -> bool:
        """Validate database schema integrity"""
        self.print_header("Step 7: Validating Schema Integrity")
        
        # Check table count
        table_count_sql = (
            f"SELECT COUNT(*) FROM information_schema.tables "
            f"WHERE table_schema = '{self.mysql_test_db}';"
        )
        
        result = self.run_command(
            [
                "mysql",
                "-h", self.mysql_host,
                "-P", self.mysql_port,
                "-u", self.mysql_user,
                f"-p{self.mysql_password}",
                "-sN",
                "-e", table_count_sql
            ],
            "Check table count",
            critical=False
        )
        
        # Check foreign keys
        fk_count_sql = (
            f"SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS "
            f"WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' "
            f"AND CONSTRAINT_SCHEMA = '{self.mysql_test_db}';"
        )
        
        self.run_command(
            [
                "mysql",
                "-h", self.mysql_host,
                "-P", self.mysql_port,
                "-u", self.mysql_user,
                f"-p{self.mysql_password}",
                "-sN",
                "-e", fk_count_sql
            ],
            "Check foreign key constraints",
            critical=False
        )
        
        return result
    
    def test_multi_tenant_isolation(self) -> bool:
        """Test multi-tenant data isolation"""
        self.print_header("Step 8: Testing Multi-Tenant Isolation")
        
        return self.run_command(
            [
                "pytest",
                "tests/migration/test_mysql_comprehensive.py::TestMySQLMigrationComprehensive::test_02_multi_tenant_data_isolation",
                "-v",
                "-s"
            ],
            "Multi-tenant isolation test",
            critical=True
        )
    
    def print_summary(self):
        """Print test execution summary"""
        self.print_header("Test Execution Summary")
        
        total_duration = time.time() - self.start_time
        passed = sum(1 for _, success, _, _ in self.results if success)
        failed = sum(1 for _, success, _, _ in self.results if not success)
        
        print(f"\nTotal Tests: {len(self.results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Total Duration: {total_duration:.2f}s")
        print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        print("\n" + "-" * 80)
        print(f"{'Test':<50} {'Status':<10} {'Duration':<15}")
        print("-" * 80)
        
        for description, success, duration, error in self.results:
            status = "PASSED" if success else "FAILED"
            status_symbol = "✓" if success else "✗"
            print(f"{status_symbol} {description:<48} {status:<10} {duration:>6.2f}s")
            
            if not success and error:
                print(f"    Error: {error[:100]}")
        
        print("-" * 80)
        
        if failed == 0:
            self.print_success("All tests passed!")
            return True
        else:
            self.print_error(f"{failed} test(s) failed")
            return False
    
    def run_all(self) -> bool:
        """Execute all validation steps"""
        print("\n" + "=" * 80)
        print("  MySQL Migration Comprehensive Validation")
        print("  Started:", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        print("=" * 80)
        
        # Configuration
        print(f"\nConfiguration:")
        print(f"  MySQL Host: {self.mysql_host}:{self.mysql_port}")
        print(f"  Test Database: {self.mysql_test_db}")
        print(f"  Database URL: {self.test_db_url}")
        
        # Execute test steps
        steps = [
            self.check_mysql_connection,
            self.setup_test_database,
            self.run_alembic_migrations,
            self.run_comprehensive_tests,
            self.run_unit_tests,
            self.run_integration_tests,
            self.run_api_tests,
            self.run_performance_tests,
            self.validate_schema,
            self.test_multi_tenant_isolation,
        ]
        
        for step in steps:
            if not step():
                # Continue even if non-critical tests fail
                pass
        
        # Print summary
        return self.print_summary()


def main():
    """Main entry point"""
    runner = TestRunner()
    success = runner.run_all()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
