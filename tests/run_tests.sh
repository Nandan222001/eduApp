#!/bin/bash

# Comprehensive test runner script for the backend test suite
# Usage: ./tests/run_tests.sh [OPTIONS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
COVERAGE=true
PARALLEL=false
VERBOSE=false
MARKER=""
REPORT_TYPE="term-missing"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-coverage)
            COVERAGE=false
            shift
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --unit)
            MARKER="unit"
            shift
            ;;
        --integration)
            MARKER="integration"
            shift
            ;;
        --benchmark)
            MARKER="benchmark"
            shift
            ;;
        --html)
            REPORT_TYPE="html"
            shift
            ;;
        --xml)
            REPORT_TYPE="xml"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--no-coverage] [--parallel] [--verbose] [--unit|--integration|--benchmark] [--html|--xml]"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}Starting test suite...${NC}"

# Build pytest command
CMD="poetry run pytest"

# Add coverage options
if [ "$COVERAGE" = true ]; then
    CMD="$CMD --cov=src --cov-branch"
    
    if [ "$REPORT_TYPE" = "html" ]; then
        CMD="$CMD --cov-report=html --cov-report=term"
        echo -e "${YELLOW}HTML coverage report will be generated in htmlcov/index.html${NC}"
    elif [ "$REPORT_TYPE" = "xml" ]; then
        CMD="$CMD --cov-report=xml --cov-report=term"
        echo -e "${YELLOW}XML coverage report will be generated in coverage.xml${NC}"
    else
        CMD="$CMD --cov-report=term-missing"
    fi
fi

# Add parallel execution
if [ "$PARALLEL" = true ]; then
    CMD="$CMD -n auto"
    echo -e "${YELLOW}Running tests in parallel...${NC}"
fi

# Add verbosity
if [ "$VERBOSE" = true ]; then
    CMD="$CMD -vv"
fi

# Add marker filter
if [ -n "$MARKER" ]; then
    CMD="$CMD -m $MARKER"
    echo -e "${YELLOW}Running $MARKER tests only...${NC}"
fi

# Run tests
echo -e "${GREEN}Executing: $CMD${NC}"
eval $CMD

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    
    if [ "$COVERAGE" = true ] && [ "$REPORT_TYPE" = "html" ]; then
        echo -e "${GREEN}Coverage report: htmlcov/index.html${NC}"
    fi
    
    exit 0
else
    echo -e "${RED}Tests failed! ✗${NC}"
    exit 1
fi
