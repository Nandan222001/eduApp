import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor, fireEvent } from '../../tests/test-utils';
import { AdminVolunteerAnalytics } from './AdminVolunteerAnalytics';
import { volunteerApi } from '@/api/volunteer';
import type { VolunteerAnalytics } from '@/types/volunteer';

vi.mock('@/api/volunteer', () => ({
  volunteerApi: {
    getAnalytics: vi.fn(),
  },
}));

const mockAnalytics: VolunteerAnalytics = {
  engagement_trends: [
    { date: '2024-01-01', total_hours: 20, unique_volunteers: 5 },
    { date: '2024-01-02', total_hours: 25, unique_volunteers: 6 },
  ],
  popular_activities: [
    {
      activity_name: 'Beach Cleanup',
      total_hours: 120,
      participants_count: 30,
      average_hours_per_activity: 4,
    },
    {
      activity_name: 'Tutoring',
      total_hours: 90,
      participants_count: 20,
      average_hours_per_activity: 4.5,
    },
  ],
  event_correlations: [
    {
      event_name: 'Founders Day',
      event_date: '2024-02-01',
      volunteer_hours_before: 10,
      volunteer_hours_during: 40,
      volunteer_hours_after: 15,
      correlation_score: 0.85,
    },
  ],
  monthly_summary: [
    { month: 'Oct', total_hours: 100, new_volunteers: 3, active_volunteers: 20 },
    { month: 'Nov', total_hours: 150, new_volunteers: 5, active_volunteers: 25 },
    { month: 'Dec', total_hours: 200, new_volunteers: 2, active_volunteers: 30 },
    { month: 'Jan', total_hours: 250, new_volunteers: 8, active_volunteers: 35 },
  ],
  demographics: {
    by_grade: [
      { grade_name: 'Grade 9', volunteer_count: 10, total_hours: 40 },
      { grade_name: 'Grade 10', volunteer_count: 15, total_hours: 60 },
    ],
    by_activity_type: [
      { activity_type: 'Community Service', volunteer_count: 20, total_hours: 80 },
      { activity_type: 'Tutoring', volunteer_count: 10, total_hours: 40 },
    ],
  },
};

describe('AdminVolunteerAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(volunteerApi.getAnalytics).mockResolvedValue(mockAnalytics);
  });

  it('shows a loading spinner before data resolves', () => {
    vi.mocked(volunteerApi.getAnalytics).mockReturnValue(new Promise(() => {}));
    renderWithDemoAdmin(<AdminVolunteerAnalytics />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the page heading and monthly summary cards once data loads', async () => {
    renderWithDemoAdmin(<AdminVolunteerAnalytics />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Volunteer Analytics')).toBeInTheDocument();
    // Last 4 months of monthly_summary are rendered as cards
    expect(screen.getByText('Oct')).toBeInTheDocument();
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('250h')).toBeInTheDocument();
    expect(screen.getByText('8 new')).toBeInTheDocument();
  });

  it('renders the popular activities details table', async () => {
    renderWithDemoAdmin(<AdminVolunteerAnalytics />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Beach Cleanup')).toBeInTheDocument();
    expect(screen.getByText('Tutoring')).toBeInTheDocument();
    expect(screen.getByText('120h')).toBeInTheDocument();
    expect(screen.getByText('4.5h')).toBeInTheDocument();
  });

  it('renders the event correlation table when correlations are present', async () => {
    renderWithDemoAdmin(<AdminVolunteerAnalytics />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Event Correlation Analysis')).toBeInTheDocument();
    expect(screen.getByText('Founders Day')).toBeInTheDocument();
    expect(screen.getByText('0.85')).toBeInTheDocument();
  });

  it('omits the event correlation section when there are no correlations', async () => {
    vi.mocked(volunteerApi.getAnalytics).mockResolvedValue({
      ...mockAnalytics,
      event_correlations: [],
    });
    renderWithDemoAdmin(<AdminVolunteerAnalytics />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Event Correlation Analysis')).not.toBeInTheDocument();
  });

  it('lets the user change the start and end date filters', async () => {
    renderWithDemoAdmin(<AdminVolunteerAnalytics />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
    expect(startDateInput.value).toMatch(/^\d{4}-01-01$/);

    vi.mocked(volunteerApi.getAnalytics).mockClear();

    const endDateInput = screen.getByLabelText('End Date') as HTMLInputElement;
    fireEvent.change(endDateInput, { target: { value: '2024-06-30' } });

    await waitFor(() => {
      expect(endDateInput.value).toBe('2024-06-30');
    });
    await waitFor(() => {
      expect(volunteerApi.getAnalytics).toHaveBeenCalledWith(expect.any(String), '2024-06-30');
    });
  });
});
