#!/usr/bin/env node

/**
 * iOS Setup Validation Script
 * 
 * This script validates that all iOS-specific features and configurations
 * are properly set up in the EduTrack mobile application.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[✗]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[!]${colors.reset} ${msg}`),
};

let errors = 0;
let warnings = 0;

// Validation functions
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log.success(`${description} exists`);
    return true;
  } else {
    log.error(`${description} not found: ${filePath}`);
    errors++;
    return false;
  }
}

function checkFileContains(filePath, pattern, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(pattern)) {
      log.success(description);
      return true;
    } else {
      log.error(`${description} - pattern not found: ${pattern}`);
      errors++;
      return false;
    }
  } catch (err) {
    log.error(`${description} - file read error: ${err.message}`);
    errors++;
    return false;
  }
}

function checkJSONProperty(filePath, propertyPath, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    
    const keys = propertyPath.split('.');
    let value = json;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        log.error(`${description} - property not found: ${propertyPath}`);
        errors++;
        return false;
      }
    }
    
    log.success(description);
    return true;
  } catch (err) {
    log.error(`${description} - error: ${err.message}`);
    errors++;
    return false;
  }
}

// Main validation
console.log('\n===========================================');
console.log('  iOS Setup Validation for EduTrack');
console.log('===========================================\n');

// 1. Check critical files
log.info('Checking critical files...');
checkFileExists('package.json', 'package.json');
checkFileExists('app.json', 'app.json');
checkFileExists('tsconfig.json', 'tsconfig.json');
checkFileExists('babel.config.js', 'babel.config.js');
checkFileExists('metro.config.js', 'metro.config.js');
checkFileExists('index.js', 'index.js');
console.log('');

// 2. Check app structure
log.info('Checking app structure...');
checkFileExists('app/_layout.tsx', 'Root layout');
checkFileExists('app/index.tsx', 'App entry point');
checkFileExists('app/(auth)/_layout.tsx', 'Auth layout');
checkFileExists('app/(auth)/login.tsx', 'Login screen');
checkFileExists('app/(tabs)/student/_layout.tsx', 'Student tabs layout');
checkFileExists('app/(tabs)/student/index.tsx', 'Student dashboard');
console.log('');

// 3. Check iOS-specific files
log.info('Checking iOS-specific implementation files...');
checkFileExists('src/utils/secureStorage.ts', 'Secure storage utility');
checkFileExists('src/utils/biometric.ts', 'Biometric utility');
checkFileExists('src/config/ios.ts', 'iOS configuration');
checkFileExists('IOS_SETUP.md', 'iOS setup documentation');
checkFileExists('IOS_FEATURES.md', 'iOS features documentation');
checkFileExists('QUICK_START_IOS.md', 'iOS quick start guide');
console.log('');

// 4. Check store setup
log.info('Checking Redux store setup...');
checkFileExists('src/store/index.ts', 'Store configuration');
checkFileExists('src/store/hooks.ts', 'Store hooks');
checkFileExists('src/store/slices/authSlice.ts', 'Auth slice');
console.log('');

// 5. Check path aliases in configurations
log.info('Checking path alias configurations...');
checkFileContains('babel.config.js', '@store', 'Babel @store alias');
checkFileContains('babel.config.js', '@components', 'Babel @components alias');
checkFileContains('babel.config.js', '@utils', 'Babel @utils alias');
checkFileContains('tsconfig.json', '"@store":', 'TypeScript @store path');
checkFileContains('tsconfig.json', '"@components":', 'TypeScript @components path');
checkFileContains('tsconfig.json', '"@utils":', 'TypeScript @utils path');
checkFileContains('metro.config.js', '@store', 'Metro @store resolver');
checkFileContains('metro.config.js', '@components', 'Metro @components resolver');
console.log('');

// 6. Check dependencies
log.info('Checking iOS dependencies...');
checkJSONProperty('package.json', 'dependencies.expo-secure-store', 'expo-secure-store dependency');
checkJSONProperty('package.json', 'dependencies.expo-local-authentication', 'expo-local-authentication dependency');
checkJSONProperty('package.json', 'dependencies.expo-router', 'expo-router dependency');
checkJSONProperty('package.json', 'dependencies.@reduxjs/toolkit', '@reduxjs/toolkit dependency');
checkJSONProperty('package.json', 'dependencies.react-redux', 'react-redux dependency');
console.log('');

// 7. Check iOS configuration in app.json
log.info('Checking iOS configuration in app.json...');
checkJSONProperty('app.json', 'expo.ios.bundleIdentifier', 'iOS bundle identifier');
checkJSONProperty('app.json', 'expo.ios.infoPlist.NSFaceIDUsageDescription', 'Face ID permission');
checkJSONProperty('app.json', 'expo.ios.infoPlist.NSCameraUsageDescription', 'Camera permission');
checkJSONProperty('app.json', 'expo.plugins', 'Expo plugins array');

// Check if plugins include required ones
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const plugins = appJson.expo.plugins || [];
  
  if (plugins.includes('expo-secure-store')) {
    log.success('expo-secure-store plugin configured');
  } else {
    log.warn('expo-secure-store plugin not in app.json (may be auto-linked)');
    warnings++;
  }
  
  if (plugins.includes('expo-local-authentication')) {
    log.success('expo-local-authentication plugin configured');
  } else {
    log.warn('expo-local-authentication plugin not in app.json (may be auto-linked)');
    warnings++;
  }
  
  if (plugins.includes('expo-router')) {
    log.success('expo-router plugin configured');
  } else {
    log.warn('expo-router plugin not in app.json (may be auto-linked)');
    warnings++;
  }
} catch (err) {
  log.error(`Error checking plugins: ${err.message}`);
  errors++;
}
console.log('');

// 8. Check component exports
log.info('Checking component exports...');
checkFileExists('src/components/index.ts', 'Components index');
checkFileExists('src/components/Loading.tsx', 'Loading component');
checkFileExists('src/components/Button.tsx', 'Button component');
checkFileExists('src/components/Input.tsx', 'Input component');
checkFileExists('src/components/Card.tsx', 'Card component');
console.log('');

// 9. Check student components
log.info('Checking student components...');
checkFileExists('src/components/student/WelcomeCard.tsx', 'WelcomeCard component');
checkFileExists('src/components/student/index.ts', 'Student components index');
console.log('');

// 10. Check API setup
log.info('Checking API setup...');
checkFileExists('src/api/client.ts', 'API client');
checkFileExists('src/api/authApi.ts', 'Auth API');
checkFileExists('src/api/student.ts', 'Student API');
console.log('');

// 11. Check constants
log.info('Checking constants...');
checkFileExists('src/constants/index.ts', 'Constants file');
checkFileContains('src/constants/index.ts', 'STORAGE_KEYS', 'Storage keys constant');
checkFileContains('src/constants/index.ts', 'COLORS', 'Colors constant');
console.log('');

// 12. Check test files
log.info('Checking test files...');
checkFileExists('__tests__/ios-integration.test.ts', 'iOS integration tests');
console.log('');

// Summary
console.log('===========================================');
console.log('  Validation Summary');
console.log('===========================================\n');

if (errors === 0 && warnings === 0) {
  log.success('All validations passed! iOS setup is complete. ✨');
  console.log('\n✓ expo-secure-store configured');
  console.log('✓ expo-local-authentication configured');
  console.log('✓ Path aliases set up');
  console.log('✓ Expo Router configured');
  console.log('✓ All required files present');
  console.log('\nNext step: Run `npx expo start --ios` to test the app');
  process.exit(0);
} else {
  if (errors > 0) {
    log.error(`Found ${errors} error(s)`);
  }
  if (warnings > 0) {
    log.warn(`Found ${warnings} warning(s)`);
  }
  console.log('\nPlease fix the errors above before proceeding.');
  console.log('See IOS_SETUP.md for detailed setup instructions.');
  process.exit(1);
}
