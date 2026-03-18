# Shared Components Installation Script (PowerShell)
# This script helps set up the shared component library

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Shared UI Component Library - Installation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the mobile directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found" -ForegroundColor Red
    Write-Host "Please run this script from the mobile directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found package.json" -ForegroundColor Green
Write-Host ""

# Step 1: Install dependencies
Write-Host "📦 Step 1/4: Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Verify required packages
Write-Host "🔍 Step 2/4: Verifying required packages..." -ForegroundColor Yellow

$requiredPackages = @(
    "@gorhom/bottom-sheet",
    "@react-native-community/datetimepicker",
    "react-native-vector-icons",
    "@react-native-async-storage/async-storage",
    "react-native-safe-area-context"
)

foreach ($package in $requiredPackages) {
    $result = npm list $package 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $package" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $package - Missing!" -ForegroundColor Red
        Write-Host "     Installing $package..." -ForegroundColor Yellow
        npm install $package
    }
}

Write-Host ""

# Step 3: iOS setup (if iOS directory exists)
if (Test-Path "ios") {
    Write-Host "🍎 Step 3/4: Setting up iOS..." -ForegroundColor Yellow
    
    if (Get-Command pod -ErrorAction SilentlyContinue) {
        Write-Host "  Running pod install..." -ForegroundColor Yellow
        Push-Location ios
        pod install
        Pop-Location
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ iOS pods installed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Warning: pod install failed, you may need to run it manually" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  CocoaPods not found, skipping pod install" -ForegroundColor Yellow
        Write-Host "     Install CocoaPods: https://cocoapods.org/" -ForegroundColor Cyan
    }
} else {
    Write-Host "ℹ️  Step 3/4: iOS directory not found, skipping" -ForegroundColor Cyan
}

Write-Host ""

# Step 4: Cache information
Write-Host "🧹 Step 4/4: Cache clearing information..." -ForegroundColor Yellow
Write-Host "  To clear Metro bundler cache, run:" -ForegroundColor Cyan
Write-Host "    npx expo start --clear" -ForegroundColor White
Write-Host "  or" -ForegroundColor Cyan
Write-Host "    npx react-native start --reset-cache" -ForegroundColor White

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✨ Installation Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Wrap your App with ThemeProvider:" -ForegroundColor White
Write-Host "   import { ThemeProvider } from '@/theme';" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Start using components:" -ForegroundColor White
Write-Host "   import { Button, Input, Card } from '@components/shared';" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Read the documentation:" -ForegroundColor White
Write-Host "   📖 SHARED_COMPONENTS_QUICK_START.md" -ForegroundColor Cyan
Write-Host "   📖 SHARED_COMPONENTS_GUIDE.md" -ForegroundColor Cyan
Write-Host "   📖 src/components/shared/README.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Check examples:" -ForegroundColor White
Write-Host "   📄 SHARED_COMPONENTS_EXAMPLES.tsx" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the app:" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor Cyan
Write-Host "  # or" -ForegroundColor Gray
Write-Host "  npx expo start" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
