import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoTeacher, screen, waitFor, userEvent, within } from '../../tests/test-utils';
import AttendanceMarkingPage from './AttendanceMarkingPage';
import { AttendanceStatus } from '@/api/attendance';

const listAttendancesMock = vi.fn();
const bulkMarkAttendanceMock = vi.fn();

vi.mock('@/api/attendance', async () => {
  const actual = await vi.importActual<typeof import('@/api/attendance')>('@/api/attendance');
  return {
    ...actual,
    default: {
      listAttendances: (...args: unknown[]) => listAttendancesMock(...args),
      bulkMarkAttendance: (...args: unknown[]) => bulkMarkAttendanceMock(...args),
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

const sectionStudents = [
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

const rosterStudents = [
  {
    id: 1,
    institution_id: 1,
    first_name: 'Alice',
    last_name: 'One',
    admission_number: 'ADM-1',
    roll_number: '1',
    status: 'active',
    is_active: true,
    created_at: '',
    updated_at: '',
    section: { id: 10, name: 'A', grade_id: 8, grade: { id: 8, name: 'Grade 8' } },
  },
  {
    id: 2,
    institution_id: 1,
    first_name: 'Bob',
    last_name: 'Two',
    admission_number: 'ADM-2',
    roll_number: '2',
    status: 'active',
    is_active: true,
    created_at: '',
    updated_at: '',
    section: { id: 10, name: 'A', grade_id: 8, grade: { id: 8, name: 'Grade 8' } },
  },
];

describe('AttendanceMarkingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // First call (loadSections) uses limit 1000/skip 0 with no section filter;
    // second call (loadStudents) filters by section_id.
    listStudentsMock.mockImplementation((params: { section_id?: number }) => {
      if (params.section_id) {
        return Promise.resolve({
          items: rosterStudents,
          total: rosterStudents.length,
          skip: 0,
          limit: 1000,
        });
      }
      return Promise.resolve({
        items: sectionStudents,
        total: sectionStudents.length,
        skip: 0,
        limit: 1000,
      });
    });
    listAttendancesMock.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 100 });
    bulkMarkAttendanceMock.mockResolvedValue({ success: 2, failed: 0, errors: [] });
  });

  const selectSection = async (user: ReturnType<typeof userEvent.setup>) => {
    const sectionSelect = screen.getByLabelText('Section');
    await user.click(sectionSelect);
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Grade 8 - A'));
  };

  it('renders the heading and shows the section dropdown with the grade name', async () => {
    const user = userEvent.setup();
    renderWithDemoTeacher(<AttendanceMarkingPage />);

    expect(screen.getByText('Mark Attendance')).toBeInTheDocument();

    await waitFor(() => {
      expect(listStudentsMock).toHaveBeenCalled();
    });

    const sectionSelect = screen.getByLabelText('Section');
    await user.click(sectionSelect);
    const listbox = await screen.findByRole('listbox');
    // Regression test: must show "<Grade> - <Section>", not just "A".
    expect(within(listbox).getByText('Grade 8 - A')).toBeInTheDocument();
  });

  it('loads the student roster once a section is selected and shows the summary counts', async () => {
    const user = userEvent.setup();
    renderWithDemoTeacher(<AttendanceMarkingPage />);

    await waitFor(() => {
      expect(listStudentsMock).toHaveBeenCalled();
    });

    await selectSection(user);

    await waitFor(() => {
      expect(screen.getByText('Alice One')).toBeInTheDocument();
    });

    expect(screen.getByText('Bob Two')).toBeInTheDocument();
    // Both students default to present since no existing attendance was returned.
    expect(screen.getByText('Present: 2')).toBeInTheDocument();
    expect(screen.getByText('Absent: 0')).toBeInTheDocument();
    expect(screen.getByText('Total: 2')).toBeInTheDocument();
  });

  it('marks all students absent via the bulk action button', async () => {
    const user = userEvent.setup();
    renderWithDemoTeacher(<AttendanceMarkingPage />);

    await waitFor(() => expect(listStudentsMock).toHaveBeenCalled());
    await selectSection(user);

    await waitFor(() => {
      expect(screen.getByText('Alice One')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Mark All Absent/i }));

    expect(screen.getByText('Absent: 2')).toBeInTheDocument();
    expect(screen.getByText('Present: 0')).toBeInTheDocument();
  });

  it('toggles a single student status using the per-row action icons', async () => {
    const user = userEvent.setup();
    renderWithDemoTeacher(<AttendanceMarkingPage />);

    await waitFor(() => expect(listStudentsMock).toHaveBeenCalled());
    await selectSection(user);

    await waitFor(() => {
      expect(screen.getByText('Alice One')).toBeInTheDocument();
    });

    const lateButtons = screen.getAllByLabelText('Late');
    await user.click(lateButtons[0]);

    expect(screen.getByText('Late: 1')).toBeInTheDocument();
    expect(screen.getByText('Present: 1')).toBeInTheDocument();
  });

  it('submits attendance through the confirmation dialog', async () => {
    const user = userEvent.setup();
    renderWithDemoTeacher(<AttendanceMarkingPage />);

    await waitFor(() => expect(listStudentsMock).toHaveBeenCalled());
    await selectSection(user);

    await waitFor(() => {
      expect(screen.getByText('Alice One')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Submit Attendance' }));

    expect(screen.getByText('Confirm Attendance Submission')).toBeInTheDocument();
    expect(screen.getByText(/Total Students:/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm & Submit' }));

    await waitFor(() => {
      expect(bulkMarkAttendanceMock).toHaveBeenCalled();
    });

    const submittedData = bulkMarkAttendanceMock.mock.calls[0][0];
    expect(submittedData.section_id).toBe(10);
    expect(submittedData.attendances).toHaveLength(2);
    expect(submittedData.attendances.every((a: { status: string }) => a.status === AttendanceStatus.PRESENT)).toBe(true);

    await waitFor(() => {
      expect(screen.getByText('Attendance marked successfully for 2 students!')).toBeInTheDocument();
    });
  });
});
