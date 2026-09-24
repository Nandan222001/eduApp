import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderWithDemoAdmin,
  renderWithRegularUser,
  screen,
  waitFor,
  userEvent,
  within,
} from '../../tests/test-utils';
import AdministratorsList from './AdministratorsList';
import administratorsApi from '@/api/administrators';
import type { AdministratorListResponse } from '@/api/administrators';

vi.mock('@/api/administrators', () => ({
  default: {
    listAdministrators: vi.fn(),
    getAdministrator: vi.fn(),
    createAdministrator: vi.fn(),
    updateAdministrator: vi.fn(),
    deleteAdministrator: vi.fn(),
  },
}));

const mockAdminResponse: AdministratorListResponse = {
  items: [
    {
      id: 10,
      institution_id: 2,
      user_id: 200,
      first_name: 'Nina',
      last_name: 'Patel',
      email: 'nina.patel@school.edu',
      phone: '+1-555-9999',
      role: 'admin',
      department: 'Operations',
      designation: 'Operations Manager',
      is_active: true,
      photo_url: undefined,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  total: 1,
  skip: 0,
  limit: 10,
};

describe('AdministratorsList', () => {
  describe('demo user (client-side demo data)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders the demo administrators without calling the real API', async () => {
      renderWithDemoAdmin(<AdministratorsList />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      expect(screen.getByText('John Anderson')).toBeInTheDocument();
      expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
      expect(administratorsApi.listAdministrators).not.toHaveBeenCalled();
    });

    it('filters demo administrators by search text', async () => {
      const user = userEvent.setup();
      renderWithDemoAdmin(<AdministratorsList />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const searchBox = screen.getByPlaceholderText('Search administrators...');
      await user.type(searchBox, 'Sarah');

      await waitFor(() => {
        expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
        expect(screen.queryByText('John Anderson')).not.toBeInTheDocument();
      });
    });

    it('opens the create administrator dialog and validates required fields', async () => {
      const user = userEvent.setup();
      renderWithDemoAdmin(<AdministratorsList />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add administrator/i }));

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('Add Administrator')).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: /^create$/i }));

      await waitFor(() => {
        expect(within(dialog).getByText('First name is required')).toBeInTheDocument();
        expect(within(dialog).getByText('Last name is required')).toBeInTheDocument();
        expect(within(dialog).getByText('Email is required')).toBeInTheDocument();
      });
    });
  });

  describe('regular (non-demo) user', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(administratorsApi.listAdministrators).mockResolvedValue(mockAdminResponse);
    });

    it('loads administrators from the real API', async () => {
      renderWithRegularUser(<AdministratorsList />, 'admin', 'real.admin@example.com');

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      expect(administratorsApi.listAdministrators).toHaveBeenCalled();
      expect(screen.getByText('Nina Patel')).toBeInTheDocument();
      expect(screen.getByText('Operations Manager')).toBeInTheDocument();
    });

    it('shows an error alert when loading administrators fails', async () => {
      vi.mocked(administratorsApi.listAdministrators).mockRejectedValue({
        response: { data: { detail: 'Server exploded' } },
      });

      renderWithRegularUser(<AdministratorsList />, 'admin', 'real.admin@example.com');

      await waitFor(() => {
        expect(screen.getByText('Server exploded')).toBeInTheDocument();
      });
    });
  });
});
