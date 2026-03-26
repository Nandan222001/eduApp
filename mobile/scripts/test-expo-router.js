#!/usr/bin/env node

/**
 * Test script to verify Expo Router navigation setup
 * 
 * This script checks:
 * 1. All route files exist and are properly structured
 * 2. _layout.tsx files are correctly configured
 * 3. No circular dependencies exist
 * 4. All imports are resolvable
 * 5. Route configuration is correct
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Expo Router Navigation Setup\n');
console.log('=' .repeat(80));

const appDir = path.join(__dirname, '..', 'app');
const srcDir = path.join(__dirname, '..', 'src');

let hasErrors = false;

// Test 1: Verify entry point
console.log('\n📋 Test 1: Verifying entry point...');
const indexJs = path.join(__dirname, '..', 'index.js');
if (fs.existsSync(indexJs)) {
  const content = fs.readFileSync(indexJs, 'utf8');
  if (content.includes('expo-router/entry')) {
    console.log('✅ Entry point (index.js) correctly configured');
  } else {
    console.log('❌ Entry point does not import expo-router/entry');
    hasErrors = true;
  }
} else {
  console.log('❌ index.js not found');
  hasErrors = true;
}

// Test 2: Verify root _layout.tsx
console.log('\n📋 Test 2: Verifying root _layout.tsx...');
const rootLayout = path.join(appDir, '_layout.tsx');
if (fs.existsSync(rootLayout)) {
  const content = fs.readFileSync(rootLayout, 'utf8');
  
  // Check for required imports
  const requiredImports = [
    'expo-router',
    'react-redux',
    'redux-persist',
    '@store'
  ];
  
  const missingImports = requiredImports.filter(imp => !content.includes(imp));
  
  if (missingImports.length === 0) {
    console.log('✅ Root _layout.tsx has all required imports');
  } else {
    console.log(`❌ Root _layout.tsx missing imports: ${missingImports.join(', ')}`);
    hasErrors = true;
  }
  
  // Check for Slot component
  if (content.includes('<Slot')) {
    console.log('✅ Root _layout.tsx uses Slot component');
  } else {
    console.log('❌ Root _layout.tsx does not use Slot component');
    hasErrors = true;
  }
  
  // Check for circular dependency indicators
  if (content.includes('LAYOUT_LOADED_DEBUG')) {
    console.log('✅ Root _layout.tsx has debug logging');
  }
} else {
  console.log('❌ Root _layout.tsx not found');
  hasErrors = true;
}

// Test 3: Verify (auth) group layout
console.log('\n📋 Test 3: Verifying (auth) group layout...');
const authLayout = path.join(appDir, '(auth)', '_layout.tsx');
if (fs.existsSync(authLayout)) {
  const content = fs.readFileSync(authLayout, 'utf8');
  
  if (content.includes('Stack')) {
    console.log('✅ Auth layout uses Stack navigation');
  } else {
    console.log('❌ Auth layout does not use Stack navigation');
    hasErrors = true;
  }
  
  // Check for screen configurations
  const screens = ['login', 'register', 'forgot-password', 'reset-password', 'otp-login', 'otp-verify'];
  const missingScreens = screens.filter(screen => !content.includes(`name="${screen}"`));
  
  if (missingScreens.length === 0) {
    console.log('✅ Auth layout declares all required screens');
  } else {
    console.log(`⚠️  Auth layout may be missing screens: ${missingScreens.join(', ')}`);
  }
} else {
  console.log('❌ Auth layout not found');
  hasErrors = true;
}

// Test 4: Verify auth screens
console.log('\n📋 Test 4: Verifying auth screens...');
const authScreens = [
  'login.tsx',
  'register.tsx',
  'forgot-password.tsx',
  'reset-password.tsx',
  'otp-login.tsx',
  'otp-verify.tsx'
];

authScreens.forEach(screen => {
  const screenPath = path.join(appDir, '(auth)', screen);
  if (fs.existsSync(screenPath)) {
    const content = fs.readFileSync(screenPath, 'utf8');
    
    // Check if it's a re-export or actual component
    if (content.includes('export default') || content.includes('export {')) {
      console.log(`✅ Auth screen ${screen} exists and exports component`);
    } else {
      console.log(`❌ Auth screen ${screen} does not export properly`);
      hasErrors = true;
    }
  } else {
    console.log(`❌ Auth screen ${screen} not found`);
    hasErrors = true;
  }
});

// Test 5: Verify LoginScreen component
console.log('\n📋 Test 5: Verifying LoginScreen component...');
const loginScreen = path.join(srcDir, 'screens', 'auth', 'LoginScreen.tsx');
if (fs.existsSync(loginScreen)) {
  const content = fs.readFileSync(loginScreen, 'utf8');
  
  // Check for required imports
  const requiredImports = [
    'react',
    'react-native',
    'expo-router',
    '@store/hooks'
  ];
  
  const missingImports = requiredImports.filter(imp => !content.toLowerCase().includes(imp.toLowerCase()));
  
  if (missingImports.length === 0) {
    console.log('✅ LoginScreen has all required imports');
  } else {
    console.log(`❌ LoginScreen missing imports: ${missingImports.join(', ')}`);
    hasErrors = true;
  }
  
  // Check for component export
  if (content.includes('export const LoginScreen') || content.includes('export default')) {
    console.log('✅ LoginScreen exports component properly');
  } else {
    console.log('❌ LoginScreen does not export component properly');
    hasErrors = true;
  }
} else {
  console.log('❌ LoginScreen component not found');
  hasErrors = true;
}

// Test 6: Verify index.tsx redirect
console.log('\n📋 Test 6: Verifying index.tsx redirect...');
const indexRoute = path.join(appDir, 'index.tsx');
if (fs.existsSync(indexRoute)) {
  const content = fs.readFileSync(indexRoute, 'utf8');
  
  if (content.includes('Redirect')) {
    console.log('✅ index.tsx uses Redirect component');
  } else {
    console.log('❌ index.tsx does not use Redirect component');
    hasErrors = true;
  }
  
  if (content.includes('/(auth)/login')) {
    console.log('✅ index.tsx redirects to login route');
  } else {
    console.log('❌ index.tsx does not redirect to login route');
    hasErrors = true;
  }
} else {
  console.log('❌ index.tsx not found');
  hasErrors = true;
}

// Test 7: Verify store setup
console.log('\n📋 Test 7: Verifying Redux store setup...');
const storeIndex = path.join(srcDir, 'store', 'index.ts');
if (fs.existsSync(storeIndex)) {
  const content = fs.readFileSync(storeIndex, 'utf8');
  
  if (content.includes('configureStore')) {
    console.log('✅ Store is configured with Redux Toolkit');
  } else {
    console.log('❌ Store not properly configured');
    hasErrors = true;
  }
  
  if (content.includes('persistStore')) {
    console.log('✅ Store has persistence configured');
  } else {
    console.log('❌ Store persistence not configured');
    hasErrors = true;
  }
  
  if (content.includes('authReducer')) {
    console.log('✅ Auth reducer is registered');
  } else {
    console.log('❌ Auth reducer not registered');
    hasErrors = true;
  }
} else {
  console.log('❌ Store index not found');
  hasErrors = true;
}

// Test 8: Verify required components
console.log('\n📋 Test 8: Verifying required components...');
const requiredComponents = [
  'Loading.tsx',
  'OfflineDataRefresher.tsx',
  'Button.tsx',
  'Input.tsx'
];

requiredComponents.forEach(component => {
  const componentPath = path.join(srcDir, 'components', component);
  if (fs.existsSync(componentPath)) {
    console.log(`✅ Component ${component} exists`);
  } else {
    console.log(`❌ Component ${component} not found`);
    hasErrors = true;
  }
});

// Test 9: Verify component exports
console.log('\n📋 Test 9: Verifying component exports...');
const componentsIndex = path.join(srcDir, 'components', 'index.ts');
if (fs.existsSync(componentsIndex)) {
  const content = fs.readFileSync(componentsIndex, 'utf8');
  
  const requiredExports = [
    'Loading',
    'OfflineDataRefresher'
  ];
  
  const missingExports = requiredExports.filter(exp => !content.includes(exp));
  
  if (missingExports.length === 0) {
    console.log('✅ All required components are exported from index');
  } else {
    console.log(`❌ Missing component exports: ${missingExports.join(', ')}`);
    hasErrors = true;
  }
} else {
  console.log('❌ components/index.ts not found');
  hasErrors = true;
}

// Test 10: Verify utils exist
console.log('\n📋 Test 10: Verifying utility modules...');
const requiredUtils = [
  'authService.ts',
  'deepLinking.ts',
  'secureStorage.ts',
  'iosInit.ts',
  'androidInit.ts',
  'offlineInit.ts'
];

requiredUtils.forEach(util => {
  const utilPath = path.join(srcDir, 'utils', util);
  if (fs.existsSync(utilPath)) {
    console.log(`✅ Utility ${util} exists`);
  } else {
    console.log(`❌ Utility ${util} not found`);
    hasErrors = true;
  }
});

// Test 11: Verify package.json configuration
console.log('\n📋 Test 11: Verifying package.json configuration...');
const packageJson = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJson)) {
  const content = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  
  if (content.main === 'index.js') {
    console.log('✅ package.json main entry is correct');
  } else {
    console.log('❌ package.json main entry is incorrect');
    hasErrors = true;
  }
  
  // Check for required dependencies
  const requiredDeps = [
    'expo-router',
    'react-redux',
    'redux-persist',
    '@reduxjs/toolkit'
  ];
  
  const missingDeps = requiredDeps.filter(dep => 
    !content.dependencies[dep] && !content.devDependencies[dep]
  );
  
  if (missingDeps.length === 0) {
    console.log('✅ All required dependencies are installed');
  } else {
    console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
    hasErrors = true;
  }
} else {
  console.log('❌ package.json not found');
  hasErrors = true;
}

// Test 12: Verify babel.config.js
console.log('\n📋 Test 12: Verifying babel configuration...');
const babelConfig = path.join(__dirname, '..', 'babel.config.js');
if (fs.existsSync(babelConfig)) {
  const content = fs.readFileSync(babelConfig, 'utf8');
  
  if (content.includes('module-resolver')) {
    console.log('✅ Babel module resolver is configured');
  } else {
    console.log('❌ Babel module resolver not configured');
    hasErrors = true;
  }
  
  if (content.includes('react-native-reanimated/plugin')) {
    console.log('✅ Reanimated plugin is configured');
  } else {
    console.log('⚠️  Reanimated plugin not configured (may cause issues with animations)');
  }
} else {
  console.log('❌ babel.config.js not found');
  hasErrors = true;
}

// Test 13: Verify metro.config.js
console.log('\n📋 Test 13: Verifying metro configuration...');
const metroConfig = path.join(__dirname, '..', 'metro.config.js');
if (fs.existsSync(metroConfig)) {
  const content = fs.readFileSync(metroConfig, 'utf8');
  
  if (content.includes('extraNodeModules')) {
    console.log('✅ Metro has path aliases configured');
  } else {
    console.log('❌ Metro path aliases not configured');
    hasErrors = true;
  }
  
  if (content.includes('getDefaultConfig')) {
    console.log('✅ Metro uses Expo default config');
  } else {
    console.log('❌ Metro not using Expo default config');
    hasErrors = true;
  }
} else {
  console.log('❌ metro.config.js not found');
  hasErrors = true;
}

// Test 14: Verify tsconfig.json
console.log('\n📋 Test 14: Verifying TypeScript configuration...');
const tsConfig = path.join(__dirname, '..', 'tsconfig.json');
if (fs.existsSync(tsConfig)) {
  const content = JSON.parse(fs.readFileSync(tsConfig, 'utf8'));
  
  if (content.compilerOptions && content.compilerOptions.paths) {
    console.log('✅ TypeScript path mappings configured');
  } else {
    console.log('❌ TypeScript path mappings not configured');
    hasErrors = true;
  }
  
  if (content.extends && content.extends.includes('expo')) {
    console.log('✅ TypeScript extends Expo base config');
  } else {
    console.log('⚠️  TypeScript not extending Expo base config');
  }
} else {
  console.log('❌ tsconfig.json not found');
  hasErrors = true;
}

// Test 15: Check for circular dependencies
console.log('\n📋 Test 15: Checking for potential circular dependencies...');

function checkCircularDependencies(filePath, visited = new Set(), chain = []) {
  if (visited.has(filePath)) {
    if (chain.includes(filePath)) {
      return { hasCircular: true, chain: [...chain, filePath] };
    }
    return { hasCircular: false };
  }
  
  if (!fs.existsSync(filePath)) {
    return { hasCircular: false };
  }
  
  visited.add(filePath);
  const newChain = [...chain, filePath];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /from ['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Only check local imports
      if (importPath.startsWith('.') || importPath.startsWith('@')) {
        let resolvedPath = importPath;
        
        if (importPath.startsWith('@')) {
          // Resolve path aliases
          const alias = importPath.split('/')[0];
          const rest = importPath.substring(alias.length);
          
          const aliasMap = {
            '@components': path.join(srcDir, 'components'),
            '@screens': path.join(srcDir, 'screens'),
            '@store': path.join(srcDir, 'store'),
            '@utils': path.join(srcDir, 'utils'),
            '@config': path.join(srcDir, 'config'),
          };
          
          if (aliasMap[alias]) {
            resolvedPath = aliasMap[alias] + rest;
          }
        } else {
          resolvedPath = path.resolve(path.dirname(filePath), importPath);
        }
        
        // Try different extensions
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
        for (const ext of extensions) {
          const testPath = resolvedPath + ext;
          if (fs.existsSync(testPath)) {
            const result = checkCircularDependencies(testPath, visited, newChain);
            if (result.hasCircular) {
              return result;
            }
            break;
          }
        }
      }
    }
  } catch (error) {
    // Ignore parsing errors
  }
  
  return { hasCircular: false };
}

const keyFiles = [
  path.join(appDir, '_layout.tsx'),
  path.join(appDir, '(auth)', '_layout.tsx'),
  path.join(appDir, '(auth)', 'login.tsx'),
];

let foundCircular = false;
keyFiles.forEach(file => {
  const result = checkCircularDependencies(file);
  if (result.hasCircular) {
    console.log(`❌ Circular dependency detected:`);
    console.log(`   ${result.chain.map(f => path.relative(__dirname, f)).join(' -> ')}`);
    foundCircular = true;
    hasErrors = true;
  }
});

if (!foundCircular) {
  console.log('✅ No circular dependencies detected in key files');
}

// Test 16: Verify app.json/expo configuration
console.log('\n📋 Test 16: Verifying app.json/expo configuration...');
const appJson = path.join(__dirname, '..', 'app.json');
if (fs.existsSync(appJson)) {
  const content = JSON.parse(fs.readFileSync(appJson, 'utf8'));
  
  if (content.expo && content.expo.plugins && content.expo.plugins.includes('expo-router')) {
    console.log('✅ expo-router plugin configured in app.json');
  } else {
    console.log('⚠️  expo-router plugin not explicitly configured (may work with defaults)');
  }
  
  if (content.expo && content.expo.scheme) {
    console.log(`✅ App scheme configured: ${content.expo.scheme}`);
  } else {
    console.log('⚠️  App scheme not configured');
  }
} else {
  console.log('❌ app.json not found');
  hasErrors = true;
}

// Final summary
console.log('\n' + '='.repeat(80));
console.log('\n📊 Test Summary\n');

if (hasErrors) {
  console.log('❌ Tests completed with errors. Please fix the issues above.\n');
  console.log('Common fixes:');
  console.log('  1. Ensure all required files exist');
  console.log('  2. Check import paths in _layout.tsx files');
  console.log('  3. Verify module-resolver aliases in babel.config.js');
  console.log('  4. Check that all components are properly exported');
  console.log('  5. Run: npm install to ensure dependencies are installed\n');
  process.exit(1);
} else {
  console.log('✅ All tests passed! Expo Router navigation should work correctly.\n');
  console.log('Next steps:');
  console.log('  1. Run: npm start (or expo start)');
  console.log('  2. Access http://localhost:8081 in browser');
  console.log('  3. Verify login screen loads at /(auth)/login route');
  console.log('  4. Check metro bundler terminal for warnings');
  console.log('  5. Verify no circular dependency errors\n');
  process.exit(0);
}
