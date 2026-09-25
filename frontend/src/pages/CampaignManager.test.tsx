import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoStudent, screen, waitFor, userEvent } from '../../tests/test-utils';
import CampaignManager from './CampaignManager';
import type { PosterTemplate } from '@/types/elections';

const getElectionsMock = vi.fn();
const getPosterTemplatesMock = vi.fn();
const updateCandidateMock = vi.fn();
const uploadPosterMock = vi.fn();
const uploadVideoMock = vi.fn();
const getCampaignAnalyticsMock = vi.fn();

vi.mock('@/api/elections', () => ({
  default: {
    getElections: (...args: unknown[]) => getElectionsMock(...args),
    getPosterTemplates: (...args: unknown[]) => getPosterTemplatesMock(...args),
    updateCandidate: (...args: unknown[]) => updateCandidateMock(...args),
    uploadPoster: (...args: unknown[]) => uploadPosterMock(...args),
    uploadVideo: (...args: unknown[]) => uploadVideoMock(...args),
    getCampaignAnalytics: (...args: unknown[]) => getCampaignAnalyticsMock(...args),
  },
}));

// chart.js needs a real canvas 2D context and ResizeObserver, neither of which
// jsdom provides; charts aren't the behavior under test here.
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart" />,
  Bar: () => <div data-testid="mock-bar-chart" />,
}));

const mockTemplates: PosterTemplate[] = [
  {
    id: '1',
    name: 'Classic Blue',
    thumbnail_url: '/templates/blue.png',
    template_data: { background: '#1976d2' },
  },
];

describe('CampaignManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getElectionsMock.mockResolvedValue([]);
    getPosterTemplatesMock.mockResolvedValue(mockTemplates);
  });

  it('renders the heading and tabs once loading completes', async () => {
    renderWithDemoStudent(<CampaignManager />);

    await waitFor(() => {
      expect(screen.getByText('Campaign Manager')).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /Profile Editor/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Platform Builder/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Analytics/i })).toBeInTheDocument();
    expect(getElectionsMock).toHaveBeenCalled();
  });

  it('does not save a profile when no candidate record has loaded (no candidate API wired up yet)', async () => {
    // NOTE: fetchCandidateData() only calls getElections() and never calls
    // setCandidate(), so `candidate` stays null for the life of this page.
    // handleSaveProfile() correctly no-ops in that case; this test documents
    // that actual (if incomplete) behavior rather than an ideal one.
    const user = userEvent.setup();
    renderWithDemoStudent(<CampaignManager />);

    await waitFor(() => {
      expect(screen.getByText('Campaign Manager')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Campaign Slogan'), 'Vote for me!');
    await user.click(screen.getByRole('button', { name: 'Save Profile' }));

    expect(updateCandidateMock).not.toHaveBeenCalled();
  });

  it('adds and removes platform points on the Platform Builder tab', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<CampaignManager />);

    await waitFor(() => {
      expect(screen.getByText('Campaign Manager')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /Platform Builder/i }));

    expect(screen.getByLabelText('Platform Point 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Platform Point 2')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add Point' }));
    expect(screen.getByLabelText('Platform Point 2')).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: '' });
    // Only the delete IconButtons render with no accessible name here; click
    // the first one to remove "Platform Point 1".
    await user.click(removeButtons[0]);

    expect(screen.queryByLabelText('Platform Point 2')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Platform Point 1')).toBeInTheDocument();
  });

  it('renders fetched poster templates on the Poster tab', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<CampaignManager />);

    await waitFor(() => {
      expect(screen.getByText('Campaign Manager')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /^Poster/i }));

    await waitFor(() => {
      expect(screen.getByText('Classic Blue')).toBeInTheDocument();
    });
  });

  it('shows analytics stat cards defaulting to zero when no candidate/analytics data exists', async () => {
    const user = userEvent.setup();
    renderWithDemoStudent(<CampaignManager />);

    await waitFor(() => {
      expect(screen.getByText('Campaign Manager')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /Analytics/i }));

    expect(screen.getByText('Profile Views')).toBeInTheDocument();
    expect(screen.getAllByText('Endorsements').length).toBeGreaterThan(0);
    expect(screen.getByText('Poster Downloads')).toBeInTheDocument();
    expect(screen.getByText('Video Plays')).toBeInTheDocument();
    // analytics stays null since fetchAnalytics() is only ever triggered when
    // a candidate is present, so every stat card falls back to 0.
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(4);
    expect(getCampaignAnalyticsMock).not.toHaveBeenCalled();
  });
});
