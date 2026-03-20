# Troubleshooting Flowchart

This flowchart helps you navigate common issues and their solutions.

## 🎯 Start Here

**What is your issue?**

```
┌─────────────────────────────────────────────────────────────┐
│ Choose your issue:                                          │
│                                                             │
│ A. Cannot delete node_modules (Windows)                    │
│ B. Permission denied errors                                 │
│ C. Files are locked or in use                              │
│ D. npm install fails                                        │
│ E. Expo start fails / 500 errors                           │
│ F. Script execution blocked                                 │
│ G. Other issues                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## A. Cannot Delete node_modules (Windows)

```
Issue: Path too long error or cannot delete folders
├─→ Solution 1: Use PowerShell Script
│   └─→ Run: .\cleanup-and-rebuild.ps1
│       └─→ Uses robocopy method automatically
│           └─→ ✅ SUCCESS → Continue to verify
│           └─→ ❌ FAILED → Try Solution 2
│
├─→ Solution 2: Enable Long Paths (Admin Required)
│   └─→ Open PowerShell as Administrator
│       └─→ Run: New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
│           └─→ Restart computer
│               └─→ Try cleanup again
│                   └─→ ✅ SUCCESS → Continue to verify
│                   └─→ ❌ FAILED → Try Solution 3
│
├─→ Solution 3: Manual Robocopy Method
│   └─→ Run: New-Item -ItemType Directory -Force empty_temp
│       └─→ Run: robocopy empty_temp node_modules /MIR /R:0 /W:0
│           └─→ Run: Remove-Item -Recurse -Force empty_temp, node_modules
│               └─→ ✅ SUCCESS → Continue to verify
│               └─→ ❌ FAILED → Try Solution 4
│
└─→ Solution 4: Move Project to Shorter Path
    └─→ Move entire project to C:\dev\project
        └─→ Try cleanup again
            └─→ ✅ SUCCESS → Continue to verify
            └─→ ❌ FAILED → Contact support
```

**Reference:** BUILD_CLEANUP_GUIDE.md → Troubleshooting → Long Path Issues

---

## B. Permission Denied Errors

```
Issue: EACCES or permission denied
├─→ Solution 1: Clear npm Cache
│   └─→ Run: npm cache clean --force
│       └─→ Try again
│           └─→ ✅ SUCCESS → Continue to verify
│           └─→ ❌ FAILED → Try Solution 2
│
├─→ Solution 2: Check Ownership (Linux/Mac)
│   └─→ Run: sudo chown -R $(whoami) ~/.npm
│       └─→ Run: sudo chown -R $(whoami) node_modules
│           └─→ Try again
│               └─→ ✅ SUCCESS → Continue to verify
│               └─→ ❌ FAILED → Try Solution 3
│
├─→ Solution 3: Use Legacy Peer Deps
│   └─→ Run: npm install --legacy-peer-deps
│       └─→ ✅ SUCCESS → Continue to verify
│       └─→ ❌ FAILED → Try Solution 4
│
└─→ Solution 4: Install as Administrator (Windows)
    └─→ Run PowerShell as Administrator
        └─→ Navigate to project directory
            └─→ Run: npm install
                └─→ ✅ SUCCESS → Continue to verify
                └─→ ❌ FAILED → Contact support
```

**Reference:** BUILD_CLEANUP_GUIDE.md → Troubleshooting → Permission Issues

---

## C. Files Are Locked or In Use

```
Issue: Cannot delete - file is in use
├─→ Step 1: Close All Applications
│   └─→ Close VS Code, terminals, file explorers
│       └─→ Try again
│           └─→ ✅ SUCCESS → Continue to verify
│           └─→ ❌ FAILED → Continue to Step 2
│
├─→ Step 2: Kill Node Processes
│   ├─→ Windows: taskkill /F /IM node.exe
│   └─→ Linux/Mac: killall node
│       └─→ Try again
│           └─→ ✅ SUCCESS → Continue to verify
│           └─→ ❌ FAILED → Continue to Step 3
│
├─→ Step 3: Restart Development Server
│   └─→ Stop all running servers
│       └─→ Wait 10 seconds
│           └─→ Try again
│               └─→ ✅ SUCCESS → Continue to verify
│               └─→ ❌ FAILED → Continue to Step 4
│
└─→ Step 4: Restart Computer
    └─→ Restart your machine
        └─→ Try cleanup again immediately after restart
            └─→ ✅ SUCCESS → Continue to verify
            └─→ ❌ FAILED → Use robocopy method (See A)
```

**Reference:** BUILD_CLEANUP_GUIDE.md → Troubleshooting → File Locks

---

## D. npm install Fails

```
Issue: npm install produces errors
├─→ Check 1: Internet Connection
│   └─→ Is internet working?
│       ├─→ NO → Fix connection and try again
│       └─→ YES → Continue to Check 2
│
├─→ Check 2: npm Cache
│   └─→ Run: npm cache clean --force
│       └─→ Run: npm cache verify
│           └─→ Try npm install again
│               └─→ ✅ SUCCESS → Continue to verify
│               └─→ ❌ FAILED → Continue to Check 3
│
├─→ Check 3: Registry Configuration
│   └─→ Run: npm config list
│       └─→ Check for proxy or custom registry
│           ├─→ Has proxy → Run: npm config delete proxy
│           └─→ Has custom registry → Run: npm config delete registry
│               └─→ Try npm install again
│                   └─→ ✅ SUCCESS → Continue to verify
│                   └─→ ❌ FAILED → Continue to Check 4
│
├─→ Check 4: Legacy Peer Dependencies
│   └─→ Run: npm install --legacy-peer-deps
│       └─→ ✅ SUCCESS → Continue to verify
│       └─→ ❌ FAILED → Continue to Check 5
│
└─→ Check 5: Node/npm Version
    └─→ Run: node --version (should be >= 18.x)
        └─→ Run: npm --version (should be >= 9.x)
            ├─→ Version too old → Update Node.js
            └─→ Version OK → Check error logs, contact support
```

**Reference:** BUILD_CLEANUP_GUIDE.md → Troubleshooting → npm install fails

---

## E. Expo Start Fails / 500 Errors

```
Issue: Expo won't start or web shows 500 errors
├─→ Solution 1: Clear Metro Cache
│   └─→ Run: npx expo start --clear
│       └─→ OR: npx expo start -c
│           └─→ ✅ SUCCESS → Verify web works
│           └─→ ❌ FAILED → Try Solution 2
│
├─→ Solution 2: Clear All Caches
│   └─→ Run: rm -rf .expo
│       └─→ Run: npx expo start --clear
│           └─→ ✅ SUCCESS → Verify web works
│           └─→ ❌ FAILED → Try Solution 3
│
├─→ Solution 3: Complete Cleanup
│   └─→ Run appropriate cleanup script
│       └─→ Windows PS: .\cleanup-and-rebuild.ps1
│       └─→ Windows CMD: cleanup-and-rebuild.bat
│       └─→ Linux/Mac: ./cleanup-and-rebuild.sh
│           └─→ ✅ SUCCESS → Verify web works
│           └─→ ❌ FAILED → Try Solution 4
│
├─→ Solution 4: Clear Metro Temp Files
│   ├─→ Windows: Remove-Item -Recurse -Force $env:TEMP\metro-*, $env:TEMP\haste-*
│   └─→ Linux/Mac: rm -rf $TMPDIR/metro-* $TMPDIR/haste-*
│       └─→ Run: npx expo start --clear
│           └─→ ✅ SUCCESS → Verify web works
│           └─→ ❌ FAILED → Try Solution 5
│
└─→ Solution 5: Check Expo Configuration
    └─→ Run: npx expo doctor
        └─→ Fix any reported issues
            └─→ Run: npx expo install --fix
                └─→ Run: npx expo start --clear
                    └─→ ✅ SUCCESS → Verify web works
                    └─→ ❌ FAILED → Contact support
```

**Reference:** BUILD_CLEANUP_GUIDE.md → Troubleshooting → Expo-Specific Issues

---

## F. Script Execution Blocked

```
Issue: Cannot run .ps1 or .sh scripts
├─→ Windows PowerShell Script Blocked
│   └─→ Error: "execution of scripts is disabled"
│       └─→ Solution: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
│           └─→ Try running script again
│               └─→ ✅ SUCCESS → Script runs
│               └─→ ❌ FAILED → Use manual commands (QUICK_COMMANDS.md)
│
├─→ Bash Script Not Executable
│   └─→ Error: "Permission denied"
│       └─→ Solution: chmod +x cleanup-and-rebuild.sh
│           └─→ Try running script again
│               └─→ ✅ SUCCESS → Script runs
│               └─→ ❌ FAILED → Use manual commands (QUICK_COMMANDS.md)
│
└─→ Security Software Blocks Script
    └─→ Temporarily disable antivirus
        └─→ OR: Use manual commands instead
            └─→ See: QUICK_COMMANDS.md
```

**Reference:** REBUILD_README.md → Support → Security Warnings

---

## G. Other Issues

```
┌─────────────────────────────────────────────────────────────┐
│ Not sure what the problem is?                               │
│                                                             │
│ 1. Check current state:                                     │
│    - Does node_modules exist?                               │
│    - Does package-lock.json exist?                          │
│    - Is Expo running?                                       │
│                                                             │
│ 2. Try the nuclear option:                                  │
│    - See: QUICK_COMMANDS.md → Emergency Commands            │
│    - Complete cleanup of all caches and files               │
│                                                             │
│ 3. Review documentation:                                    │
│    - INDEX.md - Master index                                │
│    - BUILD_CLEANUP_GUIDE.md - Detailed guide                │
│    - QUICK_COMMANDS.md - All commands                       │
│                                                             │
│ 4. Check prerequisites:                                     │
│    - Node.js >= 18.x                                        │
│    - npm >= 9.x                                             │
│    - Sufficient disk space                                  │
│    - Internet connection                                    │
│                                                             │
│ 5. Still stuck?                                             │
│    - Review error messages carefully                        │
│    - Check Expo logs                                        │
│    - Search Expo documentation                              │
│    - Contact support with specific error details            │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Verification After Success

After successful cleanup and reinstall:

```
1. Check Files Created
   ├─→ node_modules/ exists ✅
   ├─→ package-lock.json exists ✅
   └─→ .expo/ does not exist (until Expo starts) ✅

2. Verify Installation
   └─→ Run: npm list --depth=0
       └─→ Should show all dependencies ✅

3. Check Expo
   └─→ Run: npx expo doctor
       └─→ Should report no critical issues ✅

4. Test Web
   └─→ Run: npx expo start --web
       └─→ Should open without errors ✅
       └─→ No 500 errors ✅

5. Test Development Server
   └─→ Run: npx expo start
       └─→ Metro bundler starts ✅
       └─→ QR code appears ✅
       └─→ Can select platforms ✅
```

---

## 📚 Quick Reference

| Issue Type | Quick Fix Command |
|-----------|------------------|
| Windows PS | `.\cleanup-and-rebuild.ps1` |
| Windows CMD | `cleanup-and-rebuild.bat` |
| Linux/Mac | `./cleanup-and-rebuild.sh` |
| Kill Node | Windows: `taskkill /F /IM node.exe`<br>Linux/Mac: `killall node` |
| Clear Cache | `npm cache clean --force` |
| Metro Clear | `npx expo start --clear` |
| Expo Doctor | `npx expo doctor` |
| Fix Deps | `npx expo install --fix` |

---

## 🎯 Decision Tree Summary

```
START
  │
  ├─→ Script won't run → Section F
  ├─→ Can't delete files → Section A (Windows) or C (locked)
  ├─→ Permission error → Section B
  ├─→ npm install fails → Section D
  ├─→ Expo fails/500 → Section E
  └─→ Other/Unknown → Section G
       │
       └─→ All solutions lead to → ✅ Verification
```

---

## 📖 Related Documentation

- **[INDEX.md](INDEX.md)** - Master navigation
- **[REBUILD_README.md](REBUILD_README.md)** - Main guide
- **[BUILD_CLEANUP_GUIDE.md](BUILD_CLEANUP_GUIDE.md)** - Detailed troubleshooting
- **[QUICK_COMMANDS.md](QUICK_COMMANDS.md)** - Command reference

---

**Tip:** Bookmark this flowchart for quick troubleshooting reference!
