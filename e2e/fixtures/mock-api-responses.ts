export const mockApiResponses = {
  login: {
    success: {
      user: {
        id: 'user-123',
        email: 'student@test.com',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student',
        emailVerified: true,
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    },
    error: {
      detail: 'Invalid credentials',
    },
  },
  assignments: {
    list: [
      {
        id: 'assignment-1',
        title: 'Algebra Homework',
        description: 'Complete exercises 1-10 from chapter 5',
        subject: 'Mathematics',
        dueDate: '2024-12-31T23:59:59Z',
        status: 'pending',
        maxMarks: 100,
      },
      {
        id: 'assignment-2',
        title: 'Physics Lab Report',
        description: 'Submit lab report on pendulum experiment',
        subject: 'Physics',
        dueDate: '2024-12-28T23:59:59Z',
        status: 'submitted',
        maxMarks: 50,
      },
    ],
  },
  attendance: {
    summary: {
      totalDays: 100,
      presentDays: 85,
      absentDays: 10,
      lateDays: 5,
      percentage: 85,
    },
  },
  predictions: {
    subjects: [
      {
        subject: 'Mathematics',
        currentScore: 75,
        predictedScore: 82,
        confidence: 85,
      },
      {
        subject: 'Physics',
        currentScore: 82,
        predictedScore: 88,
        confidence: 90,
      },
    ],
  },
  subscriptions: {
    current: {
      id: 'sub-123',
      planName: 'Basic Plan',
      status: 'active',
      validUntil: '2025-12-31T23:59:59Z',
      features: ['Up to 100 students', 'Basic analytics', 'Email support'],
    },
    plans: [
      {
        id: 'plan-basic',
        name: 'Basic Plan',
        price: 999,
        features: ['Up to 100 students', 'Basic analytics', 'Email support'],
      },
      {
        id: 'plan-premium',
        name: 'Premium Plan',
        price: 2999,
        features: [
          'Unlimited students',
          'Advanced analytics',
          'Priority support',
          'AI predictions',
        ],
      },
    ],
  },
  notifications: {
    list: [
      {
        id: 'notif-1',
        title: 'Assignment Graded',
        message: 'Your assignment has been graded',
        type: 'info',
        read: false,
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 'notif-2',
        title: 'New Assignment',
        message: 'A new assignment has been posted',
        type: 'info',
        read: true,
        createdAt: '2024-01-14T09:00:00Z',
      },
    ],
  },
};
