# FastAPI Application

[![CI Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO)
[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/release/python-3110/)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)

A production-ready FastAPI application with PostgreSQL, Redis, and Docker support.

## Features

- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL**: Reliable relational database with SQLAlchemy ORM
- **Redis**: In-memory data store for caching
- **Alembic**: Database migrations
- **Poetry**: Dependency management
- **Docker**: Containerized development environment
- **Pydantic Settings**: Environment variable management

## Prerequisites

- Python 3.11+
- Poetry
- Docker and Docker Compose

## Quick Start

### Using Docker Compose

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Start the services:
```bash
docker-compose up -d
```

3. Run database migrations:
```bash
docker-compose exec app alembic upgrade head
```

4. Access the application:
- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

### Local Development

1. Install dependencies:
```bash
poetry install
```

2. Activate virtual environment:
```bash
poetry shell
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your local settings
```

4. Start PostgreSQL and Redis:
```bash
docker-compose up -d db redis
```

5. Run migrations:
```bash
alembic upgrade head
```

6. Start the development server:
```bash
uvicorn src.main:app --reload
```

## Database Migrations

### Create a new migration
```bash
alembic revision --autogenerate -m "description of changes"
```

### Apply migrations
```bash
alembic upgrade head
```

### Rollback migration
```bash
alembic downgrade -1
```

### Migration Troubleshooting

If you encounter migration issues, conflicts, or errors, see the comprehensive troubleshooting guide:

📚 **[Migration Troubleshooting Guide](docs/MIGRATION_TROUBLESHOOTING.md)**

This guide covers:
- Common error messages and their solutions
- Step-by-step resolution procedures
- Emergency recovery procedures
- Safe migration practices
- Prevention strategies
- Lessons learned from past issues

### Migration Best Practices

For detailed guidance on migrations, see:
- [Migration Safety System](docs/MIGRATION_SAFETY_SYSTEM.md) - Complete safety system
- [Migration Rollback Playbook](docs/MIGRATION_ROLLBACK_PLAYBOOK.md) - Emergency procedures
- [Migration Naming Convention](docs/MIGRATION_NAMING_CONVENTION.md) - Naming standards
- [Migration Quick Reference](docs/MIGRATION_QUICK_REFERENCE.md) - Command reference

## Project Structure

```
.
├── alembic/                # Database migrations
│   ├── versions/           # Migration files
│   └── env.py             # Alembic configuration
├── src/
│   ├── api/               # API routes
│   │   └── v1/            # API version 1
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   ├── config.py          # Application configuration
│   ├── database.py        # Database connection
│   ├── redis_client.py    # Redis client
│   └── main.py            # Application entry point
├── docker-compose.yml     # Docker services
├── Dockerfile             # Application container
├── pyproject.toml         # Poetry dependencies
└── .env                   # Environment variables
```

## API Endpoints

### Health Check
- `GET /` - Welcome message
- `GET /health` - Health check endpoint

### Users (v1)
- `POST /api/v1/users/` - Create a new user
- `GET /api/v1/users/{user_id}` - Get user by ID

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: Application secret key
- `DEBUG`: Enable debug mode

## Development

### Code Quality & Testing

This project uses comprehensive CI/CD with automated testing, linting, and coverage reporting.

#### Running tests
```bash
# Run all tests with coverage
make test

# Run only unit tests
make test-unit

# Run only integration tests
make test-integration

# Run tests with detailed coverage report
make test-cov

# Run tests in parallel (faster)
make test-parallel

# Run tests for critical services
make test-critical
```

#### Coverage Reports

The project enforces a minimum **70% overall coverage** with higher thresholds for critical services:

| Service | Coverage Target |
|---------|----------------|
| auth_service.py | 80% |
| subscription_service.py | 75% |
| assignment_service.py | 75% |
| attendance_service.py | 75% |
| notification_service.py | 70% |
| security.py | 85% |
| rbac.py | 80% |

View coverage report:
```bash
make coverage-report
```

#### Code formatting
```bash
# Format code with Black
make format

# Check formatting without changes
make format-check
```

#### Linting
```bash
# Run Ruff linter
make lint

# Run linter with auto-fix
make lint-fix
```

#### Type checking
```bash
# Run MyPy type checker
make type-check
```

#### Run all quality checks
```bash
make quality
```

### Pre-commit Hooks

Install pre-commit hooks to automatically run checks before each commit:

```bash
make pre-commit
```

This will run:
- **Black** - Code formatting
- **Ruff** - Linting and import sorting
- **MyPy** - Type checking
- **pytest** - Quick test validation
- **Security checks** - Detect potential secrets

### Continuous Integration

The CI pipeline runs on every PR and includes:

1. **Code Quality Checks**
   - Black formatting validation
   - Ruff linting
   - MyPy type checking

2. **Test Suite**
   - Unit tests with coverage
   - Integration tests with coverage
   - Critical service coverage validation
   - Parallel test execution with pytest-xdist

3. **Security Scanning**
   - Dependency vulnerability scanning
   - Code security analysis with Bandit

4. **Build Verification**
   - Package build check
   - Docker image build

5. **Coverage Reporting**
   - Automatic upload to Codecov
   - Per-service coverage validation
   - HTML coverage reports as artifacts

## Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f app

# Execute commands in container
docker-compose exec app alembic upgrade head
```

## License

MIT
