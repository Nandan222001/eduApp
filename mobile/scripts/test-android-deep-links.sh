#!/bin/bash

# Android Deep Link Testing Script
# Tests deep linking functionality on Android emulator/device

set -e

echo "🤖 Testing Android Deep Links..."
echo "================================"
echo ""

# Check if ADB is available
if ! command -v adb &> /dev/null; then
    echo "❌ Error: adb command not found"
    echo "Please install Android SDK Platform Tools"
    exit 1
fi

# Check if device is connected
DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device" | wc -l)
if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "❌ Error: No Android device/emulator found"
    echo "Please start an Android emulator or connect a device"
    exit 1
fi

DEVICE=$(adb devices | grep -v "List" | grep "device" | head -n 1 | awk '{print $1}')
echo "📱 Using device: $DEVICE"
echo ""

PACKAGE="com.edutrack.app"

# Test 1: Assignment Deep Link
echo "Test 1/10: Assignment deep link (edutrack://assignments/123)"
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123" $PACKAGE
echo "✅ Sent assignment deep link"
sleep 2

# Test 2: Course Deep Link
echo ""
echo "Test 2/10: Course deep link (edutrack://courses/456)"
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://courses/456" $PACKAGE
echo "✅ Sent course deep link"
sleep 2

# Test 3: Children Profile Deep Link
echo ""
echo "Test 3/10: Children profile deep link (edutrack://children/789)"
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://children/789" $PACKAGE
echo "✅ Sent children profile deep link"
sleep 2

# Test 4: Messages Deep Link
echo ""
echo "Test 4/10: Messages deep link (edutrack://messages/101)"
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://messages/101" $PACKAGE
echo "✅ Sent messages deep link"
sleep 2

# Test 5: Notifications Deep Link
echo ""
echo "Test 5/10: Notifications deep link (edutrack://notifications/202)"
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://notifications/202" $PACKAGE
echo "✅ Sent notifications deep link"
sleep 2

# Test 6: Assignment with Query Parameters
echo ""
echo "Test 6/10: Assignment with query params"
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://assignments/123?source=notification\&priority=high" $PACKAGE
echo "✅ Sent assignment deep link with params"
sleep 2

# Test 7: App Link (HTTPS)
echo ""
echo "Test 7/10: App link (https://edutrack.app/assignments/123)"
adb shell am start -W -a android.intent.action.VIEW -d "https://edutrack.app/assignments/123" $PACKAGE
echo "✅ Sent app link"
sleep 2

# Test 8: Subdomain App Link
echo ""
echo "Test 8/10: Subdomain app link (https://www.edutrack.app/courses/456)"
adb shell am start -W -a android.intent.action.VIEW -d "https://www.edutrack.app/courses/456" $PACKAGE
echo "✅ Sent subdomain app link"
sleep 2

# Test 9: Profile Deep Link
echo ""
echo "Test 9/10: Profile deep link (edutrack://profile)"
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://profile" $PACKAGE
echo "✅ Sent profile deep link"
sleep 2

# Test 10: Settings Deep Link
echo ""
echo "Test 10/10: Settings deep link (edutrack://settings)"
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://settings" $PACKAGE
echo "✅ Sent settings deep link"
sleep 2

echo ""
echo "================================"
echo "✅ All Android deep link tests completed!"
echo ""
echo "Please verify on the device/emulator that:"
echo "  1. App opened for each deep link"
echo "  2. Correct screen was displayed"
echo "  3. Parameters were passed correctly"
echo "  4. Navigation worked as expected"
echo ""
echo "To view logs, run:"
echo "  adb logcat | grep -i edutrack"
