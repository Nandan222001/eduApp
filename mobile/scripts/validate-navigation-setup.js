#!/usr/bin/env node

/**
 * Comprehensive validation script for Expo Router navigation
 * 
 * This script validates:
 * - File structure
 * - Configuration files
 * - Import statements
 * - Circular dependencies
 * - Module resolution
 * - Component exports
 * - Route definitions
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

console.log('\n' + colorize('╔═══════════════════════════════════════════════════════════════════╗', 'cyan'));
console.log(colorize('║         Expo Router Navigation Setup Validation                  ║', 'cyan'));
console.log(colorize('╚═══════════════════════════════════════════════════════════════════╝', 'cyan'));

const rootDir = path.join(__dirname, '..');
const appDir = path.join(rootDir, 'app');
const srcDir = path.join(rootDir, 'src');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  warnings: [],
  info: []
};

function pass(message) {
  console.log(colorize('✓', 'green') + ' ' + message);
  results.passed++;
}

function fail(message, error = null) {
  console.log(colorize('✗', 'red') + ' ' + message);
  results.failed++;
  if (error) {
    results.errors.push({ message, error });
  }
}

function warn(message) {
  console.log(colorize('⚠', 'yellow') + ' ' + message);
  results.warnings.push(message);
}

function info(message) {
  console.log(colorize('ℹ', 'blue') + ' ' + message);
  results.info.push(message);
}

function section(title) {
  console.log('\n' + colorize(title, 'bright'));
  console.log('─'.repeat(70));
}

// Validation Tests

section('1. File Structure Validation');

const requiredFiles = [
  { path: 'index.js', desc: 'Entry point' },
  { path: 'app/_layout.tsx', desc: 'Root layout' },
  { path: 'app/index.tsx', desc: 'Root index route' },
  { path: 'app/(auth)/_layout.tsx', desc: 'Auth layout' },
  { path: 'app/(auth)/login.tsx', desc: 'Login route' },
  { path: 'package.json', desc: 'Package configuration' },
  { path: 'babel.config.js', desc: 'Babel configuration' },
  { path: 'metro.config.js', desc: 'Metro configuration' },
  { path: 'tsconfig.json', desc: 'TypeScript configuration' },
];

requiredFiles.forEach(({ path: filePath, desc }) => {
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    pass(`${desc} exists: ${filePath}`);
  } else {
    fail(`${desc} missing: ${filePath}`);
  }
});

section('2. Component Validation');

const requiredComponents = [
  { path: 'src/components/Loading.tsx', name: 'Loading' },
  { path: 'src/components/OfflineDataRefresher.tsx', name: 'OfflineDataRefresher' },
  { path: 'src/components/NavigationDebugger.tsx', name: 'NavigationDebugger' },
  { path: 'src/components/Button.tsx', name: 'Button' },
  { path: 'src/components/Input.tsx', name: 'Input' },
  { path: 'src/components/index.ts', name: 'Component exports' },
];

requiredComponents.forEach(({ path: filePath, name }) => {
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    pass(`${name} component exists`);
  } else {
    fail(`${name} component missing: ${filePath}`);
  }
});

section('3. Store Validation');

const storeFiles = [
  { path: 'src/store/index.ts', name: 'Store configuration' },
  { path: 'src/store/hooks.ts', name: 'Store hooks' },
  { path: 'src/store/slices/authSlice.ts', name: 'Auth slice' },
];

storeFiles.forEach(({ path: filePath, name }) => {
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    pass(`${name} exists`);
  } else {
    fail(`${name} missing: ${filePath}`);
  }
});

section('4. Configuration Validation');

// Validate package.json
const packageJsonPath = path.join(rootDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.main === 'index.js') {
      pass('package.json main entry is correct');
    } else {
      fail(`package.json main entry is incorrect: ${packageJson.main}`);
    }
    
    const requiredDeps = [
      'expo-router',
      'react-redux',
      '@reduxjs/toolkit',
      'redux-persist',
      'expo',
      'react',
      'react-native'
    ];
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep]) {
        pass(`Dependency ${dep} installed`);
      } else {
        fail(`Missing dependency: ${dep}`);
      }
    });
  } catch (error) {
    fail('Failed to parse package.json', error.message);
  }
}

// Validate babel.config.js
const babelConfigPath = path.join(rootDir, 'babel.config.js');
if (fs.existsSync(babelConfigPath)) {
  const content = fs.readFileSync(babelConfigPath, 'utf8');
  
  if (content.includes('module-resolver')) {
    pass('Babel module-resolver configured');
  } else {
    fail('Babel module-resolver not configured');
  }
  
  if (content.includes('react-native-reanimated/plugin')) {
    pass('Reanimated plugin configured');
  } else {
    warn('Reanimated plugin not configured');
  }
  
  const requiredAliases = ['@components', '@screens', '@store', '@utils', '@config'];
  requiredAliases.forEach(alias => {
    if (content.includes(`'${alias}'`)) {
      pass(`Babel alias ${alias} configured`);
    } else {
      fail(`Babel alias ${alias} not configured`);
    }
  });
}

// Validate metro.config.js
const metroConfigPath = path.join(rootDir, 'metro.config.js');
if (fs.existsSync(metroConfigPath)) {
  const content = fs.readFileSync(metroConfigPath, 'utf8');
  
  if (content.includes('getDefaultConfig')) {
    pass('Metro uses Expo default config');
  } else {
    fail('Metro not using Expo default config');
  }
  
  if (content.includes('extraNodeModules')) {
    pass('Metro path aliases configured');
  } else {
    fail('Metro path aliases not configured');
  }
}

// Validate tsconfig.json
const tsConfigPath = path.join(rootDir, 'tsconfig.json');
if (fs.existsSync(tsConfigPath)) {
  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    
    if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
      pass('TypeScript path mappings configured');
      
      const requiredPaths = ['@components/*', '@screens/*', '@store/*', '@utils/*'];
      requiredPaths.forEach(pathAlias => {
        if (tsConfig.compilerOptions.paths[pathAlias]) {
          pass(`TypeScript path ${pathAlias} mapped`);
        } else {
          warn(`TypeScript path ${pathAlias} not mapped`);
        }
      });
    } else {
      fail('TypeScript path mappings not configured');
    }
  } catch (error) {
    fail('Failed to parse tsconfig.json', error.message);
  }
}

section('5. Route Configuration Validation');

const authRoutes = [
  'login.tsx',
  'register.tsx',
  'forgot-password.tsx',
  'reset-password.tsx',
  'otp-login.tsx',
  'otp-verify.tsx'
];

authRoutes.forEach(route => {
  const routePath = path.join(appDir, '(auth)', route);
  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    if (content.includes('export default') || content.includes('export {')) {
      pass(`Auth route ${route} properly exports component`);
    } else {
      fail(`Auth route ${route} does not export component`);
    }
  } else {
    fail(`Auth route ${route} missing`);
  }
});

section('6. Import Validation');

// Check root layout imports
const rootLayoutPath = path.join(appDir, '_layout.tsx');
if (fs.existsSync(rootLayoutPath)) {
  const content = fs.readFileSync(rootLayoutPath, 'utf8');
  
  const requiredImports = [
    { name: 'expo-router', pattern: /from ['"]expo-router['"]/ },
    { name: 'react-redux', pattern: /from ['"]react-redux['"]/ },
    { name: '@store', pattern: /from ['"]@store['"]/ },
    { name: '@components', pattern: /from ['"]@components['"]/ },
  ];
  
  requiredImports.forEach(({ name, pattern }) => {
    if (pattern.test(content)) {
      pass(`Root layout imports ${name}`);
    } else {
      fail(`Root layout missing import: ${name}`);
    }
  });
  
  // Check for required hooks
  if (content.includes('useRouter') && content.includes('useSegments')) {
    pass('Root layout uses navigation hooks');
  } else {
    fail('Root layout missing navigation hooks');
  }
  
  // Check for authentication logic
  if (content.includes('isAuthenticated')) {
    pass('Root layout has authentication checks');
  } else {
    warn('Root layout may not have authentication checks');
  }
}

section('7. Web Compatibility Check');

// Check for web-specific files
const webFiles = [
  { path: 'app/+html.tsx', desc: 'HTML document configuration' },
  { path: 'app/+not-found.tsx', desc: '404 handler' },
];

webFiles.forEach(({ path: filePath, desc }) => {
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    pass(`${desc} exists for web`);
  } else {
    warn(`${desc} not found (optional): ${filePath}`);
  }
});

// Check app.json for web config
const appJsonPath = path.join(rootDir, 'app.json');
if (fs.existsSync(appJsonPath)) {
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    if (appJson.expo && appJson.expo.web) {
      pass('Web configuration exists in app.json');
      
      if (appJson.expo.web.bundler === 'metro') {
        pass('Using Metro bundler for web');
      } else {
        warn(`Web bundler is ${appJson.expo.web.bundler} (Metro recommended)`);
      }
    } else {
      warn('No web configuration in app.json');
    }
    
    if (appJson.expo && appJson.expo.plugins && 
        appJson.expo.plugins.includes('expo-router')) {
      pass('expo-router plugin configured');
    } else {
      info('expo-router plugin not explicitly configured (may use defaults)');
    }
  } catch (error) {
    fail('Failed to parse app.json', error.message);
  }
}

section('8. Circular Dependency Check');

function findImports(filePath) {
  if (!fs.existsSync(filePath)) return [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /from ['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  } catch (error) {
    return [];
  }
}

const keyFilesToCheck = [
  path.join(appDir, '_layout.tsx'),
  path.join(appDir, '(auth)', '_layout.tsx'),
  path.join(srcDir, 'components', 'index.ts'),
  path.join(srcDir, 'store', 'index.ts'),
];

let circularFound = false;
keyFilesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const imports = findImports(file);
    const relativePath = path.relative(rootDir, file);
    
    // Simple check: ensure components/index doesn't import from app
    if (relativePath.includes('components/index')) {
      const hasAppImport = imports.some(imp => imp.includes('app/') || imp.includes('../app'));
      if (hasAppImport) {
        fail(`Potential circular dependency in ${relativePath}`);
        circularFound = true;
      } else {
        pass(`No circular dependencies in ${relativePath}`);
      }
    }
  }
});

if (!circularFound) {
  pass('No obvious circular dependencies detected');
}

section('9. Utility Functions Check');

const utilFiles = [
  'src/utils/authService.ts',
  'src/utils/deepLinking.ts',
  'src/utils/secureStorage.ts',
];

utilFiles.forEach(file => {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    pass(`Utility ${path.basename(file)} exists`);
  } else {
    fail(`Utility ${path.basename(file)} missing`);
  }
});

section('10. Test Scripts Check');

const testScripts = [
  'scripts/test-expo-router.js',
  'scripts/test-web-navigation.js',
  'scripts/navigation-test-helper.html',
  'docs/TESTING_NAVIGATION.md',
];

testScripts.forEach(file => {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    pass(`Test resource ${file} exists`);
  } else {
    warn(`Test resource ${file} not found`);
  }
});

// Final Summary
console.log('\n' + colorize('═'.repeat(70), 'cyan'));
console.log(colorize('VALIDATION SUMMARY', 'bright'));
console.log(colorize('═'.repeat(70), 'cyan'));

console.log('\n' + colorize(`✓ Passed: ${results.passed}`, 'green'));
console.log(colorize(`✗ Failed: ${results.failed}`, 'red'));
console.log(colorize(`⚠ Warnings: ${results.warnings.length}`, 'yellow'));

if (results.failed > 0) {
  console.log('\n' + colorize('❌ VALIDATION FAILED', 'red'));
  console.log('\nErrors found:');
  results.errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err.message}`);
    if (err.error) {
      console.log(`     ${colorize(err.error, 'red')}`);
    }
  });
  
  console.log('\n' + colorize('Recommended actions:', 'yellow'));
  console.log('  1. Fix the errors listed above');
  console.log('  2. Run: npm install');
  console.log('  3. Run: npx expo start --clear');
  console.log('  4. Re-run this validation script\n');
  
  process.exit(1);
} else {
  console.log('\n' + colorize('✅ VALIDATION PASSED', 'green'));
  
  if (results.warnings.length > 0) {
    console.log('\n' + colorize('Warnings (optional improvements):', 'yellow'));
    results.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
  }
  
  console.log('\n' + colorize('Next steps:', 'cyan'));
  console.log('  1. Start dev server: npm start --web');
  console.log('  2. Open browser: http://localhost:8081');
  console.log('  3. Test navigation: open scripts/navigation-test-helper.html');
  console.log('  4. Check docs: docs/TESTING_NAVIGATION.md\n');
  
  process.exit(0);
}
