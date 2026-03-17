// Test data factories for consistent test data across all tests

export const createTestUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'student' as const,
  roles: ['student' as const],
  profile_picture: null,
  phone_number: null,
  date_of_birth: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createTestAssignment = (overrides = {}) => ({
  id: 1,
  title: 'Test Assignment',
  description: 'Test description',
  subject: 'Mathematics',
  dueDate: new Date(Date.now() + 86400000).toISOString(),
  status: 'pending' as const,
  totalMarks: 100,
  teacherName: 'Mr. Smith',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createTestNotification = (overrides = {}) => ({
  id: '1',
  title: 'Test Notification',
  message: 'Test message',
  type: 'info' as const,
  read: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createTestCourse = (overrides = {}) => ({
  id: 1,
  name: 'Mathematics',
  code: 'MATH101',
  teacher: 'Mr. Smith',
  schedule: 'Mon, Wed, Fri 10:00 AM',
  ...overrides,
});

export const createTestGrade = (overrides = {}) => ({
  id: 1,
  subject: 'Mathematics',
  grade: 'A',
  percentage: 92,
  date: new Date().toISOString(),
  ...overrides,
});

export const createTestDashboardData = () => ({
  attendance: {
    percentage: 85,
    present: 42,
    absent: 3,
    late: 2,
  },
  upcomingAssignments: [
    createTestAssignment({ id: 1, title: 'Math Homework' }),
    createTestAssignment({ id: 2, title: 'Science Project', subject: 'Science' }),
  ],
  recentGrades: [
    createTestGrade({ id: 1, subject: 'Mathematics', grade: 'A' }),
    createTestGrade({ id: 2, subject: 'Science', grade: 'B+' }),
  ],
  aiPredictions: {
    predictedGrade: 'A',
    confidence: 0.85,
    improvementAreas: ['Algebra', 'Geometry'],
  },
  gamification: {
    totalPoints: 1250,
    rank: 5,
    activeGoalsCount: 3,
    streak: {
      currentStreak: 7,
      longestStreak: 14,
    },
  },
  weakAreas: [
    {
      subject: 'Mathematics',
      topic: 'Algebra',
      accuracy: 65,
    },
  ],
});

export const waitForAsync = (timeout = 0) => new Promise(resolve => setTimeout(resolve, timeout));
