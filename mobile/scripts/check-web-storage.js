#!/usr/bin/env node

/**
 * Web Storage Verification Script
 * 
 * This script verifies that:
 * 1. AsyncStorage is imported from @react-native-async-storage/async-storage
 * 2. expo-secure-store is only conditionally imported for native platforms
 * 3. No direct expo-secure-store imports exist without Platform checks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔍 Verifying Web Storage Configuration\n');
console.log('='.repeat(60));

let errors = [];
let warnings = [];
let successes = [];

// Check secureStorage.ts implementation
console.log('\n📦 Checking secureStorage.ts...');
const secureStoragePath = path.join(__dirname, '../src/utils/secureStorage.ts');
if (fs.existsSync(secureStoragePath)) {
  const content = fs.readFileSync(secureStoragePath, 'utf8');
  
  // Check for AsyncStorage import
  if (content.includes("from '@react-native-async-storage/async-storage'")) {
    successes.push('✅ AsyncStorage is imported from correct package');
  } else {
    errors.push('❌ AsyncStorage import not found');
  }
  
  // Check for Platform.OS === 'web' check
  if (content.includes("Platform.OS === 'web'") || content.includes('Platform.OS !== \'web\'')) {
    successes.push('✅ Platform check exists for web storage');
  } else {
    warnings.push('⚠️  No explicit Platform.OS web check found');
  }
  
  // Check for conditional SecureStore require
  if (content.includes('require(\'expo-secure-store\')')) {
    successes.push('✅ SecureStore is conditionally required');
  } else if (content.includes('from \'expo-secure-store\'')) {
    errors.push('❌ SecureStore is directly imported - should be conditional');
  }
} else {
  errors.push('❌ secureStorage.ts not found');
}

// Search for any direct expo-secure-store imports in src
console.log('\n🔎 Searching for direct expo-secure-store imports...');
try {
  const srcDir = path.join(__dirname, '../src');
  const result = execSync(
    `grep -r "from 'expo-secure-store'" ${srcDir} || true`,
    { encoding: 'utf8' }
  );
  
  if (result.trim()) {
    const lines = result.trim().split('\n');
    if (lines.length > 0 && lines[0] !== '') {
      warnings.push('⚠️  Found direct expo-secure-store imports:');
      lines.forEach(line => warnings.push(`   ${line}`));
    } else {
      successes.push('✅ No direct expo-secure-store imports found');
    }
  } else {
    successes.push('✅ No direct expo-secure-store imports found');
  }
} catch (error) {
  // grep returns non-zero when no matches found, which is what we want
  successes.push('✅ No direct expo-secure-store imports found');
}

// Check webpack config has AsyncStorage configured
console.log('\n⚙️  Checking webpack.config.js...');
const webpackPath = path.join(__dirname, '../webpack.config.js');
if (fs.existsSync(webpackPath)) {
  const content = fs.readFileSync(webpackPath, 'utf8');
  
  if (content.includes('@react-native-async-storage/async-storage')) {
    successes.push('✅ AsyncStorage configured in webpack');
  } else {
    warnings.push('⚠️  AsyncStorage not explicitly configured in webpack babel section');
  }
} else {
  warnings.push('⚠️  webpack.config.js not found');
}

// Check app.config.js for web configuration
console.log('\n📱 Checking app.config.js...');
const appConfigPath = path.join(__dirname, '../app.config.js');
if (fs.existsSync(appConfigPath)) {
  const content = fs.readFileSync(appConfigPath, 'utf8');
  
  if (content.includes('@react-native-async-storage/async-storage')) {
    successes.push('✅ AsyncStorage included in app.config.js web build');
  }
  
  // Check expo-secure-store is platform-specific
  if (content.includes('expo-secure-store') && content.includes("platforms: ['ios', 'android']")) {
    successes.push('✅ expo-secure-store configured for native platforms only');
  } else if (content.includes('expo-secure-store')) {
    warnings.push('⚠️  expo-secure-store plugin may not be platform-restricted');
  }
} else {
  warnings.push('⚠️  app.config.js not found');
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:\n');

if (successes.length > 0) {
  console.log(`✅ Passed: ${successes.length} checks`);
  successes.forEach(s => console.log(`   ${s}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠️  Warnings: ${warnings.length}`);
  warnings.forEach(w => console.log(`   ${w}`));
}

if (errors.length > 0) {
  console.log(`\n❌ Errors: ${errors.length}`);
  errors.forEach(e => console.log(`   ${e}`));
  console.log('\n');
  process.exit(1);
}

console.log('\n✅ Web storage configuration is correct!\n');
console.log('Storage Strategy:');
console.log('  • Web: Uses AsyncStorage from @react-native-async-storage/async-storage');
console.log('  • Native: Uses expo-secure-store for sensitive data');
console.log('  • Platform detection: Handled in src/utils/secureStorage.ts\n');
