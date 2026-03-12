export interface DoubtPost {
  id: number;
  institution_id: number;
  user_id: number;
  subject_id?: number;
  chapter_id?: number;
  topic_id?: string;
  title: string;
  description: string;
  images?: string[];
  tags?: string[];
  status: DoubtStatus;
  view_count: number;
  answer_count: number;
  upvote_count: number;
  is_anonymous: boolean;
  accepted_answer_id?: number;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
  subject_name?: string;
  chapter_name?: string;
  is_upvoted?: boolean;
  is_bookmarked?: boolean;
}

export enum DoubtStatus {
  UNANSWERED = 'unanswered',
  ANSWERED = 'answered',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface DoubtAnswer {
  id: number;
  institution_id: number;
  doubt_id: number;
  user_id: number;
  content: string;
  images?: string[];
  upvote_count: number;
  downvote_count: number;
  is_accepted: boolean;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
  user_role?: string;
  is_upvoted?: boolean;
  is_downvoted?: boolean;
}

export interface DoubtComment {
  id: number;
  institution_id: number;
  doubt_id?: number;
  answer_id?: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface DoubtVote {
  id: number;
  institution_id: number;
  user_id: number;
  doubt_id?: number;
  answer_id?: number;
  vote_type: VoteType;
  created_at: string;
}

export enum VoteType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote',
}

export interface DoubtBookmark {
  id: number;
  institution_id: number;
  doubt_id: number;
  user_id: number;
  notes?: string;
  created_at: string;
}

export interface DoubtSearchFilters {
  query?: string;
  subject_id?: number;
  chapter_id?: number;
  tags?: string[];
  status?: DoubtStatus;
  user_id?: number;
  sort_by?: 'recent' | 'popular' | 'unanswered';
  page?: number;
  page_size?: number;
}

export interface DoubtStats {
  total_doubts: number;
  unanswered_doubts: number;
  resolved_doubts: number;
  my_doubts: number;
  my_answers: number;
  popular_tags: { tag: string; count: number }[];
}
