#!/usr/bin/env node

/**
 * Deep Linking Configuration Validator
 * Validates that deep linking is properly configured in app.json
 */

const fs = require('fs');
const path = require('path');

const APP_JSON_PATH = path.join(__dirname, '..', 'app.json');
const EXPECTED_SCHEME = 'edutrack';
const EXPECTED_BUNDLE_ID = 'com.edutrack.app';
const EXPECTED_PACKAGE = 'com.edutrack.app';

console.log('🔍 Validating Deep Linking Configuration...\n');

// Check if app.json exists
if (!fs.existsSync(APP_JSON_PATH)) {
  console.error('❌ Error: app.json not found at', APP_JSON_PATH);
  process.exit(1);
}

// Read app.json
let appConfig;
try {
  const appJsonContent = fs.readFileSync(APP_JSON_PATH, 'utf8');
  appConfig = JSON.parse(appJsonContent);
} catch (error) {
  console.error('❌ Error: Failed to parse app.json:', error.message);
  process.exit(1);
}

const expo = appConfig.expo;
if (!expo) {
  console.error('❌ Error: No "expo" configuration found in app.json');
  process.exit(1);
}

let hasErrors = false;
let warnings = [];

// Validate scheme
console.log('Checking URL Scheme Configuration...');
if (expo.scheme === EXPECTED_SCHEME) {
  console.log(`✅ URL scheme is correctly set to "${EXPECTED_SCHEME}"`);
} else {
  console.error(`❌ URL scheme is "${expo.scheme}", expected "${EXPECTED_SCHEME}"`);
  hasErrors = true;
}

// Validate iOS configuration
console.log('\nChecking iOS Configuration...');
if (expo.ios) {
  // Check bundle identifier
  if (expo.ios.bundleIdentifier === EXPECTED_BUNDLE_ID) {
    console.log(`✅ iOS bundle identifier is correctly set to "${EXPECTED_BUNDLE_ID}"`);
  } else {
    console.error(`❌ iOS bundle identifier is "${expo.ios.bundleIdentifier}", expected "${EXPECTED_BUNDLE_ID}"`);
    hasErrors = true;
  }

  // Check associated domains
  if (expo.ios.associatedDomains && Array.isArray(expo.ios.associatedDomains)) {
    const expectedDomains = [
      'applinks:edutrack.app',
      'applinks:*.edutrack.app'
    ];
    
    const hasAllDomains = expectedDomains.every(domain => 
      expo.ios.associatedDomains.includes(domain)
    );

    if (hasAllDomains) {
      console.log('✅ iOS associated domains are correctly configured');
      expo.ios.associatedDomains.forEach(domain => {
        console.log(`   - ${domain}`);
      });
    } else {
      console.error('❌ iOS associated domains are missing or incorrect');
      console.error('   Expected domains:', expectedDomains);
      console.error('   Found domains:', expo.ios.associatedDomains);
      hasErrors = true;
    }
  } else {
    console.error('❌ iOS associated domains not configured');
    hasErrors = true;
  }
} else {
  console.error('❌ iOS configuration not found');
  hasErrors = true;
}

// Validate Android configuration
console.log('\nChecking Android Configuration...');
if (expo.android) {
  // Check package name
  if (expo.android.package === EXPECTED_PACKAGE) {
    console.log(`✅ Android package is correctly set to "${EXPECTED_PACKAGE}"`);
  } else {
    console.error(`❌ Android package is "${expo.android.package}", expected "${EXPECTED_PACKAGE}"`);
    hasErrors = true;
  }

  // Check intent filters
  if (expo.android.intentFilters && Array.isArray(expo.android.intentFilters)) {
    console.log(`✅ Android intent filters are configured (${expo.android.intentFilters.length} filters)`);

    // Check for custom scheme intent filter
    const customSchemeFilter = expo.android.intentFilters.find(filter => 
      filter.data && filter.data.some(d => d.scheme === EXPECTED_SCHEME)
    );

    if (customSchemeFilter) {
      console.log(`   ✅ Custom scheme "${EXPECTED_SCHEME}" intent filter found`);
    } else {
      console.error(`   ❌ Custom scheme "${EXPECTED_SCHEME}" intent filter not found`);
      hasErrors = true;
    }

    // Check for HTTPS intent filter
    const httpsFilter = expo.android.intentFilters.find(filter => 
      filter.data && filter.data.some(d => d.scheme === 'https' && d.host === 'edutrack.app')
    );

    if (httpsFilter) {
      console.log('   ✅ HTTPS app links intent filter found');
      
      // Check autoVerify
      if (httpsFilter.autoVerify === true) {
        console.log('   ✅ autoVerify is enabled for app links');
      } else {
        warnings.push('⚠️  autoVerify is not enabled for HTTPS intent filter');
      }
    } else {
      console.error('   ❌ HTTPS app links intent filter not found');
      hasErrors = true;
    }

    // Check categories
    expo.android.intentFilters.forEach((filter, index) => {
      if (filter.category && Array.isArray(filter.category)) {
        const hasDefault = filter.category.includes('DEFAULT');
        const hasBrowsable = filter.category.includes('BROWSABLE');
        
        if (!hasDefault || !hasBrowsable) {
          warnings.push(`⚠️  Intent filter ${index + 1} missing DEFAULT or BROWSABLE category`);
        }
      }
    });
  } else {
    console.error('❌ Android intent filters not configured');
    hasErrors = true;
  }
} else {
  console.error('❌ Android configuration not found');
  hasErrors = true;
}

// Check for Expo Router plugin
console.log('\nChecking Expo Router Configuration...');
if (expo.plugins && Array.isArray(expo.plugins)) {
  const hasExpoRouter = expo.plugins.some(plugin => 
    plugin === 'expo-router' || (Array.isArray(plugin) && plugin[0] === 'expo-router')
  );
  
  if (hasExpoRouter) {
    console.log('✅ expo-router plugin is configured');
  } else {
    console.error('❌ expo-router plugin not found in plugins array');
    hasErrors = true;
  }
} else {
  console.error('❌ No plugins configured');
  hasErrors = true;
}

// Check for typed routes experiment
if (expo.experiments && expo.experiments.typedRoutes === true) {
  console.log('✅ Typed routes experiment is enabled');
} else {
  warnings.push('⚠️  Typed routes experiment is not enabled');
}

// Print warnings
if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(warning => console.log(warning));
}

// Final summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ Validation FAILED - Please fix the errors above');
  process.exit(1);
} else {
  console.log('✅ Deep linking configuration is valid!');
  console.log('\nNext steps:');
  console.log('1. Run iOS tests: ./scripts/test-ios-deep-links.sh');
  console.log('2. Run Android tests: ./scripts/test-android-deep-links.sh');
  console.log('3. Test on physical devices');
  console.log('4. See __tests__/DEEP_LINKING_TEST_GUIDE.md for detailed testing instructions');
  process.exit(0);
}
