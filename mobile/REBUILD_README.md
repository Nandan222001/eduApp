# Mobile App - Build Cache Cleanup and Reinstall

This directory contains scripts and documentation for clearing the build cache and reinstalling dependencies for the Expo React Native mobile application.

## Quick Start

### Windows (PowerShell)
```powershell
.\cleanup-and-rebuild.ps1
```

### Windows (Command Prompt)
```cmd
cleanup-and-rebuild.bat
```

### Linux/Mac
```bash
chmod +x cleanup-and-rebuild.sh
./cleanup-and-rebuild.sh
```

## What These Scripts Do

1. **Remove `node_modules`** - Clears all installed npm packages
2. **Remove `.expo`** - Clears Expo's build cache
3. **Remove `package-lock.json`** - Clears dependency lock file
4. **Clear npm cache** - Runs `npm cache clean --force`
5. **Install dependencies** - Runs `npm install` to reinstall all packages
6. **Start Expo** - Runs `npx expo start --clear` to start with clean cache

## Script Options

### PowerShell Script
```powershell
# Skip installation step
.\cleanup-and-rebuild.ps1 -SkipInstall

# Skip Expo start step
.\cleanup-and-rebuild.ps1 -SkipStart

# Skip both
.\cleanup-and-rebuild.ps1 -SkipInstall -SkipStart
```

### Bash Script
```bash
# Skip installation step
./cleanup-and-rebuild.sh --skip-install

# Skip Expo start step
./cleanup-and-rebuild.sh --skip-start

# Skip both
./cleanup-and-rebuild.sh --skip-install --skip-start
```

## Manual Steps

If you prefer to run commands manually or encounter issues with the scripts:

### 1. Remove node_modules

**Windows (PowerShell):**
```powershell
# Using robocopy for long paths
New-Item -ItemType Directory -Force -Path empty_temp
robocopy empty_temp node_modules /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS
Remove-Item -Force -Recurse empty_temp
Remove-Item -Force -Recurse node_modules
```

**Windows (CMD):**
```cmd
rmdir /s /q node_modules
```

**Linux/Mac:**
```bash
rm -rf node_modules
```

### 2. Remove .expo

```bash
rm -rf .expo
```

### 3. Remove package-lock.json

```bash
rm package-lock.json
```

### 4. Clear npm cache

```bash
npm cache clean --force
```

### 5. Reinstall dependencies

```bash
npm install
```

### 6. Start Expo with clean cache

```bash
npx expo start --clear
```

## Files in This Directory

- **`cleanup-and-rebuild.ps1`** - PowerShell script for Windows
- **`cleanup-and-rebuild.bat`** - Batch file for Windows CMD
- **`cleanup-and-rebuild.sh`** - Bash script for Linux/Mac
- **`BUILD_CLEANUP_GUIDE.md`** - Comprehensive troubleshooting guide
- **`CLEANUP_INSTRUCTIONS.md`** - Alternative manual instructions
- **`REBUILD_README.md`** - This file

## Troubleshooting

### "Path too long" errors (Windows)

**Enable Long Paths:**
1. Open PowerShell as Administrator
2. Run:
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
     -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```
3. Restart your computer

**Or use the robocopy method** (included in PowerShell script)

### Permission errors

```bash
# Clear npm cache
npm cache clean --force

# Try with legacy peer deps
npm install --legacy-peer-deps
```

### Files locked/in use

1. Close all terminals and development servers
2. Close VS Code or other IDEs
3. Kill Node processes:
   ```powershell
   # Windows
   taskkill /F /IM node.exe
   ```
   ```bash
   # Linux/Mac
   killall node
   ```
4. Try cleanup again

### Expo web bundle 500 errors

After cleanup, if you still see 500 errors:

```bash
# Clear Metro bundler cache
npx expo start -c

# Or start with clear flag
npx expo start --clear

# Or manually clear Expo cache
rm -rf node_modules/.expo
npx expo start --clear
```

### Partial node_modules remains

If some folders remain after deletion (like `@react-native`):

1. **Windows:** Use File Explorer to manually delete
2. **Use robocopy:** See PowerShell script method
3. **Close and retry:** Close all apps accessing the folder and retry

## Expected Results

After successful cleanup and reinstall:

✅ Fresh `node_modules` directory with all dependencies  
✅ New `package-lock.json` file generated  
✅ Cleared Expo cache  
✅ Metro bundler starts without errors  
✅ Web bundle compiles successfully  
✅ No 500 errors when accessing the web app  

## Verification

Check that everything is properly installed:

```powershell
# PowerShell
Test-Path node_modules        # Should be True
Test-Path package-lock.json   # Should be True
Test-Path .expo               # Should be False (until Expo starts)
```

```bash
# Bash
ls -la | grep node_modules       # Should exist
ls -la | grep package-lock.json  # Should exist
ls -la | grep .expo              # Should not exist initially
```

## Next Steps

After successful cleanup and installation:

1. **Test the web build:**
   ```bash
   npx expo start --web
   ```

2. **Test iOS (Mac only):**
   ```bash
   npx expo start --ios
   ```

3. **Test Android:**
   ```bash
   npx expo start --android
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Additional Resources

- **Expo Documentation:** https://docs.expo.dev/
- **Troubleshooting Guide:** https://docs.expo.dev/troubleshooting/
- **Metro Bundler:** https://facebook.github.io/metro/

## Support

If you continue to experience issues after following these steps:

1. Check the Expo logs for specific error messages
2. Review `BUILD_CLEANUP_GUIDE.md` for detailed troubleshooting
3. Check that Node.js and npm are up to date:
   ```bash
   node --version  # Should be >= 18.x
   npm --version   # Should be >= 9.x
   ```
4. Ensure all required dependencies are available:
   ```bash
   npm list --depth=0
   ```

---

**Last Updated:** December 2024  
**Project:** EduTrack Mobile App  
**Framework:** Expo SDK 50.0.0 with React Native 0.73.2
