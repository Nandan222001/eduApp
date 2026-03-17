#!/bin/bash

# Setup Credentials Script
# Helps configure all necessary credentials for deployment

set -e

echo "🔐 EAS Credentials Setup"
echo "========================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Login to EAS
echo "📝 Logging in to Expo..."
eas login

# Select platform
echo ""
echo "Select platform to configure:"
echo "1. iOS"
echo "2. Android"
echo "3. Both"
read -p "Enter choice (1-3): " platform_choice

configure_ios() {
    echo ""
    echo "🍎 Configuring iOS credentials..."
    echo ""
    
    echo "iOS Configuration Options:"
    echo "1. Let EAS manage everything (recommended)"
    echo "2. Provide your own certificates"
    echo "3. Skip iOS configuration"
    read -p "Enter choice (1-3): " ios_choice
    
    case $ios_choice in
        1)
            echo "Setting up automatic iOS credentials..."
            eas credentials --platform ios
            ;;
        2)
            echo ""
            echo "You will need:"
            echo "- iOS Distribution Certificate (.p12)"
            echo "- Provisioning Profile (.mobileprovision)"
            echo ""
            read -p "Press enter when ready..."
            eas credentials --platform ios
            ;;
        3)
            echo "Skipping iOS configuration"
            ;;
        *)
            echo "Invalid choice"
            ;;
    esac
}

configure_android() {
    echo ""
    echo "🤖 Configuring Android credentials..."
    echo ""
    
    echo "Android Configuration Options:"
    echo "1. Generate new keystore (recommended for new apps)"
    echo "2. Upload existing keystore"
    echo "3. Skip Android configuration"
    read -p "Enter choice (1-3): " android_choice
    
    case $android_choice in
        1)
            echo "Generating new Android keystore..."
            eas credentials --platform android
            ;;
        2)
            echo ""
            echo "You will need:"
            echo "- Keystore file (.keystore or .jks)"
            echo "- Keystore password"
            echo "- Key alias"
            echo "- Key password"
            echo ""
            read -p "Press enter when ready..."
            eas credentials --platform android
            ;;
        3)
            echo "Skipping Android configuration"
            ;;
        *)
            echo "Invalid choice"
            ;;
    esac
}

case $platform_choice in
    1)
        configure_ios
        ;;
    2)
        configure_android
        ;;
    3)
        configure_ios
        configure_android
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Credential setup completed!"
echo ""
echo "Next steps:"
echo "1. Set up environment variables in .env files"
echo "2. Configure Google Services files"
echo "3. Test a build: npm run build:preview:ios"
echo ""
