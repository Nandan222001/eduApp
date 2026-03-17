export const mockAxiosResponse = <T = any>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

export const mockAxiosError = (message: string, status = 500) => ({
  response: {
    data: { message },
    status,
    statusText: 'Error',
    headers: {},
    config: {} as any,
  },
  message,
  isAxiosError: true,
});

export const createMockApiClient = () => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
  };
};

export const mockAuthApi = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  getCurrentUser: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  requestOTP: jest.fn(),
  verifyOTP: jest.fn(),
  changePassword: jest.fn(),
};

export const mockStudentApi = {
  getDashboard: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  getAssignments: jest.fn(),
  getAssignmentDetail: jest.fn(),
  submitAssignment: jest.fn(),
  getCourses: jest.fn(),
  getGrades: jest.fn(),
  getSchedule: jest.fn(),
  getNotifications: jest.fn(),
};

export const mockAssignmentsApi = {
  getAssignments: jest.fn(),
  getAssignmentDetail: jest.fn(),
  submitAssignment: jest.fn(),
  uploadFile: jest.fn(),
};

export const createMockLoginResponse = (userOverrides = {}) => ({
  user: {
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
    ...userOverrides,
  },
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'Bearer',
});

export const createMockDashboardData = () => ({
  attendance: {
    percentage: 85,
    present: 42,
    absent: 3,
    late: 2,
  },
  upcomingAssignments: [
    {
      id: 1,
      title: 'Math Homework',
      subject: 'Mathematics',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      status: 'pending' as const,
    },
  ],
  recentGrades: [
    {
      id: 1,
      subject: 'Mathematics',
      grade: 'A',
      percentage: 92,
      date: new Date().toISOString(),
    },
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

export const createMockAssignment = (overrides = {}) => ({
  id: 1,
  title: 'Test Assignment',
  description: 'Test description',
  subject: 'Mathematics',
  dueDate: new Date(Date.now() + 86400000).toISOString(),
  status: 'pending' as const,
  totalMarks: 100,
  teacherName: 'Mr. Smith',
  ...overrides,
});

export const resetApiMocks = () => {
  Object.values(mockAuthApi).forEach(fn => fn.mockReset());
  Object.values(mockStudentApi).forEach(fn => fn.mockReset());
  Object.values(mockAssignmentsApi).forEach(fn => fn.mockReset());
};
