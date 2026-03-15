export type UserRole = 'student' | 'parent' | 'teacher';

export type StepType =
  | 'welcome'
  | 'video'
  | 'form'
  | 'document_upload'
  | 'signature'
  | 'quiz'
  | 'platform_tour';

export interface ConditionalRule {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
  nextStepId: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'number' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface TourHighlight {
  id: string;
  selector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface OnboardingStep {
  id: string;
  type: StepType;
  title: string;
  description?: string;
  order: number;
  config: {
    message?: string;
    videoUrl?: string;
    videoTitle?: string;
    formFields?: FormField[];
    documentType?: string;
    documentDescription?: string;
    acceptedFileTypes?: string[];
    maxFileSize?: number;
    signatureLabel?: string;
    signatureRequired?: boolean;
    questions?: QuizQuestion[];
    passingScore?: number;
    tourHighlights?: TourHighlight[];
    customHtml?: string;
  };
  conditionalRules?: ConditionalRule[];
  required: boolean;
}

export interface OnboardingFlow {
  id: string;
  role: UserRole;
  title: string;
  description: string;
  steps: OnboardingStep[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface StepProgress {
  stepId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  timeSpent?: number;
  data?: Record<string, unknown>;
}

export interface OnboardingProgress {
  id: string;
  userId: string;
  flowId: string;
  role: UserRole;
  currentStepId: string;
  stepProgress: StepProgress[];
  overallProgress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt: string;
  completedAt?: string;
  totalTimeSpent: number;
}

export interface OnboardingAnalytics {
  flowId: string;
  role: UserRole;
  totalUsers: number;
  completedUsers: number;
  completionRate: number;
  averageTimeToComplete: number;
  stepAnalytics: {
    stepId: string;
    stepTitle: string;
    completionRate: number;
    dropOffRate: number;
    averageTimeSpent: number;
    totalCompletions: number;
    totalDropOffs: number;
  }[];
  timeSeriesData: {
    date: string;
    started: number;
    completed: number;
    dropped: number;
  }[];
}

export interface FlowDesignerState {
  selectedStep: OnboardingStep | null;
  previewMode: boolean;
  selectedRole: UserRole;
}
