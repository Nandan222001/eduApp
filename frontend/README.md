# Frontend Application

A modern React web application built with TypeScript, Vite, and Material-UI.

## Tech Stack

- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation build tool
- **React Router v6** - Client-side routing
- **Material-UI v5** - React component library
- **React Query (TanStack Query)** - Data fetching and caching
- **Zustand** - Lightweight state management
- **Axios** - HTTP client
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Development

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── api/            # API client functions
│   ├── components/     # Reusable React components
│   ├── config/         # Configuration files
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Third-party library configurations
│   ├── pages/          # Page components
│   ├── store/          # Zustand stores
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main App component
│   ├── main.tsx        # Application entry point
│   ├── theme.ts        # Material-UI theme configuration
│   └── index.css       # Global styles
├── .eslintrc.cjs       # ESLint configuration
├── .prettierrc.json    # Prettier configuration
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies and scripts
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Frontend App
VITE_APP_VERSION=0.0.0
```

Different environment files:

- `.env.development` - Development environment
- `.env.production` - Production environment

## Features

### Routing

React Router v6 is configured with:

- Nested routes
- Protected routes support
- 404 page handling

### State Management

- **Zustand** for global application state
- **React Query** for server state management
- Persisted state with localStorage

### Data Fetching

React Query provides:

- Automatic caching
- Background refetching
- Optimistic updates
- Dev tools for debugging

### Styling

Material-UI with:

- Custom theme configuration
- Responsive design
- Dark mode support (configurable)
- CSS-in-JS with Emotion

### Code Quality

- ESLint with TypeScript support
- Prettier for consistent formatting
- Husky for pre-commit hooks
- Lint-staged for staged files

## Development Guidelines

### Component Structure

```tsx
// Component template
import { FC } from 'react';

interface ComponentProps {
  // props definition
}

export const Component: FC<ComponentProps> = ({ props }) => {
  return <div>Component</div>;
};
```

### API Integration

Use React Query hooks for data fetching:

```tsx
import { useQuery } from '@tanstack/react-query';
import { exampleApi } from '@/api/example';

const { data, isLoading, error } = useQuery({
  queryKey: ['examples'],
  queryFn: exampleApi.getAll,
});
```

### State Management

Use Zustand for global state:

```tsx
import { useAppStore } from '@/store/useAppStore';

const { user, setUser } = useAppStore();
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## License

Private
