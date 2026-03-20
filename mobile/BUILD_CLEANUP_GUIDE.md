# Build Cache Cleanup and Reinstall Guide

This guide provides step-by-step instructions to clear the build cache and reinstall dependencies for the Expo React Native mobile application.

## Prerequisites

- Node.js and npm installed
- Windows PowerShell or Command Prompt
- Write permissions to the project directory

## Manual Cleanup Steps

### Step 1: Navigate to the Mobile Directory

```powershell
cd mobile
```

### Step 2: Remove node_modules Directory

**Option A - Using PowerShell (Recommended for Windows):**

```powershell
# Create an empty directory for robocopy method
New-Item -ItemType Directory -Force -Path empty_temp

# Use robocopy to clear node_modules (handles long paths)
robocopy empty_temp node_modules /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS /nc /ns /np

# Remove the empty directories
Remove-Item -Force -Recurse empty_temp
Remove-Item -Force -Recurse node_modules
```

**Option B - Using Windows Command Prompt:**

```cmd
rmdir /s /q node_modules
```

**Option C - Manual Deletion:**

1. Open File Explorer
2. Navigate to the `mobile` folder
3. Right-click on `node_modules` folder
4. Select "Delete"
5. If you encounter "path too long" errors, use Option A above

### Step 3: Remove .expo Directory

```powershell
# Check if .expo exists
if (Test-Path .expo) {
    Remove-Item -Recurse -Force .expo
    Write-Host ".expo directory removed"
} else {
    Write-Host ".expo directory not found"
}
```

### Step 4: Delete package-lock.json

```powershell
# Check if package-lock.json exists
if (Test-Path package-lock.json) {
    Remove-Item package-lock.json
    Write-Host "package-lock.json removed"
} else {
    Write-Host "package-lock.json not found"
}
```

### Step 5: Clear npm Cache

```bash
npm cache clean --force
```

### Step 6: Reinstall Dependencies

```bash
npm install
```

This will:
- Read the `package.json` file
- Download all dependencies
- Create a new `node_modules` directory
- Generate a new `package-lock.json` file

### Step 7: Start Expo with Clear Cache

```bash
npx expo start --clear
```

This command:
- Clears the Metro bundler cache
- Starts the Expo development server
- Allows you to run the app on web, iOS, or Android

## Verification Steps

After completing the above steps, verify everything is working:

1. **Check node_modules exists:**
   ```powershell
   Test-Path node_modules
   # Should return: True
   ```

2. **Check package-lock.json was created:**
   ```powershell
   Test-Path package-lock.json
   # Should return: True
   ```

3. **Verify Expo starts without errors:**
   - The Metro bundler should start
   - No 500 errors should appear
   - Web bundle should compile successfully

## Troubleshooting

### Issue: "Path too long" errors on Windows

**Solution 1: Enable Long Paths**

1. Open PowerShell as Administrator
2. Run:
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
   -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```
3. Restart your computer

**Solution 2: Use robocopy (see Step 2, Option A)**

**Solution 3: Move project to shorter path**
- Example: `C:\dev\edutrack` instead of deeply nested folders

### Issue: npm install fails with permission errors

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Try install with legacy peer deps
npm install --legacy-peer-deps
```

### Issue: Files are locked or in use

**Solution:**
1. Close all terminals and development servers
2. Close Visual Studio Code or other IDEs
3. Kill all Node processes:
   ```powershell
   taskkill /F /IM node.exe
   ```
4. Try the cleanup again

### Issue: Expo web bundle returns 500 errors

**Solution:**
1. Clear Expo cache:
   ```bash
   npx expo start --clear
   ```

2. If still failing, clear Metro cache manually:
   ```bash
   npx expo start -c
   ```

3. Reset the Expo installation:
   ```bash
   rm -rf node_modules/.expo
   npx expo start --clear
   ```

### Issue: Partial node_modules remains (like @react-native folders)

**Current State:**
There may be residual `@react-native` and `react-native` folders in node_modules.

**Solution:**
1. Use the robocopy method (Step 2, Option A)
2. Or manually delete via File Explorer:
   - Navigate to `mobile/node_modules`
   - Delete `@react-native` folder
   - Delete `react-native` folder
   - Delete the parent `node_modules` folder
3. Proceed with npm install

## Complete Script

For convenience, here's a complete PowerShell script:

```powershell
# Navigate to mobile directory
Set-Location -Path "mobile"

# Remove node_modules using robocopy
if (Test-Path node_modules) {
    Write-Host "Removing node_modules..."
    New-Item -ItemType Directory -Force -Path empty_temp | Out-Null
    robocopy empty_temp node_modules /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    Remove-Item -Force -Recurse empty_temp, node_modules -ErrorAction SilentlyContinue
}

# Remove .expo
if (Test-Path .expo) {
    Write-Host "Removing .expo..."
    Remove-Item -Recurse -Force .expo
}

# Remove package-lock.json
if (Test-Path package-lock.json) {
    Write-Host "Removing package-lock.json..."
    Remove-Item package-lock.json
}

# Clean npm cache
Write-Host "Cleaning npm cache..."
npm cache clean --force

# Install dependencies
Write-Host "Installing dependencies..."
npm install

# Start Expo with clear cache
Write-Host "Starting Expo..."
npx expo start --clear
```

Save this as `cleanup-and-rebuild.ps1` and run:
```powershell
.\cleanup-and-rebuild.ps1
```

## Notes

- The cleanup process may take several minutes depending on your system
- Ensure you have a stable internet connection for `npm install`
- The first `npm install` after cleanup will be slower as it downloads all packages
- Subsequent installs will be faster due to npm's cache

## Expected Results

After successful completion:
- ✅ Fresh `node_modules` directory
- ✅ New `package-lock.json` file
- ✅ Cleared Expo cache
- ✅ Metro bundler starts without errors
- ✅ Web bundle compiles successfully
- ✅ No 500 errors when accessing the web app
