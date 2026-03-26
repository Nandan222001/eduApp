#!/usr/bin/env node

/**
 * Test script to verify web navigation with Expo Router
 * 
 * This script helps test the web version of the app specifically
 */

const fs = require('fs');
const path = require('path');

console.log('🌐 Testing Expo Router Web Navigation\n');
console.log('=' .repeat(80));

const appDir = path.join(__dirname, '..', 'app');
const srcDir = path.join(__dirname, '..', 'src');

let hasErrors = false;
const warnings = [];
const info = [];

// Test 1: Verify web-specific files
console.log('\n📋 Test 1: Verifying web-specific configuration...');

const htmlFile = path.join(appDir, '+html.tsx');
if (fs.existsSync(htmlFile)) {
  const content = fs.readFileSync(htmlFile, 'utf8');
  if (content.includes('ScrollViewStyleReset')) {
    console.log('✅ +html.tsx configured with ScrollViewStyleReset');
  } else {
    warnings.push('+html.tsx missing ScrollViewStyleReset');
  }
} else {
  warnings.push('+html.tsx not found (optional for web)');
}

const notFoundFile = path.join(appDir, '+not-found.tsx');
if (fs.existsSync(notFoundFile)) {
  console.log('✅ +not-found.tsx exists for 404 handling');
} else {
  warnings.push('+not-found.tsx not found (recommended)');
}

// Test 2: Check app.json web configuration
console.log('\n📋 Test 2: Verifying web configuration in app.json...');
const appJson = path.join(__dirname, '..', 'app.json');
if (fs.existsSync(appJson)) {
  const config = JSON.parse(fs.readFileSync(appJson, 'utf8'));
  
  if (config.expo && config.expo.web) {
    console.log('✅ Web configuration section exists');
    
    if (config.expo.web.bundler === 'metro') {
      console.log('✅ Using Metro bundler for web');
    } else {
      warnings.push(`Web bundler is ${config.expo.web.bundler || 'webpack'} (Metro recommended for Expo Router)`);
    }
    
    if (config.expo.web.favicon) {
      console.log(`✅ Favicon configured: ${config.expo.web.favicon}`);
    } else {
      warnings.push('Favicon not configured');
    }
  } else {
    warnings.push('No web configuration in app.json');
  }
  
  // Check for experiments.typedRoutes
  if (config.expo && config.expo.experiments && config.expo.experiments.typedRoutes) {
    console.log('✅ Typed routes enabled');
  } else {
    info.push('Typed routes not enabled (optional but recommended)');
  }
} else {
  hasErrors = true;
  console.log('❌ app.json not found');
}

// Test 3: Check for web-specific platform files
console.log('\n📋 Test 3: Checking for platform-specific files...');

function checkPlatformFile(basePath, fileName) {
  const webFile = path.join(basePath, fileName.replace('.tsx', '.web.tsx').replace('.ts', '.web.ts'));
  if (fs.existsSync(webFile)) {
    info.push(`Found web-specific override: ${path.relative(__dirname, webFile)}`);
  }
}

// Check common files that might have web overrides
const filesToCheck = [
  path.join(srcDir, 'utils', 'secureStorage'),
  path.join(srcDir, 'utils', 'deepLinking'),
  path.join(srcDir, 'components', 'Loading'),
];

filesToCheck.forEach(file => {
  checkPlatformFile(path.dirname(file), path.basename(file) + '.tsx');
});

console.log('✅ Platform-specific file check complete');

// Test 4: Verify route structure for web
console.log('\n📋 Test 4: Verifying route structure compatibility...');

const routes = {
  '/(auth)/login': path.join(appDir, '(auth)', 'login.tsx'),
  '/(auth)/register': path.join(appDir, '(auth)', 'register.tsx'),
  '/': path.join(appDir, 'index.tsx'),
};

Object.entries(routes).forEach(([route, filePath]) => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ Route ${route} -> ${path.basename(filePath)}`);
  } else {
    hasErrors = true;
    console.log(`❌ Route ${route} file missing: ${filePath}`);
  }
});

// Test 5: Check for web-incompatible code
console.log('\n📋 Test 5: Scanning for potential web compatibility issues...');

function scanFileForWebIssues(filePath, fileName) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for platform-specific APIs without Platform checks
  if (content.includes('expo-secure-store') && !content.includes('Platform.OS')) {
    issues.push('Uses expo-secure-store without Platform check (may fail on web)');
  }
  
  if (content.includes('expo-local-authentication') && !content.includes('Platform.OS')) {
    issues.push('Uses biometric authentication without Platform check');
  }
  
  if (content.includes('expo-notifications') && !content.includes('Platform.OS')) {
    issues.push('Uses notifications without Platform check');
  }
  
  // Check for background tasks
  if (content.includes('expo-task-manager') || content.includes('expo-background-fetch')) {
    issues.push('Uses background tasks (not supported on web)');
  }
  
  if (issues.length > 0) {
    console.log(`⚠️  ${fileName}:`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
}

// Scan key files
const keyFiles = [
  { path: path.join(appDir, '_layout.tsx'), name: 'app/_layout.tsx' },
  { path: path.join(appDir, '(auth)', 'login.tsx'), name: '(auth)/login.tsx' },
  { path: path.join(srcDir, 'screens', 'auth', 'LoginScreen.tsx'), name: 'LoginScreen.tsx' },
];

let foundWebIssues = false;
keyFiles.forEach(({ path: filePath, name }) => {
  const hadIssues = scanFileForWebIssues(filePath, name);
  if (hadIssues) foundWebIssues = true;
});

if (!foundWebIssues) {
  console.log('✅ No obvious web compatibility issues found');
}

// Test 6: Check navigation guards for web
console.log('\n📋 Test 6: Checking navigation logic...');

const rootLayout = path.join(appDir, '_layout.tsx');
if (fs.existsSync(rootLayout)) {
  const content = fs.readFileSync(rootLayout, 'utf8');
  
  if (content.includes('useRouter') && content.includes('useSegments')) {
    console.log('✅ Root layout uses Expo Router navigation hooks');
  } else {
    warnings.push('Root layout may not have navigation guards');
  }
  
  if (content.includes('isAuthenticated') && content.includes('replace')) {
    console.log('✅ Authentication-based navigation detected');
  } else {
    warnings.push('No authentication-based navigation found');
  }
  
  // Check for web-specific splash screen handling
  if (content.includes("Platform.OS !== 'web'") || content.includes('Platform.OS === "web"')) {
    console.log('✅ Root layout has platform-specific code paths');
  } else {
    info.push('Root layout may not handle web platform differences');
  }
}

// Test 7: Generate test URLs
console.log('\n📋 Test 7: Generating test URLs...');

const testUrls = [
  { url: 'http://localhost:8081', description: 'Root - should redirect based on auth' },
  { url: 'http://localhost:8081/(auth)/login', description: 'Login screen' },
  { url: 'http://localhost:8081/(auth)/register', description: 'Register screen' },
  { url: 'http://localhost:8081/(auth)/forgot-password', description: 'Forgot password' },
  { url: 'http://localhost:8081/profile', description: 'Protected route (requires auth)' },
];

console.log('\n📝 Test these URLs in your browser after starting the dev server:\n');
testUrls.forEach(({ url, description }) => {
  console.log(`  ${url}`);
  console.log(`  └─ ${description}\n`);
});

// Test 8: Check metro config for web
console.log('\n📋 Test 8: Verifying metro configuration for web...');
const metroConfig = path.join(__dirname, '..', 'metro.config.js');
if (fs.existsSync(metroConfig)) {
  const content = fs.readFileSync(metroConfig, 'utf8');
  
  if (content.includes('web')) {
    console.log('✅ Metro config includes web platform');
  } else {
    warnings.push('Metro config may not explicitly configure web platform');
  }
  
  if (content.includes('enhanceMiddleware') || content.includes('Content-Type')) {
    console.log('✅ Metro config has custom middleware for MIME types');
  } else {
    info.push('Metro config has no custom middleware (default should work)');
  }
}

// Print warnings and info
console.log('\n' + '='.repeat(80));

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:\n');
  warnings.forEach(warning => console.log(`  • ${warning}`));
}

if (info.length > 0) {
  console.log('\nℹ️  Information:\n');
  info.forEach(item => console.log(`  • ${item}`));
}

// Final instructions
console.log('\n' + '='.repeat(80));
console.log('\n📋 Manual Testing Checklist\n');

console.log('1. Start the development server:');
console.log('   npm start --web');
console.log('   OR');
console.log('   npx expo start --web\n');

console.log('2. Open http://localhost:8081 in your browser\n');

console.log('3. Verify the following:');
console.log('   ✓ App loads without console errors');
console.log('   ✓ Login screen appears (redirected from /)');
console.log('   ✓ URL shows /(auth)/login or similar');
console.log('   ✓ No module resolution errors in terminal');
console.log('   ✓ Redux store initializes correctly');
console.log('   ✓ No warnings about missing modules\n');

console.log('4. Check metro bundler terminal output for:');
console.log('   ✓ "LAYOUT_LOADED_DEBUG" log message');
console.log('   ✓ No circular dependency warnings');
console.log('   ✓ No module resolution errors');
console.log('   ✓ Bundle builds successfully\n');

console.log('5. Test navigation:');
console.log('   ✓ Click "Sign in with OTP instead" link');
console.log('   ✓ Click "Forgot Password?" link');
console.log('   ✓ Verify URL updates correctly');
console.log('   ✓ Use browser back/forward buttons\n');

console.log('6. Check browser console for:');
console.log('   ✓ Redux DevTools extension works (if installed)');
console.log('   ✓ Navigation logs appear');
console.log('   ✓ No error messages');
console.log('   ✓ Component renders correctly\n');

console.log('7. Test different URLs directly:');
testUrls.forEach(({ url, description }) => {
  console.log(`   ✓ ${url}`);
});
console.log();

if (hasErrors) {
  console.log('❌ Configuration has errors. Please fix them before testing.\n');
  process.exit(1);
} else {
  console.log('✅ Configuration looks good! Ready for testing.\n');
  process.exit(0);
}
