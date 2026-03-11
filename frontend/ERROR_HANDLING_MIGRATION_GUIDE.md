# Migration Guide: Implementing Error Handling in Existing Code

This guide helps you migrate existing components to use the new error handling and loading states system.

## Overview

The new system provides:

- Consistent loading states across the app
- Unified error handling
- Better empty state management
- Improved form validation
- Toast notifications

## Migration Steps

### Step 1: Update Data Fetching Components

#### Before (Old Pattern)

```tsx
function StudentList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
  });

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data || data.length === 0) {
    return <div>No students found</div>;
  }

  return <StudentTable students={data} />;
}
```

#### After (New Pattern)

```tsx
import { RetryableQuery, EmptyState } from '@/components/common';

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
      emptyComponent={
        <EmptyState
          title="No Students Found"
          message="Add your first student to get started."
          iconType="people"
          actionLabel="Add Student"
          onAction={() => navigate('/students/new')}
        />
      }
    >
      {(students) => <StudentTable students={students} />}
    </RetryableQuery>
  );
}
```

**Benefits:**

- ✅ Skeleton loader matches table layout
- ✅ Professional error display with retry
- ✅ Actionable empty state
- ✅ Less code, more features

---

### Step 2: Update Form Components

#### Before (Old Pattern)

```tsx
function CreateStudentForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createStudent({ name, email });
      alert('Student created!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={Boolean(errors.name)}
        helperText={errors.name}
      />

      <TextField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={Boolean(errors.email)}
        helperText={errors.email}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create'}
      </Button>
    </form>
  );
}
```

#### After (New Pattern)

```tsx
import { ValidatedTextField, LoadingButton } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage, getValidationErrors } from '@/utils/errorMessages';

function CreateStudentForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createStudent({ name, email });
      showSuccess('Student created successfully!');
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
        value={name}
        onChange={(e) => setName(e.target.value)}
        fieldError={errors.name}
        touched
      />

      <ValidatedTextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
}
```

**Benefits:**

- ✅ Better error messages
- ✅ Validation error handling
- ✅ Professional toast notifications
- ✅ Loading state on button
- ✅ Type-safe error handling

---

### Step 3: Update Action Buttons

#### Before (Old Pattern)

```tsx
function DeleteButton({ studentId }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return;

    setIsDeleting(true);
    try {
      await deleteStudent(studentId);
      alert('Student deleted');
      refetch();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
```

#### After (New Pattern)

```tsx
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog, AsyncButton } from '@/components/common';
import { useToast } from '@/hooks/useToast';

function DeleteButton({ studentId }) {
  const { dialogState, openDialog, closeDialog, handleConfirm } = useConfirmDialog();
  const { showSuccess } = useToast();

  const handleDelete = () => {
    openDialog(
      'Delete Student',
      'Are you sure you want to delete this student? This action cannot be undone.',
      async () => {
        await deleteStudent(studentId);
        showSuccess('Student deleted successfully');
        refetch();
      }
    );
  };

  return (
    <>
      <AsyncButton variant="outlined" color="error" onClick={handleDelete}>
        Delete
      </AsyncButton>

      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmColor="error"
        confirmLabel="Delete"
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
    </>
  );
}
```

**Benefits:**

- ✅ Professional confirmation dialog
- ✅ Prevents accidental deletions
- ✅ Loading state during deletion
- ✅ Toast notification on success
- ✅ Automatic error handling

---

### Step 4: Update File Upload Components

#### Before (Old Pattern)

```tsx
function FileUpload() {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      await uploadFile(file);
      alert('File uploaded!');
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploading && <CircularProgress />}
    </>
  );
}
```

#### After (New Pattern)

```tsx
import { LoadingOverlay, ProgressBar } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errorMessages';

function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showSuccess, showError } = useToast();

  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(0);

    try {
      await uploadFile(file, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percent);
      });
      showSuccess('File uploaded successfully!');
    } catch (error) {
      showError(getErrorMessage(error));
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
}
```

**Benefits:**

- ✅ Visual progress indicator
- ✅ Full-screen overlay
- ✅ Professional feedback
- ✅ Better error messages

---

### Step 5: Update Empty States

#### Before (Old Pattern)

```tsx
function StudentList({ students }) {
  if (students.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography>No students found</Typography>
      </Paper>
    );
  }

  return <StudentTable students={students} />;
}
```

#### After (New Pattern)

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
        secondaryActionLabel="Import Students"
        onSecondaryAction={() => navigate('/students/import')}
        variant="card"
      />
    );
  }

  return <StudentTable students={students} />;
}
```

**Benefits:**

- ✅ Visual icon
- ✅ Call-to-action buttons
- ✅ Consistent design
- ✅ Better UX

---

### Step 6: Update Error Handling

#### Before (Old Pattern)

```tsx
function MyComponent() {
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      const data = await fetchData();
    } catch (error) {
      setError(error.message);
    }
  };

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return <div>Content</div>;
}
```

#### After (New Pattern)

```tsx
import { ErrorDisplay } from '@/components/common';
import { getErrorMessage } from '@/utils/errorMessages';

function MyComponent() {
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      const data = await fetchData();
    } catch (error) {
      setError(error);
    }
  };

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to Load Data"
        message="We couldn't load the data you requested."
        error={error}
        onRetry={loadData}
      />
    );
  }

  return <div>Content</div>;
}
```

**Benefits:**

- ✅ Professional error UI
- ✅ Retry functionality
- ✅ Better error messages
- ✅ Consistent design

---

## Quick Migration Checklist

For each component, replace:

- [ ] `CircularProgress` → `SkeletonLoader` or `PageLoader`
- [ ] `if (loading)` → `RetryableQuery` or `DataFetchWrapper`
- [ ] `if (error)` → `ErrorDisplay` or handled automatically
- [ ] `if (empty)` → `EmptyState`
- [ ] `TextField` with errors → `ValidatedTextField`
- [ ] `Button` during submit → `LoadingButton` or `AsyncButton`
- [ ] `alert()` → `useToast()`
- [ ] `confirm()` → `ConfirmDialog` with `useConfirmDialog`
- [ ] Manual error messages → `getErrorMessage()`

## Common Patterns

### Pattern 1: Simple List

```tsx
// Before: 40+ lines of boilerplate
// After: 15 lines with RetryableQuery
```

### Pattern 2: Form Submission

```tsx
// Before: Manual loading/error state
// After: LoadingButton + useToast
```

### Pattern 3: Delete Action

```tsx
// Before: window.confirm + manual handling
// After: ConfirmDialog + AsyncButton
```

### Pattern 4: File Upload

```tsx
// Before: Basic spinner
// After: LoadingOverlay with progress
```

## Testing After Migration

After migrating, verify:

1. ✅ Loading states show skeleton loaders
2. ✅ Errors show professional error display
3. ✅ Empty states have actions
4. ✅ Forms validate inline
5. ✅ Toasts appear on success/error
6. ✅ Confirm dialogs work for destructive actions
7. ✅ Offline indicator appears when offline
8. ✅ Progress shows for long operations

## Gradual Migration Strategy

Don't migrate everything at once. Prioritize:

1. **High-traffic pages first** - Maximum user impact
2. **Forms next** - Better validation UX
3. **Data lists** - Better loading/empty states
4. **Actions last** - Confirm dialogs

## Need Help?

- Check `ERROR_HANDLING_QUICK_START.md` for examples
- Review `ERROR_HANDLING_DOCUMENTATION.md` for API details
- See `ErrorHandlingExamples.tsx` for live demos
- Look at `ERROR_HANDLING_COMPONENT_REFERENCE.md` for decision trees

## Migration Time Estimates

- Simple list component: **5-10 minutes**
- Form component: **10-15 minutes**
- Complex page with multiple patterns: **20-30 minutes**
- Entire module: **1-2 hours**

Most components become **simpler and shorter** after migration while gaining more features!
