# 🚀 Build Cache Cleanup - START HERE

## Quick Links

| Platform | Command to Run |
|----------|---------------|
| **Windows PowerShell** | `.\cleanup-and-rebuild.ps1` |
| **Windows Command Prompt** | `cleanup-and-rebuild.bat` |
| **Linux / macOS** | `./cleanup-and-rebuild.sh` |

## What This Does

Clears the build cache and reinstalls dependencies to fix:
- ❌ 500 errors on web bundle
- ❌ Build cache corruption
- ❌ Dependency conflicts
- ❌ Metro bundler issues

## Steps to Run

### 1️⃣ Navigate to Mobile Directory
```bash
cd mobile
```

### 2️⃣ Run the Appropriate Script

**Windows PowerShell:**
```powershell
.\cleanup-and-rebuild.ps1
```

**Windows Command Prompt:**
```cmd
cleanup-and-rebuild.bat
```

**Linux/Mac:**
```bash
chmod +x cleanup-and-rebuild.sh
./cleanup-and-rebuild.sh
```

### 3️⃣ Wait for Completion

The script will:
1. Remove `node_modules/` (handles long paths)
2. Remove `.expo/` directory
3. Delete `package-lock.json`
4. Clear npm cache
5. Run `npm install`
6. Start Expo with `--clear` flag

**Time:** Usually 5-10 minutes depending on internet speed

### 4️⃣ Verify Success

✅ Expo starts without errors  
✅ Web bundle compiles  
✅ No 500 errors  
✅ `node_modules/` is fully populated  

## 📚 Need More Help?

- **Troubleshooting?** → [TROUBLESHOOTING_FLOWCHART.md](TROUBLESHOOTING_FLOWCHART.md)
- **Detailed Guide?** → [REBUILD_README.md](REBUILD_README.md)
- **Quick Commands?** → [QUICK_COMMANDS.md](QUICK_COMMANDS.md)
- **All Documentation?** → [INDEX.md](INDEX.md)

## ⚠️ Common Issues

### Script Won't Run (Windows)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Script Won't Run (Linux/Mac)
```bash
chmod +x cleanup-and-rebuild.sh
```

### Path Too Long (Windows)
The PowerShell script handles this automatically with robocopy.

### Files Locked
Close all terminals and IDEs, then try again.

## 🆘 Emergency One-Liner

If scripts don't work, copy and paste:

**Windows PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules, .expo, package-lock.json -ErrorAction SilentlyContinue; npm cache clean --force; npm install; npx expo start --clear
```

**Linux/Mac:**
```bash
rm -rf node_modules .expo package-lock.json && npm cache clean --force && npm install && npx expo start --clear
```

---

## 📖 Complete Documentation Index

1. **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - Full implementation summary
2. **[REBUILD_README.md](REBUILD_README.md)** - Main user guide
3. **[TROUBLESHOOTING_FLOWCHART.md](TROUBLESHOOTING_FLOWCHART.md)** - Visual troubleshooting
4. **[BUILD_CLEANUP_GUIDE.md](BUILD_CLEANUP_GUIDE.md)** - Detailed troubleshooting
5. **[QUICK_COMMANDS.md](QUICK_COMMANDS.md)** - Command reference
6. **[INDEX.md](INDEX.md)** - Master index

---

**Ready?** Run the script for your platform above! ⬆️
