import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor, userEvent } from '../../tests/test-utils';
import AdminGraduationRequirementDashboard from './AdminGraduationRequirementDashboard';
import communityServiceApi from '@/api/communityService';
import type { GraduationRequirementProgress, ServiceStats } from '@/types/communityService';

vi.mock('@/api/communityService', () => ({
  default: {
    getGraduationProgress: vi.fn(),
    getServiceStats: vi.fn(),
    updateRequiredHours: vi.fn(),
  },
}));

const mockStudents: GraduationRequirementProgress[] = [
  {
    student_id: 1,
    student_name: 'Emma Doe',
    grade: '12',
    required_hours: 40,
    completed_hours: 42,
    pending_hours: 0,
    percentage_complete: 105,
    is_on_track: true,
    is_at_risk: false,
    activities_count: 5,
    last_activity_date: '2026-02-01T00:00:00Z',
  },
  {
    student_id: 2,
    student_name: 'Liam Smith',
    grade: '11',
    required_hours: 40,
    completed_hours: 10,
    pending_hours: 2,
    percentage_complete: 25,
    is_on_track: false,
    is_at_risk: true,
    activities_count: 1,
    last_activity_date: '2026-01-10T00:00:00Z',
    notes: 'Behind schedule',
  },
];

const mockStats: ServiceStats = {
  total_students: 2,
  active_students: 2,
  total_hours: 52,
  average_hours_per_student: 26,
  completion_rate: 50,
  at_risk_students: 1,
  categories_breakdown: [],
  monthly_trends: [],
};

describe('AdminGraduationRequirementDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(communityServiceApi.getGraduationProgress).mockResolvedValue(mockStudents);
    vi.mocked(communityServiceApi.getServiceStats).mockResolvedValue(mockStats);
  });

  it('renders summary stats, the at-risk alert, and the student table', async () => {
    renderWithDemoAdmin(<AdminGraduationRequirementDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Graduation Requirement Dashboard')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total Students
    expect(screen.getByText('50.0%')).toBeInTheDocument(); // Completion Rate
    expect(screen.getByText('52')).toBeInTheDocument(); // Total Hours Logged

    expect(screen.getByText('1 student is at risk of not meeting graduation requirements')).toBeInTheDocument();

    expect(screen.getByText('Emma Doe')).toBeInTheDocument();
    expect(screen.getByText('Liam Smith')).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('At Risk').length).toBeGreaterThan(0);
  });

  it('refetches with the grade filter when it changes', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AdminGraduationRequirementDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Filter by Grade'));
    await user.click(await screen.findByRole('option', { name: 'Grade 11' }));

    await waitFor(() => {
      expect(communityServiceApi.getGraduationProgress).toHaveBeenCalledWith({
        grade: '11',
        at_risk: undefined,
      });
    });
  });

  it('opens the edit requirement dialog and saves updated hours', async () => {
    const user = userEvent.setup();
    vi.mocked(communityServiceApi.updateRequiredHours).mockResolvedValue(undefined);

    renderWithDemoAdmin(<AdminGraduationRequirementDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const editButtons = screen.getAllByLabelText('Edit Requirement');
    await user.click(editButtons[0]);

    expect(await screen.findByText('Edit Graduation Requirement')).toBeInTheDocument();
    const hoursInput = screen.getByLabelText('Required Hours');
    expect(hoursInput).toHaveValue(40);

    await user.clear(hoursInput);
    await user.type(hoursInput, '60');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(communityServiceApi.updateRequiredHours).toHaveBeenCalledWith(1, 60, '');
    });

    await waitFor(() => {
      expect(screen.queryByText('Edit Graduation Requirement')).not.toBeInTheDocument();
    });
  });

  it('shows an error alert when data fails to load', async () => {
    vi.mocked(communityServiceApi.getGraduationProgress).mockRejectedValue(new Error('boom'));

    renderWithDemoAdmin(<AdminGraduationRequirementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load graduation requirement data')).toBeInTheDocument();
    });
  });
});
