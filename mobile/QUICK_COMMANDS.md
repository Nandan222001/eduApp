# Quick Command Reference

## One-Line Commands for Build Cache Cleanup

### Windows PowerShell (All-in-One)

```powershell
Remove-Item -Recurse -Force node_modules, .expo, package-lock.json -ErrorAction SilentlyContinue; npm cache clean --force; npm install; npx expo start --clear
```

### Windows PowerShell (Robocopy Method for Long Paths)

```powershell
if (Test-Path node_modules) { New-Item -ItemType Directory -Force empty_temp | Out-Null; robocopy empty_temp node_modules /MIR /R:0 /W:0 | Out-Null; Remove-Item -Recurse -Force empty_temp, node_modules -ErrorAction SilentlyContinue }; Remove-Item -Force .expo, package-lock.json -ErrorAction SilentlyContinue; npm cache clean --force; npm install; npx expo start --clear
```

### Windows CMD (All-in-One)

```cmd
rmdir /s /q node_modules & rmdir /s /q .expo & del /f /q package-lock.json & npm cache clean --force & npm install & npx expo start --clear
```

### Linux/Mac Bash (All-in-One)

```bash
rm -rf node_modules .expo package-lock.json && npm cache clean --force && npm install && npx expo start --clear
```

## Step-by-Step Commands

### 1. Delete Directories and Files

**Windows PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules, .expo, package-lock.json -ErrorAction SilentlyContinue
```

**Windows CMD:**
```cmd
rmdir /s /q node_modules
rmdir /s /q .expo
del /f /q package-lock.json
```

**Linux/Mac:**
```bash
rm -rf node_modules .expo package-lock.json
```

### 2. Clear npm Cache

```bash
npm cache clean --force
```

### 3. Reinstall Dependencies

```bash
npm install
```

### 4. Start Expo with Clear Cache

```bash
npx expo start --clear
```

## Alternative: Using Scripts

### Windows
```powershell
# PowerShell
.\cleanup-and-rebuild.ps1

# Command Prompt
cleanup-and-rebuild.bat
```

### Linux/Mac
```bash
chmod +x cleanup-and-rebuild.sh
./cleanup-and-rebuild.sh
```

## Quick Checks

### Verify Cleanup
```powershell
# PowerShell
Get-ChildItem -Force | Select-Object Name, Length, Mode
```

```bash
# Linux/Mac
ls -la
```

### Verify Installation
```bash
npm list --depth=0
```

### Check Expo Status
```bash
npx expo doctor
```

## Emergency Commands

### Kill All Node Processes

**Windows:**
```cmd
taskkill /F /IM node.exe
```

**Linux/Mac:**
```bash
killall node
```

### Reset npm Configuration
```bash
npm config list
npm config delete proxy
npm config delete https-proxy
npm config delete registry
```

### Clear All Caches
```bash
npm cache clean --force
npx expo-cli cache clear  # If expo-cli is installed globally
```

### Complete Nuclear Option (Clean Everything)

**Windows PowerShell:**
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force node_modules, .expo, .expo-shared, package-lock.json, .metro-health-check* -ErrorAction SilentlyContinue
npm cache clean --force
npm cache verify
npm install
npx expo start --clear
```

**Linux/Mac:**
```bash
killall node 2>/dev/null
rm -rf node_modules .expo .expo-shared package-lock.json .metro-health-check*
npm cache clean --force
npm cache verify
npm install
npx expo start --clear
```

## Common Issues Quick Fixes

### Issue: Path too long (Windows)
```powershell
New-Item -ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
# Then restart computer
```

### Issue: Permission denied
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules
```

### Issue: ENOENT or EACCES errors
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Expo not found
```bash
npm install -g expo-cli
# Or use npx
npx expo start --clear
```

### Issue: Metro bundler issues
```bash
watchman watch-del-all  # If watchman is installed
rm -rf $TMPDIR/metro-*  # Clear metro temp files
rm -rf $TMPDIR/haste-*  # Clear haste temp files
npx expo start --clear
```

## Useful npm Commands

```bash
# View installed packages
npm list --depth=0

# Check for outdated packages
npm outdated

# Check for security vulnerabilities
npm audit

# Fix security vulnerabilities
npm audit fix

# View npm configuration
npm config list

# Get npm cache location
npm config get cache

# Verify npm cache integrity
npm cache verify
```

## Expo Specific Commands

```bash
# Start Expo dev server
npx expo start

# Start with cache clear
npx expo start --clear

# Start with cache clear (alternative)
npx expo start -c

# Start web only
npx expo start --web

# Start with tunnel
npx expo start --tunnel

# Check Expo configuration
npx expo doctor

# Update Expo dependencies
npx expo install --fix

# Login to Expo
npx expo login

# Logout from Expo
npx expo logout
```

## Build Commands

```bash
# Development build
npm run build

# Lint code
npm run lint

# Type check
npm run type-check

# Run tests (if configured)
npm test

# Start specific platforms
npm run android
npm run ios
npm run web
```

## Environment Cleanup

### Clear All npm/Node/Expo Caches (Nuclear Option)

**Windows:**
```powershell
Remove-Item -Recurse -Force $env:APPDATA\npm-cache
Remove-Item -Recurse -Force $env:LOCALAPPDATA\Expo
Remove-Item -Recurse -Force $env:LOCALAPPDATA\.expo
Remove-Item -Recurse -Force $env:TEMP\metro-*
Remove-Item -Recurse -Force $env:TEMP\haste-*
```

**Linux/Mac:**
```bash
rm -rf ~/.npm
rm -rf ~/.expo
rm -rf ~/Library/Caches/Expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*
```

---

**Tip:** Bookmark this file for quick access to commonly used commands!
