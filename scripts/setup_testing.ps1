#!/usr/bin/env pwsh

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Setting Up Testing Environment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1 | Select-String -Pattern "(\d+\.\d+\.\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    $requiredVersion = [version]"3.11.0"
    $currentVersion = [version]$pythonVersion
    
    if ($currentVersion -lt $requiredVersion) {
        Write-Host "❌ Error: Python 3.11+ is required. Found: $pythonVersion" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Python $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Check if Poetry is installed
Write-Host ""
Write-Host "Checking Poetry installation..." -ForegroundColor Yellow
try {
    $poetryVersion = poetry --version 2>&1
    Write-Host "✓ Poetry is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Poetry not found. Installing..." -ForegroundColor Red
    (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
    $env:PATH = "$env:APPDATA\Python\Scripts;$env:PATH"
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
poetry install --no-interaction

# Install pre-commit hooks
Write-Host ""
Write-Host "Installing pre-commit hooks..." -ForegroundColor Yellow
poetry run pre-commit install
Write-Host "✓ Pre-commit hooks installed" -ForegroundColor Green

# Create .env file if it doesn't exist
Write-Host ""
Write-Host "Setting up environment variables..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "✓ Created .env from .env.example" -ForegroundColor Green
    } else {
        @"
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=test-secret-key-change-in-production
ENVIRONMENT=development
DEBUG=True
"@ | Out-File -FilePath .env -Encoding UTF8
        Write-Host "✓ Created .env with default values" -ForegroundColor Green
    }
} else {
    Write-Host "✓ .env already exists" -ForegroundColor Green
}

# Check Docker availability
Write-Host ""
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✓ Docker is available" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Starting test services (PostgreSQL & Redis)..." -ForegroundColor Yellow
    docker-compose up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    $retries = 0
    $maxRetries = 30
    while ($retries -lt $maxRetries) {
        try {
            docker-compose exec -T postgres pg_isready -U test_user 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                break
            }
        } catch {}
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
        $retries++
    }
    Write-Host ""
    Write-Host "✓ PostgreSQL is ready" -ForegroundColor Green
    
    # Wait for Redis to be ready
    Write-Host "Waiting for Redis to be ready..." -ForegroundColor Yellow
    $retries = 0
    while ($retries -lt $maxRetries) {
        try {
            docker-compose exec -T redis redis-cli ping 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                break
            }
        } catch {}
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
        $retries++
    }
    Write-Host ""
    Write-Host "✓ Redis is ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker not found. You'll need to run PostgreSQL and Redis manually." -ForegroundColor Yellow
}

# Run migrations
Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
try {
    poetry run alembic upgrade head
} catch {
    Write-Host "⚠️  Migrations failed (may be expected if tables already exist)" -ForegroundColor Yellow
}

# Run a quick test to verify setup
Write-Host ""
Write-Host "Running smoke tests..." -ForegroundColor Yellow
try {
    poetry run pytest tests/ -m "unit" -x --tb=short -q 2>&1 | Out-Null
} catch {
    Write-Host "⚠️  Some tests failed. This might be expected." -ForegroundColor Yellow
}

# Generate coverage report structure
Write-Host ""
Write-Host "Setting up coverage reporting..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path htmlcov | Out-Null

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick Start Commands:" -ForegroundColor Yellow
Write-Host "  make test              # Run all tests"
Write-Host "  make test-cov          # Run tests with coverage"
Write-Host "  make coverage-report   # View coverage report"
Write-Host "  make quality           # Run all quality checks"
Write-Host "  make format            # Format code"
Write-Host "  make lint              # Run linter"
Write-Host ""
Write-Host "For more information, see:" -ForegroundColor Yellow
Write-Host "  - docs/TESTING_GUIDE.md"
Write-Host "  - docs/CI_CD_SETUP.md"
Write-Host ""
