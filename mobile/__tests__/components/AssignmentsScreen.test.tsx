import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { AssignmentsScreen } from '../../src/screens/student/AssignmentsScreen';
import { renderWithProviders, createMockNavigation, createMockAssignment } from '../utils';

const mockAssignmentsApi = {
  getAssignments: jest.fn(),
};

jest.mock('../../src/api/assignments', () => ({
  assignmentsApi: mockAssignmentsApi,
}));

describe('AssignmentsScreen', () => {
  const mockNavigation = createMockNavigation();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render tabs for different assignment statuses', async () => {
      mockAssignmentsApi.getAssignments.mockResolvedValue({ data: [] });

      const { getByText } = renderWithProviders(<AssignmentsScreen navigation={mockNavigation} />);

      expect(getByText('Pending')).toBeTruthy();
      expect(getByText('Submitted')).toBeTruthy();
      expect(getByText('Graded')).toBeTruthy();
    });
  });

  describe('pending assignments', () => {
    it('should display pending assignments', async () => {
      const assignments = [
        createMockAssignment({ id: 1, title: 'Math Homework', status: 'pending' }),
        createMockAssignment({ id: 2, title: 'English Essay', status: 'pending' }),
      ];

      mockAssignmentsApi.getAssignments.mockResolvedValueOnce({ data: assignments });

      const { findByText } = renderWithProviders(<AssignmentsScreen navigation={mockNavigation} />);

      await findByText('Math Homework');
      await findByText('English Essay');
    });

    it('should show loading state while fetching', () => {
      mockAssignmentsApi.getAssignments.mockImplementation(() => new Promise(() => {}));

      const { getByText } = renderWithProviders(<AssignmentsScreen navigation={mockNavigation} />);

      expect(getByText('Loading assignments...')).toBeTruthy();
    });

    it('should show empty state when no assignments', async () => {
      mockAssignmentsApi.getAssignments.mockResolvedValueOnce({ data: [] });

      const { findByText } = renderWithProviders(<AssignmentsScreen navigation={mockNavigation} />);

      await findByText('No assignments found');
      await findByText('You have no pending assignments');
    });

    it('should display assignment details', async () => {
      const assignment = createMockAssignment({
        id: 1,
        title: 'Math Homework',
        subject: 'Mathematics',
        teacherName: 'Mr. Smith',
        totalMarks: 100,
        status: 'pending',
      });

      mockAssignmentsApi.getAssignments.mockResolvedValueOnce({ data: [assignment] });

      const { findByText } = renderWithProviders(<AssignmentsScreen navigation={mockNavigation} />);

      await findByText('Math Homework');
      await findByText('Mathematics');
      await findByText('Mr. Smith');
      await findByText(/100 marks/);
    });

    it('should navigate to assignment detail on press', async () => {
      const assignment = createMockAssignment({ id: 1, status: 'pending' });
      mockAssignmentsApi.getAssignments.mockResolvedValueOnce({ data: [assignment] });

      const { findByText } = renderWithProviders(<AssignmentsScreen navigation={mockNavigation} />);

      const assignmentCard = await findByText('Test Assignment');
      fireEvent.press(assignmentCard.parent?.parent || assignmentCard);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('AssignmentDetail', {
          assignmentId: '1',
        });
      });
    });
  });

  describe('submitted assignments', () => {
    it('should display submitted assignments when switching tabs', async () => {
      const pendingAssignments = [createMockAssignment({ id: 1, status: 'pending' })];
      const submittedAssignments = [
        createMockAssignment({ id: 2, title: 'Submitted Homework', status: 'submitted' }),
      ];

      mockAssignmentsApi.getAssignments
        .mockResolvedValueOnce({ data: pendingAssignments })
        .mockResolvedValueOnce({ data: submittedAssignments });

      const { findByText, getByText } = renderWithProviders(
        <AssignmentsScreen navigation={mockNavigation} />
      );

      await findByText('Test Assignment');

      fireEvent.press(getByText('Submitted'));

      await findByText('Submitted Homework');
    });

    it('should show empty state for submitted tab', async () => {
      mockAssignmentsApi.getAssignments
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] });

      const { findByText, getByText } = renderWithProviders(
        <AssignmentsScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('Submitted'));

      await findByText('You have not submitted any assignments yet');
    });
  });

  describe('graded assignments', () => {
    it('should display graded assignments with scores', async () => {
      const gradedAssignments = [
        createMockAssignment({
          id: 1,
          title: 'Graded Assignment',
          status: 'graded',
          totalMarks: 100,
          obtainedMarks: 85,
        }),
      ];

      mockAssignmentsApi.getAssignments
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: gradedAssignments });

      const { findByText, getByText } = renderWithProviders(
        <AssignmentsScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('Graded'));

      await findByText('Graded Assignment');
      await findByText(/85\/100 marks/);
    });

    it('should show empty state for graded tab', async () => {
      mockAssignmentsApi.getAssignments
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] });

      const { findByText, getByText } = renderWithProviders(
        <AssignmentsScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('Graded'));

      await findByText('No graded assignments available');
    });
  });

  describe('error handling', () => {
    it('should display error state on fetch failure', async () => {
      mockAssignmentsApi.getAssignments.mockRejectedValueOnce(new Error('Network error'));

      const { findByText } = renderWithProviders(<AssignmentsScreen navigation={mockNavigation} />);

      await findByText('Failed to load assignments');
      await findByText(/check your connection/i);
    });

    it('should show retry button on error', async () => {
      mockAssignmentsApi.getAssignments.mockRejectedValueOnce(new Error('Network error'));

      const { findByText } = renderWithProviders(<AssignmentsScreen navigation={mockNavigation} />);

      const retryText = await findByText(/retry/i);
      expect(retryText).toBeTruthy();
    });

    it('should retry fetch on button press', async () => {
      mockAssignmentsApi.getAssignments.mockRejectedValueOnce(new Error('Network error'));

      const { findByText, getByText } = renderWithProviders(
        <AssignmentsScreen navigation={mockNavigation} />
      );

      await findByText('Failed to load assignments');

      const assignments = [createMockAssignment({ id: 1 })];
      mockAssignmentsApi.getAssignments.mockResolvedValueOnce({ data: assignments });

      // Find and press retry button - may need adjustment based on actual implementation
      const retryButton = getByText(/retry/i);
      fireEvent.press(retryButton.parent || retryButton);

      await waitFor(() => {
        expect(mockAssignmentsApi.getAssignments).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('pull to refresh', () => {
    it('should refresh assignments on pull', async () => {
      const assignments = [createMockAssignment({ id: 1 })];
      mockAssignmentsApi.getAssignments.mockResolvedValue({ data: assignments });

      const { UNSAFE_getByType, findByText } = renderWithProviders(
        <AssignmentsScreen navigation={mockNavigation} />
      );

      await findByText('Test Assignment');
      expect(mockAssignmentsApi.getAssignments).toHaveBeenCalledTimes(1);

      // Find FlatList and trigger refresh
      const flatList = UNSAFE_getByType('FlatList');
      const refreshControl = flatList.props.refreshControl;

      if (refreshControl && refreshControl.props.onRefresh) {
        await refreshControl.props.onRefresh();

        await waitFor(() => {
          expect(mockAssignmentsApi.getAssignments).toHaveBeenCalledTimes(2);
        });
      }
    });
  });

  describe('assignment status badges', () => {
    it('should display correct badge for pending status', async () => {
      const assignment = createMockAssignment({ id: 1, status: 'pending' });
      mockAssignmentsApi.getAssignments.mockResolvedValueOnce({ data: [assignment] });

      const { findByText } = renderWithProviders(<AssignmentsScreen navigation={mockNavigation} />);

      await findByText('Pending');
    });

    it('should display correct badge for submitted status', async () => {
      const assignment = createMockAssignment({ id: 1, status: 'submitted' });
      mockAssignmentsApi.getAssignments
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [assignment] });

      const { findByText, getByText } = renderWithProviders(
        <AssignmentsScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('Submitted'));
      await findByText('Submitted');
    });

    it('should display correct badge for graded status', async () => {
      const assignment = createMockAssignment({ id: 1, status: 'graded' });
      mockAssignmentsApi.getAssignments
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [assignment] });

      const { findByText, getByText } = renderWithProviders(
        <AssignmentsScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('Graded'));
      await findByText('Graded');
    });

    it('should display overdue badge', async () => {
      const assignment = createMockAssignment({
        id: 1,
        status: 'overdue',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      });
      mockAssignmentsApi.getAssignments.mockResolvedValueOnce({ data: [assignment] });

      const { findByText } = renderWithProviders(<AssignmentsScreen navigation={mockNavigation} />);

      await findByText('Overdue');
    });
  });

  describe('date formatting', () => {
    it('should format due date correctly', async () => {
      const dueDate = new Date('2024-12-31T23:59:00');
      const assignment = createMockAssignment({
        id: 1,
        dueDate: dueDate.toISOString(),
      });
      mockAssignmentsApi.getAssignments.mockResolvedValueOnce({ data: [assignment] });

      const { findByText } = renderWithProviders(<AssignmentsScreen navigation={mockNavigation} />);

      // Verify date is displayed (format may vary)
      await findByText(/Dec 31, 2024/i);
    });
  });
});
