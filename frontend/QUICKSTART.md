# Quick Start Guide

Get up and running with the React TypeScript application in minutes.

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed

## Quick Setup (3 Steps)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local development):

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## That's It! 🎉

You now have:

- ✅ React 18 with TypeScript
- ✅ Vite for fast development
- ✅ React Router for navigation
- ✅ Material-UI components
- ✅ React Query for data fetching
- ✅ Zustand for state management
- ✅ ESLint + Prettier configured
- ✅ Pre-commit hooks with Husky

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Check for linting errors
npm run lint:fix         # Fix linting errors automatically
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types
```

## Project Overview

### Key Files

- `src/main.tsx` - Application entry point
- `src/App.tsx` - Main app with routing
- `src/theme.ts` - Material-UI theme
- `.env` - Environment variables
- `vite.config.ts` - Vite configuration

### Folder Structure

```
src/
├── api/          # API functions
├── components/   # Reusable components
├── pages/        # Page components
├── hooks/        # Custom React hooks
├── store/        # Zustand state
├── types/        # TypeScript types
└── utils/        # Utility functions
```

## Next Steps

1. **Explore the code:**
   - Check out example components in `src/components/`
   - See example API integration in `src/hooks/useExample.ts`
   - Review state management in `src/store/useAppStore.ts`

2. **Add your first page:**

   ```tsx
   // src/pages/MyPage.tsx
   import { Container, Typography } from '@mui/material';

   export default function MyPage() {
     return (
       <Container>
         <Typography variant="h4">My New Page</Typography>
       </Container>
     );
   }
   ```

3. **Add a route:**

   ```tsx
   // src/App.tsx
   import MyPage from './pages/MyPage';

   // Inside <Routes>
   <Route path="/my-page" element={<MyPage />} />;
   ```

4. **Create an API endpoint:**

   ```tsx
   // src/api/myApi.ts
   import axios from '@/lib/axios';

   export const myApi = {
     getData: () => axios.get('/api/my-endpoint'),
   };
   ```

5. **Use React Query:**

   ```tsx
   // src/hooks/useMyData.ts
   import { useQuery } from '@tanstack/react-query';
   import { myApi } from '@/api/myApi';

   export const useMyData = () => {
     return useQuery({
       queryKey: ['myData'],
       queryFn: myApi.getData,
     });
   };
   ```

## Learn More

- 📖 [README.md](./README.md) - Full documentation
- 🛠 [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guidelines
- ⚙️ [SETUP.md](./SETUP.md) - Detailed setup instructions

## Troubleshooting

**Port 3000 already in use?**

```bash
# Change port in vite.config.ts or kill the process
lsof -ti:3000 | xargs kill -9  # Mac/Linux
```

**Module errors?**

```bash
rm -rf node_modules package-lock.json
npm install
```

**Types not working?**

```bash
npm run type-check
```

## Tech Stack Summary

| Technology   | Version | Purpose          |
| ------------ | ------- | ---------------- |
| React        | 18.2    | UI Library       |
| TypeScript   | 5.3     | Type Safety      |
| Vite         | 5.0     | Build Tool       |
| React Router | 6.21    | Routing          |
| Material-UI  | 5.15    | Components       |
| React Query  | 5.17    | Data Fetching    |
| Zustand      | 4.5     | State Management |
| Axios        | 1.6     | HTTP Client      |

Happy coding! 🚀
