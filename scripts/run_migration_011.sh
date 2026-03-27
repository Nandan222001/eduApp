#!/bin/bash
# Shell script to run migration 011 with diagnostics
# This script provides similar functionality to the PowerShell version

set -e

echo "======================================================================"
echo "MIGRATION 011 - DIAGNOSTIC AND UPGRADE"
echo "======================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Python is available
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "${RED}ERROR: Python not found${NC}"
    echo "Please install Python 3"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

echo -e "${CYAN}[Step 1] Checking Python environment...${NC}"
$PYTHON_CMD --version

# Run schema verification
echo ""
echo -e "${CYAN}[Step 2] Verifying database schema...${NC}"
echo "----------------------------------------------------------------------"

if $PYTHON_CMD scripts/verify_schema.py; then
    echo ""
    echo -e "${GREEN}✓ Schema verification passed${NC}"
    SCHEMA_OK=true
else
    echo ""
    echo -e "${RED}✗ Schema verification failed${NC}"
    SCHEMA_OK=false
fi

if [ "$SCHEMA_OK" = false ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Schema issues detected. Continue with upgrade anyway? (y/N)${NC}"
    read -r response
    if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
        echo "Exiting. Please fix schema issues first."
        exit 1
    fi
fi

# Run alembic upgrade
echo ""
echo -e "${CYAN}[Step 3] Running alembic upgrade head...${NC}"
echo "----------------------------------------------------------------------"

if alembic upgrade head; then
    echo ""
    echo -e "${GREEN}✓ Migration completed successfully!${NC}"
    UPGRADE_SUCCESS=true
else
    echo ""
    echo -e "${RED}✗ Migration failed${NC}"
    UPGRADE_SUCCESS=false
fi

# If failed, provide troubleshooting guidance
if [ "$UPGRADE_SUCCESS" = false ]; then
    echo ""
    echo "======================================================================"
    echo -e "${RED}MIGRATION FAILED - TROUBLESHOOTING STEPS${NC}"
    echo "======================================================================"
    echo ""
    echo -e "${YELLOW}1. Check the error messages above${NC}"
    echo "   - Look for 'foreign key constraint' errors"
    echo "   - Look for 'table does not exist' errors"
    echo ""
    echo -e "${YELLOW}2. Read the troubleshooting guide:${NC}"
    echo "   cat scripts/MIGRATION_011_TROUBLESHOOTING.md"
    echo ""
    echo -e "${YELLOW}3. Check column types in MySQL:${NC}"
    echo "   mysql -u your_user -p -e 'DESCRIBE questions_bank;'"
    echo ""
    echo -e "${YELLOW}4. Check current alembic version:${NC}"
    echo "   mysql -u your_user -p -e 'SELECT version_num FROM alembic_version;'"
    echo ""
    echo -e "${YELLOW}5. Check MySQL error logs:${NC}"
    echo "   tail -f /var/log/mysql/error.log"
    echo ""
    exit 1
fi

# Verify schema after successful upgrade
echo ""
echo -e "${CYAN}[Step 4] Verifying schema after migration...${NC}"
echo "----------------------------------------------------------------------"

if $PYTHON_CMD scripts/verify_schema.py; then
    echo ""
    echo -e "${GREEN}✓ Post-migration verification passed${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Post-migration verification showed warnings${NC}"
fi

# Final summary
echo ""
echo "======================================================================"
echo -e "${GREEN}SUMMARY${NC}"
echo "======================================================================"
echo -e "${GREEN}✓ Migration 011 has been successfully applied!${NC}"
echo ""
echo "The following tables were created/updated:"
echo "  - chapter_performance"
echo "  - question_recommendations"
echo "  - focus_areas"
echo "  - personalized_insights"
echo ""
