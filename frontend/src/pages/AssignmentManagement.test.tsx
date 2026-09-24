import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor, userEvent, within } from '../../tests/test-utils';
import AssignmentManagement from './AssignmentManagement';
import { AssignmentStatus, SubmissionStatus } from '@/types/assignment';
import type { Assignment, Submission } from '@/types/assignment';

const listMock = vi.fn();
const getMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();
const listSubmissionsMock = vi.fn();
const getStatisticsMock = vi.fn();
const getAnalyticsMock = vi.fn();
const gradeMock = vi.fn();

vi.mock('@/api/assignments', () => ({
  assignmentApi: {
    list: (...args: unknown[]) => listMock(...args),
    get: (...args: unknown[]) => getMock(...args),
    create: (...args: unknown[]) => createMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
    listSubmissions: (...args: unknown[]) => listSubmissionsMock(...args),
    getStatistics: (...args: unknown[]) => getStatisticsMock(...args),
    getAnalytics: (...args: unknown[]) => getAnalyticsMock(...args),
  },
  submissionApi: {
    grade: (...args: unknown[]) => gradeMock(...args),
  },
}));

const listSubjectsMock = vi.fn();

vi.mock('@/api/subjects', () => ({
  default: {
    listSubjects: (...args: unknown[]) => listSubjectsMock(...args),
  },
}));

const makeAssignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  id: 1,
  institution_id: 1,
  teacher_id: 1,
  grade_id: 8,
  section_id: 1,
  subject_id: 1,
  title: 'Algebra Homework',
  description: 'Solve chapter 4 exercises',
  due_date: '2024-02-01T00:00:00Z',
  max_marks: 100,
  passing_marks: 40,
  allow_late_submission: false,
  max_file_size_mb: 10,
  status: AssignmentStatus.PUBLISHED,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const mockAssignments: Assignment[] = [
  makeAssignment({ id: 1, title: 'Algebra Homework' }),
  makeAssignment({ id: 2, title: 'Science Lab Report', status: AssignmentStatus.DRAFT, subject_id: 2 }),
];

const mockSubjects = [
  { id: 1, institution_id: 1, name: 'Mathematics', code: 'MATH', is_elective: false, is_active: true, created_at: '', updated_at: '' },
  { id: 2, institution_id: 1, name: 'Science', code: 'SCI', is_elective: false, is_active: true, created_at: '', updated_at: '' },
];

const mockSubmissions: Submission[] = [
  {
    id: 11,
    assignment_id: 1,
    student_id: 501,
    submitted_at: '2024-01-20T00:00:00Z',
    is_late: false,
    status: SubmissionStatus.SUBMITTED,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
    student_name: 'Jane Student',
    student_roll_number: '21',
  },
];

describe('AssignmentManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMock.mockResolvedValue({ items: mockAssignments, total: mockAssignments.length });
    listSubjectsMock.mockResolvedValue({ items: mockSubjects, total: 2, skip: 0, limit: 100 });
    listSubmissionsMock.mockResolvedValue({ items: mockSubmissions });
    getStatisticsMock.mockResolvedValue({
      total_submissions: 20,
      graded_count: 15,
      pending_count: 5,
      submission_rate: 0.8,
    });
    getAnalyticsMock.mockResolvedValue({
      average_marks: 78.456,
      pass_count: 18,
      fail_count: 2,
      highest_marks: 100,
    });
    deleteMock.mockResolvedValue(undefined);
    createMock.mockResolvedValue(makeAssignment());
    updateMock.mockResolvedValue(makeAssignment());
    gradeMock.mockResolvedValue({});
  });

  it('renders the heading and the list of assignments from the API', async () => {
    renderWithDemoAdmin(<AssignmentManagement />);

    expect(screen.getByText('Assignment Management')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Algebra Homework')).toBeInTheDocument();
    });

    expect(screen.getByText('Science Lab Report')).toBeInTheDocument();
    expect(listMock).toHaveBeenCalled();
  });

  it('shows an empty state when there are no assignments', async () => {
    listMock.mockResolvedValue({ items: [], total: 0 });

    renderWithDemoAdmin(<AssignmentManagement />);

    await waitFor(() => {
      expect(screen.getByText('No assignments found')).toBeInTheDocument();
    });
  });

  it('re-fetches assignments with a search term when the search field changes', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AssignmentManagement />);

    await waitFor(() => {
      expect(screen.getByText('Algebra Homework')).toBeInTheDocument();
    });

    listMock.mockClear();
    const searchInput = screen.getByPlaceholderText('Search assignments...');
    await user.type(searchInput, 'algebra');

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'algebra' }));
    });
  });

  it('switches to the Submissions tab and shows submissions when View is clicked', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AssignmentManagement />);

    await waitFor(() => {
      expect(screen.getByText('Algebra Homework')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button', { name: 'View' });
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(listSubmissionsMock).toHaveBeenCalledWith(1);
    });

    expect(screen.getByText('Jane Student')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
  });

  it('grades a submission through the grading dialog', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AssignmentManagement />);

    await waitFor(() => {
      expect(screen.getByText('Algebra Homework')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button', { name: 'View' });
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Jane Student')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Grade' }));

    expect(screen.getByText('Grade Submission')).toBeInTheDocument();

    // The label includes a required-field asterisk in its accessible name
    // ("Marks Obtained *"), so match with a regex rather than an exact string.
    const marksInput = screen.getByLabelText(/Marks Obtained/);
    await user.clear(marksInput);
    await user.type(marksInput, '85');

    await user.click(screen.getByRole('button', { name: 'Submit Grade' }));

    await waitFor(() => {
      expect(gradeMock).toHaveBeenCalled();
    });
    expect(gradeMock.mock.calls[0][0]).toBe(11);
    expect(gradeMock.mock.calls[0][1]).toMatchObject({ marks_obtained: 85 });
  });

  it('shows the analytics tab with statistics once an assignment is selected via the row menu', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AssignmentManagement />);

    await waitFor(() => {
      expect(screen.getByText('Algebra Homework')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    const menuButton = within(firstDataRow).getByRole('button', { name: '' });
    await user.click(menuButton);

    await user.click(screen.getByText('View Analytics'));

    await waitFor(() => {
      expect(getStatisticsMock).toHaveBeenCalledWith(1);
    });
    expect(getAnalyticsMock).toHaveBeenCalledWith(1);

    await waitFor(() => {
      expect(screen.getByText('Analytics for Algebra Homework')).toBeInTheDocument();
    });

    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('78.5')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('deletes an assignment after confirming the delete dialog', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AssignmentManagement />);

    await waitFor(() => {
      expect(screen.getByText('Algebra Homework')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    const menuButton = within(firstDataRow).getByRole('button', { name: '' });
    await user.click(menuButton);
    await user.click(screen.getByText('Delete'));

    expect(screen.getByText('Delete Assignment')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith(1);
    });
  });
});
