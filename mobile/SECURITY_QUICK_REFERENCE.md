# Security Features Quick Reference

## 🔐 Authentication Methods

| Method        | Location                     | Key Functions                                                                               |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| **Biometric** | `@services/biometricService` | `checkBiometricCapabilities()`, `authenticate()`, `enableBiometric()`, `disableBiometric()` |
| **PIN**       | `@services/pinService`       | `setupPin()`, `verifyPin()`, `changePin()`, `disablePin()`                                  |
| **Session**   | `@services/sessionService`   | `initialize()`, `lockSession()`, `unlockSession()`, `updateActivity()`                      |

## 📱 Mobile Services

### Biometric Service

```typescript
import { biometricService } from '@services/biometricService';

// Check if available
const caps = await biometricService.checkBiometricCapabilities();
// caps.isAvailable, caps.biometricType

// Enable
await biometricService.enableBiometric(email, password);

// Authenticate
const success = await biometricService.authenticate('Login');
```

### PIN Service

```typescript
import { pinService } from '@services/pinService';

// Setup 4-6 digit PIN
await pinService.setupPin('1234');

// Verify
const valid = await pinService.verifyPin('1234');

// Check if locked
const locked = await pinService.isLocked();
```

### Session Service

```typescript
import { sessionService } from '@services/sessionService';

// Initialize with callbacks
await sessionService.initialize(onTimeout, onLock);

// Update on user activity
await sessionService.updateActivity();

// Manual lock/unlock
await sessionService.lockSession();
await sessionService.unlockSession();
```

## 🔒 Secure Storage

```typescript
import { secureStorage } from '@utils/secureStorage';

// Store (encrypted)
await secureStorage.setItem('key', 'value', { requireAuthentication: true });

// Retrieve
const value = await secureStorage.getItem('key');

// Store object
await secureStorage.setObject('user', { id: 1, name: 'John' });

// Get object
const user = await secureStorage.getObject('user');
```

## 📱 Device Fingerprinting

```typescript
import { deviceFingerprintService } from '@utils/deviceFingerprint';

// Get fingerprint
const fingerprint = await deviceFingerprintService.getOrCreateFingerprint();

// Get full device info
const info = await deviceFingerprintService.getDeviceInfo();
// info.fingerprint, info.deviceName, info.deviceType, etc.
```

## 🛡️ Sensitive Operations Hook

```typescript
import { useSensitiveOperation } from '@hooks/useSensitiveOperation';

const { executeWithAuth, isAuthenticating } = useSensitiveOperation();

// Wrap sensitive operations
const result = await executeWithAuth(
  'Operation Name',
  async () => {
    // Your sensitive code
    return await api.doSomething();
  },
  { operationDetails: 'Optional details' }
);
```

## 🌐 Backend API Endpoints

### Biometric

- `POST /mobile-auth/biometric/setup` - Enable/disable
- `GET /mobile-auth/security-settings` - Get settings
- `PUT /mobile-auth/security-settings` - Update settings

### Device

- `POST /mobile-auth/device/register` - Register device
- `GET /mobile-auth/devices` - List devices
- `DELETE /mobile-auth/devices/{id}` - Remove device
- `POST /mobile-auth/devices/{id}/trust` - Trust device

### PIN

- `POST /mobile-auth/pin/setup` - Setup PIN
- `POST /mobile-auth/pin/verify` - Verify PIN

### Audit

- `POST /mobile-auth/sensitive-operation/verify` - Log operation
- `GET /mobile-auth/auth-events` - Get history

## 📊 API Client

```typescript
import { mobileAuthApi } from '@api/mobileAuth';

// Setup biometric
await mobileAuthApi.setupBiometric({
  enabled: true,
  biometric_type: 'Face ID',
  device_id: 123,
  device_fingerprint: 'abc123',
});

// Register device
await mobileAuthApi.registerDevice({
  device_name: 'iPhone 13',
  device_type: 'phone',
  device_fingerprint: 'abc123',
  device_model: 'iPhone 13 Pro',
  os_version: '15.0',
  app_version: '1.0.0',
});

// Get security settings
const settings = await mobileAuthApi.getSecuritySettings();

// Update settings
await mobileAuthApi.updateSecuritySettings({
  session_timeout_minutes: 30,
  auto_lock_minutes: 5,
  require_biometric_for_sensitive: true,
});

// Get devices
const devices = await mobileAuthApi.getUserDevices();

// Get auth history
const events = await mobileAuthApi.getAuthEvents(50);
```

## 🖼️ UI Screens

| Screen       | Route                    | Component                |
| ------------ | ------------------------ | ------------------------ |
| Settings     | `/settings`              | `SettingsScreen`         |
| PIN Setup    | `/settings/pin-setup`    | `PinSetupScreen`         |
| Devices      | `/settings/devices`      | `DeviceManagementScreen` |
| Auth History | `/settings/auth-history` | `AuthHistoryScreen`      |
| Session Lock | N/A (Overlay)            | `SessionLockScreen`      |

## ⚙️ Configuration Options

### Session Timeout (minutes)

- 15, 30 (default), 60, 120

### Auto-Lock (minutes)

- 1, 5 (default), 15, 30

### PIN Length

- 4-6 digits

### PIN Lockout

- Max attempts: 5
- Lockout duration: 30 minutes
- Attempt window: 15 minutes

## 🔑 Storage Keys

```typescript
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@edu_auth_token',
  REFRESH_TOKEN: '@edu_refresh_token',
  USER_DATA: '@edu_user_data',
  BIOMETRIC_ENABLED: '@edu_biometric_enabled',
  BIOMETRIC_CREDENTIALS: '@edu_biometric_credentials',
  PIN_ENABLED: '@edu_pin_enabled',
  PIN_HASH: '@edu_pin_hash',
  DEVICE_FINGERPRINT: '@edu_device_fingerprint',
  SESSION_DATA: '@edu_session_data',
  SECURITY_SETTINGS: '@edu_security_settings',
};
```

## 🗄️ Database Models

### Backend Models

- `MobileAuthEvent` - Auth event logging
- `BiometricSession` - Active sessions
- `SensitiveOperationLog` - Sensitive ops
- `PinAttempt` - PIN attempts
- `UserSettings` - Enhanced with security fields
- `UserDevice` - Enhanced with fingerprinting

## 🚀 Quick Setup Checklist

### Mobile App

- [x] expo-local-authentication installed
- [x] expo-secure-store installed
- [x] expo-device installed
- [ ] Import services in app root
- [ ] Wrap app with `AuthWrapper`
- [ ] Add security screens to navigation
- [ ] Initialize session service

### Backend

- [ ] Run database migration
- [ ] Test API endpoints
- [ ] Configure security settings defaults
- [ ] Set up monitoring for auth events

## 📝 Common Tasks

### Enable Biometric Login

1. User logs in successfully
2. Check if biometric available
3. Prompt to enable biometric
4. Save encrypted credentials
5. Sync with backend

### Handle Session Timeout

1. User inactive for configured time
2. Session service triggers timeout
3. Lock session or logout
4. Show lock screen or login

### Verify Sensitive Operation

1. User attempts sensitive action
2. Check if re-auth required
3. Prompt for biometric/PIN
4. Execute operation
5. Log to backend

### View Auth History

1. Navigate to Auth History screen
2. Load events from backend
3. Display with filters
4. Show details on tap

## 🔧 Troubleshooting

### Biometric not working

- Check device has biometric hardware
- Verify user enrolled biometric
- Check permissions
- Test on real device (not simulator)

### PIN lockout

- Wait 30 minutes
- Or clear app data (dev only)
- Check `pinService.isLocked()`

### Session keeps locking

- Adjust timeout settings
- Check activity updates being called
- Verify background detection working

### Device not registering

- Check network connection
- Verify API endpoint available
- Check device info collection
- Test fingerprint generation
