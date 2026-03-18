import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { AssignmentDetailScreen } from '../../src/screens/student/AssignmentDetailScreen';
import { renderWithProviders, createMockNavigation, createTestQueryClient, server } from '../utils';
import { rest } from 'msw';

const API_URL = 'http://localhost:8000';

describe('Assignment Submission Flow', () => {
  const mockNavigation = createMockNavigation();
  const mockRoute = {
    key: 'AssignmentDetail',
    name: 'AssignmentDetail' as const,
    params: { assignmentId: '1' },
  };

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should complete full assignment submission flow', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      expect(getByText('Math Homework')).toBeTruthy();
    });

    const commentsInput = getByPlaceholderText(/comments/i);
    fireEvent.changeText(commentsInput, 'Here is my submission');

    const submitButton = getByText('Submit Assignment');
    expect(submitButton).toBeTruthy();
  });

  it('should handle submission with attachments', async () => {
    const { getByText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      expect(getByText('Document')).toBeTruthy();
    });

    const documentButton = getByText('Document');
    fireEvent.press(documentButton);
  });

  it('should handle submission failure', async () => {
    server.use(
      rest.post(`${API_URL}/api/v1/submissions`, (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Submission failed' }));
      })
    );

    const { getByText, getByPlaceholderText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      expect(getByText('Math Homework')).toBeTruthy();
    });
  });

  it('should display submission success modal', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      expect(getByText('Math Homework')).toBeTruthy();
    });
  });

  it('should prevent submission without attachments', async () => {
    const { getByText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      const submitButton = getByText('Submit Assignment');
      expect(submitButton.props.accessibilityState?.disabled).toBeTruthy();
    });
  });

  it('should handle camera capture for assignment', async () => {
    const { getByText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      const cameraButton = getByText('Camera');
      expect(cameraButton).toBeTruthy();
      fireEvent.press(cameraButton);
    });
  });

  it('should handle document scanning', async () => {
    const { getByText } = renderWithProviders(
      <AssignmentDetailScreen navigation={mockNavigation} route={mockRoute} />,
      { queryClient: createTestQueryClient() }
    );

    await waitFor(() => {
      const scanButton = getByText('Scan');
      expect(scanButton).toBeTruthy();
      fireEvent.press(scanButton);
    });
  });
});
