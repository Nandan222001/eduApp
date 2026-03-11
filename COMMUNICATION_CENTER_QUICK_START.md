# Communication Center - Quick Start Guide

## Getting Started

### 1. Database Setup

Run the migration to create communication tables:

```bash
alembic upgrade head
```

This creates the following tables:
- `notifications`
- `notification_preferences`
- `announcements`
- `messages`
- `notification_templates`

### 2. Backend Verification

The backend APIs are already implemented. Verify they're accessible:

```bash
# Start the server
uvicorn src.main:app --reload

# Test endpoints (requires authentication)
curl http://localhost:8000/api/v1/announcements/
curl http://localhost:8000/api/v1/messages/inbox
curl http://localhost:8000/api/v1/notifications/
```

### 3. Frontend Integration

#### Add to Your Router

```tsx
// src/App.tsx or your router configuration
import CommunicationCenter from '@/pages/CommunicationCenter';
import TeacherCommunicationDashboard from '@/pages/TeacherCommunicationDashboard';
import ParentCommunicationDashboard from '@/pages/ParentCommunicationDashboard';

// Add routes
<Route path="/communication" element={<CommunicationCenter />} />
<Route path="/teacher/communication" element={<TeacherCommunicationDashboard />} />
<Route path="/parent/communication" element={<ParentCommunicationDashboard />} />
```

#### Add Notification Dropdown to Header

```tsx
// src/components/Header.tsx
import { NotificationDropdown } from '@/components/communications';
import { useState } from 'react';
import { NotificationPreferences } from '@/components/communications';

function Header() {
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  return (
    <AppBar>
      <Toolbar>
        {/* Your existing header items */}
        <NotificationDropdown onOpenPreferences={() => setPreferencesOpen(true)} />
        
        <NotificationPreferences
          open={preferencesOpen}
          onClose={() => setPreferencesOpen(false)}
        />
      </Toolbar>
    </AppBar>
  );
}
```

#### Add Navigation Menu Items

```tsx
// Add to your navigation menu
const menuItems = [
  // ... other items
  {
    path: '/communication',
    icon: <MessageIcon />,
    label: 'Communication',
    roles: ['teacher', 'admin', 'parent', 'student'],
  },
];
```

## Basic Usage Examples

### 1. Creating an Announcement (Teacher/Admin)

```tsx
import { useState } from 'react';
import { AnnouncementComposer } from '@/components/communications';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Create Announcement
      </Button>
      
      <AnnouncementComposer
        open={open}
        onClose={() => setOpen(false)}
        grades={grades}
        sections={sections}
      />
    </>
  );
}
```

### 2. Displaying Messages

```tsx
import { MessagingInterface } from '@/components/communications';
import { useAuthStore } from '@/store/authStore';

function MessagesPage() {
  const { user } = useAuthStore();

  return (
    <MessagingInterface currentUserId={user?.id} />
  );
}
```

### 3. Parent Communication View

```tsx
import { ParentCommunicationView } from '@/components/communications';

function ParentDashboard() {
  // Get student and teachers data
  const { student, teachers } = useStudentData();

  return (
    <ParentCommunicationView
      studentId={student.id}
      teachers={teachers}
    />
  );
}
```

### 4. Sending a Message Programmatically

```tsx
import { communicationsApi } from '@/api/communications';
import { useMutation } from '@tanstack/react-query';

function SendMessageExample() {
  const sendMessage = useMutation({
    mutationFn: communicationsApi.sendMessage,
    onSuccess: () => {
      alert('Message sent!');
    },
  });

  const handleSend = () => {
    sendMessage.mutate({
      recipient_id: 123,
      subject: 'Hello',
      content: 'This is a test message',
    });
  };

  return <Button onClick={handleSend}>Send Message</Button>;
}
```

## Component Props Reference

### AnnouncementComposer

```tsx
interface AnnouncementComposerProps {
  open: boolean;                    // Control dialog visibility
  onClose: () => void;              // Close handler
  grades?: Array<{                  // Available grades for targeting
    id: number;
    name: string;
  }>;
  sections?: Array<{                // Available sections for targeting
    id: number;
    name: string;
    grade_id: number;
  }>;
}
```

### MessagingInterface

```tsx
interface MessagingInterfaceProps {
  currentUserId?: number;           // Current logged-in user ID
}
```

### NotificationDropdown

```tsx
interface NotificationDropdownProps {
  onOpenPreferences?: () => void;   // Callback for settings button
}
```

### ParentCommunicationView

```tsx
interface ParentCommunicationViewProps {
  studentId?: number;               // Student ID for filtering
  teachers?: Array<{                // Student's teachers
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    subject?: string;
  }>;
}
```

## API Usage Examples

### Fetch Notifications

```tsx
import { useQuery } from '@tanstack/react-query';
import { communicationsApi } from '@/api/communications';

function NotificationList() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => communicationsApi.getNotifications(),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {notifications?.map(notif => (
        <div key={notif.id}>{notif.title}</div>
      ))}
    </div>
  );
}
```

### Create Announcement

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '@/api/communications';

function CreateAnnouncement() {
  const queryClient = useQueryClient();
  
  const createAnnouncement = useMutation({
    mutationFn: communicationsApi.createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const handleCreate = () => {
    createAnnouncement.mutate({
      title: 'Important Update',
      content: 'Classes will start at 9 AM tomorrow.',
      audience_type: 'all',
      channels: ['in_app', 'email'],
      priority: 'high',
    });
  };

  return <Button onClick={handleCreate}>Create</Button>;
}
```

### Update Notification Preferences

```tsx
import { useMutation } from '@tanstack/react-query';
import { communicationsApi } from '@/api/communications';

function UpdatePreferences() {
  const updatePrefs = useMutation({
    mutationFn: communicationsApi.updateNotificationPreferences,
  });

  const handleUpdate = () => {
    updatePrefs.mutate({
      email_enabled: true,
      sms_enabled: false,
      notification_types: {
        assignment: true,
        attendance: true,
        message: true,
      },
    });
  };

  return <Button onClick={handleUpdate}>Save Preferences</Button>;
}
```

## Common Patterns

### 1. Conditional Rendering Based on Role

```tsx
import { useAuthStore } from '@/store/authStore';

function CommunicationPage() {
  const { user } = useAuthStore();

  if (user?.role === 'teacher' || user?.role === 'admin') {
    return <TeacherCommunicationDashboard />;
  }

  if (user?.role === 'parent') {
    return <ParentCommunicationDashboard />;
  }

  return <CommunicationCenter />;
}
```

### 2. Combining Multiple Components

```tsx
function ComprehensiveCommunication() {
  const [composerOpen, setComposerOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  return (
    <Box>
      <AnnouncementList onCompose={() => setComposerOpen(true)} />
      
      <AnnouncementComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
      />
      
      <NotificationPreferences
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />
    </Box>
  );
}
```

### 3. Real-time Updates with Auto-refetch

```tsx
function RealtimeNotifications() {
  const { data } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => communicationsApi.getNotificationStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return <Badge badgeContent={data?.unread || 0}>
    <NotificationsIcon />
  </Badge>;
}
```

## Troubleshooting

### Issue: Components not rendering
**Solution:** Ensure React Query is properly set up in your app:

```tsx
// main.tsx or App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

### Issue: API calls failing
**Solution:** Check your axios configuration has proper auth headers:

```tsx
// lib/axios.ts
axios.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Issue: Notifications not updating
**Solution:** Invalidate queries after mutations:

```tsx
const mutation = useMutation({
  mutationFn: apiCall,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['messages'] });
  },
});
```

## Next Steps

1. **Customize Styling**: Modify component styles to match your theme
2. **Add File Uploads**: Implement attachment functionality
3. **WebSocket Integration**: Add real-time message delivery
4. **Analytics**: Track communication engagement
5. **Templates**: Create reusable message templates

## Additional Resources

- Full Implementation Guide: `COMMUNICATION_CENTER_IMPLEMENTATION.md`
- API Documentation: Check `/api/docs` when server is running
- Component Source: `frontend/src/components/communications/`
- Backend Services: `src/services/`
