# Deployment Scripts

Automation scripts for building, deploying, and managing mobile app releases.

## Available Scripts

### Release Scripts

#### `release-ios.js`
Automated iOS release script with interactive prompts.

**Usage:**
```bash
npm run release:ios
# or
node scripts/release-ios.js
```

**Features:**
- Choose build profile (production/preview/development)
- Automatic version bumping
- Run tests and linter
- Build iOS app
- Upload source maps to Sentry
- Submit to TestFlight or App Store
- Create OTA update
- Create git tags

#### `release-android.js`
Automated Android release script with interactive prompts.

**Usage:**
```bash
npm run release:android
# or
node scripts/release-android.js
```

**Features:**
- Choose build profile (production/preview/development)
- Choose build type (AAB/APK)
- Automatic version bumping
- Run tests and linter
- Build Android app
- Upload source maps to Sentry
- Submit to Google Play
- Configure staged rollout
- Create OTA update
- Create git tags

#### `release-full.js`
Full release for both iOS and Android platforms.

**Usage:**
```bash
npm run release:full
# or
node scripts/release-full.js
```

**Features:**
- Release both platforms simultaneously
- Unified version bumping
- Run tests and linter once
- Build both platforms
- Upload source maps
- Submit to both stores
- Create OTA updates
- Create git tags
- Generate release notes template

### Validation Scripts

#### `pre-build.js`
Pre-build validation to ensure environment is configured correctly.

**Usage:**
```bash
node scripts/pre-build.js
# or run automatically before builds
```

**Checks:**
- Required files exist
- Environment variables set
- Platform-specific configurations
- Google Services files
- Credentials

#### `validate-deployment.js`
Comprehensive deployment validation.

**Usage:**
```bash
node scripts/validate-deployment.js
```

**Validates:**
- Configuration files
- Environment setup
- Dependencies
- Credentials
- Documentation
- Required accounts

#### `post-build.js`
Post-build tasks after successful builds.

**Usage:**
```bash
node scripts/post-build.js
# or run automatically after builds
```

**Tasks:**
- Create build info file
- Upload source maps to Sentry
- Generate build report
- Save build metadata

### Utility Scripts

#### `check-updates.js`
Check OTA update status on a channel.

**Usage:**
```bash
node scripts/check-updates.js [channel]

# Examples:
node scripts/check-updates.js production
node scripts/check-updates.js staging
```

**Output:**
- List of updates on channel
- Update IDs
- Messages
- Creation dates
- Platform info

#### `setup-credentials.sh`
Interactive credential setup guide.

**Usage:**
```bash
bash scripts/setup-credentials.sh
# or
npm run setup:credentials
```

**Helps Setup:**
- iOS certificates and provisioning
- Android keystores
- EAS credentials
- Step-by-step guidance

#### `make-scripts-executable.sh`
Make all scripts executable (Unix/Mac).

**Usage:**
```bash
bash scripts/make-scripts-executable.sh
```

Makes all `.sh` and `.js` files in scripts directory executable.

## Script Workflows

### Standard Release Workflow

```bash
# 1. Validate setup
node scripts/validate-deployment.js

# 2. Run full release
npm run release:full

# Follow interactive prompts:
# - Select build profile
# - Version bump type
# - Run tests (recommended)
# - Run linter (recommended)
# - Build both platforms
# - Upload source maps
# - Submit to stores
# - Create OTA update
# - Create git tag
```

### Quick Hotfix Workflow

```bash
# 1. Make changes
# 2. Test
npm run test:ci

# 3. Deploy OTA (if JS-only)
npm run update:production -- "Hotfix: Fix critical bug"

# Or full build if native changes
npm run release:full
```

### Preview Build Workflow

```bash
# 1. Build preview
npm run build:preview:all

# 2. Test builds
# Download from EAS and test

# 3. If good, proceed to production
npm run build:prod:all
```

## Script Configuration

### Environment Variables

Scripts use these environment variables:

```bash
# Required
APP_ENV                 # development/staging/production
EXPO_PROJECT_ID        # Your Expo project ID

# Optional (for automation)
SENTRY_AUTH_TOKEN      # For source map uploads
SENTRY_ORG            # Sentry organization
SENTRY_PROJECT        # Sentry project name
```

Load from env files:
```bash
export $(cat .env.production | xargs)
```

### Customization

Scripts can be customized by editing:

1. **Version bumping logic** in release scripts
2. **Validation rules** in pre-build.js
3. **Post-build tasks** in post-build.js
4. **Upload targets** for source maps

## Adding New Scripts

To add a new automation script:

1. Create file in `scripts/` directory
2. Add shebang: `#!/usr/bin/env node` (JS) or `#!/bin/bash` (Shell)
3. Make executable: `chmod +x scripts/your-script.js`
4. Add to package.json scripts section
5. Document in this README

Example:
```javascript
#!/usr/bin/env node

/**
 * Your Script Description
 */

// Your code here
console.log('Hello from script!');
```

## Error Handling

All scripts include error handling:

- **Exit codes:**
  - `0` - Success
  - `1` - Error/Failure
  
- **Error messages:**
  - Clear description of what failed
  - Suggestions for resolution
  - Relevant context

## Integration with CI/CD

Scripts are designed to work in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Validate deployment
  run: node scripts/validate-deployment.js

- name: Build production
  run: npm run build:prod:all
  
- name: Post-build tasks
  run: node scripts/post-build.js
```

See `.github/workflows/eas-build.yml` for full CI/CD setup.

## Debugging Scripts

To debug a script:

```bash
# Add DEBUG environment variable
DEBUG=* node scripts/your-script.js

# Or use Node debugger
node --inspect-brk scripts/your-script.js
```

## Best Practices

1. **Always run validation first**
   ```bash
   node scripts/validate-deployment.js
   ```

2. **Test with preview builds before production**
   ```bash
   npm run build:preview:all
   ```

3. **Keep scripts idempotent** - safe to run multiple times

4. **Use interactive prompts** for destructive operations

5. **Log all actions** with clear timestamps

6. **Handle errors gracefully** with helpful messages

7. **Document all scripts** in this README

## Troubleshooting

### Script Won't Run

```bash
# Make executable
chmod +x scripts/script-name.js

# Or use node directly
node scripts/script-name.js
```

### Permission Denied

```bash
# Run with sudo (not recommended)
sudo node scripts/script-name.js

# Better: Fix file permissions
chmod +x scripts/script-name.js
chown $USER scripts/script-name.js
```

### Module Not Found

```bash
# Install dependencies
npm install

# Or specific module
npm install [module-name]
```

### Environment Variable Not Set

```bash
# Load from .env file
export $(cat .env.production | xargs)

# Or set manually
export VARIABLE_NAME=value
```

## Security Notes

Scripts handle sensitive data:

- **Never log credentials** to console
- **Use environment variables** for secrets
- **Don't commit** `.env` files with real values
- **Clear credential cache** after use if needed

## Contributing

When adding or modifying scripts:

1. Test thoroughly on all platforms
2. Add error handling
3. Update this documentation
4. Add to package.json if user-facing
5. Follow existing code style

## Support

For script issues:
- Check script output for errors
- Review relevant documentation
- Check EAS build logs
- Contact DevOps team

## Related Documentation

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT_QUICK_REFERENCE.md](../DEPLOYMENT_QUICK_REFERENCE.md) - Quick commands
- [SETUP_DEPLOYMENT.md](../SETUP_DEPLOYMENT.md) - Initial setup guide

---

**Last Updated:** [Date]  
**Maintained By:** DevOps Team
