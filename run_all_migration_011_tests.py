#!/usr/bin/env python3
"""
Master test runner for migration 011.
Runs all available tests and provides comprehensive results.
"""

import sys
import subprocess
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def print_header(title):
    """Print formatted header."""
    logger.info("\n" + "="*70)
    logger.info(f"  {title}")
    logger.info("="*70 + "\n")

def print_section(title):
    """Print formatted section."""
    logger.info("\n" + "-"*70)
    logger.info(f"  {title}")
    logger.info("-"*70 + "\n")

def run_test(script_name, description):
    """Run a test script and return success status."""
    print_section(f"{description}")
    logger.info(f"Running: {script_name}\n")
    
    start_time = datetime.now()
    
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Print output
        if result.stdout:
            print(result.stdout)
        
        if result.returncode == 0:
            logger.info(f"✓ {description} PASSED ({duration:.1f}s)\n")
            return True
        else:
            logger.error(f"✗ {description} FAILED ({duration:.1f}s)")
            if result.stderr:
                logger.error(f"Error output:\n{result.stderr}\n")
            return False
            
    except subprocess.TimeoutExpired:
        logger.error(f"✗ {description} TIMEOUT (exceeded 120s)\n")
        return False
    except Exception as e:
        logger.error(f"✗ {description} ERROR: {e}\n")
        return False

def check_prerequisites():
    """Check if prerequisites are met."""
    print_section("Prerequisites Check")
    
    all_ok = True
    
    # Check Python version
    if sys.version_info < (3, 8):
        logger.error("✗ Python 3.8+ required")
        all_ok = False
    else:
        logger.info(f"✓ Python {sys.version_info.major}.{sys.version_info.minor}")
    
    # Check required modules
    required_modules = ['sqlalchemy', 'pymysql', 'alembic']
    for module in required_modules:
        try:
            __import__(module)
            logger.info(f"✓ {module} installed")
        except ImportError:
            logger.error(f"✗ {module} not installed")
            all_ok = False
    
    # Check .env file
    import os
    if os.path.exists('.env'):
        logger.info("✓ .env file exists")
    else:
        logger.warning("⚠ .env file not found (will use defaults)")
    
    # Check test scripts exist
    test_scripts = [
        'test_migration_011.py',
        'test_migration_011_direct.py'
    ]
    for script in test_scripts:
        if os.path.exists(script):
            logger.info(f"✓ {script} found")
        else:
            logger.error(f"✗ {script} not found")
            all_ok = False
    
    logger.info("")
    return all_ok

def main():
    """Main test runner."""
    print_header("Migration 011 - Complete Test Suite")
    
    logger.info("Test Runner for Migration 011 (Weakness Detection Tables)")
    logger.info("Started at: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    logger.info("")
    
    # Check prerequisites
    if not check_prerequisites():
        logger.error("\n✗ Prerequisites check failed!")
        logger.error("Please install missing dependencies:")
        logger.error("  pip install sqlalchemy pymysql alembic")
        sys.exit(1)
    
    logger.info("✓ All prerequisites met\n")
    
    # Run tests
    results = {}
    
    # Test 1: Automated alembic test
    results['alembic'] = run_test(
        'test_migration_011.py',
        'Test 1: Automated Alembic Integration Test'
    )
    
    # Test 2: Direct function test
    results['direct'] = run_test(
        'test_migration_011_direct.py',
        'Test 2: Direct Function Unit Test'
    )
    
    # Print summary
    print_header("Test Results Summary")
    
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    failed_tests = total_tests - passed_tests
    
    logger.info(f"Total Tests:  {total_tests}")
    logger.info(f"Passed:       {passed_tests} ✓")
    logger.info(f"Failed:       {failed_tests} ✗")
    logger.info("")
    
    # Detailed results
    for test_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        logger.info(f"  {test_name.upper():20} {status}")
    
    logger.info("")
    logger.info("Completed at: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    # Final verdict
    if all(results.values()):
        print_header("✓ ALL TESTS PASSED")
        logger.info("Migration 011 is ready for deployment!")
        logger.info("")
        logger.info("Next steps:")
        logger.info("1. Test on staging environment")
        logger.info("2. Backup production database")
        logger.info("3. Run: alembic upgrade 011")
        logger.info("4. Verify: alembic current")
        logger.info("")
        return 0
    else:
        print_header("✗ SOME TESTS FAILED")
        logger.error("Please review the errors above and fix issues before deployment.")
        logger.error("")
        logger.error("For help, see:")
        logger.error("  - TEST_MIGRATION_011_README.md")
        logger.error("  - MIGRATION_011_TEST_GUIDE.md")
        logger.error("")
        return 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        logger.error("\n\nTests interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
