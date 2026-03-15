#!/bin/bash

# Mobile App Setup Script

echo "🚀 Setting up EDU Mobile App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your API endpoints"
fi

# Check if EAS CLI is installed globally
if ! command -v eas &> /dev/null; then
    echo "⚠️  EAS CLI is not installed globally."
    echo "   Install it with: npm install -g eas-cli"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your API endpoints"
echo "2. Run 'npm start' to start the development server"
echo "3. Install Expo Go app on your mobile device or start an emulator"
echo ""
echo "For EAS builds:"
echo "1. Login to EAS: eas login"
echo "2. Configure project: eas build:configure"
echo "3. Build: npm run build:dev:ios or npm run build:dev:android"
echo ""
