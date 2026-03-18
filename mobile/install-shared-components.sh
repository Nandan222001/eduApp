#!/bin/bash

# Shared Components Installation Script
# This script helps set up the shared component library

echo "================================================"
echo "Shared UI Component Library - Installation"
echo "================================================"
echo ""

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the mobile directory"
    exit 1
fi

echo "✅ Found package.json"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1/4: Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Step 2: Verify required packages
echo "🔍 Step 2/4: Verifying required packages..."

REQUIRED_PACKAGES=(
    "@gorhom/bottom-sheet"
    "@react-native-community/datetimepicker"
    "react-native-vector-icons"
    "@react-native-async-storage/async-storage"
    "react-native-safe-area-context"
)

for package in "${REQUIRED_PACKAGES[@]}"; do
    if npm list "$package" &> /dev/null; then
        echo "  ✅ $package"
    else
        echo "  ❌ $package - Missing!"
        echo "     Installing $package..."
        npm install "$package"
    fi
done

echo ""

# Step 3: iOS setup (if iOS directory exists)
if [ -d "ios" ]; then
    echo "🍎 Step 3/4: Setting up iOS..."
    cd ios
    
    if command -v pod &> /dev/null; then
        echo "  Running pod install..."
        pod install
        if [ $? -eq 0 ]; then
            echo "  ✅ iOS pods installed"
        else
            echo "  ⚠️  Warning: pod install failed, you may need to run it manually"
        fi
    else
        echo "  ⚠️  CocoaPods not found, skipping pod install"
        echo "     Install CocoaPods: https://cocoapods.org/"
    fi
    
    cd ..
else
    echo "ℹ️  Step 3/4: iOS directory not found, skipping"
fi

echo ""

# Step 4: Clear cache
echo "🧹 Step 4/4: Clearing cache..."
echo "  Clearing Metro bundler cache..."

if command -v npx &> /dev/null; then
    npx expo start --clear &> /dev/null &
    sleep 2
    pkill -f "expo start" &> /dev/null
    echo "  ✅ Cache cleared"
else
    echo "  ⚠️  npx not found, skipping cache clear"
fi

echo ""
echo "================================================"
echo "✨ Installation Complete!"
echo "================================================"
echo ""
echo "Next Steps:"
echo ""
echo "1. Wrap your App with ThemeProvider:"
echo "   import { ThemeProvider } from '@/theme';"
echo ""
echo "2. Start using components:"
echo "   import { Button, Input, Card } from '@components/shared';"
echo ""
echo "3. Read the documentation:"
echo "   📖 SHARED_COMPONENTS_QUICK_START.md"
echo "   📖 SHARED_COMPONENTS_GUIDE.md"
echo "   📖 src/components/shared/README.md"
echo ""
echo "4. Check examples:"
echo "   📄 SHARED_COMPONENTS_EXAMPLES.tsx"
echo ""
echo "To start the app:"
echo "  npm start"
echo "  # or"
echo "  npx expo start"
echo ""
echo "================================================"
