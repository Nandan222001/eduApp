# Deployment Quick Start Guide

Get started with deploying your mobile app in 15 minutes.

## 🚀 Prerequisites (5 minutes)

1. **Install tools:**
   ```bash
   npm install -g eas-cli
   ```

2. **Have accounts ready:**
   - Expo account
   - Apple Developer (for iOS)
   - Google Play Console (for Android)
   - Sentry account (for crash reporting)
   - Firebase account (for analytics)

## ⚡ Quick Setup (10 minutes)

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2: Login to EAS
```bash
eas login
```

### Step 3: Initialize Project
```bash
eas init
```
Note the project ID and update it in `app.json`.

### Step 4: Setup Credentials
```bash
bash scripts/setup-credentials.sh
```
Follow the prompts to set up iOS and Android credentials.

### Step 5: Configure Environment
```bash
cp .env.example .env.production
```
Edit `.env.production` with your values:
- `EXPO_PROJECT_ID` - From step 3
- `SENTRY_DSN` - From Sentry project settings
- `FIREBASE_API_KEY` - From Firebase project
- Other required values

## 🎯 Your First Build (5 minutes)

### Preview Build
```bash
npm run build:preview:ios
# or
npm run build:preview:android
```

Wait 15-25 minutes for the build to complete.

### Download and Test
1. Go to https://expo.dev/
2. Navigate to your project → Builds
3. Download the build
4. Install on your device
5. Test the app

## 🚢 Your First Release (10 minutes)

### Automated Release
```bash
npm run release:full
```

This will guide you through:
1. Choosing build profile (select production)
2. Version bumping (select patch/minor/major)
3. Running tests (recommended: yes)
4. Building for both platforms
5. Submitting to stores (optional first time)

### Or Manual Release
```bash
# 1. Build
npm run build:prod:all

# 2. Wait for builds (20-40 minutes)

# 3. Submit to stores
npm run submit:ios
npm run submit:android
```

## 📱 Your First OTA Update (2 minutes)

After your app is published:

```bash
npm run update:production -- "Fix bug in login screen"
```

Users will receive the update automatically within hours.

## 📊 Monitoring (Ongoing)

### Check Crash Reports
Visit: https://sentry.io/organizations/[your-org]/projects/

### Check Analytics
Visit: https://console.firebase.google.com/

### Check Build Status
Visit: https://expo.dev/accounts/[account]/projects/[project]

## 🆘 Common Issues

### "Credentials not found"
```bash
eas credentials --platform ios  # or android
# Follow prompts to set up
```

### "Build failed"
```bash
eas build:view [BUILD_ID] --log
# Check logs for specific error
```

### "Update not appearing"
```bash
node scripts/check-updates.js production
# Verify update was published
```

## 📚 Next Steps

1. **Read the full guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Set up CI/CD:** Configure GitHub Actions
3. **Configure monitoring:** Set up Sentry alerts
4. **Plan releases:** Create release schedule
5. **Train team:** Share documentation

## 🎓 Essential Commands

```bash
# Build commands
npm run build:dev:all        # Development
npm run build:preview:all    # Staging/Preview
npm run build:prod:all       # Production

# Submit commands
npm run submit:ios           # iOS App Store
npm run submit:android       # Google Play

# OTA updates
npm run update:production -- "Message"
npm run update:preview -- "Message"

# Automated releases
npm run release:full         # Both platforms

# Validation
npm run validate:deployment  # Check setup
npm run test:ci             # Run tests
npm run lint                # Run linter
```

## ✅ Checklist

### First Time Setup
- [ ] Accounts created
- [ ] EAS CLI installed
- [ ] Project initialized
- [ ] Credentials configured
- [ ] Environment variables set
- [ ] Firebase files added
- [ ] Preview build successful
- [ ] Preview build tested

### Before Each Release
- [ ] Tests passing
- [ ] Linter passing
- [ ] Version updated
- [ ] Changelog updated
- [ ] Preview builds tested

### After Each Release
- [ ] Monitoring enabled
- [ ] Crash reports checked
- [ ] Analytics reviewed
- [ ] User feedback monitored

## 🔗 Quick Links

- **EAS Dashboard:** https://expo.dev/
- **Sentry:** https://sentry.io/
- **Firebase Console:** https://console.firebase.google.com/
- **App Store Connect:** https://appstoreconnect.apple.com/
- **Google Play Console:** https://play.google.com/console/

## 💡 Pro Tips

1. **Always test preview builds** before production
2. **Use OTA updates** for quick fixes (JavaScript-only)
3. **Start with small rollouts** (5-10% on Android)
4. **Monitor Sentry** after every deployment
5. **Keep credentials secure** - never commit to git
6. **Document everything** - use release notes template

## 🎉 You're Ready!

You now have everything you need to:
- ✅ Build your app
- ✅ Deploy to stores
- ✅ Push OTA updates
- ✅ Monitor performance
- ✅ Handle releases

For detailed information, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete guide
- [DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md) - Command reference
- [SETUP_DEPLOYMENT.md](./SETUP_DEPLOYMENT.md) - Detailed setup

---

**Need Help?**
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
- Review [EAS documentation](https://docs.expo.dev/)
- Contact your DevOps team

**Happy Deploying! 🚀**
