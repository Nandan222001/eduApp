#!/bin/bash

# Deep Link Testing Script for iOS
# Tests various deep link scenarios on iOS Simulator

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== EduTrack iOS Deep Link Testing ===${NC}\n"

# Function to test a deep link
test_deep_link() {
    local url=$1
    local description=$2
    
    echo -e "${YELLOW}Testing: ${description}${NC}"
    echo -e "URL: ${url}"
    
    xcrun simctl openurl booted "$url"
    
    echo -e "${GREEN}✓ Deep link opened${NC}\n"
    sleep 2
}

# Check if iOS simulator is running
echo -e "${BLUE}Checking iOS simulator...${NC}"
SIMULATOR_STATUS=$(xcrun simctl list devices | grep "Booted" | wc -l)

if [ "$SIMULATOR_STATUS" -eq 0 ]; then
    echo -e "${YELLOW}No iOS simulator is currently running.${NC}"
    echo -e "${YELLOW}Please start the iOS simulator and run the app first.${NC}"
    echo -e "${YELLOW}Run: npm run ios${NC}\n"
    exit 1
fi

echo -e "${GREEN}✓ iOS simulator is running${NC}\n"

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

echo -e "${GREEN}=== All Deep Link Tests Completed ===${NC}\n"
echo -e "${YELLOW}Note: Verify that the app navigated to the correct screens${NC}"
echo -e "${YELLOW}Check the app console logs for deep link handling messages${NC}\n"
