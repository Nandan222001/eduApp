# Expo Mobile App - Build Cache Cleanup and Rebuild Script
# This script clears the build cache and reinstalls dependencies

param(
    [switch]$SkipInstall = $false,
    [switch]$SkipStart = $false
)

$ErrorActionPreference = 'Continue'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Expo Build Cache Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $ScriptDir

Write-Host "Working directory: $ScriptDir" -ForegroundColor Yellow
Write-Host ""

# Step 1: Remove node_modules
Write-Host "[1/6] Removing node_modules directory..." -ForegroundColor Green
if (Test-Path "node_modules") {
    try {
        # Method 1: Try robocopy for handling long paths
        Write-Host "  Using robocopy method for safe deletion..." -ForegroundColor Gray
        New-Item -ItemType Directory -Force -Path "empty_temp" | Out-Null
        
        $robocopyOutput = robocopy "empty_temp" "node_modules" /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS /nc /ns /np 2>&1
        
        Remove-Item -Force -Recurse "empty_temp" -ErrorAction SilentlyContinue
        Remove-Item -Force -Recurse "node_modules" -ErrorAction SilentlyContinue
        
        if (Test-Path "node_modules") {
            Write-Host "  Warning: Some files may remain. Trying alternate method..." -ForegroundColor Yellow
            # Method 2: Direct removal with error suppression
            Get-ChildItem -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue | 
                Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
            Remove-Item -Path "node_modules" -Force -Recurse -ErrorAction SilentlyContinue
        }
        
        if (Test-Path "node_modules") {
            Write-Host "  Warning: node_modules still exists. Manual deletion may be required." -ForegroundColor Yellow
            Write-Host "  Please delete manually via File Explorer or use: rmdir /s /q node_modules" -ForegroundColor Yellow
        } else {
            Write-Host "  ✓ node_modules removed successfully" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  Error removing node_modules: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  You may need to manually delete it." -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✓ node_modules not found (already clean)" -ForegroundColor Green
}
Write-Host ""

# Step 2: Remove .expo directory
Write-Host "[2/6] Removing .expo directory..." -ForegroundColor Green
if (Test-Path ".expo") {
    try {
        Remove-Item -Recurse -Force ".expo" -ErrorAction Stop
        Write-Host "  ✓ .expo directory removed" -ForegroundColor Green
    }
    catch {
        Write-Host "  Error removing .expo: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ✓ .expo directory not found (already clean)" -ForegroundColor Green
}
Write-Host ""

# Step 3: Remove package-lock.json
Write-Host "[3/6] Removing package-lock.json..." -ForegroundColor Green
if (Test-Path "package-lock.json") {
    try {
        Remove-Item "package-lock.json" -Force -ErrorAction Stop
        Write-Host "  ✓ package-lock.json removed" -ForegroundColor Green
    }
    catch {
        Write-Host "  Error removing package-lock.json: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ✓ package-lock.json not found (already clean)" -ForegroundColor Green
}
Write-Host ""

# Step 4: Clear npm cache
Write-Host "[4/6] Clearing npm cache..." -ForegroundColor Green
try {
    $npmCacheOutput = npm cache clean --force 2>&1
    Write-Host "  ✓ npm cache cleared" -ForegroundColor Green
}
catch {
    Write-Host "  Warning: Could not clear npm cache: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Install dependencies
if (-not $SkipInstall) {
    Write-Host "[5/6] Installing dependencies..." -ForegroundColor Green
    Write-Host "  This may take several minutes..." -ForegroundColor Gray
    try {
        $npmInstallOutput = npm install 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Dependencies installed successfully" -ForegroundColor Green
        } else {
            Write-Host "  Error during npm install (exit code: $LASTEXITCODE)" -ForegroundColor Red
            Write-Host "  Output: $npmInstallOutput" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "  Error installing dependencies: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Please run 'npm install' manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "[5/6] Skipping dependency installation (--SkipInstall flag set)" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Start Expo with clear cache
if (-not $SkipStart) {
    Write-Host "[6/6] Starting Expo with clear cache..." -ForegroundColor Green
    Write-Host "  Press Ctrl+C to stop the server when done" -ForegroundColor Gray
    Write-Host ""
    try {
        npx expo start --clear
    }
    catch {
        Write-Host "  Error starting Expo: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Please run 'npx expo start --clear' manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "[6/6] Skipping Expo start (--SkipStart flag set)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To start Expo manually, run:" -ForegroundColor Cyan
    Write-Host "  npx expo start --clear" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verification
Write-Host "Verification:" -ForegroundColor Cyan
Write-Host "  node_modules exists: $(Test-Path 'node_modules')" -ForegroundColor Gray
Write-Host "  package-lock.json exists: $(Test-Path 'package-lock.json')" -ForegroundColor Gray
Write-Host "  .expo exists: $(Test-Path '.expo')" -ForegroundColor Gray
Write-Host ""
