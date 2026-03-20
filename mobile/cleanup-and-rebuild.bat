@echo off
REM Expo Mobile App - Build Cache Cleanup and Rebuild Script
REM This script clears the build cache and reinstalls dependencies

echo ========================================
echo Expo Build Cache Cleanup Script
echo ========================================
echo.

cd /d "%~dp0"
echo Working directory: %CD%
echo.

REM Step 1: Remove node_modules
echo [1/6] Removing node_modules directory...
if exist node_modules (
    echo   Attempting to remove node_modules...
    rmdir /s /q node_modules 2>nul
    if exist node_modules (
        echo   Warning: Could not fully remove node_modules
        echo   Please delete manually or use PowerShell script
    ) else (
        echo   + node_modules removed successfully
    )
) else (
    echo   + node_modules not found (already clean)
)
echo.

REM Step 2: Remove .expo directory
echo [2/6] Removing .expo directory...
if exist .expo (
    rmdir /s /q .expo 2>nul
    if exist .expo (
        echo   Warning: Could not remove .expo
    ) else (
        echo   + .expo directory removed
    )
) else (
    echo   + .expo directory not found (already clean)
)
echo.

REM Step 3: Remove package-lock.json
echo [3/6] Removing package-lock.json...
if exist package-lock.json (
    del /f /q package-lock.json 2>nul
    if exist package-lock.json (
        echo   Warning: Could not remove package-lock.json
    ) else (
        echo   + package-lock.json removed
    )
) else (
    echo   + package-lock.json not found (already clean)
)
echo.

REM Step 4: Clear npm cache
echo [4/6] Clearing npm cache...
call npm cache clean --force
if errorlevel 1 (
    echo   Warning: Could not clear npm cache
) else (
    echo   + npm cache cleared
)
echo.

REM Step 5: Install dependencies
echo [5/6] Installing dependencies...
echo   This may take several minutes...
call npm install
if errorlevel 1 (
    echo   Error during npm install
    echo   Please check the errors above
    pause
    exit /b 1
) else (
    echo   + Dependencies installed successfully
)
echo.

REM Step 6: Start Expo (optional - can be commented out)
echo [6/6] Starting Expo with clear cache...
echo   Press Ctrl+C to stop the server when done
echo.
call npx expo start --clear

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.

REM Verification
echo Verification:
if exist node_modules (echo   node_modules exists: True) else (echo   node_modules exists: False)
if exist package-lock.json (echo   package-lock.json exists: True) else (echo   package-lock.json exists: False)
if exist .expo (echo   .expo exists: True) else (echo   .expo exists: False)
echo.

pause
