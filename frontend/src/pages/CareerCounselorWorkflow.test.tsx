import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoTeacher, screen, waitFor, userEvent } from '../../tests/test-utils';
import CareerCounselorWorkflow from './CareerCounselorWorkflow';
import type { StudentJobListing, StudentEmployment } from '@/types/employment';

const listJobListingsMock = vi.fn();
const getPendingEmploymentVerificationsMock = vi.fn();
const updateJobListingMock = vi.fn();
const verifyEmploymentForGraduationMock = vi.fn();

vi.mock('@/api/employment', () => ({
  default: {
    listJobListings: (...args: unknown[]) => listJobListingsMock(...args),
    getPendingEmploymentVerifications: (...args: unknown[]) =>
      getPendingEmploymentVerificationsMock(...args),
    updateJobListing: (...args: unknown[]) => updateJobListingMock(...args),
    verifyEmploymentForGraduation: (...args: unknown[]) =>
      verifyEmploymentForGraduationMock(...args),
  },
}));

const unverifiedListing: StudentJobListing = {
  id: 1,
  institution_id: 1,
  employer_name: 'Corner Cafe',
  job_title: 'Barista',
  job_type: 'part_time',
  description: 'Serve coffee to customers.',
  hours_per_week: 15,
  employer_verified: false,
  application_count: 3,
  is_active: false,
  posting_date: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const verifiedListing: StudentJobListing = {
  ...unverifiedListing,
  id: 2,
  employer_verified: true,
  is_active: true,
};

const pendingEmployment: StudentEmployment = {
  id: 5,
  institution_id: 1,
  student_id: 100,
  employer: 'Book Shop',
  job_title: 'Shelf Stocker',
  job_type: 'part_time',
  start_date: '2024-01-01',
  hours_per_week: 10,
  is_current: true,
  is_active: true,
  verified_for_graduation: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('CareerCounselorWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listJobListingsMock.mockResolvedValue([unverifiedListing, verifiedListing]);
    getPendingEmploymentVerificationsMock.mockResolvedValue([pendingEmployment]);
    updateJobListingMock.mockResolvedValue(unverifiedListing);
    verifyEmploymentForGraduationMock.mockResolvedValue(undefined);
  });

  it('renders the heading and summary stat cards from the fetched data', async () => {
    renderWithDemoTeacher(<CareerCounselorWorkflow />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Career Counselor Workflow' })).toBeInTheDocument();
    });

    expect(screen.getByText('Pending Job Reviews')).toBeInTheDocument();
    expect(screen.getByText('Pending Verifications')).toBeInTheDocument();
    expect(screen.getByText('Active Jobs')).toBeInTheDocument();

    // 1 unverified listing, 1 pending verification, 1 active+verified listing.
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(3);
  });

  it('lists the unverified job listing with its risk assessment and opens the review dialog', async () => {
    const user = userEvent.setup();
    renderWithDemoTeacher(<CareerCounselorWorkflow />);

    await waitFor(() => {
      expect(screen.getByText('Barista')).toBeInTheDocument();
    });

    // The verified listing should not appear in the pending-review table.
    expect(screen.queryAllByText('Corner Cafe')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /Review/i }));

    expect(screen.getByText('Review Job Listing')).toBeInTheDocument();
    expect(screen.getByText(/Age Appropriateness:/)).toBeInTheDocument();
  });

  it('approves a job listing from the review dialog', async () => {
    const user = userEvent.setup();
    renderWithDemoTeacher(<CareerCounselorWorkflow />);

    await waitFor(() => {
      expect(screen.getByText('Barista')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Review/i }));
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    // Regression test: clicking Approve/Reject used to set `reviewDecision`
    // via setState and then immediately call handleSubmitJobReview() in the
    // same synchronous handler, which read the *stale* (still-null) state
    // value and bailed out without ever calling the API. Approve/Reject must
    // actually submit the review.
    await waitFor(() => {
      expect(updateJobListingMock).toHaveBeenCalledWith(1, {
        employer_verified: true,
        is_active: true,
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('Review Job Listing')).not.toBeInTheDocument();
    });
  });

  it('rejects a job listing from the review dialog', async () => {
    const user = userEvent.setup();
    renderWithDemoTeacher(<CareerCounselorWorkflow />);

    await waitFor(() => {
      expect(screen.getByText('Barista')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Review/i }));
    await user.click(screen.getByRole('button', { name: 'Reject' }));

    await waitFor(() => {
      expect(updateJobListingMock).toHaveBeenCalledWith(1, {
        employer_verified: false,
        is_active: false,
      });
    });
  });

  it('switches to the Employment Verification tab and verifies an employment record', async () => {
    const user = userEvent.setup();
    renderWithDemoTeacher(<CareerCounselorWorkflow />);

    await waitFor(() => {
      expect(screen.getByText('Barista')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Employment Verification' }));

    expect(screen.getByText('Shelf Stocker')).toBeInTheDocument();
    expect(screen.getByText('Book Shop')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(verifyEmploymentForGraduationMock).toHaveBeenCalledWith(5, true, '');
    });
  });

  it('shows an error message when the initial data fetch fails', async () => {
    listJobListingsMock.mockRejectedValue(new Error('network error'));
    renderWithDemoTeacher(<CareerCounselorWorkflow />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });
});
