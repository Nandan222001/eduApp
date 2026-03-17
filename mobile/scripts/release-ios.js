#!/usr/bin/env node

/**
 * iOS Release Script
 * Automates the iOS build and submission process
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function exec(command, options = {}) {
  console.log(`\n🔄 Executing: ${command}\n`);
  try {
    const result = execSync(command, {
      stdio: 'inherit',
      ...options,
    });
    return result;
  } catch (error) {
    console.error(`\n❌ Command failed: ${command}\n`);
    throw error;
  }
}

function readPackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function updateVersion(type) {
  console.log(`\n📝 Updating version (${type})...\n`);
  exec(`npm version ${type} --no-git-tag-version`);
  const pkg = readPackageJson();
  return pkg.version;
}

async function main() {
  console.log('🚀 iOS Release Process Started\n');

  try {
    // Step 1: Choose build profile
    console.log('Select build profile:');
    console.log('1. Production (App Store)');
    console.log('2. Preview (TestFlight)');
    console.log('3. Development (Internal)');

    const profileChoice = await question('\nEnter choice (1-3): ');

    let profile, submitProfile;
    switch (profileChoice) {
      case '1':
        profile = 'production';
        submitProfile = 'production';
        break;
      case '2':
        profile = 'preview';
        submitProfile = 'beta';
        break;
      case '3':
        profile = 'development';
        submitProfile = null;
        break;
      default:
        console.log('Invalid choice, using production');
        profile = 'production';
        submitProfile = 'production';
    }

    // Step 2: Version bump
    if (profile === 'production') {
      console.log('\nVersion bump type:');
      console.log('1. Patch (1.0.0 -> 1.0.1)');
      console.log('2. Minor (1.0.0 -> 1.1.0)');
      console.log('3. Major (1.0.0 -> 2.0.0)');
      console.log('4. Skip version bump');

      const versionChoice = await question('\nEnter choice (1-4): ');

      if (versionChoice !== '4') {
        const versionType =
          {
            1: 'patch',
            2: 'minor',
            3: 'major',
          }[versionChoice] || 'patch';

        const newVersion = updateVersion(versionType);
        console.log(`\n✅ Version updated to ${newVersion}\n`);
      }
    }

    // Step 3: Run tests
    const runTests = await question('\nRun tests before building? (y/n): ');
    if (runTests.toLowerCase() === 'y') {
      console.log('\n🧪 Running tests...\n');
      exec('npm run test:ci');
      console.log('\n✅ Tests passed\n');
    }

    // Step 4: Run linter
    const runLint = await question('\nRun linter before building? (y/n): ');
    if (runLint.toLowerCase() === 'y') {
      console.log('\n🔍 Running linter...\n');
      exec('npm run lint');
      console.log('\n✅ Linting passed\n');
    }

    // Step 5: Build
    console.log(`\n🔨 Building iOS app (${profile} profile)...\n`);
    exec(`npm run build:${profile === 'production' ? 'prod' : profile}:ios`);
    console.log('\n✅ Build completed successfully\n');

    // Step 6: Upload source maps to Sentry
    if (profile !== 'development') {
      const uploadSourceMaps = await question('\nUpload source maps to Sentry? (y/n): ');
      if (uploadSourceMaps.toLowerCase() === 'y') {
        console.log('\n📤 Uploading source maps to Sentry...\n');
        exec('npx sentry-cli sourcemaps upload --org=$SENTRY_ORG --project=$SENTRY_PROJECT ./dist');
        console.log('\n✅ Source maps uploaded\n');
      }
    }

    // Step 7: Submit to App Store
    if (submitProfile) {
      const submit = await question(
        `\nSubmit to ${submitProfile === 'beta' ? 'TestFlight' : 'App Store'}? (y/n): `
      );
      if (submit.toLowerCase() === 'y') {
        console.log(
          `\n📤 Submitting to ${submitProfile === 'beta' ? 'TestFlight' : 'App Store'}...\n`
        );
        exec(`npm run submit:${submitProfile === 'beta' ? 'beta:' : ''}ios`);
        console.log('\n✅ Submission completed\n');
      }
    }

    // Step 8: Create OTA update
    if (profile !== 'development') {
      const createOTA = await question('\nCreate OTA update? (y/n): ');
      if (createOTA.toLowerCase() === 'y') {
        const message = await question('Update message: ');
        const channel = profile === 'production' ? 'production' : 'staging';
        console.log(`\n📡 Creating OTA update (${channel})...\n`);
        exec(`eas update --branch ${channel} --message "${message}"`);
        console.log('\n✅ OTA update created\n');
      }
    }

    // Step 9: Git tag
    if (profile === 'production') {
      const createTag = await question('\nCreate git tag? (y/n): ');
      if (createTag.toLowerCase() === 'y') {
        const pkg = readPackageJson();
        const tag = `ios-v${pkg.version}`;
        console.log(`\n🏷️  Creating git tag: ${tag}\n`);
        exec(`git tag ${tag}`);
        exec(`git push origin ${tag}`);
        console.log('\n✅ Git tag created\n');
      }
    }

    console.log('\n🎉 iOS Release Process Completed Successfully!\n');
  } catch (error) {
    console.error('\n❌ Release process failed:', error.message, '\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
