import { describe, it, expect } from 'vitest';
import {
  renderWithRegularUser,
  renderUnauthenticated,
  screen,
} from '../../tests/test-utils';
import About from './About';

describe('About', () => {
  it('renders the static description for an unauthenticated visitor', () => {
    renderUnauthenticated(<About />);

    expect(screen.getByText('About This Application')).toBeInTheDocument();
    expect(
      screen.getByText(/This is a demo application showcasing a comprehensive authentication/)
    ).toBeInTheDocument();
    expect(screen.getByText('Role-based access control')).toBeInTheDocument();

    // No session info and no role-gated sections when logged out
    expect(screen.queryByText('Your Session Info')).not.toBeInTheDocument();
    expect(
      screen.queryByText('🔒 This section is only visible to administrators')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('📚 This section is visible to teachers and administrators')
    ).not.toBeInTheDocument();
  });

  it('shows session info but no gated sections for a regular student', () => {
    renderWithRegularUser(<About />, 'student', 'student@example.com');

    expect(screen.getByText('Your Session Info')).toBeInTheDocument();
    expect(screen.getByText(/Logged in as: Test User \(student@example.com\)/)).toBeInTheDocument();
    expect(screen.getByText('Role: student')).toBeInTheDocument();
    expect(screen.getByText('Email Verified: Yes')).toBeInTheDocument();

    expect(
      screen.queryByText('🔒 This section is only visible to administrators')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('📚 This section is visible to teachers and administrators')
    ).not.toBeInTheDocument();
  });

  it('shows the teacher-and-admin section for a teacher, but not the admin-only section', () => {
    renderWithRegularUser(<About />, 'teacher', 'teacher@example.com');

    expect(screen.getByText('Role: teacher')).toBeInTheDocument();
    expect(
      screen.getByText('📚 This section is visible to teachers and administrators')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('🔒 This section is only visible to administrators')
    ).not.toBeInTheDocument();
  });

  it('shows both role-gated sections for an admin', () => {
    renderWithRegularUser(<About />, 'admin', 'admin@example.com');

    expect(screen.getByText('Role: admin')).toBeInTheDocument();
    expect(
      screen.getByText('🔒 This section is only visible to administrators')
    ).toBeInTheDocument();
    expect(
      screen.getByText('📚 This section is visible to teachers and administrators')
    ).toBeInTheDocument();
  });
});
