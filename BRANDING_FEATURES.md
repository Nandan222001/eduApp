# Extended Branding Features

This document describes the extended branding features implemented for institution customization.

## Features Overview

### 1. Custom Email Domain Support

Institutions can set up custom email domains for sending emails from their own domain using SendGrid integration.

#### API Endpoints

- `POST /branding/institution/{institution_id}/email-domain` - Set up custom email domain
- `POST /branding/institution/{institution_id}/email-domain/verify` - Verify email domain
- `POST /branding/institution/{institution_id}/email-domain/sender` - Create authenticated sender
- `GET /branding/institution/{institution_id}/email-domain/dns` - Get DNS records
- `DELETE /branding/institution/{institution_id}/email-domain` - Delete email domain

#### Features

- Automated DNS record generation
- DKIM and SPF validation
- SendGrid domain whitelabeling integration
- Authenticated sender configuration
- Domain verification status tracking

#### Database Fields

- `custom_email_domain` - The custom domain for sending emails
- `email_domain_verified` - Whether the domain is verified
- `sendgrid_domain_id` - SendGrid domain ID
- `dkim_valid` - DKIM record validation status
- `spf_valid` - SPF record validation status

### 2. Branded Notification Sounds

Institutions can upload custom notification sounds for different notification types.

#### API Endpoints

- `POST /branding/institution/{institution_id}/notification-sound/{notification_type}` - Upload notification sound
- `DELETE /branding/institution/{institution_id}/notification-sound/{notification_type}` - Delete notification sound

#### Features

- MP3 and WAV file support
- Maximum duration: 5 seconds
- Maximum file size: 5MB
- Automatic waveform generation for preview
- Support for notification types: message, assignment, grade, announcement, reminder, achievement, doubt_answered, meeting

#### Database Field

- `branded_notification_sounds` - JSON field mapping notification types to sound configurations
  ```json
  {
    "message": {
      "url": "https://...",
      "s3_key": "...",
      "duration_ms": 1500,
      "waveform": [0.1, 0.3, 0.5, ...],
      "uploaded_at": "2024-03-15T10:00:00"
    }
  }
  ```

### 3. Custom Loading Animations

Institutions can upload custom loading screen animations.

#### API Endpoints

- `POST /branding/institution/{institution_id}/loading-animation` - Upload loading animation

#### Features

- Supported formats: Lottie JSON, GIF, MP4, WebM
- Maximum file size: 10MB
- JSON validation for Lottie files

#### Database Fields

- `loading_screen_animation_url` - URL to the animation file
- `loading_screen_animation_s3_key` - S3 key for the animation file

### 4. Splash Screen Configuration

Institutions can configure custom splash screens.

#### API Endpoints

- `PUT /branding/institution/{institution_id}/splash-screen` - Update splash screen configuration

#### Features

- Configurable background color
- Custom logo URL
- Custom tagline
- Duration control (500ms - 5000ms)
- Fade animation toggle
- Progress bar toggle

#### Database Field

- `splash_screen_config` - JSON field with splash screen settings
  ```json
  {
    "background_color": "#1976d2",
    "logo_url": "https://...",
    "tagline": "Welcome to Institution",
    "duration_ms": 2000,
    "fade_animation": true,
    "show_progress_bar": true
  }
  ```

### 5. Custom Help Documentation

Institutions can provide custom help documentation URL.

#### Database Field

- `custom_help_docs_url` - URL to custom help documentation

### 6. Merchandise Store

Institutions can enable/disable merchandise store.

#### API Endpoint

- `PUT /branding/institution/{institution_id}/custom-settings` - Update custom settings

#### Database Field

- `merchandise_store_enabled` - Boolean flag for merchandise store

## Migration

Run the migration to add new fields:

```bash
alembic upgrade head
```

The migration file `add_extended_branding_fields.py` adds all necessary database columns and indexes.

## Dependencies

New Python dependencies required:
- `httpx` - For async HTTP requests to SendGrid API
- `pydub` - For audio file processing and waveform generation

Make sure to add these to your `pyproject.toml`:

```toml
[tool.poetry.dependencies]
httpx = "^0.24.0"
pydub = "^0.25.1"
```

## Configuration

The following environment variable must be set for email domain features:

```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

## Usage Examples

### Setting up Custom Email Domain

```python
# 1. Set up domain
response = requests.post(
    f"http://api/branding/institution/{institution_id}/email-domain",
    json={"domain": "mail.institution.edu"}
)

# 2. Add DNS records (from response)
dns_records = response.json()["dns_records"]
# Add these records to your DNS provider

# 3. Verify domain
response = requests.post(
    f"http://api/branding/institution/{institution_id}/email-domain/verify"
)

# 4. Create authenticated sender
response = requests.post(
    f"http://api/branding/institution/{institution_id}/email-domain/sender",
    json={
        "from_email": "noreply@mail.institution.edu",
        "from_name": "Institution Name",
        "reply_to": "support@mail.institution.edu"
    }
)
```

### Uploading Notification Sound

```python
with open("notification.mp3", "rb") as f:
    response = requests.post(
        f"http://api/branding/institution/{institution_id}/notification-sound/message",
        files={"file": f}
    )

# Response includes waveform data for visualization
waveform = response.json()["waveform"]
```

### Configuring Splash Screen

```python
response = requests.put(
    f"http://api/branding/institution/{institution_id}/splash-screen",
    json={
        "background_color": "#1976d2",
        "logo_url": "https://cdn.institution.edu/logo.png",
        "tagline": "Welcome to Our Institution",
        "duration_ms": 2000,
        "fade_animation": True,
        "show_progress_bar": True
    }
)
```

## Security Considerations

1. **Email Domain**: Only verified domains can be used to send emails
2. **File Uploads**: All files are validated for type and size before upload
3. **Audio Duration**: Notification sounds are limited to 5 seconds to prevent abuse
4. **S3 Storage**: All files are stored securely in S3 with proper access controls
5. **SendGrid Integration**: API keys are stored securely in environment variables

## Notes

- The `pydub` library requires `ffmpeg` or `libav` to be installed on the system for audio processing
- SendGrid domain verification can take up to 48 hours
- Notification sounds are automatically converted to appropriate formats for different platforms
- Loading animations should be optimized for web delivery before upload
