# Student Mobile App Implementation Guide

## Overview

This document provides a comprehensive guide to the student mobile app features implemented for the EduTrack platform.

## Installation & Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Required Dependencies

The following packages have been added to `package.json`:

```json
{
  "expo-camera": "~14.0.5",
  "expo-document-picker": "~11.10.1", 
  "expo-file-system": "~16.0.7"
}
```

### 3. Configuration

Update your `.env` file with the API base URL:

```env
API_BASE_URL=http://your-api-server:8000
API_VERSION=v1
```

## File Structure

```
mobile/src/
├── api/
│   ├── studentApi.ts          # Student API endpoints
│   └── client.ts              # API client configuration
├── components/
│   └── StudentDashboard.tsx   # Main dashboard component
├── screens/student/
│   ├── StudentHomeScreen.tsx          # Home screen wrapper
│   ├── StudentCoursesScreen.tsx       # Courses list
│   ├── StudentAssignmentsScreen.tsx   # Assignments wrapper
│   ├── AssignmentsScreen.tsx          # Assignments with tabs
│   ├── AssignmentDetailScreen.tsx     # Graded assignment details
│   ├── AssignmentSubmissionScreen.tsx # Submit assignments
│   ├── CameraScreen.tsx               # Camera capture
│   ├── StudyMaterialsScreen.tsx       # Subjects list
│   ├── SubjectMaterialsScreen.tsx     # Materials by subject
│   ├── MaterialDetailScreen.tsx       # Material details
│   └── index.ts                       # Barrel exports
├── navigation/
│   └── StudentNavigator.tsx   # Student navigation setup
├── types/
│   ├── student.ts            # Student-specific types
│   └── navigation.ts         # Navigation types
└── utils/
    └── fileManager.ts        # Offline file management
```

## Component Details

### StudentDashboard

**Location:** `src/components/StudentDashboard.tsx`

**Purpose:** Main dashboard displaying student overview and statistics

**Features:**
- Welcome card with personalized greeting
- Attendance status with weekly stats
- Streak tracker with gamification points
- Upcoming assignments (next 3)
- Recent grades (last 5)
- AI performance predictions
- Weak areas identification
- Recent badges display

**API Calls:**
```typescript
Promise.all([
  studentApi.getStats(),
  studentApi.getAttendance(),
  studentApi.getAssignments('pending'),
  studentApi.getGrades(5),
  studentApi.getAIPredictions(),
  studentApi.getWeakAreas(),
  studentApi.getBadges(),
])
```

**State Management:**
- Local state with useState
- Pull-to-refresh functionality
- Loading and error states

### AssignmentsScreen

**Location:** `src/screens/student/AssignmentsScreen.tsx`

**Purpose:** Tab-based assignment management

**Tabs:**
1. **Pending** - Assignments to be submitted
2. **Submitted** - Awaiting grading
3. **Graded** - Completed with scores

**Features:**
- Tab navigation
- Smart due date formatting
- Color-coded due dates
- Score display for graded assignments
- Tap to navigate to detail or submission

**Navigation:**
- Pending → AssignmentSubmission
- Submitted/Graded → AssignmentDetail

### AssignmentSubmissionScreen

**Location:** `src/screens/student/AssignmentSubmissionScreen.tsx`

**Purpose:** Submit assignments with files and photos

**Features:**
- Assignment details display
- Camera integration
- Document picker
- Multiple file support
- File preview
- Comments field
- Submission confirmation

**File Upload:**
```typescript
const formData = new FormData();
files.forEach((file) => {
  formData.append('files', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  });
});
```

### CameraScreen

**Location:** `src/screens/student/CameraScreen.tsx`

**Purpose:** Full-screen camera for capturing assignment photos

**Features:**
- Front/back camera toggle
- Photo capture
- Permission handling
- Return photo to submission screen

**Usage:**
```typescript
navigation.navigate('CameraScreen', {
  onPhotoTaken: (photo) => {
    setFiles([...files, photo]);
  },
});
```

### StudyMaterialsScreen

**Location:** `src/screens/student/StudyMaterialsScreen.tsx`

**Purpose:** Display all subjects with materials

**Features:**
- Subject list with icons
- Material count per subject
- Teacher information
- Navigation to subject materials

### SubjectMaterialsScreen

**Location:** `src/screens/student/SubjectMaterialsScreen.tsx`

**Purpose:** Display materials for a specific subject with offline support

**Features:**
- Material list filtering
- File type icons
- Download functionality
- Offline availability
- Delete downloaded files
- File size display

**Offline Storage:**
```typescript
const localPath = `${FileSystem.documentDirectory}materials/${materialId}_${title}`;
await FileSystem.downloadAsync(url, localPath);
```

### MaterialDetailScreen

**Location:** `src/screens/student/MaterialDetailScreen.tsx`

**Purpose:** Display material details and open files

**Features:**
- Material information
- File details
- Offline status
- Open file/link
- Share functionality

## API Integration

### Student API Service

**Location:** `src/api/studentApi.ts`

**Methods:**

```typescript
export const studentApi = {
  // Statistics
  getStats(): Promise<StudentStats>
  
  // Attendance
  getAttendance(): Promise<AttendanceStatus>
  
  // Assignments
  getAssignments(status?: 'pending' | 'submitted' | 'graded'): Promise<Assignment[]>
  getAssignmentById(id: number): Promise<Assignment>
  submitAssignment(submission: AssignmentSubmission): Promise<any>
  
  // Grades
  getGrades(limit?: number): Promise<Grade[]>
  
  // AI Features
  getAIPredictions(): Promise<AIPrediction[]>
  getWeakAreas(): Promise<WeakArea[]>
  
  // Study Materials
  getSubjects(): Promise<Subject[]>
  getStudyMaterials(subjectId?: number): Promise<StudyMaterial[]>
  getMaterialById(id: number): Promise<StudyMaterial>
  
  // Gamification
  getBadges(): Promise<GamificationBadge[]>
  getAchievements(limit?: number): Promise<Achievement[]>
}
```

## Type Definitions

### Student Types

**Location:** `src/types/student.ts`

**Key Interfaces:**

```typescript
interface StudentStats {
  attendance_percentage: number;
  total_courses: number;
  pending_assignments: number;
  average_grade: number;
  streak_days: number;
  points: number;
  level: number;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  subject: string;
  subject_id: number;
  due_date: string;
  max_score: number;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  submission_date?: string;
  feedback?: string;
  attachments?: string[];
}

interface StudyMaterial {
  id: number;
  title: string;
  subject: string;
  subject_id: number;
  type: 'pdf' | 'video' | 'document' | 'link' | 'image';
  file_url?: string;
  description?: string;
  uploaded_date: string;
  size?: number;
  is_downloaded?: boolean;
  local_path?: string;
}
```

## Navigation Setup

### StudentNavigator

**Location:** `src/navigation/StudentNavigator.tsx`

**Structure:**

```
Tab Navigator
├── Home Tab → HomeStack
│   ├── StudentHome
│   ├── AssignmentSubmission
│   └── CameraScreen (Modal)
├── Courses Tab → CoursesStack
│   ├── StudentCourses
│   ├── StudyMaterialsScreen
│   ├── SubjectMaterials
│   └── MaterialDetail
├── Assignments Tab → AssignmentsStack
│   ├── StudentAssignments
│   ├── AssignmentDetail
│   ├── AssignmentSubmission
│   └── CameraScreen (Modal)
└── Profile Tab → ProfileStack
    └── StudentProfile
```

## Offline File Management

### File Manager Utility

**Location:** `src/utils/fileManager.ts`

**Features:**
- Directory management
- Download with progress
- File deletion
- Existence checking
- Metadata retrieval

**Usage:**

```typescript
import { fileManager } from '../utils/fileManager';

// Download file
const localPath = await fileManager.downloadFile(
  url,
  filename,
  (progress) => console.log(`${progress * 100}%`)
);

// Check if downloaded
const isDownloaded = await fileManager.isFileDownloaded(filename);

// Delete file
await fileManager.deleteFile(localPath);

// Clear all
await fileManager.clearAllDownloads();
```

## Permissions

### Camera Permission

Requested in `AssignmentSubmissionScreen`:

```typescript
const requestCameraPermission = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  setHasPermission(status === 'granted');
};
```

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to take photos for assignments."
        }
      ]
    ]
  }
}
```

## Styling

### Color Palette

```typescript
const colors = {
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  background: '#F2F2F7',
  white: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
};
```

### Common Styles

```typescript
const commonStyles = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
};
```

## Testing

### Manual Testing Checklist

#### Dashboard
- [ ] Dashboard loads with all widgets
- [ ] Pull-to-refresh works
- [ ] Navigation to assignments works
- [ ] All stats display correctly

#### Assignments
- [ ] All three tabs load
- [ ] Tab switching works
- [ ] Assignment cards display correctly
- [ ] Navigation to detail/submission works

#### Assignment Submission
- [ ] Camera opens correctly
- [ ] Photos can be captured
- [ ] File picker works
- [ ] Multiple files can be added
- [ ] Files can be removed
- [ ] Submission works

#### Study Materials
- [ ] Subjects load correctly
- [ ] Navigation to materials works
- [ ] Materials can be downloaded
- [ ] Offline status updates
- [ ] Downloaded files can be opened
- [ ] Downloaded files can be deleted

## Troubleshooting

### Common Issues

#### Camera not working
1. Check permissions in device settings
2. Verify `expo-camera` is installed
3. Check `app.json` configuration

#### File picker not working
1. Verify `expo-document-picker` is installed
2. Check file type restrictions
3. Test on physical device (may not work in simulator)

#### Downloads failing
1. Check network connectivity
2. Verify file URL is accessible
3. Check device storage space
4. Ensure directory permissions

#### Navigation errors
1. Verify all screens are imported
2. Check navigation param types
3. Ensure stack navigators are properly nested

## Best Practices

### Performance
- Use `FlatList` for long lists
- Implement pull-to-refresh
- Show loading states
- Cache API responses when appropriate

### User Experience
- Show meaningful error messages
- Provide confirmation dialogs for destructive actions
- Use optimistic UI updates when possible
- Implement empty states

### Code Quality
- Type all props and state
- Extract reusable components
- Use consistent naming
- Comment complex logic
- Handle all error cases

## Future Enhancements

### Planned Features
1. Push notifications for assignments
2. In-app PDF viewer
3. Video playback
4. Assignment drafts
5. Offline mode for viewing assignments
6. Advanced search and filters
7. Calendar view for assignments
8. Performance analytics charts
9. Study groups/collaboration
10. Assignment comments/questions

### Technical Improvements
1. State management with Redux
2. Optimistic UI updates
3. Better error recovery
4. Offline-first architecture
5. Background sync
6. Image compression
7. File upload queue
8. Bandwidth monitoring
9. Analytics tracking
10. A/B testing framework
