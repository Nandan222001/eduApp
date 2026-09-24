import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor, userEvent, within } from '../../tests/test-utils';
import AttendanceSheetPage from './AttendanceSheetPage';
import { AttendanceStatus } from '@/api/attendance';
import type { StudentAttendanceReport, StudentAttendanceDetail } from '@/api/attendance';

const getSectionReportMock = vi.fn();
const getStudentDetailedReportMock = vi.fn();

vi.mock('@/api/attendance', async () => {
  const actual = await vi.importActual<typeof import('@/api/attendance')>('@/api/attendance');
  return {
    ...actual,
    default: {
      getSectionReport: (...args: unknown[]) => getSectionReportMock(...args),
      getStudentDetailedReport: (...args: unknown[]) => getStudentDetailedReportMock(...args),
    },
  };
});

const listStudentsMock = vi.fn();

vi.mock('@/api/students', () => ({
  default: {
    listStudents: (...args: unknown[]) => listStudentsMock(...args),
  },
}));

vi.mock('@/api/demoDataApi', () => ({
  isDemoUser: () => false,
  demoDataApi: { attendance: {} },
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

const mockReport: StudentAttendanceReport[] = [
  {
    student_id: 1,
    student_name: 'Alice One',
    admission_number: 'ADM-1',
    total_days: 20,
    present_days: 18,
    absent_days: 2,
    late_days: 0,
    half_days: 0,
    attendance_percentage: 90,
  },
];

const mockDetail: StudentAttendanceDetail = {
  student_id: 1,
  student_name: 'Alice One',
  attendances: [{ date: '2024-01-02', status: AttendanceStatus.PRESENT }],
  total_days: 20,
  present_days: 18,
  absent_days: 2,
  late_days: 0,
  half_days: 0,
  attendance_percentage: 90,
};

describe('AttendanceSheetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listStudentsMock.mockResolvedValue({ items: mockStudents, total: 1, skip: 0, limit: 1000 });
    getSectionReportMock.mockResolvedValue(mockReport);
    getStudentDetailedReportMock.mockResolvedValue(mockDetail);
  });

  it('renders the heading and stays empty before a section is loaded', () => {
    renderWithDemoAdmin(<AttendanceSheetPage />);

    expect(screen.getByText('Attendance Sheet')).toBeInTheDocument();
    expect(screen.queryByText('Summary Statistics')).not.toBeInTheDocument();
  });

  it('shows the section dropdown with the grade name from student records', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceSheetPage />);

    await waitFor(() => expect(listStudentsMock).toHaveBeenCalled());

    const sectionSelect = screen.getByLabelText('Section');
    await user.click(sectionSelect);
    const listbox = await screen.findByRole('listbox');
    // Regression test: option must show "<Grade> - <Section>", not "A" alone.
    expect(within(listbox).getByText('Grade 8 - A')).toBeInTheDocument();
  });

  it('loads and displays the monthly attendance heatmap for the selected section', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceSheetPage />);

    await waitFor(() => expect(listStudentsMock).toHaveBeenCalled());

    const sectionSelect = screen.getByLabelText('Section');
    await user.click(sectionSelect);
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Grade 8 - A'));

    await user.click(screen.getByRole('button', { name: 'Load Data' }));

    await waitFor(() => {
      expect(screen.getByText('Summary Statistics')).toBeInTheDocument();
    });

    expect(getSectionReportMock).toHaveBeenCalledWith(10, expect.any(String), expect.any(String), undefined);
    expect(screen.getAllByText('90%').length).toBeGreaterThan(0);
    expect(screen.getByText('Monthly Heatmap View')).toBeInTheDocument();
    expect(screen.getAllByText('Alice One').length).toBeGreaterThan(0);
  });

  it('shows an info message when no attendance data is returned', async () => {
    getSectionReportMock.mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceSheetPage />);

    await waitFor(() => expect(listStudentsMock).toHaveBeenCalled());

    const sectionSelect = screen.getByLabelText('Section');
    await user.click(sectionSelect);
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Grade 8 - A'));

    await user.click(screen.getByRole('button', { name: 'Load Data' }));

    await waitFor(() => {
      expect(
        screen.getByText(/No attendance data found for the selected period/)
      ).toBeInTheDocument();
    });
  });

  it('shows an error message when the report fails to load', async () => {
    getSectionReportMock.mockRejectedValue({ response: { data: { detail: 'Boom' } } });
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceSheetPage />);

    await waitFor(() => expect(listStudentsMock).toHaveBeenCalled());

    const sectionSelect = screen.getByLabelText('Section');
    await user.click(sectionSelect);
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Grade 8 - A'));

    await user.click(screen.getByRole('button', { name: 'Load Data' }));

    await waitFor(() => {
      expect(screen.getByText('Boom')).toBeInTheDocument();
    });
  });
});
