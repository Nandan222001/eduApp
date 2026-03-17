#!/usr/bin/env node

/**
 * Full Release Script
 * Automates the complete release process for both iOS and Android
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
  console.log('🚀 Full Release Process Started (iOS + Android)\n');

  try {
    // Step 1: Choose build profile
    console.log('Select build profile:');
    console.log('1. Production (App Store + Google Play)');
    console.log('2. Preview (TestFlight + Internal Testing)');
    console.log('3. Development');

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

    // Step 3: Pre-build checks
    console.log('\n📋 Pre-build Checklist:\n');

    // Run tests
    const runTests = await question('Run tests? (y/n): ');
    if (runTests.toLowerCase() === 'y') {
      console.log('\n🧪 Running tests...\n');
      exec('npm run test:ci');
      console.log('\n✅ Tests passed\n');
    }

    // Run linter
    const runLint = await question('Run linter? (y/n): ');
    if (runLint.toLowerCase() === 'y') {
      console.log('\n🔍 Running linter...\n');
      exec('npm run lint');
      console.log('\n✅ Linting passed\n');
    }

    // Type check
    const runTypeCheck = await question('Run type check? (y/n): ');
    if (runTypeCheck.toLowerCase() === 'y') {
      console.log('\n🔍 Running type check...\n');
      exec('npm run type-check');
      console.log('\n✅ Type check passed\n');
    }

    // Step 4: Build both platforms
    console.log(`\n🔨 Building both platforms (${profile} profile)...\n`);

    const buildProfile = profile === 'production' ? 'prod' : profile;
    exec(`npm run build:${buildProfile}:all`);

    console.log('\n✅ Builds completed successfully\n');

    // Step 5: Upload source maps to Sentry
    if (profile !== 'development') {
      const uploadSourceMaps = await question('\nUpload source maps to Sentry? (y/n): ');
      if (uploadSourceMaps.toLowerCase() === 'y') {
        console.log('\n📤 Uploading source maps to Sentry...\n');
        exec('npx sentry-cli sourcemaps upload --org=$SENTRY_ORG --project=$SENTRY_PROJECT ./dist');
        console.log('\n✅ Source maps uploaded\n');
      }
    }

    // Step 6: Create OTA update
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

    // Step 7: Submit to stores
    if (submitProfile) {
      const submitToStores = await question('\nSubmit to app stores? (y/n): ');
      if (submitToStores.toLowerCase() === 'y') {
        // iOS submission
        const submitIOS = await question('Submit to iOS (App Store/TestFlight)? (y/n): ');
        if (submitIOS.toLowerCase() === 'y') {
          console.log('\n📤 Submitting to iOS...\n');
          exec(`npm run submit:${submitProfile === 'beta' ? 'beta:' : ''}ios`);
          console.log('\n✅ iOS submission completed\n');
        }

        // Android submission
        const submitAndroid = await question('Submit to Android (Google Play)? (y/n): ');
        if (submitAndroid.toLowerCase() === 'y') {
          console.log('\n📤 Submitting to Android...\n');
          exec(`npm run submit:${submitProfile === 'production' ? '' : 'alpha:'}android`);
          console.log('\n✅ Android submission completed\n');

          if (profile === 'production') {
            console.log('⚠️  Note: Configure staged rollout in Google Play Console\n');
          }
        }
      }
    }

    // Step 8: Git operations
    if (profile === 'production') {
      const createTag = await question('\nCreate git tag and commit? (y/n): ');
      if (createTag.toLowerCase() === 'y') {
        const pkg = readPackageJson();
        const version = pkg.version;

        // Commit version bump
        exec('git add package.json package-lock.json');
        exec(`git commit -m "chore: bump version to ${version}"`);

        // Create tag
        const tag = `v${version}`;
        console.log(`\n🏷️  Creating git tag: ${tag}\n`);
        exec(`git tag -a ${tag} -m "Release ${version}"`);

        // Push
        const pushNow = await question('Push to remote now? (y/n): ');
        if (pushNow.toLowerCase() === 'y') {
          exec('git push');
          exec(`git push origin ${tag}`);
          console.log('\n✅ Pushed to remote\n');
        }
      }
    }

    // Step 9: Post-release tasks
    console.log('\n📝 Post-release checklist:\n');
    console.log('  ✓ Builds completed');
    console.log('  ✓ Version updated');
    if (submitProfile) {
      console.log('  ✓ Submitted to stores');
    }
    console.log('\n📋 Manual steps remaining:\n');
    console.log('  - Monitor crash reports in Sentry');
    console.log('  - Check analytics in Firebase/Amplitude');
    console.log('  - Update release notes in store listings');
    console.log('  - Monitor staged rollout progress (if applicable)');
    console.log('  - Notify team/users of the release');

    // Generate release notes template
    const generateNotes = await question('\nGenerate release notes template? (y/n): ');
    if (generateNotes.toLowerCase() === 'y') {
      const pkg = readPackageJson();
      const notes = `
# Release Notes - v${pkg.version}

## What's New
- [Add new features here]

## Improvements
- [Add improvements here]

## Bug Fixes
- [Add bug fixes here]

## Known Issues
- [Add known issues here]

## Technical Details
- Built on: ${new Date().toISOString()}
- Profile: ${profile}
- Platforms: iOS, Android
      `;

      const notesPath = path.join(__dirname, '..', `RELEASE_NOTES_v${pkg.version}.md`);
      fs.writeFileSync(notesPath, notes.trim());
      console.log(`\n✅ Release notes template created: ${notesPath}\n`);
    }

    console.log('\n🎉 Full Release Process Completed Successfully!\n');
  } catch (error) {
    console.error('\n❌ Release process failed:', error.message, '\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
