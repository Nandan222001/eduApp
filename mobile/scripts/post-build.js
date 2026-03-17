#!/usr/bin/env node

/**
 * Post-build script
 * Handles tasks after successful build completion
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    return null;
  }
}

function readPackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

console.log('📦 Running post-build tasks...\n');

const appEnv = process.env.APP_ENV || 'development';
const pkg = readPackageJson();

// Create build info file
const buildInfo = {
  version: pkg.version,
  environment: appEnv,
  buildTime: new Date().toISOString(),
  gitBranch: exec('git rev-parse --abbrev-ref HEAD')?.trim(),
  gitCommit: exec('git rev-parse --short HEAD')?.trim(),
  gitTag: exec('git describe --tags --abbrev=0')?.trim(),
};

const buildInfoPath = path.join(__dirname, '..', 'build-info.json');
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
console.log('✅ Build info saved to build-info.json\n');

// Upload source maps to Sentry (if configured)
if (appEnv !== 'development' && process.env.SENTRY_AUTH_TOKEN) {
  console.log('📤 Uploading source maps to Sentry...');
  const sentryUpload = exec(
    `npx sentry-cli sourcemaps upload \
      --org ${process.env.SENTRY_ORG} \
      --project ${process.env.SENTRY_PROJECT} \
      --release ${pkg.version} \
      ./dist`
  );

  if (sentryUpload) {
    console.log('✅ Source maps uploaded to Sentry\n');
  } else {
    console.log('⚠️  Failed to upload source maps to Sentry\n');
  }
}

// Generate build report
const report = `
Build Report
============
Version: ${buildInfo.version}
Environment: ${buildInfo.environment}
Build Time: ${buildInfo.buildTime}
Git Branch: ${buildInfo.gitBranch || 'N/A'}
Git Commit: ${buildInfo.gitCommit || 'N/A'}
Git Tag: ${buildInfo.gitTag || 'N/A'}

Next Steps:
-----------
1. Test the build thoroughly
2. Review crash reports in Sentry
3. Monitor analytics in Firebase/Amplitude
4. Submit to app stores (if production)
5. Create OTA update (if needed)
`;

const reportPath = path.join(__dirname, '..', `build-report-${Date.now()}.txt`);
fs.writeFileSync(reportPath, report);
console.log(`📊 Build report saved to ${path.basename(reportPath)}\n`);

// Notify completion
console.log('✅ Post-build tasks completed!\n');
console.log(report);
