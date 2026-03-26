#!/bin/bash

# iOS Platform Test Script
# This script validates the iOS setup and provides test instructions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}    iOS Platform Testing Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print test result
print_test() {
    local test_name=$1
    local result=$2
    local message=$3
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ "$result" = "pass" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        [ -n "$message" ] && echo -e "  ${message}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    elif [ "$result" = "fail" ]; then
        echo -e "${RED}✗${NC} $test_name"
        [ -n "$message" ] && echo -e "  ${RED}${message}${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    elif [ "$result" = "warn" ]; then
        echo -e "${YELLOW}!${NC} $test_name"
        [ -n "$message" ] && echo -e "  ${YELLOW}${message}${NC}"
    else
        echo -e "${BLUE}→${NC} $test_name"
        [ -n "$message" ] && echo -e "  ${message}"
    fi
}

# Test 1: Check Node.js version
echo -e "\n${BLUE}[1/15]${NC} Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 16 ]; then
        print_test "Node.js version" "pass" "Node $(node --version) detected"
    else
        print_test "Node.js version" "fail" "Node 16+ required, found $(node --version)"
    fi
else
    print_test "Node.js" "fail" "Node.js not found. Please install Node.js 16+"
fi

# Test 2: Check npm
echo -e "\n${BLUE}[2/15]${NC} Checking npm..."
if command -v npm &> /dev/null; then
    print_test "npm" "pass" "npm $(npm --version) detected"
else
    print_test "npm" "fail" "npm not found"
fi

# Test 3: Check if we're on macOS
echo -e "\n${BLUE}[3/15]${NC} Checking platform..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_test "Platform" "pass" "Running on macOS"
else
    print_test "Platform" "warn" "Not on macOS. iOS Simulator requires macOS"
fi

# Test 4: Check Xcode
echo -e "\n${BLUE}[4/15]${NC} Checking Xcode..."
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    print_test "Xcode" "pass" "$XCODE_VERSION detected"
else
    print_test "Xcode" "warn" "Xcode not found. Required for iOS Simulator"
fi

# Test 5: Check node_modules
echo -e "\n${BLUE}[5/15]${NC} Checking dependencies..."
if [ -d "node_modules" ]; then
    print_test "node_modules" "pass" "Dependencies installed"
else
    print_test "node_modules" "fail" "Dependencies not installed. Run: npm install"
fi

# Test 6: Check critical dependencies
echo -e "\n${BLUE}[6/15]${NC} Checking critical dependencies..."
DEPS_OK=true
if [ -f "package.json" ]; then
    if grep -q '"expo-secure-store"' package.json; then
        print_test "expo-secure-store" "pass"
    else
        print_test "expo-secure-store" "fail" "Not found in package.json"
        DEPS_OK=false
    fi
    
    if grep -q '"expo-local-authentication"' package.json; then
        print_test "expo-local-authentication" "pass"
    else
        print_test "expo-local-authentication" "fail" "Not found in package.json"
        DEPS_OK=false
    fi
    
    if grep -q '"expo-router"' package.json; then
        print_test "expo-router" "pass"
    else
        print_test "expo-router" "fail" "Not found in package.json"
        DEPS_OK=false
    fi
else
    print_test "package.json" "fail" "package.json not found"
    DEPS_OK=false
fi

# Test 7: Check app.json iOS configuration
echo -e "\n${BLUE}[7/15]${NC} Checking app.json iOS configuration..."
if [ -f "app.json" ]; then
    if grep -q '"bundleIdentifier"' app.json && grep -q '"NSFaceIDUsageDescription"' app.json; then
        print_test "iOS configuration" "pass" "Bundle ID and permissions configured"
    else
        print_test "iOS configuration" "fail" "Missing iOS configuration in app.json"
    fi
else
    print_test "app.json" "fail" "app.json not found"
fi

# Test 8: Check babel.config.js path aliases
echo -e "\n${BLUE}[8/15]${NC} Checking Babel path aliases..."
if [ -f "babel.config.js" ]; then
    if grep -q "@store" babel.config.js && grep -q "@components" babel.config.js && grep -q "@utils" babel.config.js; then
        print_test "Babel aliases" "pass" "@store, @components, @utils configured"
    else
        print_test "Babel aliases" "fail" "Path aliases not configured in babel.config.js"
    fi
else
    print_test "babel.config.js" "fail" "babel.config.js not found"
fi

# Test 9: Check tsconfig.json path mappings
echo -e "\n${BLUE}[9/15]${NC} Checking TypeScript path mappings..."
if [ -f "tsconfig.json" ]; then
    if grep -q '"@store"' tsconfig.json && grep -q '"@components"' tsconfig.json && grep -q '"@utils"' tsconfig.json; then
        print_test "TypeScript paths" "pass" "Path mappings configured"
    else
        print_test "TypeScript paths" "fail" "Path mappings not configured in tsconfig.json"
    fi
else
    print_test "tsconfig.json" "fail" "tsconfig.json not found"
fi

# Test 10: Check metro.config.js
echo -e "\n${BLUE}[10/15]${NC} Checking Metro bundler configuration..."
if [ -f "metro.config.js" ]; then
    if grep -q "extraNodeModules" metro.config.js; then
        print_test "Metro config" "pass" "Path aliases configured"
    else
        print_test "Metro config" "fail" "extraNodeModules not configured"
    fi
else
    print_test "metro.config.js" "fail" "metro.config.js not found"
fi

# Test 11: Check critical source files
echo -e "\n${BLUE}[11/15]${NC} Checking critical source files..."
FILES_OK=true
FILES=(
    "src/store/index.ts"
    "src/utils/secureStorage.ts"
    "src/utils/biometric.ts"
    "src/config/ios.ts"
    "app/_layout.tsx"
    "app/(auth)/login.tsx"
    "app/(tabs)/student/index.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_test "$file" "pass"
    else
        print_test "$file" "fail" "File not found"
        FILES_OK=false
    fi
done

# Test 12: Check iOS-specific utilities
echo -e "\n${BLUE}[12/15]${NC} Checking iOS utilities..."
if [ -f "src/utils/iosInit.ts" ]; then
    print_test "iosInit.ts" "pass"
else
    print_test "iosInit.ts" "fail" "iOS initialization utility not found"
fi

if [ -f "src/utils/backgroundSync.ts" ]; then
    print_test "backgroundSync.ts" "pass"
else
    print_test "backgroundSync.ts" "fail" "Background sync utility not found"
fi

# Test 13: Check component exports
echo -e "\n${BLUE}[13/15]${NC} Checking component exports..."
if [ -f "src/components/index.ts" ]; then
    if grep -q "Loading" src/components/index.ts; then
        print_test "Component exports" "pass" "Core components exported"
    else
        print_test "Component exports" "fail" "Loading component not exported"
    fi
else
    print_test "Component exports" "fail" "src/components/index.ts not found"
fi

# Test 14: Check constants
echo -e "\n${BLUE}[14/15]${NC} Checking constants..."
if [ -f "src/constants/index.ts" ]; then
    if grep -q "STORAGE_KEYS" src/constants/index.ts; then
        print_test "Constants" "pass" "STORAGE_KEYS defined"
    else
        print_test "Constants" "fail" "STORAGE_KEYS not found"
    fi
else
    print_test "Constants" "fail" "src/constants/index.ts not found"
fi

# Test 15: Check assets
echo -e "\n${BLUE}[15/15]${NC} Checking assets..."
if [ -d "assets" ]; then
    if [ -f "assets/icon.png" ] && [ -f "assets/splash.png" ]; then
        print_test "Assets" "pass" "Icon and splash screen present"
    else
        print_test "Assets" "warn" "Some assets may be missing"
    fi
else
    print_test "Assets" "fail" "assets directory not found"
fi

# Summary
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}    Test Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Total Tests:  ${TESTS_TOTAL}"
echo -e "Passed:       ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Failed:       ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All validation tests passed!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "1. Start the iOS app:"
    echo -e "   ${YELLOW}npx expo start --ios${NC}"
    echo ""
    echo -e "2. Test the following:"
    echo -e "   • App launches without crashes"
    echo -e "   • Login with: demo@example.com / Demo@123"
    echo -e "   • Navigate through student dashboard"
    echo -e "   • Test secure storage (close/reopen app)"
    echo -e "   • Test biometric authentication"
    echo ""
    echo -e "See ${YELLOW}IOS_TEST_PLAN.md${NC} for detailed test scenarios"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please fix the issues above.${NC}"
    echo ""
    echo -e "Common fixes:"
    echo -e "• Run: ${YELLOW}npm install${NC} (if dependencies missing)"
    echo -e "• Check file paths are correct"
    echo -e "• Ensure all required files exist"
    echo ""
    exit 1
fi
