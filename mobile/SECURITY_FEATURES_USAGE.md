# Security Features Usage Examples

## Table of Contents
- [Biometric Authentication](#biometric-authentication)
- [PIN Authentication](#pin-authentication)
- [Secure Storage](#secure-storage)
- [Session Management](#session-management)
- [Sensitive Operations](#sensitive-operations)
- [Device Management](#device-management)

## Biometric Authentication

### Setup in Login Screen

```typescript
import { biometricService } from '@services/biometricService';

// Check if biometric is available
const capabilities = await biometricService.checkBiometricCapabilities();

if (capabilities.isAvailable) {
  // Enable biometric after successful login
  const success = await biometricService.enableBiometric(
    user.email,
    password
  );
  
  if (success) {
    console.log('Biometric authentication enabled');
  }
}
```

### Biometric Login

```typescript
// Authenticate with biometrics
const authenticated = await biometricService.authenticate('Login to continue');

if (authenticated) {
  // Get saved credentials
  const credentials = await biometricService.getCredentials();
  
  if (credentials) {
    // Login with saved credentials
    await login(credentials.email, credentials.password);
  }
}
```

### Disable Biometric

```typescript
await biometricService.disableBiometric();
```

## PIN Authentication

### Setup PIN

```typescript
import { pinService } from '@services/pinService';

// Setup new PIN
const success = await pinService.setupPin('1234');

if (success) {
  console.log('PIN setup successful');
}
```

### Verify PIN

```typescript
const isValid = await pinService.verifyPin(userInputPin);

if (isValid) {
  // PIN is correct
} else {
  // PIN is incorrect or locked out
}
```

### Change PIN

```typescript
const changed = await pinService.changePin('1234', '5678');

if (changed) {
  console.log('PIN changed successfully');
}
```

### Check Lock Status

```typescript
const isLocked = await pinService.isLocked();

if (isLocked) {
  const timeRemaining = await pinService.getLockTimeRemaining();
  console.log(`Locked for ${Math.ceil(timeRemaining / 60000)} more minutes`);
}
```

## Secure Storage

### Store Sensitive Data

```typescript
import { secureStorage } from '@utils/secureStorage';

// Store string
await secureStorage.setItem('api_key', 'secret_key', {
  requireAuthentication: true
});

// Store object
await secureStorage.setObject('user_preferences', {
  theme: 'dark',
  notifications: true
});
```

### Retrieve Sensitive Data

```typescript
// Get string
const apiKey = await secureStorage.getItem('api_key');

// Get object
const preferences = await secureStorage.getObject('user_preferences');
```

### Remove Data

```typescript
await secureStorage.removeItem('api_key');
```

### Clear All Secure Data

```typescript
await secureStorage.clear();
```

## Session Management

### Initialize Session Tracking

```typescript
import { sessionService } from '@services/sessionService';

// In your app root component
useEffect(() => {
  sessionService.initialize(
    // On session timeout
    () => {
      // Redirect to login
      router.replace('/login');
    },
    // On session lock
    () => {
      // Show lock screen
      setIsLocked(true);
    }
  );

  return () => {
    sessionService.destroy();
  };
}, []);
```

### Update Activity

```typescript
// Call this on user interactions
const handleUserAction = async () => {
  await sessionService.updateActivity();
  // Your action logic
};
```

### Lock/Unlock Session

```typescript
// Manually lock session
await sessionService.lockSession();

// Unlock session (requires authentication)
const unlocked = await sessionService.unlockSession();
```

### Update Session Settings

```typescript
// Change timeout to 60 minutes and auto-lock to 15 minutes
await sessionService.updateSettings(60, 15);
```

## Sensitive Operations

### Protect Sensitive Actions

```typescript
import { useSensitiveOperation } from '@hooks/useSensitiveOperation';

function PaymentScreen() {
  const { executeWithAuth, isAuthenticating } = useSensitiveOperation();

  const handlePayment = async () => {
    const result = await executeWithAuth(
      'Process Payment',
      async () => {
        // Your sensitive operation
        return await api.processPayment(paymentData);
      },
      {
        operationDetails: `Payment of $${amount}`,
      }
    );

    if (result) {
      // Payment successful
    }
  };

  return (
    <Button 
      onPress={handlePayment}
      loading={isAuthenticating}
    >
      Pay Now
    </Button>
  );
}
```

### Examples of Sensitive Operations

```typescript
// Change password
await executeWithAuth(
  'Change Password',
  async () => await api.changePassword(newPassword)
);

// Update payment method
await executeWithAuth(
  'Update Payment Method',
  async () => await api.updatePaymentMethod(cardData)
);

// Delete account
await executeWithAuth(
  'Delete Account',
  async () => await api.deleteAccount()
);

// Transfer funds
await executeWithAuth(
  'Transfer Funds',
  async () => await api.transferFunds(recipientId, amount),
  { operationDetails: `Transfer $${amount} to ${recipientName}` }
);
```

## Device Management

### Register Current Device

```typescript
import { deviceFingerprintService } from '@utils/deviceFingerprint';
import { mobileAuthApi } from '@api/mobileAuth';

// Get device info
const deviceInfo = await deviceFingerprintService.getDeviceInfo();

// Register with backend
const response = await mobileAuthApi.registerDevice({
  device_name: deviceInfo.deviceName,
  device_type: deviceInfo.deviceType,
  device_fingerprint: deviceInfo.fingerprint,
  device_model: deviceInfo.deviceModel,
  os_version: deviceInfo.osVersion,
  app_version: deviceInfo.appVersion,
});

console.log('Device ID:', response.data.device_id);
```

### Get All User Devices

```typescript
const devices = await mobileAuthApi.getUserDevices();

devices.data.forEach(device => {
  console.log(`${device.device_name} - ${device.is_trusted ? 'Trusted' : 'Untrusted'}`);
});
```

### Trust a Device

```typescript
await mobileAuthApi.trustDevice(deviceId);
```

### Remove a Device

```typescript
await mobileAuthApi.removeDevice(deviceId);
```

## Complete Example: Secure Profile Update

```typescript
import { useSensitiveOperation } from '@hooks/useSensitiveOperation';
import { mobileAuthApi } from '@api/mobileAuth';

function ProfileUpdateScreen() {
  const { executeWithAuth, isAuthenticating } = useSensitiveOperation();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleUpdateProfile = async () => {
    // Require re-authentication for profile updates
    const result = await executeWithAuth(
      'Update Profile',
      async () => {
        // Update profile
        const response = await api.updateProfile({
          email,
          phone,
        });

        // Log the operation
        await mobileAuthApi.logSensitiveOperation({
          operation_type: 'profile_update',
          operation_details: 'Email and phone updated',
          auth_method: 'biometric',
          auth_success: true,
        });

        return response.data;
      },
      {
        operationDetails: 'Update email and phone number',
      }
    );

    if (result) {
      Alert.alert('Success', 'Profile updated successfully');
    }
  };

  return (
    <View>
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
      />
      <Button
        title="Update Profile"
        onPress={handleUpdateProfile}
        loading={isAuthenticating}
      />
    </View>
  );
}
```

## Security Settings Screen Integration

```typescript
import { SettingsScreen } from '@screens/common/SettingsScreen';

// In your navigation
<Stack.Screen 
  name="settings" 
  component={SettingsScreen}
  options={{ title: 'Security Settings' }}
/>
```

## App-wide Security Wrapper

```typescript
import { AuthWrapper } from '@components/AuthWrapper';

function App() {
  return (
    <AuthWrapper requireAuth={true}>
      <YourAppContent />
    </AuthWrapper>
  );
}
```

This wrapper automatically handles:
- Session initialization
- Session timeout detection
- Auto-lock when backgrounded
- Device registration
- Lock screen display when needed
