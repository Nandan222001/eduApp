# Testing Guide

## Quick Start

### Setup Testing Environment

```bash
# Install dependencies
make install

# Install pre-commit hooks
make pre-commit

# Run all tests
make test
```

## Running Tests

### Basic Commands

```bash
# Run all tests with coverage
make test

# Run only unit tests
make test-unit

# Run only integration tests
make test-integration

# Run with detailed coverage report
make test-cov

# Run tests in parallel (faster)
make test-parallel
```

### Advanced Test Execution

```bash
# Run specific test file
pytest tests/unit/test_auth_service.py

# Run specific test function
pytest tests/unit/test_auth_service.py::test_login

# Run specific test class
pytest tests/unit/test_auth_service.py::TestAuthService

# Run tests with specific marker
pytest -m unit
pytest -m integration
pytest -m "unit and not slow"

# Run tests matching pattern
pytest -k "auth"
pytest -k "test_login or test_logout"

# Run with verbose output
pytest -vv

# Run with print statements visible
pytest -s

# Stop after first failure
pytest -x

# Stop after N failures
pytest --maxfail=3

# Run last failed tests
pytest --lf

# Run failed tests first, then others
pytest --ff

# Show slowest tests
pytest --durations=10
```

## Test Markers

Tests are categorized using pytest markers:

```python
@pytest.mark.unit
def test_something():
    """Unit test - fast, no external dependencies"""
    pass

@pytest.mark.integration
def test_with_database():
    """Integration test - requires database/redis"""
    pass

@pytest.mark.slow
def test_long_running():
    """Slow test - takes significant time"""
    pass

@pytest.mark.e2e
def test_full_workflow():
    """End-to-end test - full system test"""
    pass

@pytest.mark.critical
def test_payment_flow():
    """Critical path test - must always pass"""
    pass
```

### Running by Marker

```bash
# Run only unit tests
pytest -m unit

# Run unit and integration tests
pytest -m "unit or integration"

# Run everything except slow tests
pytest -m "not slow"

# Run critical tests only
pytest -m critical
```

## Code Coverage

### Viewing Coverage

```bash
# Generate and view coverage report
make coverage-report

# Generate coverage only
make coverage

# Check critical service coverage
make check-service-coverage
```

### Coverage Reports

Three types of coverage reports are generated:

1. **Terminal Output**: Real-time during test execution
   ```bash
   ---------- coverage: platform linux, python 3.11.0 -----------
   Name                              Stmts   Miss  Cover
   -----------------------------------------------------
   src/services/auth_service.py         45      3    93%
   src/utils/security.py                30      1    97%
   -----------------------------------------------------
   TOTAL                               450     23    95%
   ```

2. **HTML Report**: Interactive browsable report
   - Location: `htmlcov/index.html`
   - Open with: `make coverage-report`
   - Shows line-by-line coverage

3. **XML Report**: For CI/CD integration
   - Location: `coverage.xml`
   - Used by Codecov, GitLab, etc.

### Coverage Configuration

Coverage settings in `pyproject.toml`:

```toml
[tool.coverage.run]
source = ["src"]
omit = [
    "*/tests/*",
    "*/__init__.py",
    "*/config.py",
]
branch = true

[tool.coverage.report]
precision = 2
fail_under = 70
```

### Critical Service Coverage Targets

| Service | Target | Current |
|---------|--------|---------|
| auth_service.py | 80% | Check report |
| subscription_service.py | 75% | Check report |
| assignment_service.py | 75% | Check report |
| attendance_service.py | 75% | Check report |
| notification_service.py | 70% | Check report |
| security.py | 85% | Check report |
| rbac.py | 80% | Check report |

## Writing Tests

### Test Structure

```python
# tests/unit/test_example_service.py
import pytest
from src.services.example_service import ExampleService


class TestExampleService:
    """Test suite for ExampleService."""
    
    def test_basic_functionality(self):
        """Test basic functionality."""
        service = ExampleService()
        result = service.do_something()
        assert result == expected_value
    
    def test_with_fixture(self, db_session):
        """Test using fixture."""
        service = ExampleService(db_session)
        result = service.query_database()
        assert result is not None
    
    @pytest.mark.parametrize("input,expected", [
        ("input1", "output1"),
        ("input2", "output2"),
    ])
    def test_with_parameters(self, input, expected):
        """Test with multiple parameter sets."""
        service = ExampleService()
        result = service.process(input)
        assert result == expected
```

### Test Organization

```
tests/
├── unit/                  # Unit tests
│   ├── test_auth_service.py
│   ├── test_assignment_service.py
│   └── ...
├── integration/           # Integration tests
│   ├── test_auth_api.py
│   ├── test_students_api.py
│   └── ...
├── e2e/                   # End-to-end tests
│   └── test_full_flow.py
├── conftest.py            # Shared fixtures
└── factories.py           # Test data factories
```

### Using Fixtures

Common fixtures available:

```python
def test_with_database(db_session):
    """Use database session."""
    pass

def test_with_client(client):
    """Use test client."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200

def test_with_user(admin_user):
    """Use pre-created user."""
    assert admin_user.email == "admin@testschool.com"

def test_with_auth(client, auth_headers):
    """Use authenticated requests."""
    response = client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
```

### Mocking External Services

```python
from unittest.mock import Mock, patch, AsyncMock


def test_with_mock():
    """Test with mocked dependency."""
    mock_service = Mock()
    mock_service.get_data.return_value = {"key": "value"}
    
    result = process_data(mock_service)
    assert result is not None
    mock_service.get_data.assert_called_once()


@patch('src.services.external_service.ExternalAPI')
def test_with_patch(mock_api):
    """Test with patched external API."""
    mock_api.return_value.fetch.return_value = "data"
    
    result = service_function()
    assert result == "processed_data"


@pytest.mark.asyncio
async def test_async_function():
    """Test async function."""
    mock_redis = AsyncMock()
    mock_redis.get.return_value = "cached_value"
    
    result = await async_service_function(mock_redis)
    assert result is not None
```

### Testing Exceptions

```python
import pytest


def test_raises_exception():
    """Test that exception is raised."""
    with pytest.raises(ValueError):
        service.invalid_operation()


def test_exception_message():
    """Test exception message."""
    with pytest.raises(ValueError, match="Invalid input"):
        service.validate("bad_input")


def test_exception_with_cause():
    """Test exception with specific cause."""
    with pytest.raises(DatabaseError) as exc_info:
        service.failing_operation()
    
    assert "connection timeout" in str(exc_info.value)
```

## Parallel Test Execution

Tests run in parallel using `pytest-xdist`:

```bash
# Auto-detect number of CPUs
pytest -n auto

# Specify number of workers
pytest -n 4

# Load balancing by scope
pytest -n auto --dist loadscope

# Load balancing by file
pytest -n auto --dist loadfile
```

### Parallel Test Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Use Transactions**: Database tests should rollback
3. **Avoid Shared State**: Don't rely on test execution order
4. **Unique Test Data**: Use factories for unique data

```python
# Good: Isolated test
def test_create_user(db_session):
    user = User(email="unique@test.com")
    db_session.add(user)
    db_session.commit()
    assert user.id is not None


# Bad: Shared state
user_counter = 0

def test_increment():
    global user_counter
    user_counter += 1  # Fails in parallel
```

## Test Performance

### Profiling Tests

```bash
# Show 10 slowest tests
pytest --durations=10

# Show all test durations
pytest --durations=0

# Profile with cProfile
pytest --profile
```

### Optimizing Slow Tests

1. **Use Fixtures**: Reuse setup across tests
2. **Mock External Calls**: Don't make real API calls
3. **Minimize Database Queries**: Use bulk operations
4. **Mark as Slow**: Skip in fast runs

```python
@pytest.mark.slow
def test_heavy_computation():
    """This test takes a long time."""
    pass
```

## Continuous Integration

### Pre-commit Hooks

Before each commit, the following run automatically:

1. Black formatting
2. Ruff linting
3. MyPy type checking
4. Test validation
5. Security checks

```bash
# Install hooks
make pre-commit

# Run manually
poetry run pre-commit run --all-files

# Skip hooks (not recommended)
git commit --no-verify
```

### CI Pipeline

On every pull request:

1. **Code Quality**
   - Black formatting check
   - Ruff linting
   - MyPy type checking

2. **Tests**
   - Unit tests with coverage
   - Integration tests with coverage
   - Critical service coverage validation

3. **Coverage**
   - Overall 70% minimum
   - Critical services meet targets
   - Upload to Codecov

4. **Security**
   - Dependency scanning
   - Code security analysis

## Troubleshooting

### Common Issues

#### Tests Pass Locally but Fail in CI

**Cause**: Environment differences

**Solution**:
```bash
# Use Docker to match CI environment
docker-compose up -d postgres redis
export DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_db
export REDIS_URL=redis://localhost:6379/0
pytest
```

#### Flaky Tests

**Cause**: Race conditions, timing issues

**Solution**:
```python
# Add retries for flaky tests
@pytest.mark.flaky(reruns=3)
def test_sometimes_fails():
    pass

# Use proper waits
import time
time.sleep(0.1)  # Bad
await asyncio.sleep(0.1)  # Better

# Use fixtures for setup
@pytest.fixture
def setup_data():
    # Ensure data is ready
    pass
```

#### Database Locks

**Cause**: Tests not properly isolated

**Solution**:
```python
# Use function-scoped fixtures
@pytest.fixture(scope="function")
def db_session():
    session = TestingSessionLocal()
    yield session
    session.rollback()
    session.close()
```

#### Import Errors

**Cause**: Python path issues

**Solution**:
```bash
# Install in editable mode
poetry install

# Or set PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

## Best Practices

### Do's ✓

- Write tests before or with code (TDD)
- Keep tests simple and focused
- Use descriptive test names
- Test edge cases and error conditions
- Use factories for test data
- Mock external dependencies
- Run tests before committing
- Maintain high coverage for critical paths

### Don'ts ✗

- Don't commit without running tests
- Don't skip failing tests
- Don't rely on test execution order
- Don't use sleeps (use proper waits)
- Don't test framework code
- Don't share state between tests
- Don't ignore coverage warnings
- Don't commit commented-out tests

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-cov Documentation](https://pytest-cov.readthedocs.io/)
- [pytest-xdist Documentation](https://pytest-xdist.readthedocs.io/)
- [Factory Boy Documentation](https://factoryboy.readthedocs.io/)
- [Testing Best Practices](https://docs.python-guide.org/writing/tests/)
