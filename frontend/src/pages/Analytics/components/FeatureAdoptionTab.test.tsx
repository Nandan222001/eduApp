import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor } from '../../../../tests/test-utils';
import FeatureAdoptionTab from './FeatureAdoptionTab';
import { analyticsApi } from '@/api/analytics';
import type { FeatureAdoptionStats } from '@/api/analytics';

vi.mock('@/api/analytics', () => ({
  analyticsApi: {
    getFeatureAdoption: vi.fn(),
  },
}));

const mockFeatures: FeatureAdoptionStats[] = [
  {
    feature_name: 'AI Study Buddy',
    total_users: 500,
    total_usage: 3000,
    unique_users_today: 50,
    unique_users_week: 200,
    unique_users_month: 400,
    adoption_rate: 65.2,
  },
  {
    feature_name: 'Flashcards',
    total_users: 100,
    total_usage: 300,
    unique_users_today: 10,
    unique_users_week: 40,
    unique_users_month: 80,
    adoption_rate: 20,
  },
];

describe('FeatureAdoptionTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.getFeatureAdoption).mockResolvedValue(mockFeatures);
  });

  it('shows a loading spinner before data resolves', () => {
    vi.mocked(analyticsApi.getFeatureAdoption).mockReturnValue(new Promise(() => {}));
    renderWithDemoAdmin(<FeatureAdoptionTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders feature adoption rows with a success chip above 50%', async () => {
    renderWithDemoAdmin(<FeatureAdoptionTab />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Feature Adoption Metrics')).toBeInTheDocument();
    expect(screen.getByText('AI Study Buddy')).toBeInTheDocument();
    expect(screen.getByText('65.2%')).toBeInTheDocument();

    const highAdoptionChip = screen.getByText('65.2%');
    expect(highAdoptionChip.closest('.MuiChip-colorSuccess')).toBeInTheDocument();

    const lowAdoptionChip = screen.getByText('20.0%');
    expect(lowAdoptionChip.closest('.MuiChip-colorDefault')).toBeInTheDocument();
  });
});
