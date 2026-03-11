# Error Handling & Loading States UI Documentation

## Overview

This document provides comprehensive documentation for the error handling and loading states UI components implemented in the frontend application.

## Components

### 1. Skeleton Loaders

Skeleton loaders provide placeholder content while data is being fetched, matching the final layout of the content.

#### SkeletonLoader

A versatile skeleton loader with multiple variants.

```tsx
import { SkeletonLoader } from '@/components/common';

<SkeletonLoader variant="card" count={3} />
<SkeletonLoader variant="table" count={1} />
<SkeletonLoader variant="list" count={5} />
<SkeletonLoader variant="form" count={1} />
<SkeletonLoader variant="chart" count={1} />
<SkeletonLoader variant="dashboard" />
```

**Props:**

- `variant`: 'card' | 'table' | 'list' | 'form' | 'chart' | 'dashboard'
- `count`: number (default: 1)

#### Specialized Skeletons

```tsx
import { TableSkeleton, CardGridSkeleton, StatCardSkeleton } from '@/components/common';

<TableSkeleton rows={5} columns={6} showHeader showPagination />
<CardGridSkeleton count={6} columns={{ xs: 12, sm: 6, md: 4 }} />
<StatCardSkeleton count={4} />
```

### 2. Error Boundary

Catches JavaScript errors anywhere in the component tree and displays a fallback UI.

#### ErrorBoundaryWrapper

```tsx
import { ErrorBoundaryWrapper } from '@/components/common';

<ErrorBoundaryWrapper
  showDetails={process.env.NODE_ENV === 'development'}
  onError={(error, errorInfo) => {
    // Log to error reporting service
  }}
>
  <YourApp />
</ErrorBoundaryWrapper>;
```

**Props:**

- `children`: ReactNode
- `fallback?`: ReactNode (custom fallback UI)
- `onError?`: (error: Error, errorInfo: ErrorInfo) => void
- `showDetails?`: boolean (show error stack trace)

### 3. Error Display

User-friendly error messages with retry functionality.

#### ErrorDisplay

```tsx
import { ErrorDisplay } from '@/components/common';

<ErrorDisplay
  title="Error Loading Data"
  message="Unable to fetch the requested information."
  error={error}
  onRetry={refetch}
  variant="standard"
/>;
```

**Props:**

- `title?`: string
- `message?`: string
- `error?`: Error | string
- `onRetry?`: () => void
- `retryLabel?`: string
- `showIcon?`: boolean
- `variant?`: 'standard' | 'minimal' | 'inline'

### 4. Empty State

Display empty states with call-to-action buttons.

#### EmptyState

```tsx
import { EmptyState } from '@/components/common';

<EmptyState
  title="No Students Found"
  message="You haven't added any students yet."
  iconType="people"
  actionLabel="Add Student"
  onAction={handleAddStudent}
  variant="card"
/>;
```

**Props:**

- `title?`: string
- `message?`: string
- `icon?`: ReactNode
- `iconType?`: 'inbox' | 'search' | 'folder' | 'assignment' | 'people' | 'event' | 'school'
- `actionLabel?`: string
- `onAction?`: () => void
- `secondaryActionLabel?`: string
- `onSecondaryAction?`: () => void
- `variant?`: 'standard' | 'minimal' | 'card'

### 5. Loading Overlay

Full-screen or inline loading overlay with optional progress indicator.

#### LoadingOverlay

```tsx
import { LoadingOverlay } from '@/components/common';

<LoadingOverlay
  open={isProcessing}
  message="Processing your request..."
  progress={uploadProgress}
  showProgress
  backdrop
/>;
```

**Props:**

- `open`: boolean
- `message?`: string
- `progress?`: number (0-100)
- `showProgress?`: boolean
- `backdrop?`: boolean
- `children?`: ReactNode

### 6. Offline Indicator

Banner that appears when the user loses internet connectivity.

#### OfflineIndicator

```tsx
import { OfflineIndicator } from '@/components/common';

<OfflineIndicator position="top" />;
```

**Props:**

- `position?`: 'top' | 'bottom'

### 7. Toast Notifications

Global toast notification system.

#### Usage with Hook

```tsx
import { useToast } from '@/hooks/useToast';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully!');
    } catch (error) {
      showError('Failed to save data. Please try again.');
    }
  };
};
```

**Toast Provider (Already configured in App.tsx):**

```tsx
import { ToastProvider } from '@/contexts/ToastContext';

<ToastProvider>
  <App />
</ToastProvider>;
```

### 8. Form Validation

Components for displaying inline form errors.

#### ValidatedTextField

```tsx
import { ValidatedTextField } from '@/components/common';

<ValidatedTextField
  fullWidth
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  fieldError={errors.email}
  touched={touched.email}
/>;
```

#### FormFieldError

```tsx
import { FormFieldError } from '@/components/common';

<TextField {...props} />
<FormFieldError error={error} touched={touched} variant="text" />
```

**Props:**

- `error?`: string | string[]
- `touched?`: boolean
- `variant?`: 'text' | 'alert'

### 9. Loading Button

Button with loading state and spinner.

#### LoadingButton

```tsx
import { LoadingButton } from '@/components/common';

<LoadingButton
  variant="contained"
  loading={isSubmitting}
  loadingText="Saving..."
  onClick={handleSubmit}
>
  Save
</LoadingButton>;
```

**Props:**

- Extends MUI ButtonProps
- `loading?`: boolean
- `loadingText?`: string

### 10. Progress Bar

Linear progress indicator with labels.

#### ProgressBar

```tsx
import { ProgressBar } from '@/components/common';

<ProgressBar
  value={progress}
  label="Upload Progress"
  showPercentage
  color="primary"
  size="medium"
/>;
```

**Props:**

- `value`: number (0-100)
- `label?`: string
- `showPercentage?`: boolean
- `color?`: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
- `size?`: 'small' | 'medium' | 'large'

### 11. Data Fetch Wrappers

Wrapper components that handle loading, error, and empty states for data fetching.

#### RetryableQuery (for React Query)

```tsx
import { RetryableQuery } from '@/components/common';
import { useQuery } from '@tanstack/react-query';

const MyComponent = () => {
  const query = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
  });

  return (
    <RetryableQuery
      query={query}
      skeletonVariant="table"
      showEmpty
      emptyCondition={(data) => data.length === 0}
    >
      {(data) => <StudentTable data={data} />}
    </RetryableQuery>
  );
};
```

#### DataFetchWrapper (for custom fetch logic)

```tsx
import { DataFetchWrapper } from '@/components/common';

<DataFetchWrapper
  loading={isLoading}
  error={error}
  data={data}
  skeletonVariant="card"
  showEmpty
  emptyCondition={(data) => data.items.length === 0}
  emptyTitle="No Items"
  emptyActionLabel="Create Item"
  onEmptyAction={handleCreate}
>
  {(data) => <ItemList items={data.items} />}
</DataFetchWrapper>;
```

### 12. Query Error Handler

Automatically handles React Query errors and shows toast notifications.

```tsx
import { QueryErrorHandler } from '@/components/common';

<QueryErrorHandler>
  <App />
</QueryErrorHandler>;
```

## Utilities

### Error Message Utilities

```tsx
import {
  getErrorMessage,
  getValidationErrors,
  isNetworkError,
  isAuthError,
  isValidationError,
  getHttpStatusMessage,
} from '@/utils/errorMessages';

const handleError = (error: unknown) => {
  const message = getErrorMessage(error);
  const validationErrors = getValidationErrors(error);

  if (isNetworkError(error)) {
    showError('Network error. Please check your connection.');
  } else if (isAuthError(error)) {
    // Redirect to login
  } else if (isValidationError(error)) {
    // Show validation errors
  }
};
```

## Hooks

### useToast

```tsx
import { useToast } from '@/hooks/useToast';

const { showToast, showSuccess, showError, showWarning, showInfo } = useToast();

showToast('Custom message', 'success', 3000);
showSuccess('Operation completed');
showError('Operation failed');
showWarning('Please be careful');
showInfo('Here is some information');
```

### useOnlineStatus

```tsx
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const isOnline = useOnlineStatus();

if (!isOnline) {
  return <div>You are offline</div>;
}
```

## Usage Patterns

### Pattern 1: Simple List Page

```tsx
import { useQuery } from '@tanstack/react-query';
import { RetryableQuery, EmptyState } from '@/components/common';

const StudentsPage = () => {
  const query = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
  });

  return (
    <Container>
      <RetryableQuery
        query={query}
        skeletonVariant="table"
        showEmpty
        emptyCondition={(data) => data.length === 0}
        emptyComponent={
          <EmptyState
            title="No Students"
            message="Start by adding your first student."
            iconType="people"
            actionLabel="Add Student"
            onAction={() => navigate('/students/new')}
          />
        }
      >
        {(students) => <StudentTable students={students} />}
      </RetryableQuery>
    </Container>
  );
};
```

### Pattern 2: Form with Validation

```tsx
import { useState } from 'react';
import { ValidatedTextField, LoadingButton } from '@/components/common';
import { useToast } from '@/hooks/useToast';

const CreateStudentForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createStudent(formData);
      showSuccess('Student created successfully');
      navigate('/students');
    } catch (error) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        setErrors(validationErrors);
      } else {
        showError(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ValidatedTextField
        fullWidth
        label="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        fieldError={errors.name}
        touched
      />

      <ValidatedTextField
        fullWidth
        label="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        fieldError={errors.email}
        touched
      />

      <LoadingButton
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingText="Creating..."
      >
        Create Student
      </LoadingButton>
    </form>
  );
};
```

### Pattern 3: File Upload with Progress

```tsx
import { useState } from 'react';
import { LoadingOverlay, ProgressBar } from '@/components/common';
import { useToast } from '@/hooks/useToast';

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showSuccess, showError } = useToast();

  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(0);

    try {
      await uploadFile(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });

      showSuccess('File uploaded successfully');
    } catch (error) {
      showError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />

      <LoadingOverlay
        open={uploading}
        message="Uploading file..."
        progress={progress}
        showProgress
      />
    </>
  );
};
```

## Best Practices

1. **Always wrap data fetching with error handling**: Use `RetryableQuery` or `DataFetchWrapper`
2. **Provide meaningful error messages**: Customize error messages based on the context
3. **Show loading states**: Always show skeleton loaders during data fetching
4. **Handle empty states**: Provide helpful empty states with actions
5. **Use toast notifications sparingly**: Only for important feedback
6. **Validate forms inline**: Show errors as users interact with fields
7. **Handle offline scenarios**: Components should gracefully handle offline states
8. **Test error boundaries**: Ensure error boundaries catch and display errors properly

## Testing

To see all components in action, visit the examples page:

```tsx
import ErrorHandlingExamples from '@/examples/ErrorHandlingExamples';

// Add to your routes
<Route path="/examples/error-handling" element={<ErrorHandlingExamples />} />;
```

## Accessibility

- All error messages are announced to screen readers
- Loading states include appropriate ARIA labels
- Keyboard navigation is supported for all interactive elements
- Color contrast meets WCAG 2.1 AA standards

## Browser Support

All components work in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Considerations

- Skeleton loaders use CSS animations for smooth rendering
- Toast notifications are rendered using portals
- Error boundaries prevent cascade failures
- All components are tree-shakeable
