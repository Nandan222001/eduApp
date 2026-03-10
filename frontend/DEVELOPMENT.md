# Development Guide

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Setup environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your local configuration.

3. **Start development server:**
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:3000

## Project Structure

### Key Directories

- **`src/api/`** - API client functions organized by resource
- **`src/components/`** - Reusable UI components
- **`src/config/`** - Configuration files (environment variables, constants)
- **`src/hooks/`** - Custom React hooks
- **`src/lib/`** - Third-party library configurations (axios, etc.)
- **`src/pages/`** - Page-level components matching routes
- **`src/store/`** - Zustand store definitions
- **`src/types/`** - TypeScript type definitions
- **`src/utils/`** - Utility functions

### Code Organization

```
src/
├── api/
│   └── example.ts           # API client for example resource
├── components/
│   ├── Layout.tsx           # Main layout wrapper
│   ├── Header.tsx           # App header/navigation
│   ├── Footer.tsx           # App footer
│   ├── Loading.tsx          # Loading state component
│   └── ErrorBoundary.tsx    # Error boundary wrapper
├── config/
│   └── env.ts               # Environment variable management
├── hooks/
│   └── useExample.ts        # React Query hooks for examples
├── lib/
│   └── axios.ts             # Configured axios instance
├── pages/
│   ├── Home.tsx             # Home page
│   ├── About.tsx            # About page
│   └── NotFound.tsx         # 404 page
├── store/
│   └── useAppStore.ts       # Global app state (Zustand)
├── types/
│   └── example.ts           # Type definitions
├── utils/
│   └── formatters.ts        # Formatting utilities
├── App.tsx                  # Main app component with routing
├── main.tsx                 # Application entry point
├── theme.ts                 # Material-UI theme
└── index.css                # Global styles
```

## Development Workflow

### Adding a New Feature

1. **Create types** in `src/types/`
2. **Add API client** in `src/api/`
3. **Create custom hooks** in `src/hooks/` using React Query
4. **Build components** in `src/components/`
5. **Create pages** in `src/pages/`
6. **Add routes** in `src/App.tsx`

### Working with State

#### Global State (Zustand)

Use for application-wide state like authentication, theme, etc.

```tsx
import { useAppStore } from '@/store/useAppStore';

const { user, setUser } = useAppStore();
```

#### Server State (React Query)

Use for data fetching and caching.

```tsx
import { useExamples } from '@/hooks/useExample';

const { data, isLoading, error } = useExamples();
```

### API Integration

1. **Define types:**

   ```tsx
   // src/types/resource.ts
   export interface Resource {
     id: string;
     name: string;
   }
   ```

2. **Create API client:**

   ```tsx
   // src/api/resource.ts
   import axios from '@/lib/axios';

   export const resourceApi = {
     getAll: () => axios.get<Resource[]>('/api/resources'),
     getById: (id: string) => axios.get<Resource>(`/api/resources/${id}`),
   };
   ```

3. **Create hooks:**

   ```tsx
   // src/hooks/useResource.ts
   import { useQuery } from '@tanstack/react-query';
   import { resourceApi } from '@/api/resource';

   export const useResources = () => {
     return useQuery({
       queryKey: ['resources'],
       queryFn: resourceApi.getAll,
     });
   };
   ```

## Code Quality

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Formatting

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### Type Checking

```bash
npm run type-check
```

### Pre-commit Hooks

Husky automatically runs linting and formatting on staged files before commit.

## Environment Variables

All environment variables must be prefixed with `VITE_` to be exposed to the client.

### Available Variables

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version

### Accessing Environment Variables

```tsx
import { env } from '@/config/env';

console.log(env.apiBaseUrl);
```

## Building for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

Build output will be in the `dist/` directory.

## Styling Guidelines

### Material-UI Components

Use Material-UI components for consistent design:

```tsx
import { Button, TextField, Box } from '@mui/material';
```

### Custom Styling

Use the `sx` prop for custom styles:

```tsx
<Box sx={{ padding: 2, backgroundColor: 'primary.main' }}>Content</Box>
```

### Theme Customization

Edit `src/theme.ts` to customize the application theme.

## Testing (Future)

Testing setup can be added with:

- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing

## Common Tasks

### Adding a New Route

```tsx
// src/App.tsx
<Route path="/new-page" element={<NewPage />} />
```

### Creating a Protected Route

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAppStore();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}
```

### Adding Global State

```tsx
// src/store/useAppStore.ts
interface AppState {
  newValue: string;
  setNewValue: (value: string) => void;
}

// Add to store definition
newValue: '',
setNewValue: (value) => set({ newValue: value }),
```

## Troubleshooting

### Port Already in Use

Change the port in `vite.config.ts`:

```ts
server: {
  port: 3001, // Change to desired port
}
```

### Module Resolution Issues

Ensure path aliases are configured in both:

- `tsconfig.json` (for TypeScript)
- `vite.config.ts` (for Vite)

### Build Errors

1. Clear cache: `rm -rf node_modules dist .vite`
2. Reinstall: `npm install`
3. Rebuild: `npm run build`
