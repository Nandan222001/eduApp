import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor, userEvent, within } from '../../tests/test-utils';
import AttendanceDefaultersPage from './AttendanceDefaultersPage';
import type { AttendanceDefaulter } from '@/api/attendance';

const getDefaultersMock = vi.fn();

vi.mock('@/api/attendance', async () => {
  const actual = await vi.importActual<typeof import('@/api/attendance')>('@/api/attendance');
  return {
    ...actual,
    default: {
      getDefaulters: (...args: unknown[]) => getDefaultersMock(...args),
    },
  };
});

const listStudentsMock = vi.fn();

vi.mock('@/api/students', () => ({
  default: {
    listStudents: (...args: unknown[]) => listStudentsMock(...args),
  },
}));

const mockStudents = [
  {
    id: 1,
    institution_id: 1,
    first_name: 'A',
    last_name: 'One',
    status: 'active',
    is_active: true,
    created_at: '',
    updated_at: '',
    section: { id: 10, name: 'A', grade_id: 8, grade: { id: 8, name: 'Grade 8' } },
  },
];

const mockDefaulters: AttendanceDefaulter[] = [
  {
    student_id: 1,
    student_name: 'Critical Kid',
    admission_number: 'ADM-1',
    section_name: 'Grade 8 - A',
    total_days: 40,
    present_days: 15,
    absent_days: 25,
    attendance_percentage: 37.5,
  },
  {
    student_id: 2,
    student_name: 'Medium Risk Kid',
    section_name: 'Grade 8 - A',
    total_days: 40,
    present_days: 28,
    absent_days: 12,
    attendance_percentage: 70,
  },
];

describe('AttendanceDefaultersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listStudentsMock.mockResolvedValue({ items: mockStudents, total: 1, skip: 0, limit: 1000 });
    getDefaultersMock.mockResolvedValue(mockDefaulters);
  });

  it('renders the heading and threshold, with no results before loading a report', () => {
    renderWithDemoAdmin(<AttendanceDefaultersPage />);

    expect(screen.getByText('Attendance Defaulters Report')).toBeInTheDocument();
    expect(screen.getByText(/below threshold \(75%\)/)).toBeInTheDocument();
  });

  it('loads and displays defaulters when Load Report is clicked', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceDefaultersPage />);

    await user.click(screen.getByRole('button', { name: 'Load Report' }));

    await waitFor(() => {
      expect(screen.getByText('Critical Kid')).toBeInTheDocument();
    });

    expect(getDefaultersMock).toHaveBeenCalled();
    expect(screen.getByText('Medium Risk Kid')).toBeInTheDocument();
    expect(screen.getByText('37.5%')).toBeInTheDocument();
    expect(screen.getAllByText('Critical').length).toBeGreaterThan(0);
    expect(screen.getByText('Medium')).toBeInTheDocument();

    // Summary cards
    expect(screen.getByText('Total Defaulters')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('shows a success message when no defaulters are found', async () => {
    getDefaultersMock.mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceDefaultersPage />);

    await user.click(screen.getByRole('button', { name: 'Load Report' }));

    await waitFor(() => {
      expect(
        screen.getByText(/No defaulters found for the selected criteria/)
      ).toBeInTheDocument();
    });
  });

  it('shows an error message when the report fails to load', async () => {
    getDefaultersMock.mockRejectedValue({
      response: { data: { detail: 'Server exploded' } },
    });
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceDefaultersPage />);

    await user.click(screen.getByRole('button', { name: 'Load Report' }));

    await waitFor(() => {
      expect(screen.getByText('Server exploded')).toBeInTheDocument();
    });
  });

  it('populates the section filter with the grade name from student records and filters by it', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceDefaultersPage />);

    await waitFor(() => {
      expect(listStudentsMock).toHaveBeenCalled();
    });

    const sectionSelect = screen.getByLabelText('Section');
    await user.click(sectionSelect);
    const listbox = await screen.findByRole('listbox');
    // Regression test: option must show "<Grade> - <Section>", not just the
    // bare section name.
    await user.click(within(listbox).getByText('Grade 8 - A'));

    await user.click(screen.getByRole('button', { name: 'Load Report' }));

    await waitFor(() => {
      expect(getDefaultersMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        75,
        10,
        undefined
      );
    });
  });
});
