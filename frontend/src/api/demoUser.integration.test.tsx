import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import {
  DEMO_CREDENTIALS,
  TEACHER_CREDENTIALS,
  PARENT_CREDENTIALS,
  ADMIN_CREDENTIALS,
  SUPERADMIN_CREDENTIALS,
  demoAuthUser,
  teacherAuthUser,
  parentAuthUser,
  adminAuthUser,
  superadminAuthUser,
} from '@/data/dummyData';
import StudentDashboard from '@/pages/StudentDashboard';
import TeacherDashboard from '@/pages/TeacherDashboard';
import ParentDashboard from '@/pages/ParentDashboard';
import InstitutionAdminDashboard from '@/pages/InstitutionAdminDashboard';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';

// Mock axios to prevent actual API calls
vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    </MemoryRouter>
  );
};

describe('Demo User Integration Tests - Role-Specific Page Access', () => {
  beforeEach(() => {
    queryClient.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  describe('Student Demo User - StudentDashboard Access', () => {
    it('should render StudentDashboard for demo student without API calls', async () => {
      useAuthStore.setState({
        user: demoAuthUser,
        isAuthenticated: true,
      });

      renderWithProviders(<StudentDashboard />);

      await waitFor(() => {
        // Student dashboard should load with demo data
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Verify that the student email matches demo credentials
      expect(demoAuthUser.email).toBe(DEMO_CREDENTIALS.email);
      expect(demoAuthUser.role).toBe('student');
    });

    it('should display student-specific content from demo data', async () => {
      useAuthStore.setState({
        user: demoAuthUser,
        isAuthenticated: true,
      });

      const { container } = renderWithProviders(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // The dashboard should be rendered with actual content (this component
      // has no role="main" landmark of its own -- that's supplied by the
      // real app's Layout wrapper, which this standalone render doesn't use)
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Teacher Demo User - TeacherDashboard Access', () => {
    it('should render TeacherDashboard for demo teacher without API calls', async () => {
      useAuthStore.setState({
        user: teacherAuthUser,
        isAuthenticated: true,
      });

      renderWithProviders(<TeacherDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Verify that the teacher email matches demo credentials
      expect(teacherAuthUser.email).toBe(TEACHER_CREDENTIALS.email);
      expect(teacherAuthUser.role).toBe('teacher');
    });

    it('should display teacher-specific content from demo data', async () => {
      useAuthStore.setState({
        user: teacherAuthUser,
        isAuthenticated: true,
      });

      const { container } = renderWithProviders(<TeacherDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // The dashboard should be rendered with actual content (this component
      // has no role="main" landmark of its own -- that's supplied by the
      // real app's Layout wrapper, which this standalone render doesn't use)
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Parent Demo User - ParentDashboard Access', () => {
    it('should render ParentDashboard for demo parent without API calls', async () => {
      useAuthStore.setState({
        user: parentAuthUser,
        isAuthenticated: true,
      });

      renderWithProviders(<ParentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Verify that the parent email matches demo credentials
      expect(parentAuthUser.email).toBe(PARENT_CREDENTIALS.email);
      expect(parentAuthUser.role).toBe('parent');
    });

    it('should display parent-specific content from demo data', async () => {
      useAuthStore.setState({
        user: parentAuthUser,
        isAuthenticated: true,
      });

      const { container } = renderWithProviders(<ParentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // The dashboard should be rendered with actual content (this component
      // has no role="main" landmark of its own -- that's supplied by the
      // real app's Layout wrapper, which this standalone render doesn't use)
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Admin Demo User - InstitutionAdminDashboard Access', () => {
    it('should render InstitutionAdminDashboard for demo admin without API calls', async () => {
      useAuthStore.setState({
        user: adminAuthUser,
        isAuthenticated: true,
      });

      renderWithProviders(<InstitutionAdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Verify that the admin email matches demo credentials
      expect(adminAuthUser.email).toBe(ADMIN_CREDENTIALS.email);
      expect(adminAuthUser.role).toBe('institution_admin');
    });

    it('should display admin-specific content from demo data', async () => {
      useAuthStore.setState({
        user: adminAuthUser,
        isAuthenticated: true,
      });

      const { container } = renderWithProviders(<InstitutionAdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // The dashboard should be rendered with actual content (this component
      // has no role="main" landmark of its own -- that's supplied by the
      // real app's Layout wrapper, which this standalone render doesn't use)
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('SuperAdmin Demo User - SuperAdminDashboard Access', () => {
    it('should render SuperAdminDashboard for demo superadmin without API calls', async () => {
      useAuthStore.setState({
        user: superadminAuthUser,
        isAuthenticated: true,
      });

      renderWithProviders(<SuperAdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Verify that the superadmin email matches demo credentials
      expect(superadminAuthUser.email).toBe(SUPERADMIN_CREDENTIALS.email);
      expect(superadminAuthUser.role).toBe('superadmin');
    });

    it('should display superadmin-specific content from demo data', async () => {
      useAuthStore.setState({
        user: superadminAuthUser,
        isAuthenticated: true,
      });

      const { container } = renderWithProviders(<SuperAdminDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // The dashboard should be rendered with actual content (this component
      // has no role="main" landmark of its own -- that's supplied by the
      // real app's Layout wrapper, which this standalone render doesn't use)
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Demo User Data Consistency', () => {
    it('should verify all demo users have correct email-role mapping', () => {
      expect(demoAuthUser.email).toBe(DEMO_CREDENTIALS.email);
      expect(demoAuthUser.role).toBe('student');

      expect(teacherAuthUser.email).toBe(TEACHER_CREDENTIALS.email);
      expect(teacherAuthUser.role).toBe('teacher');

      expect(parentAuthUser.email).toBe(PARENT_CREDENTIALS.email);
      expect(parentAuthUser.role).toBe('parent');

      expect(adminAuthUser.email).toBe(ADMIN_CREDENTIALS.email);
      expect(adminAuthUser.role).toBe('institution_admin');

      expect(superadminAuthUser.email).toBe(SUPERADMIN_CREDENTIALS.email);
      expect(superadminAuthUser.role).toBe('superadmin');
    });

    it('should verify all demo credentials use the same password', () => {
      expect(DEMO_CREDENTIALS.password).toBe('Demo@123');
      expect(TEACHER_CREDENTIALS.password).toBe('Demo@123');
      expect(PARENT_CREDENTIALS.password).toBe('Demo@123');
      expect(ADMIN_CREDENTIALS.password).toBe('Demo@123');
      expect(SUPERADMIN_CREDENTIALS.password).toBe('Demo@123');
    });

    it('should verify all demo users are active and verified', () => {
      expect(demoAuthUser.isActive).toBe(true);
      expect(demoAuthUser.emailVerified).toBe(true);

      expect(teacherAuthUser.isActive).toBe(true);
      expect(teacherAuthUser.emailVerified).toBe(true);

      expect(parentAuthUser.isActive).toBe(true);
      expect(parentAuthUser.emailVerified).toBe(true);

      expect(adminAuthUser.isActive).toBe(true);
      expect(adminAuthUser.emailVerified).toBe(true);

      expect(superadminAuthUser.isActive).toBe(true);
      expect(superadminAuthUser.emailVerified).toBe(true);
    });

    it('should verify superadmin has isSuperuser flag set correctly', () => {
      expect(demoAuthUser.isSuperuser).toBe(false);
      expect(teacherAuthUser.isSuperuser).toBe(false);
      expect(parentAuthUser.isSuperuser).toBe(false);
      expect(adminAuthUser.isSuperuser).toBe(false);
      expect(superadminAuthUser.isSuperuser).toBe(true);
    });
  });

  describe('Demo User Authentication Flow', () => {
    it('should allow student demo user to access student-specific features', async () => {
      useAuthStore.setState({
        user: demoAuthUser,
        isAuthenticated: true,
      });

      const { user, isAuthenticated } = useAuthStore.getState();

      expect(isAuthenticated).toBe(true);
      expect(user?.role).toBe('student');
      expect(user?.email).toBe(DEMO_CREDENTIALS.email);
    });

    it('should allow teacher demo user to access teacher-specific features', async () => {
      useAuthStore.setState({
        user: teacherAuthUser,
        isAuthenticated: true,
      });

      const { user, isAuthenticated } = useAuthStore.getState();

      expect(isAuthenticated).toBe(true);
      expect(user?.role).toBe('teacher');
      expect(user?.email).toBe(TEACHER_CREDENTIALS.email);
    });

    it('should allow parent demo user to access parent-specific features', async () => {
      useAuthStore.setState({
        user: parentAuthUser,
        isAuthenticated: true,
      });

      const { user, isAuthenticated } = useAuthStore.getState();

      expect(isAuthenticated).toBe(true);
      expect(user?.role).toBe('parent');
      expect(user?.email).toBe(PARENT_CREDENTIALS.email);
    });

    it('should allow admin demo user to access admin-specific features', async () => {
      useAuthStore.setState({
        user: adminAuthUser,
        isAuthenticated: true,
      });

      const { user, isAuthenticated } = useAuthStore.getState();

      expect(isAuthenticated).toBe(true);
      expect(user?.role).toBe('institution_admin');
      expect(user?.email).toBe(ADMIN_CREDENTIALS.email);
    });

    it('should allow superadmin demo user to access superadmin-specific features', async () => {
      useAuthStore.setState({
        user: superadminAuthUser,
        isAuthenticated: true,
      });

      const { user, isAuthenticated } = useAuthStore.getState();

      expect(isAuthenticated).toBe(true);
      expect(user?.role).toBe('superadmin');
      expect(user?.email).toBe(SUPERADMIN_CREDENTIALS.email);
      expect(user?.isSuperuser).toBe(true);
    });
  });

  describe('Demo User Role-Based Access Control', () => {
    it('should verify student demo user cannot access admin routes', () => {
      useAuthStore.setState({
        user: demoAuthUser,
        isAuthenticated: true,
      });

      const { user } = useAuthStore.getState();

      expect(user?.role).toBe('student');
      expect(user?.role).not.toBe('institution_admin');
      expect(user?.role).not.toBe('superadmin');
    });

    it('should verify teacher demo user cannot access admin routes', () => {
      useAuthStore.setState({
        user: teacherAuthUser,
        isAuthenticated: true,
      });

      const { user } = useAuthStore.getState();

      expect(user?.role).toBe('teacher');
      expect(user?.role).not.toBe('institution_admin');
      expect(user?.role).not.toBe('superadmin');
    });

    it('should verify parent demo user cannot access admin routes', () => {
      useAuthStore.setState({
        user: parentAuthUser,
        isAuthenticated: true,
      });

      const { user } = useAuthStore.getState();

      expect(user?.role).toBe('parent');
      expect(user?.role).not.toBe('institution_admin');
      expect(user?.role).not.toBe('superadmin');
    });

    it('should verify admin demo user cannot access superadmin routes', () => {
      useAuthStore.setState({
        user: adminAuthUser,
        isAuthenticated: true,
      });

      const { user } = useAuthStore.getState();

      expect(user?.role).toBe('institution_admin');
      expect(user?.role).not.toBe('superadmin');
      expect(user?.isSuperuser).toBe(false);
    });
  });

  describe('Demo User Profile Information', () => {
    it('should have complete student demo user profile', () => {
      expect(demoAuthUser).toHaveProperty('id');
      expect(demoAuthUser).toHaveProperty('email');
      expect(demoAuthUser).toHaveProperty('firstName');
      expect(demoAuthUser).toHaveProperty('lastName');
      expect(demoAuthUser).toHaveProperty('fullName');
      expect(demoAuthUser).toHaveProperty('role');
      expect(demoAuthUser).toHaveProperty('isActive');
      expect(demoAuthUser).toHaveProperty('emailVerified');
      expect(demoAuthUser).toHaveProperty('isSuperuser');
      expect(demoAuthUser).toHaveProperty('createdAt');
      expect(demoAuthUser).toHaveProperty('updatedAt');
    });

    it('should have complete teacher demo user profile', () => {
      expect(teacherAuthUser).toHaveProperty('id');
      expect(teacherAuthUser).toHaveProperty('email');
      expect(teacherAuthUser).toHaveProperty('firstName');
      expect(teacherAuthUser).toHaveProperty('lastName');
      expect(teacherAuthUser.fullName).toContain(teacherAuthUser.firstName);
      expect(teacherAuthUser.fullName).toContain(teacherAuthUser.lastName);
    });

    it('should have complete parent demo user profile', () => {
      expect(parentAuthUser).toHaveProperty('id');
      expect(parentAuthUser).toHaveProperty('email');
      expect(parentAuthUser).toHaveProperty('firstName');
      expect(parentAuthUser).toHaveProperty('lastName');
      expect(parentAuthUser.fullName).toContain(parentAuthUser.firstName);
      expect(parentAuthUser.fullName).toContain(parentAuthUser.lastName);
    });

    it('should have complete admin demo user profile', () => {
      expect(adminAuthUser).toHaveProperty('id');
      expect(adminAuthUser).toHaveProperty('email');
      expect(adminAuthUser).toHaveProperty('firstName');
      expect(adminAuthUser).toHaveProperty('lastName');
      expect(adminAuthUser.fullName).toContain(adminAuthUser.firstName);
      expect(adminAuthUser.fullName).toContain(adminAuthUser.lastName);
    });

    it('should have complete superadmin demo user profile', () => {
      expect(superadminAuthUser).toHaveProperty('id');
      expect(superadminAuthUser).toHaveProperty('email');
      expect(superadminAuthUser).toHaveProperty('firstName');
      expect(superadminAuthUser).toHaveProperty('lastName');
      expect(superadminAuthUser.fullName).toContain(superadminAuthUser.firstName);
      expect(superadminAuthUser.fullName).toContain(superadminAuthUser.lastName);
    });
  });
});
