import { describe, it, expect, vi } from 'vitest';
import { renderWithDemoAdmin, screen, userEvent } from '../../tests/test-utils';
import AttendanceOverviewPage from './AttendanceOverviewPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// chart.js needs a real canvas 2D context and ResizeObserver, neither of which
// jsdom provides; the charts aren't the behavior under test here, so they're
// replaced with lightweight stand-ins (see AIStudyBuddy.test.tsx for the same
// pattern).
vi.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="mock-doughnut-chart" />,
  Line: () => <div data-testid="mock-line-chart" />,
}));

describe('AttendanceOverviewPage', () => {
  it('renders the heading, stat cards, and charts', () => {
    renderWithDemoAdmin(<AttendanceOverviewPage />);

    expect(screen.getByText('Attendance Management')).toBeInTheDocument();

    expect(screen.getByText("Today's Attendance")).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Defaulters')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    expect(screen.getByTestId('mock-doughnut-chart')).toBeInTheDocument();
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('renders all four quick action cards', () => {
    renderWithDemoAdmin(<AttendanceOverviewPage />);

    expect(screen.getByText('Mark Attendance')).toBeInTheDocument();
    expect(screen.getByText('Attendance Sheet')).toBeInTheDocument();
    expect(screen.getByText('Defaulters Report')).toBeInTheDocument();
    expect(screen.getByText('Corrections')).toBeInTheDocument();
  });

  it('navigates to the attendance marking page when the Mark Attendance card is clicked', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceOverviewPage />);

    await user.click(screen.getByText('Mark Attendance'));

    expect(navigateMock).toHaveBeenCalledWith('/admin/attendance/mark');
  });

  it('navigates to the defaulters report when that card is clicked', async () => {
    const user = userEvent.setup();
    renderWithDemoAdmin(<AttendanceOverviewPage />);

    await user.click(screen.getByText('Defaulters Report'));

    expect(navigateMock).toHaveBeenCalledWith('/admin/attendance/defaulters');
  });
});
