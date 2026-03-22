#!/bin/bash

# Deep Link Testing Script for Android
# Tests various deep link scenarios on Android Emulator or Device

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PACKAGE_NAME="com.edutrack.app"

echo -e "${BLUE}=== EduTrack Android Deep Link Testing ===${NC}\n"

# Function to test a deep link
test_deep_link() {
    local url=$1
    local description=$2
    
    echo -e "${YELLOW}Testing: ${description}${NC}"
    echo -e "URL: ${url}"
    
    adb shell am start -a android.intent.action.VIEW -d "$url" "$PACKAGE_NAME"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Deep link opened${NC}\n"
    else
        echo -e "${RED}✗ Failed to open deep link${NC}\n"
    fi
    
    sleep 2
}

# Check if ADB is available
if ! command -v adb &> /dev/null; then
    echo -e "${RED}Error: adb command not found${NC}"
    echo -e "${YELLOW}Please install Android SDK Platform-Tools${NC}\n"
    exit 1
fi

# Check if a device/emulator is connected
echo -e "${BLUE}Checking Android device/emulator...${NC}"
DEVICE_COUNT=$(adb devices | grep -v "List of devices" | grep "device" | wc -l)

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}No Android device or emulator is currently connected.${NC}"
    echo -e "${YELLOW}Please start the Android emulator or connect a device and run the app first.${NC}"
    echo -e "${YELLOW}Run: npm run android${NC}\n"
    exit 1
fi

echo -e "${GREEN}✓ Android device/emulator is connected${NC}\n"

# Test deep links
echo -e "${BLUE}=== Testing Assignment Deep Links ===${NC}\n"
test_deep_link "edutrack://assignments/123" "Assignment with ID 123"
test_deep_link "edutrack://assignments/456" "Assignment with ID 456"

echo -e "${BLUE}=== Testing Course Deep Links ===${NC}\n"
test_deep_link "edutrack://courses/math-101" "Math 101 Course"
test_deep_link "edutrack://courses/science-201" "Science 201 Course"

echo -e "${BLUE}=== Testing Notification Deep Links ===${NC}\n"
test_deep_link "edutrack://notifications/789" "Notification with ID 789"

echo -e "${BLUE}=== Testing Message Deep Links ===${NC}\n"
test_deep_link "edutrack://messages/abc123" "Message with ID abc123"

echo -e "${BLUE}=== Testing Profile Deep Link ===${NC}\n"
test_deep_link "edutrack://profile" "User Profile"

echo -e "${BLUE}=== Testing Settings Deep Link ===${NC}\n"
test_deep_link "edutrack://settings" "Settings"

echo -e "${BLUE}=== Testing Student Home Deep Link ===${NC}\n"
test_deep_link "edutrack://(tabs)/student" "Student Home"

echo -e "${BLUE}=== Testing Web Deep Links (Universal Links) ===${NC}\n"
test_deep_link "https://edutrack.app/assignments/999" "Web Link - Assignment 999"
test_deep_link "https://edutrack.app/courses/history-301" "Web Link - History 301"

echo -e "${BLUE}=== Testing Deep Links with Query Parameters ===${NC}\n"
test_deep_link "edutrack://assignments/123?tab=details" "Assignment with tab parameter"
test_deep_link "edutrack://courses/math-101?section=homework" "Course with section parameter"

echo -e "${BLUE}=== Testing Intent Filters ===${NC}\n"
echo -e "${YELLOW}Checking intent filters for ${PACKAGE_NAME}...${NC}"
adb shell dumpsys package "$PACKAGE_NAME" | grep -A 20 "android.intent.action.VIEW"
echo ""

echo -e "${GREEN}=== All Deep Link Tests Completed ===${NC}\n"
echo -e "${YELLOW}Note: Verify that the app navigated to the correct screens${NC}"
echo -e "${YELLOW}Check the app logcat for deep link handling messages:${NC}"
echo -e "${YELLOW}  adb logcat | grep -i edutrack${NC}\n"
