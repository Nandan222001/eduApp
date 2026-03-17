# App Directory - Expo Router

This directory contains the file-based routing structure for the EDU Mobile application using Expo Router.

## Structure

- `_layout.tsx` - Root layout with providers and authentication logic
- `index.tsx` - Root redirect based on auth state
- `(auth)/` - Authentication screens (grouped, not in URL)
- `(tabs)/` - Tab navigator screens
  - `student/` - Student tab screens
  - `parent/` - Parent tab screens
- Dynamic routes for detail screens

## File Naming Conventions

- `_layout.tsx` - Layout file for nested routes
- `index.tsx` - Default route for a directory
- `[id].tsx` - Dynamic route parameter
- `(folder)` - Route group (not shown in URL)

## Adding New Routes

1. Create a new file in the appropriate directory
2. Export a default component
3. The file path determines the route

Example:

```
app/
  settings.tsx  → /settings
  courses/
    [id].tsx    → /courses/:id
```

See EXPO_ROUTER_MIGRATION.md for detailed documentation.
