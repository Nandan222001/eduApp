# Error Handling Components - Visual Reference

## Component Categories

### 🔄 Loading States

#### SkeletonLoader

**Purpose**: Show placeholder content while data loads  
**Variants**: card, table, list, form, chart, dashboard  
**When to use**: Any data fetching operation

```tsx
<SkeletonLoader variant="card" count={3} />
<SkeletonLoader variant="table" />
<SkeletonLoader variant="dashboard" />
```

#### TableSkeleton

**Purpose**: Specialized table loading state  
**When to use**: Loading table data

```tsx
<TableSkeleton rows={5} columns={6} showHeader showPagination />
```

#### CardGridSkeleton

**Purpose**: Grid of card placeholders  
**When to use**: Loading card-based layouts

```tsx
<CardGridSkeleton count={6} columns={{ xs: 12, sm: 6, md: 4 }} />
```

#### StatCardSkeleton

**Purpose**: Dashboard stat cards loading  
**When to use**: Loading dashboard metrics

```tsx
<StatCardSkeleton count={4} />
```

#### LoadingOverlay

**Purpose**: Full-screen loading with optional progress  
**When to use**: File uploads, long operations

```tsx
<LoadingOverlay open={uploading} message="Uploading..." progress={75} showProgress backdrop />
```

#### PageLoader

**Purpose**: Simple page-level loader  
**When to use**: Route transitions, initial page load

```tsx
<PageLoader message="Loading..." variant="circular" fullScreen />
```

#### LoadingButton

**Purpose**: Button with loading state  
**When to use**: Form submissions, async actions

```tsx
<LoadingButton loading={isSubmitting} loadingText="Saving..." onClick={handleSubmit}>
  Save Changes
</LoadingButton>
```

#### AsyncButton

**Purpose**: Button with automatic async handling and toasts  
**When to use**: Single-click async operations

```tsx
<AsyncButton
  onClick={async () => await deleteItem()}
  successMessage="Item deleted"
  showSuccessToast
>
  Delete
</AsyncButton>
```

#### ProgressBar

**Purpose**: Linear progress indicator  
**When to use**: Show progress of operations

```tsx
<ProgressBar value={progress} label="Upload Progress" showPercentage color="primary" />
```

#### LoadingDots

**Purpose**: Animated loading dots  
**When to use**: Inline loading indicators

```tsx
<LoadingDots size={8} color="primary.main" />
```

---

### ❌ Error Handling

#### ErrorBoundaryWrapper

**Purpose**: Catch JavaScript errors in component tree  
**When to use**: Wrap entire app or major sections

```tsx
<ErrorBoundaryWrapper showDetails={isDev}>
  <App />
</ErrorBoundaryWrapper>
```

#### ErrorDisplay

**Purpose**: Show user-friendly error message  
**When to use**: API errors, operation failures  
**Variants**: standard, minimal, inline

```tsx
<ErrorDisplay
  title="Failed to Load"
  message="Unable to fetch data"
  error={error}
  onRetry={refetch}
  variant="standard"
/>
```

#### QueryErrorHandler

**Purpose**: Auto-handle React Query errors with toasts  
**When to use**: Wrap QueryClientProvider

```tsx
<QueryErrorHandler>
  <App />
</QueryErrorHandler>
```

#### NetworkErrorBoundary

**Purpose**: Specific handling for network failures  
**When to use**: Wrap app for network error detection

```tsx
<NetworkErrorBoundary>
  <App />
</NetworkErrorBoundary>
```

#### InlineError

**Purpose**: Styled inline error message  
**When to use**: Form-level errors, section errors

```tsx
<InlineError message="Failed to save changes" />
```

---

### 📭 Empty States

#### EmptyState

**Purpose**: Show when no data is available  
**When to use**: Empty lists, no search results  
**Icons**: inbox, search, folder, assignment, people, event, school  
**Variants**: standard, minimal, card

```tsx
<EmptyState
  title="No Students Found"
  message="Add your first student to get started."
  iconType="people"
  actionLabel="Add Student"
  onAction={handleAdd}
  secondaryActionLabel="Import Students"
  onSecondaryAction={handleImport}
  variant="card"
/>
```

---

### 📝 Form Components

#### ValidatedTextField

**Purpose**: TextField with integrated error display  
**When to use**: All form inputs

```tsx
<ValidatedTextField
  fullWidth
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  fieldError={errors.email}
  touched={touched.email}
  showErrorVariant="text"
/>
```

#### FormFieldError

**Purpose**: Standalone field error component  
**When to use**: Custom form components  
**Variants**: text, alert

```tsx
<TextField {...props} />
<FormFieldError
  error={errors.email}
  touched={touched.email}
  variant="text"
/>
```

---

### 🎯 Data Fetching Wrappers

#### RetryableQuery

**Purpose**: Wrap React Query with loading/error/empty handling  
**When to use**: All React Query data fetching

```tsx
<RetryableQuery
  query={studentsQuery}
  skeletonVariant="table"
  showEmpty
  emptyCondition={(data) => data.length === 0}
  emptyComponent={<CustomEmptyState />}
>
  {(students) => <StudentTable students={students} />}
</RetryableQuery>
```

#### DataFetchWrapper

**Purpose**: Generic wrapper for any async data  
**When to use**: Custom fetch logic, non-React-Query data

```tsx
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
</DataFetchWrapper>
```

#### SuspenseLoader

**Purpose**: React Suspense with fallback  
**When to use**: Code splitting, lazy loading

```tsx
<SuspenseLoader message="Loading component...">
  <LazyComponent />
</SuspenseLoader>
```

---

### 🔔 Notifications

#### Toast (via useToast hook)

**Purpose**: Show temporary notification messages  
**When to use**: Success/error feedback  
**Types**: success, error, warning, info

```tsx
const { showSuccess, showError, showWarning, showInfo } = useToast();

showSuccess('Operation completed!');
showError('Operation failed!');
showWarning('Please be careful');
showInfo('Here is some information');
```

#### OfflineIndicator

**Purpose**: Show banner when offline  
**When to use**: Automatic, place in App root  
**Positions**: top, bottom

```tsx
<OfflineIndicator position="top" />
```

---

### 💬 Dialogs

#### ConfirmDialog

**Purpose**: Get user confirmation before action  
**When to use**: Destructive actions, important decisions

```tsx
<ConfirmDialog
  open={isOpen}
  title="Delete Student"
  message="Are you sure you want to delete this student?"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  confirmColor="error"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  loading={isDeleting}
  maxWidth="sm"
/>
```

---

## Decision Tree: Which Component to Use?

### Loading State?

```
Is it a table?
├─ Yes → TableSkeleton
└─ No
   └─ Is it a card grid?
      ├─ Yes → CardGridSkeleton
      └─ No
         └─ Is it stat cards?
            ├─ Yes → StatCardSkeleton
            └─ No
               └─ Is it a form?
                  ├─ Yes → SkeletonLoader variant="form"
                  └─ No → SkeletonLoader variant="card"
```

### Error State?

```
Is it React Query?
├─ Yes → RetryableQuery (handles automatically)
└─ No
   └─ Is it a form error?
      ├─ Yes → FormFieldError or ValidatedTextField
      └─ No
         └─ Is it critical?
            ├─ Yes → ErrorBoundaryWrapper
            └─ No → ErrorDisplay
```

### Empty State?

```
Always use EmptyState component with:
- Appropriate icon
- Clear message
- Call-to-action button
```

### Need User Feedback?

```
Is it blocking?
├─ Yes → ConfirmDialog
└─ No
   └─ Is it informational?
      ├─ Yes → useToast().showInfo()
      └─ No
         └─ Is it success?
            ├─ Yes → useToast().showSuccess()
            └─ No → useToast().showError()
```

### Loading Operation?

```
Is it a page load?
├─ Yes → PageLoader
└─ No
   └─ Is it a button action?
      ├─ Yes
      │  └─ Does it show toasts?
      │     ├─ Yes → AsyncButton
      │     └─ No → LoadingButton
      └─ No
         └─ Is it a file upload?
            ├─ Yes → LoadingOverlay with progress
            └─ No → LoadingOverlay without progress
```

## Props Quick Reference

### Most Commonly Used Props

#### RetryableQuery

```tsx
query: UseQueryResult         // Required
skeletonVariant?: string      // Default: 'card'
showEmpty?: boolean          // Default: false
emptyCondition?: (data) => boolean
children: (data) => ReactNode // Required
```

#### EmptyState

```tsx
title?: string               // Default: 'No Data Available'
message?: string
iconType?: string           // inbox, search, folder, etc.
actionLabel?: string
onAction?: () => void
variant?: string            // standard, minimal, card
```

#### LoadingButton

```tsx
loading?: boolean           // Default: false
loadingText?: string
// + all MUI Button props
```

#### ValidatedTextField

```tsx
fieldError?: string | string[]
touched?: boolean          // Default: true
showErrorVariant?: string  // text, alert
// + all MUI TextField props
```

#### ErrorDisplay

```tsx
title?: string
message?: string
error?: Error | string
onRetry?: () => void
variant?: string          // standard, minimal, inline
```

## Color Coding Guide

### Toast Severity

- **Success** (Green): Operation completed successfully
- **Error** (Red): Operation failed
- **Warning** (Orange): Caution required
- **Info** (Blue): Informational message

### Button Colors for Confirms

- **error**: Destructive actions (delete, remove)
- **warning**: Caution actions (reset, clear)
- **primary**: Normal actions (confirm, submit)
- **secondary**: Alternative actions

## Accessibility Features

All components include:

- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus management
- ✅ Color contrast (WCAG AA)

## Performance Tips

1. **Use skeleton loaders** instead of spinners for better perceived performance
2. **Batch toast notifications** - don't show multiple at once
3. **Debounce form validation** for better UX
4. **Lazy load heavy components** with SuspenseLoader
5. **Memoize error components** if they re-render frequently

## Mobile Considerations

- Touch targets are minimum 44x44px
- Toast notifications are mobile-friendly
- Dialogs are responsive
- Skeleton loaders adapt to screen size
- Forms have proper mobile keyboard support

## Common Patterns

### Pattern: List Page

```
RetryableQuery
├─ Loading: TableSkeleton
├─ Error: ErrorDisplay
├─ Empty: EmptyState
└─ Success: Table
```

### Pattern: Form Page

```
Form
├─ ValidatedTextField (multiple)
├─ FormFieldError (if needed)
└─ LoadingButton (submit)
```

### Pattern: Upload Flow

```
Upload Component
├─ File Input
└─ LoadingOverlay (with progress)
    └─ ProgressBar
```

### Pattern: Delete Action

```
Delete Button (AsyncButton or regular)
├─ onClick: openConfirmDialog
└─ ConfirmDialog
    ├─ onConfirm: delete + toast
    └─ onCancel: close
```

## Testing Checklist

- [ ] Skeleton loaders match final content
- [ ] Error messages are user-friendly
- [ ] Empty states have actions
- [ ] Toast notifications don't overlap
- [ ] Forms validate inline
- [ ] Buttons show loading states
- [ ] Dialogs prevent double-submission
- [ ] Offline indicator appears correctly
- [ ] Progress bars are accurate
- [ ] Errors can be retried
