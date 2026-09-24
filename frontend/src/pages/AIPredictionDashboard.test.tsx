import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderWithDemoStudent,
  screen,
  waitFor,
  userEvent,
} from '../../tests/test-utils';
import AIPredictionDashboard from './AIPredictionDashboard';
import { demoData } from '@/data/dummyData';
import type { AIPredictionDashboardResponse } from '@/api/aiPredictionDashboard';

const mockDashboardData: AIPredictionDashboardResponse = {
  board: 'cbse',
  grade_id: 10,
  subject_id: 1,
  subject_name: 'Mathematics',
  generated_at: new Date().toISOString(),
  topic_rankings: demoData.aiPrediction.topicProbabilities,
  predicted_blueprint: {
    total_marks: 100,
    duration_minutes: 180,
    sections: [],
    topic_coverage: {},
    difficulty_breakdown: {},
  },
  marks_distribution: demoData.aiPrediction.marksDistribution,
  focus_areas: demoData.aiPrediction.focusAreas,
  study_time_allocation: demoData.aiPrediction.studyTimeAllocation,
  overall_prediction: {
    total_topics_analyzed: 5,
    high_probability_topics: 5,
    total_expected_marks: 44,
    recommended_study_hours: 29,
  },
};

const getDashboardMock = vi.fn();

vi.mock('@/api/demoDataApi', () => ({
  isDemoUser: vi.fn(() => true),
  demoDataApi: {
    aiPredictionDashboard: {
      getDashboard: (...args: unknown[]) => getDashboardMock(...args),
    },
  },
}));

vi.mock('@/api/aiPredictionDashboard', () => ({
  default: {
    getDashboard: vi.fn(),
  },
}));

describe('AIPredictionDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDashboardMock.mockResolvedValue(mockDashboardData);
  });

  it('renders the header and overall stats once data loads', async () => {
    renderWithDemoStudent(<AIPredictionDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('AI Exam Prediction Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Mathematics • CBSE • Grade 10/)).toBeInTheDocument();
    // total_topics_analyzed and high_probability_topics are both 5 in this fixture
    expect(screen.getAllByText('5')).toHaveLength(2);
    expect(screen.getByText('44')).toBeInTheDocument(); // total_expected_marks
    expect(screen.getByText('29h')).toBeInTheDocument(); // recommended_study_hours
  });

  it('renders the topic rankings table by default', async () => {
    renderWithDemoStudent(<AIPredictionDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Topic Probability Rankings')).toBeInTheDocument();
    demoData.aiPrediction.topicProbabilities.forEach((topic) => {
      expect(screen.getByText(topic.topic_name)).toBeInTheDocument();
    });
  });

  it('switches to the Question Blueprint tab on click', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AIPredictionDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /Question Blueprint/i }));

    // Topic rankings table (tab 0 content) should no longer be visible
    await waitFor(() => {
      expect(screen.queryByText('Topic Probability Rankings')).not.toBeInTheDocument();
    });
  });

  it('demoAIPredictionDashboardApi.getDashboard populates overall_prediction (regression)', async () => {
    // Bypass the vi.mock above to exercise the real demo data implementation and
    // confirm it no longer returns an empty overall_prediction object.
    const real = await vi.importActual<typeof import('@/api/demoDataApi')>('@/api/demoDataApi');
    const result = await real.demoDataApi.aiPredictionDashboard.getDashboard('cbse', 10, 1);

    expect(result.overall_prediction.total_topics_analyzed).toBe(5);
    expect(result.overall_prediction.high_probability_topics).toBe(5);
    expect(result.overall_prediction.total_expected_marks).toBe(44);
    expect(result.overall_prediction.recommended_study_hours).toBe(29);
  });

  it('shows an error alert when the dashboard fails to load', async () => {
    getDashboardMock.mockRejectedValue({
      response: { data: { detail: 'Prediction service unavailable' } },
    });

    renderWithDemoStudent(<AIPredictionDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Prediction service unavailable')).toBeInTheDocument();
    });
  });
});
