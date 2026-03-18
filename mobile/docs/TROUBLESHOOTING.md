# Troubleshooting Guide

This guide helps developers and users resolve common issues with the EDU Mobile app.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Login and Authentication](#login-and-authentication)
- [Network and API Issues](#network-and-api-issues)
- [App Performance](#app-performance)
- [Push Notifications](#push-notifications)
- [File Upload/Download](#file-uploaddownload)
- [Offline Mode](#offline-mode)
- [Build and Deployment](#build-and-deployment)
- [Platform-Specific Issues](#platform-specific-issues)
- [Development Environment](#development-environment)

## Installation Issues

### Cannot Install App

**Problem**: App fails to install on device

**iOS Solutions**:
```bash
# 1. Check iOS version compatibility
# Minimum: iOS 13.0

# 2. Verify device storage
# Settings > General > iPhone Storage
# Ensure at least 500MB free space

# 3. Trust developer certificate
# Settings > General > VPN & Device Management
# Tap profile and select "Trust"

# 4. Reinstall via TestFlight
# Delete app, reinstall from TestFlight
```

**Android Solutions**:
```bash
# 1. Check Android version
# Minimum: Android 8.0 (API 26)

# 2. Enable installation from unknown sources
# Settings > Security > Unknown Sources

# 3. Clear Play Store cache
# Settings > Apps > Google Play Store > Storage > Clear Cache

# 4. Reinstall
adb uninstall com.edu.mobile
# Then reinstall via Play Store or APK
```

### App Crashes on Launch

**Problem**: App crashes immediately after opening

**Solutions**:

1. **Clear App Data** (Android):
   ```bash
   # Settings > Apps > EDU Mobile > Storage > Clear Data
   ```

2. **Reinstall App**:
   ```bash
   # Delete and reinstall from store
   ```

3. **Check Sentry Logs**:
   ```bash
   # For developers: Check Sentry dashboard for crash reports
   # Look for initialization errors
   ```

4. **Update OS**:
   ```bash
   # Ensure device OS is up to date
   ```

5. **Check Logs**:
   ```bash
   # iOS - Xcode Console
   # Android - logcat
   adb logcat | grep -i "edu.mobile"
   ```

### App Not Updating

**Problem**: New version doesn't install

**Solutions**:

1. **Force Close and Reopen Store**
2. **Check for OTA Updates**:
   ```bash
   # App should auto-update via Expo Updates
   # Force pull update by restarting app
   ```

3. **Manual Update**:
   ```bash
   # Uninstall old version
   # Install new version from store
   ```

## Login and Authentication

### Cannot Login

**Problem**: Login fails with valid credentials

**Solutions**:

1. **Check Network Connection**:
   ```bash
   # Ensure device is connected to internet
   # Try toggling WiFi/Mobile data
   ```

2. **Verify API Endpoint**:
   ```bash
   # Check if backend is reachable
   curl https://api.edu.app/health

   # For developers: Check .env file
   API_URL=https://api.edu.app
   ```

3. **Clear App Cache**:
   ```typescript
   // In Settings > Clear Cache
   // Or manually:
   await AsyncStorage.clear();
   await SecureStore.deleteItemAsync('access_token');
   ```

4. **Check Credentials**:
   ```bash
   # Ensure correct email and password
   # Try password reset if needed
   ```

5. **Backend Verification**:
   ```bash
   # Check if user exists in database
   # Verify account is active
   ```

### Token Expired Error

**Problem**: Constant "Session expired" messages

**Solutions**:

1. **Check Token Refresh**:
   ```typescript
   // Verify refresh token is being stored
   const refreshToken = await SecureStore.getItemAsync('refresh_token');
   console.log('Refresh token:', refreshToken);
   ```

2. **Force Logout and Login**:
   ```typescript
   // Completely clear auth state
   await authService.logout();
   // Login again
   ```

3. **Check Backend Token Expiry**:
   ```python
   # Backend settings
   ACCESS_TOKEN_EXPIRE_MINUTES = 30
   REFRESH_TOKEN_EXPIRE_DAYS = 7
   ```

### Biometric Auth Not Working

**Problem**: Face ID / Touch ID fails

**Solutions**:

1. **Check Permissions**:
   ```typescript
   import * as LocalAuthentication from 'expo-local-authentication';
   
   const hasHardware = await LocalAuthentication.hasHardwareAsync();
   const isEnrolled = await LocalAuthentication.isEnrolledAsync();
   
   console.log('Has biometric hardware:', hasHardware);
   console.log('Has enrolled biometrics:', isEnrolled);
   ```

2. **Re-enable Biometric Auth**:
   ```bash
   # Settings > Security > Biometric Authentication
   # Toggle off and on
   ```

3. **Check Device Settings**:
   ```bash
   # iOS: Settings > Face ID & Passcode
   # Android: Settings > Security > Biometric
   # Ensure biometric is set up
   ```

## Network and API Issues

### API Timeout Errors

**Problem**: Requests timeout frequently

**Solutions**:

1. **Increase Timeout**:
   ```typescript
   // src/api/client.ts
   const apiClient = axios.create({
     timeout: 60000, // Increase to 60 seconds
   });
   ```

2. **Check Network Speed**:
   ```bash
   # Test on different networks
   # WiFi vs Mobile data
   ```

3. **Backend Performance**:
   ```bash
   # Check backend logs for slow queries
   # Optimize database queries
   ```

4. **Reduce Payload Size**:
   ```typescript
   // Implement pagination
   const response = await api.get('/assignments', {
     params: { page: 1, limit: 20 }
   });
   ```

### Network Error: ERR_NETWORK

**Problem**: Cannot connect to backend

**Solutions**:

1. **Check Backend Status**:
   ```bash
   # Verify backend is running
   curl https://api.edu.app/health
   ```

2. **Check Network Connection**:
   ```bash
   # Toggle airplane mode
   # Restart WiFi/Mobile data
   ```

3. **Verify API URL**:
   ```bash
   # Check .env file
   API_URL=https://api.edu.app  # Correct
   # Not: http://localhost:8000  # Wrong for production
   ```

4. **Clear DNS Cache**:
   ```bash
   # iOS: Toggle airplane mode
   # Android: Settings > WiFi > Forget network > Reconnect
   ```

5. **Check Firewall**:
   ```bash
   # Ensure no firewall blocking requests
   # Check corporate network restrictions
   ```

### 401 Unauthorized Loop

**Problem**: Constant 401 errors, token refresh fails

**Solutions**:

1. **Check Token Refresh Logic**:
   ```typescript
   // Verify interceptor is not creating infinite loop
   if (!originalRequest._retry) {
     originalRequest._retry = true;
     // Refresh token logic
   }
   ```

2. **Force Re-login**:
   ```typescript
   await authStore.logout();
   // Navigate to login screen
   ```

3. **Check Backend Token Validation**:
   ```python
   # Ensure backend is validating tokens correctly
   # Check token secret key matches
   ```

## App Performance

### Slow App Loading

**Problem**: App takes too long to load

**Solutions**:

1. **Optimize Images**:
   ```bash
   # Compress images before upload
   # Use WebP format
   # Implement lazy loading
   ```

2. **Reduce Initial Data Load**:
   ```typescript
   // Load only essential data on launch
   // Defer non-critical data
   useEffect(() => {
     loadEssentialData();
     // Delay non-essential data
     setTimeout(loadSecondaryData, 1000);
   }, []);
   ```

3. **Enable Hermes** (Android):
   ```javascript
   // app.json
   {
     "android": {
       "enableHermes": true
     }
   }
   ```

4. **Clear Cache**:
   ```typescript
   await AsyncStorage.clear();
   ```

### High Memory Usage

**Problem**: App uses too much RAM

**Solutions**:

1. **Profile Memory Usage**:
   ```bash
   # iOS: Xcode Instruments
   # Android: Android Profiler
   ```

2. **Fix Memory Leaks**:
   ```typescript
   // Always cleanup in useEffect
   useEffect(() => {
     const subscription = someObservable.subscribe();
     
     return () => {
       subscription.unsubscribe(); // Cleanup
     };
   }, []);
   ```

3. **Optimize Images**:
   ```typescript
   // Use react-native-fast-image for better memory management
   import FastImage from 'react-native-fast-image';
   
   <FastImage
     source={{ uri: imageUrl }}
     resizeMode={FastImage.resizeMode.contain}
   />
   ```

4. **Limit List Items**:
   ```typescript
   <FlatList
     data={items}
     maxToRenderPerBatch={10}
     windowSize={5}
     removeClippedSubviews={true}
   />
   ```

### Laggy Scrolling

**Problem**: List scrolling is not smooth

**Solutions**:

1. **Use FlatList Optimizations**:
   ```typescript
   <FlatList
     data={items}
     renderItem={renderItem}
     keyExtractor={item => item.id.toString()}
     getItemLayout={(data, index) => ({
       length: ITEM_HEIGHT,
       offset: ITEM_HEIGHT * index,
       index,
     })}
     removeClippedSubviews={true}
     maxToRenderPerBatch={10}
     windowSize={5}
   />
   ```

2. **Memoize Components**:
   ```typescript
   const AssignmentCard = React.memo(({ assignment }) => {
     // Component code
   });
   ```

3. **Avoid Inline Functions**:
   ```typescript
   // ❌ Bad
   onPress={() => handlePress(item.id)}
   
   // ✅ Good
   const handlePressCallback = useCallback(() => {
     handlePress(item.id);
   }, [item.id]);
   
   onPress={handlePressCallback}
   ```

## Push Notifications

### Not Receiving Notifications

**Problem**: Push notifications don't arrive

**Solutions**:

1. **Check Notification Permissions**:
   ```typescript
   import * as Notifications from 'expo-notifications';
   
   const { status } = await Notifications.getPermissionsAsync();
   console.log('Notification permission:', status);
   
   if (status !== 'granted') {
     await Notifications.requestPermissionsAsync();
   }
   ```

2. **Verify Device Token**:
   ```typescript
   const token = await Notifications.getExpoPushTokenAsync();
   console.log('Push token:', token);
   // Ensure this is registered with backend
   ```

3. **Check Backend Notification Service**:
   ```bash
   # Verify notifications are being sent
   # Check backend logs
   ```

4. **Test Notification**:
   ```typescript
   // Send test notification
   await Notifications.scheduleNotificationAsync({
     content: {
       title: "Test",
       body: "Test notification",
     },
     trigger: null,
   });
   ```

5. **Check Device Settings**:
   ```bash
   # iOS: Settings > Notifications > EDU Mobile
   # Android: Settings > Apps > EDU Mobile > Notifications
   # Ensure notifications are enabled
   ```

### Notification Not Opening Correct Screen

**Problem**: Tapping notification doesn't navigate correctly

**Solutions**:

1. **Check Notification Data**:
   ```typescript
   // Ensure notification includes navigation data
   {
     title: "New Assignment",
     body: "Math homework is due",
     data: {
       screen: "AssignmentDetail",
       assignmentId: "123"
     }
   }
   ```

2. **Verify Navigation Handler**:
   ```typescript
   const handleNotificationResponse = (response) => {
     const { screen, ...params } = response.notification.request.content.data;
     
     if (screen && navigationRef.current) {
       navigationRef.current.navigate(screen, params);
     }
   };
   ```

## File Upload/Download

### File Upload Fails

**Problem**: Cannot upload files (assignments, documents)

**Solutions**:

1. **Check File Size**:
   ```typescript
   const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
   
   if (file.size > MAX_FILE_SIZE) {
     Alert.alert('Error', 'File too large. Max 10MB.');
     return;
   }
   ```

2. **Check File Permissions**:
   ```typescript
   import * as ImagePicker from 'expo-image-picker';
   
   const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
   if (status !== 'granted') {
     Alert.alert('Permission needed', 'Please grant permission to access files');
   }
   ```

3. **Verify Backend Endpoint**:
   ```bash
   # Test upload endpoint
   curl -X POST https://api.edu.app/api/v1/submissions \
     -H "Authorization: Bearer TOKEN" \
     -F "file=@test.pdf"
   ```

4. **Check Network**:
   ```typescript
   // For large files, use multipart upload with progress
   const formData = new FormData();
   formData.append('file', {
     uri: fileUri,
     name: fileName,
     type: fileType,
   });
   
   await api.post('/upload', formData, {
     headers: { 'Content-Type': 'multipart/form-data' },
     onUploadProgress: (progressEvent) => {
       const progress = progressEvent.loaded / progressEvent.total;
       setUploadProgress(progress);
     },
   });
   ```

### File Download Stuck

**Problem**: File downloads don't complete

**Solutions**:

1. **Check Storage Permissions**:
   ```typescript
   import * as MediaLibrary from 'expo-media-library';
   
   const { status } = await MediaLibrary.requestPermissionsAsync();
   ```

2. **Verify Download Path**:
   ```typescript
   import * as FileSystem from 'expo-file-system';
   
   const fileUri = FileSystem.documentDirectory + fileName;
   console.log('Download path:', fileUri);
   ```

3. **Handle Large Files**:
   ```typescript
   const downloadResumable = FileSystem.createDownloadResumable(
     url,
     fileUri,
     {},
     (downloadProgress) => {
       const progress = downloadProgress.totalBytesWritten / 
                       downloadProgress.totalBytesExpectedToWrite;
       setDownloadProgress(progress);
     }
   );
   
   const result = await downloadResumable.downloadAsync();
   ```

## Offline Mode

### Offline Queue Not Syncing

**Problem**: Queued actions don't sync when online

**Solutions**:

1. **Check Network State Detection**:
   ```typescript
   import NetInfo from '@react-native-community/netinfo';
   
   NetInfo.addEventListener(state => {
     console.log('Connection type:', state.type);
     console.log('Is connected:', state.isConnected);
   });
   ```

2. **Manually Trigger Sync**:
   ```typescript
   import { syncService } from '@services/syncService';
   
   await syncService.syncAllQueues();
   ```

3. **Check Queue Storage**:
   ```typescript
   const queue = await AsyncStorage.getItem('offline_queue');
   console.log('Queued items:', JSON.parse(queue || '[]'));
   ```

4. **Clear Stuck Queue**:
   ```typescript
   // If queue is corrupted
   await AsyncStorage.removeItem('offline_queue');
   ```

### Data Not Available Offline

**Problem**: Previously loaded data not accessible offline

**Solutions**:

1. **Check Cache**:
   ```typescript
   const cachedData = await AsyncStorage.getItem('cached_assignments');
   console.log('Cached data:', cachedData);
   ```

2. **Verify Caching Logic**:
   ```typescript
   // Ensure data is cached after loading
   const response = await api.get('/assignments');
   await AsyncStorage.setItem('cached_assignments', JSON.stringify(response.data));
   ```

3. **Check Cache Expiry**:
   ```typescript
   const cacheTimestamp = await AsyncStorage.getItem('cache_timestamp');
   const isStale = Date.now() - parseInt(cacheTimestamp) > CACHE_TTL;
   ```

## Build and Deployment

### EAS Build Fails

**Problem**: Build fails on EAS

**Solutions**:

1. **Check Credentials**:
   ```bash
   eas credentials
   # Verify iOS/Android credentials are configured
   ```

2. **Check Build Logs**:
   ```bash
   eas build:list
   eas build:view [BUILD_ID]
   # Review error logs
   ```

3. **Validate eas.json**:
   ```json
   {
     "build": {
       "production": {
         "node": "18.x",
         "distribution": "store"
       }
     }
   }
   ```

4. **Clear Build Cache**:
   ```bash
   eas build --clear-cache
   ```

### App Store Rejection

**Problem**: App rejected by Apple

**Common Issues**:

1. **Missing Privacy Descriptions**:
   ```json
   // app.json
   {
     "ios": {
       "infoPlist": {
         "NSCameraUsageDescription": "Required for QR scanning",
         "NSPhotoLibraryUsageDescription": "Required for uploading files"
       }
     }
   }
   ```

2. **Guideline 2.1 - Performance**:
   ```bash
   # Ensure app doesn't crash
   # Fix all critical bugs
   # Test thoroughly before submission
   ```

3. **Guideline 4.3 - Spam**:
   ```bash
   # Ensure app provides unique value
   # Not duplicate of existing apps
   ```

## Platform-Specific Issues

### iOS-Specific

**Issue**: White screen on launch (iOS)
```bash
# Clear build folder
cd ios && pod install
cd ..
npx react-native run-ios --reset-cache
```

**Issue**: Code signing error
```bash
# Update provisioning profiles
eas credentials
# Select iOS > Distribution certificate
```

**Issue**: Push notifications not working
```bash
# Enable Push Notifications capability in Xcode
# Verify APNs certificate is valid
```

### Android-Specific

**Issue**: Gradle build fails
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

**Issue**: Release build crashes
```bash
# Enable Proguard rules
# android/app/proguard-rules.pro
-keep class com.facebook.react.** { *; }
```

**Issue**: App not installing on some devices
```bash
# Check minSdkVersion in build.gradle
minSdkVersion = 26  # Android 8.0
```

## Development Environment

### Metro Bundler Issues

**Problem**: Metro won't start or keeps crashing

**Solutions**:

1. **Clear Metro Cache**:
   ```bash
   npx react-native start --reset-cache
   ```

2. **Clear Watchman**:
   ```bash
   watchman watch-del-all
   ```

3. **Clear Node Modules**:
   ```bash
   rm -rf node_modules
   npm install
   ```

4. **Reset Everything**:
   ```bash
   npx react-native-clean-project
   ```

### TypeScript Errors

**Problem**: TypeScript compilation errors

**Solutions**:

1. **Clear TypeScript Cache**:
   ```bash
   rm -rf tsconfig.tsbuildinfo
   npx tsc --build --clean
   ```

2. **Check tsconfig.json**:
   ```json
   {
     "extends": "expo/tsconfig.base",
     "compilerOptions": {
       "strict": true,
       "skipLibCheck": true
     }
   }
   ```

3. **Install Type Definitions**:
   ```bash
   npm install --save-dev @types/react @types/react-native
   ```

### Dependency Conflicts

**Problem**: Package version conflicts

**Solutions**:

1. **Check Package Versions**:
   ```bash
   npm list [package-name]
   ```

2. **Use Resolutions** (package.json):
   ```json
   {
     "resolutions": {
       "@types/react": "18.2.0"
     }
   }
   ```

3. **Clear Lock File**:
   ```bash
   rm package-lock.json
   npm install
   ```

## Getting Help

If you can't resolve an issue:

1. **Check Documentation**: Review README and guides
2. **Search Issues**: Look for similar problems on GitHub
3. **Check Logs**: Review Sentry error reports
4. **Ask Team**: Post in development Slack channel
5. **Create Issue**: Open detailed bug report

## Useful Commands

```bash
# Clear all caches
npm run clean

# Reset iOS
cd ios && pod install && cd ..

# Reset Android
cd android && ./gradlew clean && cd ..

# Check health
expo doctor

# View logs
npx react-native log-ios
npx react-native log-android

# Debug mode
expo start --dev-client
```

## Additional Resources

- [Expo Troubleshooting](https://docs.expo.dev/troubleshooting/overview/)
- [React Native Debugging](https://reactnative.dev/docs/debugging)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)
- [Expo Forums](https://forums.expo.dev/)
