# Comprehensive diagnostic and fix script for migration 011 issues
# This script will:
# 1. Verify database schema
# 2. Run alembic upgrade
# 3. Check MySQL error logs if upgrade fails

param(
    [switch]$SkipUpgrade = $false,
    [switch]$VerifyOnly = $false
)

$ErrorActionPreference = "Continue"

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "MIGRATION 011 DIAGNOSTIC AND FIX SCRIPT" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Step 1: Verify Python environment
Write-Host "`n[Step 1] Checking Python environment..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python." -ForegroundColor Red
    exit 1
}

# Step 2: Verify schema
Write-Host "`n[Step 2] Verifying database schema..." -ForegroundColor Yellow
Write-Host "-" * 70

try {
    $verifyOutput = python scripts/verify_schema.py 2>&1
    Write-Host $verifyOutput
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Schema verification passed" -ForegroundColor Green
        $schemaOk = $true
    } else {
        Write-Host "`n✗ Schema verification failed" -ForegroundColor Red
        $schemaOk = $false
    }
} catch {
    Write-Host "✗ Error running schema verification: $($_.Exception.Message)" -ForegroundColor Red
    $schemaOk = $false
}

if ($VerifyOnly) {
    Write-Host "`n--VerifyOnly flag set. Exiting without running upgrade." -ForegroundColor Cyan
    exit $(if ($schemaOk) { 0 } else { 1 })
}

if (-not $schemaOk) {
    Write-Host "`n⚠️  Schema issues detected. Do you want to continue with upgrade anyway? (y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Exiting. Please fix schema issues first." -ForegroundColor Yellow
        exit 1
    }
}

# Step 3: Run alembic upgrade
if (-not $SkipUpgrade) {
    Write-Host "`n[Step 3] Running alembic upgrade head..." -ForegroundColor Yellow
    Write-Host "-" * 70
    
    try {
        # Run upgrade and capture all output
        $upgradeOutput = alembic upgrade head 2>&1
        Write-Host $upgradeOutput
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✓ Migration completed successfully!" -ForegroundColor Green
            $upgradeSuccess = $true
        } else {
            Write-Host "`n✗ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            $upgradeSuccess = $false
        }
    } catch {
        Write-Host "✗ Error running alembic upgrade: $($_.Exception.Message)" -ForegroundColor Red
        $upgradeSuccess = $false
    }
} else {
    Write-Host "`n[Step 3] Skipped (--SkipUpgrade flag set)" -ForegroundColor Yellow
    $upgradeSuccess = $true
}

# Step 4: Check MySQL error logs if upgrade failed
if (-not $upgradeSuccess) {
    Write-Host "`n[Step 4] Checking MySQL error logs..." -ForegroundColor Yellow
    Write-Host "-" * 70
    
    try {
        & "$PSScriptRoot\check_mysql_logs.ps1"
    } catch {
        Write-Host "Could not check MySQL logs: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Step 5: Provide troubleshooting guidance
    Write-Host "`n" + "=" * 70 -ForegroundColor Red
    Write-Host "MIGRATION FAILED - TROUBLESHOOTING STEPS" -ForegroundColor Red
    Write-Host "=" * 70 -ForegroundColor Red
    
    Write-Host "`n1. Check the error messages above" -ForegroundColor Yellow
    Write-Host "   - Look for 'foreign key constraint' errors" -ForegroundColor Gray
    Write-Host "   - Look for 'table does not exist' errors" -ForegroundColor Gray
    
    Write-Host "`n2. Read the troubleshooting guide:" -ForegroundColor Yellow
    Write-Host "   Get-Content scripts\MIGRATION_011_TROUBLESHOOTING.md" -ForegroundColor Gray
    
    Write-Host "`n3. Check column types in MySQL:" -ForegroundColor Yellow
    Write-Host "   mysql -u your_user -p -e 'DESCRIBE questions_bank;'" -ForegroundColor Gray
    
    Write-Host "`n4. Verify questions_bank table exists:" -ForegroundColor Yellow
    Write-Host "   mysql -u your_user -p -e 'SHOW TABLES LIKE ""questions_bank"";'" -ForegroundColor Gray
    
    Write-Host "`n5. Check current alembic version:" -ForegroundColor Yellow
    Write-Host "   mysql -u your_user -p -e 'SELECT version_num FROM alembic_version;'" -ForegroundColor Gray
    
    Write-Host "`n6. Review migration dependencies:" -ForegroundColor Yellow
    Write-Host "   - Migration 011 requires migration 006a to be applied" -ForegroundColor Gray
    Write-Host "   - Line 62 of 006a creates questions_bank.id as INTEGER" -ForegroundColor Gray
    Write-Host "   - Line 74 of 011 references this as question_id (also INTEGER)" -ForegroundColor Gray
    
    exit 1
}

# Step 5: Verify schema after successful upgrade
if ($upgradeSuccess) {
    Write-Host "`n[Step 4] Verifying schema after migration..." -ForegroundColor Yellow
    Write-Host "-" * 70
    
    try {
        $postVerifyOutput = python scripts/verify_schema.py 2>&1
        Write-Host $postVerifyOutput
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✓ Post-migration verification passed" -ForegroundColor Green
        } else {
            Write-Host "`n⚠️  Post-migration verification showed warnings" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Could not verify schema after migration: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Final summary
Write-Host "`n" + "=" * 70 -ForegroundColor Green
Write-Host "SUMMARY" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Green

if ($upgradeSuccess) {
    Write-Host "✓ Migration 011 has been successfully applied!" -ForegroundColor Green
    Write-Host "`nThe following tables were created/updated:" -ForegroundColor White
    Write-Host "  - chapter_performance" -ForegroundColor Gray
    Write-Host "  - question_recommendations" -ForegroundColor Gray
    Write-Host "  - focus_areas" -ForegroundColor Gray
    Write-Host "  - personalized_insights" -ForegroundColor Gray
} else {
    Write-Host "✗ Migration 011 failed" -ForegroundColor Red
    Write-Host "`nPlease review the errors above and consult:" -ForegroundColor Yellow
    Write-Host "  scripts\MIGRATION_011_TROUBLESHOOTING.md" -ForegroundColor Gray
}

Write-Host "`n"
exit $(if ($upgradeSuccess) { 0 } else { 1 })
