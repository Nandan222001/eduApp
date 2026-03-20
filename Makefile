.PHONY: help install test test-unit test-integration test-cov test-parallel test-watch \
        lint format type-check quality pre-commit coverage coverage-report \
        build deploy rollback backup restore health migrate clean dev

help:
	@echo "FastAPI Application Makefile"
	@echo ""
	@echo "Testing & Quality Commands:"
	@echo "  make install              - Install dependencies with Poetry"
	@echo "  make test                 - Run all tests with coverage"
	@echo "  make test-unit            - Run unit tests only"
	@echo "  make test-integration     - Run integration tests only"
	@echo "  make test-cov             - Run tests with detailed coverage"
	@echo "  make test-parallel        - Run tests in parallel"
	@echo "  make test-watch           - Run tests in watch mode"
	@echo "  make lint                 - Run linter (Ruff)"
	@echo "  make format               - Format code with Black"
	@echo "  make type-check           - Run type checker (MyPy)"
	@echo "  make quality              - Run all quality checks"
	@echo "  make pre-commit           - Install pre-commit hooks"
	@echo "  make coverage             - Generate coverage report"
	@echo "  make coverage-report      - Open HTML coverage report"
	@echo ""
	@echo "Deployment Commands:"
	@echo "  make build ENV=<env>      - Build Docker image"
	@echo "  make deploy ENV=<env>     - Deploy to AWS"
	@echo "  make rollback ENV=<env>   - Rollback deployment"
	@echo "  make backup ENV=<env>     - Create database backup"
	@echo "  make restore ENV=<env>    - Restore database"
	@echo "  make health ENV=<env>     - Run health checks"
	@echo "  make migrate ENV=<env>    - Run database migrations"
	@echo "  make clean                - Clean local Docker resources"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev                  - Start local development environment"
	@echo "  make dev-logs             - View development logs"
	@echo "  make dev-down             - Stop development environment"
	@echo ""
	@echo "Example: make test-cov"

# Variables
ENV ?= staging
PROJECT_NAME = fastapi-app
AWS_REGION = us-east-1
PYTHON = poetry run python
PYTEST = poetry run pytest
BLACK = poetry run black
RUFF = poetry run ruff
MYPY = poetry run mypy
COVERAGE = poetry run coverage

# Testing & Quality Checks
install:
	@echo "Installing dependencies..."
	poetry install --no-interaction

test:
	@echo "Running all tests with coverage..."
	$(PYTEST) tests/ -v --cov=src --cov-report=term-missing --cov-report=html -n auto

test-unit:
	@echo "Running unit tests..."
	$(PYTEST) tests/unit/ -v -m unit -n auto

test-integration:
	@echo "Running integration tests..."
	$(PYTEST) tests/integration/ -v -m integration -n auto

test-cov:
	@echo "Running tests with detailed coverage..."
	$(PYTEST) tests/ -v \
		--cov=src \
		--cov-report=term-missing \
		--cov-report=html:htmlcov \
		--cov-report=xml:coverage.xml \
		--cov-branch \
		--cov-fail-under=70 \
		-n auto
	@echo "Coverage report generated in htmlcov/"

test-parallel:
	@echo "Running tests in parallel..."
	$(PYTEST) tests/ -v -n auto --dist loadscope

test-watch:
	@echo "Running tests in watch mode..."
	$(PYTEST) tests/ -v --cov=src -f

test-critical:
	@echo "Running tests for critical services..."
	$(PYTEST) tests/ -v \
		--cov=src.services.auth_service \
		--cov=src.services.subscription_service \
		--cov=src.services.assignment_service \
		--cov=src.services.attendance_service \
		--cov=src.services.notification_service \
		--cov=src.utils.security \
		--cov=src.utils.rbac \
		--cov-report=term-missing \
		-n auto

lint:
	@echo "Running linter..."
	$(RUFF) check src/ tests/

lint-fix:
	@echo "Running linter with auto-fix..."
	$(RUFF) check --fix src/ tests/

format:
	@echo "Formatting code with Black..."
	$(BLACK) src/ tests/

format-check:
	@echo "Checking code formatting..."
	$(BLACK) --check src/ tests/

type-check:
	@echo "Running type checker..."
	$(MYPY) src/ || true

quality: format-check lint type-check
	@echo "All quality checks passed!"

pre-commit:
	@echo "Installing pre-commit hooks..."
	poetry run pre-commit install
	@echo "Pre-commit hooks installed!"

pre-commit-run:
	@echo "Running pre-commit on all files..."
	poetry run pre-commit run --all-files

coverage:
	@echo "Generating coverage report..."
	$(COVERAGE) report --precision=2
	$(COVERAGE) html
	$(COVERAGE) xml
	@echo "Coverage report generated!"

coverage-report:
	@echo "Opening HTML coverage report..."
	@python -m webbrowser htmlcov/index.html || open htmlcov/index.html || xdg-open htmlcov/index.html

check-service-coverage:
	@echo "Checking critical service coverage..."
	$(PYTHON) scripts/check_service_coverage.py

# Deployment commands
build:
	@echo "Building Docker image for $(ENV)..."
	docker build -f Dockerfile.prod -t $(PROJECT_NAME):latest .

deploy:
	@echo "Deploying to $(ENV)..."
	chmod +x scripts/deployment/deploy.sh
	./scripts/deployment/deploy.sh $(ENV)

rollback:
	@echo "Rolling back $(ENV)..."
	chmod +x scripts/deployment/rollback.sh
	./scripts/deployment/rollback.sh $(ENV)

backup:
	@echo "Creating backup for $(ENV)..."
	chmod +x scripts/deployment/backup-database.sh
	./scripts/deployment/backup-database.sh $(ENV)

restore:
	@echo "Restoring database for $(ENV)..."
	@read -p "Enter snapshot ID: " SNAPSHOT_ID; \
	chmod +x scripts/deployment/restore-database.sh; \
	./scripts/deployment/restore-database.sh $(ENV) $$SNAPSHOT_ID

health:
	@echo "Running health checks for $(ENV)..."
	chmod +x scripts/deployment/health-check.sh
	./scripts/deployment/health-check.sh $(ENV)

migrate:
	@echo "Running migrations for $(ENV)..."
	chmod +x scripts/deployment/migrate.sh
	./scripts/deployment/migrate.sh $(ENV)

clean:
	@echo "Cleaning local Docker resources..."
	docker system prune -af
	docker volume prune -f
	@echo "Cleaning Python cache..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf htmlcov/ .coverage coverage.xml 2>/dev/null || true

# Development
dev:
	@echo "Starting local development environment..."
	docker-compose up -d

dev-logs:
	@echo "Following development logs..."
	docker-compose logs -f

dev-down:
	@echo "Stopping local development environment..."
	docker-compose down

dev-shell:
	@echo "Opening shell in app container..."
	docker-compose exec app bash

# CI/CD
ci: quality test-cov check-service-coverage
	@echo "CI checks passed!"

# Database
db-migrate:
	@echo "Running database migrations..."
	poetry run alembic upgrade head

db-rollback:
	@echo "Rolling back last migration..."
	poetry run alembic downgrade -1

db-reset:
	@echo "Resetting database..."
	poetry run alembic downgrade base
	poetry run alembic upgrade head
