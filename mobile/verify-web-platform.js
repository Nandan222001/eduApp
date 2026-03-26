#!/usr/bin/env node

/**
 * Web Platform Readiness Verification Script
 * Verifies that the web platform is properly configured and ready for testing
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

let hasErrors = false;
let hasWarnings = false;
let checksPassed = 0;
let totalChecks = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
  checksPassed++;
  totalChecks++;
}

function error(message) {
  log(`❌ ${message}`, colors.red);
  hasErrors = true;
  totalChecks++;
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
  hasWarnings = true;
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function section(title) {
  log(`\n${colors.bold}${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`);
}

// Check if file exists
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    success(`${description} exists`);
    return true;
  } else {
    error(`${description} not found: ${filePath}`);
    return false;
  }
}

// Check file content for pattern
function checkFileContains(filePath, pattern, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(pattern) || (pattern instanceof RegExp && pattern.test(content))) {
      success(description);
      return true;
    } else {
      error(`${description} - pattern not found`);
      return false;
    }
  } catch (err) {
    error(`Failed to read ${filePath}: ${err.message}`);
    return false;
  }
}

// Main verification functions
function checkMetroConfig() {
  section('Metro Configuration (metro.config.js)');
  
  const metroPath = path.join(process.cwd(), 'metro.config.js');
  if (!checkFileExists(metroPath, 'metro.config.js')) return;
  
  checkFileContains(metroPath, 'enhanceMiddleware', 'MIME type middleware configured');
  checkFileContains(metroPath, 'extraNodeModules', 'Path aliases configured');
  checkFileContains(metroPath, 'application/javascript', 'JavaScript MIME type set');
  checkFileContains(metroPath, '@components', 'Component alias configured');
  checkFileContains(metroPath, '@utils', 'Utils alias configured');
  checkFileContains(metroPath, '@store', 'Store alias configured');
}

function checkAppConfig() {
  section('App Configuration (app.config.js)');
  
  const configPath = path.join(process.cwd(), 'app.config.js');
  if (!checkFileExists(configPath, 'app.config.js')) return;
  
  checkFileContains(configPath, 'bundler:', 'Web bundler configured');
  checkFileContains(configPath, 'metro', 'Metro bundler specified');
  checkFileContains(configPath, 'expo-router', 'Expo Router plugin included');
}

function checkBabelConfig() {
  section('Babel Configuration (babel.config.js)');
  
  const babelPath = path.join(process.cwd(), 'babel.config.js');
  if (!checkFileExists(babelPath, 'babel.config.js')) return;
  
  checkFileContains(babelPath, 'module-resolver', 'Module resolver plugin configured');
  checkFileContains(babelPath, '@components', 'Component alias in Babel');
  checkFileContains(babelPath, '@utils', 'Utils alias in Babel');
  checkFileContains(babelPath, '@store', 'Store alias in Babel');
}

function checkWebStubs() {
  section('Web Stubs for Native Modules');
  
  const stubsDir = path.join(process.cwd(), 'src', 'utils', 'stubs');
  
  if (!fs.existsSync(stubsDir)) {
    error('Web stubs directory not found: src/utils/stubs');
    return;
  }
  
  success('Web stubs directory exists');
  
  const requiredStubs = [
    'camera.web.ts',
    'barcode.web.ts',
    'auth.web.ts',
    'notifications.web.ts',
    'background.web.ts',
    'tasks.web.ts',
    'imagePicker.web.ts',
  ];
  
  requiredStubs.forEach(stub => {
    const stubPath = path.join(stubsDir, stub);
    checkFileExists(stubPath, `Stub: ${stub}`);
  });
}

function checkWebImplementations() {
  section('Web-Specific Implementations');
  
  const implementations = [
    { path: 'src/utils/iosInit.web.ts', name: 'iOS init web stub' },
    { path: 'src/utils/androidInit.web.ts', name: 'Android init web stub' },
    { path: 'src/utils/offlineInit.web.ts', name: 'Offline init web implementation' },
    { path: 'src/utils/biometrics.web.ts', name: 'Biometrics web implementation' },
    { path: 'src/utils/networkStatus.web.ts', name: 'Network status web implementation' },
    { path: 'src/utils/offlineQueue.web.ts', name: 'Offline queue web implementation' },
    { path: 'src/hooks/useNetworkStatus.web.ts', name: 'Network status hook web implementation' },
  ];
  
  implementations.forEach(impl => {
    const fullPath = path.join(process.cwd(), impl.path);
    checkFileExists(fullPath, impl.name);
  });
}

function checkWindowSafetyChecks() {
  section('Window Safety Checks (SSR Compatibility)');
  
  const filesToCheck = [
    'src/utils/offlineQueue.web.ts',
    'src/utils/networkStatus.web.ts',
    'src/utils/biometrics.web.ts',
    'src/hooks/useNetworkStatus.web.ts',
  ];
  
  filesToCheck.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      checkFileContains(
        fullPath,
        /typeof window !== ['"]undefined['"]/,
        `${file} - Window availability check`
      );
    }
  });
}

function checkAppStructure() {
  section('App Directory Structure');
  
  const appDir = path.join(process.cwd(), 'app');
  if (!checkFileExists(appDir, 'app directory')) return;
  
  checkFileExists(path.join(appDir, '_layout.tsx'), 'Root layout');
  checkFileExists(path.join(appDir, 'index.tsx'), 'Index screen');
  checkFileExists(path.join(appDir, '+html.tsx'), 'Web HTML config');
  checkFileExists(path.join(appDir, '(auth)', '_layout.tsx'), 'Auth layout');
  checkFileExists(path.join(appDir, '(auth)', 'login.tsx'), 'Login screen');
}

function checkPlatformChecks() {
  section('Platform Detection in Root Layout');
  
  const layoutPath = path.join(process.cwd(), 'app', '_layout.tsx');
  if (!checkFileExists(layoutPath, 'Root layout')) return;
  
  checkFileContains(
    layoutPath,
    /Platform\.OS !== ['"]web['"]/,
    'Platform check for web detection'
  );
  
  checkFileContains(
    layoutPath,
    'expo-splash-screen',
    'Conditional splash screen import'
  );
}

function checkEntryPoint() {
  section('Entry Point Configuration');
  
  const indexPath = path.join(process.cwd(), 'index.js');
  if (!checkFileExists(indexPath, 'index.js')) return;
  
  checkFileContains(
    indexPath,
    'expo-router/entry',
    'Expo Router entry point'
  );
}

function checkPackageJson() {
  section('Package Dependencies');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!checkFileExists(packagePath, 'package.json')) return;
  
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (pkg.dependencies?.['expo-router']) {
      success(`expo-router installed: ${pkg.dependencies['expo-router']}`);
    } else {
      error('expo-router not installed');
    }
    
    if (pkg.dependencies?.['react-native-web']) {
      success(`react-native-web installed: ${pkg.dependencies['react-native-web']}`);
    } else {
      error('react-native-web not installed');
    }
    
    if (pkg.scripts?.web) {
      success('Web script available in package.json');
    } else {
      warning('No web script in package.json');
    }
  } catch (err) {
    error(`Failed to parse package.json: ${err.message}`);
  }
}

function checkTestDocumentation() {
  section('Testing Documentation');
  
  checkFileExists(
    path.join(process.cwd(), 'WEB_TEST_INSTRUCTIONS.md'),
    'Comprehensive test instructions'
  );
  
  checkFileExists(
    path.join(process.cwd(), 'WEB_TEST_QUICK_REFERENCE.md'),
    'Quick reference guide'
  );
  
  checkFileExists(
    path.join(process.cwd(), 'WEB_PLATFORM_IMPLEMENTATION_SUMMARY.md'),
    'Implementation summary'
  );
}

function printSummary() {
  section('Verification Summary');
  
  const percentage = totalChecks > 0 ? Math.round((checksPassed / totalChecks) * 100) : 0;
  
  log(`\n${colors.bold}Checks Passed: ${checksPassed}/${totalChecks} (${percentage}%)${colors.reset}\n`);
  
  if (!hasErrors && !hasWarnings) {
    log(colors.bold + colors.green + 
        '╔════════════════════════════════════════════════════════════════════╗' + 
        colors.reset);
    log(colors.bold + colors.green + 
        '║  ✅ Web platform is ready for testing!                            ║' + 
        colors.reset);
    log(colors.bold + colors.green + 
        '╚════════════════════════════════════════════════════════════════════╝' + 
        colors.reset);
    log('');
    log(colors.cyan + 'Next steps:' + colors.reset);
    log('1. Start the dev server: ' + colors.bold + 'npx expo start --clear --web' + colors.reset);
    log('2. Open browser to: ' + colors.bold + 'http://localhost:8081' + colors.reset);
    log('3. Follow instructions in: ' + colors.bold + 'WEB_TEST_INSTRUCTIONS.md' + colors.reset);
    log('4. Use quick reference: ' + colors.bold + 'WEB_TEST_QUICK_REFERENCE.md' + colors.reset);
    log('');
  } else if (!hasErrors) {
    log(colors.bold + colors.yellow + 
        '╔════════════════════════════════════════════════════════════════════╗' + 
        colors.reset);
    log(colors.bold + colors.yellow + 
        '║  ⚠️  Web platform is mostly ready, but has some warnings          ║' + 
        colors.reset);
    log(colors.bold + colors.yellow + 
        '╚════════════════════════════════════════════════════════════════════╝' + 
        colors.reset);
    log('');
    log(colors.cyan + 'Review warnings above and fix if necessary.' + colors.reset);
    log('You can still proceed with testing, but some features may not work optimally.');
    log('');
  } else {
    log(colors.bold + colors.red + 
        '╔════════════════════════════════════════════════════════════════════╗' + 
        colors.reset);
    log(colors.bold + colors.red + 
        '║  ❌ Web platform has errors that need to be fixed                 ║' + 
        colors.reset);
    log(colors.bold + colors.red + 
        '╚════════════════════════════════════════════════════════════════════╝' + 
        colors.reset);
    log('');
    log(colors.red + 'Please fix the errors above before proceeding with testing.' + colors.reset);
    log('');
  }
}

// Main execution
function main() {
  log('');
  log(colors.bold + colors.magenta + 
      '╔════════════════════════════════════════════════════════════════════╗' + 
      colors.reset);
  log(colors.bold + colors.magenta + 
      '║           Web Platform Readiness Verification                      ║' + 
      colors.reset);
  log(colors.bold + colors.magenta + 
      '╚════════════════════════════════════════════════════════════════════╝' + 
      colors.reset);
  
  checkPackageJson();
  checkEntryPoint();
  checkAppConfig();
  checkMetroConfig();
  checkBabelConfig();
  checkWebStubs();
  checkWebImplementations();
  checkWindowSafetyChecks();
  checkAppStructure();
  checkPlatformChecks();
  checkTestDocumentation();
  
  printSummary();
  
  process.exit(hasErrors ? 1 : 0);
}

main();
