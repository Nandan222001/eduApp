#!/usr/bin/env node

/**
 * Pre-build validation script
 * Ensures environment is properly configured before building
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

function checkFile(filePath, required = true) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    if (required) {
      errors.push(`Missing required file: ${filePath}`);
    } else {
      warnings.push(`Missing optional file: ${filePath}`);
    }
    return false;
  }
  return true;
}

function checkEnvVar(varName, required = true) {
  if (!process.env[varName]) {
    if (required) {
      errors.push(`Missing required environment variable: ${varName}`);
    } else {
      warnings.push(`Missing optional environment variable: ${varName}`);
    }
    return false;
  }
  return true;
}

console.log('🔍 Running pre-build checks...\n');

// Check required files
console.log('📁 Checking files...');
checkFile('package.json');
checkFile('app.json');
checkFile('app.config.js');
checkFile('eas.json');

// Check environment-specific files based on APP_ENV
const appEnv = process.env.APP_ENV || 'development';
console.log(`\n📱 Environment: ${appEnv}`);

if (appEnv === 'production') {
  checkFile('google-services-prod.json');
  checkFile('GoogleService-Info-prod.plist');
} else if (appEnv === 'staging') {
  checkFile('google-services-staging.json');
  checkFile('GoogleService-Info-staging.plist');
} else {
  checkFile('google-services-dev.json', false);
  checkFile('GoogleService-Info-dev.plist', false);
}

// Check environment variables
console.log('\n🔐 Checking environment variables...');
checkEnvVar('EXPO_PROJECT_ID');
checkEnvVar('APP_ENV');

if (appEnv !== 'development') {
  checkEnvVar('SENTRY_DSN');
  checkEnvVar('SENTRY_ORG');
  checkEnvVar('SENTRY_PROJECT');
  checkEnvVar('SENTRY_AUTH_TOKEN', false);
}

// Check Firebase config
console.log('\n🔥 Checking Firebase configuration...');
checkEnvVar('FIREBASE_API_KEY', false);
checkEnvVar('FIREBASE_PROJECT_ID', false);

// Check analytics config
console.log('\n📊 Checking analytics configuration...');
checkEnvVar('AMPLITUDE_API_KEY', false);

// Check platform-specific requirements
if (process.argv.includes('--platform=ios') || process.argv.includes('--platform=all')) {
  console.log('\n🍎 Checking iOS requirements...');
  checkEnvVar('APPLE_ID', false);
  checkEnvVar('APPLE_TEAM_ID', false);
}

if (process.argv.includes('--platform=android') || process.argv.includes('--platform=all')) {
  console.log('\n🤖 Checking Android requirements...');
  if (appEnv === 'production') {
    checkFile('service-account-key.json', false);
  }
}

// Display results
console.log('\n' + '='.repeat(50));
if (errors.length > 0) {
  console.log('\n❌ Pre-build checks failed!\n');
  console.log('Errors:');
  errors.forEach(error => console.log(`  - ${error}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(warning => console.log(`  - ${warning}`));
}

if (errors.length === 0) {
  console.log('\n✅ Pre-build checks passed!');
  if (warnings.length > 0) {
    console.log('\n⚠️  Note: There are warnings, but the build can proceed.');
  }
  console.log('\n' + '='.repeat(50) + '\n');
  process.exit(0);
} else {
  console.log('\n' + '='.repeat(50) + '\n');
  process.exit(1);
}
