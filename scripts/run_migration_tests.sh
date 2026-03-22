#!/bin/bash
# Script to run migration tests
# Usage: ./scripts/run_migration_tests.sh [test_type] [-v]
#
# test_type options:
#   all          - Run all migration tests (default)
#   forward      - Test forward migration only
#   backward     - Test backward migration only
#   idempotency  - Test migration idempotency
#   foreign_keys - Test foreign key constraints
#   indexes      - Test index creation and performance
#   data_integrity - Test data integrity
#   performance  - Test migration performance

set -e

# Default values
TEST_TYPE="${1:-all}"
VERBOSE="${2:-}"
DATABASE_URL="${TEST_MIGRATION_DATABASE_URL:-mysql+pymysql://root:root@localhost:3306/test_migrations_db}"

# Export environment variable
export TEST_MIGRATION_DATABASE_URL="$DATABASE_URL"

echo "================================"
echo "Migration Test Runner"
echo "================================"
echo ""
echo "Test Type: $TEST_TYPE"
echo "Database: $DATABASE_URL"
echo ""

# Check if database exists
if ! mysql -h localhost -u root -proot -e "USE test_migrations_db;" 2>/dev/null; then
    echo "Creating test database..."
    mysql -h localhost -u root -proot -e "CREATE DATABASE test_migrations_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if [ $? -eq 0 ]; then
        echo "✓ Test database created"
    else
        echo "✗ Failed to create test database"
        exit 1
    fi
fi

# Build pytest command
PYTEST_ARGS=("tests/migration/")

case "$TEST_TYPE" in
    all)
        PYTEST_ARGS+=("-v")
        ;;
    forward)
        PYTEST_ARGS+=("test_migrations.py::TestMigrations::test_forward_migration_from_scratch" "-v")
        ;;
    backward)
        PYTEST_ARGS+=("test_migrations.py::TestMigrations::test_backward_migration_last_5" "-v")
        ;;
    idempotency)
        PYTEST_ARGS+=("test_migrations.py::TestMigrations::test_migration_idempotency" "-v")
        ;;
    foreign_keys)
        PYTEST_ARGS+=("test_migrations.py::TestMigrations::test_foreign_key_constraints" "-v")
        ;;
    indexes)
        PYTEST_ARGS+=("test_migrations.py::TestMigrations::test_index_creation_and_performance" "-v")
        ;;
    data_integrity)
        PYTEST_ARGS+=("test_migrations.py::TestMigrationDataIntegrity" "-v")
        ;;
    performance)
        PYTEST_ARGS+=("test_migrations.py::TestMigrationPerformance" "-v")
        ;;
    *)
        echo "Invalid test type: $TEST_TYPE"
        echo "Valid options: all, forward, backward, idempotency, foreign_keys, indexes, data_integrity, performance"
        exit 1
        ;;
esac

if [ "$VERBOSE" == "-v" ] || [ "$VERBOSE" == "--verbose" ]; then
    PYTEST_ARGS+=("-s")
fi

# Run tests
echo "Running migration tests..."
echo ""

pytest "${PYTEST_ARGS[@]}"

EXIT_CODE=$?

# Display results
echo ""
echo "================================"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✓ Tests PASSED"
else
    echo "✗ Tests FAILED"
fi

echo "================================"

exit $EXIT_CODE
