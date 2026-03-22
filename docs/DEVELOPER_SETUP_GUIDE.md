# Developer Setup Guide

Complete guide for setting up the Educational SaaS Platform development environment.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Database Setup](#database-setup)
6. [Redis Setup](#redis-setup)
7. [Running the Application](#running-the-application)
8. [Development Workflow](#development-workflow)
9. [Testing](#testing)
10. [Debugging](#debugging)
11. [Common Issues](#common-issues)

---

## 1. Prerequisites

### Required Software

**Python 3.11+**
```bash
# Check Python version
python --version  # Should be 3.11 or higher

# Install Python 3.11 (if needed)
# Windows: Download from python.org
# macOS: brew install python@3.11
# Linux: sudo apt install python3.11
```

**Poetry (Dependency Management)**
```bash
# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Or on Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -

# Verify installation
poetry --version
```

**Node.js 18+ and npm** (for frontend)
```bash
# Check versions
node --version  # Should be 18 or higher
npm --version

# Install Node.js
# Windows/macOS: Download from nodejs.org
# Linux: 
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**MySQL 8.0+**
```bash
# Windows: Download from mysql.com
# macOS:
brew install mysql

# Linux:
sudo apt install mysql-server

# Verify
mysql --version
```

**Redis 5.0+**
```bash
# macOS:
brew install redis

# Linux:
sudo apt install redis-server

# Windows: Use WSL or download from redis.io

# Verify
redis-cli --version
```

**Docker & Docker Compose** (Optional but recommended)
```bash
# Install Docker Desktop (includes Compose)
# Download from docker.com

# Verify
docker --version
docker-compose --version
```

**Git**
```bash
# Verify
git --version

# Configure
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Recommended Tools

- **IDE:** Visual Studio Code, PyCharm, or similar
- **API Testing:** Postman or Insomnia
- **Database Client:** MySQL Workbench, DBeaver, or TablePlus
- **Redis Client:** RedisInsight or redis-cli

---

## 2. Environment Setup

### Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/educational-platform.git
cd educational-platform

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Python Environment

```bash
# Install dependencies using Poetry
poetry install

# This creates a virtual environment and installs all dependencies
# Location: ~/.cache/pypoetry/virtualenvs/

# Activate virtual environment
poetry shell

# Or use poetry run for individual commands
poetry run python --version
```

### Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use your preferred editor
```

**Required Environment Variables:**

```ini
# Application
APP_NAME="Educational Platform"
APP_ENV=development
DEBUG=True
SECRET_KEY=your-secret-key-here-generate-a-secure-one

# Database
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/edu_platform_dev?charset=utf8mb4
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_CACHE_TTL=3600

# JWT Authentication
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (Development - use Mailtrap or similar)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=noreply@eduplatform.com
SMTP_FROM_NAME="Educational Platform"

# AWS S3 (Optional - use local storage for dev)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=edu-platform-dev
AWS_REGION=us-east-1

# Sentry (Optional)
SENTRY_DSN=your-sentry-dsn

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Frontend URL
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
```

**Generate Secret Keys:**

```python
# Run Python
python

# Generate secret key
>>> import secrets
>>> secrets.token_urlsafe(32)
'your-generated-secret-key'
```

---

## 3. Backend Setup

### Install Dependencies

```bash
# Ensure you're in the project root
cd /path/to/educational-platform

# Install all dependencies
poetry install

# Install development dependencies
poetry install --with dev

# Verify installation
poetry show
```

### Project Structure

```
educational-platform/
├── src/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── students.py
│   │       ├── teachers.py
│   │       └── ...
│   ├── models/
│   │   ├── user.py
│   │   ├── student.py
│   │   └── ...
│   ├── schemas/
│   │   ├── user.py
│   │   └── ...
│   ├── services/
│   │   ├── auth_service.py
│   │   └── ...
│   ├── repositories/
│   ├── middleware/
│   ├── utils/
│   ├── config.py
│   ├── database.py
│   ├── redis_client.py
│   └── main.py
├── tests/
├── alembic/
│   ├── versions/
│   └── env.py
├── docs/
├── scripts/
├── pyproject.toml
├── alembic.ini
└── .env
```

### Configuration

**config.py** uses Pydantic Settings for configuration:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Educational Platform"
    app_env: str = "development"
    debug: bool = True
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str
    
    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

---

## 4. Frontend Setup

### Navigate to Frontend

```bash
cd frontend
```

### Install Dependencies

```bash
# Install npm packages
npm install

# Or use yarn
yarn install
```

### Frontend Configuration

```bash
# Copy environment file
cp .env.example .env.local

# Edit configuration
nano .env.local
```

**Frontend .env.local:**

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/ws
NEXT_PUBLIC_APP_NAME="Educational Platform"
NEXT_PUBLIC_ENVIRONMENT=development
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── layouts/
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   ├── hooks/
│   ├── types/
│   └── styles/
├── public/
├── package.json
└── next.config.js
```

---

## 5. Database Setup

### Using Docker (Recommended)

```bash
# Start MySQL and Redis using Docker Compose
docker-compose up -d mysql redis

# Verify containers are running
docker-compose ps
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: edu_platform_mysql
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: edu_platform_dev
      MYSQL_USER: edu_user
      MYSQL_PASSWORD: secure_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

  redis:
    image: redis:7-alpine
    container_name: edu_platform_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

### Manual Setup

**Create Database:**

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE edu_platform_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (if needed)
CREATE USER 'edu_user'@'localhost' IDENTIFIED BY 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON edu_platform_dev.* TO 'edu_user'@'localhost';
FLUSH PRIVILEGES;

# Exit
EXIT;
```

**Test Connection:**

```bash
mysql -u root -p -D edu_platform_dev -e "SELECT VERSION();"
```

### Database Migrations

**Initialize Alembic:**

Already configured in the project. Check `alembic.ini`:

```ini
[alembic]
script_location = alembic
sqlalchemy.url = driver://user:pass@localhost/dbname

[alembic:exclude]
tables = spatial_ref_sys
```

**Run Migrations:**

```bash
# Check migration status
alembic current

# View migration history
alembic history

# Upgrade to latest
alembic upgrade head

# Downgrade one revision
alembic downgrade -1

# Create new migration
alembic revision --autogenerate -m "Add new table"
```

**Verify Tables:**

```bash
# Connect to database
mysql -u root -p -D edu_platform_dev

# List tables
SHOW TABLES;

# Describe table
DESCRIBE users;

# Exit
EXIT;
```

---

## 6. Redis Setup

### Using Docker

```bash
# Start Redis
docker-compose up -d redis

# Test connection
docker exec -it edu_platform_redis redis-cli ping
# Should return: PONG
```

### Manual Setup

**Start Redis:**

```bash
# macOS/Linux
redis-server

# Or as background service
# macOS:
brew services start redis

# Linux:
sudo systemctl start redis-server
```

**Test Connection:**

```bash
redis-cli ping
# Should return: PONG

# Set and get a value
redis-cli SET test "Hello"
redis-cli GET test
```

**Redis Configuration:**

```bash
# Edit redis.conf if needed
# macOS: /usr/local/etc/redis.conf
# Linux: /etc/redis/redis.conf

# Common settings
maxmemory 256mb
maxmemory-policy allkeys-lru
```

---

## 7. Running the Application

### Start Backend

**Method 1: Using Uvicorn directly**

```bash
# Activate virtual environment
poetry shell

# Run development server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Server will start at http://localhost:8000
```

**Method 2: Using Poetry run**

```bash
poetry run uvicorn src.main:app --reload
```

**Method 3: Using Makefile**

```bash
# If Makefile is configured
make dev
```

**Access API Documentation:**

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

### Start Frontend

```bash
# Navigate to frontend directory
cd frontend

# Start development server
npm run dev

# Or with yarn
yarn dev

# Server will start at http://localhost:3000
```

### Start Celery Worker (Background Tasks)

**Terminal 1: Celery Worker**

```bash
poetry shell
celery -A src.celery_app worker --loglevel=info
```

**Terminal 2: Celery Beat (Scheduled Tasks)**

```bash
poetry shell
celery -A src.celery_app beat --loglevel=info
```

**Or use the scripts:**

```bash
# Start worker
python worker.py

# Start beat scheduler
python beat.py
```

### Full Stack Development

**Option 1: Multiple Terminals**

```bash
# Terminal 1: Backend
poetry run uvicorn src.main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Celery Worker
poetry run celery -A src.celery_app worker --loglevel=info

# Terminal 4: Celery Beat
poetry run celery -A src.celery_app beat --loglevel=info
```

**Option 2: Docker Compose**

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**docker-compose.yml (Full Stack):**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: edu_platform_dev
      MYSQL_USER: edu_user
      MYSQL_PASSWORD: secure_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    command: uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=mysql+pymysql://edu_user:secure_password@mysql:3306/edu_platform_dev?charset=utf8mb4
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - mysql
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    depends_on:
      - backend

  celery_worker:
    build:
      context: .
      dockerfile: Dockerfile
    command: celery -A src.celery_app worker --loglevel=info
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=mysql+pymysql://edu_user:secure_password@mysql:3306/edu_platform_dev?charset=utf8mb4
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/1
    depends_on:
      - mysql
      - redis

volumes:
  mysql_data:
  redis_data:
```

---

## 8. Development Workflow

### Code Style & Formatting

**Install Pre-commit Hooks:**

```bash
# Install pre-commit
poetry add --group dev pre-commit

# Install git hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

**.pre-commit-config.yaml:**

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3.11

  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: v0.0.270
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
```

**Format Code:**

```bash
# Format with Black
poetry run black src/

# Lint with Ruff
poetry run ruff check src/

# Auto-fix with Ruff
poetry run ruff check src/ --fix

# Type checking with mypy
poetry run mypy src/
```

### Creating New Features

**Backend Endpoint:**

```bash
# 1. Create model (if needed)
# src/models/new_feature.py

# 2. Create schema
# src/schemas/new_feature.py

# 3. Create service
# src/services/new_feature_service.py

# 4. Create repository (if needed)
# src/repositories/new_feature_repository.py

# 5. Create API endpoint
# src/api/v1/new_feature.py

# 6. Register route in __init__.py
# src/api/v1/__init__.py

# 7. Create migration
alembic revision --autogenerate -m "Add new feature tables"

# 8. Run migration
alembic upgrade head
```

**Example API Endpoint:**

```python
# src/api/v1/example.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.schemas.example import ExampleCreate, ExampleResponse
from src.services.example_service import ExampleService

router = APIRouter(prefix="/examples", tags=["examples"])

@router.post("/", response_model=ExampleResponse)
async def create_example(
    data: ExampleCreate,
    db: Session = Depends(get_db)
):
    service = ExampleService(db)
    return service.create(data)

@router.get("/{example_id}", response_model=ExampleResponse)
async def get_example(
    example_id: int,
    db: Session = Depends(get_db)
):
    service = ExampleService(db)
    result = service.get_by_id(example_id)
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return result
```

### Database Migrations

**Workflow:**

```bash
# 1. Modify models
# Edit src/models/*.py

# 2. Generate migration
alembic revision --autogenerate -m "Description of changes"

# 3. Review generated migration
# Check alembic/versions/xxx_description.py

# 4. Edit if needed
# Modify migration file for custom logic

# 5. Apply migration
alembic upgrade head

# 6. Test migration
# Verify database changes

# 7. Test downgrade (optional)
alembic downgrade -1
alembic upgrade head
```

**Example Migration:**

```python
# alembic/versions/xxx_add_column.py
def upgrade() -> None:
    op.add_column('users', 
        sa.Column('phone_number', sa.String(20), nullable=True)
    )
    op.create_index('idx_users_phone', 'users', ['phone_number'])

def downgrade() -> None:
    op.drop_index('idx_users_phone', 'users')
    op.drop_column('users', 'phone_number')
```

---

## 9. Testing

### Backend Tests

**Run Tests:**

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=src --cov-report=html

# Run specific test file
poetry run pytest tests/test_auth.py

# Run specific test
poetry run pytest tests/test_auth.py::test_login

# Run with verbose output
poetry run pytest -v

# Run and stop on first failure
poetry run pytest -x
```

**Test Structure:**

```
tests/
├── conftest.py           # Fixtures and configuration
├── test_api_auth.py      # Auth API tests
├── test_api_students.py  # Student API tests
├── test_services_*.py    # Service layer tests
├── test_models.py        # Model tests
└── factories.py          # Test data factories
```

**Example Test:**

```python
# tests/test_api_students.py
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_create_student(auth_headers):
    """Test student creation"""
    data = {
        "user": {
            "email": "student@test.com",
            "password": "Test123!",
            "full_name": "Test Student"
        },
        "admission_number": "2024001",
        "grade_id": 1,
        "section_id": 1
    }
    
    response = client.post(
        "/api/v1/students",
        json=data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    assert response.json()["email"] == "student@test.com"

def test_get_student(db_session, test_student, auth_headers):
    """Test get student by ID"""
    response = client.get(
        f"/api/v1/students/{test_student.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert response.json()["id"] == test_student.id
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run E2E tests (if configured)
npm run test:e2e
```

### Integration Tests

```bash
# Run integration tests
poetry run pytest tests/integration/

# With Docker Compose
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## 10. Debugging

### Backend Debugging

**VS Code Configuration (.vscode/launch.json):**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "src.main:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8000"
      ],
      "jinja": true,
      "justMyCode": false
    },
    {
      "name": "Python: Current File",
      "type": "python",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal",
      "justMyCode": false
    }
  ]
}
```

**PyCharm Configuration:**

1. Run → Edit Configurations
2. Add → Python
3. Script path: `uvicorn`
4. Parameters: `src.main:app --reload`
5. Working directory: Project root
6. Python interpreter: Poetry environment

**Using Python Debugger:**

```python
# Add breakpoint in code
import pdb; pdb.set_trace()

# Or use breakpoint() (Python 3.7+)
breakpoint()

# Debug commands
# n - next line
# s - step into
# c - continue
# p variable - print variable
# q - quit
```

### Frontend Debugging

**Browser DevTools:**

- Chrome DevTools: F12 or Cmd+Option+I (Mac)
- React Developer Tools extension
- Redux DevTools extension (if using Redux)

**VS Code Debugger for Browser:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Next.js: debug client-side",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

### Database Debugging

**View Queries:**

```python
# Enable SQL logging in development
# src/database.py
engine = create_engine(
    DATABASE_URL,
    echo=True  # Prints all SQL queries
)
```

**MySQL Workbench:**

1. Open MySQL Workbench
2. Create Connection
3. Connection: localhost:3306
4. View tables, run queries, analyze data

**MySQL Commands:**

```sql
-- List databases
SHOW DATABASES;

-- Connect to database
USE edu_platform_dev;

-- List tables
SHOW TABLES;

-- Describe table
DESCRIBE users;

-- Show table contents
SELECT * FROM users LIMIT 10;

-- Query execution plan
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```

---

## 11. Common Issues

### Issue: Poetry Install Fails

**Solution:**

```bash
# Clear cache
poetry cache clear . --all

# Remove lock file
rm poetry.lock

# Reinstall
poetry install

# Or update dependencies
poetry update
```

### Issue: Database Connection Error

**Check:**

1. MySQL is running
   ```bash
   # Docker
   docker-compose ps mysql
   
   # Service
   sudo systemctl status mysql
   ```

2. Credentials are correct in `.env`
3. Database exists
   ```bash
   mysql -u root -p -e "SHOW DATABASES;"
   ```

4. Port not already in use
   ```bash
   lsof -i :3306
   ```

### Issue: Migration Conflicts

**Solution:**

```bash
# View migration history
alembic history

# View current version
alembic current

# Downgrade to specific version
alembic downgrade <revision>

# Stamp database (set version without running migration)
alembic stamp head

# Merge branches (if multiple heads)
alembic merge heads -m "Merge migrations"
```

### Issue: Redis Connection Error

**Solution:**

```bash
# Check Redis is running
redis-cli ping

# Restart Redis
# Docker:
docker-compose restart redis

# Service:
sudo systemctl restart redis-server

# Check connection in Python
python
>>> import redis
>>> r = redis.from_url('redis://localhost:6379/0')
>>> r.ping()
True
```

### Issue: Port Already in Use

**Solution:**

```bash
# Find process using port 8000
lsof -i :8000
# or
netstat -ano | findstr :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn src.main:app --port 8001
```

### Issue: Import Errors

**Solution:**

```bash
# Verify PYTHONPATH
echo $PYTHONPATH

# Add project root to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or use relative imports
from src.models.user import User
```

### Issue: Slow Tests

**Solution:**

```bash
# Run tests in parallel
poetry run pytest -n auto

# Disable coverage for faster runs
poetry run pytest --no-cov

# Run only failed tests
poetry run pytest --lf

# Run only changed tests
poetry run pytest --testmon
```

---

## Quick Start Checklist

```bash
# 1. Clone and setup
git clone <repo-url>
cd educational-platform
cp .env.example .env
# Edit .env with your settings

# 2. Install dependencies
poetry install
cd frontend && npm install && cd ..

# 3. Start services
docker-compose up -d mysql redis

# 4. Run migrations
poetry run alembic upgrade head

# 5. Start backend
poetry run uvicorn src.main:app --reload

# 6. Start frontend (new terminal)
cd frontend && npm run dev

# 7. Access application
# Backend: http://localhost:8000/docs
# Frontend: http://localhost:3000
```

---

## Additional Resources

**Documentation:**
- FastAPI: https://fastapi.tiangolo.com
- SQLAlchemy: https://docs.sqlalchemy.org
- Alembic: https://alembic.sqlalchemy.org
- Pydantic: https://docs.pydantic.dev
- Next.js: https://nextjs.org/docs
- MySQL: https://dev.mysql.com/doc/

**Community:**
- GitHub Issues: Report bugs and request features
- Discord/Slack: Join developer community
- Stack Overflow: Tag questions with project name

**Code Style Guides:**
- PEP 8: Python code style
- Black: Code formatter settings
- Project-specific conventions in CONTRIBUTING.md

---

## Support

**Need Help?**

- 📧 Email: dev-support@platform.com
- 💬 Slack: #development-help
- 📚 Wiki: https://wiki.platform.com
- 🐛 Issues: GitHub Issues

**Before Asking:**
1. Check this guide
2. Search existing issues
3. Review error messages
4. Try debugging steps
5. Provide reproduction steps

Happy Coding! 🚀
