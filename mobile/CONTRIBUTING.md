# Contributing to EDU Mobile App

Thank you for your interest in contributing to the EDU Mobile App! This guide will help you understand our development workflow, coding standards, and best practices.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Component Creation Guidelines](#component-creation-guidelines)
- [API Integration Patterns](#api-integration-patterns)
- [State Management Best Practices](#state-management-best-practices)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [Commit Message Convention](#commit-message-convention)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. Completed the setup instructions in [README.md](./README.md)
2. Read the project architecture and folder structure
3. Reviewed existing code to understand patterns
4. Set up your development environment properly

### Setting Up Your Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd mobile

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.development

# Start development server
npm start
```

## Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b refactor/component-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions or modifications

### 2. Make Your Changes

Follow the coding standards and best practices outlined below.

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Run type checker
npm run type-check

# Run tests
npm test

# Test on both platforms
npm run ios
npm run android
```

### 4. Commit Your Changes

Follow the [commit message convention](#commit-message-convention).

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Coding Standards

### TypeScript

- **Always use TypeScript** - No plain JavaScript files
- **Define types explicitly** - Avoid `any` type unless absolutely necessary
- **Use interfaces for objects** - Prefer interfaces over type aliases for object shapes
- **Export types** - Make types reusable across the codebase

```typescript
// ✅ Good
interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

const user: UserProfile = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
};

// ❌ Bad
const user: any = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
};
```

### Code Style

- **Indentation**: 2 spaces
- **Line length**: Maximum 100 characters
- **Semicolons**: Required
- **Quotes**: Single quotes for strings
- **Trailing commas**: Required in multiline objects/arrays

```typescript
// ✅ Good
const config = {
  timeout: 3000,
  retries: 3,
  baseURL: 'https://api.example.com',
};

// ❌ Bad
const config = {
  timeout: 3000,
  retries: 3,
  baseURL: "https://api.example.com"
}
```

### Naming Conventions

- **Components**: PascalCase - `UserProfile.tsx`, `AssignmentCard.tsx`
- **Files**: camelCase - `authService.ts`, `validation.ts`
- **Constants**: UPPER_SNAKE_CASE - `API_TIMEOUT`, `MAX_RETRIES`
- **Functions/Variables**: camelCase - `getUserData`, `isAuthenticated`
- **Interfaces**: PascalCase with descriptive names - `User`, `Assignment`, `ApiResponse`
- **Types**: PascalCase - `UserRole`, `AssignmentStatus`

```typescript
// ✅ Good
const API_TIMEOUT = 30000;

interface Assignment {
  id: number;
  title: string;
}

const fetchAssignments = async (): Promise<Assignment[]> => {
  // ...
};

// ❌ Bad
const api_timeout = 30000;

interface assignment {
  id: number;
  title: string;
}

const FetchAssignments = async () => {
  // ...
};
```

### File Organization

- **One component per file** - Easier to maintain and test
- **Index files for exports** - Use `index.ts` to export multiple items from a folder
- **Co-locate related files** - Keep styles, tests, and types near components
- **Logical folder structure** - Group by feature or domain

```
components/
├── student/
│   ├── AssignmentCard/
│   │   ├── AssignmentCard.tsx
│   │   ├── AssignmentCard.test.tsx
│   │   ├── AssignmentCard.styles.ts
│   │   └── index.ts
│   └── index.ts
```

## Component Creation Guidelines

### Functional Components

Always use functional components with hooks:

```typescript
// ✅ Good - Functional component with TypeScript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AssignmentCardProps {
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  onPress: () => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  title,
  dueDate,
  status,
  onPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Side effects
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.dueDate}>{dueDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
  },
});
```

### Props and PropTypes

- **Define props interface** - Always create an interface for component props
- **Use destructuring** - Destructure props in function parameters
- **Document props** - Add JSDoc comments for complex props
- **Default props** - Use default parameter values

```typescript
interface ButtonProps {
  /** Button text label */
  title: string;
  /** Callback when button is pressed */
  onPress: () => void;
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Disable button interaction */
  disabled?: boolean;
  /** Show loading spinner */
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}) => {
  // Component implementation
};
```

### Component Structure

Follow this order for component code:

1. Imports
2. Type definitions/interfaces
3. Component function
4. Hooks (in order: state, effects, callbacks)
5. Helper functions
6. JSX return
7. Styles

```typescript
// 1. Imports
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// 2. Type definitions
interface MyComponentProps {
  title: string;
  onSubmit: (data: FormData) => void;
}

// 3. Component function
export const MyComponent: React.FC<MyComponentProps> = ({ title, onSubmit }) => {
  // 4. Hooks
  const navigation = useNavigation();
  const [data, setData] = useState<FormData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const handlePress = useCallback(() => {
    // Handle press
  }, [data]);

  // 5. Helper functions
  const loadData = async () => {
    // Load data
  };

  // 6. JSX return
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

// 7. Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

### Reusable Components

Create reusable components for common UI patterns:

- Keep components small and focused
- Accept props for customization
- Use composition over configuration
- Document usage examples

```typescript
// Example: Reusable Card component
interface CardProps {
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  footer,
  onPress,
  style,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={[styles.card, style]} onPress={onPress}>
      {title && <Text style={styles.cardTitle}>{title}</Text>}
      <View style={styles.cardBody}>{children}</View>
      {footer && <View style={styles.cardFooter}>{footer}</View>}
    </Wrapper>
  );
};
```

## API Integration Patterns

### Using the API Client

Always use the centralized API client:

```typescript
import { apiClient } from '@api/client';

// ✅ Good - Using API client
const fetchAssignments = async () => {
  try {
    const response = await apiClient.get<Assignment[]>('/api/v1/assignments');
    return response.data;
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
};

// ❌ Bad - Direct fetch/axios
const fetchAssignments = async () => {
  const response = await fetch('http://localhost:8000/api/v1/assignments');
  return response.json();
};
```

### API Module Structure

Create dedicated API modules for each domain:

```typescript
// src/api/assignments.ts
import { apiClient } from './client';

export interface Assignment {
  id: number;
  title: string;
  dueDate: string;
  status: string;
}

export interface CreateAssignmentData {
  title: string;
  description: string;
  dueDate: string;
}

export const assignmentsApi = {
  // GET endpoints
  getAssignments: async (params?: { status?: string }) => {
    return apiClient.get<Assignment[]>('/api/v1/assignments', { params });
  },

  getAssignment: async (id: number) => {
    return apiClient.get<Assignment>(`/api/v1/assignments/${id}`);
  },

  // POST endpoints
  createAssignment: async (data: CreateAssignmentData) => {
    return apiClient.post<Assignment>('/api/v1/assignments', data);
  },

  // PUT endpoints
  updateAssignment: async (id: number, data: Partial<CreateAssignmentData>) => {
    return apiClient.put<Assignment>(`/api/v1/assignments/${id}`, data);
  },

  // DELETE endpoints
  deleteAssignment: async (id: number) => {
    return apiClient.delete(`/api/v1/assignments/${id}`);
  },
};
```

### Error Handling

Always handle errors gracefully:

```typescript
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await assignmentsApi.getAssignments();
    setData(response.data);
    setError(null);
  } catch (error: any) {
    setError(error.message || 'An error occurred');
    console.error('Error:', error);
    
    // Show user-friendly error message
    Alert.alert(
      'Error',
      error.message || 'Failed to load assignments. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};
```

### Offline Support

Use offline-aware API calls for critical data:

```typescript
import { offlineAwareApi } from '@api/offlineAwareApi';

const submitAssignment = async (assignmentId: number, data: FormData) => {
  try {
    // This will queue the request if offline and sync when online
    await offlineAwareApi.post(
      `/api/v1/assignments/${assignmentId}/submit`,
      data,
      {
        offlineKey: `submit-assignment-${assignmentId}`,
        offlineData: { assignmentId, ...data },
      }
    );
  } catch (error) {
    console.error('Error submitting assignment:', error);
    throw error;
  }
};
```

## State Management Best Practices

### Zustand Store Structure

Create focused stores for different domains:

```typescript
// src/store/assignmentsStore.ts
import { create } from 'zustand';
import { assignmentsApi, Assignment } from '@api/assignments';

interface AssignmentsState {
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
  
  fetchAssignments: () => Promise<void>;
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (id: number, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: number) => void;
  clearError: () => void;
}

export const useAssignmentsStore = create<AssignmentsState>((set, get) => ({
  assignments: [],
  isLoading: false,
  error: null,

  fetchAssignments: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await assignmentsApi.getAssignments();
      set({ assignments: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addAssignment: (assignment) => {
    set((state) => ({
      assignments: [...state.assignments, assignment],
    }));
  },

  updateAssignment: (id, updates) => {
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  },

  deleteAssignment: (id) => {
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== id),
    }));
  },

  clearError: () => set({ error: null }),
}));
```

### Using Stores in Components

```typescript
import { useAssignmentsStore } from '@store/assignmentsStore';

export const AssignmentsScreen: React.FC = () => {
  const { 
    assignments, 
    isLoading, 
    error, 
    fetchAssignments 
  } = useAssignmentsStore();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <FlatList
      data={assignments}
      renderItem={({ item }) => <AssignmentCard assignment={item} />}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};
```

### Store Best Practices

- **Single responsibility** - Each store manages one domain
- **Immutable updates** - Always create new objects/arrays
- **Avoid nesting** - Keep state flat when possible
- **Selective subscriptions** - Only subscribe to needed state
- **Async actions** - Handle loading and error states

```typescript
// ✅ Good - Selective subscription
const assignments = useAssignmentsStore((state) => state.assignments);
const fetchAssignments = useAssignmentsStore((state) => state.fetchAssignments);

// ❌ Bad - Subscribes to entire store
const store = useAssignmentsStore();
```

## Testing Requirements

### Unit Tests

All new code must include unit tests:

```typescript
// AssignmentCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AssignmentCard } from './AssignmentCard';

describe('AssignmentCard', () => {
  const mockAssignment = {
    id: 1,
    title: 'Math Homework',
    dueDate: '2024-01-15',
    status: 'pending' as const,
  };

  it('renders assignment details correctly', () => {
    const { getByText } = render(
      <AssignmentCard 
        assignment={mockAssignment} 
        onPress={jest.fn()} 
      />
    );

    expect(getByText('Math Homework')).toBeTruthy();
    expect(getByText('2024-01-15')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AssignmentCard 
        assignment={mockAssignment} 
        onPress={onPress} 
      />
    );

    fireEvent.press(getByTestId('assignment-card'));
    expect(onPress).toHaveBeenCalledWith(mockAssignment);
  });
});
```

### Test Coverage Requirements

- **Minimum coverage**: 80% for new code
- **Critical paths**: 100% coverage for auth, payments, submissions
- **Components**: Test rendering, user interactions, edge cases
- **API**: Mock all API calls
- **Stores**: Test all actions and state updates

### Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test AssignmentCard.test.tsx
```

### E2E Testing

For critical user flows, add E2E tests:

```typescript
// e2e/login.test.ts
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should login successfully with valid credentials', async () => {
    await element(by.id('email-input')).typeText('student@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
```

## Pull Request Process

### Before Creating a PR

1. **Update your branch** with the latest from main
   ```bash
   git checkout main
   git pull
   git checkout feature/your-feature
   git rebase main
   ```

2. **Run all checks**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run format:check
   ```

3. **Test on both platforms**
   ```bash
   npm run ios
   npm run android
   ```

4. **Update documentation** if needed

### PR Title Format

Use conventional commit format:

```
<type>(<scope>): <description>

Examples:
feat(assignments): add assignment submission feature
fix(auth): resolve token refresh issue
refactor(navigation): simplify tab navigator structure
docs(readme): update setup instructions
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
```

### PR Size Guidelines

- **Small PRs are better** - Aim for < 400 lines changed
- **Single responsibility** - One feature/fix per PR
- **Split large changes** - Create multiple PRs if needed

## Code Review Guidelines

### For Reviewers

- **Review promptly** - Within 24 hours
- **Be constructive** - Suggest improvements, don't just criticize
- **Ask questions** - If unclear, ask for clarification
- **Test the code** - Pull and test locally when needed
- **Check tests** - Ensure adequate test coverage

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Logic is clear and well-organized
- [ ] No unnecessary complexity
- [ ] Error handling is adequate
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance implications considered
- [ ] Accessibility considered
- [ ] Works on both iOS and Android

### For Contributors

- **Respond to feedback** - Address all comments
- **Be open to suggestions** - Consider alternative approaches
- **Update PR** - Make requested changes promptly
- **Resolve conversations** - Mark resolved when addressed

## Commit Message Convention

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
feat(assignments): add file upload to assignment submission

# Bug fix
fix(auth): resolve token expiration handling

# Documentation
docs(api): update API integration examples

# Refactor
refactor(components): extract reusable Button component

# Test
test(assignments): add unit tests for AssignmentCard

# Chore
chore(deps): update react-navigation to v6.1.9
```

### Best Practices

- **Use imperative mood** - "add feature" not "added feature"
- **Keep subject < 72 characters**
- **Capitalize subject line**
- **No period at the end**
- **Separate subject from body** with blank line
- **Explain what and why** in body, not how

## Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search through past issues/PRs
3. Ask in the team chat
4. Create an issue for discussion

Thank you for contributing to EDU Mobile App! 🎉
