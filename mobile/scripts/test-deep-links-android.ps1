# Deep Link Testing Script for Android (PowerShell)
# Tests various deep link scenarios on Android Emulator or Device

$PACKAGE_NAME = "com.edutrack.app"

Write-Host "=== EduTrack Android Deep Link Testing ===" -ForegroundColor Blue
Write-Host ""

# Function to test a deep link
function Test-DeepLink {
    param(
        [string]$Url,
        [string]$Description
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "URL: $Url"
    
    $result = & adb shell am start -a android.intent.action.VIEW -d $Url $PACKAGE_NAME 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Deep link opened" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to open deep link" -ForegroundColor Red
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2
}

# Check if ADB is available
try {
    $null = & adb version 2>&1
} catch {
    Write-Host "Error: adb command not found" -ForegroundColor Red
    Write-Host "Please install Android SDK Platform-Tools" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if a device/emulator is connected
Write-Host "Checking Android device/emulator..." -ForegroundColor Blue
$devices = & adb devices
$deviceCount = ($devices | Select-String "device$").Count

if ($deviceCount -eq 0) {
    Write-Host "No Android device or emulator is currently connected." -ForegroundColor Yellow
    Write-Host "Please start the Android emulator or connect a device and run the app first." -ForegroundColor Yellow
    Write-Host "Run: npm run android" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✓ Android device/emulator is connected" -ForegroundColor Green
Write-Host ""

# Test deep links
Write-Host "=== Testing Assignment Deep Links ===" -ForegroundColor Blue
Write-Host ""
Test-DeepLink "edutrack://assignments/123" "Assignment with ID 123"
Test-DeepLink "edutrack://assignments/456" "Assignment with ID 456"

Write-Host "=== Testing Course Deep Links ===" -ForegroundColor Blue
Write-Host ""
Test-DeepLink "edutrack://courses/math-101" "Math 101 Course"
Test-DeepLink "edutrack://courses/science-201" "Science 201 Course"

Write-Host "=== Testing Notification Deep Links ===" -ForegroundColor Blue
Write-Host ""
Test-DeepLink "edutrack://notifications/789" "Notification with ID 789"

Write-Host "=== Testing Message Deep Links ===" -ForegroundColor Blue
Write-Host ""
Test-DeepLink "edutrack://messages/abc123" "Message with ID abc123"

Write-Host "=== Testing Profile Deep Link ===" -ForegroundColor Blue
Write-Host ""
Test-DeepLink "edutrack://profile" "User Profile"

Write-Host "=== Testing Settings Deep Link ===" -ForegroundColor Blue
Write-Host ""
Test-DeepLink "edutrack://settings" "Settings"

Write-Host "=== Testing Student Home Deep Link ===" -ForegroundColor Blue
Write-Host ""
Test-DeepLink "edutrack://(tabs)/student" "Student Home"

Write-Host "=== Testing Web Deep Links (Universal Links) ===" -ForegroundColor Blue
Write-Host ""
Test-DeepLink "https://edutrack.app/assignments/999" "Web Link - Assignment 999"
Test-DeepLink "https://edutrack.app/courses/history-301" "Web Link - History 301"

Write-Host "=== Testing Deep Links with Query Parameters ===" -ForegroundColor Blue
Write-Host ""
Test-DeepLink "edutrack://assignments/123?tab=details" "Assignment with tab parameter"
Test-DeepLink "edutrack://courses/math-101?section=homework" "Course with section parameter"

Write-Host "=== Testing Intent Filters ===" -ForegroundColor Blue
Write-Host ""
Write-Host "Checking intent filters for $PACKAGE_NAME..." -ForegroundColor Yellow
& adb shell dumpsys package $PACKAGE_NAME | Select-String -Pattern "android.intent.action.VIEW" -Context 0,20
Write-Host ""

Write-Host "=== All Deep Link Tests Completed ===" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Verify that the app navigated to the correct screens" -ForegroundColor Yellow
Write-Host "Check the app logcat for deep link handling messages:" -ForegroundColor Yellow
Write-Host "  adb logcat | Select-String -Pattern edutrack" -ForegroundColor Yellow
Write-Host ""
