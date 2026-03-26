#!/bin/bash

# iOS Deep Link Testing Script
# Tests deep linking functionality on iOS simulator

set -e

echo "🍎 Testing iOS Deep Links..."
echo "================================"
echo ""

# Check if simulator is booted
BOOTED_DEVICE=$(xcrun simctl list devices | grep "Booted" | head -n 1)
if [ -z "$BOOTED_DEVICE" ]; then
    echo "❌ Error: No booted iOS simulator found"
    echo "Please start an iOS simulator first"
    exit 1
fi

echo "📱 Using device: $BOOTED_DEVICE"
echo ""

# Test 1: Assignment Deep Link
echo "Test 1/10: Assignment deep link (edutrack://assignments/123)"
xcrun simctl openurl booted edutrack://assignments/123
echo "✅ Sent assignment deep link"
sleep 2

# Test 2: Course Deep Link
echo ""
echo "Test 2/10: Course deep link (edutrack://courses/456)"
xcrun simctl openurl booted edutrack://courses/456
echo "✅ Sent course deep link"
sleep 2

# Test 3: Children Profile Deep Link
echo ""
echo "Test 3/10: Children profile deep link (edutrack://children/789)"
xcrun simctl openurl booted edutrack://children/789
echo "✅ Sent children profile deep link"
sleep 2

# Test 4: Messages Deep Link
echo ""
echo "Test 4/10: Messages deep link (edutrack://messages/101)"
xcrun simctl openurl booted edutrack://messages/101
echo "✅ Sent messages deep link"
sleep 2

# Test 5: Notifications Deep Link
echo ""
echo "Test 5/10: Notifications deep link (edutrack://notifications/202)"
xcrun simctl openurl booted edutrack://notifications/202
echo "✅ Sent notifications deep link"
sleep 2

# Test 6: Assignment with Query Parameters
echo ""
echo "Test 6/10: Assignment with query params"
xcrun simctl openurl booted "edutrack://assignments/123?source=notification&priority=high"
echo "✅ Sent assignment deep link with params"
sleep 2

# Test 7: Universal Link (HTTPS)
echo ""
echo "Test 7/10: Universal link (https://edutrack.app/assignments/123)"
xcrun simctl openurl booted https://edutrack.app/assignments/123
echo "✅ Sent universal link"
sleep 2

# Test 8: Subdomain Universal Link
echo ""
echo "Test 8/10: Subdomain universal link (https://www.edutrack.app/courses/456)"
xcrun simctl openurl booted https://www.edutrack.app/courses/456
echo "✅ Sent subdomain universal link"
sleep 2

# Test 9: Profile Deep Link
echo ""
echo "Test 9/10: Profile deep link (edutrack://profile)"
xcrun simctl openurl booted edutrack://profile
echo "✅ Sent profile deep link"
sleep 2

# Test 10: Settings Deep Link
echo ""
echo "Test 10/10: Settings deep link (edutrack://settings)"
xcrun simctl openurl booted edutrack://settings
echo "✅ Sent settings deep link"
sleep 2

echo ""
echo "================================"
echo "✅ All iOS deep link tests completed!"
echo ""
echo "Please verify in the simulator that:"
echo "  1. App opened for each deep link"
echo "  2. Correct screen was displayed"
echo "  3. Parameters were passed correctly"
echo "  4. Navigation worked as expected"
