# Student Mobile App Features

This document describes the student-specific features implemented in the EduTrack mobile application.

## Features Implemented

### 1. Student Dashboard (`StudentDashboard.tsx`)

The main dashboard for students with the following widgets:

#### Welcome Card
- Personalized greeting with student's name
- Motivational message

#### Attendance Status
- Current day's attendance status (Present/Absent/Late/Pending)
- Weekly attendance percentage
- Breakdown of present, absent, and late days

#### Streak Tracker
- Daily login/activity streak counter
- Gamification points display
- Current level indicator

#### Upcoming Assignments
- Shows next 3 pending assignments
- Due dates with smart formatting (Today, Tomorrow, In X days)
- Subject and point value
- Quick navigation to assignments screen

#### Recent Grades
- Last 5 graded assignments
- Score out of maximum points
- Percentage with color-coding (Green ≥70%, Yellow ≥50%, Red <50%)

#### AI Performance Predictions
- Subject-wise predicted grades
- Confidence level indicator
- Trend visualization (Improving/Stable/Declining)

#### Weak Areas Panel
- Identifies topics needing improvement
- Shows current performance percentage
- AI-generated recommendations

#### Gamification Widgets
- Recent badges earned
- Achievement display
- Visual icons and names

### 2. Assignments Screen (`AssignmentsScreen.tsx`)

Comprehensive assignment management with tabs:

#### Pending Tab
- All pending assignments
- Due date with color coding:
  - Red: Overdue
  - Orange: Due in ≤2 days
  - Green: More than 2 days
- Maximum points displayed
- Tap to submit assignment

#### Submitted Tab
- Assignments submitted but not yet graded
- Submission date
- Waiting for grading indicator

#### Graded Tab
- All graded assignments
- Score and percentage
- Teacher feedback preview
- Tap to view full details

### 3. Assignment Submission (`AssignmentSubmissionScreen.tsx`)

Full-featured submission interface:

#### Features
- Assignment details display
- Due date and maximum score
- Camera integration for photo capture
- File picker for document upload
- Multiple file support
- File preview with thumbnails
- File size display
- Comments/notes field
- Submission confirmation dialog

#### Camera Integration (`CameraScreen.tsx`)
- Full-screen camera interface
- Front/back camera toggle
- Photo capture
- Automatic file naming
- Image preview before adding

#### File Picker Integration
- Support for all file types
- Multiple file selection
- File metadata display
- Remove individual files option

### 4. Assignment Details (`AssignmentDetailScreen.tsx`)

Detailed view for submitted/graded assignments:

#### Features
- Assignment title and subject
- Full description
- Score display (circular progress indicator)
- Percentage and grade letter
- Color-coded performance (Green/Yellow/Red)
- Status badge
- Due date and submission date
- Teacher feedback section
- Attachments list

### 5. Study Materials (`StudyMaterialsScreen.tsx`)

Hierarchical navigation for course materials:

#### Subject List
- All enrolled subjects
- Subject code and name
- Teacher information
- Material count per subject
- Visual subject icons

#### Features
- Pull-to-refresh
- Empty state handling
- Navigation to subject materials

### 6. Subject Materials (`SubjectMaterialsScreen.tsx`)

Material listing for specific subject with offline support:

#### Features
- Material list by subject
- File type icons (PDF, Video, Document, Link, Image)
- Upload date display
- File size information
- Download status indicator
- Offline availability

#### Offline Support
- Download materials for offline access
- Download progress indication
- Downloaded badge display
- Delete downloaded files
- Persistent storage in device
- Automatic directory management

#### File Types Supported
- PDF documents
- Videos
- Documents (Word, Excel, etc.)
- Links (external resources)
- Images

### 7. Material Detail (`MaterialDetailScreen.tsx`)

Detailed view of individual study material:

#### Features
- Material title and subject
- File type and size
- Upload date
- Description
- Offline status indicator
- Open file functionality
- Share functionality
- Link handling for external resources

## Dependencies Used

### Required Packages
```json
{
  "expo-camera": "~14.0.5",
  "expo-document-picker": "~11.10.1",
  "expo-file-system": "~16.0.7"
}
```

### Camera Permissions
The app requires camera permissions for photo capture. Permissions are requested when:
- User taps "Take Photo" button
- Can be granted from settings if denied

### File System Permissions
File system access is managed by Expo and doesn't require explicit permissions on most platforms.

## API Integration

### API Endpoints Required

```typescript
// Student Statistics
GET /api/v1/student/stats

// Attendance
GET /api/v1/student/attendance

// Assignments
GET /api/v1/student/assignments?status={pending|submitted|graded}
GET /api/v1/student/assignments/:id
POST /api/v1/student/assignments/:id/submit

// Grades
GET /api/v1/student/grades?limit={number}

// AI Predictions
GET /api/v1/student/predictions

// Weak Areas
GET /api/v1/student/weak-areas

// Study Materials
GET /api/v1/student/subjects
GET /api/v1/student/materials?subject_id={number}
GET /api/v1/student/materials/:id

// Gamification
GET /api/v1/student/gamification/badges
GET /api/v1/student/gamification/achievements?limit={number}
```

## Navigation Structure

```
StudentNavigator (Tab Navigator)
├── Home (Stack)
│   ├── StudentHome
│   ├── AssignmentSubmission
│   └── CameraScreen (Modal)
├── Courses (Stack)
│   ├── StudentCourses
│   ├── StudyMaterialsScreen
│   ├── SubjectMaterials
│   └── MaterialDetail
├── Assignments (Stack)
│   ├── StudentAssignments
│   ├── AssignmentDetail
│   ├── AssignmentSubmission
│   └── CameraScreen (Modal)
└── Profile (Stack)
    └── StudentProfile
```

## File Storage

### Offline Materials
- Location: `{DocumentDirectory}/materials/`
- Naming: `{materialId}_{materialTitle}`
- Managed by: `fileManager` utility
- Features:
  - Automatic directory creation
  - Download progress tracking
  - File existence checking
  - Cleanup utilities

## Styling Guidelines

### Colors
- Primary: `#007AFF`
- Success: `#34C759`
- Warning: `#FF9500`
- Error: `#FF3B30`
- Background: `#F2F2F7`
- Text Primary: `#1C1C1E`
- Text Secondary: `#8E8E93`
- Border: `#E5E5EA`

### Typography
- Title: 24px, Bold
- Heading: 18-20px, Bold
- Body: 15-16px, Regular
- Caption: 12-14px, Regular

### Spacing
- Card padding: 16px
- Section margin: 16px
- Border radius: 12px
- Icon size: 24-48px

## Error Handling

All screens implement:
- Loading states with ActivityIndicator
- Error states with user-friendly messages
- Pull-to-refresh functionality
- Empty state handling
- Alert dialogs for confirmations
- Try-catch blocks for API calls

## Accessibility Features

- Large touch targets (minimum 44x44 points)
- Clear visual hierarchy
- Color-coded information
- Icon + text labels
- Descriptive error messages
- Loading indicators

## Future Enhancements

Potential improvements:
- Push notifications for assignments
- In-app PDF viewer
- Video playback
- Assignment draft saving
- File compression before upload
- Bandwidth-aware downloads
- Search and filter materials
- Assignment reminders
- Performance analytics graphs
- Social features (study groups)
