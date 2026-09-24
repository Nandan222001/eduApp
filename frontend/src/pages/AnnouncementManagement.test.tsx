import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor, userEvent, within } from '../../tests/test-utils';
import { AnnouncementManagement } from './AnnouncementManagement';
import { communicationsApi } from '../api/communications';
import { academicApi } from '../api/academic';
import type { Announcement } from '../types/communications';
import type { Grade } from '../types/academic';

vi.mock('../api/communications', () => ({
  communicationsApi: {
    getAnnouncements: vi.fn(),
    createAnnouncement: vi.fn(),
    updateAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
    publishAnnouncement: vi.fn(),
  },
}));

vi.mock('../api/academic', () => ({
  academicApi: {
    getGrades: vi.fn(),
  },
}));

const mockGrades: Grade[] = [
  {
    id: 1,
    institution_id: 1,
    name: 'Grade 9',
    display_order: 1,
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    institution_id: 1,
    created_by: 1,
    title: 'School Reopens Monday',
    content: 'Please make sure all students arrive on time for the new term.',
    audience_type: 'all',
    audience_filter: {},
    priority: 'high',
    channels: ['in_app', 'email'],
    is_published: true,
    published_at: '2024-01-10T09:00:00Z',
    created_at: '2024-01-09T09:00:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    created_by: 1,
    title: 'Draft: Sports Day Update',
    content: 'This is still being finalized before we announce it to parents.',
    audience_type: 'grade',
    audience_filter: { grade_ids: [1] },
    priority: 'medium',
    channels: ['in_app'],
    is_published: false,
    created_at: '2024-01-11T09:00:00Z',
  },
];

describe('AnnouncementManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(communicationsApi.getAnnouncements).mockResolvedValue(mockAnnouncements);
    vi.mocked(academicApi.getGrades).mockResolvedValue(mockGrades);
  });

  it('loads announcements and grades on mount and renders the summary counts', async () => {
    renderWithDemoAdmin(<AnnouncementManagement />);

    await waitFor(() => {
      expect(screen.getByText('School Reopens Monday')).toBeInTheDocument();
    });

    expect(communicationsApi.getAnnouncements).toHaveBeenCalled();
    expect(academicApi.getGrades).toHaveBeenCalledWith(true);

    expect(screen.getByText('Total Announcements')).toBeInTheDocument();
    expect(screen.getAllByText('2')[0]).toBeInTheDocument(); // total count
    // "Published"/"Drafts" appear both as summary card labels and as tab labels
    expect(screen.getAllByText('Published').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Drafts').length).toBeGreaterThan(0);
  });

  it('shows an error snackbar when loading announcements fails', async () => {
    vi.mocked(communicationsApi.getAnnouncements).mockRejectedValue(new Error('network down'));
    renderWithDemoAdmin(<AnnouncementManagement />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load announcements')).toBeInTheDocument();
    });
  });

  it('switches between All/Published/Drafts tabs', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AnnouncementManagement />);

    await waitFor(() => {
      expect(screen.getByText('School Reopens Monday')).toBeInTheDocument();
    });

    // "All Announcements" tab shows both
    expect(screen.getByText('School Reopens Monday')).toBeInTheDocument();
    expect(screen.getByText('Draft: Sports Day Update')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Published' }));
    await waitFor(() => {
      expect(screen.queryByText('Draft: Sports Day Update')).not.toBeInTheDocument();
    });
    expect(screen.getByText('School Reopens Monday')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Drafts' }));
    await waitFor(() => {
      expect(screen.queryByText('School Reopens Monday')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Draft: Sports Day Update')).toBeInTheDocument();
  });

  it('publishes a draft announcement from the All Announcements tab', async () => {
    const user = userEvent.setup();
    vi.mocked(communicationsApi.publishAnnouncement).mockResolvedValue({
      ...mockAnnouncements[1],
      is_published: true,
      published_at: '2024-01-12T09:00:00Z',
    });
    renderWithDemoAdmin(<AnnouncementManagement />);

    await waitFor(() => {
      expect(screen.getByText('School Reopens Monday')).toBeInTheDocument();
    });

    // The default "All Announcements" tab shows a Publish button for unpublished items.
    const publishButton = await screen.findByTitle('Publish');
    await user.click(publishButton);

    await waitFor(() => {
      expect(communicationsApi.publishAnnouncement).toHaveBeenCalledWith(2);
    });
    await waitFor(() => {
      expect(screen.getByText('Announcement published successfully')).toBeInTheDocument();
    });
  });

  it('creates a new announcement through the create dialog', async () => {
    const user = userEvent.setup();
    vi.mocked(communicationsApi.createAnnouncement).mockResolvedValue({
      id: 3,
      institution_id: 1,
      created_by: 1,
      title: 'New Announcement',
      content: 'Hello everyone',
      audience_type: 'all',
      audience_filter: {},
      priority: 'medium',
      channels: ['in_app'],
      is_published: false,
      created_at: '2024-01-13T09:00:00Z',
    });

    renderWithDemoAdmin(<AnnouncementManagement />);

    await waitFor(() => {
      expect(screen.getByText('School Reopens Monday')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create announcement/i }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^Title/), 'New Announcement');
    await user.type(within(dialog).getByLabelText(/^Content/), 'Hello everyone');

    await user.click(within(dialog).getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(communicationsApi.createAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Announcement', content: 'Hello everyone' })
      );
    });
    await waitFor(() => {
      expect(screen.getByText('Announcement created successfully')).toBeInTheDocument();
    });
  });

  it('deletes an announcement after confirming the browser confirm dialog', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(communicationsApi.deleteAnnouncement).mockResolvedValue(undefined);

    renderWithDemoAdmin(<AnnouncementManagement />);

    await waitFor(() => {
      expect(screen.getByText('School Reopens Monday')).toBeInTheDocument();
    });

    const row = screen.getByText('School Reopens Monday').closest('tr');
    expect(row).not.toBeNull();
    const deleteButton = within(row as HTMLElement).getAllByRole('button').slice(-1)[0];
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(communicationsApi.deleteAnnouncement).toHaveBeenCalledWith(1);
    });

    confirmSpy.mockRestore();
  });

  it('shows an empty state when there are no announcements', async () => {
    vi.mocked(communicationsApi.getAnnouncements).mockResolvedValue([]);
    renderWithDemoAdmin(<AnnouncementManagement />);

    await waitFor(() => {
      expect(
        screen.getByText(/No announcements found\. Click 'Create Announcement' to get started\./i)
      ).toBeInTheDocument();
    });
  });
});
