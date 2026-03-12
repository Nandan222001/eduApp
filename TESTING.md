# Testing Guide

This document provides comprehensive information about the testing suite for the Educational SaaS Platform.

## Table of Contents

- [Overview](#overview)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [E2E Testing](#e2e-testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Coverage Requirements](#coverage-requirements)
- [Running Tests](#running-tests)

## Overview

The testing suite consists of:

1. **Backend Tests (Python/Pytest)**
   - Unit tests for utility functions and services
   - Integration tests for API endpoints
   - Target: 70%+ code coverage

2. **Frontend Tests (React/Vitest)**
   - Component tests using React Testing Library
   - Hook tests
   - Target: 70%+ code coverage

3. **E2E Tests (Playwright)**
   - Critical user flows
   - Cross-browser testing
   - Mobile testing

4. **CI/CD Pipeline (GitHub Actions)**
   - Automated testing on every push/PR
   - Code quality checks
   - Security scanning

## Backend Testing

### Setup

```bash
# Install dependencies
poetry install

# Activate virtual environment
poetry shell
```

### Running Tests

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=src --cov-report=html

# Run only unit tests
poetry run pytest -m unit

# Run only integration tests
poetry run pytest -m integration

# Run specific test file
poetry run pytest tests/test_utils_security.py

# Run with verbose output
poetry run pytest -v

# Run in parallel (faster)
poetry run pytest -n auto
```

### Test Structure

```
tests/
├── conftest.py              # Shared fixtures
├── test_utils_security.py   # Security utilities tests
├── test_services_auth.py    # Authentication service tests
├── test_api_auth.py         # Auth API integration tests
├── test_api_attendance.py   # Attendance API tests
├── test_api_assignments.py  # Assignment API tests
└── test_api_subscriptions.py # Subscription API tests
```

### Writing Tests

```python
import pytest
from fastapi.testclient import TestClient

@pytest.mark.unit
def test_password_hashing():
    """Test password hashing utility."""
    from src.utils.security import get_password_hash, verify_password
    
    password = "test123"
    hashed = get_password_hash(password)
    
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)

@pytest.mark.integration
def test_login_api(client: TestClient, admin_user):
    """Test login API endpoint."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": admin_user.email,
            "password": "password123",
        }
    )
    
    assert response.status_code == 200
    assert "access_token" in response.json()
```

## Frontend Testing

### Setup

```bash
cd frontend

# Install dependencies
npm install
```

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test -- --watch

# Run specific test file
npm run test LoginPage.test.tsx

# Run with UI
npm run test:ui
```

### Test Structure

```
frontend/
├── src/
│   ├── setupTests.ts           # Test setup and mocks
│   ├── LoginPage.test.tsx      # Login component tests
│   └── AssignmentForm.test.tsx # Assignment form tests
└── vitest.config.ts            # Vitest configuration
```

### Writing Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Add assertions
  });
});
```

## E2E Testing

### Setup

```bash
# Install Playwright
npx playwright install

# Install with system dependencies
npx playwright install --with-deps
```

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/login.e2e.spec.ts

# Run with UI mode
npx playwright test --ui

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run on mobile
npx playwright test --project="Mobile Chrome"

# Debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Test Structure

```
tests/
├── login.e2e.spec.ts        # Login flow E2E tests
├── attendance.e2e.spec.ts   # Attendance marking E2E tests
├── assignments.e2e.spec.ts  # Assignment creation E2E tests
└── payment.e2e.spec.ts      # Payment flow E2E tests
```

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

## CI/CD Pipeline

The CI/CD pipeline automatically runs on every push and pull request.

### Pipeline Stages

1. **Linting**
   - Backend: Ruff, Black, MyPy
   - Frontend: ESLint, Prettier, TypeScript

2. **Unit Tests**
   - Backend: Pytest with coverage
   - Frontend: Vitest with coverage

3. **Integration Tests**
   - API endpoint tests
   - Database integration tests

4. **E2E Tests**
   - Critical user flows
   - Cross-browser testing

5. **Build**
   - Frontend build
   - Docker image build

6. **Security Scan**
   - Trivy vulnerability scanner
   - Snyk security scan

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: poetry run pytest --cov=src
```

## Coverage Requirements

### Backend Coverage

- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 70%+
- **Statements**: 70%+

Check coverage:
```bash
poetry run pytest --cov=src --cov-report=term-missing
poetry run coverage report --fail-under=70
```

### Frontend Coverage

- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 70%+
- **Statements**: 70%+

Check coverage:
```bash
npm run test:coverage
```

## Running Tests

### Quick Start

```bash
# Backend
poetry run pytest -v

# Frontend
cd frontend && npm run test

# E2E
npx playwright test

# All tests (requires setup)
./scripts/run-all-tests.sh
```

### Pre-commit Testing

```bash
# Run before committing
poetry run pytest -m unit
cd frontend && npm run test
npm run lint
poetry run ruff check src/
```

### Continuous Watching

```bash
# Backend (requires pytest-watch)
poetry run ptw

# Frontend
npm run test -- --watch
```

## Test Data and Fixtures

### Backend Fixtures

Available in `tests/conftest.py`:

- `db_session`: Clean database session
- `client`: FastAPI test client
- `institution`: Test institution
- `admin_user`: Admin user
- `teacher_user`: Teacher user
- `student_user`: Student user
- `auth_headers`: Authentication headers

### Frontend Mocks

MSW (Mock Service Worker) is configured in `setupTests.ts` for API mocking.

## Best Practices

1. **Write tests first (TDD)** when implementing new features
2. **Keep tests isolated** - each test should be independent
3. **Use descriptive test names** - explain what is being tested
4. **Mock external dependencies** - APIs, databases, third-party services
5. **Test edge cases** - not just the happy path
6. **Maintain high coverage** - aim for 70%+ on all metrics
7. **Run tests before committing** - catch issues early
8. **Review test failures carefully** - understand why tests fail

## Troubleshooting

### Common Issues

**Backend:**
```bash
# Database connection issues
# Ensure test database is running or use SQLite for tests

# Import errors
# Check PYTHONPATH and ensure poetry shell is activated

# Fixture not found
# Check conftest.py is in the correct location
```

**Frontend:**
```bash
# Module not found
npm install

# Test timeouts
# Increase timeout in vitest.config.ts

# Mock not working
# Check MSW handlers in setupTests.ts
```

**E2E:**
```bash
# Browser not found
npx playwright install

# Server not starting
# Check ports 5173 (frontend) and 8000 (backend) are available

# Element not found
# Use better selectors or add test IDs
```

## Contributing

When adding new features:

1. Write unit tests for new functions/methods
2. Write integration tests for new API endpoints
3. Write component tests for new UI components
4. Add E2E tests for new critical user flows
5. Ensure all tests pass before submitting PR
6. Maintain or improve code coverage

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
