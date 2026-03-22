#!/bin/bash

# iOS Testing Script for EduTrack Mobile App
# This script automates the iOS testing process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script must be run on macOS for iOS testing"
    exit 1
fi

print_status "Starting iOS testing for EduTrack Mobile..."

# Navigate to mobile directory
cd "$(dirname "$0")/.."

# Check Node.js installation
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js version: $(node -v)"

# Check npm installation
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm version: $(npm -v)"

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    print_warning "Xcode is not installed. Some features may not work."
else
    print_success "Xcode installed: $(xcodebuild -version | head -n1)"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Type checking
print_status "Running TypeScript type check..."
if npm run type-check; then
    print_success "Type check passed"
else
    print_error "Type check failed"
    exit 1
fi

# Linting
print_status "Running ESLint..."
if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting found issues (continuing anyway)"
fi

# Check for iOS simulator
print_status "Checking for iOS simulators..."
if command -v xcrun &> /dev/null; then
    SIMULATORS=$(xcrun simctl list devices available | grep "iPhone")
    if [ -z "$SIMULATORS" ]; then
        print_warning "No iOS simulators found. Install Xcode and create simulators."
    else
        print_success "iOS simulators available"
        echo "$SIMULATORS" | head -n 5
    fi
fi

# Verify critical files exist
print_status "Verifying project structure..."

REQUIRED_FILES=(
    "app.json"
    "package.json"
    "tsconfig.json"
    "babel.config.js"
    "metro.config.js"
    "app/_layout.tsx"
    "src/utils/secureStorage.ts"
    "src/utils/biometric.ts"
    "src/store/index.ts"
    "src/config/ios.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done
print_success "All required files present"

# Check path aliases configuration
print_status "Verifying path aliases configuration..."

check_config() {
    local file=$1
    local pattern=$2
    if grep -q "$pattern" "$file"; then
        return 0
    else
        return 1
    fi
}

if check_config "babel.config.js" "@store"; then
    print_success "Babel module resolver configured"
else
    print_error "Babel module resolver not properly configured"
    exit 1
fi

if check_config "tsconfig.json" "@store"; then
    print_success "TypeScript paths configured"
else
    print_error "TypeScript paths not properly configured"
    exit 1
fi

if check_config "metro.config.js" "@store"; then
    print_success "Metro extraNodeModules configured"
else
    print_error "Metro extraNodeModules not properly configured"
    exit 1
fi

# Check expo-secure-store in package.json
if grep -q "expo-secure-store" "package.json"; then
    print_success "expo-secure-store dependency found"
else
    print_error "expo-secure-store not in dependencies"
    exit 1
fi

# Check expo-local-authentication in package.json
if grep -q "expo-local-authentication" "package.json"; then
    print_success "expo-local-authentication dependency found"
else
    print_error "expo-local-authentication not in dependencies"
    exit 1
fi

# Check iOS permissions in app.json
print_status "Verifying iOS permissions in app.json..."
if grep -q "NSFaceIDUsageDescription" "app.json"; then
    print_success "Face ID permission configured"
else
    print_error "Face ID permission not configured in app.json"
    exit 1
fi

# Check for required Expo plugins
print_status "Verifying Expo plugins..."
if grep -q "expo-secure-store" "app.json"; then
    print_success "expo-secure-store plugin configured"
else
    print_warning "expo-secure-store plugin not in app.json (may not be required)"
fi

if grep -q "expo-local-authentication" "app.json"; then
    print_success "expo-local-authentication plugin configured"
else
    print_warning "expo-local-authentication plugin not in app.json (may not be required)"
fi

# Summary
echo ""
print_success "=========================================="
print_success "iOS Pre-flight Check Complete!"
print_success "=========================================="
echo ""
print_status "Next steps:"
echo "  1. Run: npx expo start --ios"
echo "  2. Wait for iOS Simulator to launch"
echo "  3. Test the following:"
echo "     - App launches without crashes"
echo "     - Navigate from login to student dashboard"
echo "     - Verify secure storage works"
echo "     - Test biometric authentication (if available)"
echo "     - Check all path aliases resolve"
echo ""
print_status "For detailed testing checklist, see: IOS_SETUP.md"
echo ""

# Optional: Start the app
read -p "Would you like to start the iOS app now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting Expo with iOS..."
    npx expo start --ios
fi
