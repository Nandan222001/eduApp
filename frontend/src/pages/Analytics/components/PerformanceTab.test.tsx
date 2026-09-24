import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor } from '../../../../tests/test-utils';
import PerformanceTab from './PerformanceTab';
import { analyticsApi } from '@/api/analytics';
import type { PerformanceStats } from '@/api/analytics';

vi.mock('@/api/analytics', () => ({
  analyticsApi: {
    getPerformanceStats: vi.fn(),
  },
}));

const mockStats: PerformanceStats[] = [
  {
    metric_name: 'LCP',
    avg_value: 1200,
    p50_value: 1100,
    p75_value: 1400,
    p95_value: 2000,
    good_count: 80,
    needs_improvement_count: 15,
    poor_count: 5,
  },
  {
    metric_name: 'CLS',
    avg_value: 0.05,
    p50_value: 0.04,
    p75_value: 0.08,
    p95_value: 0.15,
    good_count: 30,
    needs_improvement_count: 40,
    poor_count: 30,
  },
];

describe('PerformanceTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.getPerformanceStats).mockResolvedValue(mockStats);
  });

  it('shows a loading spinner before data resolves', () => {
    vi.mocked(analyticsApi.getPerformanceStats).mockReturnValue(new Promise(() => {}));
    renderWithDemoAdmin(<PerformanceTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders web vitals cards with good/needs-work/poor breakdown', async () => {
    renderWithDemoAdmin(<PerformanceTab />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Web Vitals Performance')).toBeInTheDocument();
    expect(screen.getByText('LCP')).toBeInTheDocument();
    expect(screen.getByText('CLS')).toBeInTheDocument();
    // LCP shows "ms" suffix, CLS does not
    expect(screen.getByText('1200ms')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // CLS avg_value.toFixed(0) with no suffix
    expect(screen.getByText('Good: 80')).toBeInTheDocument();
    expect(screen.getByText('Needs Work: 15')).toBeInTheDocument();
    expect(screen.getByText('Poor: 5')).toBeInTheDocument();
    // 80/(80+15+5) = 80% -> success badge
    expect(screen.getByText('80% Good')).toBeInTheDocument();
  });
});
