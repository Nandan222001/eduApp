# Mobile App Setup Script for Windows

Write-Host "🚀 Setting up EDU Mobile App..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Copy environment file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Please update the .env file with your API endpoints" -ForegroundColor Yellow
}

# Check if EAS CLI is installed globally
try {
    eas --version | Out-Null
} catch {
    Write-Host "⚠️  EAS CLI is not installed globally." -ForegroundColor Yellow
    Write-Host "   Install it with: npm install -g eas-cli" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env file with your API endpoints"
Write-Host "2. Run 'npm start' to start the development server"
Write-Host "3. Install Expo Go app on your mobile device or start an emulator"
Write-Host ""
Write-Host "For EAS builds:" -ForegroundColor Cyan
Write-Host "1. Login to EAS: eas login"
Write-Host "2. Configure project: eas build:configure"
Write-Host "3. Build: npm run build:dev:ios or npm run build:dev:android"
Write-Host ""
