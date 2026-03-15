export interface ResearchProject {
  id: number;
  title: string;
  abstract: string;
  research_question: string;
  methodology: string;
  status: 'planning' | 'in_progress' | 'completed' | 'submitted';
  created_at: string;
  updated_at: string;
  team_lead_id: number;
  team_lead_name: string;
  team_lead_avatar?: string;
  team_members: TeamMember[];
  milestones: Milestone[];
  progress_percentage: number;
  category: string;
  tags: string[];
  is_member: boolean;
  is_public: boolean;
  submission_date?: string;
  presentation_url?: string;
  findings_summary?: string;
  awards: Award[];
}

export interface TeamMember {
  id: number;
  user_id: number;
  name: string;
  avatar?: string;
  role: string;
  joined_at: string;
}

export interface Milestone {
  id: number;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  completed_at?: string;
  approved_by_advisor: boolean;
  advisor_feedback?: string;
  order: number;
}

export interface ResearchDocument {
  id: number;
  project_id: number;
  title: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_name: string;
  comments: DocumentComment[];
}

export interface DocumentComment {
  id: number;
  document_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  content: string;
  position?: number;
  selection_text?: string;
  created_at: string;
  is_advisor: boolean;
}

export interface DataTable {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  columns: DataColumn[];
  rows: DataRow[];
  created_at: string;
  updated_at: string;
}

export interface DataColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
}

export interface DataRow {
  id: string;
  data: Record<string, unknown>;
}

export interface LiteratureEntry {
  id: number;
  project_id: number;
  title: string;
  authors: string[];
  publication_year: number;
  source: string;
  url?: string;
  notes?: string;
  citation_mla?: string;
  citation_apa?: string;
  citation_chicago?: string;
  created_at: string;
}

export interface ExperimentLog {
  id: number;
  project_id: number;
  title: string;
  description: string;
  date: string;
  procedure: string;
  observations: string;
  results: string;
  conclusion?: string;
  media: ExperimentMedia[];
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface ExperimentMedia {
  id: number;
  type: 'photo' | 'video';
  url: string;
  caption?: string;
}

export interface ResearchFile {
  id: number;
  project_id: number;
  name: string;
  file_type: string;
  file_size: number;
  url: string;
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_at: string;
  folder?: string;
}

export interface ChatMessage {
  id: number;
  project_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: number;
  name: string;
  url: string;
  type: string;
}

export interface Award {
  id: number;
  name: string;
  category: string;
  awarded_date: string;
  description?: string;
}

export interface PeerReview {
  id: number;
  project_id: number;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_avatar?: string;
  rating: number;
  strengths: string;
  improvements: string;
  overall_feedback: string;
  created_at: string;
}

export interface ScienceFairSubmission {
  id: number;
  project_id: number;
  fair_name: string;
  submission_date: string;
  presentation_date?: string;
  booth_number?: string;
  status: 'submitted' | 'accepted' | 'rejected' | 'judged';
  judging_criteria: JudgingCriterion[];
  total_score?: number;
  awards: Award[];
}

export interface JudgingCriterion {
  id: number;
  name: string;
  description: string;
  max_score: number;
  score?: number;
  judge_feedback?: string;
}

export interface AdvisorFeedback {
  id: number;
  project_id: number;
  advisor_id: number;
  advisor_name: string;
  advisor_avatar?: string;
  type: 'document_comment' | 'milestone_review' | 'general';
  content: string;
  created_at: string;
  related_item_id?: number;
}

export interface MeetingSchedule {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_url?: string;
  attendees: number[];
  created_by: number;
  created_at: string;
}
