# FastAPI Application

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

### Running tests
```bash
poetry run pytest
```

### Code formatting
```bash
poetry run black src/
```

### Linting
```bash
poetry run ruff check src/
```

### Type checking
```bash
poetry run mypy src/
```

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
