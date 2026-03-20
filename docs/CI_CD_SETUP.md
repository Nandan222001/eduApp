# CI/CD Setup Documentation

## Overview

This project uses a comprehensive CI/CD pipeline with automated testing, code quality checks, and coverage reporting. The pipeline is configured for both GitHub Actions and GitLab CI.

## Table of Contents

- [Prerequisites](#prerequisites)
- [GitHub Actions Setup](#github-actions-setup)
- [GitLab CI Setup](#gitlab-ci-setup)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Coverage Reporting](#coverage-reporting)
- [Test Parallelization](#test-parallelization)
- [Cache Strategy](#cache-strategy)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Dependencies

The following tools are required and configured in `pyproject.toml`:

- **Python 3.11**
- **Poetry** (dependency management)
- **pytest** (testing framework)
- **pytest-cov** (coverage reporting)
- **pytest-xdist** (parallel test execution)
- **black** (code formatting)
- **ruff** (linting)
- **mypy** (type checking)
- **pre-commit** (git hooks)

### Installation

```bash
# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Install pre-commit hooks
poetry run pre-commit install
```

## GitHub Actions Setup

### Workflows

The project includes the following GitHub Actions workflows:

#### 1. Main CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main`, `develop`, and `staging` branches.

**Jobs:**

1. **code-quality**: Runs Black, Ruff, and MyPy checks
2. **test**: Executes test suite with PostgreSQL 15 and Redis 7
3. **security-scan**: Runs security analysis with Safety and Bandit
4. **build**: Builds Python package and Docker image
5. **status-check**: Aggregates results from all jobs

**Services:**

- PostgreSQL 15 (Alpine)
- Redis 7 (Alpine)

#### 2. Test Cache Optimization (`.github/workflows/test-cache.yml`)

Reusable workflow that caches test results for unchanged files.

### Configuration Steps

1. **Enable GitHub Actions** in your repository settings

2. **Add Secrets** (Settings → Secrets and variables → Actions):
   - `CODECOV_TOKEN`: Token from codecov.io (optional but recommended)

3. **Configure Branch Protection**:
   - Go to Settings → Branches
   - Add rule for `main` branch
   - Require status checks:
     - `Code Quality Checks`
     - `Test Suite`
     - `Build Check`

### Coverage Badge

Add to your README.md (replace `YOUR_USERNAME/YOUR_REPO`):

```markdown
[![codecov](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO)
```

## GitLab CI Setup

### Configuration

The GitLab CI pipeline is defined in `.gitlab-ci.yml` with the following stages:

1. **quality**: Code quality checks (Black, Ruff, MyPy)
2. **test**: Test execution with coverage
3. **security**: Security scanning
4. **build**: Package and Docker image building
5. **deploy**: Deploy coverage reports to GitLab Pages

### Services

- PostgreSQL 15 (Alpine)
- Redis 7 (Alpine)

### Setup Steps

1. **Configure GitLab Runner** for your project

2. **Set CI/CD Variables** (Settings → CI/CD → Variables):
   - `CI_REGISTRY_USER`: GitLab registry username
   - `CI_REGISTRY_PASSWORD`: GitLab registry password/token

3. **Enable GitLab Pages** (Settings → Pages):
   - Coverage reports will be automatically published

### Coverage Visualization

GitLab CI automatically tracks coverage trends:
- Go to Project → Analytics → Repository → Coverage
- View coverage history and graphs

## Pre-commit Hooks

Pre-commit hooks run automatically before each commit.

### Installation

```bash
make pre-commit
# or
poetry run pre-commit install
```

### Hooks Configured

1. **trailing-whitespace**: Remove trailing whitespace
2. **end-of-file-fixer**: Ensure files end with newline
3. **check-yaml**: Validate YAML files
4. **check-json**: Validate JSON files
5. **check-toml**: Validate TOML files
6. **detect-private-key**: Detect accidentally committed keys
7. **black**: Format Python code
8. **ruff**: Lint and fix Python code
9. **mypy**: Type check Python code
10. **pytest-check**: Quick test validation
11. **security-check**: Check for secrets in code

### Manual Execution

```bash
# Run on all files
poetry run pre-commit run --all-files

# Run specific hook
poetry run pre-commit run black --all-files
```

### Skip Hooks

```bash
# Skip hooks for a single commit (use sparingly)
git commit --no-verify -m "message"
```

## Coverage Reporting

### Overall Coverage Target

**Minimum: 70%**

The CI pipeline will fail if overall coverage drops below 70%.

### Critical Service Coverage Targets

| Service | Target | Priority |
|---------|--------|----------|
| `src/services/auth_service.py` | 80% | Critical |
| `src/utils/security.py` | 85% | Critical |
| `src/utils/rbac.py` | 80% | Critical |
| `src/services/subscription_service.py` | 75% | High |
| `src/services/assignment_service.py` | 75% | High |
| `src/services/attendance_service.py` | 75% | High |
| `src/services/notification_service.py` | 70% | Medium |

### Running Coverage Locally

```bash
# Generate coverage report
make test-cov

# View HTML report
make coverage-report

# Check critical service coverage
make check-service-coverage
```

### Coverage Reports

Coverage reports are generated in multiple formats:

- **Terminal**: Real-time output during test execution
- **HTML**: Interactive report in `htmlcov/` directory
- **XML**: Machine-readable format for CI tools (`coverage.xml`)

### Coverage Configuration

Coverage settings are defined in:
- `pyproject.toml` - Main configuration
- `.coveragerc` - Alternative configuration file
- `pytest.ini` - Pytest-specific settings

## Test Parallelization

### pytest-xdist Configuration

Tests run in parallel using `pytest-xdist` with automatic worker detection:

```bash
# Automatic worker count (recommended)
pytest -n auto

# Specific number of workers
pytest -n 4

# Load balancing strategy
pytest -n auto --dist loadscope
```

### Benefits

- **Faster CI**: Reduces test execution time by 60-80%
- **Resource Utilization**: Uses all available CPU cores
- **Load Balancing**: Distributes tests evenly across workers

### Configuration

In `pyproject.toml`:

```toml
[tool.pytest.ini_options]
addopts = [
    "-n=auto",  # Auto-detect workers
    "--dist=loadscope",  # Balance by test scope
]
```

### Best Practices

1. **Isolate Tests**: Ensure tests don't share state
2. **Use Fixtures**: Properly scope fixtures (function, class, module)
3. **Avoid Race Conditions**: Use locks for shared resources
4. **Database Isolation**: Each test gets its own transaction

## Cache Strategy

### GitHub Actions Caching

The pipeline caches:

1. **Poetry Dependencies**
   - Key: `poetry-{os}-{python-version}-{lock-hash}`
   - Path: `~/.cache/pypoetry`, `.venv`

2. **Test Results**
   - Key: `pytest-{os}-{python-version}-{source-hash}`
   - Path: `.pytest_cache`, `.coverage`

3. **Docker Layers**
   - Type: GitHub Actions cache (GHA)
   - Speeds up Docker builds

### GitLab CI Caching

```yaml
cache:
  key:
    files:
      - poetry.lock
      - pyproject.toml
  paths:
    - .cache/pip
    - .cache/pypoetry
    - .venv
    - .pytest_cache
```

### Cache Invalidation

Caches are automatically invalidated when:
- Dependencies change (`poetry.lock` modified)
- Source code changes (for test results)
- Cache age exceeds 7 days

## Troubleshooting

### Common Issues

#### 1. Tests Fail Locally but Pass in CI

**Cause**: Environment differences

**Solution**:
```bash
# Use exact CI environment
docker-compose up -d postgres redis
export DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_db
export REDIS_URL=redis://localhost:6379/0
poetry run pytest
```

#### 2. Coverage Below Threshold

**Cause**: Insufficient test coverage

**Solution**:
```bash
# Identify uncovered lines
make test-cov

# View detailed report
make coverage-report

# Focus on critical services
make test-critical
```

#### 3. Pre-commit Hooks Fail

**Cause**: Code quality issues

**Solution**:
```bash
# Auto-fix formatting
make format

# Auto-fix linting
make lint-fix

# Run all checks
make quality
```

#### 4. MyPy Type Errors

**Cause**: Type hints missing or incorrect

**Solution**:
```bash
# Run type check
make type-check

# Add type hints to flagged code
# Use `# type: ignore` sparingly for external libs
```

#### 5. Slow Test Execution

**Cause**: Sequential test execution

**Solution**:
```bash
# Use parallel execution
make test-parallel

# Or specify workers
pytest -n 4

# Profile slow tests
pytest --durations=10
```

#### 6. Cache Issues

**Cause**: Stale cache data

**Solution**:
```bash
# Clear local caches
make clean

# In GitHub Actions: manually delete cache
# Settings → Actions → Caches → Delete

# In GitLab CI: clear runner cache
# CI/CD → Pipelines → Clear runner caches
```

### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Actions logs](https://github.com/YOUR_USERNAME/YOUR_REPO/actions)
2. Review the [GitLab CI logs](https://gitlab.com/YOUR_USERNAME/YOUR_REPO/-/pipelines)
3. Run tests locally with verbose output: `pytest -vv`
4. Check test isolation: `pytest --failed-first`

## Best Practices

### Writing Tests

1. **Use markers**: Categorize tests (`@pytest.mark.unit`, `@pytest.mark.integration`)
2. **Isolate database**: Use transactions and rollbacks
3. **Mock external services**: Use `pytest-mock` for third-party APIs
4. **Test critical paths**: Focus on auth, payments, data integrity

### Maintaining Coverage

1. **Write tests first**: Follow TDD where possible
2. **Cover edge cases**: Test error conditions
3. **Integration tests**: Test service interactions
4. **Regular review**: Monitor coverage trends

### CI/CD Optimization

1. **Cache dependencies**: Use Poetry's lock file
2. **Parallel execution**: Enable pytest-xdist
3. **Fail fast**: Use `--maxfail` to stop after N failures
4. **Selective testing**: Run changed tests first

## Additional Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-cov Documentation](https://pytest-cov.readthedocs.io/)
- [pytest-xdist Documentation](https://pytest-xdist.readthedocs.io/)
- [Black Documentation](https://black.readthedocs.io/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [MyPy Documentation](https://mypy.readthedocs.io/)
- [pre-commit Documentation](https://pre-commit.com/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [GitLab CI Documentation](https://docs.gitlab.com/ee/ci/)
