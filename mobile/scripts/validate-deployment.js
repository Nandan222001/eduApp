#!/usr/bin/env node

/**
 * Deployment validation script
 * Validates that everything is configured correctly before deployment
 */

const fs = require('fs');
const path = require('path');

const validations = {
  passed: [],
  failed: [],
  warnings: [],
};

function validate(name, check, required = true) {
  try {
    const result = check();
    if (result) {
      validations.passed.push(name);
      return true;
    } else {
      if (required) {
        validations.failed.push(name);
      } else {
        validations.warnings.push(name);
      }
      return false;
    }
  } catch (error) {
    if (required) {
      validations.failed.push(`${name}: ${error.message}`);
    } else {
      validations.warnings.push(`${name}: ${error.message}`);
    }
    return false;
  }
}

console.log('🔍 Validating deployment configuration...\n');

// Check package.json
validate('package.json exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'package.json'));
});

validate('package.json has version', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  return !!pkg.version;
});

// Check app configuration
validate('app.json exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'app.json'));
});

validate('app.config.js exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'app.config.js'));
});

validate('eas.json exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'eas.json'));
});

validate('eas.json has valid structure', () => {
  const eas = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'eas.json'), 'utf8'));
  return eas.build && eas.build.development && eas.build.preview && eas.build.production;
});

// Check environment files
validate(
  '.env.development exists',
  () => {
    return fs.existsSync(path.join(__dirname, '..', '.env.development'));
  },
  false
);

validate(
  '.env.staging exists',
  () => {
    return fs.existsSync(path.join(__dirname, '..', '.env.staging'));
  },
  false
);

validate(
  '.env.production exists',
  () => {
    return fs.existsSync(path.join(__dirname, '..', '.env.production'));
  },
  false
);

// Check required environment variables
const requiredEnvVars = ['EXPO_PROJECT_ID', 'APP_ENV'];

const optionalEnvVars = [
  'SENTRY_DSN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'FIREBASE_API_KEY',
  'AMPLITUDE_API_KEY',
];

requiredEnvVars.forEach(varName => {
  validate(`Environment variable ${varName}`, () => {
    return !!process.env[varName];
  });
});

optionalEnvVars.forEach(varName => {
  validate(
    `Environment variable ${varName}`,
    () => {
      return !!process.env[varName];
    },
    false
  );
});

// Check dependencies
validate('node_modules exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'node_modules'));
});

validate('Required dependencies installed', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const requiredDeps = [
    'expo',
    'expo-updates',
    '@sentry/react-native',
    'sentry-expo',
    '@react-native-firebase/app',
    '@amplitude/analytics-react-native',
  ];

  return requiredDeps.every(dep => pkg.dependencies[dep] || pkg.devDependencies[dep]);
});

// Check Google Services files (based on APP_ENV)
const appEnv = process.env.APP_ENV || 'development';

if (appEnv === 'production') {
  validate(
    'google-services-prod.json exists',
    () => {
      return fs.existsSync(path.join(__dirname, '..', 'google-services-prod.json'));
    },
    false
  );

  validate(
    'GoogleService-Info-prod.plist exists',
    () => {
      return fs.existsSync(path.join(__dirname, '..', 'GoogleService-Info-prod.plist'));
    },
    false
  );
} else if (appEnv === 'staging') {
  validate(
    'google-services-staging.json exists',
    () => {
      return fs.existsSync(path.join(__dirname, '..', 'google-services-staging.json'));
    },
    false
  );

  validate(
    'GoogleService-Info-staging.plist exists',
    () => {
      return fs.existsSync(path.join(__dirname, '..', 'GoogleService-Info-staging.plist'));
    },
    false
  );
}

// Check scripts
validate('Release scripts exist', () => {
  return (
    fs.existsSync(path.join(__dirname, 'release-ios.js')) &&
    fs.existsSync(path.join(__dirname, 'release-android.js')) &&
    fs.existsSync(path.join(__dirname, 'release-full.js'))
  );
});

// Check documentation
validate(
  'DEPLOYMENT.md exists',
  () => {
    return fs.existsSync(path.join(__dirname, '..', 'DEPLOYMENT.md'));
  },
  false
);

// Print results
console.log('='.repeat(60));
console.log('\n✅ Passed Validations:');
validations.passed.forEach(item => console.log(`  ✓ ${item}`));

if (validations.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  validations.warnings.forEach(item => console.log(`  ! ${item}`));
}

if (validations.failed.length > 0) {
  console.log('\n❌ Failed Validations:');
  validations.failed.forEach(item => console.log(`  ✗ ${item}`));
}

console.log('\n' + '='.repeat(60));

// Summary
console.log('\nSummary:');
console.log(`  Passed: ${validations.passed.length}`);
console.log(`  Warnings: ${validations.warnings.length}`);
console.log(`  Failed: ${validations.failed.length}`);

if (validations.failed.length === 0) {
  console.log('\n🎉 All required validations passed!');
  console.log('\nYou can proceed with deployment.');
  if (validations.warnings.length > 0) {
    console.log('\n⚠️  Note: Address warnings for a complete setup.');
  }
  console.log('');
  process.exit(0);
} else {
  console.log('\n❌ Deployment validation failed!');
  console.log('\nPlease fix the failed validations before deploying.');
  console.log('');
  process.exit(1);
}
