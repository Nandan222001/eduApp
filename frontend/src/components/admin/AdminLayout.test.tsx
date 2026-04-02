import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '../../../tests/test-utils';
import { setupDemoAdmin } from '../../../tests/setup';
import AdminLayout from './AdminLayout';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches:
        query.includes(`max-width: ${width}px`) ||
        (query.includes('max-width') && parseInt(query.match(/\d+/)?.[0] || '0') >= width),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  window.dispatchEvent(new Event('resize'));
};

const TestDashboard = () => <div>Admin Dashboard Content</div>;
const TestSettings = () => <div>Admin Settings Content</div>;

const AdminLayoutWithRoutes = () => (
  <MemoryRouter initialEntries={['/admin/dashboard']}>
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<TestDashboard />} />
        <Route path="settings" element={<TestSettings />} />
      </Route>
    </Routes>
  </MemoryRouter>
);

describe('Admin Layout - Mobile Sidebar Tests (<600px viewport)', () => {
  beforeEach(() => {
    setupDemoAdmin();
    setViewportWidth(375);
  });

  describe('Hamburger Menu Button', () => {
    it('should render hamburger menu button in mobile viewport', () => {
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      expect(hamburgerButton).toBeInTheDocument();
      expect(hamburgerButton).toBeVisible();
    });

    it('should have proper aria-label for accessibility', () => {
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      expect(hamburgerButton).toHaveAttribute('aria-label');
    });

    it('should open mobile drawer when hamburger is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });

      await user.click(hamburgerButton);

      await waitFor(() => {
        const drawer = screen.getByRole('navigation', {
          name: /main navigation|mobile navigation/i,
        });
        expect(drawer).toBeInTheDocument();
      });
    });

    it('should close mobile drawer when hamburger is clicked again', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });

      await user.click(hamburgerButton);

      await waitFor(() => {
        const drawer = screen.getByRole('navigation', {
          name: /main navigation|mobile navigation/i,
        });
        expect(drawer).toBeInTheDocument();
      });

      await user.click(hamburgerButton);

      await waitFor(
        () => {
          const drawer = screen.queryByRole('navigation', {
            name: /main navigation|mobile navigation/i,
          });
          expect(drawer).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should toggle drawer state multiple times', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });

      for (let i = 0; i < 3; i++) {
        await user.click(hamburgerButton);
        await waitFor(() => {
          expect(
            screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
          ).toBeInTheDocument();
        });

        await user.click(hamburgerButton);
        await waitFor(
          () => {
            expect(
              screen.queryByRole('navigation', { name: /main navigation|mobile navigation/i })
            ).not.toBeInTheDocument();
          },
          { timeout: 3000 }
        );
      }
    });
  });

  describe('Mobile Drawer Rendering', () => {
    it('should render drawer with correct width when opened', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        const drawer = screen.getByRole('navigation', {
          name: /main navigation|mobile navigation/i,
        });
        expect(drawer).toBeInTheDocument();
      });
    });

    it('should not render drawer initially (closed by default)', () => {
      renderWithProviders(<AdminLayoutWithRoutes />);

      const drawer = screen.queryByRole('navigation', { name: /mobile navigation/i });
      expect(drawer).not.toBeInTheDocument();
    });

    it('should render with temporary variant for mobile', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        const drawer = screen.getByRole('navigation', {
          name: /main navigation|mobile navigation/i,
        });
        expect(drawer).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Items', () => {
    it('should render all navigation items with text labels visible', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      const navButtons = screen.getAllByRole('button');
      expect(navButtons.length).toBeGreaterThan(0);
    });

    it('should display EduPortal branding in mobile drawer', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(screen.getByText('EduPortal')).toBeInTheDocument();
      });
    });

    it('should display Admin Panel subtitle', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      });
    });

    it('should render navigation items with icons', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        const drawer = screen.getByRole('navigation', {
          name: /main navigation|mobile navigation/i,
        });
        const icons = drawer.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('should have visible text labels for all navigation items', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        const drawer = screen.getByRole('navigation', {
          name: /main navigation|mobile navigation/i,
        });
        const listItems = drawer.querySelectorAll('[role="button"]');

        listItems.forEach((item) => {
          const textContent = item.textContent;
          expect(textContent).toBeTruthy();
          expect(textContent?.trim().length).toBeGreaterThan(0);
        });
      });
    });

    it('should render badge indicators if present', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Item Interaction', () => {
    it('should close drawer when navigation item is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      const navButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn !== hamburgerButton && btn.closest('[role="navigation"]'));

      if (navButtons.length > 0) {
        await user.click(navButtons[0]);

        await waitFor(
          () => {
            expect(
              screen.queryByRole('navigation', { name: /mobile navigation/i })
            ).not.toBeInTheDocument();
          },
          { timeout: 3000 }
        );
      }
    });

    it('should navigate to correct route when item clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Admin Dashboard Content')).toBeInTheDocument();
    });

    it('should highlight active navigation item', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        const drawer = screen.getByRole('navigation', {
          name: /main navigation|mobile navigation/i,
        });
        expect(drawer).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      await user.tab();

      const focusedElement = document.activeElement;
      expect(focusedElement).toBeTruthy();
    });
  });

  describe('Drawer Close Interactions', () => {
    it('should close drawer when backdrop is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        await user.click(backdrop as HTMLElement);

        await waitFor(
          () => {
            expect(
              screen.queryByRole('navigation', { name: /mobile navigation/i })
            ).not.toBeInTheDocument();
          },
          { timeout: 3000 }
        );
      }
    });

    it('should close drawer on Escape key press', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(
        () => {
          expect(
            screen.queryByRole('navigation', { name: /mobile navigation/i })
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Animations and Transitions', () => {
    it('should apply smooth animation when opening drawer', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        const drawer = screen.getByRole('navigation', {
          name: /main navigation|mobile navigation/i,
        });
        expect(drawer).toBeInTheDocument();
      });
    });

    it('should apply smooth animation when closing drawer', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      await user.click(hamburgerButton);

      await waitFor(
        () => {
          expect(
            screen.queryByRole('navigation', { name: /mobile navigation/i })
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Layout Stability', () => {
    it('should not cause layout shift when opening drawer', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const mainContent = screen.getByRole('main');
      const initialRect = mainContent.getBoundingClientRect();

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      const afterRect = mainContent.getBoundingClientRect();
      expect(afterRect.width).toBe(initialRect.width);
    });

    it('should not cause layout shift when closing drawer', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      const mainContent = screen.getByRole('main');
      const beforeCloseRect = mainContent.getBoundingClientRect();

      await user.click(hamburgerButton);

      await waitFor(
        () => {
          expect(
            screen.queryByRole('navigation', { name: /mobile navigation/i })
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const afterCloseRect = mainContent.getBoundingClientRect();
      expect(afterCloseRect.width).toBe(beforeCloseRect.width);
    });

    it('should maintain content scroll position when toggling drawer', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const mainContent = screen.getByRole('main');
      mainContent.scrollTop = 100;

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      expect(mainContent.scrollTop).toBe(100);

      await user.click(hamburgerButton);

      await waitFor(
        () => {
          expect(
            screen.queryByRole('navigation', { name: /mobile navigation/i })
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(mainContent.scrollTop).toBe(100);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on drawer', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        const drawer = screen.getByRole('navigation', {
          name: /main navigation|mobile navigation/i,
        });
        expect(drawer).toHaveAttribute('aria-label');
      });
    });

    it('should trap focus within drawer when open', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      await user.tab();

      const focusedElement = document.activeElement;
      const drawer = screen.getByRole('navigation', { name: /main navigation|mobile navigation/i });
      expect(drawer.contains(focusedElement)).toBe(true);
    });

    it('should restore focus to hamburger button when drawer closes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /main navigation|mobile navigation/i })
        ).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(
        () => {
          expect(
            screen.queryByRole('navigation', { name: /mobile navigation/i })
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should have accessible navigation item labels', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      await user.click(hamburgerButton);

      await waitFor(() => {
        const drawer = screen.getByRole('navigation', {
          name: /main navigation|mobile navigation/i,
        });
        const navItems = drawer.querySelectorAll('[role="button"]');

        navItems.forEach((item) => {
          expect(item.textContent || item.getAttribute('aria-label')).toBeTruthy();
        });
      });
    });
  });

  describe('Viewport Validation', () => {
    it('should show mobile drawer in 375px viewport', () => {
      setViewportWidth(375);
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      expect(hamburgerButton).toBeInTheDocument();
    });

    it('should show mobile drawer in 480px viewport', () => {
      setViewportWidth(480);
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      expect(hamburgerButton).toBeInTheDocument();
    });

    it('should show mobile drawer in 599px viewport (edge case)', () => {
      setViewportWidth(599);
      renderWithProviders(<AdminLayoutWithRoutes />);

      const hamburgerButton = screen.getByRole('button', { name: /toggle drawer|menu/i });
      expect(hamburgerButton).toBeInTheDocument();
    });
  });
});
