import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoStudent, screen, waitFor, userEvent } from '../../tests/test-utils';
import AdaptiveLearningLibrary from './AdaptiveLearningLibrary';
import learningStyleApi from '@/api/learningStyle';
import type {
  LearningStyleProfile,
  AdaptiveContent,
  ContentEffectiveness,
} from '@/types/learningStyle';

vi.mock('@/api/learningStyle', () => ({
  default: {
    getProfile: vi.fn(),
    getAdaptiveContent: vi.fn(),
    getContentEffectiveness: vi.fn(),
  },
}));

const mockProfile: LearningStyleProfile = {
  id: 1,
  student_id: 1,
  visual_score: 80,
  auditory_score: 40,
  kinesthetic_score: 30,
  reading_writing_score: 50,
  primary_style: 'visual',
  secondary_style: 'reading_writing',
  preferences: {
    preferred_formats: ['video', 'article'],
    study_environment: 'quiet',
    interaction_preference: 'independent',
  },
  completed_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockContents: AdaptiveContent[] = [
  {
    id: 1,
    title: 'Quadratic Equations Explained',
    description: 'A visual walkthrough of solving quadratic equations',
    subject: 'Mathematics',
    topic: 'Algebra',
    formats: {
      video: { id: 'v1', url: '/v1', duration: 10, type: 'video' },
      article: { id: 'a1', url: '/a1', pages: 3, type: 'article' },
    },
    recommended_for: ['visual'],
    difficulty_level: 2,
    estimated_time: 15,
    tags: ['algebra'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Sound Waves Podcast',
    description: 'An audio deep-dive into sound waves',
    subject: 'Science',
    topic: 'Physics',
    formats: {
      audio: { id: 'au1', url: '/au1', duration: 20, type: 'audio' },
    },
    recommended_for: ['auditory'],
    difficulty_level: 1,
    estimated_time: 20,
    tags: ['physics'],
    created_at: '2026-01-01T00:00:00Z',
  },
];

const mockEffectiveness: ContentEffectiveness[] = [
  {
    student_id: 1,
    content_id: 1,
    format: 'video',
    completion_rate: 80,
    time_spent: 600,
    engagement_score: 90,
    last_accessed: '2026-01-01T00:00:00Z',
  },
];

describe('AdaptiveLearningLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(learningStyleApi.getProfile).mockResolvedValue(mockProfile);
    vi.mocked(learningStyleApi.getAdaptiveContent).mockResolvedValue(mockContents);
    vi.mocked(learningStyleApi.getContentEffectiveness).mockResolvedValue(mockEffectiveness);
  });

  it('loads the profile and shows only content matching the primary learning style by default', async () => {
    renderWithDemoStudent(<AdaptiveLearningLibrary />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Adaptive Learning Library')).toBeInTheDocument();
    expect(screen.getByText('Primary: visual')).toBeInTheDocument();
    expect(screen.getByText('Secondary: reading writing')).toBeInTheDocument();

    // Only the visual-recommended content should show since "Matched" is on by default
    expect(screen.getByText('Quadratic Equations Explained')).toBeInTheDocument();
    expect(screen.queryByText('Sound Waves Podcast')).not.toBeInTheDocument();
    expect(screen.getByText('1 Matched Content Items')).toBeInTheDocument();
  });

  it('shows all content when the "All Content" toggle is selected', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AdaptiveLearningLibrary />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'All Content' }));

    expect(screen.getByText('Quadratic Equations Explained')).toBeInTheDocument();
    expect(screen.getByText('Sound Waves Podcast')).toBeInTheDocument();
    expect(screen.getByText('2 Content Items')).toBeInTheDocument();
  });

  it('filters content by search query', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AdaptiveLearningLibrary />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'All Content' }));
    await user.type(screen.getByLabelText('Search'), 'sound waves');

    expect(screen.queryByText('Quadratic Equations Explained')).not.toBeInTheDocument();
    expect(screen.getByText('Sound Waves Podcast')).toBeInTheDocument();
  });

  it('shows an empty state when no content matches the filters', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AdaptiveLearningLibrary />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Search'), 'nonexistent content xyz');

    expect(screen.getByText('No content found matching your filters')).toBeInTheDocument();
  });

  it('shows an error alert if the library fails to load', async () => {
    vi.mocked(learningStyleApi.getProfile).mockRejectedValue(new Error('network error'));

    renderWithDemoStudent(<AdaptiveLearningLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load content library')).toBeInTheDocument();
    });
  });
});
