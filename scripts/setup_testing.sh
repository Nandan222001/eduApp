#!/bin/bash
set -e

echo "=================================="
echo "Setting Up Testing Environment"
echo "=================================="
echo ""

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
REQUIRED_VERSION="3.11"

if [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]]; then
    echo "❌ Error: Python 3.11+ is required. Found: $PYTHON_VERSION"
    exit 1
fi
echo "✓ Python $PYTHON_VERSION"

# Check if Poetry is installed
echo ""
echo "Checking Poetry installation..."
if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry not found. Installing..."
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
else
    echo "✓ Poetry is installed"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
poetry install --no-interaction

# Install pre-commit hooks
echo ""
echo "Installing pre-commit hooks..."
poetry run pre-commit install
echo "✓ Pre-commit hooks installed"

# Create .env file if it doesn't exist
echo ""
echo "Setting up environment variables..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ Created .env from .env.example"
    else
        cat > .env << EOF
DATABASE_URL=mysql+pymysql://test_user:test_password@localhost:3306/test_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=test-secret-key-change-in-production
ENVIRONMENT=development
DEBUG=True
EOF
        echo "✓ Created .env with default values"
    fi
else
    echo "✓ .env already exists"
fi

# Check Docker availability
echo ""
echo "Checking Docker..."
if command -v docker &> /dev/null; then
    echo "✓ Docker is available"
    
    echo ""
    echo "Starting test services (MySQL & Redis)..."
    docker-compose up -d mysql redis
    
    # Wait for MySQL to be ready
    echo "Waiting for MySQL to be ready..."
    until docker-compose exec -T mysql mysqladmin ping -h localhost --silent &> /dev/null; do
        echo -n "."
        sleep 1
    done
    echo ""
    echo "✓ MySQL is ready"
    
    # Wait for Redis to be ready
    echo "Waiting for Redis to be ready..."
    until docker-compose exec -T redis redis-cli ping &> /dev/null; do
        echo -n "."
        sleep 1
    done
    echo ""
    echo "✓ Redis is ready"
else
    echo "⚠️  Docker not found. You'll need to run MySQL and Redis manually."
fi

# Run migrations
echo ""
echo "Running database migrations..."
poetry run alembic upgrade head || echo "⚠️  Migrations failed (may be expected if tables already exist)"

# Run a quick test to verify setup
echo ""
echo "Running smoke tests..."
poetry run pytest tests/ -m "unit" -x --tb=short -q 2>/dev/null || echo "⚠️  Some tests failed. This might be expected."

# Generate coverage report structure
echo ""
echo "Setting up coverage reporting..."
mkdir -p htmlcov

echo ""
echo "=================================="
echo "✓ Setup Complete!"
echo "=================================="
echo ""
echo "Quick Start Commands:"
echo "  make test              # Run all tests"
echo "  make test-cov          # Run tests with coverage"
echo "  make coverage-report   # View coverage report"
echo "  make quality           # Run all quality checks"
echo "  make format            # Format code"
echo "  make lint              # Run linter"
echo ""
echo "For more information, see:"
echo "  - docs/TESTING_GUIDE.md"
echo "  - docs/CI_CD_SETUP.md"
echo ""
