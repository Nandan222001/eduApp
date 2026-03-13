# Test Suite Documentation

## Overview

This comprehensive test suite provides extensive coverage for the backend application, including unit tests, integration tests, and performance benchmarks.

## Test Structure

```
tests/
├── conftest.py                          # Shared fixtures and test configuration
├── factories.py                         # Factory Boy factories for test data
├── test_mocks.py                        # Mock implementations for external services
├── test_services_auth.py               # Unit tests for AuthService (70%+ coverage)
├── test_subscription_service.py        # Unit tests for SubscriptionService (70%+ coverage)
├── test_services_ml.py                 # Unit tests for MLService (70%+ coverage)
├── test_api_auth_integration.py        # Integration tests for Auth API
├── test_api_subscriptions_integration.py # Integration tests for Subscriptions API
├── test_api_ml_integration.py          # Integration tests for ML API
├── test_external_services_integration.py # Integration tests with mocked external services
├── test_performance_benchmarks.py      # Performance benchmark tests
└── README.md                           # This file
```

## Test Categories

### Unit Tests (`@pytest.mark.unit`)

Unit tests focus on testing individual service methods in isolation:

- **test_services_auth.py**: 20+ tests covering authentication, login, logout, password reset, and token management
- **test_subscription_service.py**: 40+ tests covering subscription lifecycle, billing, invoicing, and payments
- **test_services_ml.py**: 15+ tests covering ML data pipeline, feature engineering, and predictions

### Integration Tests (`@pytest.mark.integration`)

Integration tests verify API endpoints and service interactions:

- **test_api_auth_integration.py**: Full authentication flow testing
- **test_api_subscriptions_integration.py**: Subscription management API testing
- **test_api_ml_integration.py**: ML prediction API testing
- **test_external_services_integration.py**: External service integration with mocks

### Performance Benchmarks (`@pytest.mark.benchmark`)

Performance tests measure execution time and throughput:

- **test_performance_benchmarks.py**: Benchmarks for critical operations including:
  - Authentication operations
  - Database queries
  - API endpoint response times
  - Concurrent operations

## Running Tests

### Run All Tests
```bash
poetry run pytest
```

### Run Unit Tests Only
```bash
poetry run pytest -m unit
```

### Run Integration Tests Only
```bash
poetry run pytest -m integration
```

### Run Performance Benchmarks
```bash
poetry run pytest -m benchmark
```

### Run with Coverage Report
```bash
poetry run pytest --cov=src --cov-report=html --cov-report=term
```

### Run Specific Test File
```bash
poetry run pytest tests/test_services_auth.py
```

### Run Specific Test
```bash
poetry run pytest tests/test_services_auth.py::TestAuthService::test_login_success
```

### Run in Parallel
```bash
poetry run pytest -n auto
```

## Test Database

Tests use an in-memory SQLite database for speed and isolation. Each test gets a fresh database session that is rolled back after the test completes.

## Fixtures

### Common Fixtures (from conftest.py)

- `db_session`: Fresh database session for each test
- `client`: FastAPI test client
- `institution`: Test institution
- `admin_user`, `teacher_user`, `student_user`: Test users with different roles
- `admin_role`, `teacher_role`, `student_role`: Test roles
- `subscription`: Test subscription
- `auth_headers`: Authentication headers for API requests
- `mock_redis`, `mock_session_manager`: Mocked Redis and session manager
- `mock_sendgrid`, `mock_s3`, `mock_razorpay`: Mocked external services

## Factories

Test data factories are provided in `factories.py`:

```python
from tests.factories import (
    create_test_institution,
    create_test_user,
    create_test_student,
    create_test_subscription,
    create_bulk_students,
    create_bulk_users
)

# Create test institution
institution = create_test_institution(db_session, name="Test School")

# Create multiple students
students = create_bulk_students(db_session, institution.id, section.id, academic_year.id, count=50)
```

## Mocked External Services

The test suite includes comprehensive mocks for external services:

### SendGrid (Email)
```python
from tests.test_mocks import MockSendGridClient

mock_sg = MockSendGridClient()
# Use mock_sg for testing email functionality
assert len(mock_sg.sent_emails) == 1
```

### Razorpay (Payments)
```python
from tests.test_mocks import MockRazorpayClient

mock_rp = MockRazorpayClient()
order = mock_rp.order.create({'amount': 99900, 'currency': 'INR'})
```

### AWS S3 (Storage)
```python
from tests.test_mocks import MockS3Client

mock_s3 = MockS3Client()
mock_s3.create_bucket(Bucket='test-bucket')
mock_s3.upload_fileobj(file_content, 'test-bucket', 'file.txt')
```

### Redis (Cache)
```python
from tests.test_mocks import MockRedisClient

mock_redis = MockRedisClient()
await mock_redis.set('key', 'value')
value = await mock_redis.get('key')
```

## Coverage Goals

The test suite aims for:
- **70%+ overall code coverage**
- **80%+ coverage for critical services** (auth, subscription, ML)
- **60%+ coverage for API endpoints**

## Coverage Reports

After running tests with coverage:

- **Terminal**: Immediate coverage summary
- **HTML Report**: Open `htmlcov/index.html` in browser for detailed report
- **XML Report**: `coverage.xml` for CI/CD integration

## Performance Benchmarking

Benchmark tests measure performance of critical operations:

```bash
poetry run pytest -m benchmark --benchmark-only
```

Results include:
- Min/Max/Mean execution time
- Standard deviation
- Rounds and iterations
- Comparison between runs

## Continuous Integration

The test suite is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    poetry install
    poetry run pytest --cov=src --cov-report=xml
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage.xml
```

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Fast Execution**: Use in-memory database and mocks for speed
3. **Clear Naming**: Test names clearly describe what they test
4. **Arrange-Act-Assert**: Follow AAA pattern in tests
5. **Mock External Services**: Never call real external APIs in tests
6. **Use Factories**: Create test data with factories for consistency

## Troubleshooting

### Tests Failing Due to Missing Dependencies
```bash
poetry install --with dev
```

### Database Lock Issues
Tests use in-memory SQLite, so locks shouldn't occur. If they do, ensure tests aren't running in parallel unintentionally.

### Mock Not Working
Ensure you're patching the correct import path where the service is used, not where it's defined.

## Adding New Tests

1. Create test file following naming convention: `test_*.py`
2. Add appropriate pytest markers: `@pytest.mark.unit`, `@pytest.mark.integration`, etc.
3. Use existing fixtures from `conftest.py`
4. Create new fixtures in `conftest.py` if needed
5. Use factories from `factories.py` for test data
6. Mock external services using mocks from `test_mocks.py`
7. Run tests and verify coverage

## Example Test

```python
import pytest
from sqlalchemy.orm import Session
from src.services.auth_service import AuthService

@pytest.mark.unit
class TestAuthService:
    """Unit tests for AuthService"""
    
    @pytest.mark.asyncio
    async def test_login_success(
        self, db_session: Session, admin_user, mock_session_manager
    ):
        """Test successful user login"""
        # Arrange
        auth_service = AuthService(db_session, mock_session_manager)
        
        # Act
        result = await auth_service.login(
            email=admin_user.email,
            password="password123"
        )
        
        # Assert
        assert "access_token" in result
        assert "refresh_token" in result
        assert result["token_type"] == "bearer"
```

## Contact

For questions or issues with the test suite, please refer to the main project documentation or create an issue in the repository.
