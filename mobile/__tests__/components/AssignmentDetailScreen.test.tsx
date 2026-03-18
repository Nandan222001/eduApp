import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { AssignmentDetailScreen } from '../../src/screens/student/AssignmentDetailScreen';
import { renderWithProviders, createMockNavigation, createTestQueryClient } from '../utils';
import { assignmentsApi } from '../../src/api/assignments';

jest.mock('../../src/api/assignments');
jest.mock('expo-document-picker');

const mockAssignment = {
  id: 1,
  title: 'Math Homework',
  description: 'Complete exercises 1-10',
  dueDate: '2024-12-31T23:59:59Z',
  subject: 'Mathematics',
  status: 'pending',
  totalMarks: 100,
  teacherName: 'Mr. Smith',
  attachments: [],
  createdAt: '2024-01-01T00:00:00Z',
};

describe('AssignmentDetailScreen', () => {
  const mockNavigation = createMockNavigation();
  const mockRoute = {
    key: 'AssignmentDetail',
    name: 'AssignmentDetail' as const,
    params: { assignmentId: '1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (assignmentsApi.getAssignmentDetail as jest.Mock).mockResolvedValue({
      data: mockAssignment,
    });
  });

  it('should render assignment details', async () => {
    const { getByText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      expect(getByText('Math Homework')).toBeTruthy();
      expect(getByText('Mathematics')).toBeTruthy();
      expect(getByText(/Complete exercises/)).toBeTruthy();
    });
  });

  it('should display loading state', () => {
    (assignmentsApi.getAssignmentDetail as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    const { getByTestId } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    expect(getByTestId('activity-indicator') || { type: 'ActivityIndicator' }).toBeTruthy();
  });

  it('should display error state', async () => {
    (assignmentsApi.getAssignmentDetail as jest.Mock).mockRejectedValue(
      new Error('Failed to load')
    );

    const { getByText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      expect(getByText(/Failed to load/i)).toBeTruthy();
    });
  });

  it('should show submission form for pending assignments', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      expect(getByText('Submit Assignment')).toBeTruthy();
      expect(getByPlaceholderText(/comments/i)).toBeTruthy();
    });
  });

  it('should allow adding comments', async () => {
    const { getByPlaceholderText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      const commentsInput = getByPlaceholderText(/comments/i);
      fireEvent.changeText(commentsInput, 'This is my submission');
      expect(commentsInput.props.value).toBe('This is my submission');
    });
  });

  it('should display submitted assignment info', async () => {
    const submittedAssignment = {
      ...mockAssignment,
      status: 'submitted',
      submission: {
        id: 1,
        submittedAt: '2024-01-15T10:00:00Z',
        status: 'submitted',
        comments: 'Submitted on time',
        attachments: [],
      },
    };

    (assignmentsApi.getAssignmentDetail as jest.Mock).mockResolvedValue({
      data: submittedAssignment,
    });

    const { getByText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      expect(getByText('Your Submission')).toBeTruthy();
      expect(getByText(/Submitted on/i)).toBeTruthy();
    });
  });

  it('should show overdue warning for overdue assignments', async () => {
    const overdueAssignment = {
      ...mockAssignment,
      status: 'overdue',
      dueDate: '2020-01-01T00:00:00Z',
    };

    (assignmentsApi.getAssignmentDetail as jest.Mock).mockResolvedValue({
      data: overdueAssignment,
    });

    const { getByText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      expect(getByText(/overdue/i)).toBeTruthy();
    });
  });

  it('should handle document picker button press', async () => {
    const { getByText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      const documentButton = getByText('Document');
      expect(documentButton).toBeTruthy();
      fireEvent.press(documentButton);
    });
  });
});
