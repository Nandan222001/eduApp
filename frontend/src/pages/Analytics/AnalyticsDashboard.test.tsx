import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor, userEvent } from '../../../tests/test-utils';
import AnalyticsDashboard from './AnalyticsDashboard';
import { analyticsApi } from '@/api/analytics';
import type { AnalyticsDashboardStats, FeatureAdoptionStats } from '@/api/analytics';

vi.mock('@/api/analytics', () => ({
  analyticsApi: {
    getDashboardStats: vi.fn(),
    getFeatureAdoption: vi.fn(),
    getUserFlow: vi.fn(),
    getRetentionCohorts: vi.fn(),
    getPerformanceStats: vi.fn(),
    getTopEvents: vi.fn(),
  },
}));

const mockStats: AnalyticsDashboardStats = {
  total_users: 1500,
  active_users_today: 300,
  active_users_week: 900,
  active_users_month: 1200,
  total_sessions: 5000,
  avg_session_duration: 180,
  total_page_views: 25000,
  avg_pages_per_session: 5,
};

const mockFeatures: FeatureAdoptionStats[] = [
  {
    feature_name: 'Flashcards',
    total_users: 100,
    total_usage: 200,
    unique_users_today: 10,
    unique_users_week: 40,
    unique_users_month: 80,
    adoption_rate: 42,
  },
];

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.getDashboardStats).mockResolvedValue(mockStats);
    vi.mocked(analyticsApi.getFeatureAdoption).mockResolvedValue(mockFeatures);
  });

  it('shows a loading spinner before dashboard stats resolve', () => {
    vi.mocked(analyticsApi.getDashboardStats).mockReturnValue(new Promise(() => {}));
    renderWithDemoAdmin(<AnalyticsDashboard />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders summary stat cards from the dashboard stats response', async () => {
    renderWithDemoAdmin(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('Active Today: 300')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();
    // avg_session_duration 180s -> 3m
    expect(screen.getByText('3m')).toBeInTheDocument();
  });

  it('shows the Overview tab by default', async () => {
    renderWithDemoAdmin(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Weekly Activity Trends')).toBeInTheDocument();
  });

  it('switches to the Feature Adoption tab and loads its data when clicked', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Feature Adoption' }));

    await waitFor(() => {
      expect(screen.getByText('Feature Adoption Metrics')).toBeInTheDocument();
    });
    expect(analyticsApi.getFeatureAdoption).toHaveBeenCalled();
    expect(screen.getByText('Flashcards')).toBeInTheDocument();
  });
});
