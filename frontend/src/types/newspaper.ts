export interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  category: 'news' | 'sports' | 'opinion' | 'arts';
  publishedDate: string;
  coverImage?: string;
  tags: string[];
  readTime: number;
  views: number;
  comments: number;
  featured: boolean;
}

export interface Edition {
  id: number;
  title: string;
  coverImage: string;
  publishDate: string;
  description: string;
  articleCount: number;
  theme?: string;
  downloads?: number;
  year?: number;
  month?: string;
}

export interface Comment {
  id: number;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
}

export interface Draft {
  id: number;
  title: string;
  category: string;
  lastEdited: string;
  wordCount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface Submission {
  id: number;
  title: string;
  author: {
    name: string;
    avatar?: string;
  };
  category: string;
  submittedDate: string;
  wordCount: number;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  comments: number;
  priority: 'high' | 'medium' | 'low';
}

export interface EditionSection {
  id: string;
  title: string;
  articles: {
    id: number;
    title: string;
    author: string;
    wordCount: number;
  }[];
}

export interface PublicationEvent {
  date: string;
  edition: string;
  deadline: string;
  status: 'upcoming' | 'active' | 'past';
}

export interface SubmissionGuideline {
  title: string;
  content: string;
}

export interface ArticleMetrics {
  id: number;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  avgReadTime: number;
  category: string;
}

export interface TrendingTopic {
  topic: string;
  mentions: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReaderDemographic {
  grade: string;
  percentage: number;
  count: number;
}
