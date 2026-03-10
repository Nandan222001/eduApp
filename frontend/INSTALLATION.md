# Installation & Setup Instructions

Complete guide to installing and configuring the React TypeScript frontend application.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

## System Requirements

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: v2.0.0 or higher

### Optional Tools

- **VS Code**: Recommended IDE
- **Chrome/Firefox**: Latest version for development

### System Specifications

- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 500MB for dependencies

## Installation

### Step 1: Verify Prerequisites

Check Node.js version:

```bash
node --version
# Should output: v18.x.x or higher
```

Check npm version:

```bash
npm --version
# Should output: 9.x.x or higher
```

### Step 2: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 3: Install Dependencies

Install all required packages:

```bash
npm install
```

This will install:

- React and React DOM
- TypeScript
- Vite
- React Router
- Material-UI
- React Query
- Zustand
- Axios
- All dev dependencies (ESLint, Prettier, etc.)

**Expected output:**

```
added XXX packages in XXs
```

**Installation time:** 2-5 minutes depending on your internet connection.

### Step 4: Verify Installation

Check that dependencies were installed:

```bash
npm list --depth=0
```

Should show all packages listed in `package.json`.

## Configuration

### Environment Variables

#### Step 1: Create Environment File

Copy the example environment file:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Mac/Linux
cp .env.example .env
```

#### Step 2: Configure Environment Variables

Edit `.env` file with your settings:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Application Info
VITE_APP_NAME=Frontend App
VITE_APP_VERSION=0.0.0
```

#### Environment Variable Guide

| Variable            | Description      | Default                 | Required |
| ------------------- | ---------------- | ----------------------- | -------- |
| `VITE_API_BASE_URL` | Backend API URL  | `http://localhost:8000` | Yes      |
| `VITE_APP_NAME`     | Application name | `Frontend App`          | No       |
| `VITE_APP_VERSION`  | Version number   | `0.0.0`                 | No       |

**Important Notes:**

- All variables must be prefixed with `VITE_`
- Changes require server restart
- Never commit `.env` to version control

### Environment-Specific Configuration

#### Development Environment

File: `.env.development`

```env
VITE_API_BASE_URL=http://localhost:8000
```

#### Production Environment

File: `.env.production`

```env
VITE_API_BASE_URL=https://api.production.com
```

Vite automatically loads the correct file based on mode.

### Git Hooks Setup

Initialize Husky for pre-commit hooks:

```bash
npm run prepare
```

This sets up:

- Automatic linting on commit
- Code formatting on commit
- Prevents committing broken code

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

**Expected output:**

```
VITE v5.0.11  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h to show help
```

**Server starts on:** http://localhost:3000

**Features:**

- Hot Module Replacement (HMR)
- Fast refresh
- Source maps
- Error overlay

### Production Build

Build for production:

```bash
npm run build
```

**Expected output:**

```
vite v5.0.11 building for production...
✓ XXX modules transformed.
dist/index.html                  X.XX kB
dist/assets/index-XXXX.css       X.XX kB
dist/assets/index-XXXX.js        XXX.XX kB
✓ built in XXXXms
```

**Output location:** `dist/` directory

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

**Server starts on:** http://localhost:4173

## Verification

### 1. Development Server Running

✅ Visit http://localhost:3000
✅ You should see the home page
✅ Navigation links work
✅ No console errors

### 2. Hot Module Replacement

✅ Edit `src/pages/Home.tsx`
✅ Changes appear immediately
✅ No page reload needed

### 3. TypeScript Compilation

```bash
npm run type-check
```

✅ Should complete with no errors

### 4. Linting

```bash
npm run lint
```

✅ Should report no errors or warnings

### 5. Code Formatting

```bash
npm run format:check
```

✅ All files should be properly formatted

### 6. Build Success

```bash
npm run build
```

✅ Build completes without errors
✅ `dist/` directory is created
✅ Files are minified

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:**

```
Port 3000 is already in use
```

**Solutions:**

**Option A: Kill the process**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Option B: Change port**

Edit `vite.config.ts`:

```ts
server: {
  port: 3001, // Change to any available port
}
```

#### 2. Module Not Found

**Error:**

```
Cannot find module 'XXX'
```

**Solution:**

```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### 3. Permission Denied (Mac/Linux)

**Error:**

```
EACCES: permission denied
```

**Solution:**

```bash
# Fix permissions
sudo chown -R $USER:$USER node_modules
sudo chown -R $USER:$USER ~/.npm
```

Or use nvm to manage Node.js.

#### 4. TypeScript Errors

**Error:**

```
Type 'X' is not assignable to type 'Y'
```

**Solution:**

```bash
# Restart TypeScript server (VS Code)
# Command Palette -> TypeScript: Restart TS Server

# Or clean and rebuild
rm -rf node_modules/.cache
npm run type-check
```

#### 5. ESLint Errors

**Error:**

```
Parsing error: XXX
```

**Solution:**

```bash
# Fix auto-fixable issues
npm run lint:fix

# Check configuration
npm run lint -- --debug
```

#### 6. Build Fails

**Error:**

```
Build failed with errors
```

**Solution:**

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear build directory
rm -rf dist

# Try building again
npm run build
```

#### 7. Environment Variables Not Working

**Issue:** Variables show as undefined

**Solution:**

1. Ensure variable is prefixed with `VITE_`
2. Restart development server
3. Check `.env` file location (must be in root)
4. Verify no typos in variable names

#### 8. Slow Installation

**Issue:** `npm install` takes too long

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Use faster mirror (China)
npm install --registry=https://registry.npmmirror.com

# Or use yarn/pnpm
npm install -g yarn
yarn install
```

### Getting Help

If you encounter issues not listed here:

1. **Check documentation:**
   - `README.md`
   - `DEVELOPMENT.md`
   - `QUICKSTART.md`

2. **Review configurations:**
   - `vite.config.ts`
   - `tsconfig.json`
   - `.eslintrc.cjs`

3. **Check logs:**
   - Browser console
   - Terminal output
   - Network tab

4. **Common fixes:**
   ```bash
   # Nuclear option - fresh start
   rm -rf node_modules package-lock.json
   npm install
   ```

## Next Steps

After successful installation:

1. **Read the documentation:**
   - 📖 `README.md` - Overview
   - 🚀 `QUICKSTART.md` - Quick start guide
   - 🛠 `DEVELOPMENT.md` - Development guidelines
   - 🏗 `ARCHITECTURE.md` - Architecture details

2. **Explore the code:**
   - Start with `src/main.tsx` (entry point)
   - Review `src/App.tsx` (routing)
   - Check `src/pages/` (page components)

3. **Start developing:**
   - Create new pages
   - Add components
   - Integrate APIs
   - Customize theme

4. **Run quality checks:**
   ```bash
   npm run lint
   npm run format
   npm run type-check
   npm run build
   ```

## Summary Checklist

Installation complete when you can:

- ✅ Run `npm run dev` without errors
- ✅ Access http://localhost:3000
- ✅ See the home page
- ✅ Navigate between pages
- ✅ Build production version
- ✅ Run linting and formatting
- ✅ TypeScript compiles without errors

## Support

For additional help:

- Check official documentation of tools used
- Review example code in `src/`
- Consult framework documentation

## Technology Documentation

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Material-UI](https://mui.com/)
- [React Router](https://reactrouter.com/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)
