@echo off
REM Batch file to run migration 011 with diagnostics
REM This is a simple wrapper around the PowerShell script

echo ======================================================================
echo MIGRATION 011 - DIAGNOSTIC AND UPGRADE
echo ======================================================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell not found
    echo Please install PowerShell or run alembic directly:
    echo   alembic upgrade head
    pause
    exit /b 1
)

REM Run the PowerShell script
echo Running diagnostic and upgrade script...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0diagnose_and_fix_migration_011.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ======================================================================
    echo MIGRATION FAILED
    echo ======================================================================
    echo.
    echo For troubleshooting, see:
    echo   scripts\MIGRATION_011_TROUBLESHOOTING.md
    echo.
    echo Or run diagnostics only:
    echo   python scripts\verify_schema.py
    echo.
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo MIGRATION COMPLETED SUCCESSFULLY
echo ======================================================================
echo.
pause
