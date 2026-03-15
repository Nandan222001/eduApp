# Onboarding System

A comprehensive onboarding flow designer and wizard system for creating role-based user onboarding experiences.

## Features

### Admin Onboarding Designer (`AdminOnboardingDesigner.tsx`)

Visual flow builder for creating onboarding experiences with:

- **Drag & Drop Step Components**: 7 different step types
  - Welcome Message
  - Video
  - Form
  - Document Upload
  - Signature
  - Quiz
  - Platform Tour

- **Step Configuration Panels**: Edit content, validation rules, and settings for each step

- **Conditional Logic Builder**: Create dynamic flows based on user responses
  - Example: If grade=9, show high school orientation
  - Example: If parent has multiple children, show sibling linking

- **Preview Mode**: Test the onboarding flow before publishing

- **Role Selector**: Toggle between Student/Parent/Teacher flows

- **Analytics Dashboard**: Track completion rates, drop-off points, and time metrics

### Onboarding Wizard (`OnboardingWizard.tsx`)

User-facing onboarding experience with:

- **Progress Stepper**: Visual progress through steps
- **Step-by-Step Navigation**: Back/Next/Skip controls
- **Video Player**: Embedded video playback with progress tracking
- **Form Builders**: Dynamic forms with validation
- **Document Uploader**: Drag & drop file uploads
- **Signature Pad**: Canvas-based signature capture
- **Interactive Platform Tour**: Tooltips highlighting features
- **Completion Celebration**: Confetti animation on completion

### Analytics Tracking

Automatically tracks:

- Step completion rates
- Drop-off points at each step
- Average time per step
- Overall completion rate
- User journey over time

## Usage

### Creating an Onboarding Flow

```tsx
import { AdminOnboardingDesigner } from '@/pages/AdminOnboardingDesigner';

// Navigate to /admin/onboarding-designer
// Select role (Student/Parent/Teacher)
// Add steps from the left panel
// Configure each step
// Add conditional logic (optional)
// Preview the flow
// Save and activate
```

### Showing Onboarding to Users

```tsx
import { OnboardingWizard } from '@/components/onboarding';
import { useOnboarding } from '@/hooks/useOnboarding';

function MyComponent() {
  const { currentFlow, shouldShowOnboarding } = useOnboarding(userId, userRole);

  if (shouldShowOnboarding()) {
    return (
      <OnboardingWizard
        flow={currentFlow}
        userId={userId}
        onComplete={() => console.log('Onboarding completed')}
        onExit={() => console.log('Onboarding exited')}
      />
    );
  }

  return <MainApp />;
}
```

### Auto-triggering Onboarding

```tsx
import { OnboardingTrigger } from '@/components/onboarding/OnboardingTrigger';

function App() {
  return (
    <>
      <OnboardingTrigger
        userId={user.id}
        role={user.role}
        autoStart={true}
        onComplete={() => {
          // Handle completion
        }}
      />
      <MainApp />
    </>
  );
}
```

## Step Types

### 1. Welcome Message

- Display welcome text
- Custom HTML support
- Brand-aligned design

### 2. Video

- Embed video content
- Track watch progress
- Require completion option

### 3. Form

- Dynamic field types (text, email, select, checkbox, radio, etc.)
- Validation rules
- Required/optional fields

### 4. Document Upload

- Drag & drop interface
- File type restrictions
- Size limits
- Multiple file support

### 5. Signature

- Canvas-based drawing
- Touch and mouse support
- Clear/redo functionality

### 6. Quiz

- Multiple choice questions
- True/false questions
- Passing score requirements
- Immediate feedback
- Retake option

### 7. Platform Tour

- Interactive feature highlights
- Step-by-step walkthrough
- Position indicators
- Visual cues

## Conditional Logic

Create dynamic flows based on user responses:

```typescript
{
  field: 'grade',
  operator: 'equals',
  value: '9',
  nextStepId: 'high-school-orientation'
}
```

Supported operators:

- `equals`
- `not_equals`
- `contains`
- `greater_than`
- `less_than`

## Analytics Metrics

Track the following metrics for each flow:

- **Total Users**: Number of users who started
- **Completion Rate**: Percentage who completed
- **Average Time**: Time to complete the flow
- **Step Analytics**: Per-step metrics
  - Completion rate
  - Drop-off rate
  - Average time spent
- **Time Series Data**: Trends over time

## API Integration

The system integrates with the backend through:

```typescript
// API endpoints
GET    /api/v1/onboarding/flows?role={role}
GET    /api/v1/onboarding/flows/{flowId}
POST   /api/v1/onboarding/flows
PUT    /api/v1/onboarding/flows/{flowId}
DELETE /api/v1/onboarding/flows/{flowId}

GET    /api/v1/onboarding/progress/{userId}?flowId={flowId}
PUT    /api/v1/onboarding/progress/{progressId}
POST   /api/v1/onboarding/progress/{progressId}/steps/{stepId}/complete
POST   /api/v1/onboarding/progress/{progressId}/steps/{stepId}/skip

GET    /api/v1/onboarding/analytics/{flowId}
POST   /api/v1/onboarding/track/step-view
POST   /api/v1/onboarding/track/step-time
```

## Sample Data

Sample flows are available in `frontend/src/data/sampleOnboardingFlows.ts`:

- Student Onboarding Flow
- Parent Onboarding Flow
- Teacher Onboarding Flow

## Best Practices

1. **Keep flows short**: 5-7 steps maximum
2. **Make critical steps required**: Only require essential information
3. **Use conditional logic**: Personalize based on user responses
4. **Test thoroughly**: Use preview mode before publishing
5. **Monitor analytics**: Track drop-off points and optimize
6. **Provide skip options**: Allow users to skip non-critical steps
7. **Celebrate completion**: Use the confetti animation
8. **Mobile-friendly**: All components are responsive

## Components Structure

```
onboarding/
├── OnboardingWizard.tsx          # Main wizard component
├── CompletionCelebration.tsx     # Completion screen
├── OnboardingTrigger.tsx         # Auto-trigger helper
├── steps/
│   ├── WelcomeStep.tsx
│   ├── VideoStep.tsx
│   ├── FormStep.tsx
│   ├── DocumentUploadStep.tsx
│   ├── SignatureStep.tsx
│   ├── QuizStep.tsx
│   └── PlatformTourStep.tsx
└── designer/
    ├── StepConfigPanel.tsx
    ├── ConditionalLogicBuilder.tsx
    ├── FlowPreview.tsx
    └── OnboardingAnalytics.tsx
```

## TypeScript Types

All types are defined in `frontend/src/types/onboarding.ts`:

- `OnboardingFlow`
- `OnboardingStep`
- `StepType`
- `UserRole`
- `ConditionalRule`
- `FormField`
- `QuizQuestion`
- `TourHighlight`
- `OnboardingProgress`
- `OnboardingAnalytics`
