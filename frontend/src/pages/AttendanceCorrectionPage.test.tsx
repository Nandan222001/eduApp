import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor, userEvent, within } from '../../tests/test-utils';
import AttendanceCorrectionPage from './AttendanceCorrectionPage';
import { AttendanceStatus, CorrectionStatus } from '@/api/attendance';
import type { Attendance, AttendanceCorrectionResponse } from '@/api/attendance';

const listAttendancesMock = vi.fn();
const listCorrectionsMock = vi.fn();
const requestCorrectionMock = vi.fn();

vi.mock('@/api/attendance', async () => {
  const actual = await vi.importActual<typeof import('@/api/attendance')>('@/api/attendance');
  return {
    ...actual,
    default: {
      listAttendances: (...args: unknown[]) => listAttendancesMock(...args),
      listCorrections: (...args: unknown[]) => listCorrectionsMock(...args),
      requestCorrection: (...args: unknown[]) => requestCorrectionMock(...args),
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
  {
    id: 2,
    institution_id: 1,
    first_name: 'B',
    last_name: 'Two',
    status: 'active',
    is_active: true,
    created_at: '',
    updated_at: '',
    section: { id: 11, name: 'B', grade_id: 9, grade: { id: 9, name: 'Grade 9' } },
  },
];

const mockAttendances: Attendance[] = [
  {
    id: 100,
    institution_id: 1,
    student_id: 1,
    section_id: 10,
    date: '2024-01-15',
    status: AttendanceStatus.ABSENT,
    remarks: 'Sick leave',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

const mockCorrections: AttendanceCorrectionResponse[] = [
  {
    id: 5,
    institution_id: 1,
    attendance_id: 100,
    old_status: AttendanceStatus.ABSENT,
    new_status: AttendanceStatus.PRESENT,
    reason: 'Marked absent by mistake',
    status: CorrectionStatus.PENDING,
    created_at: '2024-01-16T00:00:00Z',
    updated_at: '2024-01-16T00:00:00Z',
  },
];

describe('AttendanceCorrectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listStudentsMock.mockResolvedValue({ items: mockStudents, total: 2, skip: 0, limit: 1000 });
    listAttendancesMock.mockResolvedValue({
      items: mockAttendances,
      total: 1,
      skip: 0,
      limit: 100,
    });
    listCorrectionsMock.mockResolvedValue({
      items: mockCorrections,
      total: 1,
      skip: 0,
      limit: 100,
    });
    requestCorrectionMock.mockResolvedValue(mockCorrections[0]);
  });

  it('renders the heading and existing correction requests', async () => {
    renderWithDemoAdmin(<AttendanceCorrectionPage />);

    expect(screen.getByText('Attendance Corrections')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Request #5')).toBeInTheDocument();
    });

    expect(screen.getByText(/Marked absent by mistake/)).toBeInTheDocument();
  });

  it('shows an empty state when there are no correction requests', async () => {
    listCorrectionsMock.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 100 });

    renderWithDemoAdmin(<AttendanceCorrectionPage />);

    await waitFor(() => {
      expect(screen.getByText('No correction requests found')).toBeInTheDocument();
    });
  });

  it('populates the section dropdown with the grade name from each student record', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceCorrectionPage />);

    await waitFor(() => {
      expect(listStudentsMock).toHaveBeenCalled();
    });

    const sectionSelect = screen.getByLabelText('Section');
    await user.click(sectionSelect);

    const listbox = await screen.findByRole('listbox');
    // Regression test: the section options must show "<Grade> - <Section>",
    // not just the bare section name, so sections with the same name across
    // different grades stay distinguishable.
    expect(within(listbox).getByText('Grade 8 - A')).toBeInTheDocument();
    expect(within(listbox).getByText('Grade 9 - B')).toBeInTheDocument();
  });

  it('loads attendance records for the selected section and date', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceCorrectionPage />);

    await waitFor(() => {
      expect(listStudentsMock).toHaveBeenCalled();
    });

    const sectionSelect = screen.getByLabelText('Section');
    await user.click(sectionSelect);
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Grade 8 - A'));

    await user.click(screen.getByRole('button', { name: 'Load Records' }));

    await waitFor(() => {
      expect(listAttendancesMock).toHaveBeenCalledWith(
        expect.objectContaining({ section_id: 10 })
      );
    });

    expect(screen.getByText('ABSENT')).toBeInTheDocument();
    expect(screen.getByText('Sick leave')).toBeInTheDocument();
  });

  it('submits a correction request through the dialog', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithDemoAdmin(<AttendanceCorrectionPage />);

    await waitFor(() => {
      expect(listStudentsMock).toHaveBeenCalled();
    });

    const sectionSelect = screen.getByLabelText('Section');
    await user.click(sectionSelect);
    let listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Grade 8 - A'));
    await user.click(screen.getByRole('button', { name: 'Load Records' }));

    await waitFor(() => {
      expect(screen.getByText('Sick leave')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Request Correction'));

    expect(screen.getByText('Request Attendance Correction')).toBeInTheDocument();

    // Submit is disabled until a reason is provided.
    const submitButton = screen.getByRole('button', { name: 'Submit Request' });
    expect(submitButton).toBeDisabled();

    const reasonField = screen.getByLabelText(/Reason for Correction/);
    await user.type(reasonField, 'Student was actually present, teacher error.');
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(requestCorrectionMock).toHaveBeenCalled();
    });
    expect(requestCorrectionMock.mock.calls[0][0]).toMatchObject({
      attendance_id: 100,
      reason: 'Student was actually present, teacher error.',
    });

    await waitFor(() => {
      expect(screen.getByText('Correction request submitted successfully!')).toBeInTheDocument();
    });
  });
});
