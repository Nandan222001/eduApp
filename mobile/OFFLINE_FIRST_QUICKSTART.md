# Offline-First Architecture - Quick Start Guide

## Installation

1. Install dependencies:
```bash
cd mobile
npm install
# or
yarn install
```

2. Update your app.json to enable background fetch:
```json
{
  "expo": {
    "ios": {
      "backgroundModes": ["fetch"]
    },
    "android": {
      "permissions": ["ACCESS_NETWORK_STATE"]
    }
  }
}
```

## Basic Usage

### 1. Using Cached Data in Your Screen

```typescript
import React, { useEffect } from 'react';
import { View, RefreshControl, ScrollView } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchDashboardData } from '../store/slices/dashboardSlice';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { CachedDataBanner } from '../components/CachedDataBanner';

export const MyScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, isLoading, lastUpdated } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    if (!data) {
      dispatch(fetchDashboardData());
    }
  }, [dispatch, data]);

  const handleRefresh = async () => {
    await dispatch(fetchDashboardData()).unwrap();
  };

  return (
    <View>
      <OfflineIndicator />
      <CachedDataBanner lastUpdated={lastUpdated} onRefresh={handleRefresh} />
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Your content here */}
      </ScrollView>
    </View>
  );
};
```

### 2. Adding Sync Status Button

```typescript
import { SyncStatus } from '../components/SyncStatus';

// In your header or navigation
<View style={styles.header}>
  <Text>My App</Text>
  <SyncStatus />
</View>
```

### 3. Manually Queue Requests

```typescript
import { useOfflineQueue } from '../store/hooks';

const MyComponent = () => {
  const { addToQueue, isConnected } = useOfflineQueue();

  const handleSubmit = async (data: any) => {
    if (!isConnected) {
      await addToQueue('/api/v1/student/assignments', 'POST', data);
      Alert.alert('Queued', 'Request will be sent when online');
      return;
    }
    
    // Normal API call
  };
};
```

### 4. Creating a New Cached Slice

```typescript
// src/store/slices/mySlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface MyState {
  data: any | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: MyState = {
  data: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const fetchMyData = createAsyncThunk(
  'my/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await myApi.getData();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const mySlice = createSlice({
  name: 'my',
  initialState,
  reducers: {
    clearMyData: (state) => {
      state.data = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchMyData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMyData } = mySlice.actions;
export default mySlice.reducer;
```

Then add to store:

```typescript
// src/store/index.ts
import myReducer from './slices/mySlice';

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'profile', 'dashboard', 'assignments', 'grades', 'my'], // Add 'my'
};

const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  dashboard: dashboardReducer,
  assignments: assignmentsReducer,
  grades: gradesReducer,
  my: myReducer, // Add your reducer
});
```

## Components Overview

### OfflineIndicator
Shows red banner when offline with pending request count.

**Props**: None (auto-detects state)

### CachedDataBanner
Shows last update time and manual sync button.

**Props**:
- `lastUpdated: number | null` - Timestamp of last data update
- `onRefresh: () => Promise<void>` - Callback to refresh data

### SyncStatus
Modal showing detailed sync information and queue management.

**Props**: None (button to open modal)

## Hook API

### useOfflineQueue()

```typescript
const {
  queue,              // QueuedRequest[]
  queueCount,         // number
  isConnected,        // boolean
  addToQueue,         // (url, method, data?, headers?) => Promise<string>
  processQueue,       // () => Promise<void>
  clearQueue,         // () => Promise<void>
  removeFromQueue,    // (id: string) => Promise<void>
} = useOfflineQueue();
```

## Testing Offline Functionality

### iOS Simulator
1. **Toggle Network**: Hardware → Network Link Conditioner → Enable/Disable
2. **Or**: Device → Trigger network condition

### Android Emulator
1. **Toggle Network**: Extended controls (…) → Cellular → Data status
2. **Or**: Settings → Network & Internet → Toggle

### Physical Device
1. Enable Airplane Mode
2. Perform actions
3. Disable Airplane Mode
4. Verify sync

### Chrome DevTools (for testing logic)
1. Open React Native Debugger
2. Network tab → Toggle "Offline"
3. Test app behavior

## Best Practices

1. **Always show cached data first**
   ```typescript
   if (!data && !isLoading) {
     dispatch(fetchData());
   }
   // Show cached data immediately while loading
   ```

2. **Handle errors gracefully**
   ```typescript
   if (error && !data) {
     // Show error only if no cached data
   }
   ```

3. **Provide manual refresh**
   ```typescript
   <RefreshControl 
     refreshing={isLoading} 
     onRefresh={handleRefresh} 
   />
   ```

4. **Include offline indicators**
   ```typescript
   <OfflineIndicator />
   <CachedDataBanner lastUpdated={lastUpdated} onRefresh={handleRefresh} />
   ```

5. **Queue mutations, not queries**
   - Queue: POST, PUT, PATCH, DELETE
   - Don't queue: GET requests

## Common Patterns

### Optimistic Updates
```typescript
const handleLike = async (postId: number) => {
  // Update UI immediately
  dispatch(updatePostLocally({ id: postId, liked: true }));
  
  // Queue the request
  try {
    await api.likePost(postId);
  } catch (error) {
    // Revert on error
    dispatch(updatePostLocally({ id: postId, liked: false }));
  }
};
```

### Conditional Fetch
```typescript
const handleRefresh = async () => {
  if (!isConnected) {
    Alert.alert('Offline', 'Cannot refresh while offline');
    return;
  }
  await dispatch(fetchData()).unwrap();
};
```

### Cache Expiration
```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

useEffect(() => {
  const isExpired = lastUpdated && (Date.now() - lastUpdated > CACHE_DURATION);
  
  if ((!data || isExpired) && isConnected) {
    dispatch(fetchData());
  }
}, [data, lastUpdated, isConnected]);
```

## Troubleshooting

**Data not persisting?**
- Check if reducer is in whitelist
- Verify AsyncStorage permissions
- Check for serialization errors

**Queue not processing?**
- Ensure device is online
- Check console for errors
- Manually trigger from SyncStatus modal

**Background sync not working?**
- Test on physical device
- Check background app refresh settings
- Verify expo-background-fetch installation

## Additional Resources

- See `mobile/OFFLINE_FIRST_IMPLEMENTATION.md` for detailed documentation
- Check `mobile/src/screens/ExampleIntegrationScreen.tsx` for full example
- Review existing screens for implementation patterns
