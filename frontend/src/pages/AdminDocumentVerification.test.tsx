import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithDemoAdmin, screen, waitFor, userEvent, within } from '../../tests/test-utils';
import AdminDocumentVerification from './AdminDocumentVerification';
import { documentVaultApi } from '@/api/documentVault';
import { DocumentStatus, DocumentType, Document } from '@/types/documentVault';

vi.mock('@/api/documentVault', () => ({
  documentVaultApi: {
    getVaultStats: vi.fn(),
    getDocuments: vi.fn(),
    verifyDocument: vi.fn(),
  },
}));

const baseDoc = {
  child_id: 1,
  document_type: DocumentType.OTHER,
  encrypted_file_url: '/encrypted/file',
  file_name: 'file.pdf',
  file_size: 1024,
  file_type: 'pdf',
  is_verified: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockDocuments: Document[] = [
  {
    ...baseDoc,
    id: 1,
    child_name: 'Emma Doe',
    title: 'Immunization Record',
    file_name: 'immunization.pdf',
    status: DocumentStatus.PENDING,
  },
  {
    ...baseDoc,
    id: 2,
    child_name: 'Liam Smith',
    title: 'Birth Certificate',
    file_name: 'birth-certificate.pdf',
    status: DocumentStatus.VERIFIED,
    verified_date: '2026-01-05T00:00:00Z',
  },
  {
    ...baseDoc,
    id: 3,
    child_name: 'Noah Lee',
    title: 'ID Card Scan',
    file_name: 'id-card.pdf',
    status: DocumentStatus.REJECTED,
    rejection_reason: 'Image is blurry',
  },
];

const mockStats = {
  total_documents: 3,
  pending_verification: 1,
  expiring_soon: 0,
  pending_requests: 0,
  total_children: 3,
  storage_used_mb: 5,
};

describe('AdminDocumentVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(documentVaultApi.getVaultStats).mockResolvedValue(mockStats);
    vi.mocked(documentVaultApi.getDocuments).mockResolvedValue(mockDocuments);
  });

  it('renders stats and the pending queue by default', async () => {
    renderWithDemoAdmin(<AdminDocumentVerification />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Document Verification')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // total_documents stat card
    expect(screen.getByText('Immunization Record')).toBeInTheDocument();
    expect(screen.queryByText('Birth Certificate')).not.toBeInTheDocument();
    expect(screen.getByText('Verification Queue (1 pending)')).toBeInTheDocument();
  });

  it('shows verified documents on the Verified tab instead of the pending-only empty state', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AdminDocumentVerification />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /Verified/ }));

    expect(screen.getByText('Birth Certificate')).toBeInTheDocument();
    expect(
      screen.queryByText('All documents have been verified. Great job!')
    ).not.toBeInTheDocument();
    // Approve/Reject actions should not be offered for an already-verified document
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('shows rejected documents with their rejection reason on the Rejected tab', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AdminDocumentVerification />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /Rejected/ }));

    expect(screen.getByText('ID Card Scan')).toBeInTheDocument();
    expect(screen.getByText(/Rejection reason: Image is blurry/)).toBeInTheDocument();
  });

  it('filters documents by the search box', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AdminDocumentVerification />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /Verified/ }));
    expect(screen.getByText('Birth Certificate')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search documents...'), 'Liam');
    expect(screen.getByText('Birth Certificate')).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search documents...'));
    await user.type(screen.getByPlaceholderText('Search documents...'), 'no such child');
    expect(screen.queryByText('Birth Certificate')).not.toBeInTheDocument();
  });

  it('approves a pending document and refreshes the queue', async () => {
    const user = userEvent.setup();
    vi.mocked(documentVaultApi.verifyDocument).mockResolvedValue({
      ...mockDocuments[0],
      status: DocumentStatus.VERIFIED,
    });

    renderWithDemoAdmin(<AdminDocumentVerification />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const card = screen.getByText('Immunization Record').closest('.MuiCard-root') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(documentVaultApi.verifyDocument).toHaveBeenCalledWith(1, {
        status: DocumentStatus.VERIFIED,
        rejection_reason: undefined,
      });
    });

    // After approval, the documents list is refetched via the shared query keys
    await waitFor(() => {
      expect(documentVaultApi.getDocuments).toHaveBeenCalledTimes(2);
    });
  });

  it('shows an error alert when the vault stats fail to load', async () => {
    vi.mocked(documentVaultApi.getVaultStats).mockRejectedValue(new Error('boom'));

    renderWithDemoAdmin(<AdminDocumentVerification />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load document vault data.')).toBeInTheDocument();
    });
  });
});
