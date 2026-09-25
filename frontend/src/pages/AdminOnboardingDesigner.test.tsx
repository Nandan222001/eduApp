import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor, userEvent, within } from '../../tests/test-utils';
import AdminOnboardingDesigner from './AdminOnboardingDesigner';
import onboardingApi from '@/api/onboarding';
import type { OnboardingFlow } from '@/types/onboarding';

vi.mock('@/api/onboarding', () => ({
  default: {
    getFlowsByRole: vi.fn(),
    createFlow: vi.fn(),
    updateFlow: vi.fn(),
    getAnalytics: vi.fn(),
  },
}));

const studentFlow: OnboardingFlow = {
  id: 'flow-student-1',
  role: 'student',
  title: 'Student Welcome Flow',
  description: 'Onboarding for new students',
  steps: [
    {
      id: 'step-1',
      type: 'welcome',
      title: 'Welcome Message',
      order: 0,
      config: {},
      required: false,
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  isActive: true,
};

const teacherFlow: OnboardingFlow = {
  id: 'flow-teacher-1',
  role: 'teacher',
  title: 'Teacher Welcome Flow',
  description: 'Onboarding for new teachers',
  steps: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  isActive: false,
};

describe('AdminOnboardingDesigner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(onboardingApi.getFlowsByRole).mockImplementation(async (role) => {
      if (role === 'student') return [studentFlow];
      if (role === 'teacher') return [teacherFlow];
      return [];
    });
  });

  it('loads the student flow by default and lists its steps', async () => {
    renderWithDemoAdmin(<AdminOnboardingDesigner />);

    await waitFor(() => {
      expect(onboardingApi.getFlowsByRole).toHaveBeenCalledWith('student');
    });

    expect(await screen.findByText('Student Welcome Flow')).toBeInTheDocument();
    // "Welcome Message" appears in the component palette, as the step title, and as its type subtitle
    expect(screen.getAllByText('Welcome Message').length).toBe(3);
    expect(screen.getByText('1 steps')).toBeInTheDocument();
    // "Active" appears both as the status chip and the toggle's own label
    expect(screen.getAllByText('Active').length).toBe(2);
  });

  it('adds a step from the component palette and selects it for configuration', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AdminOnboardingDesigner />);

    await screen.findByText('Student Welcome Flow');

    await user.click(screen.getByText('Video'));

    expect(screen.getByText('2 steps')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('deletes a step from the flow', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AdminOnboardingDesigner />);

    await screen.findByText('Student Welcome Flow');

    // The second match is the step card in the flow area (the first is the sidebar palette item)
    const stepTitle = screen.getAllByText('Welcome Message')[1];
    const stepCard = stepTitle.closest('.MuiPaper-root') as HTMLElement;
    const deleteButton = within(stepCard).getAllByRole('button')[1];
    await user.click(deleteButton);

    expect(screen.getByText('No steps added yet')).toBeInTheDocument();
    expect(screen.getByText('0 steps')).toBeInTheDocument();
  });

  it('switches to the newly selected role flow instead of keeping the previous role flow selected (regression)', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AdminOnboardingDesigner />);

    await screen.findByText('Student Welcome Flow');

    // The role <Select> isn't associated with its "Role" label via
    // aria-labelledby (no labelId/id pair), so it has no accessible name;
    // it's targeted by its containing FormControl instead.
    const roleFormControl = screen
      .getAllByText('Role')[0]
      .closest('.MuiFormControl-root') as HTMLElement;
    await user.click(within(roleFormControl).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Teacher' }));

    await waitFor(() => {
      expect(onboardingApi.getFlowsByRole).toHaveBeenCalledWith('teacher');
    });

    expect(await screen.findByText('Teacher Welcome Flow')).toBeInTheDocument();
    expect(screen.queryByText('Student Welcome Flow')).not.toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('creates a new flow through the New Flow dialog', async () => {
    const user = userEvent.setup();
    const createdFlow: OnboardingFlow = {
      id: 'flow-student-2',
      role: 'student',
      title: 'Second Flow',
      description: 'Another flow',
      steps: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      isActive: false,
    };
    vi.mocked(onboardingApi.createFlow).mockResolvedValue(createdFlow);

    renderWithDemoAdmin(<AdminOnboardingDesigner />);
    await screen.findByText('Student Welcome Flow');

    await user.click(screen.getByRole('button', { name: /New Flow/i }));
    await user.type(screen.getByLabelText('Flow Title'), 'Second Flow');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onboardingApi.createFlow).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'student', title: 'Second Flow' })
      );
    });
    expect(await screen.findByText('Second Flow')).toBeInTheDocument();
  });

  it('shows an error alert when flows fail to load', async () => {
    vi.mocked(onboardingApi.getFlowsByRole).mockRejectedValue(new Error('network error'));

    renderWithDemoAdmin(<AdminOnboardingDesigner />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load onboarding flows')).toBeInTheDocument();
    });
  });
});
