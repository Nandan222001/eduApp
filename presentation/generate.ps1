# PowerShell script to generate the presentation
# Usage: .\generate.ps1

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Educational SaaS Platform - Presentation Generator" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if python is available
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.11+ and try again" -ForegroundColor Yellow
    exit 1
}

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
Write-Host "  $pythonVersion" -ForegroundColor Green

# Check if python-pptx is installed
Write-Host ""
Write-Host "Checking for python-pptx dependency..." -ForegroundColor Yellow
$pptxInstalled = python -c "import pptx; print('installed')" 2>$null

if ($pptxInstalled -ne "installed") {
    Write-Host "  python-pptx is not installed" -ForegroundColor Yellow
    Write-Host "  Installing python-pptx..." -ForegroundColor Yellow
    pip install python-pptx
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Error: Failed to install python-pptx" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ python-pptx installed successfully" -ForegroundColor Green
} else {
    Write-Host "  ✓ python-pptx is already installed" -ForegroundColor Green
}

# Generate the presentation
Write-Host ""
Write-Host "Generating presentation..." -ForegroundColor Yellow
Write-Host ""

python create_presentation.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "  ✓ Presentation generated successfully!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "The PowerPoint file is ready:" -ForegroundColor Cyan
    Write-Host "  Educational_SaaS_Platform_Presentation.pptx" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host "  ✗ Error: Failed to generate presentation" -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    exit 1
}
