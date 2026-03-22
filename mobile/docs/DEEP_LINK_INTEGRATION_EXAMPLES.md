# Deep Link Integration Examples

This guide shows practical examples of how to use deep linking in the EduTrack mobile app.

## Basic Usage

### Import Deep Link Utilities

```typescript
import {
  createDeepLink,
  createWebLink,
  deepLinkRoutes,
  parseDeepLink,
  isValidDeepLink,
} from '@utils/deepLinking';
```

---

## Creating Deep Links

### Static Routes

```typescript
// Profile page
const profileLink = createDeepLink(deepLinkRoutes.profile());
// Result: "edutrack://profile"

// Settings page
const settingsLink = createDeepLink(deepLinkRoutes.settings());
// Result: "edutrack://settings"

// Student home
const studentHome = createDeepLink(deepLinkRoutes.studentHome());
// Result: "edutrack://(tabs)/student"

// Parent home
const parentHome = createDeepLink(deepLinkRoutes.parentHome());
// Result: "edutrack://(tabs)/parent"
```

### Dynamic Routes

```typescript
// Assignment detail
const assignmentLink = createDeepLink(deepLinkRoutes.assignments('123'));
// Result: "edutrack://assignments/123"

// Course detail
const courseLink = createDeepLink(deepLinkRoutes.courses('math-101'));
// Result: "edutrack://courses/math-101"

// Child profile
const childLink = createDeepLink(deepLinkRoutes.children('child-456'));
// Result: "edutrack://children/child-456"

// Message thread
const messageLink = createDeepLink(deepLinkRoutes.messages('msg-789'));
// Result: "edutrack://messages/msg-789"

// Notification
const notificationLink = createDeepLink(deepLinkRoutes.notifications('notif-abc'));
// Result: "edutrack://notifications/notif-abc"
```

### Links with Query Parameters

```typescript
// Assignment with tab selection
const assignmentWithTab = createDeepLink(
  deepLinkRoutes.assignments('123'),
  { tab: 'details', notification: 'true' }
);
// Result: "edutrack://assignments/123?tab=details&notification=true"

// Course with section
const courseWithSection = createDeepLink(
  deepLinkRoutes.courses('math-101'),
  { section: 'homework', week: '3' }
);
// Result: "edutrack://courses/math-101?section=homework&week=3"
```

### Web Links (Universal/App Links)

```typescript
// Assignment web link
const webLink = createWebLink(deepLinkRoutes.assignments('123'));
// Result: "https://edutrack.app/assignments/123"

// Course web link with parameters
const courseWebLink = createWebLink(
  deepLinkRoutes.courses('math-101'),
  { section: 'homework' }
);
// Result: "https://edutrack.app/courses/math-101?section=homework"
```

---

## Sharing Content

### Share Assignment

```typescript
import { Share } from 'react-native';
import { createWebLink, deepLinkRoutes } from '@utils/deepLinking';

const shareAssignment = async (assignmentId: string, assignmentTitle: string) => {
  try {
    const link = createWebLink(deepLinkRoutes.assignments(assignmentId));
    
    await Share.share({
      title: `Check out this assignment: ${assignmentTitle}`,
      message: `${assignmentTitle}\n\n${link}`,
      url: link, // iOS only
    });
  } catch (error) {
    console.error('Error sharing assignment:', error);
  }
};

// Usage
shareAssignment('123', 'Math Homework - Chapter 5');
```

### Share Course

```typescript
const shareCourse = async (courseId: string, courseName: string) => {
  try {
    const link = createWebLink(deepLinkRoutes.courses(courseId));
    
    await Share.share({
      title: `Join my course: ${courseName}`,
      message: `I'm taking ${courseName}. Check it out!\n\n${link}`,
      url: link,
    });
  } catch (error) {
    console.error('Error sharing course:', error);
  }
};
```

### Share Profile

```typescript
const shareProfile = async (userName: string) => {
  try {
    const link = createWebLink(deepLinkRoutes.profile());
    
    await Share.share({
      title: `${userName}'s EduTrack Profile`,
      message: `Connect with me on EduTrack!\n\n${link}`,
      url: link,
    });
  } catch (error) {
    console.error('Error sharing profile:', error);
  }
};
```

---

## Notification Deep Links

### Push Notification with Deep Link

```typescript
import { notificationsService } from '@utils/notifications';
import { deepLinkRoutes } from '@utils/deepLinking';

const sendAssignmentNotification = async (
  userId: string,
  assignmentId: string,
  assignmentTitle: string
) => {
  await notificationsService.scheduleNotification({
    title: 'New Assignment',
    body: `You have a new assignment: ${assignmentTitle}`,
    data: {
      type: 'assignment',
      assignmentId,
      deepLink: deepLinkRoutes.assignments(assignmentId),
    },
  });
};

const sendGradeNotification = async (
  userId: string,
  assignmentId: string,
  grade: string
) => {
  await notificationsService.scheduleNotification({
    title: 'Grade Posted',
    body: `Your grade is ready: ${grade}`,
    data: {
      type: 'grade',
      assignmentId,
      deepLink: deepLinkRoutes.assignments(assignmentId),
      tab: 'grade',
    },
  });
};
```

### Handle Notification Tap

```typescript
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { notificationsService } from '@utils/notifications';
import { parseDeepLink } from '@utils/deepLinking';

const NotificationHandler = () => {
  const router = useRouter();

  useEffect(() => {
    const subscription = notificationsService.addNotificationResponseReceivedListener(
      (response) => {
        const { deepLink, ...params } = response.notification.request.content.data;
        
        if (deepLink) {
          const route = parseDeepLink(deepLink);
          
          if (route) {
            router.push({
              pathname: route.path as any,
              params: { ...route.params, ...params },
            });
          }
        }
      }
    );

    return () => subscription.remove();
  }, [router]);

  return null;
};
```

---

## QR Code Integration

### Generate QR Code with Deep Link

```typescript
import QRCode from 'react-native-qrcode-svg';
import { createWebLink, deepLinkRoutes } from '@utils/deepLinking';

const AssignmentQRCode = ({ assignmentId }: { assignmentId: string }) => {
  const link = createWebLink(deepLinkRoutes.assignments(assignmentId));

  return (
    <View style={styles.qrContainer}>
      <Text style={styles.title}>Scan to view assignment</Text>
      <QRCode
        value={link}
        size={200}
        backgroundColor="white"
        color="black"
      />
      <Text style={styles.link}>{link}</Text>
    </View>
  );
};
```

### Scan QR Code and Navigate

```typescript
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useRouter } from 'expo-router';
import { parseDeepLink, isValidDeepLink } from '@utils/deepLinking';

const QRCodeScanner = () => {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (isValidDeepLink(data)) {
      const route = parseDeepLink(data);
      
      if (route) {
        router.push({
          pathname: route.path as any,
          params: route.params,
        });
      }
    } else {
      Alert.alert('Invalid QR Code', 'This QR code does not contain a valid link.');
    }
  };

  return (
    <BarCodeScanner
      onBarCodeScanned={handleBarCodeScanned}
      style={StyleSheet.absoluteFillObject}
    />
  );
};
```

---

## Email Integration

### Send Email with Deep Link

```typescript
import * as MailComposer from 'expo-mail-composer';
import { createWebLink, deepLinkRoutes } from '@utils/deepLinking';

const emailAssignment = async (
  assignmentId: string,
  assignmentTitle: string,
  recipientEmail: string
) => {
  const link = createWebLink(deepLinkRoutes.assignments(assignmentId));
  
  const isAvailable = await MailComposer.isAvailableAsync();
  
  if (isAvailable) {
    await MailComposer.composeAsync({
      recipients: [recipientEmail],
      subject: `Assignment: ${assignmentTitle}`,
      body: `
        Hello,
        
        Please review the assignment: ${assignmentTitle}
        
        View assignment: ${link}
        
        Best regards,
        EduTrack
      `,
      isHtml: false,
    });
  }
};
```

---

## In-App Navigation

### Navigate to Assignment from List

```typescript
import { useRouter } from 'expo-router';
import { deepLinkRoutes } from '@utils/deepLinking';

const AssignmentList = ({ assignments }: { assignments: Assignment[] }) => {
  const router = useRouter();

  const handleAssignmentPress = (assignmentId: string) => {
    router.push(deepLinkRoutes.assignments(assignmentId) as any);
  };

  return (
    <FlatList
      data={assignments}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => handleAssignmentPress(item.id)}>
          <Text>{item.title}</Text>
        </TouchableOpacity>
      )}
    />
  );
};
```

### Navigate with Parameters

```typescript
const handleViewAssignmentDetails = (assignmentId: string) => {
  router.push({
    pathname: deepLinkRoutes.assignments(assignmentId) as any,
    params: { tab: 'details' },
  });
};

const handleViewAssignmentGrade = (assignmentId: string) => {
  router.push({
    pathname: deepLinkRoutes.assignments(assignmentId) as any,
    params: { tab: 'grade', highlight: 'true' },
  });
};
```

---

## Parsing Deep Links

### Basic Parsing

```typescript
import { parseDeepLink } from '@utils/deepLinking';

const handleExternalLink = (url: string) => {
  const route = parseDeepLink(url);
  
  if (!route) {
    console.error('Invalid deep link:', url);
    return;
  }
  
  console.log('Path:', route.path);
  console.log('Params:', route.params);
  
  // Navigate to route
  router.push({
    pathname: route.path as any,
    params: route.params,
  });
};

// Example URLs:
handleExternalLink('edutrack://assignments/123');
// { path: 'assignments/123', params: {} }

handleExternalLink('edutrack://assignments/123?tab=details&notify=true');
// { path: 'assignments/123', params: { tab: 'details', notify: 'true' } }

handleExternalLink('https://edutrack.app/courses/math-101?section=homework');
// { path: 'courses/math-101', params: { section: 'homework' } }
```

### Validation Before Navigation

```typescript
import { isValidDeepLink, parseDeepLink } from '@utils/deepLinking';

const navigateToDeepLink = (url: string) => {
  // Validate URL
  if (!isValidDeepLink(url)) {
    Alert.alert('Invalid Link', 'This link is not a valid EduTrack link.');
    return;
  }
  
  // Parse URL
  const route = parseDeepLink(url);
  
  if (!route) {
    Alert.alert('Error', 'Unable to process this link.');
    return;
  }
  
  // Additional validation
  if (route.path.startsWith('assignments/')) {
    const assignmentId = route.path.split('/')[1];
    
    if (!assignmentId || assignmentId.length === 0) {
      Alert.alert('Error', 'Invalid assignment ID.');
      return;
    }
  }
  
  // Navigate
  router.push({
    pathname: route.path as any,
    params: route.params,
  });
};
```

---

## Analytics Tracking

### Track Deep Link Opens

```typescript
import { parseDeepLink } from '@utils/deepLinking';
import analytics from '@utils/analytics';

const trackDeepLinkOpen = (url: string, source: string) => {
  const route = parseDeepLink(url);
  
  if (route) {
    analytics.track('deep_link_opened', {
      url,
      path: route.path,
      params: route.params,
      source, // 'notification', 'email', 'qr_code', 'share', etc.
      timestamp: new Date().toISOString(),
    });
  }
};

// Usage in notification handler
const handleNotificationDeepLink = (url: string) => {
  trackDeepLinkOpen(url, 'notification');
  navigateToDeepLink(url);
};

// Usage in QR code scanner
const handleQRCodeScan = (url: string) => {
  trackDeepLinkOpen(url, 'qr_code');
  navigateToDeepLink(url);
};
```

---

## Best Practices

1. **Always use web links for sharing**: They provide better user experience
2. **Include context in parameters**: Help users understand where they're going
3. **Validate all inputs**: Never trust deep link parameters
4. **Handle errors gracefully**: Show user-friendly messages
5. **Track usage**: Monitor which deep links are most used
6. **Test on both platforms**: Behavior can differ between iOS and Android

---

## Complete Example: Share Button Component

```typescript
import React from 'react';
import { TouchableOpacity, Text, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createWebLink, deepLinkRoutes } from '@utils/deepLinking';
import analytics from '@utils/analytics';

interface ShareButtonProps {
  type: 'assignment' | 'course' | 'profile';
  id?: string;
  title: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ type, id, title }) => {
  const handleShare = async () => {
    try {
      let link: string;
      
      switch (type) {
        case 'assignment':
          link = createWebLink(deepLinkRoutes.assignments(id!));
          break;
        case 'course':
          link = createWebLink(deepLinkRoutes.courses(id!));
          break;
        case 'profile':
          link = createWebLink(deepLinkRoutes.profile());
          break;
        default:
          return;
      }
      
      const result = await Share.share({
        title: `EduTrack - ${title}`,
        message: `${title}\n\n${link}`,
        url: link,
      });
      
      if (result.action === Share.sharedAction) {
        analytics.track('content_shared', {
          type,
          id,
          title,
          shareMethod: result.activityType || 'unknown',
        });
        
        Alert.alert('Success', 'Link shared successfully!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share link.');
    }
  };

  return (
    <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
      <Ionicons name="share-outline" size={24} color="#007AFF" />
      <Text style={styles.shareText}>Share</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  shareText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
```

---

## Additional Resources

- [Deep Linking Guide](../DEEP_LINKING_GUIDE.md)
- [Test Commands Reference](../DEEP_LINK_TEST_COMMANDS.md)
- [Well-Known Files Configuration](./WELL_KNOWN_FILES.md)
