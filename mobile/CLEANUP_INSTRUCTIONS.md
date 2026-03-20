# Build Cache Cleanup Instructions

## Steps to Clear Build Cache and Reinstall Dependencies

Due to path length limitations on Windows and file system locks, follow these steps:

### 1. Navigate to mobile directory
```bash
cd mobile
```

### 2. Remove node_modules (if partially remaining)
If `node_modules` still exists with some residual folders:
```powershell
# Option A: Use Windows long path support
$env:PATHEXT = ".exe"
Get-ChildItem -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
Remove-Item -Path node_modules -Force -Recurse -ErrorAction SilentlyContinue

# Option B: Use npm's built-in cleanup (if node_modules exists)
npm prune --production=false

# Option C: Manually rename and delete
if (Test-Path node_modules) { 
    Move-Item node_modules node_modules_old 
    # Then delete node_modules_old in File Explorer or use:
    # Remove-Item node_modules_old -Recurse -Force
}
```

### 3. Remove .expo directory
```powershell
if (Test-Path .expo) {
    Remove-Item -Recurse -Force .expo
}
```

### 4. Delete package-lock.json
```powershell
if (Test-Path package-lock.json) {
    Remove-Item package-lock.json
}
```

### 5. Clear npm cache
```bash
npm cache clean --force
```

### 6. Reinstall dependencies
```bash
npm install
```

### 7. Start Expo with clear cache
```bash
npx expo start --clear
```

## Troubleshooting

### Long Path Issues on Windows
If you encounter "path too long" errors:

1. Enable long paths in Windows:
   - Open Registry Editor (Win+R, type regedit)
   - Navigate to: `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem`
   - Set `LongPathsEnabled` to 1

2. Or use shorter path (move project closer to root):
   ```powershell
   # Example: C:\projects\myapp instead of deep nested folders
   ```

3. Use robocopy for stubborn directories:
   ```cmd
   mkdir empty
   robocopy empty node_modules /MIR
   rmdir node_modules /S /Q
   rmdir empty /Q
   ```

### File Locks
If files are locked:
1. Close all Node processes: `taskkill /F /IM node.exe`
2. Close VS Code, terminals, and file explorers
3. Try the deletion again

### Partial node_modules Cleanup
Currently there are remnants of `@react-native` and `react-native` folders. You can:
1. Try installation anyway (npm might overwrite)
2. Use File Explorer to manually delete the mobile/node_modules folder
3. Restart your computer and try again (releases all file locks)
