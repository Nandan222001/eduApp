# PowerShell script to run migration tests
# Usage: .\scripts\run_migration_tests.ps1 [-TestType <type>] [-Verbose]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "forward", "backward", "idempotency", "foreign_keys", "indexes", "data_integrity", "performance")]
    [string]$TestType = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl = "postgresql://postgres:postgres@localhost:5432/test_migrations_db"
)

# Set environment variable
$env:TEST_MIGRATION_DATABASE_URL = $DatabaseUrl

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Migration Test Runner" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Type: $TestType" -ForegroundColor Yellow
Write-Host "Database: $DatabaseUrl" -ForegroundColor Yellow
Write-Host ""

# Check if database exists
$dbExists = psql -lqt -h localhost -U postgres 2>$null | Select-String -Pattern "test_migrations_db"

if (-not $dbExists) {
    Write-Host "Creating test database..." -ForegroundColor Yellow
    createdb -h localhost -U postgres test_migrations_db
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Test database created" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create test database" -ForegroundColor Red
        exit 1
    }
}

# Build pytest command
$pytestArgs = @("tests/migration/")

switch ($TestType) {
    "all" {
        $pytestArgs += @("-v")
    }
    "forward" {
        $pytestArgs += @("test_migrations.py::TestMigrations::test_forward_migration_from_scratch", "-v")
    }
    "backward" {
        $pytestArgs += @("test_migrations.py::TestMigrations::test_backward_migration_last_5", "-v")
    }
    "idempotency" {
        $pytestArgs += @("test_migrations.py::TestMigrations::test_migration_idempotency", "-v")
    }
    "foreign_keys" {
        $pytestArgs += @("test_migrations.py::TestMigrations::test_foreign_key_constraints", "-v")
    }
    "indexes" {
        $pytestArgs += @("test_migrations.py::TestMigrations::test_index_creation_and_performance", "-v")
    }
    "data_integrity" {
        $pytestArgs += @("test_migrations.py::TestMigrationDataIntegrity", "-v")
    }
    "performance" {
        $pytestArgs += @("test_migrations.py::TestMigrationPerformance", "-v")
    }
}

if ($Verbose) {
    $pytestArgs += @("-s")
}

# Run tests
Write-Host "Running migration tests..." -ForegroundColor Yellow
Write-Host ""

& pytest @pytestArgs

$exitCode = $LASTEXITCODE

# Display results
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "✓ Tests PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Tests FAILED" -ForegroundColor Red
}

Write-Host "================================" -ForegroundColor Cyan

exit $exitCode
