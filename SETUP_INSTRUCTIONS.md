# CI/CD Setup Instructions

## Quick Setup (5 minutes)

### Prerequisites
- Python 3.11+
- Poetry (will be installed if missing)
- Docker & Docker Compose (optional, for PostgreSQL & Redis)
- Git

### Automated Setup

**Linux/Mac:**
```bash
bash scripts/setup_testing.sh
```

**Windows:**
```powershell
.\scripts\setup_testing.ps1
```

This script will:
1. Verify Python 3.11+
2. Install Poetry (if needed)
3. Install all dependencies
4. Set up pre-commit hooks
5. Create `.env` file
6. Start PostgreSQL & Redis (if Docker available)
7. Run database migrations
8. Execute smoke tests

### Manual Setup

If you prefer manual setup:

```bash
# 1. Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# 2. Install dependencies
poetry install

# 3. Install pre-commit hooks
poetry run pre-commit install

# 4. Create .env file
cp .env.example .env

# 5. Start services (if using Docker)
docker-compose up -d postgres redis

# 6. Run migrations
poetry run alembic upgrade head

# 7. Verify setup
make test
```

## Verifying Installation

```bash
# Run tests
make test

# Check coverage
make test-cov

# View coverage report
make coverage-report

# Run quality checks
make quality
```

## First-Time Contributors

### Before You Code

1. **Install pre-commit hooks:**
   ```bash
   make pre-commit
   ```

2. **Read the guides:**
   - `docs/TESTING_GUIDE.md` - How to write and run tests
   - `docs/CI_CD_SETUP.md` - CI/CD pipeline details

### Development Workflow

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Write code and tests:**
   ```bash
   # Run tests frequently
   make test-unit
   
   # Check coverage
   make test-cov
   ```

3. **Run quality checks:**
   ```bash
   # Format code
   make format
   
   # Lint code
   make lint
   
   # Type check
   make type-check
   
   # Or run all at once
   make quality
   ```

4. **Commit your changes:**
   ```bash
   # Pre-commit hooks will run automatically
   git add .
   git commit -m "Add feature: description"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature
   ```

The CI pipeline will automatically run on your PR!

## CI/CD Configuration

### GitHub Actions

**Already configured!** The pipeline runs automatically on:
- Push to `main`, `develop`, `staging`
- Pull requests to these branches

**Optional: Add Codecov token**
1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Copy the token
4. Add as GitHub secret: `CODECOV_TOKEN`

### GitLab CI

**Already configured!** The pipeline runs automatically on:
- Push to any branch
- Merge requests

**Setup required:**
1. Configure GitLab Runner for your project
2. Add CI/CD variables (Settings → CI/CD → Variables):
   - `CI_REGISTRY_USER`: Your GitLab username
   - `CI_REGISTRY_PASSWORD`: Your GitLab token/password

## Common Commands

### Testing
```bash
make test              # Run all tests
make test-unit         # Unit tests only
make test-integration  # Integration tests only
make test-cov          # Detailed coverage
make test-parallel     # Fast parallel execution
make test-critical     # Critical services
```

### Code Quality
```bash
make format            # Format with Black
make lint              # Lint with Ruff
make lint-fix          # Auto-fix lint issues
make type-check        # Type check with MyPy
make quality           # All quality checks
```

### Coverage
```bash
make coverage          # Generate report
make coverage-report   # Open HTML report
make check-service-coverage  # Validate critical services
```

### Pre-commit
```bash
make pre-commit        # Install hooks
make pre-commit-run    # Run on all files
```

### CI Simulation
```bash
make ci                # Run all CI checks locally
```

### Cleanup
```bash
make clean             # Clean caches and artifacts
```

## Troubleshooting

### "Poetry not found"
```bash
curl -sSL https://install.python-poetry.org | python3 -
export PATH="$HOME/.local/bin:$PATH"
```

### "Tests fail with database errors"
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait a moment, then run migrations
poetry run alembic upgrade head
```

### "Pre-commit hooks fail"
```bash
# Auto-fix most issues
make format
make lint-fix

# Then try committing again
```

### "Coverage below threshold"
```bash
# See what's not covered
make coverage-report

# Focus on critical services
make test-critical
```

### "Docker not available"
You can install PostgreSQL and Redis directly:
- PostgreSQL 15: https://www.postgresql.org/download/
- Redis 7: https://redis.io/download/

Update `.env` with your connection strings.

## What Gets Checked in CI

### Every PR runs:

1. **Code Quality** (2-3 minutes)
   - Black formatting
   - Ruff linting
   - MyPy type checking

2. **Tests** (5-10 minutes)
   - Unit tests with coverage
   - Integration tests with coverage
   - Critical service coverage validation
   - Overall 70% coverage threshold

3. **Security** (1-2 minutes)
   - Dependency vulnerability scanning
   - Code security analysis

4. **Build** (2-3 minutes)
   - Package build
   - Docker image build

**Total time: ~10-20 minutes** (parallelized)

### What Gets Cached

To speed up CI:
- Poetry dependencies
- Test results (for unchanged files)
- Docker layers
- pip packages

## Coverage Targets

### Overall: 70% minimum

### Critical Services (higher targets):
- `auth_service.py`: 80%
- `security.py`: 85%
- `rbac.py`: 80%
- `subscription_service.py`: 75%
- `assignment_service.py`: 75%
- `attendance_service.py`: 75%
- `notification_service.py`: 70%

These are **automatically checked** in CI!

## Pre-commit Hooks

Hooks run automatically before each commit:

1. ✓ Trailing whitespace removal
2. ✓ End-of-file fixing
3. ✓ YAML/JSON/TOML validation
4. ✓ Large file detection
5. ✓ Merge conflict detection
6. ✓ Private key detection
7. ✓ **Black** formatting
8. ✓ **Ruff** linting
9. ✓ **MyPy** type checking
10. ✓ **pytest** validation
11. ✓ **Secret** detection

## Resources

### Documentation
- `docs/TESTING_GUIDE.md` - Complete testing guide
- `docs/CI_CD_SETUP.md` - CI/CD setup details
- `CI_CD_IMPLEMENTATION.md` - Implementation summary

### External Resources
- [pytest Documentation](https://docs.pytest.org/)
- [Black Formatter](https://black.readthedocs.io/)
- [Ruff Linter](https://docs.astral.sh/ruff/)
- [MyPy Type Checker](https://mypy.readthedocs.io/)
- [pre-commit](https://pre-commit.com/)

## Getting Help

1. **Check logs:** Review CI logs for specific errors
2. **Run locally:** Reproduce CI failures with `make ci`
3. **Read docs:** Check `docs/TESTING_GUIDE.md`
4. **Ask team:** Reach out to maintainers

## Badges

Your README now includes these badges:
- ✓ CI Pipeline status
- ✓ Code coverage (Codecov)
- ✓ Python version
- ✓ Code style (Black)
- ✓ Linting (Ruff)

Update URLs in `README.md` with your repository details!

## Next Steps

1. ✅ Setup complete - You're ready to code!
2. 📝 Write tests for your code
3. 🔍 Monitor coverage in CI
4. 🚀 Create your first PR
5. 📈 Watch tests run automatically

## Summary

You now have:
- ✅ Automated testing with 70%+ coverage
- ✅ Pre-commit hooks for code quality
- ✅ CI/CD pipeline (GitHub Actions & GitLab CI)
- ✅ Test parallelization (faster tests)
- ✅ Test result caching
- ✅ Coverage reporting
- ✅ Security scanning
- ✅ Complete documentation

Happy coding! 🎉
