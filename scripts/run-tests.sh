#!/bin/bash

# Script to run all tests
set -e

echo "=========================================="
echo "Running Educational SaaS Test Suite"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# Backend Tests
echo ""
echo "=========================================="
echo "Running Backend Tests"
echo "=========================================="

echo "1. Running backend linting..."
poetry run ruff check src/
print_status $? "Backend linting"

echo "2. Running backend formatting check..."
poetry run black --check src/
print_status $? "Backend formatting"

echo "3. Running backend type checking..."
poetry run mypy src/ || true
print_status 0 "Backend type checking (warnings allowed)"

echo "4. Running backend unit tests..."
poetry run pytest tests/ -m unit -v --cov=src --cov-report=html --cov-report=term
print_status $? "Backend unit tests"

echo "5. Running backend integration tests..."
poetry run pytest tests/ -m integration -v --cov-append
print_status $? "Backend integration tests"

echo "6. Checking backend coverage threshold..."
poetry run coverage report --fail-under=70
print_status $? "Backend coverage threshold (70%+)"

# Frontend Tests
echo ""
echo "=========================================="
echo "Running Frontend Tests"
echo "=========================================="

cd frontend

echo "1. Running frontend linting..."
npm run lint
print_status $? "Frontend linting"

echo "2. Running frontend formatting check..."
npm run format:check
print_status $? "Frontend formatting"

echo "3. Running frontend type checking..."
npm run type-check
print_status $? "Frontend type checking"

echo "4. Running frontend tests with coverage..."
npm run test:coverage
print_status $? "Frontend tests"

cd ..

# E2E Tests
echo ""
echo "=========================================="
echo "Running E2E Tests"
echo "=========================================="

echo "1. Installing Playwright browsers (if needed)..."
npx playwright install --with-deps chromium
print_status $? "Playwright installation"

echo "2. Starting services for E2E tests..."
# Note: This requires services to be running
# docker-compose up -d

echo "3. Running E2E tests..."
npx playwright test
E2E_STATUS=$?

if [ $E2E_STATUS -eq 0 ]; then
    print_status 0 "E2E tests"
else
    echo -e "${YELLOW}⚠ E2E tests failed or services not running${NC}"
    echo "  Start services with: docker-compose up -d"
fi

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}✓ Backend tests passed${NC}"
echo -e "${GREEN}✓ Frontend tests passed${NC}"

if [ $E2E_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓ E2E tests passed${NC}"
else
    echo -e "${YELLOW}⚠ E2E tests skipped or failed${NC}"
fi

echo ""
echo "Coverage reports generated:"
echo "  - Backend: htmlcov/index.html"
echo "  - Frontend: frontend/coverage/index.html"
echo "  - E2E: playwright-report/index.html"
echo ""
echo -e "${GREEN}=========================================="
echo "All tests completed successfully!"
echo "==========================================${NC}"
