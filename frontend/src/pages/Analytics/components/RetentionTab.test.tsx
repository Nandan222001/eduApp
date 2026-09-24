import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor } from '../../../../tests/test-utils';
import RetentionTab from './RetentionTab';
import { analyticsApi } from '@/api/analytics';
import type { RetentionCohort } from '@/api/analytics';

vi.mock('@/api/analytics', () => ({
  analyticsApi: {
    getRetentionCohorts: vi.fn(),
  },
}));

const mockCohorts: RetentionCohort[] = [
  {
    cohort_date: '2024-01-01',
    users_count: 100,
    retention_day_1: 80,
    retention_day_7: 55,
    retention_day_14: 35,
    retention_day_30: 20,
  },
];

describe('RetentionTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.getRetentionCohorts).mockResolvedValue(mockCohorts);
  });

  it('shows a loading spinner before data resolves', () => {
    vi.mocked(analyticsApi.getRetentionCohorts).mockReturnValue(new Promise(() => {}));
    renderWithDemoAdmin(<RetentionTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the retention cohort table with formatted date and colored chips', async () => {
    renderWithDemoAdmin(<RetentionTab />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('User Retention Analysis')).toBeInTheDocument();
    expect(screen.getByText('Jan 01, 2024')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();

    const day1Chip = screen.getByText('80%');
    expect(day1Chip.closest('.MuiChip-colorSuccess')).toBeInTheDocument();

    const day30Chip = screen.getByText('20%');
    expect(day30Chip.closest('.MuiChip-colorError')).toBeInTheDocument();
  });
});
