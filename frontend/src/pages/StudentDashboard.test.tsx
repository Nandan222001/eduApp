import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StudentDashboard from './StudentDashboard';
import * as demoDataApiModule from '@/api/demoDataApi';
import { demoData } from '@/data/dummyData';
import type { StudentDashboardData } from '@/api/students';

// Create mock dashboard data
const mockDashboardData: StudentDashboardData = {
  student_id: demoData.student.profile.id,
  student_name: `${demoData.student.profile.first_name} ${demoData.student.profile.last_name}`,
  photo_url: demoData.student.profile.photo_url,
  section: demoData.student.profile.section?.name,
  grade: demoData.student.profile.section?.grade?.name,
  todays_attendance: {
    status: 'present',
    date: new Date().toISOString().split('T')[0],
  },
  attendance_summary: {
    total_days: demoData.student.attendance.summary.total_days,
    present_days: demoData.student.attendance.summary.present_days,
    absent_days: demoData.student.attendance.summary.absent_days,
    attendance_percentage: demoData.student.attendance.summary.attendance_percentage,
  },
  upcoming_assignments: demoData.academics.upcomingAssignments,
  pending_homework: [],
  recent_grades: demoData.academics.recentGrades,
  ai_prediction: undefined,
  weak_areas: [],
  study_streak: {
    current_streak: demoData.gamification.userPoints.current_streak,
    longest_streak: demoData.gamification.userPoints.longest_streak,
    last_activity: demoData.gamification.userPoints.last_activity_date,
  },
  points_and_rank: {
    total_points: demoData.gamification.userPoints.total_points,
    level: demoData.gamification.userPoints.level,
    rank: 3,
  },
  badges: demoData.gamification.userBadges.map((ub) => ({
    id: ub.badge.id,
    name: ub.badge.name,
    description: ub.badge.description,
    icon_url: ub.badge.icon_url,
    badge_type: ub.badge.badge_type,
    rarity: ub.badge.rarity,
    earned_at: ub.earned_at,
  })),
  todays_tasks: [],
  quick_links: [],
};

// Mock dependencies
vi.mock('@/api/demoDataApi', () => ({
  isDemoUser: vi.fn(),
  demoDataApi: {
    students: {
      getStudentDashboard: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1001',
      email: 'demo@example.com',
      firstName: 'Alex',
      lastName: 'Johnson',
      fullName: 'Alex Johnson',
      role: 'student',
    },
    isAuthenticated: true,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    </BrowserRouter>
  );
};

describe('StudentDashboard - Demo User Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Setup mocks
    vi.mocked(demoDataApiModule.isDemoUser).mockReturnValue(true);
    vi.mocked(demoDataApiModule.demoDataApi.students.getStudentDashboard).mockResolvedValue(
      mockDashboardData
    );
  });

  it('renders correctly with demo data when isDemoUser returns true', async () => {
    renderWithProviders(<StudentDashboard />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Verify component is rendered
    expect(screen.getByText(/Good Morning|Good Afternoon|Good Evening/i)).toBeInTheDocument();
  });

  it('displays WelcomeCard with demo user name', async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check that the demo user's name is displayed
    const expectedName = `${demoData.student.profile.first_name} ${demoData.student.profile.last_name}`;
    expect(screen.getByText(new RegExp(expectedName, 'i'))).toBeInTheDocument();
  });

  it('displays AttendanceStatusCard with 80% attendance', async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check for attendance percentage
    const expectedPercentage = demoData.student.attendance.summary.attendance_percentage;
    expect(screen.getByText(`${expectedPercentage.toFixed(1)}%`)).toBeInTheDocument();

    // Check for attendance card title
    expect(screen.getByText(/Today's Attendance/i)).toBeInTheDocument();

    // Check for present days information
    const presentDays = demoData.student.attendance.summary.present_days;
    const totalDays = demoData.student.attendance.summary.total_days;
    expect(
      screen.getByText(new RegExp(`${presentDays} of ${totalDays} days present`, 'i'))
    ).toBeInTheDocument();
  });

  it('displays UpcomingAssignmentsCard with 5 assignments', async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check for upcoming assignments section (use getAllByText since it may appear multiple times)
    const upcomingHeaders = screen.getAllByText(/Upcoming Assignments/i);
    expect(upcomingHeaders.length).toBeGreaterThan(0);

    // Verify that upcoming assignments are displayed
    const upcomingAssignments = demoData.academics.upcomingAssignments;
    expect(
      screen.getByText(new RegExp(`${upcomingAssignments.length} assignments due soon`, 'i'))
    ).toBeInTheDocument();

    // Check for first few assignment titles (limited to 4 in the UI)
    const displayedAssignments = upcomingAssignments.slice(0, 4);
    displayedAssignments.forEach((assignment) => {
      expect(screen.getByText(assignment.title)).toBeInTheDocument();
    });
  });

  it('displays RecentGradesCard with graded submissions', async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check for recent grades section
    expect(screen.getByText(/Recent Grades/i)).toBeInTheDocument();

    // Verify graded submissions are displayed
    const recentGrades = demoData.academics.recentGrades;
    const displayedGrades = recentGrades.slice(0, 5);

    displayedGrades.forEach((grade) => {
      expect(screen.getByText(grade.exam_name)).toBeInTheDocument();
      expect(screen.getByText(`${grade.percentage.toFixed(1)}%`)).toBeInTheDocument();
    });
  });

  it('displays gamification widgets with points, badges, and streak', async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check Points & Rank widget
    expect(screen.getByText(/Points & Rank/i)).toBeInTheDocument();
    const totalPoints = demoData.gamification.userPoints.total_points;
    expect(screen.getByText(totalPoints.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(/Total Points/i)).toBeInTheDocument();

    // Check level display
    const level = demoData.gamification.userPoints.level;
    expect(screen.getByText(`Level ${level}`)).toBeInTheDocument();

    // Check Study Streak widget
    expect(screen.getByText(/Study Streak/i)).toBeInTheDocument();
    const currentStreak = demoData.gamification.userPoints.current_streak;
    expect(screen.getByText(currentStreak.toString())).toBeInTheDocument();
    expect(screen.getByText(/Days in a row/i)).toBeInTheDocument();

    // Check longest streak
    const longestStreak = demoData.gamification.userPoints.longest_streak;
    expect(screen.getByText(longestStreak.toString())).toBeInTheDocument();
    expect(screen.getByText(/Longest Streak/i)).toBeInTheDocument();

    // Check Badges widget
    expect(screen.getByText(/Recent Badges/i)).toBeInTheDocument();
    const badgesCount = demoData.gamification.userBadges.length;
    expect(screen.getByText(new RegExp(`${badgesCount} badges earned`, 'i'))).toBeInTheDocument();

    // Verify individual badges are displayed
    demoData.gamification.userBadges.forEach((userBadge) => {
      expect(screen.getByText(userBadge.badge.name)).toBeInTheDocument();
    });
  });

  it('displays all data matching dummyData.ts structure', async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Verify WelcomeCard data
    const studentName = `${demoData.student.profile.first_name} ${demoData.student.profile.last_name}`;
    expect(screen.getByText(new RegExp(studentName, 'i'))).toBeInTheDocument();

    const gradeSection = `${demoData.student.profile.section?.grade?.name} - Section ${demoData.student.profile.section?.name}`;
    expect(screen.getByText(gradeSection)).toBeInTheDocument();

    // Verify AttendanceStatusCard data
    const attendancePercentage = demoData.student.attendance.summary.attendance_percentage;
    expect(screen.getByText(`${attendancePercentage.toFixed(1)}%`)).toBeInTheDocument();

    // Verify UpcomingAssignmentsCard data structure
    demoData.academics.upcomingAssignments.slice(0, 4).forEach((assignment) => {
      expect(screen.getByText(assignment.title)).toBeInTheDocument();
      expect(screen.getByText(assignment.subject || '')).toBeInTheDocument();
      expect(screen.getByText(`${assignment.days_until_due}d`)).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(`${assignment.total_marks} marks`, 'i'))
      ).toBeInTheDocument();
    });

    // Verify RecentGradesCard data structure
    demoData.academics.recentGrades.slice(0, 5).forEach((grade) => {
      expect(screen.getByText(grade.exam_name)).toBeInTheDocument();
      if (grade.subject) {
        expect(screen.getByText(grade.subject)).toBeInTheDocument();
      }
      expect(screen.getByText(`${grade.percentage.toFixed(1)}%`)).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(`${grade.marks_obtained} / ${grade.max_marks}`, 'i'))
      ).toBeInTheDocument();
    });

    // Verify gamification points structure
    const pointsData = demoData.gamification.userPoints;
    expect(screen.getByText(pointsData.total_points.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(`Level ${pointsData.level}`)).toBeInTheDocument();
    expect(screen.getByText(pointsData.current_streak.toString())).toBeInTheDocument();
    expect(screen.getByText(pointsData.longest_streak.toString())).toBeInTheDocument();

    // Verify badges structure
    demoData.gamification.userBadges.forEach((userBadge) => {
      expect(screen.getByText(userBadge.badge.name)).toBeInTheDocument();
    });
  });

  it('verifies rank is displayed in Points & Rank card', async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // The rank should be #3 based on demoDataApi.ts
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText(/Leaderboard/i)).toBeInTheDocument();
  });

  it('verifies badge rarities are correctly displayed', async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check that all badges from demo data are displayed
    const userBadges = demoData.gamification.userBadges;
    expect(userBadges.length).toBeGreaterThan(0);

    userBadges.forEach((userBadge) => {
      const badgeElement = screen.getByText(userBadge.badge.name);
      expect(badgeElement).toBeInTheDocument();

      // Verify badge has proper rarity (Epic, Legendary, Common, Rare)
      const badge = userBadge.badge;
      expect(['common', 'rare', 'epic', 'legendary']).toContain(badge.rarity.toLowerCase());
    });
  });

  it('displays assignment submission status correctly', async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check for submitted assignments
    const submittedAssignments = demoData.academics.upcomingAssignments
      .slice(0, 4)
      .filter((a) => a.is_submitted);

    submittedAssignments.forEach(() => {
      // There should be "Submitted" chips for submitted assignments
      const submittedChips = screen.getAllByText(/Submitted/i);
      expect(submittedChips.length).toBeGreaterThan(0);
    });
  });

  it('displays correct grade information in RecentGradesCard', async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Verify grades with letter grades are displayed (use getAllByText since grades can repeat)
    const gradesWithLetterGrade = demoData.academics.recentGrades
      .slice(0, 5)
      .filter((g) => g.grade);

    if (gradesWithLetterGrade.length > 0) {
      // Check that at least one grade is displayed
      const firstGrade = gradesWithLetterGrade[0].grade!;
      const gradeElements = screen.getAllByText(firstGrade);
      expect(gradeElements.length).toBeGreaterThan(0);
    }
  });

  it("verifies Today's Attendance status is displayed", async () => {
    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check for attendance status (Present/Absent/Late) - use getAllByText since "Present" appears in multiple places
    // Based on demoDataApi, todays_attendance status is 'present'
    const presentElements = screen.getAllByText(/Present/i);
    expect(presentElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Today's Attendance/i)).toBeInTheDocument();
  });
});
