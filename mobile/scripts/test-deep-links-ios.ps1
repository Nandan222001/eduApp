# Deep Link Testing Script for iOS (PowerShell)
# Tests various deep link scenarios on iOS Simulator

param(
    [string]$DeviceId = "booted"
)

Write-Host "=== EduTrack iOS Deep Link Testing ===" -ForegroundColor Blue
Write-Host ""

# Function to test a deep link
function Test-DeepLink {
    param(
        [string]$Url,
        [string]$Description
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "URL: $Url"
    
    & xcrun simctl openurl $DeviceId $Url
    
    Write-Host "✓ Deep link opened" -ForegroundColor Green
    Write-Host ""
    Start-Sleep -Seconds 2
}

# Check if iOS simulator is running
Write-Host "Checking iOS simulator..." -ForegroundColor Blue
$simulatorStatus = & xcrun simctl list devices | Select-String "Booted"

if (-not $simulatorStatus) {
    Write-Host "No iOS simulator is currently running." -ForegroundColor Yellow
    Write-Host "Please start the iOS simulator and run the app first." -ForegroundColor Yellow
    Write-Host "Run: npm run ios" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✓ iOS simulator is running" -ForegroundColor Green
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

Write-Host "=== All Deep Link Tests Completed ===" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Verify that the app navigated to the correct screens" -ForegroundColor Yellow
Write-Host "Check the app console logs for deep link handling messages" -ForegroundColor Yellow
Write-Host ""
