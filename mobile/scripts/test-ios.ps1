# iOS Testing Script for EduTrack Mobile App (PowerShell)
# Note: This script validates the configuration, but iOS testing requires macOS

param(
    [switch]$SkipInstall,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

Write-Info "iOS Configuration Validator for EduTrack Mobile"
Write-Warning "Note: Actual iOS testing requires macOS with Xcode"

# Navigate to mobile directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptPath "..")

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js version: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm version: $npmVersion"
} catch {
    Write-Error "npm is not installed"
    exit 1
}

# Install dependencies
if (-not $SkipInstall) {
    if (-not (Test-Path "node_modules")) {
        Write-Info "Installing dependencies..."
        npm install
        Write-Success "Dependencies installed"
    } else {
        Write-Info "Dependencies already installed"
    }
}

# Type checking
Write-Info "Running TypeScript type check..."
try {
    npm run type-check
    Write-Success "Type check passed"
} catch {
    Write-Error "Type check failed"
    exit 1
}

# Linting
Write-Info "Running ESLint..."
try {
    npm run lint
    Write-Success "Linting passed"
} catch {
    Write-Warning "Linting found issues (continuing anyway)"
}

# Verify critical files
Write-Info "Verifying project structure..."

$requiredFiles = @(
    "app.json",
    "package.json",
    "tsconfig.json",
    "babel.config.js",
    "metro.config.js",
    "app\_layout.tsx",
    "src\utils\secureStorage.ts",
    "src\utils\biometric.ts",
    "src\store\index.ts",
    "src\config\ios.ts"
)

$allFilesPresent = $true
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Error "Required file missing: $file"
        $allFilesPresent = $false
    }
}

if ($allFilesPresent) {
    Write-Success "All required files present"
} else {
    exit 1
}

# Check path aliases in configurations
Write-Info "Verifying path aliases configuration..."

function Test-ConfigContent {
    param(
        [string]$FilePath,
        [string]$Pattern
    )
    
    $content = Get-Content $FilePath -Raw
    return $content -match $Pattern
}

if (Test-ConfigContent "babel.config.js" "@store") {
    Write-Success "Babel module resolver configured"
} else {
    Write-Error "Babel module resolver not properly configured"
    exit 1
}

if (Test-ConfigContent "tsconfig.json" "@store") {
    Write-Success "TypeScript paths configured"
} else {
    Write-Error "TypeScript paths not properly configured"
    exit 1
}

if (Test-ConfigContent "metro.config.js" "@store") {
    Write-Success "Metro extraNodeModules configured"
} else {
    Write-Error "Metro extraNodeModules not properly configured"
    exit 1
}

# Check dependencies
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

if ($packageJson.dependencies."expo-secure-store") {
    Write-Success "expo-secure-store dependency found"
} else {
    Write-Error "expo-secure-store not in dependencies"
    exit 1
}

if ($packageJson.dependencies."expo-local-authentication") {
    Write-Success "expo-local-authentication dependency found"
} else {
    Write-Error "expo-local-authentication not in dependencies"
    exit 1
}

# Check iOS permissions
Write-Info "Verifying iOS permissions in app.json..."
$appJson = Get-Content "app.json" -Raw

if ($appJson -match "NSFaceIDUsageDescription") {
    Write-Success "Face ID permission configured"
} else {
    Write-Error "Face ID permission not configured in app.json"
    exit 1
}

if ($appJson -match "NSCameraUsageDescription") {
    Write-Success "Camera permission configured"
} else {
    Write-Warning "Camera permission not configured in app.json"
}

# Check Expo plugins
Write-Info "Verifying Expo plugins..."
if ($appJson -match '"expo-secure-store"') {
    Write-Success "expo-secure-store plugin configured"
} else {
    Write-Warning "expo-secure-store plugin not in app.json (may not be required)"
}

if ($appJson -match '"expo-local-authentication"') {
    Write-Success "expo-local-authentication plugin configured"
} else {
    Write-Warning "expo-local-authentication plugin not in app.json (may not be required)"
}

# Summary
Write-Host ""
Write-Success "=========================================="
Write-Success "iOS Configuration Validation Complete!"
Write-Success "=========================================="
Write-Host ""
Write-Info "Configuration is ready for iOS testing"
Write-Host ""
Write-Info "To test on iOS (requires macOS):"
Write-Host "  1. Transfer project to macOS machine"
Write-Host "  2. Run: npx expo start --ios"
Write-Host "  3. Wait for iOS Simulator to launch"
Write-Host "  4. Follow testing checklist in IOS_SETUP.md"
Write-Host ""
Write-Info "To test on Windows:"
Write-Host "  1. Run: npx expo start --web"
Write-Host "  2. Or use Android emulator"
Write-Host ""
Write-Info "For detailed information, see: IOS_SETUP.md"
Write-Host ""

# Offer to start Expo
$response = Read-Host "Would you like to start Expo dev server? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Info "Starting Expo..."
    npx expo start
}
