import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoStudent, screen, waitFor, userEvent } from '../../tests/test-utils';
import AppreciationWall from './AppreciationWall';
import type { RecognitionListResponse, Recognition, StudentSpotlight } from '@/types/recognition';

const showToastMock = vi.fn();

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: showToastMock,
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

const getPublicRecognitionsMock = vi.fn();
const getTrendingRecognitionsMock = vi.fn();
const getStudentSpotlightMock = vi.fn();
const likeRecognitionMock = vi.fn();
const unlikeRecognitionMock = vi.fn();
const flagRecognitionMock = vi.fn();

vi.mock('@/api/recognition', () => ({
  default: {
    getPublicRecognitions: (...args: unknown[]) => getPublicRecognitionsMock(...args),
    getTrendingRecognitions: (...args: unknown[]) => getTrendingRecognitionsMock(...args),
    getStudentSpotlight: (...args: unknown[]) => getStudentSpotlightMock(...args),
    likeRecognition: (...args: unknown[]) => likeRecognitionMock(...args),
    unlikeRecognition: (...args: unknown[]) => unlikeRecognitionMock(...args),
    flagRecognition: (...args: unknown[]) => flagRecognitionMock(...args),
  },
}));

const makeRecognition = (overrides: Partial<Recognition> = {}): Recognition => ({
  id: 1,
  sender_id: 10,
  sender_name: 'Alice Sender',
  recipient_id: 20,
  recipient_name: 'Bob Recipient',
  recognition_type: 'kindness',
  message: 'Thanks for helping me with my project!',
  is_public: true,
  likes_count: 3,
  is_liked_by_user: false,
  is_flagged: false,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  ...overrides,
});

const mockListResponse: RecognitionListResponse = {
  items: [
    makeRecognition({ id: 1 }),
    makeRecognition({
      id: 2,
      recipient_name: 'Carol Student',
      recognition_type: 'academic_excellence',
      message: 'Great job on the exam!',
      is_liked_by_user: true,
      likes_count: 7,
    }),
  ],
  total: 2,
  skip: 0,
  limit: 20,
};

const mockTrending: Recognition[] = [
  makeRecognition({ id: 3, recipient_name: 'Dana Trending', likes_count: 15 }),
];

const mockSpotlight: StudentSpotlight[] = [
  {
    student_id: 100,
    student_name: 'Eli Spotlight',
    recognition_count: 8,
    most_common_type: 'leadership',
    recent_recognitions: [],
  },
];

describe('AppreciationWall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPublicRecognitionsMock.mockResolvedValue(mockListResponse);
    getTrendingRecognitionsMock.mockResolvedValue(mockTrending);
    getStudentSpotlightMock.mockResolvedValue(mockSpotlight);
    likeRecognitionMock.mockResolvedValue({ likes_count: 4 });
    unlikeRecognitionMock.mockResolvedValue({ likes_count: 2 });
    flagRecognitionMock.mockResolvedValue(undefined);
  });

  it('renders the wall heading and loads public recognitions', async () => {
    renderWithDemoStudent(<AppreciationWall />);

    expect(screen.getByText('Appreciation Wall')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Bob Recipient')).toBeInTheDocument();
    });

    expect(screen.getByText('Carol Student')).toBeInTheDocument();
    expect(screen.getByText(/Thanks for helping me with my project!/)).toBeInTheDocument();
  });

  it('renders the trending and spotlight sidebar sections', async () => {
    renderWithDemoStudent(<AppreciationWall />);

    await waitFor(() => {
      expect(screen.getByText('Dana Trending')).toBeInTheDocument();
    });

    expect(screen.getByText('Eli Spotlight')).toBeInTheDocument();
    expect(screen.getByText(/8 recognitions/)).toBeInTheDocument();
  });

  it('shows an empty state message when there are no public recognitions', async () => {
    getPublicRecognitionsMock.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 20 });

    renderWithDemoStudent(<AppreciationWall />);

    await waitFor(() => {
      expect(screen.getByText('No public recognitions yet')).toBeInTheDocument();
    });
  });

  it('filters recognitions by type when a chip is clicked and refetches with the new filter', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AppreciationWall />);

    await waitFor(() => {
      expect(screen.getByText('Bob Recipient')).toBeInTheDocument();
    });

    getPublicRecognitionsMock.mockClear();

    // "Kindness" appears both as a filter chip and inside a recognition card's
    // type chip -- the filter chip is the first one rendered in the DOM.
    const kindnessChip = screen.getAllByText('Kindness')[0];
    await user.click(kindnessChip);

    await waitFor(() => {
      expect(getPublicRecognitionsMock).toHaveBeenCalledWith({ recognition_type: 'kindness' });
    });
  });

  it('likes a recognition when the like button is clicked', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AppreciationWall />);

    await waitFor(() => {
      expect(screen.getByText('Bob Recipient')).toBeInTheDocument();
    });

    const likeButtons = screen.getAllByLabelText('Like');
    await user.click(likeButtons[0]);

    await waitFor(() => {
      expect(likeRecognitionMock).toHaveBeenCalled();
    });
    expect(likeRecognitionMock.mock.calls[0][0]).toBe(1);
  });

  it('opens the flag dialog and submits a report', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<AppreciationWall />);

    await waitFor(() => {
      expect(screen.getByText('Bob Recipient')).toBeInTheDocument();
    });

    const flagButtons = screen.getAllByLabelText('Report inappropriate content');
    await user.click(flagButtons[0]);

    expect(screen.getByText('Report Recognition')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: 'Submit Report' });
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByText('Spam'));
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(flagRecognitionMock).toHaveBeenCalled();
    });
    expect(flagRecognitionMock.mock.calls[0][0]).toEqual({
      recognition_id: 1,
      reason: 'spam',
      description: '',
    });

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        'Recognition has been flagged for review',
        'success'
      );
    });
  });
});
