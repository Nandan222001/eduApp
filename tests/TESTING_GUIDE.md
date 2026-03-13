# Comprehensive Testing Guide

## Quick Start

```bash
# Install dependencies
poetry install

# Run all tests with coverage
poetry run pytest --cov=src --cov-report=html

# Run specific test categories
poetry run pytest -m unit           # Unit tests only
poetry run pytest -m integration    # Integration tests only
poetry run pytest -m benchmark      # Performance benchmarks only

# Run tests in parallel
poetry run pytest -n auto

# Run with verbose output
poetry run pytest -vv
```

## Test Suite Components

### 1. Unit Tests (70%+ Coverage)

**AuthService Tests** (`test_services_auth.py`)
- ✅ User authentication
- ✅ Login/logout operations
- ✅ Token management (access & refresh)
- ✅ Password reset workflow
- ✅ Password change
- ✅ Session management
- ✅ Error handling (inactive users, wrong credentials)

**SubscriptionService Tests** (`test_subscription_service.py`)
- ✅ Subscription lifecycle (create, update, cancel, renew)
- ✅ Plan management (upgrade, downgrade)
- ✅ Billing calculations (proration, next billing date)
- ✅ Invoice generation and management
- ✅ Payment processing (Razorpay integration)
- ✅ Usage tracking and recording
- ✅ Grace period handling
- ✅ Trial period management

**MLService Tests** (`test_services_ml.py`)
- ✅ Feature extraction and engineering
- ✅ Training dataset preparation
- ✅ Student performance analysis
- ✅ At-risk student identification
- ✅ Subject difficulty analysis
- ✅ Batch processing
- ✅ Data quality validation

### 2. Integration Tests

**Auth API Integration** (`test_api_auth_integration.py`)
- ✅ Login endpoint
- ✅ Token refresh endpoint
- ✅ Logout endpoint
- ✅ Password reset flow
- ✅ Full authentication workflow

**Subscriptions API Integration** (`test_api_subscriptions_integration.py`)
- ✅ List subscription plans
- ✅ Create subscription
- ✅ Get subscription details
- ✅ Update subscription
- ✅ Cancel subscription
- ✅ Invoice management
- ✅ Payment processing

**ML API Integration** (`test_api_ml_integration.py`)
- ✅ Performance summary endpoint
- ✅ Batch performance endpoint
- ✅ At-risk students endpoint
- ✅ Subject difficulty endpoint
- ✅ Training data preparation
- ✅ Feature extraction

**External Services Integration** (`test_external_services_integration.py`)
- ✅ SendGrid email integration (mocked)
- ✅ Razorpay payment integration (mocked)
- ✅ AWS S3 storage integration (mocked)
- ✅ Redis caching integration (mocked)
- ✅ Combined service workflows

### 3. Performance Benchmarks

**Service Benchmarks** (`test_performance_benchmarks.py`)
- ✅ Authentication operations
- ✅ Subscription operations
- ✅ Database queries
- ✅ API endpoint response times
- ✅ Concurrent operations
- ✅ Batch operations

## Coverage Reports

### Generating Reports

```bash
# Terminal report
poetry run pytest --cov=src --cov-report=term-missing

# HTML report (recommended)
poetry run pytest --cov=src --cov-report=html
# Open htmlcov/index.html in browser

# XML report (for CI/CD)
poetry run pytest --cov=src --cov-report=xml

# All formats
poetry run pytest --cov=src --cov-report=html --cov-report=xml --cov-report=term
```

### Coverage Targets

| Component | Target | Status |
|-----------|--------|--------|
| AuthService | 80% | ✅ Achieved |
| SubscriptionService | 80% | ✅ Achieved |
| MLService | 70% | ✅ Achieved |
| API Endpoints | 60% | ✅ Achieved |
| Overall | 70% | ✅ Achieved |

## Test Database Configuration

Tests use an in-memory SQLite database for:
- Fast execution
- Isolation between tests
- No cleanup required
- No external dependencies

Configuration in `conftest.py`:
```python
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
```

## Fixtures and Factories

### Common Fixtures

```python
# Database and client
db_session       # Fresh database session
client          # FastAPI test client

# Core entities
institution     # Test institution
admin_role      # Admin role
teacher_role    # Teacher role
student_role    # Student role

# Users
admin_user      # Admin user
teacher_user    # Teacher user
student_user    # Student user

# Academic
academic_year   # Academic year
grade          # Grade/class
section        # Section
subject        # Subject

# Domain objects
teacher        # Teacher profile
student        # Student profile
subscription   # Subscription

# Authentication
auth_headers   # JWT auth headers

# Mocks
mock_redis              # Mocked Redis
mock_session_manager    # Mocked SessionManager
mock_sendgrid          # Mocked SendGrid
mock_s3               # Mocked S3
mock_razorpay         # Mocked Razorpay
```

### Factory Usage

```python
from tests.factories import (
    create_test_user,
    create_test_student,
    create_test_subscription,
    create_bulk_students,
    create_bulk_users
)

# Create single entities
user = create_test_user(db_session, institution.id, role.id)
subscription = create_test_subscription(db_session, institution.id)

# Create multiple entities
students = create_bulk_students(db_session, institution.id, section.id, year.id, count=50)
users = create_bulk_users(db_session, institution.id, role.id, count=100)
```

## Mocking External Services

### SendGrid (Email)

```python
from tests.test_mocks import MockSendGridClient

def test_send_email(mock_sendgrid_client):
    # Send email
    mock_sendgrid_client.send(message)
    
    # Verify
    assert len(mock_sendgrid_client.sent_emails) == 1
    assert mock_sendgrid_client.sent_emails[0]['to'] == 'user@example.com'
```

### Razorpay (Payments)

```python
from tests.test_mocks import MockRazorpayClient

def test_create_payment(mock_razorpay_client):
    # Create order
    order = mock_razorpay_client.order.create({
        'amount': 99900,
        'currency': 'INR'
    })
    
    # Verify
    assert order['status'] == 'created'
    assert order['amount'] == 99900
```

### AWS S3 (Storage)

```python
from tests.test_mocks import MockS3Client

def test_upload_file(mock_s3_client):
    # Create bucket
    mock_s3_client.create_bucket(Bucket='test-bucket')
    
    # Upload file
    mock_s3_client.upload_fileobj(file_content, 'test-bucket', 'file.txt')
    
    # Verify
    assert len(mock_s3_client.uploaded_files) == 1
```

### Redis (Cache)

```python
from tests.test_mocks import MockRedisClient

async def test_cache_operations(mock_redis_client):
    # Set value
    await mock_redis_client.set('key', 'value', ex=3600)
    
    # Get value
    value = await mock_redis_client.get('key')
    assert value == 'value'
    
    # Check TTL
    ttl = await mock_redis_client.ttl('key')
    assert ttl == 3600
```

## Running Benchmarks

### Basic Benchmarks

```bash
# Run all benchmarks
poetry run pytest -m benchmark

# Run only benchmarks (skip other tests)
poetry run pytest -m benchmark --benchmark-only

# Save benchmark results
poetry run pytest -m benchmark --benchmark-save=baseline

# Compare with baseline
poetry run pytest -m benchmark --benchmark-compare=baseline
```

### Benchmark Output

```
Name (time in ms)                Min     Max     Mean   StdDev
test_benchmark_login           5.234   7.891   6.123   0.456
test_benchmark_list_subscr     2.345   3.456   2.789   0.234
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install poetry
        poetry install
    
    - name: Run tests
      run: |
        poetry run pytest --cov=src --cov-report=xml --cov-report=term
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
```

### GitLab CI Example

```yaml
test:
  image: python:3.11
  
  before_script:
    - pip install poetry
    - poetry install
  
  script:
    - poetry run pytest --cov=src --cov-report=xml --cov-report=term
  
  coverage: '/TOTAL.*\s+(\d+%)$/'
  
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```

## Debugging Failed Tests

### Verbose Output

```bash
# Show detailed output
poetry run pytest -vv

# Show print statements
poetry run pytest -s

# Stop at first failure
poetry run pytest -x

# Show locals in traceback
poetry run pytest -l
```

### Running Single Test

```bash
# Run specific test file
poetry run pytest tests/test_services_auth.py

# Run specific test class
poetry run pytest tests/test_services_auth.py::TestAuthService

# Run specific test method
poetry run pytest tests/test_services_auth.py::TestAuthService::test_login_success
```

### Debug Mode

```python
import pytest

def test_something(db_session):
    # Set breakpoint
    import pdb; pdb.set_trace()
    
    # Or use pytest's built-in debugging
    pytest.set_trace()
    
    # Test code here
```

## Best Practices

### 1. Test Isolation
✅ Each test is independent
✅ Fresh database session per test
✅ No shared state between tests

### 2. Naming Conventions
✅ Test files: `test_*.py`
✅ Test classes: `Test*`
✅ Test functions: `test_*`
✅ Descriptive names: `test_login_with_wrong_password`

### 3. Test Structure (AAA Pattern)
```python
def test_example():
    # Arrange - Set up test data
    user = create_test_user(...)
    
    # Act - Execute the operation
    result = service.some_method(user)
    
    # Assert - Verify the result
    assert result.success is True
```

### 4. Async Tests
```python
@pytest.mark.asyncio
async def test_async_operation():
    result = await async_service.method()
    assert result is not None
```

### 5. Parametrized Tests
```python
@pytest.mark.parametrize("input,expected", [
    ("test@email.com", True),
    ("invalid-email", False),
])
def test_email_validation(input, expected):
    result = validate_email(input)
    assert result == expected
```

## Common Issues and Solutions

### Issue: Tests hang indefinitely
**Solution**: Check for blocking I/O operations. Use mocks for external calls.

### Issue: Database locked
**Solution**: Ensure you're using in-memory SQLite with `check_same_thread=False`.

### Issue: Fixtures not found
**Solution**: Make sure fixtures are in `conftest.py` or imported properly.

### Issue: Import errors
**Solution**: Run `poetry install` to ensure all dependencies are installed.

### Issue: Coverage not accurate
**Solution**: Use `--cov-branch` flag for branch coverage.

## Test Maintenance

### Adding New Tests

1. Identify the component to test
2. Choose test category (unit/integration/benchmark)
3. Create test file following naming conventions
4. Add appropriate pytest markers
5. Use existing fixtures and factories
6. Mock external dependencies
7. Run tests and verify coverage

### Updating Tests

1. Update tests when changing implementation
2. Keep test coverage above targets
3. Refactor tests along with code
4. Update mocks when external APIs change

## Performance Tips

### Speed Up Tests

```bash
# Run in parallel
poetry run pytest -n auto

# Skip slow tests
poetry run pytest -m "not slow"

# Use faster test database
# (already using in-memory SQLite)

# Cache test data
# (use fixtures with scope="session")
```

### Optimize Test Data

```python
# Use session-scoped fixtures for expensive setup
@pytest.fixture(scope="session")
def expensive_setup():
    # Heavy setup only once
    return setup_data

# Use module-scoped for shared test data
@pytest.fixture(scope="module")
def shared_data():
    return data
```

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [pytest-cov Documentation](https://pytest-cov.readthedocs.io/)
- [pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)
- [pytest-benchmark Documentation](https://pytest-benchmark.readthedocs.io/)
- [Factory Boy Documentation](https://factoryboy.readthedocs.io/)

## Support

For issues or questions:
1. Check this guide first
2. Review test examples in the suite
3. Check pytest documentation
4. Create an issue in the repository
