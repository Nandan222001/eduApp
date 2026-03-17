# Offline-First Architecture

Complete offline support for the EDU Mobile app with Redux Persist, background sync, and optimistic UI updates.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# The app automatically initializes offline support
# Just start using it!
npm start
```

## 📚 Documentation

- **[Quick Start Guide](OFFLINE_QUICK_START.md)** - Get started in 5 minutes
- **[Architecture Documentation](OFFLINE_ARCHITECTURE.md)** - Complete technical details
- **[Integration Examples](OFFLINE_INTEGRATION_EXAMPLE.md)** - Real-world code examples
- **[Migration Guide](OFFLINE_MIGRATION_GUIDE.md)** - Update existing screens
- **[Implementation Summary](OFFLINE_IMPLEMENTATION_SUMMARY.md)** - What's been built

## ✨ Key Features

### 🌐 Network Awareness

- Real-time connectivity detection
- Automatic online/offline switching
- Visual indicators throughout the app

### 💾 Data Caching

- Profile, Dashboard, Assignments, Grades, Attendance
- Timestamp tracking for data freshness
- Works completely offline with cached data

### 📤 Offline Queue

- Automatic queuing of failed operations
- Supports: Assignment submissions, Attendance check-ins, Profile updates
- Auto-retry with exponential backoff
- Manual sync triggers

### 🔄 Background Sync

- Syncs every 15 minutes when online
- Persists across app restarts
- No user interaction required

### ⚡ Optimistic UI

- Instant feedback on user actions
- Automatic rollback on failure
- Better perceived performance

## 🎯 Usage Examples

### Display Offline Status

```typescript
import { OfflineIndicator } from '@components';

<OfflineIndicator onSyncPress={() => handleSync()} />
```

### Show Cached Data Age

```typescript
import { CachedDataBadge } from '@components';

<CachedDataBadge lastSyncTime={dashboardLastSync} isOnline={isConnected} />
```

### Optimistic Updates

```typescript
import { useOptimisticUpdate } from '@hooks';

const { submitAssignment, isOnline } = useOptimisticUpdate();

await submitAssignment(assignmentId, data);
// UI updates immediately!
```

### Monitor Network

```typescript
import { useNetworkStatus } from '@hooks';

const { isConnected, isInternetReachable, type } = useNetworkStatus();
```

### Access Cached Data

```typescript
import { useAppSelector } from '@store/hooks';

const { profile, assignments, grades } = useAppSelector(state => state.studentData);
// Always available, even offline!
```

## 🏗️ Architecture

```
User Action → Optimistic Update → API Call (if online)
                    ↓                     ↓
             UI updates              Success/Failure
             immediately                   ↓
                                    Update Redux Store
                                           ↓
                                    Persist to Storage

When Offline:
User Action → Optimistic Update → Add to Queue
                    ↓                     ↓
             UI updates          Persist to AsyncStorage
             immediately                  ↓
                              Wait for connectivity
                                          ↓
                              Auto-sync when online
```

## 📦 Components

### UI Components

- `OfflineIndicator` - Shows connection status and queue size
- `CachedDataBadge` - Displays last sync timestamp
- `SyncButton` - Manual sync trigger
- `OfflineQueueStatus` - Detailed queue view
- `OfflineDataRefresher` - Auto-refresh wrapper
- `ScreenLayout` - Screen wrapper with offline indicator

### Hooks

- `useNetworkStatus()` - Network state monitoring
- `useOfflineQueue()` - Access offline queue
- `useOptimisticUpdate()` - Optimistic update helpers

### Redux Slices

- `studentDataSlice` - Cached student data
- `offlineSlice` - Offline state management

### Utilities

- `offlineQueueManager` - Queue management
- `BackgroundSyncService` - Background sync
- `optimisticUpdates` - Helper functions

## 🎨 Example Screens

### Dashboard with Offline Support

See: `src/screens/OfflineSettingsScreen.tsx`

### Form with Optimistic Updates

See: `OFFLINE_INTEGRATION_EXAMPLE.md`

## ⚙️ Configuration

### Sync Interval

Edit `src/utils/backgroundSync.ts`:

```typescript
minimumInterval: 15 * 60, // 15 minutes
```

### Refresh Threshold

Edit `src/utils/optimisticUpdates.ts`:

```typescript
maxAgeMinutes: number = 15; // Refresh after 15 minutes
```

### Retry Count

Edit `src/utils/offlineQueue.ts`:

```typescript
const MAX_RETRIES = 3;
```

## 🧪 Testing

### Test Offline Mode

1. Enable airplane mode
2. Navigate through app
3. Submit forms
4. Verify queue grows
5. Disable airplane mode
6. Watch auto-sync

### Verify Caching

1. Load data while online
2. Go offline
3. Navigate through app
4. Data should still be visible
5. Check timestamps

## 🔧 Troubleshooting

### Queue Not Syncing

- Check network connection
- Verify auto-sync enabled
- Check console logs

### Background Sync Not Working

- Test on physical device (not simulator)
- Check app permissions
- Verify task registration

### Data Not Persisting

- Clear app data
- Reinstall app
- Check AsyncStorage permissions

## 📱 Platform Support

- ✅ iOS (14.0+)
- ✅ Android (API 21+)
- ⚠️ Web (limited - no background sync)

## 🔐 Security

- Sensitive data cleared on logout
- Queue cleared on logout
- Tokens stored in SecureStore
- Data encrypted at rest

## 📊 Performance

- < 100ms offline queue operations
- Instant UI updates with optimistic rendering
- Efficient AsyncStorage usage
- Minimal battery impact

## 🤝 Contributing

When adding new features that require API calls:

1. Create Redux thunk in `studentDataSlice`
2. Add timestamp field for sync tracking
3. Support optimistic updates if applicable
4. Add to offline queue if needed
5. Update documentation

## 📄 License

Same as parent project.

## 🆘 Support

Issues? Check these docs:

1. [Quick Start](OFFLINE_QUICK_START.md)
2. [Architecture](OFFLINE_ARCHITECTURE.md)
3. [Examples](OFFLINE_INTEGRATION_EXAMPLE.md)
4. [Migration](OFFLINE_MIGRATION_GUIDE.md)

## 🎉 What's Next?

The offline-first architecture is production-ready! Key capabilities:

✅ Complete offline functionality  
✅ Background synchronization  
✅ Optimistic UI updates  
✅ Network-aware caching  
✅ Queue management  
✅ Comprehensive UI components  
✅ Developer-friendly hooks  
✅ Full documentation

**Just start using the app - offline support is automatic!**
