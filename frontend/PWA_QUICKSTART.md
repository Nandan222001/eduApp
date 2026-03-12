# PWA Quick Start Guide

## What's Been Added

The application now has Progressive Web App (PWA) capabilities with:

✅ **Offline Support** - Work without internet connection  
✅ **Installable** - Install as an app on any device  
✅ **Push Notifications** - Get real-time updates  
✅ **Smart Caching** - Faster load times  
✅ **Background Sync** - Auto-sync when back online

## Key Files Created

### Core PWA Files

- `frontend/public/service-worker.js` - Service worker for offline support
- `frontend/public/manifest.json` - App manifest for installation
- `frontend/public/offline.html` - Offline fallback page

### Utilities

- `frontend/src/utils/pwa.ts` - PWA management utilities
- `frontend/src/utils/offlineQueue.ts` - Offline request queue manager
- `frontend/src/utils/pushNotifications.ts` - Push notification utilities

### React Hooks

- `frontend/src/hooks/usePWA.ts` - PWA state and controls
- `frontend/src/hooks/useOfflineQueue.ts` - Offline queue management

### UI Components

- `frontend/src/components/common/InstallPrompt.tsx` - Install prompt
- `frontend/src/components/common/UpdatePrompt.tsx` - Update notification
- `frontend/src/components/common/OfflineIndicator.tsx` - Connection status
- `frontend/src/components/common/OfflineQueueViewer.tsx` - Queue viewer
- `frontend/src/components/settings/PWASettings.tsx` - PWA settings panel

## Quick Setup (5 minutes)

### 1. Generate App Icons

Create icons in `frontend/public/icons/`:

- Use a tool like [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- Or manually create PNG files in required sizes (see PWA_IMPLEMENTATION.md)

```bash
# Example using pwa-asset-generator
npx pwa-asset-generator logo.png public/icons --icon-only
```

### 2. Add Environment Variable

In `frontend/.env.production`:

```env
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

Generate VAPID keys:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

### 3. Build and Deploy

```bash
cd frontend
npm run build
```

Deploy the `dist` folder to your HTTPS server.

## Testing PWA Features

### 1. Test Service Worker

```bash
# Build and preview
cd frontend
npm run build
npm run preview
```

Visit `http://localhost:4173` and check:

- DevTools > Application > Service Workers
- Should show "activated and running"

### 2. Test Offline Mode

1. Open the app in Chrome
2. DevTools > Network > Select "Offline"
3. Navigate around - cached pages should work
4. Try marking attendance - should queue for sync

### 3. Test Installation

1. Visit app in Chrome (desktop or mobile)
2. Look for install prompt or address bar icon
3. Click "Install" and verify it opens as standalone app

### 4. Test Push Notifications

1. Go to Settings > PWA Settings
2. Enable Push Notifications
3. Grant permission when prompted
4. Notification subscription should show as "Active"

## How to Use PWA Features

### Install the App

**Desktop:**

1. Look for install icon in address bar
2. Or use browser menu > "Install [App Name]"

**Mobile:**

1. Tap "Add to Home Screen" prompt
2. Or use browser menu > "Add to Home Screen"

### Mark Attendance Offline

```typescript
import { queueAttendanceRequest } from '@/utils/offlineQueue';

// This works offline!
await queueAttendanceRequest({
  date: '2024-01-15',
  section_id: 1,
  attendances: [
    { student_id: 1, status: 'present' },
    { student_id: 2, status: 'absent' },
  ],
});
```

When internet returns, it syncs automatically.

### Submit Assignment Offline

```typescript
import { queueAssignmentSubmission } from '@/utils/offlineQueue';

// This also works offline!
await queueAssignmentSubmission(assignmentId, {
  student_id: 1,
  content: 'My submission',
});
```

### View Offline Queue

1. Go to Settings > PWA Settings
2. Click "View Queue" to see pending requests
3. Manually sync or wait for auto-sync

### Manage Notifications

1. Settings > PWA Settings
2. Toggle "Enable Push Notifications"
3. Grant browser permission
4. Receive notifications even when app is closed

## Common Issues

### Service Worker Not Registering

**Solution:** Ensure you're on HTTPS or localhost:

```
http://localhost:3000 ✅
https://your-domain.com ✅
http://your-domain.com ❌
```

### App Not Installable

**Solution:** Check manifest.json and icons exist:

```bash
curl https://your-domain.com/manifest.json
curl https://your-domain.com/icons/icon-192x192.png
```

### Offline Queue Not Syncing

**Solution:** Check network is restored:

```javascript
// In browser console
console.log(navigator.onLine); // Should be true
```

### Cache Not Clearing

**Solution:**

1. Settings > PWA Settings > Clear Cache
2. Or DevTools > Application > Clear Storage

## Advanced Usage

### Custom Notification

```typescript
import { showLocalNotification } from '@/utils/pushNotifications';

await showLocalNotification('Custom Title', {
  body: 'Custom message',
  icon: '/icons/icon-192x192.png',
  tag: 'custom-notification',
  data: { url: '/custom-page' },
});
```

### Check Online Status

```typescript
import { usePWA } from '@/hooks/usePWA';

function MyComponent() {
  const { isOnline } = usePWA();

  return (
    <div>
      {!isOnline && <Alert>You're offline</Alert>}
    </div>
  );
}
```

### Monitor Queue

```typescript
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

function MyComponent() {
  const { queue, queueCount, processQueue } = useOfflineQueue();

  useEffect(() => {
    console.log(`${queueCount} items in queue`);
  }, [queueCount]);

  return (
    <button onClick={processQueue}>
      Sync Now ({queueCount})
    </button>
  );
}
```

## Production Checklist

- [ ] Icons generated and placed in public/icons/
- [ ] VAPID keys configured in environment
- [ ] Service worker.js copied to public directory
- [ ] Manifest.json updated with your app details
- [ ] App deployed to HTTPS domain
- [ ] Service worker registered successfully
- [ ] Offline mode tested
- [ ] Installation tested on mobile device
- [ ] Push notifications tested
- [ ] Cache clearing tested
- [ ] Background sync verified

## Next Steps

1. **Customize Manifest**: Update app name, colors, icons
2. **Add More Notification Templates**: See `pushNotifications.ts`
3. **Configure Cache Strategy**: Modify `service-worker.js`
4. **Add Backend Push Support**: Implement server-side push
5. **Monitor Performance**: Use Lighthouse PWA audit

## Need Help?

See full documentation: `PWA_IMPLEMENTATION.md`

Common patterns:

- Check examples in components
- Review hook usage
- Test in DevTools Application tab
- Use Lighthouse for audits
