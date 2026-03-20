#!/bin/bash

# Expo Mobile App - Build Cache Cleanup and Rebuild Script
# This script clears the build cache and reinstalls dependencies

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_INSTALL=false
SKIP_START=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        --skip-start)
            SKIP_START=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-install] [--skip-start]"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Expo Build Cache Cleanup Script${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Working directory: $SCRIPT_DIR${NC}"
echo ""

# Step 1: Remove node_modules
echo -e "${GREEN}[1/6] Removing node_modules directory...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GRAY}  Removing node_modules...${NC}"
    rm -rf node_modules
    if [ -d "node_modules" ]; then
        echo -e "${RED}  Warning: node_modules still exists${NC}"
    else
        echo -e "${GREEN}  ✓ node_modules removed successfully${NC}"
    fi
else
    echo -e "${GREEN}  ✓ node_modules not found (already clean)${NC}"
fi
echo ""

# Step 2: Remove .expo directory
echo -e "${GREEN}[2/6] Removing .expo directory...${NC}"
if [ -d ".expo" ]; then
    rm -rf .expo
    if [ -d ".expo" ]; then
        echo -e "${RED}  Warning: .expo still exists${NC}"
    else
        echo -e "${GREEN}  ✓ .expo directory removed${NC}"
    fi
else
    echo -e "${GREEN}  ✓ .expo directory not found (already clean)${NC}"
fi
echo ""

# Step 3: Remove package-lock.json
echo -e "${GREEN}[3/6] Removing package-lock.json...${NC}"
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    if [ -f "package-lock.json" ]; then
        echo -e "${RED}  Warning: package-lock.json still exists${NC}"
    else
        echo -e "${GREEN}  ✓ package-lock.json removed${NC}"
    fi
else
    echo -e "${GREEN}  ✓ package-lock.json not found (already clean)${NC}"
fi
echo ""

# Step 4: Clear npm cache
echo -e "${GREEN}[4/6] Clearing npm cache...${NC}"
if npm cache clean --force; then
    echo -e "${GREEN}  ✓ npm cache cleared${NC}"
else
    echo -e "${YELLOW}  Warning: Could not clear npm cache${NC}"
fi
echo ""

# Step 5: Install dependencies
if [ "$SKIP_INSTALL" = false ]; then
    echo -e "${GREEN}[5/6] Installing dependencies...${NC}"
    echo -e "${GRAY}  This may take several minutes...${NC}"
    if npm install; then
        echo -e "${GREEN}  ✓ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}  Error during npm install${NC}"
        echo -e "${YELLOW}  Please run 'npm install' manually${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}[5/6] Skipping dependency installation (--skip-install flag set)${NC}"
fi
echo ""

# Step 6: Start Expo with clear cache
if [ "$SKIP_START" = false ]; then
    echo -e "${GREEN}[6/6] Starting Expo with clear cache...${NC}"
    echo -e "${GRAY}  Press Ctrl+C to stop the server when done${NC}"
    echo ""
    npx expo start --clear
else
    echo -e "${YELLOW}[6/6] Skipping Expo start (--skip-start flag set)${NC}"
    echo ""
    echo -e "${CYAN}To start Expo manually, run:${NC}"
    echo -e "${NC}  npx expo start --clear${NC}"
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Cleanup Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Verification
echo -e "${CYAN}Verification:${NC}"
echo -e "${GRAY}  node_modules exists: $([ -d 'node_modules' ] && echo 'True' || echo 'False')${NC}"
echo -e "${GRAY}  package-lock.json exists: $([ -f 'package-lock.json' ] && echo 'True' || echo 'False')${NC}"
echo -e "${GRAY}  .expo exists: $([ -d '.expo' ] && echo 'True' || echo 'False')${NC}"
echo ""
