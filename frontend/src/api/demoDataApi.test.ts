import { describe, it, expect, beforeEach } from 'vitest';
import {
  isDemoUser,
  demoStudentsApi,
  demoAssignmentsApi,
  demoSubmissionsApi,
  demoAttendanceApi,
  demoExaminationsApi,
  demoAIPredictionDashboardApi,
  demoGamificationApi,
  demoGoalsApi,
  demoAnalyticsApi,
} from './demoDataApi';
import { useAuthStore } from '@/store/useAuthStore';
import { DEMO_CREDENTIALS, demoData } from '@/data/dummyData';

describe('isDemoUser', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('should return true when user email matches demo credentials', () => {
    useAuthStore.setState({
      user: {
        id: '1001',
        email: DEMO_CREDENTIALS.email,
        firstName: 'Demo',
        lastName: 'User',
        fullName: 'Demo User',
        role: 'student',
        isActive: true,
        emailVerified: true,
        isSuperuser: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      isAuthenticated: true,
    });

    expect(isDemoUser()).toBe(true);
  });

  it('should return false when user email does not match demo credentials', () => {
    useAuthStore.setState({
      user: {
        id: '2001',
        email: 'other@example.com',
        firstName: 'Other',
        lastName: 'User',
        fullName: 'Other User',
        role: 'student',
        isActive: true,
        emailVerified: true,
        isSuperuser: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      isAuthenticated: true,
    });

    expect(isDemoUser()).toBe(false);
  });

  it('should return false when user is null', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    expect(isDemoUser()).toBe(false);
  });
});

describe('demoStudentsApi', () => {
  describe('getStudentProfile', () => {
    it('should return student profile as a Promise', async () => {
      const result = await demoStudentsApi.getStudentProfile(1001);

      expect(result).toBeDefined();
      expect(result).toEqual(demoData.student.profile);
      expect(result.id).toBe(1001);
      expect(result.first_name).toBe('Alex');
      expect(result.last_name).toBe('Johnson');
      expect(result.email).toBe(DEMO_CREDENTIALS.email);
    });

    it('should return student profile with correct types', async () => {
      const result = await demoStudentsApi.getStudentProfile(1001);

      expect(typeof result.id).toBe('number');
      expect(typeof result.first_name).toBe('string');
      expect(typeof result.last_name).toBe('string');
      expect(typeof result.email).toBe('string');
      expect(result.section).toBeDefined();
      expect(result.section?.grade).toBeDefined();
    });
  });

  describe('getStudentDashboard', () => {
    it('should return student dashboard data as a Promise', async () => {
      const result = await demoStudentsApi.getStudentDashboard(1001);

      expect(result).toBeDefined();
      expect(result.student_id).toBe(demoData.student.profile.id);
      expect(result.student_name).toContain('Alex');
      expect(result.student_name).toContain('Johnson');
    });

    it('should return dashboard with correct structure and types', async () => {
      const result = await demoStudentsApi.getStudentDashboard(1001);

      expect(typeof result.student_id).toBe('number');
      expect(typeof result.student_name).toBe('string');
      expect(result.attendance_summary).toBeDefined();
      expect(typeof result.attendance_summary.total_days).toBe('number');
      expect(typeof result.attendance_summary.present_days).toBe('number');
      expect(typeof result.attendance_summary.attendance_percentage).toBe('number');
      expect(Array.isArray(result.upcoming_assignments)).toBe(true);
      expect(Array.isArray(result.recent_grades)).toBe(true);
      expect(Array.isArray(result.badges)).toBe(true);
      expect(result.study_streak).toBeDefined();
      expect(typeof result.study_streak.current_streak).toBe('number');
      expect(result.points_and_rank).toBeDefined();
      expect(typeof result.points_and_rank.total_points).toBe('number');
    });
  });
});

describe('demoAssignmentsApi', () => {
  describe('list', () => {
    it('should return assignment list with correct structure', async () => {
      const result = await demoAssignmentsApi.list();

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.skip).toBe('number');
      expect(typeof result.limit).toBe('number');
    });

    it('should return all demo assignments', async () => {
      const result = await demoAssignmentsApi.list();

      expect(result.items.length).toBe(demoData.academics.assignments.length);
      expect(result.total).toBe(demoData.academics.assignments.length);
      expect(result.items[0]).toHaveProperty('id');
      expect(result.items[0]).toHaveProperty('title');
      expect(result.items[0]).toHaveProperty('status');
    });

    it('should handle list params', async () => {
      const result = await demoAssignmentsApi.list({ skip: 0, limit: 10 });

      expect(result).toBeDefined();
      expect(result.skip).toBe(0);
      expect(result.limit).toBe(50);
    });
  });

  describe('get', () => {
    it('should return specific assignment by id', async () => {
      const result = await demoAssignmentsApi.get(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe('Quadratic Equations Problem Set');
    });

    it('should return first assignment if id not found', async () => {
      const result = await demoAssignmentsApi.get(9999);

      expect(result).toBeDefined();
      expect(result).toEqual(demoData.academics.assignments[0]);
    });
  });

  describe('getWithRubric', () => {
    it('should return assignment with rubric criteria', async () => {
      const result = await demoAssignmentsApi.getWithRubric(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.rubric_criteria).toBeDefined();
      expect(Array.isArray(result.rubric_criteria)).toBe(true);
    });
  });

  describe('listSubmissions', () => {
    it('should return submissions for specific assignment', async () => {
      const result = await demoAssignmentsApi.listSubmissions(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(result.items.every((s) => s.assignment_id === 1)).toBe(true);
    });

    it('should return correct submission structure', async () => {
      const result = await demoAssignmentsApi.listSubmissions(1);

      expect(result.items.length).toBeGreaterThan(0);
      const submission = result.items[0];
      expect(submission).toHaveProperty('id');
      expect(submission).toHaveProperty('assignment_id');
      expect(submission).toHaveProperty('student_id');
      expect(submission).toHaveProperty('status');
    });
  });

  describe('getStatistics', () => {
    it('should return assignment statistics', async () => {
      const result = await demoAssignmentsApi.getStatistics(1);

      expect(result).toBeDefined();
      expect(typeof result.total_submissions).toBe('number');
      expect(typeof result.graded_submissions).toBe('number');
      expect(typeof result.pending_submissions).toBe('number');
      expect(typeof result.average_marks).toBe('number');
      expect(typeof result.highest_marks).toBe('number');
      expect(typeof result.lowest_marks).toBe('number');
    });
  });

  describe('getAnalytics', () => {
    it('should return assignment analytics', async () => {
      const result = await demoAssignmentsApi.getAnalytics(1);

      expect(result).toBeDefined();
      expect(result.assignment_id).toBe(1);
      expect(result.grade_distribution).toBeDefined();
      expect(Array.isArray(result.submission_timeline)).toBe(true);
      expect(Array.isArray(result.performance_by_section)).toBe(true);
    });
  });
});

describe('demoSubmissionsApi', () => {
  describe('get', () => {
    it('should return specific submission by id', async () => {
      const result = await demoSubmissionsApi.get(101);

      expect(result).toBeDefined();
      expect(result.id).toBe(101);
      expect(result.assignment_id).toBe(1);
    });

    it('should return first submission if id not found', async () => {
      const result = await demoSubmissionsApi.get(9999);

      expect(result).toBeDefined();
      expect(result).toEqual(demoData.academics.submissions[0]);
    });
  });

  describe('grade', () => {
    it('should return graded submission', async () => {
      const gradeData = {
        marks_obtained: 95,
        grade: 'A+',
        feedback: 'Excellent work!',
      };

      const result = await demoSubmissionsApi.grade(101, gradeData);

      expect(result).toBeDefined();
      expect(result.marks_obtained).toBe(95);
      expect(result.grade).toBe('A+');
      expect(result.feedback).toBe('Excellent work!');
    });
  });
});

describe('demoAttendanceApi', () => {
  describe('listAttendances', () => {
    it('should return empty attendance list as Promise', async () => {
      const result = await demoAttendanceApi.listAttendances({});

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBe(0);
      expect(typeof result.total).toBe('number');
      expect(typeof result.skip).toBe('number');
      expect(typeof result.limit).toBe('number');
    });

    it('should handle attendance list params', async () => {
      const params = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        section_id: 101,
        skip: 0,
        limit: 100,
      };

      const result = await demoAttendanceApi.listAttendances(params);

      expect(result).toBeDefined();
      expect(result.skip).toBe(0);
      expect(result.limit).toBe(100);
    });
  });

  describe('getStudentDetailedReport', () => {
    it('should return student attendance detailed report', async () => {
      const result = await demoAttendanceApi.getStudentDetailedReport(
        1001,
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toBeDefined();
      expect(result.student_id).toBe(1001);
      expect(result.student_name).toContain('Alex');
      expect(Array.isArray(result.attendances)).toBe(true);
      expect(typeof result.total_days).toBe('number');
      expect(typeof result.present_days).toBe('number');
      expect(typeof result.absent_days).toBe('number');
      expect(typeof result.attendance_percentage).toBe('number');
    });

    it('should return attendance records with correct structure', async () => {
      const result = await demoAttendanceApi.getStudentDetailedReport(
        1001,
        '2024-01-01',
        '2024-01-31'
      );

      expect(result.attendances.length).toBeGreaterThan(0);
      const attendance = result.attendances[0];
      expect(attendance).toHaveProperty('date');
      expect(attendance).toHaveProperty('status');
    });
  });

  describe('getSectionReport', () => {
    it('should return section attendance report', async () => {
      const result = await demoAttendanceApi.getSectionReport(101, '2024-01-01', '2024-01-31');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('student_id');
      expect(result[0]).toHaveProperty('student_name');
      expect(result[0]).toHaveProperty('attendance_percentage');
    });
  });

  describe('getDefaulters', () => {
    it('should return empty defaulters list', async () => {
      const result = await demoAttendanceApi.getDefaulters('2024-01-01', '2024-01-31', 75.0);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});

describe('demoExaminationsApi', () => {
  describe('listExams', () => {
    it('should return empty exams list as Promise', async () => {
      const result = await demoExaminationsApi.listExams({ skip: 0, limit: 50 });

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBe(0);
      expect(typeof result.total).toBe('number');
    });
  });

  describe('getStudentResult', () => {
    it('should return exam result for student', async () => {
      const result = await demoExaminationsApi.getStudentResult(1, 1001, 1);

      expect(result).toBeDefined();
      expect(result.exam_id).toBe(1);
      expect(typeof result.total_marks_obtained).toBe('number');
      expect(typeof result.percentage).toBe('number');
      expect(result.grade).toBeDefined();
      expect(Array.isArray(result.subject_results)).toBe(true);
    });

    it('should return exam result with correct structure', async () => {
      const result = await demoExaminationsApi.getStudentResult(1, 1001, 1);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('student_name');
      expect(result).toHaveProperty('section_rank');
      expect(result.subject_results?.length).toBeGreaterThan(0);
      const subject = result.subject_results![0];
      expect(subject).toHaveProperty('subject_name');
      expect(subject).toHaveProperty('total_marks');
      expect(subject).toHaveProperty('max_marks');
    });
  });

  describe('listResults', () => {
    it('should return exam results list', async () => {
      const result = await demoExaminationsApi.listResults(1, 1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('exam_id');
      expect(result[0]).toHaveProperty('student_id');
    });
  });
});

describe('demoAIPredictionDashboardApi', () => {
  describe('getDashboard', () => {
    it('should return AI prediction dashboard data', async () => {
      const result = await demoAIPredictionDashboardApi.getDashboard('CBSE', 10, 1);

      expect(result).toBeDefined();
      expect(result.board).toBe('CBSE');
      expect(result.grade_id).toBe(10);
      expect(result.subject_id).toBe(1);
      expect(result.subject_name).toBeDefined();
      expect(Array.isArray(result.topic_rankings)).toBe(true);
      expect(result.predicted_blueprint).toBeDefined();
      expect(Array.isArray(result.marks_distribution)).toBe(true);
      expect(Array.isArray(result.focus_areas)).toBe(true);
      expect(Array.isArray(result.study_time_allocation)).toBe(true);
    });

    it('should return dashboard with correct data types', async () => {
      const result = await demoAIPredictionDashboardApi.getDashboard('CBSE', 10, 1);

      expect(typeof result.generated_at).toBe('string');
      expect(result.topic_rankings.length).toBeGreaterThan(0);
      expect(result.topic_rankings[0]).toHaveProperty('topic_name');
      expect(result.topic_rankings[0]).toHaveProperty('probability_score');
      expect(result.marks_distribution[0]).toHaveProperty('category');
      expect(result.marks_distribution[0]).toHaveProperty('marks');
    });
  });

  describe('generateStudyPlan', () => {
    it('should return study plan', async () => {
      const request = {
        exam_date: '2024-12-31',
        available_hours_per_day: 4,
      };

      const result = await demoAIPredictionDashboardApi.generateStudyPlan(request);

      expect(result).toBeDefined();
      expect(result.exam_date).toBe('2024-12-31');
      expect(typeof result.days_until_exam).toBe('number');
      expect(typeof result.total_study_hours).toBe('number');
      expect(Array.isArray(result.weeks)).toBe(true);
      expect(typeof result.completion_percentage).toBe('number');
    });
  });

  describe('simulateWhatIfScenario', () => {
    it('should return what-if scenario simulation', async () => {
      const request = { scenario: 'test' };
      const result = await demoAIPredictionDashboardApi.simulateWhatIfScenario(request);

      expect(result).toBeDefined();
      expect(typeof result.current_predicted_score).toBe('number');
      expect(typeof result.projected_score).toBe('number');
      expect(typeof result.score_improvement).toBe('number');
      expect(result.confidence_level).toBeDefined();
      expect(Array.isArray(result.prediction_changes)).toBe(true);
      expect(Array.isArray(result.recommended_adjustments)).toBe(true);
    });
  });

  describe('activateCrashCourseMode', () => {
    it('should return crash course mode data', async () => {
      const result = await demoAIPredictionDashboardApi.activateCrashCourseMode('CBSE', 10, 1, 30);

      expect(result).toBeDefined();
      expect(result.days_until_exam).toBe(30);
      expect(result.mode_activated).toBe(true);
      expect(Array.isArray(result.priority_topics)).toBe(true);
      expect(Array.isArray(result.daily_schedule)).toBe(true);
      expect(typeof result.estimated_coverage).toBe('number');
      expect(result.expected_score_range).toBeDefined();
      expect(typeof result.expected_score_range.min).toBe('number');
      expect(typeof result.expected_score_range.max).toBe('number');
    });
  });
});

describe('demoGamificationApi', () => {
  describe('getUserPoints', () => {
    it('should return user points', async () => {
      const result = await demoGamificationApi.getUserPoints(1001, 1);

      expect(result).toBeDefined();
      expect(result).toEqual(demoData.gamification.userPoints);
      expect(typeof result.total_points).toBe('number');
      expect(typeof result.level).toBe('number');
      expect(typeof result.current_streak).toBe('number');
    });
  });

  describe('getPointHistory', () => {
    it('should return point history', async () => {
      const result = await demoGamificationApi.getPointHistory(1001, 1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('event_type');
      expect(result[0]).toHaveProperty('points');
      expect(result[0]).toHaveProperty('description');
    });

    it('should respect limit parameter', async () => {
      const result = await demoGamificationApi.getPointHistory(1001, 1, 2);

      expect(result).toBeDefined();
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getUserBadges', () => {
    it('should return user badges', async () => {
      const result = await demoGamificationApi.getUserBadges(1001, 1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(demoData.gamification.userBadges.length);
      expect(result[0]).toHaveProperty('badge');
      expect(result[0]).toHaveProperty('earned_at');
      expect(result[0]).toHaveProperty('points_awarded');
    });
  });

  describe('getBadges', () => {
    it('should return all badges', async () => {
      const result = await demoGamificationApi.getBadges(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(demoData.gamification.badges.length);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('badge_type');
      expect(result[0]).toHaveProperty('rarity');
    });
  });

  describe('getUserAchievements', () => {
    it('should return empty achievements list', async () => {
      const result = await demoGamificationApi.getUserAchievements(1001, 1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getAchievements', () => {
    it('should return empty achievements list', async () => {
      const result = await demoGamificationApi.getAchievements(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getLeaderboards', () => {
    it('should return empty leaderboards list', async () => {
      const result = await demoGamificationApi.getLeaderboards(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getLeaderboardWithEntries', () => {
    it('should return leaderboard with entries', async () => {
      const result = await demoGamificationApi.getLeaderboardWithEntries(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('Monthly Points Leaderboard');
      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.entries.length).toBe(demoData.gamification.leaderboard.length);
      expect(result.entries[0]).toHaveProperty('rank');
      expect(result.entries[0]).toHaveProperty('score');
    });
  });

  describe('getDynamicLeaderboard', () => {
    it('should return dynamic leaderboard entries', async () => {
      const result = await demoGamificationApi.getDynamicLeaderboard(1, {});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should respect limit parameter', async () => {
      const result = await demoGamificationApi.getDynamicLeaderboard(1, {}, undefined, 3);

      expect(result).toBeDefined();
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getUserStreaks', () => {
    it('should return user streaks', async () => {
      const result = await demoGamificationApi.getUserStreaks(1001, 1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('streak_type');
      expect(result[0]).toHaveProperty('current_streak');
      expect(result[0]).toHaveProperty('longest_streak');
    });
  });

  describe('recordDailyLogin', () => {
    it('should return daily login record', async () => {
      const result = await demoGamificationApi.recordDailyLogin(1001, 1);

      expect(result).toBeDefined();
      expect(result.message).toBe('Daily login recorded');
      expect(typeof result.streak).toBe('number');
      expect(typeof result.points_earned).toBe('number');
    });
  });

  describe('getUserStats', () => {
    it('should return user stats', async () => {
      const result = await demoGamificationApi.getUserStats(1001, 1);

      expect(result).toBeDefined();
      expect(typeof result.total_points).toBe('number');
      expect(typeof result.level).toBe('number');
      expect(typeof result.badges_earned).toBe('number');
      expect(typeof result.rank).toBe('number');
    });
  });

  describe('getUserShowcase', () => {
    it('should return user showcase', async () => {
      const result = await demoGamificationApi.getUserShowcase(1001, 1);

      expect(result).toBeDefined();
      expect(result.user_id).toBe(1001);
      expect(Array.isArray(result.featured_badges)).toBe(true);
      expect(result.featured_badges.length).toBeLessThanOrEqual(3);
      expect(result.stats_summary).toBeDefined();
    });
  });

  describe('getRewards', () => {
    it('should return empty rewards list', async () => {
      const result = await demoGamificationApi.getRewards(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getUserRedemptions', () => {
    it('should return empty redemptions list', async () => {
      const result = await demoGamificationApi.getUserRedemptions(1001, 1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('redeemReward', () => {
    it('should return redemption record', async () => {
      const result = await demoGamificationApi.redeemReward(1001, 10, 1);

      expect(result).toBeDefined();
      expect(result.user_id).toBe(1001);
      expect(result.reward_id).toBe(10);
      expect(typeof result.points_spent).toBe('number');
      expect(result.status).toBe('pending');
    });
  });
});

describe('demoGoalsApi', () => {
  describe('getGoals', () => {
    it('should return all goals', async () => {
      const result = await demoGoalsApi.getGoals();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(demoData.goals.length);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('status');
    });
  });

  describe('getGoal', () => {
    it('should return specific goal by id', async () => {
      const result = await demoGoalsApi.getGoal('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.title).toBe('Improve Mathematics Grade to A+');
    });

    it('should return first goal if id not found', async () => {
      const result = await demoGoalsApi.getGoal('9999');

      expect(result).toBeDefined();
      expect(result).toEqual(demoData.goals[0]);
    });
  });

  describe('createGoal', () => {
    it('should create and return new goal', async () => {
      const newGoalData = {
        title: 'New Goal',
        description: 'Test description',
        type: 'performance',
        status: 'pending',
      };

      const result = await demoGoalsApi.createGoal(newGoalData);

      expect(result).toBeDefined();
      expect(result.title).toBe('New Goal');
      expect(result.progress).toBe(0);
      expect(Array.isArray(result.milestones)).toBe(true);
      expect(result.createdAt).toBeDefined();
    });
  });

  describe('updateGoal', () => {
    it('should update and return goal', async () => {
      const updates = { title: 'Updated Title', progress: 75 };
      const result = await demoGoalsApi.updateGoal('1', updates);

      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Title');
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('deleteGoal', () => {
    it('should resolve successfully', async () => {
      await expect(demoGoalsApi.deleteGoal('1')).resolves.toBeUndefined();
    });
  });

  describe('updateMilestoneProgress', () => {
    it('should return updated goal', async () => {
      const result = await demoGoalsApi.updateMilestoneProgress('1', 'm1', 100);

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });
  });

  describe('completeMilestone', () => {
    it('should return updated goal', async () => {
      const result = await demoGoalsApi.completeMilestone('1', 'm1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });
  });

  describe('getAnalytics', () => {
    it('should return goals analytics', async () => {
      const result = await demoGoalsApi.getAnalytics();

      expect(result).toBeDefined();
      expect(typeof result.totalGoals).toBe('number');
      expect(typeof result.completedGoals).toBe('number');
      expect(typeof result.averageProgress).toBe('number');
      expect(result.goalsByType).toBeDefined();
      expect(result.goalsByStatus).toBeDefined();
      expect(typeof result.completionRate).toBe('number');
    });
  });
});

describe('demoAnalyticsApi', () => {
  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const result = await demoAnalyticsApi.getDashboardStats();

      expect(result).toBeDefined();
      expect(typeof result.total_users).toBe('number');
      expect(typeof result.active_users_today).toBe('number');
      expect(typeof result.total_sessions).toBe('number');
      expect(typeof result.avg_session_duration).toBe('number');
    });
  });

  describe('getFeatureAdoption', () => {
    it('should return empty feature adoption list', async () => {
      const result = await demoAnalyticsApi.getFeatureAdoption();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getUserFlow', () => {
    it('should return user flow data', async () => {
      const result = await demoAnalyticsApi.getUserFlow();

      expect(result).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(typeof result.total_sessions).toBe('number');
    });
  });

  describe('getRetentionCohorts', () => {
    it('should return empty retention cohorts', async () => {
      const result = await demoAnalyticsApi.getRetentionCohorts();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getTopEvents', () => {
    it('should return empty top events list', async () => {
      const result = await demoAnalyticsApi.getTopEvents();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getPerformanceStats', () => {
    it('should return empty performance stats', async () => {
      const result = await demoAnalyticsApi.getPerformanceStats();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getClassPerformanceAnalytics', () => {
    it('should return class performance analytics', async () => {
      const result = await demoAnalyticsApi.getClassPerformanceAnalytics(101);

      expect(result).toBeDefined();
      expect(result.class_id).toBe(101);
      expect(typeof result.total_students).toBe('number');
      expect(typeof result.average_performance).toBe('number');
      expect(Array.isArray(result.subject_averages)).toBe(true);
    });
  });

  describe('getInstitutionAnalytics', () => {
    it('should return institution analytics', async () => {
      const result = await demoAnalyticsApi.getInstitutionAnalytics(1);

      expect(result).toBeDefined();
      expect(result.institution_id).toBe(1);
      expect(typeof result.total_students).toBe('number');
      expect(typeof result.total_teachers).toBe('number');
      expect(typeof result.overall_performance).toBe('number');
    });
  });

  describe('getStudentPerformanceAnalytics', () => {
    it('should return student performance analytics', async () => {
      const result = await demoAnalyticsApi.getStudentPerformanceAnalytics(1001);

      expect(result).toBeDefined();
      expect(result.student_id).toBe(1001);
      expect(result.student_name).toBeDefined();
      expect(result.grade).toBeDefined();
      expect(result.section).toBeDefined();
      expect(Array.isArray(result.subject_trends)).toBe(true);
      expect(Array.isArray(result.attendance_calendar)).toBe(true);
      expect(result.overall_performance).toBeDefined();
      expect(typeof result.overall_performance.averageScore).toBe('number');
    });
  });

  describe('generateCustomReport', () => {
    it('should return custom report', async () => {
      const filters = { date_range: '2024-01-01 to 2024-01-31' };
      const result = await demoAnalyticsApi.generateCustomReport(filters);

      expect(result).toBeDefined();
      expect(result.report_id).toBe('1');
      expect(result.title).toBe('Custom Report');
      expect(result.generated_at).toBeDefined();
      expect(result.filters).toEqual(filters);
    });
  });

  describe('exportReportToPDF', () => {
    it('should return PDF Blob', async () => {
      const result = await demoAnalyticsApi.exportReportToPDF({});

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });
  });

  describe('exportReportToExcel', () => {
    it('should return Excel Blob', async () => {
      const result = await demoAnalyticsApi.exportReportToExcel({});

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/vnd.ms-excel');
    });
  });
});
