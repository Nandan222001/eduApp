# Testing Quick Reference

## Quick Start Commands

### Backend Tests
```bash
# Run all backend tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=src --cov-report=html

# Run only unit tests
poetry run pytest -m unit

# Run only integration tests
poetry run pytest -m integration

# Run specific file
poetry run pytest tests/test_api_auth.py

# Run with verbose output
poetry run pytest -v

# Run in parallel
poetry run pytest -n auto
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test -- --watch

# Run with UI
npm run test:ui

# Run specific test
npm run test LoginPage.test.tsx
```

### E2E Tests
```bash
# Run all E2E tests
npx playwright test

# Run in UI mode
npx playwright test --ui

# Run specific test
npx playwright test tests/login.e2e.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
```

### All Tests
```bash
# Run comprehensive test suite
./scripts/run-tests.sh
```

## Test File Locations

```
Backend Tests:       tests/test_*.py
Frontend Tests:      frontend/src/*.test.tsx
E2E Tests:           tests/*.e2e.spec.ts
Test Fixtures:       tests/conftest.py
Test Factories:      tests/factories.py
Test Utilities:      tests/utils.py
```

## Coverage Reports

```bash
# Backend HTML report
open htmlcov/index.html

# Frontend HTML report
open frontend/coverage/index.html

# Playwright report
npx playwright show-report
```

## Common Test Patterns

### Backend Unit Test
```python
import pytest

@pytest.mark.unit
def test_something(db_session, institution):
    # Arrange
    data = {"key": "value"}
    
    # Act
    result = function_to_test(data)
    
    # Assert
    assert result == expected_value
```

### Backend Integration Test
```python
import pytest
from fastapi.testclient import TestClient

@pytest.mark.integration
def test_api_endpoint(client: TestClient, auth_headers):
    # Act
    response = client.post(
        "/api/v1/endpoint",
        headers=auth_headers,
        json={"data": "value"}
    )
    
    # Assert
    assert response.status_code == 201
    assert "id" in response.json()
```

### Frontend Component Test
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
  
  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

## Useful Fixtures (Backend)

```python
# Available in tests via function parameters
db_session          # Clean database session
client              # FastAPI test client
institution         # Test institution
admin_user          # Admin user
teacher_user        # Teacher user
student_user        # Student user
admin_role          # Admin role
teacher_role        # Teacher role
student_role        # Student role
academic_year       # Academic year
grade               # Grade/class
section             # Section
subject             # Subject
teacher             # Teacher profile
student             # Student profile
auth_headers        # Authentication headers
mock_s3_client      # Mocked S3 client
mock_redis          # Mocked Redis client
```

## Test Markers

```python
@pytest.mark.unit          # Unit test
@pytest.mark.integration   # Integration test
@pytest.mark.slow          # Slow test
@pytest.mark.e2e           # E2E test
```

## CI/CD Status Checks

### Required to Pass
- ✅ Backend linting (Ruff, Black)
- ✅ Backend tests (unit + integration)
- ✅ Backend coverage (70%+)
- ✅ Frontend linting (ESLint, Prettier)
- ✅ Frontend tests
- ✅ Frontend coverage (70%+)
- ✅ Build succeeds

### Optional
- ⚠️ E2E tests (may need services running)
- ⚠️ Security scans

## Debugging Tests

### Backend
```bash
# Run with print statements visible
poetry run pytest -s

# Stop on first failure
poetry run pytest -x

# Drop to debugger on failure
poetry run pytest --pdb

# Run last failed tests
poetry run pytest --lf
```

### Frontend
```bash
# Debug in browser
npm run test:ui

# With console logs
npm run test -- --reporter=verbose
```

### E2E
```bash
# Debug mode
npx playwright test --debug

# Step through test
npx playwright test --headed --slowmo=1000
```

## Environment Setup

### Backend
```bash
# Install dependencies
poetry install

# Activate environment
poetry shell

# Check installation
poetry run pytest --version
```

### Frontend
```bash
cd frontend
npm install
npm run test -- --version
```

### E2E
```bash
# Install Playwright
npx playwright install

# With dependencies
npx playwright install --with-deps
```

## Common Issues

### Backend
```bash
# Database locked
# Use: rm test.db

# Import errors
# Use: poetry shell

# Fixture not found
# Check: tests/conftest.py
```

### Frontend
```bash
# Module not found
npm install

# Cache issues
npm run test -- --clearCache
```

### E2E
```bash
# Browser not found
npx playwright install

# Timeout
# Increase in playwright.config.ts
```

## Coverage Thresholds

### Backend (pytest)
```toml
[tool.coverage.report]
fail_under = 70
```

### Frontend (Vitest)
```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  }
}
```

## Pre-commit Checklist

```bash
# 1. Run backend tests
poetry run pytest -m unit

# 2. Run frontend tests
cd frontend && npm run test

# 3. Check linting
poetry run ruff check src/
cd frontend && npm run lint

# 4. Check formatting
poetry run black --check src/
cd frontend && npm run format:check

# 5. Check types
poetry run mypy src/
cd frontend && npm run type-check
```

## Continuous Testing

### Backend
```bash
# Install pytest-watch
pip install pytest-watch

# Run in watch mode
ptw
```

### Frontend
```bash
# Already built-in
npm run test -- --watch
```

## Resources

- [Pytest Docs](https://docs.pytest.org/)
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

## Test Data

### Create test user
```python
from tests.factories import UserFactory
user = UserFactory.build()
```

### Create test institution
```python
from tests.factories import create_test_institution
institution = create_test_institution(db_session)
```

### Create test assignment
```python
from tests.factories import create_test_assignment
assignment = create_test_assignment(
    db_session,
    institution_id=1,
    teacher_id=1
)
```

## Performance

### Run tests in parallel
```bash
# Backend (requires pytest-xdist)
poetry run pytest -n auto

# Frontend (built-in)
npm run test -- --threads

# E2E
npx playwright test --workers=4
```

### Skip slow tests
```bash
poetry run pytest -m "not slow"
```

## Reporting

### Generate JUnit XML
```bash
poetry run pytest --junitxml=junit.xml
```

### Generate JSON report
```bash
npx playwright test --reporter=json
```

### Generate HTML report
```bash
poetry run pytest --html=report.html
npx playwright show-report
```
