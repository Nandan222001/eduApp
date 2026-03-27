# PowerShell script to run alembic upgrade head and check for errors
# This helps debug migration 011 issues

Write-Host "=" * 60
Write-Host "Running Alembic Upgrade to Head"
Write-Host "=" * 60

# Run alembic upgrade
Write-Host "`nExecuting: alembic upgrade head" -ForegroundColor Cyan
Write-Host "-" * 60

try {
    # Run the upgrade command
    $output = & alembic upgrade head 2>&1
    
    # Display output
    Write-Host $output
    
    # Check if there was an error
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Migration FAILED with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "`nPossible issues to check:" -ForegroundColor Yellow
        Write-Host "1. Check if questions_bank table exists and has INTEGER id column"
        Write-Host "2. Check MySQL error logs for foreign key constraint errors"
        Write-Host "3. Verify database connection settings in .env file"
        Write-Host "4. Run: python scripts/run_alembic_upgrade.py for detailed diagnostics"
        exit 1
    } else {
        Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "`n❌ Error running alembic upgrade:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

Write-Host "`n" + "=" * 60
Write-Host "Checking Current Database State"
Write-Host "=" * 60

# Try to run the Python diagnostic script
if (Test-Path "scripts/run_alembic_upgrade.py") {
    Write-Host "`nRunning diagnostic script..." -ForegroundColor Cyan
    try {
        python scripts/run_alembic_upgrade.py
    } catch {
        Write-Host "Could not run diagnostic script: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Done!" -ForegroundColor Green
