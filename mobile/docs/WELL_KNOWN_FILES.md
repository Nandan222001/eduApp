# Well-Known Directory Files for Universal/App Links

This document contains the configuration files needed for Universal Links (iOS) and App Links (Android). These files should be hosted on your web server.

## apple-app-site-association

Host this file at: `https://edutrack.app/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.edutrack.app",
        "paths": [
          "/assignments/*",
          "/courses/*",
          "/children/*",
          "/messages/*",
          "/notifications/*",
          "/profile",
          "/settings",
          "/student/*",
          "/parent/*"
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAMID.com.edutrack.app"]
  }
}
```

**Requirements:**
- Must be served with content-type: `application/json` or `application/pkcs7-mime`
- Must be accessible without authentication
- Replace `TEAMID` with your Apple Developer Team ID
- Must be served over HTTPS

**Testing:**
```bash
# Verify file is accessible
curl https://edutrack.app/.well-known/apple-app-site-association

# Test on iOS Simulator
xcrun simctl openurl booted https://edutrack.app/assignments/123
```

---

## assetlinks.json

Host this file at: `https://edutrack.app/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.edutrack.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_CERT_FINGERPRINT_HERE"
      ]
    }
  }
]
```

**Requirements:**
- Must be served with content-type: `application/json`
- Must be accessible without authentication
- Replace `YOUR_SHA256_CERT_FINGERPRINT_HERE` with your app's signing certificate fingerprint
- Must be served over HTTPS

**Get SHA256 Fingerprint:**
```bash
# Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore
keytool -list -v -keystore /path/to/your/keystore.jks -alias your-key-alias
```

**Testing:**
```bash
# Verify file is accessible
curl https://edutrack.app/.well-known/assetlinks.json

# Test on Android
adb shell am start -a android.intent.action.VIEW -d "https://edutrack.app/assignments/123" com.edutrack.app
```

---

## Web Server Configuration

### Nginx
```nginx
location /.well-known/ {
    default_type application/json;
    add_header Access-Control-Allow-Origin *;
}
```

### Apache
```apache
<Directory "/var/www/html/.well-known">
    Header set Content-Type "application/json"
    Header set Access-Control-Allow-Origin "*"
</Directory>
```

### Express.js
```javascript
app.get('/.well-known/apple-app-site-association', (req, res) => {
  res.type('application/json');
  res.sendFile(path.join(__dirname, '.well-known/apple-app-site-association'));
});

app.get('/.well-known/assetlinks.json', (req, res) => {
  res.type('application/json');
  res.sendFile(path.join(__dirname, '.well-known/assetlinks.json'));
});
```

---

## Deployment Checklist

- [ ] Replace `TEAMID` in apple-app-site-association with your Apple Team ID
- [ ] Replace `YOUR_SHA256_CERT_FINGERPRINT_HERE` in assetlinks.json with your app's fingerprint
- [ ] Create `/.well-known/` directory on your web server
- [ ] Upload both files to the `/.well-known/` directory
- [ ] Verify files are accessible via HTTPS
- [ ] Verify correct content-type headers are set
- [ ] Test Universal Links on iOS device or simulator
- [ ] Test App Links on Android device or emulator
- [ ] Use validation tools to verify configuration

---

## Verification Tools

### iOS
- [Apple Universal Links Validator](https://search.developer.apple.com/appsearch-validation-tool/)
- Branch.io Universal Link Validator

### Android
- [Google Digital Asset Links API](https://developers.google.com/digital-asset-links/tools/generator)
- Android App Links Assistant in Android Studio

---

## Additional Resources

- [iOS Universal Links Documentation](https://developer.apple.com/ios/universal-links/)
- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [Expo Linking Guide](https://docs.expo.dev/guides/linking/)
