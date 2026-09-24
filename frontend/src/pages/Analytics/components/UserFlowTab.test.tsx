import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor } from '../../../../tests/test-utils';
import UserFlowTab from './UserFlowTab';
import { analyticsApi } from '@/api/analytics';
import type { UserFlowAnalysis } from '@/api/analytics';

vi.mock('@/api/analytics', () => ({
  analyticsApi: {
    getUserFlow: vi.fn(),
  },
}));

const mockUserFlow: UserFlowAnalysis = {
  total_sessions: 400,
  nodes: [
    { page: '/dashboard', count: 200, drop_off_rate: 10 },
    { page: '/assignments', count: 100, drop_off_rate: 25 },
  ],
};

describe('UserFlowTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.getUserFlow).mockResolvedValue(mockUserFlow);
  });

  it('shows a loading spinner before data resolves', () => {
    vi.mocked(analyticsApi.getUserFlow).mockReturnValue(new Promise(() => {}));
    renderWithDemoAdmin(<UserFlowTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders total sessions and each flow node with percentage and drop-off rate', async () => {
    renderWithDemoAdmin(<UserFlowTab />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('User Flow Analysis')).toBeInTheDocument();
    expect(screen.getByText('Total Sessions: 400')).toBeInTheDocument();
    expect(screen.getByText('/dashboard')).toBeInTheDocument();
    // 200 / 400 = 50.0%
    expect(screen.getByText(/200 sessions \(50\.0%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Drop-off rate: 10\.0%/)).toBeInTheDocument();
  });

  it('handles zero total sessions without dividing by zero', async () => {
    vi.mocked(analyticsApi.getUserFlow).mockResolvedValue({ total_sessions: 0, nodes: [] });
    renderWithDemoAdmin(<UserFlowTab />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Total Sessions: 0')).toBeInTheDocument();
  });
});
