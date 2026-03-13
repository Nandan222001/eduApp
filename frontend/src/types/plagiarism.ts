export enum PlagiarismCheckStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ComparisonScope {
  WITHIN_BATCH = 'within_batch',
  CROSS_BATCH = 'cross_batch',
  CROSS_INSTITUTION = 'cross_institution',
  ALL = 'all',
}

export enum ContentType {
  TEXT = 'text',
  SOURCE_CODE = 'source_code',
  MIXED = 'mixed',
}

export enum ReviewDecision {
  CONFIRMED_PLAGIARISM = 'confirmed_plagiarism',
  FALSE_POSITIVE = 'false_positive',
  LEGITIMATE_CITATION = 'legitimate_citation',
  NEEDS_INVESTIGATION = 'needs_investigation',
  DISMISSED = 'dismissed',
}

export interface CheckSettings {
  min_similarity_threshold: number;
  min_segment_length: number;
  enable_citation_detection: boolean;
  enable_code_analysis: boolean;
  ignore_common_phrases: boolean;
  max_comparisons: number;
}

export interface PlagiarismCheck {
  id: number;
  institution_id: number;
  assignment_id: number;
  submission_id?: number;
  content_type: ContentType;
  comparison_scope: ComparisonScope;
  enable_cross_institution: boolean;
  anonymize_cross_institution: boolean;
  status: PlagiarismCheckStatus;
  error_message?: string;
  total_comparisons: number;
  matches_found: number;
  processing_time_seconds?: number;
  check_settings?: CheckSettings;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MatchSegment {
  id: number;
  result_id: number;
  source_start: number;
  source_end: number;
  source_text: string;
  match_start: number;
  match_end: number;
  match_text: string;
  segment_similarity: number;
  segment_length: number;
  is_code_segment: boolean;
  code_analysis?: Record<string, unknown>;
  is_citation: boolean;
  citation_context?: string;
  created_at: string;
}

export interface PlagiarismResult {
  id: number;
  check_id: number;
  submission_id: number;
  matched_submission_id?: number;
  similarity_score: number;
  text_similarity?: number;
  code_similarity?: number;
  matched_segments_count: number;
  matched_text_percentage: number;
  is_external_source: boolean;
  external_source_info?: Record<string, unknown>;
  is_cross_institution: boolean;
  anonymized_match_info?: Record<string, unknown>;
  has_citations: boolean;
  citation_info?: {
    coverage: number;
    total_citations: number;
  };
  is_false_positive: boolean;
  false_positive_reason?: string;
  review_status?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  review_decision?: ReviewDecision;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PlagiarismResultDetail extends PlagiarismResult {
  matched_segments: MatchSegment[];
  submission_info?: SubmissionInfo;
  matched_submission_info?: SubmissionInfo;
}

export interface SubmissionInfo {
  submission_id: number;
  assignment_id: number;
  student_id?: number;
  student_name: string;
  institution?: string;
  submitted_at: string;
  marks_obtained?: number;
}

export interface HighlightedSegment {
  type: 'normal' | 'highlighted';
  text: string;
  start: number;
  end: number;
}

export interface ContentComparison {
  text: string;
  highlighted: HighlightedSegment[];
  length: number;
  matched_percentage: number;
}

export interface SimilarityVisualization {
  submission_id: number;
  matched_submission_id?: number;
  similarity_score: number;
  total_segments: number;
  matched_segments: MatchSegment[];
  content_comparison: {
    source: ContentComparison;
    target: ContentComparison;
  };
}

export interface ComparisonPair {
  submission_id_1: number;
  submission_id_2: number;
  student_name_1: string;
  student_name_2: string;
  similarity_score: number;
  matched_segments: number;
}

export interface PlagiarismReport {
  assignment_id: number;
  assignment_title: string;
  check_id: number;
  total_submissions: number;
  submissions_checked: number;
  high_similarity_count: number;
  medium_similarity_count: number;
  low_similarity_count: number;
  flagged_pairs: ComparisonPair[];
  average_similarity: number;
  max_similarity: number;
  processing_time_seconds: number;
  check_completed_at: string;
}

export interface CodeASTFingerprint {
  id: number;
  submission_id: number;
  file_id?: number;
  language: string;
  structure_hash: string;
  variable_pattern_hash: string;
  function_pattern_hash: string;
  ast_features: Record<string, unknown>;
  total_nodes: number;
  total_functions: number;
  total_variables: number;
  complexity_score: number;
  created_at: string;
}

export interface CitationPattern {
  id: number;
  submission_id: number;
  citation_type: string;
  citation_text: string;
  start_position: number;
  end_position: number;
  reference_info?: Record<string, unknown>;
  is_valid: boolean;
  validation_notes?: string;
  created_at: string;
}

export interface PrivacyConsent {
  id: number;
  institution_id: number;
  allow_cross_institution_comparison: boolean;
  allow_anonymized_sharing: boolean;
  data_retention_days: number;
  consent_given_by?: number;
  consent_given_at?: string;
  privacy_settings?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewSubmissionData {
  review_decision: ReviewDecision;
  review_notes?: string;
  is_false_positive: boolean;
  false_positive_reason?: string;
}

export interface PlagiarismCheckCreateData {
  assignment_id: number;
  submission_id?: number;
  content_type: ContentType;
  comparison_scope: ComparisonScope;
  enable_cross_institution: boolean;
  anonymize_cross_institution: boolean;
  check_settings?: Partial<CheckSettings>;
}
