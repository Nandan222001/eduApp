# Assignments Feature - Quick Start

## What Was Implemented

### 1. AssignmentsScreen (`/mobile/src/screens/student/AssignmentsScreen.tsx`)

A tab-based view showing all student assignments organized by status:

- **Pending Tab**: Shows assignments that haven't been submitted yet
- **Submitted Tab**: Shows assignments that have been submitted but not graded
- **Graded Tab**: Shows assignments that have been graded with scores

**Features:**

- Pull-to-refresh on all tabs
- Assignment cards showing subject, due date, teacher, and status
- Color-coded status badges
- Due date warnings (red for overdue, orange for urgent)
- Tap any card to view details

### 2. AssignmentDetailScreen (`/mobile/src/screens/student/AssignmentDetailScreen.tsx`)

Detailed view of a single assignment with submission capabilities:

**Features:**

- View full assignment description
- Download/view assignment attachments
- Submit assignments with:
  - Document picker (PDFs, images, any file type)
  - Camera integration (take photos)
  - Comments/notes
- View submission history
- See grades and teacher feedback
- Optimistic UI updates

### 3. API Integration (`/mobile/src/api/assignments.ts`)

Complete API integration for:

- Fetching assignments by status
- Getting assignment details
- Submitting assignments with file uploads

### 4. React Query Hooks (`/mobile/src/hooks/useStudentQueries.ts`)

Added three new hooks:

- `useAssignmentsList(params)` - Fetch assignments with filters
- `useAssignmentDetail(id)` - Fetch single assignment
- `useSubmitAssignment()` - Submit assignment with optimistic updates

## How to Use

### Navigate to Assignments

From the student home screen, tap the "Assignments" tab in the bottom navigation.

### View Assignment Details

Tap any assignment card to see full details.

### Submit an Assignment

1. Open an assignment with "Pending" status
2. Scroll to the submission section
3. Add files using:
   - "Pick Document" button - Choose files from device
   - "Take Photo" button - Capture photos with camera
4. Optionally add comments
5. Review selected files
6. Tap "Submit Assignment"
7. Confirmation modal appears on success

### View Submission Status

- **Submitted**: See your submitted files and comments
- **Graded**: View your score and teacher feedback

## Dependencies Added

```bash
npx expo install expo-document-picker expo-camera @react-navigation/material-top-tabs react-native-pager-view
```

## Permissions Required

The app.json has been updated with:

- Camera permission (for photo submissions)
- Document picker configuration

## File Structure

```
mobile/src/
├── api/
│   └── assignments.ts          # API functions for assignments
├── screens/student/
│   ├── AssignmentsScreen.tsx   # Tab view of all assignments
│   └── AssignmentDetailScreen.tsx  # Detail view with submission
├── hooks/
│   └── useStudentQueries.ts    # Updated with assignment hooks
└── types/
    └── student.ts              # Updated Assignment interface
```

## Backend API Endpoints

- `GET /api/v1/assignments?status=pending|submitted|graded`
- `GET /api/v1/assignments/:id`
- `POST /api/v1/submissions` with body:
  ```json
  {
    "assignmentId": 123,
    "comments": "Optional comment",
    "attachments": [
      {
        "fileName": "file.pdf",
        "fileType": "application/pdf",
        "fileSize": 12345,
        "fileData": "base64EncodedString"
      }
    ]
  }
  ```

## Key Features

### Optimistic Updates

When submitting an assignment:

1. UI immediately updates to "Submitted" state
2. If submission fails, UI rolls back to previous state
3. On success, cache is invalidated and fresh data is fetched

### Caching

React Query caches all API responses:

- 2-3 minute stale time
- Automatic background refetching
- Manual refresh via pull-to-refresh

### Error Handling

- Network errors show retry option
- Empty states for no data
- Loading states for all async operations

## Testing the Feature

### Test Scenario 1: View Assignments

1. Open app and navigate to Assignments tab
2. Verify three tabs appear: Pending, Submitted, Graded
3. Tap each tab to see filtered assignments
4. Pull down to refresh

### Test Scenario 2: Submit Assignment

1. Navigate to Pending tab
2. Tap an assignment card
3. Scroll to submission section
4. Add a document or photo
5. Add optional comments
6. Submit and verify confirmation modal

### Test Scenario 3: View Graded Assignment

1. Navigate to Graded tab
2. Tap a graded assignment
3. Verify score and feedback are displayed

## Troubleshooting

### Camera not working

- Ensure camera permissions are granted in device settings
- Check that expo-camera plugin is in app.json

### Files not uploading

- Check file size (large files may timeout)
- Verify base64 encoding is working
- Check network connection

### Type errors

Run type check: `npm run type-check`

## Next Steps

The implementation is complete and ready to use. To enhance further:

- Add file size validation
- Implement image compression
- Add offline submission queue
- Add push notifications for graded assignments
