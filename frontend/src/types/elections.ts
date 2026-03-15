export enum ElectionStatus {
  DRAFT = 'draft',
  NOMINATIONS_OPEN = 'nominations_open',
  NOMINATIONS_CLOSED = 'nominations_closed',
  VOTING_OPEN = 'voting_open',
  VOTING_CLOSED = 'voting_closed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CandidateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum VotingMethod {
  SIMPLE = 'simple',
  RANKED_CHOICE = 'ranked_choice',
}

export interface Election {
  id: number;
  institution_id: number;
  title: string;
  description: string;
  position: string;
  voting_method: VotingMethod;
  status: ElectionStatus;
  nominations_open_date: string;
  nominations_close_date: string;
  voting_open_date: string;
  voting_close_date: string;
  eligible_voters_grade_ids?: number[];
  max_candidates?: number;
  min_candidates?: number;
  created_at: string;
  updated_at: string;
  candidates_count?: number;
  votes_count?: number;
}

export interface Candidate {
  id: number;
  election_id: number;
  student_id: number;
  status: CandidateStatus;
  campaign_statement: string;
  platform_points: string[];
  poster_url?: string;
  video_url?: string;
  slogan?: string;
  submitted_at: string;
  approved_at?: string;
  rejected_reason?: string;
  profile_views: number;
  endorsements_count: number;
  created_at: string;
  updated_at: string;
  student?: StudentInfo;
  endorsements?: Endorsement[];
}

export interface StudentInfo {
  id: number;
  first_name: string;
  last_name: string;
  photo_url?: string;
  grade?: string;
  section?: string;
}

export interface Endorsement {
  id: number;
  candidate_id: number;
  endorser_id: number;
  message: string;
  is_public: boolean;
  created_at: string;
  endorser?: StudentInfo;
}

export interface Vote {
  id: number;
  election_id: number;
  voter_id: number;
  vote_hash: string;
  encrypted_vote: string;
  created_at: string;
}

export interface RankedChoiceVote {
  candidate_id: number;
  rank: number;
}

export interface VoteSubmission {
  election_id: number;
  candidate_id?: number;
  ranked_choices?: RankedChoiceVote[];
}

export interface ElectionResults {
  election_id: number;
  winner?: CandidateResult;
  candidates: CandidateResult[];
  total_votes: number;
  voter_turnout_percentage: number;
  demographics: VoterDemographics;
  rounds?: RankedChoiceRound[];
}

export interface CandidateResult {
  candidate_id: number;
  candidate_name: string;
  photo_url?: string;
  votes_count: number;
  vote_percentage: number;
  is_winner: boolean;
}

export interface VoterDemographics {
  by_grade: { grade: string; count: number; percentage: number }[];
  by_gender: { gender: string; count: number; percentage: number }[];
  total_eligible_voters: number;
  total_votes_cast: number;
}

export interface RankedChoiceRound {
  round_number: number;
  candidates: {
    candidate_id: number;
    votes: number;
    eliminated: boolean;
  }[];
}

export interface CampaignAnalytics {
  candidate_id: number;
  profile_views: number;
  views_trend: { date: string; views: number }[];
  endorsements_count: number;
  poster_downloads: number;
  video_plays: number;
  engagement_score: number;
  comparison_with_others: {
    candidate_id: number;
    candidate_name: string;
    profile_views: number;
    endorsements_count: number;
  }[];
}

export interface PosterTemplate {
  id: string;
  name: string;
  thumbnail_url: string;
  template_data: Record<string, unknown>;
}

export interface CandidateComparison {
  candidate_id: number;
  candidate_name: string;
  photo_url?: string;
  platform_points: string[];
  campaign_statement: string;
  endorsements_count: number;
  profile_views: number;
}

export interface ElectionCalendarEvent {
  id: number;
  election_id: number;
  title: string;
  position: string;
  date: string;
  type: 'nominations_open' | 'nominations_close' | 'voting_open' | 'voting_close';
  status: ElectionStatus;
}
