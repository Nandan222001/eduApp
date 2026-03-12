# PWA Implementation Guide

## Overview

This application has been enhanced with Progressive Web App (PWA) capabilities, providing offline support, installability, push notifications, and optimized performance through intelligent caching strategies.

## Features Implemented

### 1. Service Worker

**Location**: `frontend/public/service-worker.js`

The service worker provides:

- **Offline Support**: Application works without internet connection
- **Smart Caching**: Multiple caching strategies for different resource types
- **Background Sync**: Queues failed requests for automatic retry when online
- **Push Notifications**: Receives and displays push notifications

#### Caching Strategies

- **Cache First**: Static assets (JS, CSS, fonts, images)
- **Network First**: API requests with cache fallback
- **Stale While Revalidate**: Dynamic content pages

#### Cache Versions

- Static Cache: `static-v1.0.0`
- Dynamic Cache: `dynamic-v1.0.0`
- API Cache: `api-v1.0.0`
- Image Cache: `images-v1.0.0`

### 2. Web App Manifest

**Location**: `frontend/public/manifest.json`

Provides app metadata for installation:

- App name and icons
- Theme colors
- Display mode (standalone)
- App shortcuts
- Share target integration
- Screenshots for app stores

### 3. Offline Queue Management

**Location**: `frontend/src/utils/offlineQueue.ts`

Features:

- Stores failed requests in IndexedDB
- Automatically syncs when connection restored
- Type-specific queues (attendance, assignments)
- Real-time queue status updates

### 4. Push Notifications

**Location**: `frontend/src/utils/pushNotifications.ts`

Capabilities:

- Request notification permissions
- Subscribe/unsubscribe from push notifications
- Send local notifications
- Predefined notification templates
- VAPID key support

### 5. PWA Components

#### InstallPrompt

**Location**: `frontend/src/components/common/InstallPrompt.tsx`

Prompts users to install the app when available.

#### UpdatePrompt

**Location**: `frontend/src/components/common/UpdatePrompt.tsx`

Notifies users when a new version is available.

#### OfflineIndicator

**Location**: `frontend/src/components/common/OfflineIndicator.tsx`

Shows connection status and queued items count.

#### OfflineQueueViewer

**Location**: `frontend/src/components/common/OfflineQueueViewer.tsx`

Displays and manages queued offline requests.

#### PWASettings

**Location**: `frontend/src/components/settings/PWASettings.tsx`

Complete PWA settings management interface.

### 6. React Hooks

#### usePWA

**Location**: `frontend/src/hooks/usePWA.ts`

```typescript
const {
  isInstalled,
  isUpdateAvailable,
  canInstall,
  isOnline,
  serviceWorkerRegistered,
  install,
  update,
} = usePWA();
```

#### useOfflineQueue

**Location**: `frontend/src/hooks/useOfflineQueue.ts`

```typescript
const { queue, queueCount, isProcessing, processQueue, clearQueue, getQueueByType } =
  useOfflineQueue();
```

## Setup Instructions

### 1. Generate Icons

You need to generate app icons in various sizes. Place them in `frontend/public/icons/`:

Required sizes:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
- icon-192x192-maskable.png
- icon-512x512-maskable.png
- badge-72x72.png

Shortcut icons:

- shortcut-dashboard.png
- shortcut-attendance.png
- shortcut-assignments.png

### 2. Configure Environment Variables

Add to `.env.production`:

```env
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### 3. Build for Production

```bash
cd frontend
npm run build
```

The build will include the service worker and manifest.

### 4. Test PWA Features

Use Chrome DevTools > Application tab to:

- Verify service worker registration
- Test cache storage
- Simulate offline mode
- Test manifest
- Debug push notifications

## Usage Examples

### Queue Offline Attendance

```typescript
import { queueAttendanceRequest } from '@/utils/offlineQueue';

// When marking attendance offline
await queueAttendanceRequest({
  date: '2024-01-15',
  section_id: 1,
  attendances: [
    { student_id: 1, status: 'present' },
    { student_id: 2, status: 'absent' },
  ],
});
```

### Queue Offline Assignment Submission

```typescript
import { queueAssignmentSubmission } from '@/utils/offlineQueue';

// When submitting assignment offline
await queueAssignmentSubmission(assignmentId, {
  student_id: 1,
  content: 'Assignment content',
  files: [],
});
```

### Send Push Notification

```typescript
import { showLocalNotification, notificationTemplates } from '@/utils/pushNotifications';

// Show attendance reminder
const notification = notificationTemplates.attendance_reminder('2024-01-15');
await showLocalNotification(notification.title, notification);
```

### Check PWA Status

```typescript
import { usePWA } from '@/hooks/usePWA';

function MyComponent() {
  const { isOnline, isInstalled, canInstall, install } = usePWA();

  return (
    <div>
      <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
      {canInstall && (
        <button onClick={install}>Install App</button>
      )}
    </div>
  );
}
```

## Offline Capabilities

### What Works Offline

1. **View Cached Content**
   - Dashboard
   - Previously viewed pages
   - Cached API responses
   - Downloaded assignments
   - Attendance records

2. **Queue Actions**
   - Mark attendance
   - Submit assignments
   - Post comments
   - Any POST/PUT/DELETE request

3. **Local Features**
   - Pomodoro timer
   - Flashcards (if cached)
   - Settings

### Automatic Sync

When connection is restored:

1. Service worker detects online status
2. Processes queued requests automatically
3. Notifies user of sync completion
4. Updates UI with fresh data

## Performance Optimizations

### Caching Strategy Benefits

- **Static Assets**: Instant load from cache
- **API Responses**: Reduced server load, faster response
- **Images**: Lower bandwidth usage
- **Offline Pages**: Full functionality without network

### Cache Limits

- Maximum 50 items per dynamic cache
- Automatic cache trimming
- 7-day cache expiration
- Manual cache clearing available

## Push Notifications Setup

### Server-Side (Backend)

You need to implement push notification endpoints:

```python
# Example endpoint to send push notifications
@router.post("/push-notifications/send")
async def send_push_notification(
    user_id: int,
    title: str,
    body: str,
    data: dict = None
):
    # Get user's push subscription from database
    subscription = await get_user_push_subscription(user_id)

    # Send push notification using web-push or similar library
    await send_push(subscription, {
        "title": title,
        "body": body,
        "data": data
    })
```

### VAPID Keys Generation

```bash
# Using web-push library
npm install -g web-push
web-push generate-vapid-keys
```

Add keys to environment:

- Public key: `VITE_VAPID_PUBLIC_KEY`
- Private key: Server environment variable

## Testing

### Local Testing

1. **Service Worker**:

   ```bash
   npm run build
   npm run preview
   ```

2. **Offline Mode**:
   - Open DevTools > Network
   - Select "Offline" throttling
   - Navigate the app

3. **Push Notifications**:
   ```javascript
   // In browser console
   Notification.requestPermission();
   ```

### Production Testing

1. Deploy to HTTPS domain (required for PWA)
2. Open Chrome DevTools > Lighthouse
3. Run PWA audit
4. Fix any issues identified

## Browser Support

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 15+ (limited push notification support)
- ✅ Samsung Internet 14+

## Troubleshooting

### Service Worker Not Registering

1. Check HTTPS is enabled (required except localhost)
2. Verify service-worker.js is in public directory
3. Check browser console for errors
4. Clear browser cache and reload

### Push Notifications Not Working

1. Verify VAPID keys are configured
2. Check notification permission status
3. Ensure HTTPS is enabled
4. Test on supported browser

### Offline Queue Not Syncing

1. Check IndexedDB is enabled
2. Verify network connection restored
3. Check browser console for sync errors
4. Manually trigger sync from PWA settings

### Cache Issues

1. Clear cache from PWA settings
2. Update cache version in service-worker.js
3. Hard reload (Ctrl+Shift+R)
4. Unregister service worker and re-register

## Best Practices

1. **Always test offline functionality** before deploying
2. **Keep cache version updated** when making changes
3. **Monitor cache size** to avoid storage issues
4. **Provide clear offline indicators** to users
5. **Test on real mobile devices** not just DevTools
6. **Handle failed sync gracefully** with user feedback
7. **Respect user's notification preferences**
8. **Keep service worker simple** for maintainability

## Future Enhancements

- [ ] Background fetch for large files
- [ ] Periodic background sync
- [ ] Share target handler implementation
- [ ] Advanced caching strategies per route
- [ ] Cache analytics and monitoring
- [ ] A/B testing for PWA features
- [ ] Web app shortcuts customization
- [ ] Native app integration

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## Support

For issues or questions:

1. Check browser console for errors
2. Review this documentation
3. Check GitHub issues
4. Contact development team
