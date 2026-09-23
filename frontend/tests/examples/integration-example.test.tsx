/**
 * Integration Test Example
 *
 * This file demonstrates a complete integration test scenario
 * using all the test utilities provided in the tests directory.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import {
  renderWithDemoStudent,
  renderWithDemoTeacher,
  renderUnauthenticated,
  screen,
  userEvent,
  waitFor,
  cleanup,
} from '../test-utils';
import {
  setupDemoStudent,
  setupDemoTeacher,
  setupUnauthenticatedState,
  getCurrentAuthUser,
  isDemoUserInStore,
  DEMO_CREDENTIALS,
} from '../setup';

/**
 * Example: Dashboard Component
 *
 * This is a sample component that we'll test
 */
interface DashboardProps {
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const user = getCurrentAuthUser();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<{
    name: string;
    role: string;
    email: string;
  } | null>(null);

  React.useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      if (user) {
        setData({
          name: user.fullName,
          role: user.role,
          email: user.email,
        });
      }
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

  if (!user) {
    return <div>Please log in to view dashboard</div>;
  }

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1>Welcome to Dashboard</h1>
      <div data-testid="user-info">
        <p>Name: {data.name}</p>
        <p>Role: {data.role}</p>
        <p>Email: {data.email}</p>
      </div>
      {user.role === 'student' && (
        <div data-testid="student-section">
          <h2>Student Section</h2>
          <p>View your assignments and grades</p>
        </div>
      )}
      {user.role === 'teacher' && (
        <div data-testid="teacher-section">
          <h2>Teacher Section</h2>
          <p>Manage your classes and students</p>
        </div>
      )}
      {isDemoUserInStore() && (
        <div data-testid="demo-banner">
          <p>You are using demo mode</p>
        </div>
      )}
      <button onClick={onLogout}>Logout</button>
    </div>
  );
};

/**
 * Example: Login Form Component
 */
const LoginForm: React.FC<{ onLogin: (email: string, password: string) => void }> = ({
  onLogin,
}) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      onLogin(email, password);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <h1>Login</h1>
      {error && <div data-testid="error-message">{error}</div>}
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
      </div>
      <button type="submit">Login</button>
    </form>
  );
};

// ============================================================================
// Integration Tests
// ============================================================================

describe('Dashboard Integration Tests', () => {
  describe('Authenticated User Access', () => {
    it('should render dashboard for demo student', async () => {
      renderWithDemoStudent(<Dashboard />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
      });

      // Verify dashboard content
      expect(screen.getByText('Welcome to Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('user-info')).toBeInTheDocument();
      expect(screen.getByText(/Name:/)).toBeInTheDocument();
      expect(screen.getByText(/Role: student/)).toBeInTheDocument();
    });

    it('should show student-specific content for student role', async () => {
      renderWithDemoStudent(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('student-section')).toBeInTheDocument();
      });

      expect(screen.getByText('Student Section')).toBeInTheDocument();
      expect(screen.getByText('View your assignments and grades')).toBeInTheDocument();
      expect(screen.queryByTestId('teacher-section')).not.toBeInTheDocument();
    });

    it('should show teacher-specific content for teacher role', async () => {
      renderWithDemoTeacher(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('teacher-section')).toBeInTheDocument();
      });

      expect(screen.getByText('Teacher Section')).toBeInTheDocument();
      expect(screen.getByText('Manage your classes and students')).toBeInTheDocument();
      expect(screen.queryByTestId('student-section')).not.toBeInTheDocument();
    });

    it('should show demo banner for demo user', async () => {
      renderWithDemoStudent(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('demo-banner')).toBeInTheDocument();
      });

      expect(screen.getByText('You are using demo mode')).toBeInTheDocument();
    });

    it('should handle logout action', async () => {
      const user = userEvent.setup();
      const mockLogout = vi.fn();

      renderWithDemoStudent(<Dashboard onLogout={mockLogout} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Unauthenticated User Access', () => {
    it('should show login prompt for unauthenticated user', () => {
      renderUnauthenticated(<Dashboard />);

      expect(screen.getByText('Please log in to view dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Welcome to Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Data Loading States', () => {
    it('should show loading state initially', () => {
      renderWithDemoStudent(<Dashboard />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
      expect(screen.queryByText('Welcome to Dashboard')).not.toBeInTheDocument();
    });

    it('should transition from loading to loaded state', async () => {
      renderWithDemoStudent(<Dashboard />);

      // Initially loading
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();

      // Wait for loaded state
      await waitFor(() => {
        expect(screen.getByText('Welcome to Dashboard')).toBeInTheDocument();
      });

      // Loading should be gone
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    });
  });
});

describe('Login Form Integration Tests', () => {
  describe('Form Validation', () => {
    it('should show error when submitting empty form', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn();

      renderUnauthenticated(<LoginForm onLogin={mockLogin} />);

      const submitButton = screen.getByRole('button', { name: 'Login' });
      await user.click(submitButton);

      expect(screen.getByTestId('error-message')).toHaveTextContent('Please fill in all fields');
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error for invalid credentials', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn();

      renderUnauthenticated(<LoginForm onLogin={mockLogin} />);

      await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
      await user.type(screen.getByLabelText('Password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: 'Login' }));

      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Successful Login', () => {
    it('should call onLogin with demo credentials', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn();

      renderUnauthenticated(<LoginForm onLogin={mockLogin} />);

      await user.type(screen.getByLabelText('Email'), DEMO_CREDENTIALS.email);
      await user.type(screen.getByLabelText('Password'), DEMO_CREDENTIALS.password);
      await user.click(screen.getByRole('button', { name: 'Login' }));

      expect(mockLogin).toHaveBeenCalledWith(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update input values when typing', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn();

      renderUnauthenticated(<LoginForm onLogin={mockLogin} />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });
  });
});

describe('Complete User Journey', () => {
  it('should complete full authentication flow', async () => {
    // Start unauthenticated
    setupUnauthenticatedState();
    expect(getCurrentAuthUser()).toBeNull();

    // Simulate login
    setupDemoStudent();
    expect(getCurrentAuthUser()).not.toBeNull();
    expect(getCurrentAuthUser()?.role).toBe('student');

    // Render dashboard
    renderWithDemoStudent(<Dashboard />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Welcome to Dashboard')).toBeInTheDocument();
    });

    // Verify user info
    expect(screen.getByText(/Name:/)).toBeInTheDocument();
    expect(screen.getByText(/Email: demo@example.com/)).toBeInTheDocument();
    expect(screen.getByTestId('demo-banner')).toBeInTheDocument();
  });

  it('should handle role switching', async () => {
    // Start as student
    renderWithDemoStudent(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('student-section')).toBeInTheDocument();
    });

    // Switch to teacher -- unmount the student render first, since render()
    // appends to the document rather than replacing the previous tree.
    cleanup();
    setupDemoTeacher();
    renderWithDemoTeacher(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('teacher-section')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('student-section')).not.toBeInTheDocument();
  });
});

describe('Test Isolation Verification', () => {
  it('should have clean state - test 1', () => {
    setupDemoStudent();
    expect(getCurrentAuthUser()?.role).toBe('student');
  });

  it('should have clean state - test 2', () => {
    // Should start clean, not affected by previous test
    expect(getCurrentAuthUser()).toBeNull();
  });

  it('should have clean state - test 3', () => {
    setupDemoTeacher();
    expect(getCurrentAuthUser()?.role).toBe('teacher');
  });
});
