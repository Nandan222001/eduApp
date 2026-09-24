import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor } from '../../../../tests/test-utils';
import EventsTab from './EventsTab';
import { analyticsApi } from '@/api/analytics';
import type { TopEventStats } from '@/api/analytics';

vi.mock('@/api/analytics', () => ({
  analyticsApi: {
    getTopEvents: vi.fn(),
  },
}));

const mockEvents: TopEventStats[] = [
  { event_name: 'login', event_type: 'page_view', count: 1000, unique_users: 200 },
  { event_name: 'submit_assignment', event_type: 'conversion', count: 50, unique_users: 40 },
];

describe('EventsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.getTopEvents).mockResolvedValue(mockEvents);
  });

  it('shows a loading spinner before data resolves', () => {
    vi.mocked(analyticsApi.getTopEvents).mockReturnValue(new Promise(() => {}));
    renderWithDemoAdmin(<EventsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the top events table once data loads', async () => {
    renderWithDemoAdmin(<EventsTab />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Top Events')).toBeInTheDocument();
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('submit_assignment')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    // avg per user for login = 1000/200 = 5.0
    expect(screen.getByText('5.0')).toBeInTheDocument();
  });

  it('renders an empty table when there are no events', async () => {
    vi.mocked(analyticsApi.getTopEvents).mockResolvedValue([]);
    renderWithDemoAdmin(<EventsTab />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Top Events')).toBeInTheDocument();
    expect(screen.queryByText('login')).not.toBeInTheDocument();
  });
});
