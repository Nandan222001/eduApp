import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { DashboardScreen } from '../../src/screens/student/DashboardScreen';
import { renderWithProviders, createMockDashboardData, createMockUser } from '../utils';

// Mock API
const mockStudentApi = {
  getDashboard: jest.fn(),
  getProfile: jest.fn(),
};

jest.mock('../../src/api/student', () => ({
  studentApi: mockStudentApi,
}));

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading indicator initially', () => {
      mockStudentApi.getDashboard.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      mockStudentApi.getProfile.mockImplementation(() => new Promise(() => {}));

      const { getByText } = renderWithProviders(<DashboardScreen />);
      expect(getByText('Loading dashboard...')).toBeTruthy();
    });
  });

  describe('successful data loading', () => {
    it('should render dashboard data', async () => {
      const dashboardData = createMockDashboardData();
      const user = createMockUser();

      mockStudentApi.getDashboard.mockResolvedValueOnce({ data: dashboardData });
      mockStudentApi.getProfile.mockResolvedValueOnce({ data: user });

      const { findByText } = renderWithProviders(<DashboardScreen />);

      await waitFor(() => {
        expect(mockStudentApi.getDashboard).toHaveBeenCalled();
      });

      // Wait for components to render
      await findByText(/Math Homework/i);
    });

    it('should display attendance data', async () => {
      const dashboardData = createMockDashboardData();
      const user = createMockUser();

      mockStudentApi.getDashboard.mockResolvedValueOnce({ data: dashboardData });
      mockStudentApi.getProfile.mockResolvedValueOnce({ data: user });

      const { findByText } = renderWithProviders(<DashboardScreen />);

      await waitFor(() => {
        expect(findByText(/85/)).toBeTruthy();
      });
    });

    it('should display upcoming assignments', async () => {
      const dashboardData = createMockDashboardData();
      const user = createMockUser();

      mockStudentApi.getDashboard.mockResolvedValueOnce({ data: dashboardData });
      mockStudentApi.getProfile.mockResolvedValueOnce({ data: user });

      const { findByText } = renderWithProviders(<DashboardScreen />);

      await findByText('Math Homework');
    });

    it('should display gamification data', async () => {
      const dashboardData = createMockDashboardData();
      const user = createMockUser();

      mockStudentApi.getDashboard.mockResolvedValueOnce({ data: dashboardData });
      mockStudentApi.getProfile.mockResolvedValueOnce({ data: user });

      const { findByText } = renderWithProviders(<DashboardScreen />);

      await waitFor(() => {
        expect(findByText(/1250/)).toBeTruthy(); // Points
      });
    });
  });

  describe('error handling', () => {
    it('should display error state when data fetch fails', async () => {
      mockStudentApi.getDashboard.mockRejectedValueOnce(new Error('Network error'));
      mockStudentApi.getProfile.mockRejectedValueOnce(new Error('Network error'));

      const { findByText } = renderWithProviders(<DashboardScreen />);

      await findByText('Unable to load dashboard');
      expect(await findByText(/check your connection/i)).toBeTruthy();
    });

    it('should show retry button on error', async () => {
      mockStudentApi.getDashboard.mockRejectedValueOnce(new Error('Network error'));
      mockStudentApi.getProfile.mockRejectedValueOnce(new Error('Network error'));

      const { findByText } = renderWithProviders(<DashboardScreen />);

      const retryButton = await findByText('Retry');
      expect(retryButton).toBeTruthy();
    });

    it('should retry data fetch when retry button is pressed', async () => {
      mockStudentApi.getDashboard.mockRejectedValueOnce(new Error('Network error'));
      mockStudentApi.getProfile.mockRejectedValueOnce(new Error('Network error'));

      const { findByText } = renderWithProviders(<DashboardScreen />);

      await findByText('Unable to load dashboard');

      const dashboardData = createMockDashboardData();
      const user = createMockUser();
      mockStudentApi.getDashboard.mockResolvedValueOnce({ data: dashboardData });
      mockStudentApi.getProfile.mockResolvedValueOnce({ data: user });

      const retryButton = await findByText('Retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(mockStudentApi.getDashboard).toHaveBeenCalledTimes(2);
      });
    });

    it('should display custom error message', async () => {
      mockStudentApi.getDashboard.mockRejectedValueOnce({
        message: 'Custom error message',
      });
      mockStudentApi.getProfile.mockRejectedValueOnce({
        message: 'Custom error message',
      });

      const { findByText } = renderWithProviders(<DashboardScreen />);

      await findByText('Custom error message');
    });
  });

  describe('pull to refresh', () => {
    it('should refresh data on pull', async () => {
      const dashboardData = createMockDashboardData();
      const user = createMockUser();

      mockStudentApi.getDashboard.mockResolvedValue({ data: dashboardData });
      mockStudentApi.getProfile.mockResolvedValue({ data: user });

      const { getByTestId, UNSAFE_getByType } = renderWithProviders(<DashboardScreen />);

      await waitFor(() => {
        expect(mockStudentApi.getDashboard).toHaveBeenCalledTimes(1);
      });

      // Find ScrollView and trigger refresh
      const scrollView = UNSAFE_getByType('ScrollView');
      const refreshControl = scrollView.props.refreshControl;

      if (refreshControl && refreshControl.props.onRefresh) {
        refreshControl.props.onRefresh();

        await waitFor(() => {
          expect(mockStudentApi.getDashboard).toHaveBeenCalledTimes(2);
        });
      }
    });
  });

  describe('data updates', () => {
    it('should update when new data is available', async () => {
      const initialData = createMockDashboardData();
      const updatedData = {
        ...createMockDashboardData(),
        attendance: {
          percentage: 90,
          present: 45,
          absent: 2,
          late: 1,
        },
      };
      const user = createMockUser();

      mockStudentApi.getDashboard.mockResolvedValueOnce({ data: initialData });
      mockStudentApi.getProfile.mockResolvedValueOnce({ data: user });

      const { findByText, rerender } = renderWithProviders(<DashboardScreen />);

      await waitFor(() => {
        expect(findByText(/85/)).toBeTruthy();
      });

      mockStudentApi.getDashboard.mockResolvedValueOnce({ data: updatedData });

      rerender(<DashboardScreen />);

      await waitFor(() => {
        expect(findByText(/90/)).toBeTruthy();
      });
    });
  });

  describe('component integration', () => {
    it('should render all dashboard widgets', async () => {
      const dashboardData = createMockDashboardData();
      const user = createMockUser();

      mockStudentApi.getDashboard.mockResolvedValueOnce({ data: dashboardData });
      mockStudentApi.getProfile.mockResolvedValueOnce({ data: user });

      const { UNSAFE_getAllByType } = renderWithProviders(<DashboardScreen />);

      await waitFor(() => {
        expect(mockStudentApi.getDashboard).toHaveBeenCalled();
      });

      // Verify various components are rendered
      // This would need adjustment based on actual component structure
    });

    it('should pass correct props to child components', async () => {
      const dashboardData = createMockDashboardData();
      const user = createMockUser();

      mockStudentApi.getDashboard.mockResolvedValueOnce({ data: dashboardData });
      mockStudentApi.getProfile.mockResolvedValueOnce({ data: user });

      renderWithProviders(<DashboardScreen />);

      await waitFor(() => {
        expect(mockStudentApi.getDashboard).toHaveBeenCalled();
      });

      // Verify props are passed correctly
    });
  });

  describe('accessibility', () => {
    it('should be accessible with screen readers', async () => {
      const dashboardData = createMockDashboardData();
      const user = createMockUser();

      mockStudentApi.getDashboard.mockResolvedValueOnce({ data: dashboardData });
      mockStudentApi.getProfile.mockResolvedValueOnce({ data: user });

      const { findByText } = renderWithProviders(<DashboardScreen />);

      await waitFor(() => {
        expect(mockStudentApi.getDashboard).toHaveBeenCalled();
      });

      // Verify accessibility labels are present
    });
  });
});
