# Frontend Setup Guide

Complete setup instructions for the React TypeScript application.

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher (or yarn/pnpm)
- Git

## Installation Steps

### 1. Clone and Navigate

If not already in the project:

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:

- React 18.2
- TypeScript 5.3
- Vite 5.0
- Material-UI 5.15
- React Router 6.21
- React Query 5.17
- Zustand 4.5
- And all development dependencies

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
VITE_API_BASE_URL=http://localhost:8000  # Backend API URL
VITE_APP_NAME=Frontend App               # Application name
VITE_APP_VERSION=0.0.0                   # Version number
```

### 4. Initialize Husky (Git Hooks)

```bash
npm run prepare
```

This sets up pre-commit hooks for code quality checks.

### 5. Start Development Server

```bash
npm run dev
```

The application will start at http://localhost:3000

## Verification

### Check Installation

1. **Development server running:**
   - Open http://localhost:3000
   - You should see the home page

2. **Hot Module Replacement (HMR):**
   - Edit any file in `src/`
   - Changes should reflect immediately in the browser

3. **TypeScript compilation:**

   ```bash
   npm run type-check
   ```

   Should complete without errors

4. **Linting:**

   ```bash
   npm run lint
   ```

   Should show no errors

5. **Formatting:**
   ```bash
   npm run format:check
   ```
   Should show files are formatted correctly

## Common Issues

### Port Already in Use

If port 3000 is already in use:

1. **Option 1:** Stop the process using port 3000
2. **Option 2:** Change the port in `vite.config.ts`:
   ```ts
   server: {
     port: 3001, // Change to desired port
   }
   ```

### Node Version Mismatch

Ensure you're using Node.js 18 or higher:

```bash
node --version
```

If not, install/update Node.js from https://nodejs.org/

### Module Not Found Errors

Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Permission Errors (Linux/Mac)

If you get permission errors:

```bash
sudo chown -R $USER:$USER node_modules
```

Or use nvm to manage Node.js versions per-user.

## Project Structure Overview

```
frontend/
├── public/              # Static assets
│   ├── vite.svg
│   └── robots.txt
├── src/
│   ├── api/            # API client functions
│   ├── components/     # Reusable components
│   ├── config/         # Configuration
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Library configurations
│   ├── pages/          # Page components
│   ├── store/          # Zustand stores
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilities
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   ├── theme.ts        # MUI theme
│   └── index.css       # Global styles
├── .husky/             # Git hooks
├── .vscode/            # VS Code settings
├── index.html          # HTML template
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── vite.config.ts      # Vite config
├── .eslintrc.cjs       # ESLint config
├── .prettierrc.json    # Prettier config
└── README.md           # Documentation
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting
- `npm run type-check` - TypeScript type checking

## Next Steps

1. **Read the documentation:**
   - `README.md` - General overview
   - `DEVELOPMENT.md` - Development guidelines

2. **Explore the codebase:**
   - Start with `src/main.tsx`
   - Review routing in `src/App.tsx`
   - Check example API integration in `src/hooks/useExample.ts`

3. **Customize the application:**
   - Update theme in `src/theme.ts`
   - Modify environment variables in `.env`
   - Add your own components and pages

4. **Configure IDE:**
   - VS Code: Extensions will be recommended automatically
   - WebStorm/IntelliJ: Import `.editorconfig` settings

## Development Workflow

1. **Create a new feature:**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes:**
   - Code is automatically linted on save (VS Code)
   - Pre-commit hooks run on commit

3. **Commit changes:**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   Husky will automatically run linting and formatting

4. **Build and test:**
   ```bash
   npm run build
   npm run preview
   ```

## Technology Stack

### Core

- **React 18.2** - UI library
- **TypeScript 5.3** - Type safety
- **Vite 5.0** - Build tool

### Routing & Data

- **React Router 6.21** - Client-side routing
- **React Query 5.17** - Server state management
- **Axios 1.6** - HTTP client

### UI & Styling

- **Material-UI 5.15** - Component library
- **Emotion 11.11** - CSS-in-JS

### State Management

- **Zustand 4.5** - Global state

### Code Quality

- **ESLint 8.56** - Linting
- **Prettier 3.2** - Formatting
- **Husky 8.0** - Git hooks
- **lint-staged 15.2** - Staged files linting

## Support

For issues or questions:

1. Check `DEVELOPMENT.md` for development guidelines
2. Review existing code examples in `src/`
3. Consult official documentation:
   - [Vite](https://vitejs.dev/)
   - [React](https://react.dev/)
   - [TypeScript](https://www.typescriptlang.org/)
   - [Material-UI](https://mui.com/)
   - [React Query](https://tanstack.com/query/latest)
   - [Zustand](https://github.com/pmndrs/zustand)
