# Error Handling & Loading States - Quick Start Guide

## Setup (Already Configured)

The error handling system has been integrated into the application. The following providers are already set up in `App.tsx`:

```tsx
<ErrorBoundaryWrapper>
  <ToastProvider>
    <QueryErrorHandler>
      <OfflineIndicator />
      <YourApp />
    </QueryErrorHandler>
  </ToastProvider>
</ErrorBoundaryWrapper>
```

## Common Usage Patterns

### 1. Display Loading Skeletons While Fetching Data

```tsx
import { useQuery } from '@tanstack/react-query';
import { RetryableQuery } from '@/components/common';

function StudentList() {
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
      {(students) => <Table data={students} />}
    </RetryableQuery>
  );
}
```

### 2. Show Toast Notifications

```tsx
import { useToast } from '@/hooks/useToast';

function MyComponent() {
  const { showSuccess, showError } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully!');
    } catch (error) {
      showError('Failed to save data');
    }
  };
}
```

### 3. Form with Validation Errors

```tsx
import { ValidatedTextField, LoadingButton } from '@/components/common';

function MyForm() {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  return (
    <form>
      <ValidatedTextField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fieldError={errors.email}
        touched
      />

      <LoadingButton loading={loading} loadingText="Saving..." onClick={handleSubmit}>
        Submit
      </LoadingButton>
    </form>
  );
}
```

### 4. Empty State with Action

```tsx
import { EmptyState } from '@/components/common';

function StudentList({ students }) {
  if (students.length === 0) {
    return (
      <EmptyState
        title="No Students Found"
        message="Get started by adding your first student."
        iconType="people"
        actionLabel="Add Student"
        onAction={() => navigate('/students/new')}
      />
    );
  }

  return <StudentTable students={students} />;
}
```

### 5. Loading Overlay for Long Operations

```tsx
import { LoadingOverlay } from '@/components/common';
import { useState } from 'react';

function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <>
      <UploadForm />
      <LoadingOverlay
        open={uploading}
        message="Uploading file..."
        progress={progress}
        showProgress
      />
    </>
  );
}
```

### 6. Error Display with Retry

```tsx
import { ErrorDisplay } from '@/components/common';

function MyComponent() {
  const { data, error, refetch } = useQuery(...);

  if (error) {
    return (
      <ErrorDisplay
        message="Failed to load data"
        error={error}
        onRetry={refetch}
      />
    );
  }
}
```

### 7. Confirm Dialog

```tsx
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/common';

function MyComponent() {
  const { dialogState, openDialog, closeDialog, handleConfirm } = useConfirmDialog();

  const handleDelete = () => {
    openDialog('Delete Student', 'Are you sure you want to delete this student?', async () => {
      await deleteStudent(id);
      showSuccess('Student deleted');
    });
  };

  return (
    <>
      <Button onClick={handleDelete}>Delete</Button>
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmColor="error"
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
    </>
  );
}
```

### 8. Async Button (Auto Toast)

```tsx
import { AsyncButton } from '@/components/common';

function MyComponent() {
  return (
    <AsyncButton
      variant="contained"
      onClick={async () => {
        await deleteItem(id);
      }}
      successMessage="Item deleted successfully"
      showSuccessToast
      confirmColor="error"
    >
      Delete
    </AsyncButton>
  );
}
```

## Component Quick Reference

| Component            | Use Case                                         |
| -------------------- | ------------------------------------------------ |
| `SkeletonLoader`     | Show loading placeholder while fetching          |
| `TableSkeleton`      | Loading state for tables                         |
| `CardGridSkeleton`   | Loading state for card grids                     |
| `StatCardSkeleton`   | Loading state for stat cards                     |
| `RetryableQuery`     | Wrapper for React Query with loading/error/empty |
| `DataFetchWrapper`   | Generic wrapper for any async data               |
| `ErrorDisplay`       | Show error with retry button                     |
| `EmptyState`         | Show when no data available                      |
| `LoadingOverlay`     | Full-screen loading with progress                |
| `PageLoader`         | Simple page-level loading                        |
| `LoadingButton`      | Button with loading state                        |
| `AsyncButton`        | Button that handles async + toasts               |
| `ValidatedTextField` | Text field with error display                    |
| `FormFieldError`     | Standalone error message                         |
| `InlineError`        | Inline error message box                         |
| `Toast`              | Manual toast (usually use `useToast` hook)       |
| `OfflineIndicator`   | Auto-shows when offline                          |
| `ConfirmDialog`      | Confirmation dialog                              |
| `ProgressBar`        | Linear progress indicator                        |
| `LoadingDots`        | Animated loading dots                            |

## Hooks Quick Reference

| Hook                 | Purpose                     |
| -------------------- | --------------------------- |
| `useToast()`         | Show toast notifications    |
| `useOnlineStatus()`  | Check if user is online     |
| `useConfirmDialog()` | Manage confirm dialog state |

## Utility Functions

```tsx
import {
  getErrorMessage,
  getValidationErrors,
  isNetworkError,
  isAuthError,
  isValidationError,
} from '@/utils/errorMessages';

// Extract user-friendly error message
const message = getErrorMessage(error);

// Get validation errors object
const validationErrors = getValidationErrors(error);

// Check error type
if (isNetworkError(error)) {
  // Handle network error
}
```

## Best Practices

1. **Always show loading states**: Use skeleton loaders, not just spinners
2. **Provide meaningful empty states**: Include call-to-action buttons
3. **Make errors actionable**: Always provide a retry or help button
4. **Use toast sparingly**: Only for important feedback
5. **Validate inline**: Show errors as users type
6. **Handle offline**: The OfflineIndicator does this automatically
7. **Catch errors globally**: ErrorBoundary and QueryErrorHandler are already set up

## Examples Page

See all components in action:

- Navigate to `/examples/error-handling` (add this route to see the demo)

## File Structure

```
frontend/src/
├── components/common/
│   ├── SkeletonLoader.tsx
│   ├── ErrorBoundaryWrapper.tsx
│   ├── ErrorDisplay.tsx
│   ├── EmptyState.tsx
│   ├── LoadingOverlay.tsx
│   ├── OfflineIndicator.tsx
│   ├── Toast.tsx
│   ├── ValidatedTextField.tsx
│   ├── LoadingButton.tsx
│   ├── AsyncButton.tsx
│   ├── ProgressBar.tsx
│   ├── RetryableQuery.tsx
│   ├── DataFetchWrapper.tsx
│   ├── TableSkeleton.tsx
│   ├── CardGridSkeleton.tsx
│   ├── StatCardSkeleton.tsx
│   ├── ConfirmDialog.tsx
│   ├── InlineError.tsx
│   ├── PageLoader.tsx
│   ├── LoadingDots.tsx
│   └── index.ts
├── contexts/
│   └── ToastContext.tsx
├── hooks/
│   ├── useToast.ts
│   ├── useOnlineStatus.ts
│   └── useConfirmDialog.ts
├── utils/
│   └── errorMessages.ts
└── examples/
    └── ErrorHandlingExamples.tsx
```

## Need Help?

Refer to the full documentation: `ERROR_HANDLING_DOCUMENTATION.md`
