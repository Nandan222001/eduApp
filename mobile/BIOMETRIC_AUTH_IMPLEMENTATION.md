# Biometric Authentication & Secure Storage Implementation

## Overview

This implementation provides comprehensive mobile security features including:

- **Biometric Authentication** (Face ID/Touch ID)
- **PIN Code Authentication**
- **Secure Token Storage** with encryption
- **Device Fingerprinting** for security monitoring
- **Session Timeout** with automatic lock
- **Auto-lock** after background time
- **Re-authentication** for sensitive operations
- **Security Audit Logging** on backend

## Features Implemented

### 1. Biometric Authentication

**Location**: `mobile/src/services/biometricService.ts`

Features:

- Face ID/Touch ID detection and setup
- Credential encryption using expo-secure-store
- Fallback to password authentication
- Biometric login toggle in settings

Usage:

```typescript
import { biometricService } from '@services/biometricService';

// Check capabilities
const capabilities = await biometricService.checkBiometricCapabilities();

// Enable biometric login
await biometricService.enableBiometric(email, password);

// Authenticate
const success = await biometricService.authenticate('Login');
```

### 2. Secure Storage

**Location**: `mobile/src/utils/secureStorage.ts`

Features:

- Uses expo-secure-store for sensitive data
- Encryption at rest
- Keychain/Keystore integration
- Biometric-protected storage on Android

Usage:

```typescript
import { secureStorage } from '@utils/secureStorage';

// Store encrypted data
await secureStorage.setItem('key', 'value', { requireAuthentication: true });

// Retrieve encrypted data
const value = await secureStorage.getItem('key');
```

### 3. Device Fingerprinting

**Location**: `mobile/src/utils/deviceFingerprint.ts`

Features:

- Unique device identification
- Device info collection (model, OS, version)
- Persistent fingerprint across app sessions
- Security monitoring

Usage:

```typescript
import { deviceFingerprintService } from '@utils/deviceFingerprint';

// Get device fingerprint
const fingerprint = await deviceFingerprintService.getOrCreateFingerprint();

// Get full device info
const deviceInfo = await deviceFingerprintService.getDeviceInfo();
```

### 4. PIN Code Authentication

**Location**: `mobile/src/services/pinService.ts`

Features:

- 4-6 digit PIN setup
- PIN hashing for security
- Failed attempt tracking
- Auto-lockout after 5 failed attempts
- 30-minute lockout period

Usage:

```typescript
import { pinService } from '@services/pinService';

// Setup PIN
await pinService.setupPin('1234');

// Verify PIN
const valid = await pinService.verifyPin('1234');

// Change PIN
await pinService.changePin('1234', '5678');
```

### 5. Session Management

**Location**: `mobile/src/services/sessionService.ts`

Features:

- Configurable session timeout (5-1440 minutes)
- Auto-lock after background time (1-60 minutes)
- Session activity tracking
- Automatic re-authentication prompts

Usage:

```typescript
import { sessionService } from '@services/sessionService';

// Initialize session tracking
await sessionService.initialize(onTimeout, onLock);

// Update activity
await sessionService.updateActivity();

// Lock session
await sessionService.lockSession();

// Unlock session
await sessionService.unlockSession();
```

### 6. Sensitive Operations

**Location**: `mobile/src/hooks/useSensitiveOperation.ts`

Features:

- Re-authentication for sensitive actions
- Operation logging
- Configurable authentication requirements

Usage:

```typescript
import { useSensitiveOperation } from '@hooks/useSensitiveOperation';

const { executeWithAuth, isAuthenticating } = useSensitiveOperation();

// Execute sensitive operation
const result = await executeWithAuth(
  'Change Password',
  async () => {
    // Your sensitive operation here
    return await api.changePassword(newPassword);
  },
  {
    operationDetails: 'Password update',
  }
);
```

## Backend Implementation

### Models

**Location**: `src/models/mobile_auth.py`

Models:

- `MobileAuthEvent` - Authentication event logging
- `BiometricSession` - Active biometric sessions
- `SensitiveOperationLog` - Sensitive operation tracking
- `PinAttempt` - PIN attempt tracking

**Location**: `src/models/user_settings.py` (enhanced)

Added fields:

- `biometric_enabled`
- `pin_enabled`
- `pin_hash`
- `session_timeout_minutes`
- `auto_lock_minutes`
- `require_biometric_for_sensitive`

Enhanced `UserDevice`:

- `device_fingerprint`
- `device_model`
- `os_version`
- `app_version`
- `is_trusted`
- `biometric_enabled`
- `biometric_type`

### API Endpoints

**Location**: `src/api/v1/mobile_auth.py`

Endpoints:

#### Biometric

- `POST /mobile-auth/biometric/setup` - Enable/disable biometric
- `GET /mobile-auth/security-settings` - Get security settings
- `PUT /mobile-auth/security-settings` - Update security settings

#### Device Management

- `POST /mobile-auth/device/register` - Register device
- `GET /mobile-auth/devices` - List user devices
- `DELETE /mobile-auth/devices/{id}` - Remove device
- `POST /mobile-auth/devices/{id}/trust` - Mark device as trusted

#### PIN

- `POST /mobile-auth/pin/setup` - Setup/change PIN
- `POST /mobile-auth/pin/verify` - Verify PIN

#### Audit

- `POST /mobile-auth/sensitive-operation/verify` - Log sensitive operation
- `GET /mobile-auth/auth-events` - Get authentication history

## Screens

### Settings Screen

**Location**: `mobile/src/screens/common/SettingsScreen.tsx`

Features:

- Biometric toggle
- PIN setup link
- Session timeout configuration
- Auto-lock configuration
- Device management
- Auth history

### PIN Setup Screen

**Location**: `mobile/src/screens/common/PinSetupScreen.tsx`

Features:

- PIN creation
- PIN change
- PIN disable
- Security info

### Device Management Screen

**Location**: `mobile/src/screens/common/DeviceManagementScreen.tsx`

Features:

- List all devices
- Device details (model, OS, last active)
- Trust/untrust devices
- Remove devices

### Auth History Screen

**Location**: `mobile/src/screens/common/AuthHistoryScreen.tsx`

Features:

- Authentication event list
- Event details (type, method, success/failure)
- IP address and location
- Timestamp

### Session Lock Screen

**Location**: `mobile/src/screens/common/SessionLockScreen.tsx`

Features:

- Biometric unlock
- PIN unlock
- Fallback authentication

## Security Best Practices

1. **Never store passwords in plain text**
   - Always use secure storage with encryption
   - Hash PINs before storage

2. **Implement rate limiting**
   - PIN attempts limited to 5 per 15 minutes
   - 30-minute lockout after max attempts

3. **Session security**
   - Automatic timeout after inactivity
   - Auto-lock when app backgrounds
   - Re-authentication for sensitive operations

4. **Device tracking**
   - Unique fingerprint per device
   - Trust-based device management
   - Audit logging for all auth events

5. **Biometric security**
   - Fallback to password always available
   - Credentials encrypted with biometric keys
   - Platform-specific implementations (iOS/Android)

## Configuration

### Session Timeout Options

- 15 minutes
- 30 minutes (default)
- 60 minutes
- 120 minutes

### Auto-Lock Options

- 1 minute
- 5 minutes (default)
- 15 minutes
- 30 minutes

## Database Migration

Run the migration to add mobile auth tables:

```bash
alembic upgrade head
```

Migration file: `alembic/versions/add_mobile_auth_security.py`

## Testing Checklist

- [ ] Biometric setup and login
- [ ] PIN setup and verification
- [ ] Session timeout triggers lock
- [ ] Auto-lock after backgrounding
- [ ] Sensitive operation re-auth
- [ ] Device registration
- [ ] Device removal
- [ ] Auth event logging
- [ ] Failed attempt lockout
- [ ] Settings persistence

## Dependencies

Mobile (already installed):

- expo-local-authentication
- expo-secure-store
- expo-device

Backend:

- passlib (for PIN hashing)
- sqlalchemy
- fastapi

## Security Considerations

1. **Data at Rest**: All sensitive data encrypted using platform keychain/keystore
2. **Data in Transit**: All API calls over HTTPS
3. **Authentication**: Multi-factor with biometric + PIN options
4. **Session Management**: Automatic timeout and lock mechanisms
5. **Audit Trail**: Complete logging of authentication events
6. **Device Management**: User control over trusted devices
7. **Rate Limiting**: Protection against brute force attacks

## Future Enhancements

- [ ] WebAuthn/FIDO2 support
- [ ] Passwordless authentication
- [ ] Risk-based authentication
- [ ] Geolocation-based security
- [ ] Device reputation scoring
- [ ] Anomaly detection
- [ ] Push notification for suspicious activity
