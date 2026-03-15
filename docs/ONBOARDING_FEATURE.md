# Onboarding Flow Builder

## Overview

The onboarding flow builder allows institutions to create customized, role-specific onboarding experiences for students, parents, and teachers. It supports multiple step types, conditional branching, document uploads, signature collection, and progress tracking.

## Features

### Step Types

1. **Welcome Video**: Display welcome videos with customizable content
2. **Document Upload**: Request and collect specific documents from users
3. **Profile Completion**: Guide users through completing their profile information
4. **Quiz**: Test knowledge or gather information through quizzes
5. **Agreement Signature**: Collect digital signatures for terms, policies, etc.
6. **Tour**: Provide interactive tours of the platform features

### Flow Configuration

- **Role-Specific Flows**: Create different onboarding flows for students, parents, teachers, and admins
- **Grade-Level Targeting**: Customize flows based on student grade levels
- **Conditional Branching**: Show/hide steps based on previous responses
- **Required/Optional Steps**: Mark steps as mandatory or optional
- **Step Ordering**: Define the sequence of onboarding steps

### Conditional Logic

Supports various conditional logic types:

- `response_equals`: Show step if a previous response equals a specific value
- `response_contains`: Show step if a previous response contains a specific value
- `all`: Show step if all conditions are met
- `any`: Show step if any condition is met

Example conditional logic:
```json
{
  "type": "response_equals",
  "step_id": 5,
  "value": "yes"
}
```

### Progress Tracking

- Track completion status for each step
- Monitor overall onboarding progress
- Calculate completion percentage
- Track start and completion timestamps
- Support for skipping optional steps

## API Endpoints

### Flow Management (Admin)

#### Create Onboarding Flow
```http
POST /api/v1/onboarding/flows
Content-Type: application/json

{
  "name": "Student Onboarding 2024",
  "description": "Onboarding flow for new students",
  "role_specific": "student",
  "grade_level": "Grade 9",
  "is_active": true,
  "is_default": false,
  "steps": [
    {
      "step_order": 1,
      "step_type": "welcome_video",
      "title": "Welcome to Our School",
      "description": "Watch our welcome video",
      "step_content": {
        "video_url": "https://example.com/welcome.mp4",
        "duration": "5:30"
      },
      "is_required": true
    }
  ]
}
```

#### Get All Flows
```http
GET /api/v1/onboarding/flows?role_specific=student&is_active=true
```

#### Update Flow
```http
PUT /api/v1/onboarding/flows/{flow_id}
Content-Type: application/json

{
  "name": "Updated Flow Name",
  "is_active": false
}
```

#### Delete Flow
```http
DELETE /api/v1/onboarding/flows/{flow_id}
```

### Step Management

#### Add Step to Flow
```http
POST /api/v1/onboarding/flows/{flow_id}/steps
Content-Type: application/json

{
  "step_order": 2,
  "step_type": "document_upload",
  "title": "Upload Required Documents",
  "description": "Please upload your ID proof and address proof",
  "step_content": {
    "required_documents": [
      {"type": "id_proof", "label": "ID Proof"},
      {"type": "address_proof", "label": "Address Proof"}
    ],
    "max_file_size": 5242880,
    "allowed_types": ["pdf", "jpg", "png"]
  },
  "is_required": true
}
```

#### Update Step
```http
PUT /api/v1/onboarding/steps/{step_id}
Content-Type: application/json

{
  "title": "Updated Step Title",
  "is_required": false
}
```

#### Bulk Update Steps (Drag-Drop Builder)
```http
PUT /api/v1/onboarding/flows/{flow_id}/steps/bulk
Content-Type: application/json

{
  "steps": [
    {
      "step_order": 1,
      "step_type": "welcome_video",
      "title": "Welcome",
      ...
    },
    {
      "step_order": 2,
      "step_type": "profile_completion",
      "title": "Complete Profile",
      ...
    }
  ]
}
```

### User Onboarding

#### Get My Onboarding Flow
```http
GET /api/v1/onboarding/my-flow
```

#### Start Onboarding
```http
POST /api/v1/onboarding/progress/start
Content-Type: application/json

{
  "flow_id": 1
}
```

#### Get My Progress
```http
GET /api/v1/onboarding/progress?flow_id=1
```

#### Get Progress Summary
```http
GET /api/v1/onboarding/progress/summary?flow_id=1
```

Response:
```json
{
  "flow_id": 1,
  "flow_name": "Student Onboarding 2024",
  "total_steps": 5,
  "completed_steps": 3,
  "current_step_order": 3,
  "is_completed": false,
  "completion_percentage": 60.0,
  "started_at": "2024-01-15T10:00:00Z",
  "completed_at": null
}
```

#### Get Next Step
```http
GET /api/v1/onboarding/next-step?flow_id=1
```

#### Complete Step
```http
POST /api/v1/onboarding/steps/{step_id}/complete
Content-Type: application/json

{
  "response_data": {
    "answer": "yes",
    "additional_info": "some data"
  },
  "is_skipped": false
}
```

### Document Management

#### Upload Document
```http
POST /api/v1/onboarding/documents
Content-Type: application/json

{
  "document_type": "id_proof",
  "document_name": "passport.pdf",
  "file_url": "https://storage.example.com/docs/passport.pdf",
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "step_progress_id": 123
}
```

#### Get My Documents
```http
GET /api/v1/onboarding/documents
```

#### Verify Document (Admin)
```http
POST /api/v1/onboarding/documents/{document_id}/verify
```

### Signature Collection

#### Create Signature
```http
POST /api/v1/onboarding/signatures
Content-Type: application/json

{
  "agreement_type": "terms_and_conditions",
  "agreement_text": "I agree to the terms and conditions...",
  "signature_data": "data:image/png;base64,...",
  "step_progress_id": 123
}
```

#### Get My Signatures
```http
GET /api/v1/onboarding/signatures
```

## Step Content Examples

### Welcome Video Step
```json
{
  "step_type": "welcome_video",
  "step_content": {
    "video_url": "https://example.com/welcome.mp4",
    "thumbnail_url": "https://example.com/thumb.jpg",
    "duration": "5:30",
    "transcript_url": "https://example.com/transcript.txt"
  }
}
```

### Document Upload Step
```json
{
  "step_type": "document_upload",
  "step_content": {
    "required_documents": [
      {
        "type": "birth_certificate",
        "label": "Birth Certificate",
        "description": "Upload a copy of your birth certificate"
      },
      {
        "type": "photo",
        "label": "Passport Photo",
        "description": "Recent passport-sized photograph"
      }
    ],
    "max_file_size": 5242880,
    "allowed_types": ["pdf", "jpg", "png", "jpeg"]
  }
}
```

### Profile Completion Step
```json
{
  "step_type": "profile_completion",
  "step_content": {
    "fields": [
      {
        "name": "date_of_birth",
        "label": "Date of Birth",
        "type": "date",
        "required": true
      },
      {
        "name": "emergency_contact",
        "label": "Emergency Contact",
        "type": "text",
        "required": true
      }
    ]
  }
}
```

### Quiz Step
```json
{
  "step_type": "quiz",
  "step_content": {
    "questions": [
      {
        "id": "q1",
        "text": "What grade are you in?",
        "type": "single_choice",
        "options": ["Grade 9", "Grade 10", "Grade 11", "Grade 12"]
      },
      {
        "id": "q2",
        "text": "What subjects are you interested in?",
        "type": "multiple_choice",
        "options": ["Math", "Science", "English", "History"]
      }
    ]
  }
}
```

### Agreement Signature Step
```json
{
  "step_type": "agreement_signature",
  "step_content": {
    "agreement_title": "Student Code of Conduct",
    "agreement_text": "Full text of the agreement...",
    "agreement_url": "https://example.com/code-of-conduct.pdf",
    "signature_required": true
  }
}
```

### Tour Step
```json
{
  "step_type": "tour",
  "step_content": {
    "tour_steps": [
      {
        "title": "Dashboard",
        "description": "This is your main dashboard",
        "target_element": "#dashboard",
        "position": "bottom"
      },
      {
        "title": "Assignments",
        "description": "View and submit assignments here",
        "target_element": "#assignments",
        "position": "right"
      }
    ]
  }
}
```

## Database Schema

### Tables

1. **onboarding_flows**: Main flow configuration
2. **onboarding_steps**: Individual steps in a flow
3. **onboarding_progress**: User's progress through a flow
4. **onboarding_step_progress**: User's progress on individual steps
5. **onboarding_documents**: Documents uploaded during onboarding
6. **onboarding_signatures**: Digital signatures collected

### Relationships

- One flow has many steps
- One flow has many progress records
- One progress has many step progress records
- Steps can have conditional logic referencing other steps
- Documents and signatures can be linked to step progress

## Implementation Notes

### Conditional Branching

The system evaluates conditional logic when determining the next step. Steps with conditions that evaluate to `false` are automatically skipped.

### Progress Calculation

Progress percentage is calculated as:
```
(completed_steps + skipped_steps) / total_steps * 100
```

### Role Detection

The system automatically detects the user's role based on their role slug and matches them with the appropriate flow. The matching priority is:

1. Role-specific + Grade-level match
2. Role-specific + No grade level
3. Default flow (is_default=true)

### Document Verification

Documents uploaded during onboarding can be verified by administrators. The verification status, verifier, and timestamp are tracked.

### Signature Collection

Signatures are stored with metadata including:
- IP address
- User agent
- Timestamp
- Agreement text (for audit trail)

## Security Considerations

- All endpoints require authentication
- Flow management endpoints should be restricted to admins
- Document URLs should use secure storage with access controls
- Signature data should be encrypted at rest
- IP addresses and user agents are logged for audit purposes
