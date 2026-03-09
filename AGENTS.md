# Agent Development Guide

## Setup Commands
```bash
# Install Poetry (if not installed)
pip install poetry

# Install dependencies
poetry install

# Activate virtual environment
poetry shell

# Copy environment variables
cp .env.example .env
```

## Development Commands
```bash
# Start services with Docker Compose
docker-compose up -d

# Run database migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Start development server
uvicorn src.main:app --reload

# Run tests
poetry run pytest

# Run linter
poetry run ruff check src/

# Format code
poetry run black src/

# Type checking
poetry run mypy src/
```

## Tech Stack
- Framework: FastAPI 0.109+
- Language: Python 3.11
- Database: PostgreSQL with SQLAlchemy 2.0
- Cache: Redis 5.0
- Migrations: Alembic
- Dependency Management: Poetry
- Containerization: Docker & Docker Compose

## Repository Structure
- `/src` - Source code
  - `/api` - API routes and endpoints
  - `/models` - SQLAlchemy database models
  - `/schemas` - Pydantic schemas for validation
  - `config.py` - Application configuration with pydantic-settings
  - `database.py` - Database connection and session
  - `redis_client.py` - Redis client configuration
  - `main.py` - FastAPI application entry point
- `/alembic` - Database migrations
- `/tests` - Test files
- `docker-compose.yml` - Docker services configuration
- `pyproject.toml` - Poetry dependencies

## Code Style
- Follow existing conventions in the codebase
- Use consistent indentation (4 spaces)
- Line length: 100 characters
- Type hints required
- Use Pydantic for validation
- Follow REST API conventions
