export interface ScannedPage {
  id: string;
  imageUrl: string;
  imageData: string;
  thumbnail: string;
  pageNumber: number;
  timestamp: Date;
}

export interface QuestionResult {
  questionNumber: number;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  partialCredit?: number;
  maxPoints: number;
  earnedPoints: number;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface MistakeAnalysis {
  questionNumber: number;
  mistakeType: string;
  explanation: string;
  conceptsToReview: string[];
  videoLinks?: ResourceLink[];
  practiceLinks?: ResourceLink[];
  similarQuestions?: string[];
}

export interface ResourceLink {
  title: string;
  url: string;
  type: 'video' | 'practice' | 'article' | 'tutorial';
  duration?: string;
  platform?: string;
}

export interface HomeworkScanResult {
  id: string;
  studentId: number;
  subject: string;
  assignmentTitle?: string;
  scanDate: Date;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  partiallyCorrect: number;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  grade?: string;
  questions: QuestionResult[];
  mistakes: MistakeAnalysis[];
  overallFeedback: string;
  strengthAreas: string[];
  improvementAreas: string[];
  teacherNotified: boolean;
  teacherNotificationDate?: Date;
  processingStatus: ProcessingStatus;
}

export type ProcessingStatus =
  | 'idle'
  | 'uploading'
  | 'ocr'
  | 'evaluating'
  | 'generating_feedback'
  | 'completed'
  | 'error';

export interface ProcessingProgress {
  status: ProcessingStatus;
  progress: number;
  currentStep: string;
  error?: string;
}

export interface ScanSubmission {
  pages: string[];
  subject: string;
  assignmentTitle?: string;
  studentId: number;
}

export interface ScanResponse {
  scanId: string;
  status: ProcessingStatus;
  message: string;
}

export interface OverallScore {
  percentage: number;
  grade: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  partiallyCorrect: number;
  earnedPoints: number;
  totalPoints: number;
  trend?: 'up' | 'down' | 'stable';
  previousScore?: number;
}

export interface CameraState {
  isActive: boolean;
  hasPermission: boolean;
  error?: string;
  stream?: MediaStream;
}

export interface CapturedImage {
  dataUrl: string;
  timestamp: Date;
}
