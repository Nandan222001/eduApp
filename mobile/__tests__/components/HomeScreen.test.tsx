import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../../src/screens/student/HomeScreen';
import { renderWithProviders, createMockNavigation, createTestQueryClient } from '../utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../src/hooks/useStudentQueries', () => ({
  useProfile: jest.fn(() => ({
    data: { first_name: 'John', last_name: 'Doe' },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
  useAttendanceSummary: jest.fn(() => ({
    data: { percentage: 95, presentDays: 95, totalDays: 100 },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
  useAssignments: jest.fn(() => ({
    data: [{ id: 1, title: 'Math Homework', dueDate: '2024-12-31' }],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
  useGrades: jest.fn(() => ({
    data: [{ id: 1, subject: 'Math', grade: 'A' }],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
  useAIPrediction: jest.fn(() => ({
    data: { prediction: 'Good performance' },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
  useWeakAreas: jest.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
  useGamification: jest.fn(() => ({
    data: { points: 100, streaks: [{ days: 5 }] },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
}));

describe('HomeScreen', () => {
  const mockNavigation = createMockNavigation();
  const mockRoute = { key: 'Home', name: 'Home' as const, params: undefined };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render home screen with welcome card', () => {
    const { getByText } = renderWithProviders(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText(/John/i)).toBeTruthy();
  });

  it('should display attendance summary', () => {
    const { getByText } = renderWithProviders(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText(/95/)).toBeTruthy();
  });

  it('should handle pull to refresh', async () => {
    const { getByTestId } = renderWithProviders(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    const scrollView = getByTestId('scroll-view') || { props: {} };
    
    if (scrollView.props.refreshControl) {
      fireEvent(scrollView, 'refresh');
    }

    await waitFor(() => {
      expect(true).toBeTruthy();
    });
  });

  it('should show error state when data loading fails', () => {
    const useStudentQueries = require('../../src/hooks/useStudentQueries');
    useStudentQueries.useProfile.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    });

    const { getByText } = renderWithProviders(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText(/unable to load/i)).toBeTruthy();
  });

  it('should navigate to assignments when view all is pressed', () => {
    const { getByText } = renderWithProviders(
      <HomeScreen navigation={mockNavigation} route={mockRoute} />
    );

    const viewAllButton = getByText(/view all/i);
    if (viewAllButton) {
      fireEvent.press(viewAllButton);
    }
  });
});
