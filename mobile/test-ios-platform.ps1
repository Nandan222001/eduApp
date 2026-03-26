# iOS Platform Test Script (PowerShell)
# This script validates the iOS setup for Windows users testing with Expo

$ErrorActionPreference = "Continue"

# Colors
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

# Counters
$script:TestsPassed = 0
$script:TestsFailed = 0
$script:TestsTotal = 0

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Print-Test {
    param(
        [string]$TestName,
        [string]$Result,
        [string]$Message = ""
    )
    
    $script:TestsTotal++
    
    switch ($Result) {
        "pass" {
            Write-ColorOutput "✓ $TestName" $Green
            if ($Message) { Write-Host "  $Message" }
            $script:TestsPassed++
        }
        "fail" {
            Write-ColorOutput "✗ $TestName" $Red
            if ($Message) { Write-ColorOutput "  $Message" $Red }
            $script:TestsFailed++
        }
        "warn" {
            Write-ColorOutput "! $TestName" $Yellow
            if ($Message) { Write-ColorOutput "  $Message" $Yellow }
        }
        default {
            Write-ColorOutput "→ $TestName" $Blue
            if ($Message) { Write-Host "  $Message" }
        }
    }
}

Write-ColorOutput "`n================================================" $Blue
Write-ColorOutput "    iOS Platform Testing Script" $Blue
Write-ColorOutput "================================================`n" $Blue

# Test 1: Check Node.js version
Write-ColorOutput "`n[1/15] Checking Node.js version..." $Blue
try {
    $nodeVersion = node --version
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -ge 16) {
        Print-Test "Node.js version" "pass" "Node $nodeVersion detected"
    } else {
        Print-Test "Node.js version" "fail" "Node 16+ required, found $nodeVersion"
    }
} catch {
    Print-Test "Node.js" "fail" "Node.js not found. Please install Node.js 16+"
}

# Test 2: Check npm
Write-ColorOutput "`n[2/15] Checking npm..." $Blue
try {
    $npmVersion = npm --version
    Print-Test "npm" "pass" "npm $npmVersion detected"
} catch {
    Print-Test "npm" "fail" "npm not found"
}

# Test 3: Check platform
Write-ColorOutput "`n[3/15] Checking platform..." $Blue
if ($IsWindows -or $env:OS -match "Windows") {
    Print-Test "Platform" "warn" "Running on Windows. iOS testing requires macOS with Xcode"
} else {
    Print-Test "Platform" "pass" "Running on macOS/Linux"
}

# Test 4: Check for Expo CLI
Write-ColorOutput "`n[4/15] Checking Expo..." $Blue
try {
    $expoVersion = npx expo --version 2>$null
    Print-Test "Expo CLI" "pass" "Expo available"
} catch {
    Print-Test "Expo CLI" "warn" "Expo CLI check skipped"
}

# Test 5: Check node_modules
Write-ColorOutput "`n[5/15] Checking dependencies..." $Blue
if (Test-Path "node_modules") {
    Print-Test "node_modules" "pass" "Dependencies installed"
} else {
    Print-Test "node_modules" "fail" "Dependencies not installed. Run: npm install"
}

# Test 6: Check critical dependencies
Write-ColorOutput "`n[6/15] Checking critical dependencies..." $Blue
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw
    
    if ($packageJson -match '"expo-secure-store"') {
        Print-Test "expo-secure-store" "pass"
    } else {
        Print-Test "expo-secure-store" "fail" "Not found in package.json"
    }
    
    if ($packageJson -match '"expo-local-authentication"') {
        Print-Test "expo-local-authentication" "pass"
    } else {
        Print-Test "expo-local-authentication" "fail" "Not found in package.json"
    }
    
    if ($packageJson -match '"expo-router"') {
        Print-Test "expo-router" "pass"
    } else {
        Print-Test "expo-router" "fail" "Not found in package.json"
    }
} else {
    Print-Test "package.json" "fail" "package.json not found"
}

# Test 7: Check app.json iOS configuration
Write-ColorOutput "`n[7/15] Checking app.json iOS configuration..." $Blue
if (Test-Path "app.json") {
    $appJson = Get-Content "app.json" -Raw
    if ($appJson -match '"bundleIdentifier"' -and $appJson -match '"NSFaceIDUsageDescription"') {
        Print-Test "iOS configuration" "pass" "Bundle ID and permissions configured"
    } else {
        Print-Test "iOS configuration" "fail" "Missing iOS configuration in app.json"
    }
} else {
    Print-Test "app.json" "fail" "app.json not found"
}

# Test 8: Check babel.config.js path aliases
Write-ColorOutput "`n[8/15] Checking Babel path aliases..." $Blue
if (Test-Path "babel.config.js") {
    $babelConfig = Get-Content "babel.config.js" -Raw
    if ($babelConfig -match "@store" -and $babelConfig -match "@components" -and $babelConfig -match "@utils") {
        Print-Test "Babel aliases" "pass" "@store, @components, @utils configured"
    } else {
        Print-Test "Babel aliases" "fail" "Path aliases not configured in babel.config.js"
    }
} else {
    Print-Test "babel.config.js" "fail" "babel.config.js not found"
}

# Test 9: Check tsconfig.json path mappings
Write-ColorOutput "`n[9/15] Checking TypeScript path mappings..." $Blue
if (Test-Path "tsconfig.json") {
    $tsconfig = Get-Content "tsconfig.json" -Raw
    if ($tsconfig -match '"@store"' -and $tsconfig -match '"@components"' -and $tsconfig -match '"@utils"') {
        Print-Test "TypeScript paths" "pass" "Path mappings configured"
    } else {
        Print-Test "TypeScript paths" "fail" "Path mappings not configured in tsconfig.json"
    }
} else {
    Print-Test "tsconfig.json" "fail" "tsconfig.json not found"
}

# Test 10: Check metro.config.js
Write-ColorOutput "`n[10/15] Checking Metro bundler configuration..." $Blue
if (Test-Path "metro.config.js") {
    $metroConfig = Get-Content "metro.config.js" -Raw
    if ($metroConfig -match "extraNodeModules") {
        Print-Test "Metro config" "pass" "Path aliases configured"
    } else {
        Print-Test "Metro config" "fail" "extraNodeModules not configured"
    }
} else {
    Print-Test "metro.config.js" "fail" "metro.config.js not found"
}

# Test 11: Check critical source files
Write-ColorOutput "`n[11/15] Checking critical source files..." $Blue
$criticalFiles = @(
    "src\store\index.ts",
    "src\utils\secureStorage.ts",
    "src\utils\biometric.ts",
    "src\config\ios.ts",
    "app\_layout.tsx",
    "app\(auth)\login.tsx",
    "app\(tabs)\student\index.tsx"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Print-Test $file "pass"
    } else {
        Print-Test $file "fail" "File not found"
    }
}

# Test 12: Check iOS-specific utilities
Write-ColorOutput "`n[12/15] Checking iOS utilities..." $Blue
if (Test-Path "src\utils\iosInit.ts") {
    Print-Test "iosInit.ts" "pass"
} else {
    Print-Test "iosInit.ts" "fail" "iOS initialization utility not found"
}

if (Test-Path "src\utils\backgroundSync.ts") {
    Print-Test "backgroundSync.ts" "pass"
} else {
    Print-Test "backgroundSync.ts" "fail" "Background sync utility not found"
}

# Test 13: Check component exports
Write-ColorOutput "`n[13/15] Checking component exports..." $Blue
if (Test-Path "src\components\index.ts") {
    $componentIndex = Get-Content "src\components\index.ts" -Raw
    if ($componentIndex -match "Loading") {
        Print-Test "Component exports" "pass" "Core components exported"
    } else {
        Print-Test "Component exports" "fail" "Loading component not exported"
    }
} else {
    Print-Test "Component exports" "fail" "src\components\index.ts not found"
}

# Test 14: Check constants
Write-ColorOutput "`n[14/15] Checking constants..." $Blue
if (Test-Path "src\constants\index.ts") {
    $constants = Get-Content "src\constants\index.ts" -Raw
    if ($constants -match "STORAGE_KEYS") {
        Print-Test "Constants" "pass" "STORAGE_KEYS defined"
    } else {
        Print-Test "Constants" "fail" "STORAGE_KEYS not found"
    }
} else {
    Print-Test "Constants" "fail" "src\constants\index.ts not found"
}

# Test 15: Check assets
Write-ColorOutput "`n[15/15] Checking assets..." $Blue
if (Test-Path "assets") {
    if ((Test-Path "assets\icon.png") -and (Test-Path "assets\splash.png")) {
        Print-Test "Assets" "pass" "Icon and splash screen present"
    } else {
        Print-Test "Assets" "warn" "Some assets may be missing"
    }
} else {
    Print-Test "Assets" "fail" "assets directory not found"
}

# Summary
Write-ColorOutput "`n================================================" $Blue
Write-ColorOutput "    Test Summary" $Blue
Write-ColorOutput "================================================`n" $Blue

Write-Host "Total Tests:  $TestsTotal"
Write-ColorOutput "Passed:       $TestsPassed" $Green
Write-ColorOutput "Failed:       $TestsFailed" $Red
Write-Host ""

if ($TestsFailed -eq 0) {
    Write-ColorOutput "✓ All validation tests passed!" $Green
    Write-Host ""
    Write-ColorOutput "Next Steps:" $Blue
    Write-Host "1. Start the iOS app (requires macOS):"
    Write-ColorOutput "   npx expo start --ios" $Yellow
    Write-Host ""
    Write-Host "2. Or use Expo Go app:"
    Write-ColorOutput "   npx expo start" $Yellow
    Write-Host "   Scan QR code with Expo Go on your iOS device"
    Write-Host ""
    Write-Host "3. Test the following:"
    Write-Host "   • App launches without crashes"
    Write-Host "   • Login with: demo@example.com / Demo@123"
    Write-Host "   • Navigate through student dashboard"
    Write-Host "   • Test secure storage (close/reopen app)"
    Write-Host "   • Test biometric authentication"
    Write-Host ""
    Write-ColorOutput "See IOS_TEST_PLAN.md for detailed test scenarios" $Yellow
    exit 0
} else {
    Write-ColorOutput "✗ Some tests failed. Please fix the issues above." $Red
    Write-Host ""
    Write-Host "Common fixes:"
    Write-ColorOutput "• Run: npm install (if dependencies missing)" $Yellow
    Write-Host "• Check file paths are correct"
    Write-Host "• Ensure all required files exist"
    Write-Host ""
    exit 1
}
